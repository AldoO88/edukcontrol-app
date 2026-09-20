// =====================================================================
// prefectService.js
// ---------------------------------------------------------------------
// Servicio HTTP para los endpoints del prefecto. Todas las llamadas
// pasan por la instancia api (interceptor JWT) de services/api.js.
// =====================================================================

import api from './api';

// ---------------------------------------------------------------------
// getPrefectDashboard()
// ---------------------------------------------------------------------
// GET /api/prefect/dashboard
// Resumen general: stats del día, avisos recientes, citatorios pendientes.
// Devuelve { success, data, message? }.
export const getPrefectDashboard = async () => {
  try {
    const response = await api.get('/api/prefect/dashboard');
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) {
      return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    }
    if (!error?.response) {
      return { success: false, message: 'No se pudo conectar con el servidor.' };
    }
    return { success: false, message: serverMessage || 'No se pudo cargar el dashboard.' };
  }
};

// ---------------------------------------------------------------------
// getPrefectAttendanceSummary({ periodId, groupId })
// ---------------------------------------------------------------------
// GET /api/prefect/attendance-summary
// Asistencia school-wide con top inasistencias/retardos.
export const getPrefectAttendanceSummary = async ({ periodId, groupId } = {}) => {
  try {
    const params = {};
    if (periodId) params.period_id = periodId;
    if (groupId) params.group_id = groupId;
    const response = await api.get('/api/prefect/attendance-summary', { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) {
      return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    }
    if (!error?.response) {
      return { success: false, message: 'No se pudo conectar con el servidor.' };
    }
    return { success: false, message: serverMessage || 'No se pudo cargar el resumen.' };
  }
};

// ---------------------------------------------------------------------
// getTeacherScheduleById(teacherId)
// ---------------------------------------------------------------------
// GET /api/prefect/teacher-schedule/:teacherId
// Horario semanal de cualquier maestro.
export const getTeacherScheduleById = async (teacherId) => {
  try {
    const response = await api.get(`/api/prefect/teacher-schedule/${teacherId}`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) {
      return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    }
    if (!error?.response) {
      return { success: false, message: 'No se pudo conectar con el servidor.' };
    }
    return { success: false, message: serverMessage || 'No se pudo cargar el horario.' };
  }
};

// ---------------------------------------------------------------------
// getAllTeachers()
// ---------------------------------------------------------------------
// GET /api/users?role=teacher (o filtrar del dashboard)
// Lista de todos los maestros (para selector de horario).
// Usa el endpoint de students como proxy: filtramos por TeacherSubject.
// Alternativa: usar el endpoint de groups y extraer teacher_ids únicos.
// ---------------------------------------------------------------------
// getAnnouncements(params)
// ---------------------------------------------------------------------
// GET /api/announcements
// Lista paginada de avisos (staff). Prefect ve TODOS.
// Params soportados: page, limit, targetType, priority, sender, from, to.
export const getAnnouncements = async ({
  page = 1,
  limit = 20,
  targetType,
  priority,
  sender,
  from,
  to,
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

// ---------------------------------------------------------------------
// createAnnouncement(payload)
// ---------------------------------------------------------------------
// POST /api/announcements
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

// ---------------------------------------------------------------------
// getAnnouncementById(id)
// ---------------------------------------------------------------------
// GET /api/announcements/:id
// Detalle completo de un aviso (poblado: sender, targetGroups,
// targetStudents). Lo usa la pantalla de detalle del prefecto.
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

// ---------------------------------------------------------------------
// updateAnnouncement(id, payload)
// ---------------------------------------------------------------------
// PUT /api/announcements/:id
// Editar un aviso. Solo el sender original o admin puede editar.
export const updateAnnouncement = async (id, payload) => {
  try {
    const response = await api.put(`/api/announcements/${id}`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo editar el aviso.' };
  }
};

// ---------------------------------------------------------------------
// deleteAnnouncement(id)
// ---------------------------------------------------------------------
// DELETE /api/announcements/:id
// Eliminar un aviso. Solo el sender original o admin puede eliminar.
export const deleteAnnouncement = async (id) => {
  try {
    const response = await api.delete(`/api/announcements/${id}`);
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
// getCitations(params)
// ---------------------------------------------------------------------
// GET /api/citations
// Lista paginada de citatorios (staff). Prefect ve TODOS.
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

// ---------------------------------------------------------------------
// createCitation(payload)
// ---------------------------------------------------------------------
// POST /api/citations
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

// ---------------------------------------------------------------------
// getCitationById(id)
// ---------------------------------------------------------------------
// GET /api/citations/:id
// Detalle completo de un citatorio. Prefect puede ver cualquier citatorio.
export const getCitationById = async (id) => {
  if (!id) {
    return { success: false, message: 'Falta el id del citatorio.' };
  }
  try {
    const response = await api.get(`/api/citations/${id}`);
    const body = response.data || {};
    const data = body.data ? body.data : body;
    return { success: true, data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 403) return { success: false, message: serverMessage || 'No tienes permiso para ver este citatorio.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró este citatorio.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el citatorio.' };
  }
};

// ---------------------------------------------------------------------
// updateCitation(id, payload)
// ---------------------------------------------------------------------
// PUT /api/citations/:id
// Actualiza campos de un citatorio existente. Solo el creador puede editar.
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

// ---------------------------------------------------------------------
// rescheduleCitation(id, payload)
// ---------------------------------------------------------------------
// PATCH /api/citations/:id/reschedule
// Reagendar un citatorio con nueva fecha, hora y lugar.
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

// ---------------------------------------------------------------------
// cancelCitation(id)
// ---------------------------------------------------------------------
// PATCH /api/citations/:id/cancel
// Cancelar un citatorio. Solo el creador puede cancelar.
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

// ---------------------------------------------------------------------
// deleteCitation(id)
// ---------------------------------------------------------------------
// DELETE /api/citations/:id
// Eliminar un citatorio. Solo el creador puede eliminar.
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
// getConductLogs(params)
// ---------------------------------------------------------------------
// GET /api/conduct-logs
// Lista paginada de reportes de conducta (staff).
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

// ---------------------------------------------------------------------
// createConductLog(payload)
// ---------------------------------------------------------------------
// POST /api/conduct-logs
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

// ---------------------------------------------------------------------
// getConductLogById(id)
// ---------------------------------------------------------------------
// GET /api/conduct-logs/:logId
// Detalle completo de un reporte de conducta (poblado: reported_by,
// student_id, school_year_id). Lo usa la pantalla de detalle.
export const getConductLogById = async (id) => {
  if (!id) {
    return { success: false, message: 'Falta el id del reporte.' };
  }
  try {
    const response = await api.get(`/api/conduct-logs/${id}`);
    const body = response.data || {};
    const data = body.data ? body.data : body;
    return { success: true, data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 403) return { success: false, message: serverMessage || 'No tienes permiso para ver este reporte.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró este reporte.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el reporte.' };
  }
};

// ---------------------------------------------------------------------
// cancelConductLog(id, reason?)
// ---------------------------------------------------------------------
// PUT /api/conduct-logs/:logId/cancel
// Cancelar un reporte de conducta. Solo admin/principal/registrar/super_admin.
// Restaura los puntos del alumno.
export const cancelConductLog = async (id, reason) => {
  try {
    const payload = reason ? { reason } : {};
    const response = await api.put(`/api/conduct-logs/${id}/cancel`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 400) return { success: false, message: serverMessage || 'El reporte ya está cancelado.' };
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 403) return { success: false, message: serverMessage || 'No tienes permiso para cancelar este reporte.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el reporte.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cancelar el reporte.' };
  }
};

// ---------------------------------------------------------------------
// updateConductLog(id, payload)
// ---------------------------------------------------------------------
// PATCH /api/conduct-logs/:logId
// Actualizar la descripción de un reporte. Solo el creador puede editar.
export const updateConductLog = async (id, payload) => {
  try {
    const response = await api.patch(`/api/conduct-logs/${id}`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 400) return { success: false, message: serverMessage || 'No se puede editar este reporte.' };
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 403) return { success: false, message: serverMessage || 'No tienes permiso para editar este reporte.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el reporte.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo actualizar el reporte.' };
  }
};

// ---------------------------------------------------------------------
// deleteConductLog(id)
// ---------------------------------------------------------------------
// DELETE /api/conduct-logs/:logId
// Eliminar un reporte de conducta. Solo super_admin (auditoría).
export const deleteConductLog = async (id) => {
  try {
    const response = await api.delete(`/api/conduct-logs/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 403) return { success: false, message: serverMessage || 'No tienes permiso para eliminar este reporte.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el reporte.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo eliminar el reporte.' };
  }
};

// ---------------------------------------------------------------------
// getConductConfig()
// ---------------------------------------------------------------------
// GET /api/conduct-config
// Configuración de puntos de conducta (pesos por gravedad, mérito, baseline).
export const getConductConfig = async () => {
  try {
    const response = await api.get('/api/conduct-config');
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar la configuración.' };
  }
};

// ---------------------------------------------------------------------
// getGroups()
// ---------------------------------------------------------------------
// GET /api/groups
// Lista de grupos de la escuela (para selectors).
export const getGroups = async () => {
  try {
    const response = await api.get('/api/groups');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: true, data: [] };
  }
};

// ---------------------------------------------------------------------
// getGroupsSummary()
// ---------------------------------------------------------------------
// GET /api/prefect/groups-summary
// Todos los grupos con estadísticas pre-computadas:
// studentCount, maleCount, femaleCount, conductReportCount, etc.
export const getGroupsSummary = async () => {
  try {
    const response = await api.get('/api/prefect/groups-summary');
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el resumen de grupos.' };
  }
};

// ---------------------------------------------------------------------
// getGroupStudents(groupId)
// ---------------------------------------------------------------------
// GET /api/students?group=<groupId>
// Estudiantes de un grupo específico (para carga lazy en el modal).
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
// getAllTeachers()
// ---------------------------------------------------------------------
// GET /api/prefect/teachers
// Lista de todos los maestros de la escuela del prefecto.
export const getAllTeachers = async () => {
  try {
    const response = await api.get('/api/prefect/teachers');
    return { success: true, data: { teachers: response.data?.teachers || [] } };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ---------------------------------------------------------------------
// getAttendanceLogs(params)
// ---------------------------------------------------------------------
// GET /api/attendance/logs
// Historial de asistencia biométrica. Soporta filtro por group_id,
// student_id, event_type, status, from, to.
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
// manualOverrideAttendance(payload)
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
    if (status === 400) return { success: false, message: serverMessage || 'Datos inválidos.' };
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 404) return { success: false, message: serverMessage || 'No se encontró el alumno.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo registrar la asistencia.' };
  }
};

// ---------------------------------------------------------------------
// getStudentById(studentId)
// ---------------------------------------------------------------------
// GET /api/students/:studentId
// Ficha completa del alumno (datos personales, tutor, grupo).
export const getStudentById = async (studentId) => {
  if (!studentId) {
    return { success: false, message: 'Falta el id del alumno.' };
  }
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

// ---------------------------------------------------------------------
// getStudents(params)
// ---------------------------------------------------------------------
// GET /api/students
// Lista paginada de alumnos (búsqueda global). Soporta search, group, status.
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

// ---------------------------------------------------------------------
// getTeacherById(teacherId)
// ---------------------------------------------------------------------
// GET /api/prefect/teachers/:teacherId
// Información de un maestro: datos personales + materias + grupos.
export const getTeacherById = async (teacherId) => {
  if (!teacherId) {
    return { success: false, message: 'Falta el id del maestro.' };
  }
  try {
    const response = await api.get(`/api/prefect/teachers/${teacherId}`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (status === 404) return { success: false, message: 'No se encontró el maestro.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar la información del maestro.' };
  }
};

// ---------------------------------------------------------------------
// getGroupSchedule(groupId)
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
// createExitPass(payload)
// ---------------------------------------------------------------------
// POST /api/exit-passes
// Crear un pase de salida para un alumno.
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

// ---------------------------------------------------------------------
// getExitPasses(params)
// ---------------------------------------------------------------------
// GET /api/exit-passes
// Lista paginada de pases de salida.
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

// ---------------------------------------------------------------------
// getExitPassById(id)
// ---------------------------------------------------------------------
// GET /api/exit-passes/:id
// Detalle de un pase de salida.
export const getExitPassById = async (id) => {
  if (!id) {
    return { success: false, message: 'Falta el id del pase de salida.' };
  }
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

// ---------------------------------------------------------------------
// getGradingPeriods()
// ---------------------------------------------------------------------
// GET /api/grading-periods
// Lista de períodos de evaluación del ciclo activo.
export const getGradingPeriods = async () => {
  try {
    const response = await api.get('/api/grading-periods');
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudieron cargar los períodos.' };
  }
};

// ---------------------------------------------------------------------
// getSchoolAbsences({ from, to, groupId })
// ---------------------------------------------------------------------
// GET /api/prefect/school-absences
// Top alumnos con más faltas escolares (AttendanceLog status=absent).
export const getSchoolAbsences = async ({ from, to, groupId } = {}) => {
  try {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (groupId) params.group_id = groupId;
    const response = await api.get('/api/prefect/school-absences', { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    if (status === 401) return { success: false, message: serverMessage || 'Tu sesión expiró.' };
    if (!error?.response) return { success: false, message: 'No se pudo conectar con el servidor.' };
    return { success: false, message: serverMessage || 'No se pudo cargar el resumen de faltas.' };
  }
};
