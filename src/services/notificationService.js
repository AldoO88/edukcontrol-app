// =====================================================================
// notificationService.js
// ---------------------------------------------------------------------
// Capa de servicios para todo lo relacionado con notificaciones push
// y locales usando expo-notifications. Su objetivo es:
//   1) Encapsular las llamadas a la SDK para que el resto de la app
//      no dependa directamente de "expo-notifications" (mejor test-
//      abilidad y un único punto de cambio si migramos a FCM directo).
//   2) Centralizar la creación del canal de Android (obligatorio en
//      Android 8+ y requerido en 13+ antes de pedir permisos).
//   3) Configurar el handler global que decide si se muestra o no
//      un banner cuando la app está en foreground.
//   4) Proveer helpers para pedir permisos, obtener el token Expo,
//      enviar el token al backend y programar notificaciones locales.
// =====================================================================

// Importamos el módulo completo de expo-notifications como "Notifications".
// Usamos require() dentro de un try/catch (en vez de un import estático)
// porque en Expo Go en Android desde SDK 53 el simple hecho de cargar
// este módulo LANZA un error síncrono ("remote notifications fueron
// removidas de Expo Go"). Con import estático ese throw ocurre durante
// la evaluación del módulo y no hay forma de atraparlo, tumbando toda
// la app (ver AGENTS.md trap 5). Con require() dentro de un try/catch sí
// podemos capturarlo y degradar con gracia (notificaciones deshabilitadas).
let Notifications = null;
try {
  // eslint-disable-next-line global-require
  Notifications = require('expo-notifications');
} catch (err) {
  console.warn(
    '[notificationService] expo-notifications no disponible '
      + '(esperado en Expo Go/Android SDK 53+; usa un development build):',
    err?.message,
  );
}

// Importamos Constants para acceder a la configuración nativa de Expo
// (app.json). Aquí vive el "extra.eas.projectId" que getExpoPushTokenAsync
// exige en SDK 57. Sin ese ID, la llamada falla con un error descriptivo.
import Constants from 'expo-constants';

// Importamos Platform para detectar el sistema operativo y aplicar
// diferencias entre iOS y Android (canal de notificaciones, etc.).
import { Platform } from 'react-native';

// ---------------------------------------------------------------------
// Configuración global del handler de notificaciones en foreground.
// ---------------------------------------------------------------------
// Esta función se llama UNA sola vez al iniciar la app (la invocamos
// desde useNotifications). Define qué hacer cuando llega una notificación
// mientras la app está abierta y visible. En SDK 57 las claves son
// "shouldShowBanner" (¿mostrar alerta visual?) y "shouldShowList"
// (¿agregar a la lista de notificaciones?). Las opciones de sonido
// y badge las dejamos en false para no ser intrusivos por defecto.
// Solo lo configuramos si el módulo cargó correctamente (ver guarda
// arriba); si Notifications es null, no hay nada que configurar.
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// ID canónico del canal de Android. Lo definimos como constante para
// reutilizarlo en distintas llamadas y evitar errores de tipeo. En
// Android 8+ todas las notificaciones deben pertenecer a un canal.
const ANDROID_CHANNEL_ID = 'edukcontrol_default';

// ---------------------------------------------------------------------
// createAndroidChannel
// ---------------------------------------------------------------------
// Crea (o actualiza) el canal de notificaciones por defecto de Android.
// Es OBLIGATORIO llamar a esto ANTES de requestPermissionsAsync en
// Android 13+, si no el prompt de permisos no aparece y nunca
// obtendremos un push token. En iOS esta función es un no-op.
export const createAndroidChannel = async () => {
  // Si el módulo no cargó (Expo Go/Android SDK 53+), no hay nada
  // que hacer: salimos en silencio.
  if (!Notifications) return;

  // Verificamos Platform.OS para no ejecutar código específico de
  // Android en iOS, lo que provocaría warnings o errores.
  if (Platform.OS !== 'android') return;

  // setNotificationChannelAsync recibe el ID del canal y un objeto
  // con la configuración visual/sonora. Usamos "MAX" de importancia
  // para que las notificaciones críticas (asistencia, alertas) se
  // muestren como heads-up. El color lightColor coincide con el
  // primary del sistema de diseño (slate-900 ≈ #0f172a).
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'EdukControl - Avisos Escolares',
    description: 'Canal oficial para alertas académicas, asistencia y mensajes.',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0f172a',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });
};

