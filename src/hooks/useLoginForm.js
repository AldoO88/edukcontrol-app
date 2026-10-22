// =====================================================================
// useLoginForm.js
// ---------------------------------------------------------------------
// Hook específico para la pantalla de Login. Encapsula:
//   - Estado de los campos (phone, password).
//   - Validación (celular de 10 dígitos, longitud password).
//   - Submit contra useAuth().login con manejo de errores.
// Se apoya en useForm para la parte genérica y solo añade la
// lógica específica del login.
//
// =====================================================================
// CELULAR COMO IDENTIFICADOR
// ---------------------------------------------------------------------
// Anteriormente el login era email + password. Ahora es celular +
// password, alineado con el flow de activación (que también trabaja
// con celular). Esto simplifica el modelo: el celular es el único
// identificador del usuario, y la contraseña es el segundo factor.
// =====================================================================

// useCallback para memoizar funciones.
import { useCallback } from 'react';

// useForm base.
import { useForm } from './useForm';

// useAuth para acceder al contexto de autenticación.
import { useAuth } from './useAuth';

// Sign in with Apple (Guideline 4.8 del App Store Review): el sheet
// nativo de Apple + el identityToken que luego verifica el backend.
// Solo se invoca desde iOS (el botón se renderiza si isAvailableAsync
// da true), pero el import es seguro en todas las plataformas.
import * as AppleAuthentication from 'expo-apple-authentication';

// Alert para mostrar mensajes nativos al usuario.
import { Alert } from 'react-native';

// Regex de validación de celular: exactamente 10 dígitos.
// Misma regla que el flow de activación (app/(auth)/activation).
const PHONE_REGEX = /^\d{10}$/;

// Longitud mínima de la contraseña. No revelamos la regla exacta
// por seguridad (sería info útil para un atacante).
const MIN_PASSWORD_LENGTH = 6;

// validateLogin: función pura de validación. Recibe los values y
// devuelve un objeto { field: 'mensaje' } con los errores.
// Separarla del hook permite testearla de forma aislada.
const validateLogin = (values) => {
  const errors = {};
  // Limpiamos espacios al inicio/final (común en copy-paste).
  const cleanPhone = (values.phone || '').trim();
  const cleanPassword = (values.password || '').trim();

  // Campo obligatorio.
  if (!cleanPhone) {
    errors.phone = 'El número de celular es obligatorio.';
  } else if (!PHONE_REGEX.test(cleanPhone)) {
    // PHONE_REGEX.test exige exactamente 10 dígitos. El filtro
    // de no-dígitos en LoginForm.jsx ya descarta letras/espacios,
    // pero dejamos el check por defensa.
    errors.phone = 'Ingresa un número de 10 dígitos.';
  }

  if (!cleanPassword) {
    errors.password = 'La contraseña es obligatoria.';
  } else if (cleanPassword.length < MIN_PASSWORD_LENGTH) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres.';
  }

  return errors;
};

