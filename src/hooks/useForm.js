// =====================================================================
// useForm.js
// ---------------------------------------------------------------------
// Hook genérico para manejar el estado de un formulario. Centraliza:
//   - Los valores de los campos (values).
//   - Los errores de validación (errors).
//   - El estado de envío (isSubmitting).
//   - Helpers para cambiar, validar y resetear.
// Separa la lógica del formulario del componente visual para que
// cualquier pantalla pueda reutilizar el mismo flujo.
// =====================================================================

// useState y useCallback. useRef no se necesita aquí.
import { useState, useCallback } from 'react';

// El hook acepta dos argumentos:
//   - initialValues: objeto con los valores iniciales del formulario.
//   - validate: función opcional que recibe values y devuelve un
//     objeto { campo: 'mensaje' } con los errores (o {} si todo OK).
// Devuelve un objeto con:
//   - values, errors, isSubmitting.
//   - handleChange(field, value): actualiza un campo.
//   - handleSubmit(onValid): valida y, si no hay errores, ejecuta
//     onValid(values). Devuelve Promise<boolean>.
//   - setFieldValue / setValues: setters directos.
//   - reset(): vuelve a los valores iniciales.
export const useForm = (initialValues = {}, validate = null) => {
  // Estado de los valores. Inicia con una copia del initialValues
  // para evitar que mutaciones externas afecten el formulario.
  const [values, setValues] = useState({ ...initialValues });

  // Estado de los errores. Objeto { campo: 'mensaje' }.
  // Inicia vacío (sin errores).
  const [errors, setErrors] = useState({});

  // Bandera de envío. El consumidor la usa para deshabilitar el
  // botón y mostrar un spinner mientras se procesa el submit.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // handleChange: actualiza un campo. Limpia el error de ese campo
  // automáticamente para que la UI reaccione al escribir.
  const handleChange = useCallback((field, value) => {
    // Forma funcional de setState: basarse en el estado previo
    // evita race conditions con actualizaciones rápidas.
    setValues((prev) => ({ ...prev, [field]: value }));
    // Limpiamos el error del campo tocado. Si el usuario acaba de
    // empezar a escribir, no tiene sentido seguir mostrando el error
    // antiguo. Esto es una convención común de UX de formularios.
    setErrors((prev) => {
      // Si no hay error para este campo, devolvemos el mismo objeto
      // (misma referencia) para no provocar re-render innecesario.
      if (!prev[field]) return prev;
      // Construimos un nuevo objeto sin la clave del campo.
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  // setValues: setter completo, útil para casos como "cargar datos
  // desde el backend en un formulario de edición".
  const setAllValues = useCallback((newValues) => {
    setValues({ ...newValues });
    setErrors({});
  }, []);

  // setFieldValue: atajo para setValues con un solo campo.
  const setFieldValue = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  // reset: vuelve al estado inicial.
  const reset = useCallback(() => {
    setValues({ ...initialValues });
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  // validateCurrent: corre la función de validación sobre los
  // valores actuales. Devuelve true si pasó la validación.
  const validateCurrent = useCallback(() => {
    // Si no hay función de validación, siempre pasa.
    if (typeof validate !== 'function') {
      setErrors({});
      return true;
    }
    // Ejecutamos la validación externa. Esperamos un objeto de
    // errores. Si devuelve null/undefined, lo normalizamos a {}.
    const result = validate(values) || {};
    setErrors(result);
    // La validación pasa si el objeto de errores está vacío.
    return Object.keys(result).length === 0;
  }, [values, validate]);

  // handleSubmit: orquesta el submit. Si pasa la validación,
  // ejecuta onValid(values). Devuelve true si se ejecutó el callback
  // (útil para que el caller sepa si continuar o no).
  const handleSubmit = useCallback(
    async (onValid) => {
      // No permitimos doble submit.
      if (isSubmitting) return false;
      // Validamos primero.
      const isValid = validateCurrent();
      if (!isValid) return false;
      // Activamos spinner.
      setIsSubmitting(true);
      try {
        // Ejecutamos el callback externo. Si devuelve una promesa,
        // esperamos a que termine.
        await onValid(values);
        return true;
      } finally {
        // Siempre desactivamos el spinner, incluso si hubo error.
        setIsSubmitting(false);
      }
    },
    [values, isSubmitting, validateCurrent],
  );

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    setFieldValue,
    setValues: setAllValues,
    handleSubmit,
    validate: validateCurrent,
    reset,
  };
};
