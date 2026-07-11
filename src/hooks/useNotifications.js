// =====================================================================
// useNotifications.js
// ---------------------------------------------------------------------
// Hook personalizado que orquesta todo el ciclo de vida de las
// notificaciones dentro de la app. Se apoya en notificationService.js
// (lógica de negocio) y le añade:
//   1) Estado de React (token, permiso, última notificación) memoizado.
//   2) Suscripción y limpieza de listeners (foreground + response).
//   3) Función "initialize" que se invoca al montar y se puede
//      re-ejecutar tras un login exitoso para registrar el token.
//   4) Helpers de scheduling para que las pantallas no importen
//      expo-notifications directamente.
// Regla de oro: ninguna pantalla debería importar expo-notifications
// ni el service directo; todo pasa por este hook.
// =====================================================================

// Importamos useState, useEffect, useCallback y useRef de React.
// useState: estado del token, permiso y última notificación.
// useEffect: configurar listeners al montar y limpiar al desmontar.
// useCallback: memoizar funciones para evitar renders innecesarios.
// useRef: guardar el id del último response para detectar cambios.
import { useState, useEffect, useCallback, useRef } from 'react';

// Importamos el módulo de notificaciones de Expo. Lo usamos aquí
// solo para añadir listeners; toda la lógica de negocio está en
// el service para mantener responsabilidades separadas.
import * as Notifications from 'expo-notifications';

// Importamos la instancia de axios para enviar el push token al
// backend del colegio una vez lo obtengamos. Usar la misma
// instancia centralizada mantiene los interceptores activos.
import api from '../services/api';

// Importamos los helpers desde el service. Cada función tiene una
// responsabilidad clara; el hook las orquesta en un flujo de UI.
import {
  requestNotificationPermissions,
  getExpoPushToken,
  registerPushTokenWithBackend,
  scheduleLocalNotification,
  cancelAllScheduledNotifications,
} from '../services/notificationService';

