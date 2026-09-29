// =====================================================================
// authService.js
// ---------------------------------------------------------------------
// Capa HTTP para endpoints de autenticación. Encapsula login, verify,
// refresh y changePassword; AuthContext gestiona persistencia y estado.
// =====================================================================

import api from './api';

// Helpers para decodificar el JWT (solo informativos: para validar
// expiración el backend es la fuente de verdad).
import { decodeJwtPayload, isJwtExpired } from '../utils/jwt';

// Mapea un payload JWT decodificado a la forma "user" que consume
// la app. El backend firma con { _id, email, name, role } (más
// schoolId); desde el unification a roles en inglés, "role" ya viene
// canónico y no se traduce.
const payloadToAppUser = (payload) => {
  if (!payload) return null;
  return {
    id: payload._id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };
};

const errorMessage = (error, fallback) => {
  const status = error?.response?.status;
  if (status === 404) return 'El número de celular no está registrado.';
  if (status === 401) return error?.response?.data?.message || 'Celular o contraseña incorrectos.';
  if (status === 400) return error?.response?.data?.message || 'Datos inválidos.';
  if (error?.code === 'ECONNABORTED') return 'La petición tardó demasiado. Inténtalo de nuevo.';
  if (!error?.response) return 'No se pudo conectar con el servidor. Verifica tu conexión.';
  return error?.response?.data?.message || fallback;
};

// =====================================================================
// login: POST /auth/login con phone+password+remember+client
// Devuelve { success, user, authToken, refreshToken, message }.
// AuthContext persiste ambos tokens (authToken siempre; refreshToken
// solo si remember=true).
// =====================================================================
export const login = async (phone, password, remember) => {
  try {
    const response = await api.post('/auth/login', {
      phone: String(phone || '').trim(),
      password,
      remember: !!remember,
      client: 'app',
    });
    const { authToken, refreshToken } = response.data || {};
    if (!authToken) {
      return { success: false, message: 'Respuesta inválida del servidor.' };
    }
    const payload = decodeJwtPayload(authToken);
    const user = payloadToAppUser(payload);
    if (!user) {
      return { success: false, message: 'Token inválido o expirado.' };
    }
    return {
      success: true,
      user,
      authToken,
      refreshToken: remember ? refreshToken : null,
    };
  } catch (error) {
    return {
      success: false,
      message: errorMessage(error, 'No fue posible iniciar sesión.'),
    };
  }
};

// =====================================================================
// refresh: POST /auth/refresh con el refresh actual. Devuelve el par
// nuevo. Si falla (inválido/expirado/reusado), AuthContext decide
// cerrar sesión.
// =====================================================================
export const refresh = async (refreshToken) => {
  try {
    const response = await api.post('/auth/refresh', { refreshToken });
    const { authToken, refreshToken: newRefresh } = response.data || {};
    if (!authToken || !newRefresh) {
      return { success: false, message: 'Refresh inválido.' };
    }
    return { success: true, authToken, refreshToken: newRefresh };
  } catch (error) {
    return {
      success: false,
      message: errorMessage(error, 'Refresh falló.'),
    };
  }
};

// =====================================================================
// verify: GET /auth/verify para revalidar. Devuelve el user mapeado
// o null.
//
// Bug arreglado: antes hacía payloadToAppUser(response.data) pero el
// backend devuelve { user: payload }, así que el check isJwtExpired
// siempre daba true y la app te deslogueaba al arrancar (incluso con
// token vigente). Ahora usamos response.data.user.
// =====================================================================
export const verify = async () => {
  try {
    const response = await api.get('/auth/verify');
    const user = payloadToAppUser(response.data?.user);
    return user;
  } catch (error) {
    return null;
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    await api.put('/auth/change-password', { currentPassword, newPassword });
    return { success: true, message: 'Contraseña actualizada correctamente.' };
  } catch (error) {
    if (error.response) {
      return { success: false, error: error.response.data?.message || 'Error al cambiar la contraseña.' };
    }
    return { success: false, error: 'No se pudo conectar con el servidor. Intenta de nuevo.' };
  }
};

const authService = {
  login,
  refresh,
  verify,
  changePassword,
};

export default authService;
