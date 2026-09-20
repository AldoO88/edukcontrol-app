// =====================================================================
// directorService.js
// ---------------------------------------------------------------------
// Servicio HTTP para los endpoints del director (rol principal).
// Todas las llamadas pasan por la instancia api (interceptor JWT).
// =====================================================================

import api from './api';

// ---------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------
export const getDirectorDashboard = async () => {
  try {
    const response = await api.get('/api/director/dashboard');
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el dashboard.' };
  }
};

// ---------------------------------------------------------------------
// Grupos
// ---------------------------------------------------------------------
export const getGroups = async () => {
  try {
    const response = await api.get('/api/director/groups');
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar los grupos.' };
  }
};

export const getGroupsSummary = async () => {
  try {
    const response = await api.get('/api/director/groups-summary');
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el resumen.' };
  }
};

// ---------------------------------------------------------------------
// Alumnos
// ---------------------------------------------------------------------
export const getStudents = async ({ page = 1, limit = 50, search, group, status } = {}) => {
  try {
    const params = { page, limit };
    if (search) params.search = search;
    if (group) params.group = group;
    if (status) params.status = status;
    const response = await api.get('/api/director/students', { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar los alumnos.' };
  }
};

// ---------------------------------------------------------------------
// Maestros
// ---------------------------------------------------------------------
export const getAllTeachers = async () => {
  try {
    const response = await api.get('/api/director/teachers');
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar los maestros.' };
  }
};

export const getTeacherDetail = async (teacherId) => {
  try {
    const response = await api.get(`/api/director/teachers/${teacherId}`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el detalle del maestro.' };
  }
};

export const getTeacherSchedule = async (teacherId) => {
  try {
    const response = await api.get(`/api/director/teacher-schedule/${teacherId}`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el horario.' };
  }
};

// ---------------------------------------------------------------------
// Avisos (CRUD completo)
// ---------------------------------------------------------------------
export const getAnnouncements = async ({ page = 1, limit = 20, type, priority } = {}) => {
  try {
    const params = { page, limit };
    if (type) params.type = type;
    if (priority) params.priority = priority;
    const response = await api.get('/api/director/announcements', { params });
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
    const response = await api.post('/api/director/announcements', payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo crear el aviso.' };
  }
};

export const updateAnnouncement = async (id, payload) => {
  try {
    const response = await api.patch(`/api/director/announcements/${id}`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo actualizar el aviso.' };
  }
};

export const deleteAnnouncement = async (id) => {
  try {
    const response = await api.delete(`/api/director/announcements/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo eliminar el aviso.' };
  }
};

// ---------------------------------------------------------------------
// Reportes de conducta (ver todos + cancelar)
// ---------------------------------------------------------------------
export const getConductLogs = async ({ page = 1, limit = 20, student_id, eventType, severity, status } = {}) => {
  try {
    const params = { page, limit };
    if (student_id) params.student_id = student_id;
    if (eventType) params.eventType = eventType;
    if (severity) params.severity = severity;
    if (status) params.status = status;
    const response = await api.get('/api/director/conduct-logs', { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar los reportes.' };
  }
};

export const cancelConductLog = async (logId, reason) => {
  try {
    const response = await api.put(`/api/director/conduct-logs/${logId}/cancel`, { reason });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cancelar el reporte.' };
  }
};

// ---------------------------------------------------------------------
// Citatorios (ver todos + gestionar)
// ---------------------------------------------------------------------
export const getCitations = async ({ page = 1, limit = 20, status, type, student } = {}) => {
  try {
    const params = { page, limit };
    if (status) params.status = status;
    if (type) params.type = type;
    if (student) params.student = student;
    const response = await api.get('/api/director/citations', { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar los citatorios.' };
  }
};

// ---------------------------------------------------------------------
// Pases de salida (ver todos + gestionar)
// ---------------------------------------------------------------------
export const getExitPasses = async ({ page = 1, limit = 20, student_id, from, to } = {}) => {
  try {
    const params = { page, limit };
    if (student_id) params.student_id = student_id;
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/api/director/exit-passes', { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar los pases de salida.' };
  }
};

// ---------------------------------------------------------------------
// Justificantes (ver todos + gestionar)
// ---------------------------------------------------------------------
export const getJustificantes = async ({ page = 1, limit = 20, status, student_id } = {}) => {
  try {
    const params = { page, limit };
    if (status) params.status = status;
    if (student_id) params.student_id = student_id;
    const response = await api.get('/api/director/justificantes', { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar los justificantes.' };
  }
};

// ---------------------------------------------------------------------
// Asistencia (resumen school-wide)
// ---------------------------------------------------------------------
export const getAttendanceSummary = async ({ periodId, groupId } = {}) => {
  try {
    const params = {};
    if (periodId) params.period_id = periodId;
    if (groupId) params.group_id = groupId;
    const response = await api.get('/api/director/attendance-summary', { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el resumen de asistencia.' };
  }
};

// ---------------------------------------------------------------------
// Inasistencias (top alumnos con más faltas)
// ---------------------------------------------------------------------
export const getSchoolAbsences = async ({ from, to, group_id } = {}) => {
  try {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (group_id) params.group_id = group_id;
    const response = await api.get('/api/director/school-absences', { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar las inasistencias.' };
  }
};

// ---------------------------------------------------------------------
// Avisos — detalle
// ---------------------------------------------------------------------
export const getAnnouncementById = async (id) => {
  if (!id) return { success: false, message: 'Falta el id del aviso.' };
  try {
    const response = await api.get(`/api/director/announcements/${id}`);
    const body = response.data || {};
    const data = body.data ? body.data : body;
    return { success: true, data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el aviso.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el aviso.' };
  }
};

// ---------------------------------------------------------------------
// Citatorios — CRUD completo
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// Reportes de conducta — CRUD completo
// ---------------------------------------------------------------------
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

export const updateConductLog = async (id, payload) => {
  try {
    const response = await api.put(`/api/conduct-logs/${id}`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el reporte.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo actualizar el reporte.' };
  }
};

export const deleteConductLog = async (id) => {
  try {
    const response = await api.delete(`/api/conduct-logs/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el reporte.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo eliminar el reporte.' };
  }
};

export const getConductConfig = async () => {
  try {
    const response = await api.get('/api/conduct-config');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: true, data: {} };
  }
};

// ---------------------------------------------------------------------
// Pases de salida — CRUD
// ---------------------------------------------------------------------
export const createExitPass = async (payload) => {
  try {
    const response = await api.post('/api/exit-passes', payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo crear el pase de salida.' };
  }
};

export const getExitPassById = async (id) => {
  if (!id) return { success: false, message: 'Falta el id del pase.' };
  try {
    const response = await api.get(`/api/exit-passes/${id}`);
    const body = response.data || {};
    const data = body.data ? body.data : body;
    return { success: true, data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el pase.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el pase.' };
  }
};

export const cancelExitPass = async (id) => {
  try {
    const response = await api.patch(`/api/exit-passes/${id}/cancel`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el pase.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cancelar el pase.' };
  }
};

// ---------------------------------------------------------------------
// Alumnos — detalle
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// Maestros — detalle (alias para consistencia con social-worker)
// ---------------------------------------------------------------------
export const getTeacherById = async (teacherId) => {
  try {
    const response = await api.get(`/api/director/teachers/${teacherId}`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el maestro.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el detalle del maestro.' };
  }
};

export const getTeacherScheduleById = async (teacherId) => {
  try {
    const response = await api.get(`/api/director/teacher-schedule/${teacherId}`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el horario.' };
  }
};

// ---------------------------------------------------------------------
// Salud del alumno
// ---------------------------------------------------------------------
export const getStudentHealth = async (studentId) => {
  try {
    const response = await api.get(`/api/director/students/${studentId}/health`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró la ficha de salud.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar la ficha de salud.' };
  }
};

export const updateStudentHealth = async (studentId, data) => {
  try {
    const response = await api.patch(`/api/director/students/${studentId}/health`, data);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 400) return { success: false, message: serverMessage || 'Datos inválidos.' };
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo actualizar la ficha de salud.' };
  }
};

// ---------------------------------------------------------------------
// Acuerdos con padres
// ---------------------------------------------------------------------
export const getAgreementsByStudent = async (studentId, status) => {
  try {
    const params = {};
    if (status) params.status = status;
    const response = await api.get(`/api/director/students/${studentId}/agreements`, { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar los acuerdos.' };
  }
};

export const createAgreement = async (payload) => {
  try {
    const response = await api.post(`/api/director/students/${payload.studentId}/agreements`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo crear el acuerdo.' };
  }
};

export const updateAgreement = async (id, payload) => {
  try {
    const response = await api.patch(`/api/director/agreements/${id}`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo actualizar el acuerdo.' };
  }
};

// ---------------------------------------------------------------------
// Referencias a instituciones
// ---------------------------------------------------------------------
export const getReferralsByStudent = async (studentId, status) => {
  try {
    const params = {};
    if (status) params.status = status;
    const response = await api.get(`/api/director/students/${studentId}/referrals`, { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar las referencias.' };
  }
};

export const createReferral = async (payload) => {
  try {
    const response = await api.post(`/api/director/students/${payload.studentId}/referrals`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo crear la referencia.' };
  }
};

export const updateReferral = async (id, payload) => {
  try {
    const response = await api.patch(`/api/director/referrals/${id}`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo actualizar la referencia.' };
  }
};

// ---------------------------------------------------------------------
// Asistencia — justificar ausencia
// ---------------------------------------------------------------------
export const justifyAttendanceLog = async (logId, reason) => {
  try {
    const response = await api.put(`/api/attendance/logs/${logId}/justify`, { justified: true, justified_reason: reason });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el registro.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo justificar la ausencia.' };
  }
};

// ---------------------------------------------------------------------
// Asistencia — logs
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// Períodos de evaluación
// ---------------------------------------------------------------------
export const getGradingPeriods = async () => {
  try {
    const response = await api.get('/api/grading-periods');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: true, data: [] };
  }
};

// ---------------------------------------------------------------------
// Grupos — alias para modales
// ---------------------------------------------------------------------
export const getMyGroups = async () => {
  try {
    const response = await api.get('/api/groups');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: true, data: [] };
  }
};

// ---------------------------------------------------------------------
// Horario de grupo
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// Override de asistencia
// ---------------------------------------------------------------------
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
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo registrar la asistencia.' };
  }
};
