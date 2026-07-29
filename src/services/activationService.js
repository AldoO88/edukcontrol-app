// =====================================================================
// activationService.js
// ---------------------------------------------------------------------
// Capa de servicio para el flujo de ACTIVACIÓN de cuenta. El usuario
// pasa por 3 endpoints en orden:
//
//   1. requestActivationOtp(phone)
//                          → POST /auth/request-activation
//      Backend envía un SMS con un código de 6 dígitos. La response
//      incluye expiresAt para que el front pueda mostrar un countdown
//      de 10 minutos.
//
//   2. verifyActivationOtp(phone, otpCode)
//                          → POST /auth/verify-otp
//      Backend valida que el código sea correcto y no esté expirado.
//      No devuelve JWT todavía — solo confirma que el código es válido.
//
//   3. completeActivation({ phone, otpCode, newPassword })
//                          → POST /auth/activate-account
//      Backend crea (o activa) la cuenta, hashea el password con
//      bcrypt, y devuelve { authToken, user } para auto-login.
//
// A diferencia de authService.login(), estos endpoints NO requieren
// autenticación previa (el usuario todavía no tiene cuenta). El api
// instance ya está configurado para no enviar el header Authorization
// si no hay token, así que no necesitamos hacer nada especial.
//
// =====================================================================
// MANEJO DE ERRORES
// ---------------------------------------------------------------------
// Cada función devuelve { success, message? } o { success, user,
// authToken, message?, expiresAt? }. NO lanzan excepciones — los
// errores se capturan internamente y se mapean a mensajes amigables
// en español. Esto simplifica el manejo en las pantallas: solo
// chequean result.success y muestran el mensaje con Alert.alert.
// =====================================================================

// Cliente axios.
import api from './api';

// Endpoints del backend (paths exactos según el contrato del server).
const ENDPOINTS = {
  requestOtp: '/auth/request-activation',
  verifyOtp: '/auth/verify-otp',
  complete: '/auth/activate-account',
};

// ---------------------------------------------------------------------
// requestActivationOtp(phone)
// ---------------------------------------------------------------------
// POST /auth/request-activation
// Body: { phone: string }  (el server también acepta "phoneNumber")
// Response 200: { message, expiresAt }  (ISO 8601 string)
// Errores comunes:
//   400 → número con formato inválido
//   404 → número no registrado en la institución
//   429 → rate limit (5/hora por IP)
export const requestActivationOtp = async (phone) => {
  try {
    const response = await api.post(ENDPOINTS.requestOtp, { phone });
    const { message, expiresAt } = response.data || {};
    return {
      success: true,
      // expiresAt es la fecha ISO 8601 que el front usa para el
      // countdown de 10 min. La guardamos aquí para que la pantalla
      // no tenga que parsear la response de nuevo.
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
        message: 'Este número no está registrado en la institución. Verifica con tu coordinador.',
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
// verifyActivationOtp(phone, otpCode)
// ---------------------------------------------------------------------
// POST /auth/verify-otp
// Body: { phone: string, otpCode: string }
// Response 200: { message, phoneNumber }  (echo del phone)
// Errores comunes:
//   400 invalid    → código incorrecto
//   400 expired    → código expirado (>10 min)
//   400 no pending → no hay un código pendiente para este phone
//   400 already    → la cuenta ya está activa (debería hacer login)
export const verifyActivationOtp = async (phone, otpCode) => {
  try {
    const response = await api.post(ENDPOINTS.verifyOtp, { phone, otpCode });
    return { success: true };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 400) {
      // El server manda mensajes específicos: "Invalid activation
      // code.", "Activation code has expired...", "No pending
      // activation...", "Account is already active...". Los pasamos
      // tal cual (más informativo que un genérico).
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
          message: 'No hay un código pendiente. Vuelve a la pantalla anterior para solicitar uno.',
          reason: 'no_pending',
        };
      }
      if (serverMessage?.toLowerCase().includes('already active')) {
        return {
          success: false,
          message: 'Esta cuenta ya está activa. Inicia sesión normalmente.',
          reason: 'already_active',
        };
      }
      return {
        success: false,
        message: serverMessage || 'El código es incorrecto. Verifica el SMS recibido.',
        reason: 'invalid',
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
// completeActivation({ phone, otpCode, newPassword })
// ---------------------------------------------------------------------
// POST /auth/activate-account
// Body: { phone, otpCode, newPassword }
// Response 200: { message, user: { _id, email, name, role, phoneNumber, school, isActive }, authToken }
// Errores comunes:
//   400 invalid   → código inválido/expirado (defense-in-depth: re-valida)
//   400 password  → password muy corta (<8)
//   409 conflict  → la cuenta ya está activa
export const completeActivation = async ({ phone, otpCode, newPassword }) => {
  try {
    const response = await api.post(ENDPOINTS.complete, {
      phone,
      otpCode,
      newPassword,
    });

    const { authToken, user, message } = response.data || {};
    if (!authToken || !user) {
      return { success: false, message: 'Respuesta inválida del servidor.' };
    }

    // Normalización: el backend devuelve _id (convención MongoDB),
    // pero el resto de la app espera `id` (convención JS). El
    // login flow ya hace esta normalización en authService.payloadToAppUser
    // porque decodifica un JWT que tiene _id. Aquí lo hacemos
    // manualmente porque el user viene en el body de la response,
    // no en un JWT.
    const normalizedUser = { ...user, id: user._id };

    return {
      success: true,
      user: normalizedUser,
      authToken,
      message: message || 'Cuenta activada correctamente.',
    };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 400) {
      // Distinguimos entre código inválido y password corta para
      // que el front pueda mostrar el mensaje correcto en cada caso.
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
    if (status === 409) {
      return {
        success: false,
        message: 'Esta cuenta ya está activa. Inicia sesión.',
        reason: 'already_active',
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
      message: 'No se pudo completar la activación. Inténtalo de nuevo.',
    };
  }
};
