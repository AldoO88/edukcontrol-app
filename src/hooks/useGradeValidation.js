// =====================================================================
// useGradeValidation.js
// ---------------------------------------------------------------------
// Hook que carga los datos de VALIDACIÓN DE CALIFICACIONES del maestro
// para un período específico (trimestre). Se usa en la pantalla
// "Validación de Calificaciones" del tab bar del maestro.
//
// Encapsula:
//   - Fetch inicial cuando cambia el `gradingPeriodId`.
//   - Refetch cuando la pantalla vuelve a foco (useFocusEffect).
//   - Loading state, error state, refetch manual.
//
// Uso:
//   const { data, isLoading, error, refetch } =
//     useGradeValidation(selectedPeriodId);
//
//   // data shape:
//   // {
//   //   gradingPeriod: { _id, name, order, isClosed, ... },
//   //   progress: { totalGroups, closedGroups, percentage },
//   //   groups: [
//   //     {
//   //       _id, group: {...}, subject: {...}, average, status,
//   //       closedAt, actaUrl,
//   //       studentStats: { totalStudents, failedCount, atRiskCount, ungradedCount }
//   //     },
//   //     ...
//   //   ]
//   // }
//
// Si `gradingPeriodId` es null/undefined, el hook NO fetchea (data
// permanece en null, isLoading en false).
// =====================================================================

// React hooks.
import { useState, useEffect, useRef, useCallback } from 'react';

// useFocusEffect de expo-router (refetch al volver a foco).
import { useFocusEffect } from 'expo-router';

// Servicio.
import { getGradeValidation } from '../services/teacherService';

export const useGradeValidation = (gradingPeriodId) => {
  // -----------------------------------------------------------------
  // STATE
  // -----------------------------------------------------------------
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------
  // REFS
  // -----------------------------------------------------------------
  // Mirror del id para que `fetchData` (con deps vacías) pueda
  // leerlo siempre actualizado.
  const gradingPeriodIdRef = useRef(gradingPeriodId);
  gradingPeriodIdRef.current = gradingPeriodId;

  // Guard anti-concurrencia: si ya hay un fetch en curso, los
  // siguientes se ignoran silenciosamente.
  const inFlightRef = useRef(false);

  // -----------------------------------------------------------------
  // fetchData: hace el GET /grades/validation.
  // -----------------------------------------------------------------
  const fetchData = useCallback(async () => {
    const currentId = gradingPeriodIdRef.current;
    if (!currentId) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getGradeValidation(currentId);

      // Solo aplicamos el resultado si el id no cambió mientras
      // esperábamos (evita pisar datos del período más reciente).
      if (gradingPeriodIdRef.current !== currentId) {
        return;
      }

      if (!result.success) {
        setError(result.message);
        setData(null);
      } else {
        setData(result.data);
        setError(null);
      }
    } catch (err) {
      console.error('[useGradeValidation] unexpected error:', err);
      setError('Error inesperado al cargar la validación.');
      setData(null);
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, []); // DEPS VACÍAS — clave para evitar loops.

  // -----------------------------------------------------------------
  // EFECTO: cuando cambia el id, reseteamos y refetchamos.
  // -----------------------------------------------------------------
  useEffect(() => {
    setData(null);
    setError(null);
    if (gradingPeriodId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradingPeriodId]);

  // -----------------------------------------------------------------
  // useFocusEffect: re-fetchea cuando la pantalla gana foco.
  // -----------------------------------------------------------------
  // Útil cuando el maestro navega al detalle del grupo y vuelve,
  // o cuando crea/modifica una calificación en otra pantalla.
  useFocusEffect(
    useCallback(() => {
      if (gradingPeriodIdRef.current) {
        fetchData();
      }
    }, [fetchData]),
  );

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
};

export default useGradeValidation;
