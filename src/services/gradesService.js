// =====================================================================
// gradesService.js
// ---------------------------------------------------------------------
// Capa de servicio para los endpoints de CALIFICACIONES y HORARIO
// del tutor. Se compone de 2 endpoints:
//
//   1. GET /api/guardians/me/students/:studentId/grades
//      Devuelve { student_id, relationship, grades_matrix, summary }
//      — las calificaciones del alumno por materia y trimestre.
//
//   2. GET /api/guardians/me/students/:studentId/schedule
//      Devuelve { student_id, school_year, group, shift_info, schedule }
//      — el horario semanal del alumno.
// =====================================================================
// MANEJO DE ERRORES
// ---------------------------------------------------------------------
// Mismo patrón que conductService: las funciones NO lanzan
// excepciones. Devuelven { success, data? , message? }.
// =====================================================================

// Cliente axios.
import api from './api';

// ---------------------------------------------------------------------
// getStudentGrades(studentId, options)
// ---------------------------------------------------------------------
// GET /api/guardians/me/students/:studentId/grades
// Path param: studentId (ObjectId del alumno)
// Query params (todos opcionales):
//   - school_year_id=<id> → filtra por ciclo escolar
// Response 200:
//   { student_id, relationship, grades_matrix, summary }
// Errores comunes:
//   404 → student no encontrado / no pertenece al tutor
//   401 → token inválido (manejado en api.js)
export const getStudentGrades = async (studentId, options = {}) => {
  if (!studentId) {
    return {
      success: false,
      message: 'Falta el id del alumno.',
    };
  }

  // Construimos los query params con URLSearchParams.
  const params = new URLSearchParams();
  if (options.schoolYearId) {
    params.append('school_year_id', options.schoolYearId);
  }

  const queryString = params.toString();
  const url = `/api/guardians/me/students/${studentId}/grades${
    queryString ? `?${queryString}` : ''
  }`;

  try {
    const response = await api.get(url);
    return {
      success: true,
      data: response.data?.data ?? response.data,
    };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 404) {
      return {
        success: false,
        message: serverMessage || 'No se encontraron calificaciones para este alumno.',
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
      message: serverMessage || 'No se pudieron cargar las calificaciones.',
    };
  }
};

// ---------------------------------------------------------------------
// getStudentSchedule(studentId, options)
// ---------------------------------------------------------------------
// GET /api/guardians/me/students/:studentId/schedule
// Path param: studentId (ObjectId del alumno)
// Query params (todos opcionales):
//   - school_year_id=<id> → filtra por ciclo escolar
// Response 200:
//   { student_id, school_year, group, shift_info, schedule }
// Errores comunes: 404 (idem grades).
export const getStudentSchedule = async (studentId, options = {}) => {
  if (!studentId) {
    return {
      success: false,
      message: 'Falta el id del alumno.',
    };
  }

  const params = new URLSearchParams();
  if (options.schoolYearId) {
    params.append('school_year_id', options.schoolYearId);
  }

  const queryString = params.toString();
  const url = `/api/guardians/me/students/${studentId}/schedule${
    queryString ? `?${queryString}` : ''
  }`;

  try {
    const response = await api.get(url);
    return {
      success: true,
      data: response.data?.data ?? response.data,
    };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 404) {
      return {
        success: false,
        message: serverMessage || 'No se encontró el horario para este alumno.',
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
      message: serverMessage || 'No se pudo cargar el horario escolar.',
    };
  }
};
