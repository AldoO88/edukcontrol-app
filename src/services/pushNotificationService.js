// =====================================================================
// pushNotificationService.js
// ---------------------------------------------------------------------
// Servicio específico para registrar / desregistrar el FCM token
// del dispositivo contra el endpoint de EdukControl. Es complementario
// a notificationService.js (que maneja permisos, canal, token local)
// — este archivo SOLO habla con el backend.
//
// =====================================================================
// ¿POR QUÉ UN ARCHIVO SEPARADO Y NO EXTENDER notificationService.JS?
// ---------------------------------------------------------------------
// notificationService.js ya tiene registerPushTokenWithBackend(),
// pero usa un endpoint genérico (/users/push-token) con userId en el
// body. El usuario pide un endpoint específico de EdukControl
// (/api/guardians/me/fcm-token) que:
//   - NO recibe userId en el body (lo toma del JWT via el "me" del path).
//   - Está bajo /api/ (los endpoints de guardian están bajo ese prefijo,
//     según el comentario de src/services/api.js).
// Si en el futuro hay que actualizar el endpoint, solo se toca este
// archivo.
// =====================================================================

// Cliente axios de la app. Ya tiene el interceptor JWT que inyecta
// el header Authorization, así que el backend sabe qué guardian está
// haciendo la petición y lo asocia al FCM token.
import api from './api';

// Endpoint que el usuario especificó. El prefijo /api/ lo añade
// el caller; el baseURL del axios ya tiene host:port. Ver
// src/services/api.js para más detalles del prefijo /api.
const FCM_TOKEN_ENDPOINT = '/api/guardians/me/fcm-token';

// ---------------------------------------------------------------------
// Estado a nivel de módulo: el FCM token actual del dispositivo.
// ---------------------------------------------------------------------
// Lo almacenamos aquí (no en el hook ni en un Context) para que el
// AuthContext pueda desregistrarlo en logout SIN tener acceso al hook.
// El hook llama a registerFcmToken() que setea este valor; el
// AuthContext llama a unregisterFcmToken() que lo lee y lo limpia.
// Es privado al módulo (no se exporta) para evitar que código
// externo lo manipule directamente.
let currentToken = null;

const setCurrentToken = (token) => {
  currentToken = token || null;
};

const getCurrentToken = () => currentToken;

// ---------------------------------------------------------------------
// registerFcmToken(token)
// ---------------------------------------------------------------------
// POST /api/guardians/me/fcm-token
// Body: { token: string }
//
// Registra el push token del dispositivo contra el backend, asociado
// al usuario autenticado (el backend lo identifica por el JWT del
// header Authorization, no por el body).
//
// Comportamiento ante error: NO relanza. Si el registro falla (red,
// 5xx, etc.), el usuario sigue pudiendo usar la app; simplemente no
// recibirá push notifications hasta el próximo intento. Logueamos
// para debugging y devolvemos { success: false } para que el caller
// (hook) pueda actualizar su state de "registered" → "error".
export const registerFcmToken = async (token) => {
  if (!token) {
    console.warn('[push] registerFcmToken: token vacío, no se hace POST');
    return { success: false, reason: 'empty_token' };
  }

  // Guardamos el token localmente ANTES del POST. Si el POST
  // falla, queremos poder reintentar en el próximo onTokenRefresh
  // o en el próximo login. Si el POST tiene éxito, ya tenemos
  // el token guardado.
  setCurrentToken(token);

  try {
    await api.post(FCM_TOKEN_ENDPOINT, { token });
    console.log('[push] FCM token registered with backend');
    return { success: true };
  } catch (error) {
    console.error(
      '[push] Failed to register FCM token with backend:',
      error?.response?.status,
      error?.message,
    );
    // No relanzamos: queremos que el hook siga funcionando y
    // pueda reintentar. Devolvemos success:false para que el
    // hook marque su state como "error".
    return { success: false, reason: 'network_or_server_error' };
  }
};

// ---------------------------------------------------------------------
// unregisterFcmToken()
// ---------------------------------------------------------------------
// DELETE /api/guardians/me/fcm-token
// Body: { token: string }
//
// Desregistra el push token del dispositivo. Se llama desde
// AuthContext.logout() ANTES de limpiar el state local, para que
// el backend deje de enviar pushes a este device.
//
// Comportamiento ante error: NO relanza, y SIEMPRE limpia el
// currentToken local (incluso si el DELETE falló). Si el user
// vuelve a loguearse, el hook obtendrá un token (nuevo o el mismo)
// y lo re-registrará. Si el backend sigue teniendo el token viejo,
// el próximo register lo sobreescribirá con el mismo valor
// (idempotente) o lo actualizará si rotó.
//
// Devuelve un objeto con success para que el caller (logout)
// pueda loguear el resultado sin crashear.
export const unregisterFcmToken = async () => {
  const token = getCurrentToken();

  // Si no hay token registrado localmente, no hay nada que
  // desregistrar. Esto pasa cuando el hook nunca se montó
  // (ej: usuario logueado antes de integrar push) o cuando
  // ya se desregistró en un logout previo.
  if (!token) {
    return { success: true, reason: 'no_token_to_unregister' };
  }

  try {
    await api.delete(FCM_TOKEN_ENDPOINT, { data: { token } });
    console.log('[push] FCM token unregistered from backend');
    return { success: true };
  } catch (error) {
    // NO relanzamos. El logout debe proceder incluso si el
    // unregister falla (no podemos dejar al usuario logueado
    // porque la red está caída).
    console.error(
      '[push] Failed to unregister FCM token from backend:',
      error?.response?.status,
      error?.message,
    );
    return { success: false, reason: 'network_or_server_error' };
  } finally {
    // SIEMPRE limpiamos el token local, incluso si el DELETE
    // falló. El hook re-registrará cuando el user vuelva a
    // loguearse (puede ser el mismo token o uno nuevo si rotó).
    setCurrentToken(null);
  }
};

// ---------------------------------------------------------------------
// getCurrentRegisteredToken()
// ---------------------------------------------------------------------
// Helper exportado para debugging o para la pantalla de "estado de
// notificaciones" (si la hubiera en el futuro). NO se usa en el
// flujo normal.
export const getCurrentRegisteredToken = () => currentToken;
