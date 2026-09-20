// =====================================================================
// socialWorkerService.js
// ---------------------------------------------------------------------
// Servicio HTTP para los endpoints del trabajador social.
// Todas las llamadas pasan por la instancia api (interceptor JWT).
// Reutiliza funciones de prefectService.js para operaciones compartidas
// (avisos, citatorios, conducta, pases de salida, alumnos, grupos).
// =====================================================================

import api from './api';

// ---------------------------------------------------------------------
// Funciones específicas del trabajador social (usan /api/social-worker)
// ---------------------------------------------------------------------

export const getSocialWorkerDashboard = async () => {
  try {
    const response = await api.get('/api/social-worker/dashboard');
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el dashboard.' };
  }
};

export const getSocialWorkerAttendanceSummary = async ({ periodId, groupId } = {}) => {
  try {
    const params = {};
    if (periodId) params.period_id = periodId;
    if (groupId) params.group_id = groupId;
    const response = await api.get('/api/social-worker/attendance-summary', { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el resumen.' };
  }
};

export const getGroupsSummary = async () => {
  try {
    const response = await api.get('/api/social-worker/groups-summary');
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el resumen de grupos.' };
  }
};

export const getAllTeachers = async () => {
  try {
    const response = await api.get('/api/social-worker/teachers');
    return { success: true, data: { teachers: response.data?.teachers || [] } };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getTeacherById = async (teacherId) => {
  if (!teacherId) return { success: false, message: 'Falta el id del maestro.' };
  try {
    const response = await api.get(`/api/social-worker/teachers/${teacherId}`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el maestro.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar la información del maestro.' };
  }
};

export const getTeacherScheduleById = async (teacherId) => {
  try {
    const response = await api.get(`/api/social-worker/teacher-schedule/${teacherId}`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el horario.' };
  }
};

export const getSchoolAbsences = async ({ from, to, groupId } = {}) => {
  try {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (groupId) params.group_id = groupId;
    const response = await api.get('/api/social-worker/school-absences', { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el resumen de faltas.' };
  }
};

// ---------------------------------------------------------------------
// Funciones de salud/inclusión (usan /api/students/:id/health)
// ---------------------------------------------------------------------

export const getStudentHealth = async (studentId) => {
  if (!studentId) return { success: false, message: 'Falta el id del alumno.' };
  try {
    const response = await api.get(`/api/students/${studentId}/health`);
    return { success: true, data: response.data.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el alumno.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar la ficha de salud.' };
  }
};

export const updateStudentHealth = async (studentId, data) => {
  if (!studentId) return { success: false, message: 'Falta el id del alumno.' };
  try {
    const response = await api.patch(`/api/students/${studentId}/health`, data);
    return { success: true, data: response.data.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 400) return { success: false, message: serverMessage || 'Datos inválidos.' };
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 403) return { success: false, message: serverMessage || 'No tienes permiso para editar esta ficha.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el alumno.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo actualizar la ficha de salud.' };
  }
};

// ---------------------------------------------------------------------
// Funciones de justificantes (usan /api/attendance)
// ---------------------------------------------------------------------

export const justifyAttendanceLog = async (logId, reason) => {
  if (!logId) return { success: false, message: 'Falta el id del registro de asistencia.' };
  try {
    const response = await api.put(`/api/attendance/logs/${logId}/justify`, {
      justified: true,
      justified_reason: reason || 'Justificado por trabajo social',
    });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 400) return { success: false, message: serverMessage || 'No se puede justificar este registro.' };
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 403) return { success: false, message: serverMessage || 'No tienes permiso para justificar asistencia.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el registro.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo justificar la asistencia.' };
  }
};

// ---------------------------------------------------------------------
// Funciones de pase de salida (usan /api/exit-passes)
// ---------------------------------------------------------------------

export const createExitPass = async (payload) => {
  try {
    const response = await api.post('/api/exit-passes', payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 400) return { success: false, message: serverMessage || 'Datos inválidos.' };
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el alumno.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo crear el pase de salida.' };
  }
};

export const getExitPasses = async ({ page = 1, limit = 20, student_id, from, to } = {}) => {
  try {
    const params = { page, limit };
    if (student_id) params.student_id = student_id;
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/api/exit-passes', { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar los pases de salida.' };
  }
};

export const getExitPassById = async (id) => {
  if (!id) return { success: false, message: 'Falta el id del pase de salida.' };
  try {
    const response = await api.get(`/api/exit-passes/${id}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el pase de salida.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el pase de salida.' };
  }
};

export const cancelExitPass = async (id) => {
  if (!id) return { success: false, message: 'Falta el id del pase de salida.' };
  try {
    const response = await api.patch(`/api/exit-passes/${id}/cancel`);
    return { success: true, data: response.data.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 400) return { success: false, message: serverMessage || 'El pase ya está cancelado.' };
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 403) return { success: false, message: serverMessage || 'No tienes permiso para cancelar este pase.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el pase de salida.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cancelar el pase de salida.' };
  }
};

// ---------------------------------------------------------------------
// Funciones compartidas (reutilizan la misma API que el prefecto)
// ---------------------------------------------------------------------

export const getAnnouncements = async ({
  page = 1, limit = 20, targetType, priority, sender, from, to,
} = {}) => {
  try {
    const params = { page, limit };
    if (targetType) params.targetType = targetType;
    if (priority) params.priority = priority;
    if (sender) params.sender = sender;
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/api/announcements', { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar los avisos.' };
  }
};

export const createAnnouncement = async (payload) => {
  try {
    const response = await api.post('/api/announcements', payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo crear el aviso.' };
  }
};

export const getAnnouncementById = async (id) => {
  try {
    const response = await api.get(`/api/announcements/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el aviso.' };
  }
};

export const getCitations = async ({ page = 1, limit = 20, status, type, student } = {}) => {
  try {
    const params = { page, limit };
    if (status) params.status = status;
    if (type) params.type = type;
    if (student) params.student = student;
    const response = await api.get('/api/citations', { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar los citatorios.' };
  }
};

export const createCitation = async (payload) => {
  try {
    const response = await api.post('/api/citations', payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo crear el citatorio.' };
  }
};

export const getCitationById = async (id) => {
  if (!id) return { success: false, message: 'Falta el id del citatorio.' };
  try {
    const response = await api.get(`/api/citations/${id}`);
    const body = response.data || {};
    const data = body.data ? body.data : body;
    return { success: true, data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el citatorio.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el citatorio.' };
  }
};

export const updateCitation = async (id, payload) => {
  try {
    const response = await api.put(`/api/citations/${id}`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 400) return { success: false, message: serverMessage || 'Datos inválidos.' };
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 403) return { success: false, message: serverMessage || 'No tienes permiso para editar este citatorio.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el citatorio.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo actualizar el citatorio.' };
  }
};

export const rescheduleCitation = async (id, payload) => {
  try {
    const response = await api.patch(`/api/citations/${id}/reschedule`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 400) return { success: false, message: serverMessage || 'Datos inválidos.' };
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 403) return { success: false, message: serverMessage || 'No tienes permiso para reagendar este citatorio.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el citatorio.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo reagendar el citatorio.' };
  }
};

export const cancelCitation = async (id) => {
  try {
    const response = await api.patch(`/api/citations/${id}/cancel`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 403) return { success: false, message: serverMessage || 'No tienes permiso para cancelar este citatorio.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el citatorio.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cancelar el citatorio.' };
  }
};

export const deleteCitation = async (id) => {
  try {
    const response = await api.delete(`/api/citations/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 403) return { success: false, message: serverMessage || 'No tienes permiso para eliminar este citatorio.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el citatorio.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo eliminar el citatorio.' };
  }
};

export const getConductLogs = async ({ page = 1, limit = 20, student_id, eventType, severity, status } = {}) => {
  try {
    const params = { page, limit };
    if (student_id) params.student_id = student_id;
    if (eventType) params.eventType = eventType;
    if (severity) params.severity = severity;
    if (status) params.status = status;
    const response = await api.get('/api/conduct-logs', { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar los reportes.' };
  }
};

export const createConductLog = async (payload) => {
  try {
    const response = await api.post('/api/conduct-logs', payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo crear el reporte.' };
  }
};

export const getConductLogById = async (id) => {
  if (!id) return { success: false, message: 'Falta el id del reporte.' };
  try {
    const response = await api.get(`/api/conduct-logs/${id}`);
    const body = response.data || {};
    const data = body.data ? body.data : body;
    return { success: true, data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el reporte.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el reporte.' };
  }
};

export const getGroups = async () => {
  try {
    const response = await api.get('/api/groups');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: true, data: [] };
  }
};

export const getGroupStudents = async (groupId) => {
  try {
    const response = await api.get('/api/students', {
      params: { group: groupId, limit: 100 },
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getStudents = async ({ search, group, status = 'active', page = 1, limit = 50 } = {}) => {
  try {
    const params = { page, limit };
    if (search) params.search = search;
    if (group) params.group = group;
    if (status) params.status = status;
    const response = await api.get('/api/students', { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar los alumnos.' };
  }
};

export const getStudentById = async (studentId) => {
  if (!studentId) return { success: false, message: 'Falta el id del alumno.' };
  try {
    const response = await api.get(`/api/students/${studentId}`);
    const body = response.data || {};
    const data = body.data ? body.data : body;
    return { success: true, data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el alumno.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar la ficha del alumno.' };
  }
};

export const getAttendanceLogs = async ({ group_id, student_id, event_type, status, from, to, page = 1, limit = 200 } = {}) => {
  try {
    const params = { page, limit };
    if (group_id) params.group_id = group_id;
    if (student_id) params.student_id = student_id;
    if (event_type) params.event_type = event_type;
    if (status) params.status = status;
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/api/attendance/logs', { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar la asistencia.' };
  }
};

export const getGradingPeriods = async () => {
  try {
    const response = await api.get('/api/grading-periods');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: true, data: [] };
  }
};

// =====================================================================
// ACUERDOS CON PADRES
// =====================================================================

// getAgreementsByStudent(studentId, status)
// GET /api/social-worker/students/:studentId/agreements
export const getAgreementsByStudent = async (studentId, status) => {
  if (!studentId) return { success: false, message: 'Falta el id del alumno.' };
  try {
    const params = {};
    if (status) params.status = status;
    const response = await api.get(`/api/social-worker/students/${studentId}/agreements`, { params });
    return { success: true, data: response.data };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (statusCode === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar los acuerdos.' };
  }
};

// createAgreement(studentId, data)
// POST /api/social-worker/students/:studentId/agreements
export const createAgreement = async (studentId, data) => {
  if (!studentId) return { success: false, message: 'Falta el id del alumno.' };
  try {
    const response = await api.post(`/api/social-worker/students/${studentId}/agreements`, data);
    return { success: true, data: response.data };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (statusCode === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (statusCode === 400) return { success: false, message: serverMessage || 'Datos inválidos.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo crear el acuerdo.' };
  }
};

// updateAgreement(agreementId, data)
// PATCH /api/social-worker/agreements/:id
export const updateAgreement = async (agreementId, data) => {
  if (!agreementId) return { success: false, message: 'Falta el id del acuerdo.' };
  try {
    const response = await api.patch(`/api/social-worker/agreements/${agreementId}`, data);
    return { success: true, data: response.data };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (statusCode === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo actualizar el acuerdo.' };
  }
};

// =====================================================================
// REFERENCIAS A INSTITUCIONES
// =====================================================================

// getReferralsByStudent(studentId, status)
// GET /api/social-worker/students/:studentId/referrals
export const getReferralsByStudent = async (studentId, status) => {
  if (!studentId) return { success: false, message: 'Falta el id del alumno.' };
  try {
    const params = {};
    if (status) params.status = status;
    const response = await api.get(`/api/social-worker/students/${studentId}/referrals`, { params });
    return { success: true, data: response.data };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (statusCode === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar las referencias.' };
  }
};

// createReferral(studentId, data)
// POST /api/social-worker/students/:studentId/referrals
export const createReferral = async (studentId, data) => {
  if (!studentId) return { success: false, message: 'Falta el id del alumno.' };
  try {
    const response = await api.post(`/api/social-worker/students/${studentId}/referrals`, data);
    return { success: true, data: response.data };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (statusCode === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (statusCode === 400) return { success: false, message: serverMessage || 'Datos inválidos.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo crear la referencia.' };
  }
};

// updateReferral(referralId, data)
// PATCH /api/social-worker/referrals/:id
export const updateReferral = async (referralId, data) => {
  if (!referralId) return { success: false, message: 'Falta el id de la referencia.' };
  try {
    const response = await api.patch(`/api/social-worker/referrals/${referralId}`, data);
    return { success: true, data: response.data };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (statusCode === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo actualizar la referencia.' };
  }
};

// =====================================================================
// GUARDIANES DEL ALUMNO
// =====================================================================

// getGuardiansByStudent(studentId)
// GET /api/students/:studentId (popula guardians)
export const getGuardiansByStudent = async (studentId) => {
  if (!studentId) return { success: false, message: 'Falta el id del alumno.' };
  try {
    const response = await api.get(`/api/students/${studentId}`);
    const body = response.data || {};
    const data = body.data ? body.data : body;
    // El endpoint devuelve guardians como array de ObjectIds; necesitamos popularlos
    // Como el GET /api/students/:id no popula guardians, usamos el student directamente
    return { success: true, data: data };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (statusCode === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (statusCode === 404) return { success: false, message: serverMessage || 'No se encontró el alumno.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar los guardianes.' };
  }
};

// =====================================================================
// HORARIO DE GRUPO
// =====================================================================

// getGroupSchedule(groupId)
// GET /api/groups/:groupId/schedule
// Horario semanal de un grupo.
export const getGroupSchedule = async (groupId) => {
  if (!groupId) {
    return { success: false, message: 'Falta el id del grupo.' };
  }
  try {
    const response = await api.get(`/api/groups/${groupId}/schedule`);
    const body = response.data || {};
    const data = body.data ? body.data : body;
    return { success: true, data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el horario.' };
  }
};

// =====================================================================
// OVERRIDE DE ASISTENCIA
// =====================================================================

// manualOverrideAttendance(payload)
// POST /api/attendance/manual-override
// Override manual de asistencia (marcar presente).
// Body: { student_id, date, status: "present", notes? }
export const manualOverrideAttendance = async (payload) => {
  try {
    const response = await api.post('/api/attendance/manual-override', payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 400) return { success: false, message: serverMessage || 'Datos inválidos.' };
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el alumno.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo registrar la asistencia.' };
  }
};
