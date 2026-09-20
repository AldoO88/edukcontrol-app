// =====================================================================
// passwordResetService.js
// ---------------------------------------------------------------------
// Capa de servicio para el flujo de RECUPERACIÓN de contraseña. El
// usuario pasa por 3 endpoints en orden:
//
//   1. requestReset(phone)
//                          → POST /auth/forgot-password/request
//      Backend envía un SMS con un código de 6 dígitos. La response
//      incluye expiresAt para que el front pueda mostrar un countdown
//      de 10 minutos.
//
//   2. verifyResetOtp(phone, otpCode)
//                          → POST /auth/forgot-password/verify
//      Backend valida que el código sea correcto y no esté expirado.
//      No devuelve JWT — solo confirma que el código es válido.
//
//   3. completeReset({ phone, otpCode, newPassword })
//                          → POST /auth/forgot-password/reset
//      Backend re-valida el código, hashea el password con bcrypt,
//      limpia otpCode/otpExpiresAt y devuelve { message }. NO devuelve
//      JWT — el usuario debe hacer login manual con la nueva contraseña.
//
// A diferencia de authService.login() y changePassword(), estos
// endpoints NO requieren autenticación previa (el usuario olvidó su
// contraseña). El api instance ya está configurado para no enviar el
// header Authorization si no hay token.
//
// =====================================================================
// MANEJO DE ERRORES
// ---------------------------------------------------------------------
// Cada función devuelve { success, message? } o { success, message?,
// expiresAt? }. NO lanzan excepciones — los errores se capturan
// internamente y se mapean a mensajes amigables en español. Esto
// simplifica el manejo en las pantallas: solo chequean result.success
// y muestran el mensaje con Alert.alert.
// =====================================================================

// Cliente axios.
import api from './api';

// Endpoints del backend (paths exactos según el contrato del server).
const ENDPOINTS = {
  request: '/auth/forgot-password/request',
  verify: '/auth/forgot-password/verify',
  reset: '/auth/forgot-password/reset',
};

// ---------------------------------------------------------------------
// requestReset(phone)
// ---------------------------------------------------------------------
// POST /auth/forgot-password/request
// Body: { phone: string }
// Response 200: { message, expiresAt }  (ISO 8601 string)
// Errores comunes:
//   400 → número con formato inválido
//   404 → número no registrado
//   429 → rate limit (5/hora por IP)
export const requestReset = async (phone) => {
  try {
    const response = await api.post(ENDPOINTS.request, { phone });
    const { message, expiresAt } = response.data || {};
    return {
      success: true,
      expiresAt,
      message: message || 'Código enviado a tu celular.',
    };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 400) {
      return {
        success: false,
        message: serverMessage || 'Número de celular inválido.',
      };
    }
    if (status === 404) {
      return {
        success: false,
        message: 'Este número no está registrado en la institución.',
      };
    }
    if (status === 429) {
      return {
        success: false,
        message: 'Demasiados intentos. Espera una hora antes de reintentar.',
      };
    }
    if (!error?.response) {
      return {
        success: false,
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      };
    }
    return {
      success: false,
      message: 'No se pudo enviar el código. Inténtalo de nuevo.',
    };
  }
};

// ---------------------------------------------------------------------
// verifyResetOtp(phone, otpCode)
// ---------------------------------------------------------------------
// POST /auth/forgot-password/verify
// Body: { phone: string, otpCode: string }
// Response 200: { message }
// Errores comunes:
//   400 invalid    → código incorrecto
//   400 expired    → código expirado (>10 min)
//   400 no pending → no hay un código pendiente para este phone
//   404            → número no registrado
export const verifyResetOtp = async (phone, otpCode) => {
  try {
    const response = await api.post(ENDPOINTS.verify, { phone, otpCode });
    return { success: true };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 400) {
      if (serverMessage?.toLowerCase().includes('expired')) {
        return {
          success: false,
          message: 'El código expiró. Vuelve a solicitar uno nuevo.',
          reason: 'expired',
        };
      }
      if (serverMessage?.toLowerCase().includes('no pending')) {
        return {
          success: false,
          message: 'No hay un código pendiente. Vuelve a solicitar uno.',
          reason: 'no_pending',
        };
      }
      return {
        success: false,
        message: serverMessage || 'El código es incorrecto. Verifica el SMS recibido.',
        reason: 'invalid',
      };
    }
    if (status === 404) {
      return {
        success: false,
        message: 'Este número no está registrado.',
      };
    }
    if (status === 429) {
      return {
        success: false,
        message: 'Demasiados intentos. Espera unos minutos.',
      };
    }
    if (!error?.response) {
      return {
        success: false,
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      };
    }
    return {
      success: false,
      message: 'No se pudo verificar el código. Inténtalo de nuevo.',
    };
  }
};

// ---------------------------------------------------------------------
// completeReset({ phone, otpCode, newPassword })
// ---------------------------------------------------------------------
// POST /auth/forgot-password/reset
// Body: { phone, otpCode, newPassword }
// Response 200: { message }
// Errores comunes:
//   400 invalid   → código inválido/expirado (defense-in-depth: re-valida)
//   400 password  → password muy corta (<8)
//   404           → número no registrado
export const completeReset = async ({ phone, otpCode, newPassword }) => {
  try {
    const response = await api.post(ENDPOINTS.reset, {
      phone,
      otpCode,
      newPassword,
    });
    return {
      success: true,
      message: response.data?.message || 'Contraseña restablecida correctamente.',
    };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 400) {
      if (serverMessage?.toLowerCase().includes('password')) {
        return {
          success: false,
          message: serverMessage || 'La contraseña debe tener al menos 8 caracteres.',
          reason: 'password',
        };
      }
      return {
        success: false,
        message: serverMessage || 'El código es inválido o expiró. Vuelve a verificarlo.',
        reason: 'invalid_code',
      };
    }
    if (status === 404) {
      return {
        success: false,
        message: 'Este número no está registrado.',
      };
    }
    if (!error?.response) {
      return {
        success: false,
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      };
    }
    return {
      success: false,
      message: 'No se pudo restablecer la contraseña. Inténtalo de nuevo.',
    };
  }
};
