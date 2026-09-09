// =====================================================================
// useChangePassword.js
// ---------------------------------------------------------------------
// Hook que encapsula la lógica del formulario de cambio de contraseña:
//   - Estado de los campos (currentPassword, newPassword, confirmPassword).
//   - Validación de reglas (longitud, coincidencia, diferencia con la actual).
//   - Llamada al servicio changePassword.
//   - Manejo de errores del backend y estados de carga.
// Separa la lógica del componente visual para que change-password.jsx
// solo se preocupe de renderizar la UI.
// =====================================================================

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { changePassword } from '@/src/services/authService';

// Valores iniciales del formulario.
const INITIAL_VALUES = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

// =====================================================================
// validateChangePassword
// ---------------------------------------------------------------------
// Función de validación para useForm. Recibe el objeto values y
// devuelve un objeto { campo: 'mensaje' } con los errores.
// Si devuelve {}, la validación pasa.
// =====================================================================
const validateChangePassword = (values) => {
  const errors = {};

  // Contraseña actual requerida.
  if (!values.currentPassword?.trim()) {
    errors.currentPassword = 'La contraseña actual es obligatoria.';
  }

  // Nueva contraseña requerida.
  if (!values.newPassword?.trim()) {
    errors.newPassword = 'La nueva contraseña es obligatoria.';
  } else if (values.newPassword.length < 8) {
    errors.newPassword = 'Debe tener al menos 8 caracteres.';
  } else if (values.newPassword === values.currentPassword) {
    errors.newPassword = 'La nueva contraseña debe ser diferente a la actual.';
  }

  // Confirmación requerida y debe coincidir.
  if (!values.confirmPassword?.trim()) {
    errors.confirmPassword = 'Confirma tu nueva contraseña.';
  } else if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  return errors;
};

// =====================================================================
// useChangePassword
// ---------------------------------------------------------------------
// Retorna:
//   - values, errors: estado del formulario (para inputs y mensajes).
//   - handleChange: actualiza un campo y limpia su error.
//   - handleSubmit: valida + llama al servicio + muestra Alert + retrocede.
//   - isSubmitting: true mientras se procesa el submit (para deshabilitar botón).
// =====================================================================
export const useChangePassword = () => {
  const router = useRouter();

  // Estado del formulario usando useState directo (no useForm) para
  // tener control explícito sobre values, errors e isSubmitting.
  const [values, setValues] = useState({ ...INITIAL_VALUES });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // handleChange: actualiza un campo y limpia su error.
  const handleChange = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo al escribir.
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  // handleSubmit: valida, llama al servicio, maneja respuesta.
  const handleSubmit = useCallback(async () => {
    // No permitir doble submit.
    if (isSubmitting) return;

    // Validar campos.
    const validationErrors = validateChangePassword(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const result = await changePassword(values.currentPassword, values.newPassword);

      if (result.success) {
        Alert.alert('Éxito', result.message, [
          { text: 'OK', onPress: () => router.back() },
        ]);
        // Limpiar formulario tras éxito.
        setValues({ ...INITIAL_VALUES });
        setErrors({});
      } else {
        // Mostrar error del backend como error general del formulario.
        setErrors({ general: result.error });
      }
    } catch {
      setErrors({ general: 'Ocurrió un error inesperado. Intenta de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, isSubmitting, router]);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
  };
};
