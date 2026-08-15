// =====================================================================
// useGroupStudents.js
// ---------------------------------------------------------------------
// Hook que carga la lista de alumnos de un grupo específico para
// tomar asistencia. Se llama con el groupId y subjectId, y retorna
// la info del grupo, la lista de alumnos, el total y el subject_id.
// =====================================================================

// React hooks.
import { useState, useCallback } from 'react';

// Servicio de teacher.
import { getGroupStudents } from '../services/teacherService';

export const useGroupStudents = (groupId, subjectId) => {
  // data: { group, students, total, subject_id } o null.
  const [data, setData] = useState(null);
  // isLoading: true durante el fetch.
  const [isLoading, setIsLoading] = useState(false);
  // error: mensaje de error si la carga falló.
  const [error, setError] = useState(null);

  // ---------------------------------------------------------------------
  // fetchStudents: carga los alumnos del grupo.
  // ---------------------------------------------------------------------
  const fetchStudents = useCallback(async () => {
    if (!groupId) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getGroupStudents(groupId, subjectId);
      if (!result.success) {
        setError(result.message);
        setData(null);
      } else {
        setData(result.data);
        setError(null);
      }
    } catch (err) {
      console.error('[useGroupStudents] unexpected error:', err);
      setError('Error inesperado al cargar los alumnos.');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, subjectId]);

  return { data, isLoading, error, fetchStudents };
};
