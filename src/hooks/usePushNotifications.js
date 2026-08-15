// =====================================================================
// usePushNotifications.js
// ---------------------------------------------------------------------
// Hook que orquesta TODO el ciclo de vida de las push notifications
// en la app EdukControl:
//
//   1. Mount → crea el canal Android → pide permisos → obtiene el
//      ExpoPushToken (= FCM en Android, APNS en iOS) → lo registra
//      contra el backend.
//   2. Mientras esté montado → escucha onTokenRefresh y re-registra
//      automáticamente cuando el SO rota el token (passo raro: app
//      reinstalada, restore desde backup, etc.).
//   3. Unmount → limpia el listener de rotación. NO desregistra
//      del backend: eso lo hace explícitamente AuthContext.logout()
//      antes de limpiar el state, para que el backend deje de
//      enviar pushes AL MOMENTO del logout (no async después).
//
// =====================================================================
// ¿DÓNDE SE MONTA?
// ---------------------------------------------------------------------
// En app/(guardian)/_layout.jsx y app/(teacher)/_layout.jsx, SOLO
// cuando hay user logueado. El hook recibe `enabled` como parámetro
// para que el componente padre controle cuándo activarlo. Esto evita:
//   - Pedir permisos a un usuario NO logueado.
//   - Registrar el token contra un endpoint que requiere auth
//     (el JWT se setea en useAuth().login, no antes).
// =====================================================================

// React hooks.
import { useEffect, useState } from 'react';

// Reutilizamos los helpers de notificationService: ya tienen el
// setNotificationHandler global, el canal de Android, los permisos
// y el getExpoPushToken. No duplicamos lógica.
import {
  createAndroidChannel,
  requestNotificationPermissions,
  getExpoPushToken,
} from '../services/notificationService';

// Servicio específico del endpoint del usuario (FcmToken).
// Lo creamos en pushNotificationService.js (no en notificationService
// porque ese ya tiene un registerPushTokenWithBackend genérico con
// un endpoint distinto).
import { registerFcmToken } from '../services/pushNotificationService';

// expo-notifications: addPushTokenListener es la API que detecta
// cuando el SO rota el push token. Devuelve un subscription con
// método .remove() (no removeNotificationSubscription, que era
// el nombre viejo y está deprecado en SDK 57 — ver AGENTS.md
// trap 2).
// Usamos require() dentro de un try/catch (no import estático) porque
// en Expo Go/Android SDK 53+ cargar este módulo lanza un error síncrono
// que, con import estático, no se puede atrapar y tumba toda la app
// (ver notificationService.js y AGENTS.md trap 5).
let Notifications = null;
try {
  // eslint-disable-next-line global-require
  Notifications = require('expo-notifications');
} catch (err) {
  console.warn(
    '[usePushNotifications] expo-notifications no disponible '
      + '(esperado en Expo Go/Android SDK 53+; usa un development build):',
    err?.message,
  );
}

// expo-device: isDevice devuelve false en simuladores. En simulador
// el push token es fake y no sirve para nada real, así que salimos
// temprano con status='unsupported' para no loguear errores
// confusos al usuario.
import * as Device from 'expo-device';

/**
 * Hook principal. Devuelve:
 *   - expoPushToken: string | null — el token actual (útil para
 *     debugging o para mostrarlo en una pantalla de "estado de
 *     notificaciones" en el futuro).
 *   - status: estado del setup. Uno de:
 *       'idle'         — todavía no se intentó (enabled=false).
 *       'requesting'   — pidiendo permisos / creando canal.
 *       'registering'  — token obtenido, registrándolo en backend.
 *       'registered'   — todo OK, push notifications activas.
 *       'denied'       — usuario denegó permisos.
 *       'unsupported'  — simulador o falta projectId.
 *       'error'        — error inesperado (red, server, etc.).
 *   - error: Error | null — el último error si status='error'.
 *
 * Parámetros:
 *   - enabled: si false, el hook es no-op. Útil para montar
 *     condicionalmente (solo cuando hay user logueado).
 */