// Definimos y exportamos el hook. Recibe un objeto con opciones:
//   - userId: id del usuario logueado (opcional). Si está presente,
//     el hook intentará registrar el push token con el backend
//     automáticamente cuando cambie.
//   - autoInitialize: si es true (por defecto), pide permisos y
//     obtiene el token al montar el hook. Si es false, hay que
//     llamar manualmente a "initialize()".
export const useNotifications = ({
  userId = null,
  autoInitialize = true,
} = {}) => {
  // Estado: token Expo push actual. null mientras no se ha obtenido
  // o si el usuario denegó los permisos.
  const [expoPushToken, setExpoPushToken] = useState(null);

  // Estado: estado de los permisos ('granted' | 'denied' | 'undetermined' | null).
  // null indica que aún no se ha consultado (loading inicial).
  const [permissionStatus, setPermissionStatus] = useState(null);

  // Estado: última notificación recibida mientras la app está en
  // foreground. Útil para mostrar banners/toasts internos.
  const [lastNotification, setLastNotification] = useState(null);

  // Estado: indica si se está realizando una operación de
  // inicialización o registro (para mostrar spinners en UI).
  const [isInitializing, setIsInitializing] = useState(false);

  // Ref: guarda la última response recibida. Nos permite detectar
  // si el usuario interactuó con una notificación sin causar
  // re-renders por usar useState.
  const lastResponseRef = useRef(null);

  // -----------------------------------------------------------------
  // Función interna: envía el token al backend del colegio.
  // La separamos para poder llamarla desde varios lugares (init,
  // reintentos, login posterior) sin duplicar lógica.
  // -----------------------------------------------------------------
  const sendTokenToBackend = useCallback(async (token, uid) => {
    // Si no hay token o no hay userId, no hacemos nada. Esto puede
    // pasar si el hook se monta ANTES del login; en ese caso, la
    // pantalla de login lo reintentará al completar el login.
    if (!token || !uid) return false;

    try {
      // Llamamos al helper del service. Le pasamos "api" (cliente
      // HTTP) para no acoplar el service a una instancia concreta.
      await registerPushTokenWithBackend(api, uid, token);
      // Si todo va bien, devolvemos true para que el caller lo sepa.
      return true;
    } catch (error) {
      // Si el backend falla (red, 500, etc.) lo logueamos pero NO
      // lanzamos el error: las notificaciones no son críticas para
      // el funcionamiento de la app y no queremos romper la UX.
      console.warn('[useNotifications] No se pudo registrar el push token:', error?.message);
      return false;
    }
  }, []); // Sin dependencias: la función nunca cambia.

  // -----------------------------------------------------------------
  // Función pública: initialize()
  // -----------------------------------------------------------------
  // Orquesta TODO el flujo de inicialización:
  //   1) Pedir permisos al usuario.
  //   2) Si los concede, obtener el Expo push token.
  //   3) Si hay userId, enviar el token al backend.
  // Se memoiza con useCallback para que las pantallas que la
  // consuman no se re-rendericen innecesariamente.
  // -----------------------------------------------------------------
  const initialize = useCallback(async (uid = userId) => {
    // Activamos el flag de loading para que la UI pueda mostrar
    // un spinner mientras se completa el flujo.
    setIsInitializing(true);

    try {
      // Paso 1: pedir permisos. La función del service maneja
      // automáticamente Android (crea canal) e iOS (prompt del SO).
      const status = await requestNotificationPermissions();

      // Guardamos el estado de permisos en el state para que la UI
      // pueda mostrar mensajes contextuales ("Activa las notifi-
      // caciones en Ajustes" si fue denegado, por ejemplo).
      setPermissionStatus(status);

      // Si el usuario NO concedió permisos, salimos temprano.
      // No tiene sentido pedir el token si no podrá recibir pushes.
      if (status !== 'granted') {
        return { success: false, reason: 'permission_denied' };
      }

      // Paso 2: obtener el Expo push token. Esta llamada hace un
      // request al servicio de Expo para registrar el dispositivo.
      const token = await getExpoPushToken();

      // Si llegamos aquí sin token, salimos (no debería pasar si
      // status === 'granted', pero validamos por seguridad).
      if (!token) {
        return { success: false, reason: 'no_token' };
      }

      // Guardamos el token en el state para que pueda ser leído
      // por cualquier consumidor del hook.
      setExpoPushToken(token);

      // Paso 3: enviar el token al backend si tenemos userId.
      // Hacemos "await" para que la promesa devuelva éxito solo
      // si el registro remoto fue correcto (la UI puede reintentar).
      const registered = await sendTokenToBackend(token, uid);

      // Devolvemos un objeto con el resultado para que la pantalla
      // que llamó a initialize() sepa cómo proceder.
      return { success: registered, token };
    } catch (error) {
      // Si algo explota (falta projectId, error de red, etc.) lo
      // logueamos y devolvemos un objeto de fallo descriptivo.
      console.error('[useNotifications] Error en initialize():', error);
      return { success: false, reason: 'exception', error };
    } finally {
      // Independientemente del resultado, apagamos el flag de
      // loading. El "finally" se ejecuta siempre, incluso si hay
      // un throw en el try. Es la forma idiomática en JS moderno.
      setIsInitializing(false);
    }
  }, [userId, sendTokenToBackend]);

  // -----------------------------------------------------------------
  // Effect: registrar listeners de notificaciones al montar.
  // -----------------------------------------------------------------
  // Hay dos tipos de eventos que debemos escuchar:
  //   1) "received": se dispara cuando llega una push mientras la
  //      app está en FOREGROUND (visible). El sistema operativo
  //      la muestra automáticamente gracias al handler global que
  //      configuramos en notificationService.js.
  //   2) "response": se dispara cuando el usuario TOCA una notifi-
  //      cación (puede ser en foreground o desde la bandeja). Aquí
  //      podemos hacer deep-link, marcar como leída, etc.
  // -----------------------------------------------------------------
  useEffect(() => {
    // Listener 1: notificación recibida en foreground.
    // En SDK 57, la subscripción tiene un método .remove() propio
    // (no se pasa a removeNotificationSubscription como antes).
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      // Callback que se invoca con la notificación completa.
      (notification) => {
        // Guardamos la notificación en el state. La UI puede
        // observar este cambio para mostrar un toast in-app o
        // refrescar datos en segundo plano.
        setLastNotification(notification);
      },
    );

    // Listener 2: usuario interactuó con la notificación.
    // Útil para deep-linking o tracking de aperturas.
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        // Guardamos la response en la ref (no causa re-render).
        // El objeto "response.notification.request.content.data"
        // contiene el payload que mandó el backend (por ejemplo,
        // { screen: 'AttendanceHistory', id: 123 }).
        lastResponseRef.current = response;

        // También actualizamos el state por si alguna pantalla
        // quiere reaccionar a la última interacción con un toast.
        setLastNotification(response.notification);
      },
    );

    // Función de limpieza: se ejecuta al DESMONTAR el componente
    // o cuando cambian las dependencias del effect. Es CRÍTICO
    // desuscribirse para evitar fugas de memoria y listeners
    // duplicados en navegaciones entre pantallas.
    return () => {
      // SDK 57: el método correcto es ".remove()" sobre la
      // subscripción, no pasar la subscripción a una función global.
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []); // Dependencias vacías: listeners se crean UNA sola vez.

  // -----------------------------------------------------------------
  // Effect: cuando el userId cambia (típicamente tras login),
  // intentamos inicializar automáticamente si el caller no lo
  // desactivó. Esto cubre el caso común en que el hook se monta
  // antes de saber si hay sesión.
  // -----------------------------------------------------------------
  useEffect(() => {
    // Si autoInitialize es false, respetamos la decisión del caller.
    if (!autoInitialize) return;

    // Si no hay userId (no logueado aún), no pedimos permisos todavía.
    // El login llamará a initialize(user.id) manualmente después.
    if (!userId) return;

    // Si ya tenemos un token registrado para este usuario, evitamos
    // pedir permisos de nuevo. Una comprobación simple: si el token
    // es distinto de null, asumimos que ya está inicializado.
    if (expoPushToken) return;

    // Caso por defecto: inicializamos. Capturamos errores con un
    // try/catch local para que un fallo de notificaciones NO rompa
    // el render del componente que consume este hook.
    initialize(userId).catch(() => {
      // El error ya se logueó dentro de initialize().
    });
  }, [userId, autoInitialize, expoPushToken, initialize]);

  // -----------------------------------------------------------------
  // Helpers públicos expuestos por el hook.
  // -----------------------------------------------------------------
  // Envolvemos las funciones del service en useCallback para que
  // las pantallas que las reciban no se re-rendericen al cambiar
  // otras partes del state del hook.

  // scheduleLocal: atajo para programar una notificación local.
  // Las pantallas lo llaman sin importar expo-notifications.
  const scheduleLocal = useCallback(async (opts) => {
    return scheduleLocalNotification(opts);
  }, []);

  // cancelAllScheduled: cancela TODAS las notificaciones locales.
  // Útil al hacer logout o al cambiar de usuario.
  const cancelAllScheduled = useCallback(async () => {
    await cancelAllScheduledNotifications();
  }, []);

  // dismissAll: cierra las notificaciones visibles en la bandeja.
  // Útil cuando el usuario entra a la app y ya vio el contenido.
  const dismissAll = useCallback(async () => {
    await Notifications.dismissAllNotificationsAsync();
  }, []);

  // -----------------------------------------------------------------
  // Valores que el hook expone a sus consumidores.
  // -----------------------------------------------------------------
  return {
    // Token Expo push (string) o null si no se ha obtenido.
    expoPushToken,
    // Estado de permisos: 'granted' | 'denied' | 'undetermined' | null.
    permissionStatus,
    // Última notificación recibida o con la que se interactuó.
    lastNotification,
    // True mientras se ejecuta initialize() (para spinners).
    isInitializing,
    // Función para inicializar manualmente (o reintentar).
    initialize,
    // Helpers de scheduling.
    scheduleLocal,
    cancelAllScheduled,
    dismissAll,
    // Convenientes derivados del estado.
    hasPermission: permissionStatus === 'granted',
    hasToken: !!expoPushToken,
  };
};

// Exportamos por defecto para compatibilidad con ambos estilos de
// import (default y nombrado). Así las pantallas pueden hacer:
//   import useNotifications from '...';
// o bien:
//   import { useNotifications } from '...';
export default useNotifications;
