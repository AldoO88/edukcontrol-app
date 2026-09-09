// =====================================================================
// authService.js
// ---------------------------------------------------------------------
// Capa de servicio para endpoints de autenticación del backend.
// Encapsula las llamadas HTTP relacionadas con login/logout/verificar
// sesión y deja a AuthContext (en React) la responsabilidad de
// persistir el token y actualizar el estado.
// =====================================================================

// Instancia de axios configurada (interceptor JWT incluido).
import api from './api';

// Helpers para decodificar el JWT y validar su expiración.
import { decodeJwtPayload, isJwtExpired } from '../utils/jwt';

// Mapea un payload JWT decodificado a la forma "user" que consume
// la app. El backend firma el token con { _id, email, name, role };
// desde que unificamos los roles en inglés ('teacher' | 'parent'),
// "role" ya viene canónico y NO requiere traducción en el front.
// Si en el futuro el backend vuelve a cambiar el contrato, este
// es el ÚNICO punto donde habría que intervenir.
const payloadToAppUser = (payload) => {
  // Si el payload es inválido o está expirado, devolvemos null.
  if (!payload || isJwtExpired(payload)) return null;

  // Devolvemos la forma que la app espera. Usamos _id como id y
  // mantenemos email/name originales. role pasa tal cual porque
  // ya viene en el formato canónico de la app.
  return {
    id: payload._id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };
};

// login: hace POST /auth/login con phone+password. Devuelve
// { success, user, message }. El caller (AuthContext) se encarga
// de persistir el token.
//
// =====================================================================
// CELULAR COMO IDENTIFICADOR
// ---------------------------------------------------------------------
// Anteriormente el login era email + password. Ahora es phone +
// password, alineado con el flow de activación. El backend debe
// esperar el campo "phone" en el body del POST /auth/login.
// =====================================================================
export const login = async (phone, password) => {
  try {
    // DEBUG: log de lo que llega a authService. Si aquí el phone
    // ya viene vacío, el bug está en useLoginForm/useForm (no
    // nos llega el valor). Si aquí viene bien, el bug está en
    // axios o en la red.
    console.log('[DEBUG authService] login() params:', {
      phone,
      phoneLen: phone?.length,
      passwordLen: password?.length,
    });

    // Petición al endpoint real del backend.
    // El backend responde { authToken: "eyJ..." }.
    const response = await api.post('/auth/login', {
      // El celular se envía tal cual llega del form (10 dígitos).
      // No aplicamos lowercase ni trim agresivo: el celular es
      // numérico, no tiene casing ni espacios significativos, pero
      // trim() elimina espacios accidentales al inicio/final.
      phone: String(phone || '').trim(),
      password,
    });

    // Extraemos el token de la respuesta. Si no viene, es un error
    // de contrato del backend.
    const authToken = response.data?.authToken;
    if (!authToken) {
      return {
        success: false,
        message: 'Respuesta inválida del servidor.',
      };
    }

    // Decodificamos el payload del JWT para extraer los datos del
    // usuario (id, name, role, etc.). Como el token no fue firmado
    // por nosotros, técnicamente no podemos confiar en él sin
    // re-verificar contra el backend; pero para el flujo de login
    // asumimos que si el backend nos dio un token válido, su
    // contenido es fiable.
    const payload = decodeJwtPayload(authToken);
    const user = payloadToAppUser(payload);

    // Si el payload no se pudo decodificar o el token está
    // expirado, devolvemos un error claro.
    if (!user) {
      return {
        success: false,
        message: 'Token inválido o expirado.',
      };
    }

    // Devolvemos éxito con el user mapeado y el token. AuthContext
    // persiste el token y actualiza el estado.
    console.log('[authService] login exitoso:', user);
    return { success: true, user, authToken };
  } catch (error) {
    // Mapear errores HTTP a mensajes amigables. El backend usa:
    //   404 → "Phone is not registered."
    //   401 → "Incorrect password." / "This account is deactivated..."
    //   500 → error de servidor.
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 404) {
      return { success: false, message: 'El número de celular no está registrado.' };
    }
    if (status === 401) {
      // 401 puede ser "contraseña incorrecta" o "cuenta desactivada".
      // Mostramos el mensaje del backend si existe, sino uno genérico.
      return {
        success: false,
        message: serverMessage || 'Celular o contraseña incorrectos.',
      };
    }
    if (status === 400) {
      return { success: false, message: serverMessage || 'Datos inválidos.' };
    }
    if (error?.code === 'ECONNABORTED') {
      return { success: false, message: 'La petición tardó demasiado. Inténtalo de nuevo.' };
    }
    // Errores de red (sin respuesta del servidor).
    if (!error?.response) {
      return {
        success: false,
        message: 'No se pudo conectar con el servidor. Verifica tu conexión.',
      };
    }
    // Cualquier otro caso.
    return {
      success: false,
      message: serverMessage || 'No fue posible iniciar sesión.',
    };
  }
};

// verify: hace GET /auth/verify para revalidar el token contra el
// backend. Útil al restaurar la sesión para asegurarnos de que el
// token guardado sigue siendo válido. Devuelve el user mapeado o null.
export const verify = async () => {
  try {
    // El endpoint devuelve req.payload (el JWT decodificado) si el
    // token es válido. Si no, devuelve 401.
    const response = await api.get('/auth/verify');
    const user = payloadToAppUser(response.data);
    return user;
  } catch (error) {
    // Si el token expiró o fue revocado, devolvemos null.
    return null;
  }
};

/**
 * Cambiar contraseña del usuario autenticado.
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {{ success: boolean, message?: string, error?: string }}
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    await api.put('/auth/change-password', { currentPassword, newPassword });
    return { success: true, message: 'Contraseña actualizada correctamente.' };
  } catch (error) {
    if (error.response) {
      return { success: false, error: error.response.data?.message || 'Error al cambiar la contraseña.' };
    }
    return { success: false, error: 'No se pudo conectar al servidor. Intenta de nuevo.' };
  }
};

// Export default como objeto con todos los métodos. Esto facilita
// la importación en AuthContext: "import authService from '...'".
const authService = {
  login,
  verify,
  changePassword,
};

export default authService;
