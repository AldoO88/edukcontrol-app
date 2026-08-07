// =====================================================================
// conductService.js
// ---------------------------------------------------------------------
// Capa de servicio para los endpoints de CONDUCTA del tutor.
// Se compone de 2 endpoints (especificación julio 2026):
//
//   1. GET /api/guardians/me/students/:studentId/conduct-summary
//      Devuelve { currentScore, maxScore, recentLogs } — lo que
//      se muestra en la card de "Puntaje Actual".
//
//   2. GET /api/guardians/me/students/:studentId/conduct-logs
//      Devuelve { student_id, items[], total } — la lista de
//      faltas y méritos del trimestre activo.
// =====================================================================
// MANEJO DE ERRORES
// ---------------------------------------------------------------------
// Mismo patrón que activationService / guardianService: las funciones
// NO lanzan excepciones. Devuelven { success, data? , message? }.
// El api.js centraliza el manejo de 401 (token expirado). El resto
// de status codes se mapean a mensajes amigables en español aquí.
// =====================================================================

// Cliente axios.
import api from './api';

// ---------------------------------------------------------------------
// getConductSummary(studentId)
// ---------------------------------------------------------------------
// GET /api/guardians/me/students/:studentId/conduct-summary
// Path param: studentId (ObjectId del alumno)
// Response 200:
//   { success: true, data: { currentScore, maxScore, recentLogs } }
// Errores comunes:
//   404 → student no encontrado / no pertenece al tutor
//   401 → token inválido (manejado en api.js)
export const getConductSummary = async (studentId) => {
  if (!studentId) {
    return {
      success: false,
      message: 'Falta el id del alumno.',
    };
  }
  try {
    const response = await api.get(
      `/api/guardians/me/students/${studentId}/conduct-summary`,
    );
    return { success: true, data: response.data?.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 404) {
      return {
        success: false,
        message: serverMessage || 'No se encontró información de conducta para este alumno.',
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
      message: serverMessage || 'No se pudo cargar el puntaje de conducta.',
    };
  }
};

// ---------------------------------------------------------------------
// getConductLogs(studentId, options)
// ---------------------------------------------------------------------
// GET /api/guardians/me/students/:studentId/conduct-logs
// Path param: studentId (ObjectId del alumno)
// Query params (todos opcionales):
//   - eventType=demerit|merit → filtra por tipo
//   - school_year_id=<id>   → filtra por ciclo (default: activo)
//   - include_cancelled=true → incluye cancelados
// Response 200:
//   { student_id, items[], total }
// Errores comunes: 404 (idem summary).
export const getConductLogs = async (studentId, options = {}) => {
  if (!studentId) {
    return {
      success: false,
      message: 'Falta el id del alumno.',
    };
  }

  // Construimos los query params con URLSearchParams (built-in en
  // RN/Hermes desde RN 0.72). Si no hay params, la URL queda
  // limpia sin "?" suelto.
  const params = new URLSearchParams();
  if (options.eventType) params.append('eventType', options.eventType);
  if (options.schoolYearId) {
    params.append('school_year_id', options.schoolYearId);
  }
  if (options.includeCancelled) {
    params.append('include_cancelled', 'true');
  }

  const queryString = params.toString();
  const url = `/api/guardians/me/students/${studentId}/conduct-logs${
    queryString ? `?${queryString}` : ''
  }`;

  try {
    const response = await api.get(url);
    return {
      success: true,
      data: {
        items: response.data?.items || [],
        total: response.data?.total || 0,
      },
    };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 404) {
      return {
        success: false,
        message: serverMessage || 'No se encontraron reportes para este alumno.',
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
      message: serverMessage || 'No se pudo cargar el historial de conducta.',
    };
  }
};