// ---------------------------------------------------------------------
// getProjectId
// ---------------------------------------------------------------------
// Helper para extraer de forma SEGURA el projectId de EAS desde los
// Constants de Expo. Devuelve null si no está configurado, lo que
// permite a las funciones de abajo manejar el error con un mensaje
// claro en vez de un crash confuso.
const getProjectId = () => {
  // En SDK 57, el projectId vive en:
  //   expoConfig.extra.eas.projectId  (EAS Build)
  //   easConfig.projectId             (algunos flujos)
  // Usamos el operador "?." (optional chaining) para no romper si
  // alguna parte del objeto es undefined, y "||" para fallback.
  return (
    Constants?.expoConfig?.extra?.eas?.projectId
    || Constants?.easConfig?.projectId
    || null
  );
};

// ---------------------------------------------------------------------
// requestNotificationPermissions
// ---------------------------------------------------------------------
// Pide al usuario permiso para mostrar notificaciones. Devuelve el
// estado final de los permisos para que useNotifications lo exponga
// a la UI. Maneja iOS y Android de forma transparente.
export const requestNotificationPermissions = async () => {
  // Si el módulo no cargó (Expo Go/Android SDK 53+), no hay permisos
  // que pedir. Devolvemos 'unsupported' para que el caller lo maneje
  // como un caso distinto de 'denied'.
  if (!Notifications) return 'unsupported';

  // Primero creamos el canal en Android. Es importante hacerlo antes
  // de requestPermissionsAsync en Android 13+, si no el diálogo no
  // aparece. createAndroidChannel ya es no-op en iOS.
  await createAndroidChannel();

  // getPermissionsAsync consulta el estado actual SIN mostrar un
  // diálogo. Si el usuario ya decidió, lo respetamos y no le
  // volvemos a preguntar. Si devuelve "granted", salimos temprano.
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  // Si ya está granted o denied, devolvemos ese estado sin volver
  // a mostrar el prompt del sistema. Denegado debe permanecer
  // denegado hasta que el usuario lo cambie desde Settings.
  if (existingStatus === 'granted' || existingStatus === 'denied') {
    return existingStatus;
  }

  // Si el estado era "undetermined" (primera vez), mostramos el
  // prompt del sistema operativo pidiendo permiso. En iOS también
  // podemos pedir permisos granulares (alert, badge, sound) vía el
  // objeto "ios"; en Android el sistema muestra un único diálogo.
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  // Devolvemos el estado final para que el caller lo sepa.
  return status;
};

// ---------------------------------------------------------------------
// getExpoPushToken
// ---------------------------------------------------------------------
// Obtiene el token Expo push (el que enviaremos a nuestro backend
// para que él, a través del servicio de Expo, mande pushes a este
// dispositivo). Devuelve null si el usuario no dio permisos o si
// falta el projectId de EAS.
export const getExpoPushToken = async () => {
  // Si el módulo no cargó (Expo Go/Android SDK 53+), no hay token
  // que obtener.
  if (!Notifications) return null;

  // Verificamos que tengamos permisos. Sin permisos no hay token.
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    // Salimos silenciosamente: no es un error, simplemente el
    // usuario optó por no recibir notificaciones.
    return null;
  }

  // Obtenemos el projectId. Si no está configurado en app.json,
  // getExpoPushTokenAsync tira un error críptico ("No "projectId"
  // found"). Lo validamos nosotros para devolver un mensaje claro.
  const projectId = getProjectId();
  if (!projectId) {
    // El "throw" permite al caller (useNotifications) atrapar el
    // error y mostrar un mensaje útil en consola. No usamos console
    // .error aquí para no duplicar logs; dejamos que el caller decida.
    throw new Error(
      'No se encontró el "extra.eas.projectId" en app.json. '
        + 'Configúralo con `eas init` o manualmente antes de pedir el push token.',
    );
  }

  // Llamada a la SDK. getExpoPushTokenAsync devuelve un objeto
  // { data: 'ExponentPushToken[xxx]', type: 'expo' }. Solo nos
  // interesa "data", que es el string que guardaremos/enviaremos.
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

  // Devolvemos directamente el string del token, que es lo que
  // necesitamos persistir y enviar al backend.
  return tokenData.data;
};