export const usePushNotifications = (enabled = true) => {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    // enabled = false → no-op. Limpiamos el state a idle para
    // que la UI refleje que el hook no está haciendo nada.
    if (!enabled) {
      setStatus('idle');
      setExpoPushToken(null);
      return;
    }

    // Flag local: si el effect se cancela (deps cambian o unmount)
    // antes de que el async setup termine, evitamos updates de state
    // y evitamos registrar un token en el backend que ya no se
    // va a usar. Patrón estándar de React para race conditions.
    let cancelled = false;
    // Ref al subscription del token listener, para cleanup.
    let tokenSubscription = null;

    const setup = async () => {
      try {
        setStatus('requesting');

        // Si expo-notifications no cargó (Expo Go/Android SDK 53+),
        // no seguimos: marcamos 'unsupported' y salimos sin llamar a
        // ninguna función de la SDK.
        if (!Notifications) {
          if (!cancelled) setStatus('unsupported');
          return;
        }

        // ----------------------------------------------------------------
        // PASO 1: canal de Android.
        // ----------------------------------------------------------------
        // AGENTS.md trap 4: en Android 13+ el canal DEBE existir
        // ANTES de requestPermissionsAsync, si no el prompt del
        // sistema no aparece y nunca obtendremos un push token.
        // createAndroidChannel ya es no-op en iOS.
        await createAndroidChannel();

        // ----------------------------------------------------------------
        // PASO 2: verificar que estamos en un device real.
        // ----------------------------------------------------------------
        // En simulador/emulador, getExpoPushTokenAsync devuelve
        // un token fake que NO sirve para push reales. Salimos
        // con status 'unsupported' para que la UI (si la hubiera)
        // pueda mostrar "no disponible en simulador" en vez de
        // un mensaje confuso de error.
        if (!Device.isDevice) {
          console.warn(
            '[push] Not running on a physical device — push notifications will not work',
          );
          if (!cancelled) setStatus('unsupported');
          return;
        }

        // ----------------------------------------------------------------
        // PASO 3: pedir permisos al usuario.
        // ----------------------------------------------------------------
        // requestNotificationPermissions:
        //   - Crea el canal en Android (ya lo hicimos arriba, pero
        //     este helper también lo hace internamente, redundante
        //     pero harmless).
        //   - Si ya hay permisos (granted/denied), respeta.
        //   - Si nunca preguntó, muestra el prompt del SO.
        //   - Devuelve el status final: 'granted' | 'denied' | 'undetermined'.
        const permissionStatus = await requestNotificationPermissions();
        if (cancelled) return;

        if (permissionStatus !== 'granted') {
          // Usuario denegó (o no respondió). No insistimos — el
          // usuario puede cambiar la decisión desde Settings.
          setStatus('denied');
          return;
        }

        // ----------------------------------------------------------------
        // PASO 4: obtener el ExpoPushToken.
        // ----------------------------------------------------------------
        // AGENTS.md trap 3: getExpoPushTokenAsync requiere projectId.
        // Si el app.json no tiene extra.eas.projectId, la llamada
        // falla con un error descriptivo. El helper getExpoPushToken
        // de notificationService valida esto y lanza un Error claro
        // si falta.
        //
        // AGENTS.md trap 5: en Expo SDK 53+, push notifications NO
        // funcionan en Expo Go en Android. Para probar push real
        // hace falta `npx expo run:android` o un dev build.
        let token;
        try {
          token = await getExpoPushToken();
        } catch (err) {
          console.error('[push] Error getting ExpoPushToken:', err);
          if (!cancelled) {
            setError(err);
            setStatus('error');
          }
          return;
        }

        if (cancelled || !token) return;

        // Token obtenido. Actualizamos state y procedemos a
        // registrarlo en el backend.
        setExpoPushToken(token);
        setStatus('registering');

        // ----------------------------------------------------------------
        // PASO 5: registrar el token contra el backend.
        // ----------------------------------------------------------------
        // registerFcmToken (de pushNotificationService.js) NO
        // lanza en error — devuelve { success, reason }. Si falla
        // (red, 5xx), el hook queda en status 'error' y el listener
        // de rotación intentará re-registrar más tarde si el token
        // cambia.
        const result = await registerFcmToken(token);
        if (cancelled) return;

        if (result.success) {
          setStatus('registered');
        } else {
          // Mantenemos el token en state (puede que un próximo
          // reintento funcione) pero marcamos status='error' para
          // que la UI pueda mostrar feedback.
          setError(new Error(`registerFcmToken failed: ${result.reason}`));
          setStatus('error');
        }

        if (cancelled) return;

        // ----------------------------------------------------------------
        // PASO 6: listener de rotación de token.
        // ----------------------------------------------------------------
        // addPushTokenListener se dispara cuando el SO regenera
        // el push token (caso raro: reinstall de la app, restore
        // desde backup, o cuando Google decide rotarlo por seguridad).
        // El callback recibe { data: 'ExpoPushToken[...]', type: 'expo' }.
        //
        // AGENTS.md trap 2: el método para limpiar el listener
        // es .remove(), NO removeNotificationSubscription.
        tokenSubscription = Notifications.addPushTokenListener(
          async (newTokenData) => {
            const newToken = newTokenData.data;
            console.log('[push] Token rotated, re-registering with backend');
            setExpoPushToken(newToken);
            // Re-registramos con el backend. Si falla, el próximo
            // reintento de rotación lo manejará. registerFcmToken
            // también actualiza el currentToken interno, así que
            // el logout subsecuente desregistrará el token correcto.
            await registerFcmToken(newToken);
          },
        );
      } catch (err) {
        // Catch-all para errores no anticipados (ej: la SDK
        // crashea, error de red al pedir permisos, etc.).
        console.error('[push] Unexpected error setting up push:', err);
        if (!cancelled) {
          setError(err);
          setStatus('error');
        }
      }
    };

    setup();

    // Cleanup del effect: se ejecuta cuando las deps cambian
    // (enabled) o cuando el componente se desmonta.
    return () => {
      cancelled = true;
      if (tokenSubscription) {
        // .remove() (no removeNotificationSubscription).
        tokenSubscription.remove();
        tokenSubscription = null;
      }
    };
  }, [enabled]);

  // El hook NO expone una función de "unregister" porque esa
  // responsabilidad la tiene el AuthContext.logout() (que llama a
  // unregisterFcmToken() del service directamente). Esto mantiene
  // el hook enfocado en su responsabilidad: setup + token rotation.
  return { expoPushToken, status, error };
};
