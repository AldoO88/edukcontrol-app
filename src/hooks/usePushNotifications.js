// =====================================================================
// usePushNotifications.js
// ---------------------------------------------------------------------
// Hook que orquesta TODO el ciclo de vida de las push notifications
// en la app EdukControl:
//
//   1. Mount → crea el canal Android → pide permisos → obtiene el
//      ExpoPushToken (= FCM en Android, APNS en iOS) → lo registra
//      contra el backend (endpoint según rol: tutor vs staff).
//   2. Mientras esté montado → escucha onTokenRefresh y re-registra
//      automáticamente cuando el SO rota el token.
//   3. Tap en una notificación → navega a la pantalla correspondiente
//      usando notificationDataToRoute().
//   4. Unmount → limpia todos los listeners. NO desregistra del
//      backend: eso lo hace AuthContext.logout() explícitamente.
// =====================================================================

import { useEffect, useRef, useState } from 'react';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';

import {
  createAndroidChannel,
  requestNotificationPermissions,
  getExpoPushToken,
} from '../services/notificationService';
import {
  registerFcmToken,
  unregisterFcmToken,
} from '../services/pushNotificationService';
import { useAuth } from './useAuth';
import notificationDataToRoute from '../utils/notificationData';

// expo-notifications: carga dinámica para sobrevivir en Expo Go/Android
// SDK 53+ (donde el módulo lanza en import estático).
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

/**
 * Hook principal. Devuelve:
 *   - expoPushToken: string | null — el token actual (útil para debugging).
 *   - status: estado del setup. Uno de:
 *       'idle'         — todavía no se intentó (enabled=false).
 *       'requesting'   — pidiendo permisos / creando canal.
 *       'registering'  — token obtenido, registrándolo en backend.
 *       'registered'   — todo OK, push notifications activas.
 *       'denied'       — usuario denegó permisos.
 *       'unsupported'  — simulador o falta projectId.
 *       'error'        — error inesperado (red, server, etc.).
 *   - error: Error | null — el último error si status='error'.
 *   - lastNotification: la última notificación recibida en foreground.
 *   - lastNotificationResponse: la última notificación tappeada.
 *
 * Parámetros:
 *   - enabled: si false, el hook es no-op.
 */
export const usePushNotifications = (enabled = true) => {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [lastNotification, setLastNotification] = useState(null);
  const [lastNotificationResponse, setLastNotificationResponse] = useState(null);

  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role || null;

  // Refs para cleanup. Usamos refs porque las funciones de cleanup
  // del useEffect se ejecutan con valores stale si los subscriptions
  // cambian entre renders.
  const tokenSubscriptionRef = useRef(null);
  const notificationSubscriptionRef = useRef(null);
  const responseSubscriptionRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      setExpoPushToken(null);
      return;
    }

    let cancelled = false;

    // ----------------------------------------------------------------
    // LISTENER: foreground (notification recibida mientras la app
    // está abierta).
    // ----------------------------------------------------------------
    // addNotificationReceivedListener dispara cuando una push llega
    // y la app está en foreground. El OS muestra el banner
    // automáticamente (gracias al setNotificationHandler global que
    // notificationService.js configura); nosotros solo guardamos la
    // notificación en state para que la UI pueda mostrarla si quiere
    // (ej. un toast in-app).
    if (Notifications && !notificationSubscriptionRef.current) {
      notificationSubscriptionRef.current =
        Notifications.addNotificationReceivedListener((notification) => {
          if (cancelled) return;
          console.log(
            '[push] Notification received in foreground:',
            notification.request.content.title
          );
          setLastNotification(notification);
        });
    }

    // ----------------------------------------------------------------
    // LISTENER: tap (usuario tocó la notificación).
    // ----------------------------------------------------------------
    // addNotificationResponseReceivedListener dispara cuando el usuario
    // hace tap en una notificación (app en background o cerrada).
    // Usamos notificationDataToRoute() para navegar a la pantalla
    // relevante según el rol y el kind.
    if (Notifications && !responseSubscriptionRef.current) {
      responseSubscriptionRef.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          if (cancelled) return;
          console.log(
            '[push] Notification tapped:',
            response.notification.request.content.title
          );
          setLastNotificationResponse(response);

          const data = response.notification.request.content.data;
          const route = notificationDataToRoute(data, role);
          if (route) {
            try {
              router.push(route);
            } catch (navErr) {
              console.error('[push] Navigation failed:', navErr);
            }
          }
        });
    }

    // ----------------------------------------------------------------
    // SETUP: permisos, token, registro en backend.
    // ----------------------------------------------------------------
    const setup = async () => {
      try {
        setStatus('requesting');

        if (!Notifications) {
          if (!cancelled) setStatus('unsupported');
          return;
        }

        await createAndroidChannel();

        if (!Device.isDevice) {
          console.warn(
            '[push] Not running on a physical device — push notifications will not work'
          );
          if (!cancelled) setStatus('unsupported');
          return;
        }

        const permissionStatus = await requestNotificationPermissions();
        if (cancelled) return;

        if (permissionStatus !== 'granted') {
          setStatus('denied');
          return;
        }

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

        setExpoPushToken(token);
        setStatus('registering');

        const result = await registerFcmToken(token, role);
        if (cancelled) return;

        if (result.success) {
          setStatus('registered');
        } else {
          setError(new Error(`registerFcmToken failed: ${result.reason}`));
          setStatus('error');
        }

        if (cancelled) return;

        // LISTENER: rotación de token.
        if (!tokenSubscriptionRef.current) {
          tokenSubscriptionRef.current = Notifications.addPushTokenListener(
            async (newTokenData) => {
              const newToken = newTokenData.data;
              console.log('[push] Token rotated, re-registering with backend');
              setExpoPushToken(newToken);
              await registerFcmToken(newToken, role);
            }
          );
        }
      } catch (err) {
        console.error('[push] Unexpected error setting up push:', err);
        if (!cancelled) {
          setError(err);
          setStatus('error');
        }
      }
    };

    setup();

    // Cleanup.
    return () => {
      cancelled = true;
      if (tokenSubscriptionRef.current) {
        tokenSubscriptionRef.current.remove();
        tokenSubscriptionRef.current = null;
      }
      if (notificationSubscriptionRef.current) {
        notificationSubscriptionRef.current.remove();
        notificationSubscriptionRef.current = null;
      }
      if (responseSubscriptionRef.current) {
        responseSubscriptionRef.current.remove();
        responseSubscriptionRef.current = null;
      }
    };
  }, [enabled, role, router]);

  return {
    expoPushToken,
    status,
    error,
    lastNotification,
    lastNotificationResponse,
  };
};

// Re-exportar unregisterFcmToken para uso en AuthContext.logout.
// (Lo importamos de pushNotificationService y lo exponemos para que
// AuthContext no tenga que importar directamente de un archivo de
// servicio de push — mantiene la separación de concerns.)
export { unregisterFcmToken };