// El hook devuelve la misma forma que useForm más un submit
// específico que delega en useAuth.
//
// `remember` (booleano) — controla la vida del refresh token:
//   - true  → access (15 min) + refresh (30 d) en SecureStore → sesión
//     persistente entre reinicios de la app hasta expirar o logout.
//   - false → solo access persistido; refresh NO se guarda → la sesión
//     termina a los 15 minutos o al reinstalar la app.
// La web no tiene este hook (su login es always remember=true).
export const useLoginForm = () => {
  // Extraemos login, loginWithApple y isLoading del contexto de auth.
  const { login, loginWithApple, isLoading: isAuthLoading } = useAuth();

  // useForm con valores iniciales vacíos y la validación específica.
  const form = useForm(
    { phone: '', password: '' },
    validateLogin,
  );

  // handleSubmit: orquestación específica del login.
  // Acepta `remember` desde el componente que lo llama (el checkbox
  // "Recordar mi sesión" del LoginForm). El caller lo pasa en el
  // momento del submit, así que no hay stale-closure.
  const handleSubmit = useCallback(
    async (remember) => {
      const rememberFlag = !!remember;
      // Ejecutamos el submit. useForm ya validará internamente.
      return form.handleSubmit(async (values) => {
        try {
          // Llamamos al login del contexto con celular + password + remember.
          const result = await login(values.phone.trim(), values.password, rememberFlag);
          // Si success === false, mostramos el mensaje del backend.
          if (!result?.success) {
            Alert.alert(
              'No se pudo iniciar sesión',
              result?.message || 'Verifica tus credenciales e inténtalo de nuevo.',
            );
          }
          // Retornamos el resultado para que el caller pueda actuar.
          return result;
        } catch (error) {
          // Caso defensivo: error de red no manejado.
          console.error('[useLoginForm] Error inesperado en login:', error);
          Alert.alert(
            'Error',
            'Ocurrió un problema inesperado. Inténtalo de nuevo.',
          );
          return { success: false, message: 'unexpected_error' };
        }
      });
    },
    [form, login],
  );

  // handleSubmitApple: flujo de Sign in with Apple (Guideline 4.8).
  //   1. Abre el sheet nativo de Apple (signInAsync) pidiendo correo +
  //      nombre — Apple permite al usuario ocultar el correo (relay),
  //      uno de los 3 requisitos de la guía.
  //   2. Con el identityToken (JWT de Apple) llama a loginWithApple
  //      (AuthContext → POST /auth/apple → persistSession).
  //   3. Éxito → los Redirect declarativos redirigen solos; fallo →
  //      Alert con el mensaje del backend (en español).
  // Cancelación del usuario (cierre del sheet): silencio, NO es error.
  // `remember` llega del mismo checkbox "Recordar mi sesión".
  const handleSubmitApple = useCallback(
    async (remember) => {
      const rememberFlag = !!remember;
      try {
        // Sheet nativo. Solo los scopes que el backend aprovecha
        // (correo para vincular la cuenta); el nombre NO se usa
        // (la cuenta ya existe, la da de alta el admin) pero se pide
        // porque Apple solo lo entrega en el PRIMER consentimiento y
        // puede servir para personalización futura sin volver a
        // pedirlo. Si el usuario lo deniega viene null y no pasa nada.
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        // Sin identityToken no hay forma de verificar la identidad en
        // el backend (caso raro: Apple a veces lo omite) → error claro.
        if (!credential?.identityToken) {
          Alert.alert(
            'No se pudo iniciar sesión',
            'Apple no devolvió una credencial válida. Inténtalo de nuevo.',
          );
          return { success: false, message: 'missing_identity_token' };
        }

        // POST /auth/apple + persistencia de sesión (mismo camino
        // declarativo que el login normal).
        const result = await loginWithApple(credential.identityToken, rememberFlag);
        if (!result?.success) {
          Alert.alert(
            'No se pudo iniciar sesión',
            result?.message || 'Inténtalo de nuevo.',
          );
        }
        return result;
      } catch (error) {
        // El usuario cerró el sheet: retorno silencioso (no Alert).
        if (error?.code === 'ERR_REQUEST_CANCELED') {
          return { success: false, message: 'canceled' };
        }
        // Cualquier otro fallo (red, backend, error nativo inesperado).
        console.error('[useLoginForm] Error en Sign in with Apple:', error);
        Alert.alert(
          'Error',
          'No se pudo iniciar sesión con Apple. Inténtalo de nuevo.',
        );
        return { success: false, message: 'apple_error' };
      }
    },
    [loginWithApple],
  );

  // isSubmitting: flag combinado (form + auth). Si el contexto
  // está cargando, también lo consideramos "submitting".
  const isSubmitting = form.isSubmitting || isAuthLoading;

  return {
    ...form,
    handleSubmit,
    handleSubmitApple,
    isSubmitting,
  };
};
