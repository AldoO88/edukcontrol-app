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
  // Extraemos login y isLoading del contexto de auth.
  const { login, isLoading: isAuthLoading } = useAuth();

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

  // isSubmitting: flag combinado (form + auth). Si el contexto
  // está cargando, también lo consideramos "submitting".
  const isSubmitting = form.isSubmitting || isAuthLoading;

  return {
    ...form,
    handleSubmit,
    isSubmitting,
  };
};
