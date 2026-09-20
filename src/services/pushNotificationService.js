// =====================================================================
// pushNotificationService.js
// ---------------------------------------------------------------------
// Servicio específico para registrar / desregistrar el Expo Push Token
// del dispositivo contra el endpoint de EdukControl. Es complementario
// a notificationService.js (que maneja permisos, canal, token local)
// — este archivo SOLO habla con el backend.
//
// =====================================================================
// NOTA SOBRE EL BODY FIELD (cambio 2026-Q3):
// ---------------------------------------------------------------------
// Antes: el mobile mandaba `{ token }` y el backend esperaba
// `{ fcm_token }`. El backend rechazaba el POST con 400 antes de
// guardar nada. Lo arreglamos mandando `{ fcm_token }` desde el
// mobile, alineado con el campo en la DB (que sigue llamándose
// `fcm_token` por compatibilidad histórica aunque ahora almacene
// Expo Push Tokens, no tokens FCM raw).
//
// =====================================================================
// ROUTING POR ROL (cambio 2026-Q3):
// ---------------------------------------------------------------------
// Hay DOS endpoints de registro en el backend:
//   - /api/guardians/me/fcm-token  → tutores (Guardian)
//   - /auth/fcm-token              → staff (User con role != tutor)
//
// El endpoint se elige según `user.role` del AuthContext. El backend
// rechaza tokens para roles que no correspondan (ej: si un staff
// intenta el endpoint de guardian, el backend responde 404 "No
// guardian records found for this user").
// =====================================================================

// Cliente axios de la app. Ya tiene el interceptor JWT que inyecta
// el header Authorization.
import api from './api';

// =====================================================================
// ENDPOINTS
// =====================================================================
const GUARDIAN_FCM_TOKEN_ENDPOINT = '/api/guardians/me/fcm-token';
const STAFF_FCM_TOKEN_ENDPOINT = '/auth/fcm-token';

// Roles del backend. El rol 'tutor' es el único que va al endpoint
// de Guardian; todos los demás roles (teacher, admin, principal,
// prefect, social_worker, etc.) van al endpoint de User.
const ROLE_TUTOR = 'tutor';

// =====================================================================
// Estado a nivel de módulo: el Expo Push Token actual del dispositivo.
// =====================================================================
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

// =====================================================================
// getEndpointForRole(role)
// =====================================================================
// Resuelve qué endpoint usar según el rol del usuario.
// Si el rol es desconocido o null, default al de guardian (no debería
// pasar en producción; el hook solo corre si hay user logueado).
// =====================================================================
const getEndpointForRole = (role) => {
  if (role === ROLE_TUTOR) return GUARDIAN_FCM_TOKEN_ENDPOINT;
  return STAFF_FCM_TOKEN_ENDPOINT;
};

// =====================================================================
// registerFcmToken(token, role)
// =====================================================================
// POST { endpoint } con body { fcm_token: "ExponentPushToken[…]" }
// El backend toma el userId del JWT (no del body).
//
// Comportamiento ante error: NO relanza. Si el registro falla (red,
// 5xx, etc.), el usuario sigue pudiendo usar la app; simplemente no
// recibirá push notifications hasta el próximo intento. Logueamos
// para debugging y devolvemos { success: false } para que el caller
// (hook) pueda actualizar su state de "registered" → "error".
// =====================================================================
export const registerFcmToken = async (token, role) => {
  if (!token) {
    console.warn('[push] registerFcmToken: token vacío, no se hace POST');
    return { success: false, reason: 'empty_token' };
  }

  const endpoint = getEndpointForRole(role);
  setCurrentToken(token);

  try {
    await api.post(endpoint, { fcm_token: token });
    console.log(`[push] Expo Push Token registered with backend via ${endpoint}`);
    return { success: true };
  } catch (error) {
    console.error(
      '[push] Failed to register Expo Push Token with backend:',
      error?.response?.status,
      error?.message,
    );
    return { success: false, reason: 'network_or_server_error' };
  }
};

// =====================================================================
// unregisterFcmToken(role)
// =====================================================================
// DELETE { endpoint } con body { fcm_token: "..." }.
// Se llama desde AuthContext.logout() ANTES de limpiar el state local.
//
// Comportamiento ante error: NO relanza, y SIEMPRE limpia el
// currentToken local (incluso si el DELETE falló).
// =====================================================================
export const unregisterFcmToken = async (role) => {
  const token = getCurrentToken();

  if (!token) {
    return { success: true, reason: 'no_token_to_unregister' };
  }

  const endpoint = getEndpointForRole(role);

  try {
    await api.delete(endpoint, { data: { fcm_token: token } });
    console.log(`[push] Expo Push Token unregistered from backend via ${endpoint}`);
    return { success: true };
  } catch (error) {
    console.error(
      '[push] Failed to unregister Expo Push Token from backend:',
      error?.response?.status,
      error?.message,
    );
    return { success: false, reason: 'network_or_server_error' };
  } finally {
    setCurrentToken(null);
  }
};

// =====================================================================
// getCurrentRegisteredToken()
// =====================================================================
// Helper exportado para debugging o para la pantalla de "estado de
// notificaciones" (si la hubiera en el futuro). NO se usa en el
// flujo normal.
// =====================================================================
export const getCurrentRegisteredToken = () => currentToken;
