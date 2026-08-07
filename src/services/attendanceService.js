// =====================================================================
// attendanceService.js
// ---------------------------------------------------------------------
// Capa de servicio para los endpoints de ASISTENCIA del tutor.
// Se compone de 2 endpoints:
//
//   1. GET /api/guardians/me/students/:studentId/attendance/summary
//      Devuelve resumen general: percentage, total_assists,
//      total_absences, total_delays, recent_absences.
//
//   2. GET /api/guardians/me/students/:studentId/attendance/history
//      Devuelve historial día por día: entry, exit, status.
// =====================================================================
// MANEJO DE ERRORES
// ---------------------------------------------------------------------
// Mismo patrón que conductService / gradesService: las funciones
// NO lanzan excepciones. Devuelven { success, data? , message? }.
// =====================================================================

// Cliente axios.
import api from './api';

// ---------------------------------------------------------------------
// getAttendanceSummary(studentId, options)
// ---------------------------------------------------------------------
// GET /api/guardians/me/students/:studentId/attendance/summary
// Path param: studentId (ObjectId del alumno)
// Query params (todos opcionales):
//   - school_year_id=<id>  → filtra por ciclo escolar
//   - late_threshold=HH:MM → hora de corte para considerar retardo
// Response 200:
//   { student_id, school_year, summary, recent_absences }
// Errores comunes:
//   404 → student no encontrado / no pertenece al tutor
//   401 → token inválido (manejado en api.js)
export const getAttendanceSummary = async (studentId, options = {}) => {
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
  if (options.lateThreshold) {
    params.append('late_threshold', options.lateThreshold);
  }

  const queryString = params.toString();
  const url = `/api/guardians/me/students/${studentId}/attendance/summary${
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
        message: serverMessage || 'No se encontró el resumen de asistencia para este alumno.',
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
      message: serverMessage || 'No se pudo cargar el resumen de asistencia.',
    };
  }
};

// ---------------------------------------------------------------------
// getAttendanceHistory(studentId, options)
// ---------------------------------------------------------------------
// GET /api/guardians/me/students/:studentId/attendance/history
// Path param: studentId (ObjectId del alumno)
// Query params (todos opcionales):
//   - school_year_id=<id>  → filtra por ciclo escolar
//   - days=<number>        → cantidad de días a traer (default: 30)
//   - late_threshold=HH:MM → hora de corte para considerar retardo
// Response 200:
//   { student_id, school_year, days_requested, history }
// Errores comunes: 404 (idem summary).
export const getAttendanceHistory = async (studentId, options = {}) => {
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
  if (options.days) {
    params.append('days', String(options.days));
  }
  if (options.lateThreshold) {
    params.append('late_threshold', options.lateThreshold);
  }

  const queryString = params.toString();
  const url = `/api/guardians/me/students/${studentId}/attendance/history${
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
        message: serverMessage || 'No se encontró el historial de asistencia para este alumno.',
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
      message: serverMessage || 'No se pudo cargar el historial de asistencia.',
    };
  }
};