// ---------------------------------------------------------------------
// registerPushTokenWithBackend
// ---------------------------------------------------------------------
// Una vez obtenido el token, lo enviamos al backend para asociarlo
// con el usuario logueado. Esta función recibe un cliente HTTP (la
// instancia de axios) y el id del usuario, para no acoplarnos al
// módulo "api" desde un servicio (mejor para testing).
export const registerPushTokenWithBackend = async (httpClient, userId, token) => {
  // Validamos los argumentos. Lanzar aquí es OK: el caller lo
  // atrapa y muestra un error. Mejor fallar pronto que enviar
  // un registro corrupto al backend.
  if (!httpClient) throw new Error('registerPushTokenWithBackend requiere un cliente HTTP.');
  if (!userId) throw new Error('registerPushTokenWithBackend requiere un userId.');
  if (!token) throw new Error('registerPushTokenWithBackend requiere un push token.');

  // POST al endpoint del backend. La ruta "/users/push-token" es
  // una convención: tu backend debe implementar este endpoint y
  // asociar el token al usuario. Lo desacoplamos del servicio para
  // poder mockearlo en tests.
  const response = await httpClient.post('/users/push-token', {
    userId,
    token,
    // Informamos la plataforma para que el backend pueda ajustar
    // opciones de envío (en Android 13+ el canal debe existir).
    platform: Platform.OS,
  });

  // Devolvemos la respuesta para que el caller (hook) la inspeccione.
  return response.data;
};

// ---------------------------------------------------------------------
// scheduleLocalNotification
// ---------------------------------------------------------------------
// Programa una notificación local (sin necesidad de servidor). Útil
// para recordatorios, avisos dentro de la app, etc. Devuelve el id
// de la notificación, que se puede usar para cancelarla después.
export const scheduleLocalNotification = async ({
  title,
  body,
  seconds = 0,
  data = {},
}) => {
  // Validamos título y body. Sin título la notificación se ve rota.
  if (!title) throw new Error('scheduleLocalNotification requiere un "title".');

  // Si el módulo no cargó (Expo Go/Android SDK 53+), no hay forma
  // de programar la notificación local.
  if (!Notifications) return null;

  // Llamamos a scheduleNotificationAsync. El "trigger" indica CUÁNDO
  // se dispara. Usamos el tipo TIME_INTERVAL (segundos desde ahora).
  // En SDK 57 la sintaxis explícita es: { type, seconds, repeats? }.
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      // data se envía junto con la notificación y es accesible
      // desde el listener en useNotifications (útil para deep-link).
      data,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(0, seconds),
      repeats: false,
    },
  });

  // Devolvemos el id para que el caller pueda cancelarla.
  return identifier;
};

// ---------------------------------------------------------------------
// cancelAllScheduledNotifications
// ---------------------------------------------------------------------
// Cancela todas las notificaciones locales programadas. Útil cuando
// el usuario cierra sesión, para no dejar "fantasmas" agendados.
export const cancelAllScheduledNotifications = async () => {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Exportamos también el ID del canal por si otras pantallas lo
// necesitan referenciar (por ejemplo, para mostrar configuración).
export { ANDROID_CHANNEL_ID };
