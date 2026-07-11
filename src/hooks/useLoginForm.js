// =====================================================================
// useLoginForm.js
// ---------------------------------------------------------------------
// Hook específico para la pantalla de Login. Encapsula:
//   - Estado de los campos (email, password).
//   - Validación (campos vacíos, formato email, longitud password).
//   - Submit contra useAuth().login con manejo de errores.
// Se apoya en useForm para la parte genérica y solo añade la
// lógica específica del login.
// =====================================================================

// useCallback para memoizar funciones.
import { useCallback } from 'react';

// useForm base.
import { useForm } from './useForm';

// useAuth para acceder al contexto de autenticación.
import { useAuth } from './useAuth';

// Alert para mostrar mensajes nativos al usuario.
import { Alert } from 'react-native';

// Regex de validación de email. Cubre el 99% de casos reales
// sin la complejidad de RFC 5322.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Longitud mínima de la contraseña. No revelamos la regla exacta
// por seguridad (sería info útil para un atacante).
const MIN_PASSWORD_LENGTH = 6;

// validateLogin: función pura de validación. Recibe los values y
// devuelve un objeto { field: 'mensaje' } con los errores.
// Separarla del hook permite testearla de forma aislada.
const validateLogin = (values) => {
  const errors = {};
  // Limpiamos espacios al inicio/final (común en copy-paste).
  const cleanEmail = (values.email || '').trim();
  const cleanPassword = (values.password || '').trim();

  // Campo obligatorio.
  if (!cleanEmail) {
    errors.email = 'El correo es obligatorio.';
  } else if (!EMAIL_REGEX.test(cleanEmail)) {
    errors.email = 'El correo no tiene un formato válido.';
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
export const useLoginForm = () => {
  // Extraemos login y isLoading del contexto de auth.
  const { login, isLoading: isAuthLoading } = useAuth();

  // useForm con valores iniciales vacíos y la validación específica.
  const form = useForm(
    { email: '', password: '' },
    validateLogin,
  );

  // handleSubmit: orquestación específica del login.
  // Usa el form.handleSubmit de useForm, pero añade la llamada a
  // useAuth().login y el manejo de errores/éxito.
  const handleSubmit = useCallback(async () => {
    // Ejecutamos el submit. useForm ya validará internamente.
    // Si pasa la validación, llama a onValid(values).
    return form.handleSubmit(async (values) => {
      try {
        // Llamamos al login del contexto. Si todo va bien, AppNavigator
        // detecta el cambio de user y navega automáticamente.
        const result = await login(values.email.trim(), values.password);
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
  }, [form, login]);

  // isSubmitting: flag combinado (form + auth). Si el contexto
  // está cargando, también lo consideramos "submitting".
  const isSubmitting = form.isSubmitting || isAuthLoading;

  return {
    ...form,
    handleSubmit,
    isSubmitting,
  };
};
