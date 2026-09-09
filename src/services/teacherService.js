// =====================================================================
// teacherService.js
// ---------------------------------------------------------------------
// Capa de servicio para endpoints del teacher (maestro). El backend
// identifica al teacher por el JWT del header Authorization (el
// "me" en el path), por lo que NO necesitamos pasar el id del user.
//
// Endpoints:
//   - getTeacherDashboard() → GET /api/teacher-subjects/me/dashboard
//     Retorna teacher + school + currentSchoolYear + todaySchedule.
//   - getMyGroups() → GET /api/teacher-subjects/me/groups
//     Retorna todos los grupos asignados al maestro con sus alumnos.
//   - getGroupStudents(groupId) → GET /api/teacher-subjects/me/groups/:groupId/students
//     Retorna group info + students array + total.
//   - saveAttendance(data) → POST /api/teacher-subjects/me/attendance
//     Guarda el pase de lista de un grupo.
//   - createTeacherAnnouncement(payload) → POST /api/announcements
//     Crea un aviso (group o student) con targetType/targetGroups/
//     targetStudents.
//   - getTeacherAnnouncements(options) → GET /api/announcements/me
//     Lista avisos del maestro por tab (mine/general) con filtros
//     y paginación.
//   - getTeacherAnnouncementById(id) → GET /api/announcements/:id
//     Devuelve el detalle de un aviso por su _id.
//   - updateTeacherAnnouncement(id, payload) → PUT /api/announcements/:id
//     Actualiza title, message, priority de un aviso existente.
//   - deleteTeacherAnnouncement(id) → DELETE /api/announcements/:id
//     Elimina un aviso existente.
//   - updateAttendanceRecord(payload) → PATCH /api/attendance
//     Actualiza el estado de asistencia de un alumno en una fecha
//     concreta desde la matriz matricial de asistencias.
//   - getStudentConductDetail(logId) → GET /api/conduct-logs/:logId
//     Retorna el detalle completo de un reporte de conducta.
// =====================================================================

// Cliente axios. Ya tiene el interceptor JWT que añade el header
// Authorization automáticamente.
import api from './api';

// Endpoints.
const DASHBOARD_ENDPOINT = '/api/teacher-subjects/me/dashboard';
const GROUP_STUDENTS_ENDPOINT = '/api/teacher-subjects/me/groups';
const ATTENDANCE_ENDPOINT = '/api/teacher-subjects/me/attendance';
// Endpoint dedicado del PATCH de la matriz matricial. Sigue el path
// del spec del "Pase de Lista Matricial": PATCH /api/attendance con
// body { groupId, studentId, date, status, note }.
const ATTENDANCE_MATRIX_ENDPOINT = '/api/attendance';
// Endpoint de avisos del maestro (listado por tab).
const ANNOUNCEMENTS_ME_ENDPOINT = '/api/announcements/me';
// Endpoint general de avisos (detalle, creación).
const ANNOUNCEMENTS_ENDPOINT = '/api/announcements';
// Endpoint de citatorios del maestro (listado con filtros).
const CITATIONS_ME_ENDPOINT = '/api/citations/me';
// Endpoint general de citatorios (detalle por id).
const CITATIONS_ENDPOINT = '/api/citations';

const SCHEDULE_ENDPOINT = '/api/teacher-subjects/me/schedule';
const ATTENDANCE_SUMMARY_ENDPOINT = '/api/teacher-subjects/me/attendance-summary';
const GROUPS_WITH_SCHEDULE_ENDPOINT = '/api/teacher-subjects/me/groups-with-schedule';
const GRADING_PERIODS_ENDPOINT = '/api/teacher-subjects/me/grading-periods';
const ATTENDANCE_SESSIONS_ENDPOINT = '/api/teacher-subjects/me/attendance-sessions';
const GRADE_CONFIG_ENDPOINT = '/api/teacher-subjects/me/grade-config';
const EVALUATION_TYPES_ENDPOINT = '/api/teacher-subjects/me/evaluation-types';
const TEACHER_GRADES_ENDPOINT = '/api/teacher-subjects/me/grades';
const GROUP_STUDENTS_SUMMARY_ENDPOINT = '/api/teacher-subjects/me/group-students-summary';
const STUDENT_FILE_ENDPOINT = '/api/teacher-subjects/me/student-file';
const STUDENT_TUTORIA_FILE_ENDPOINT = '/api/teacher-subjects/me/student-tutoria-file';
const GROUP_SCHEDULE_ENDPOINT = '/api/groups';
const GRADE_VALIDATION_ENDPOINT = '/api/teacher-subjects/me/grades/validation';

// ---------------------------------------------------------------------
// getTeacherDashboard()
// ---------------------------------------------------------------------
// GET /api/teacher-subjects/me/dashboard
//
// Shape del response (real, validado contra el backend):
//   {
//     teacher: {
//       _id: string,
//       name: string,
//       last_name: string,
//       fullName: string,       // "Aldo González"
//       email: string,
//       phoneNumber: string,
//     },
//     school: {
//       _id: string,
//       name: string,
//       cct: string,
//       logoUrl: string | null,
//       isActive: boolean,
//     },
//     currentSchoolYear: {
//       _id: string,
//       name: string,           // "2026-2027"
//       startDate: string,      // ISO datetime
//       endDate: string,        // ISO datetime
//       isActive: boolean,
//     },
//     currentDate: string,      // "Viernes, 7 de agosto"
//     currentTime: string,      // "8:45 a.m."
//     todaySchedule: {
//       totalClasses: number,
//       currentClass: {         // null si no hay clase en curso
//         subject: { code: string, name: string },
//         group: { _id, grade, section, label },
//         startTime: string,    // "08:20"
//         endTime: string,      // "09:10"
//         startMinutes: number,
//         endMinutes: number,
//         classroom: string | null,
//       } | null,
//       restOfDay: [            // clases restantes del día
//         { subject, group, startTime, endTime, ... }
//       ],
//       allClasses: [           // todas las clases del día
//         { subject, group, startTime, endTime, ... }
//       ],
//     },
//   }
//
// Devuelve { success, data, message? } o { success: false, message }.
// NO lanza excepciones.
export const getTeacherDashboard = async () => {
  try {
    const response = await api.get(DASHBOARD_ENDPOINT);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
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
      message: 'No se pudo cargar el dashboard. Inténtalo de nuevo.',
    };
  }
};

// ---------------------------------------------------------------------
// getMyGroups()
// ---------------------------------------------------------------------
// GET /api/teacher-subjects/me/groups
//
// Retorna TODOS los grupos asignados al maestro, incluyendo la lista
// de alumnos de cada grupo. Se usa para poblar los selectores de
// destinatarios al crear avisos (chips de grupo y selección de
// alumnos individuales).
//
// A diferencia de todaySchedule.allClasses (que solo tiene las clases
// del día actual), este endpoint retorna todos los grupos sin
// importar el día de la semana.
//
// Shape del response:
//   {
//     groups: [
//       {
//         _id: string,
//         grade: number,        // 1
//         section: string,      // "A"
//         label: string,        // "1°A"
//         shift: string,        // "matutino"
//         type: string,         // "regular" | "taller"
//         subjects: [{ _id, code, name }],
//         students: [{ _id, first_name, last_name, fullName, photoUrl }],
//         totalStudents: number,
//       }
//     ]
//   }
//
// Devuelve { success, data, message? } o { success: false, message }.
// NO lanza excepciones.
export const getMyGroups = async () => {
  try {
    const response = await api.get(GROUP_STUDENTS_ENDPOINT);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
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
      message: 'No se pudieron cargar los grupos. Inténtalo de nuevo.',
    };
  }
};

// ---------------------------------------------------------------------
// getGroupStudents(groupId, subjectId)
// ---------------------------------------------------------------------
// GET /api/teacher-subjects/me/groups/:groupId/students?subject_id=...
//
// Shape del response (real, validado contra el backend):
//   {
//     group: {
//       _id: string,
//       grade: number,
//       section: string,
//       label: string,        // "3°A"
//       shift: string,        // "matutino"
//     },
//     students: [
//       {
//         fullName: string,
//         controlNumber: string,
//         photoUrl: string | null,
//         rfid_card: string,
//       }
//     ],
//     subject_id: string,     // ID de la materia
//     total: number,
//   }
//
// Devuelve { success, data, message? } o { success: false, message }.
// NO lanza excepciones.
export const getGroupStudents = async (groupId, subjectId) => {
  try {
    // Construir URL con query param subject_id si existe.
    let url = `${GROUP_STUDENTS_ENDPOINT}/${groupId}/students`;
    if (subjectId) {
      url += `?subject_id=${subjectId}`;
    }
    const response = await api.get(url);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
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
      message: 'No se pudo cargar la lista de alumnos. Inténtalo de nuevo.',
    };
  }
};

// ---------------------------------------------------------------------
// saveAttendance(attendanceData)
// ---------------------------------------------------------------------
// POST /api/teacher-subjects/me/attendance
//
// Body del request:
//   {
//     group_id: string,
//     subject_id: string,
//     class_schedule_id?: string,
//     date: string,           // "2026-08-09"
//     startTime: string,      // "13:40"
//     endTime: string,        // "14:30"
//     records: [
//       {
//         student_id: string,
//         status: "present" | "retard" | "absent",
//         location: "in_school" | "absent",
//         note?: string | null,
//       }
//     ]
//   }
//
// Shape del response (201):
//   {
//     message: "Attendance saved successfully.",
//     attendance: {
//       _id: string,
//       date: string,
//       group_id: string,
//       subject_id: string,
//       summary: { total, present, retard, absent },
//       recordsCount: number,
//     }
//   }
//
// Devuelve { success, data, message? } o { success: false, message }.
// NO lanza excepciones.
export const saveAttendance = async (attendanceData) => {
  try {
    const response = await api.post(ATTENDANCE_ENDPOINT, attendanceData);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (status === 400) {
      return {
        success: false,
        message: serverMessage || 'Datos inválidos. Verifica la información.',
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
      message: 'No se pudo guardar la asistencia. Inténtalo de nuevo.',
    };
  }
};

// ---------------------------------------------------------------------
// createTeacherAnnouncement(payload)
// ---------------------------------------------------------------------
// POST /api/announcements
//
// Crea un aviso del maestro (rol teacher). El backend identifica al
// maestro por el JWT del header Authorization.
//
// Alcance por rol (teacher):
//   - targetType "group": solo sus grupos asignados
//   - targetType "student": solo alumnos de sus grupos
//   - targetType "general": válido (enviado a toda la escuela)
//
// Body del request:
//   {
//     title: string,              // max 200 chars, requerido.
//     message: string,            // max 5000 chars, requerido.
//     priority: "informative" | "urgent",
//     targetType: "general" | "group" | "student",
//     targetGroups?: string[],    // ObjectIds (requerido si targetType === "group")
//     targetStudents?: string[],  // ObjectIds (requerido si targetType === "student")
//     expiresAt?: ISO date,       // null = sin vencimiento (opcional)
//   }
//
// Shape del response (201):
//   {
//     _id, school, schoolYear,
//     sender: { _id, name, last_name, role },
//     title, message, priority, targetType,
//     targetGroups: [{ _id, grade, section, shift, ... }],
//     targetStudents: [{ _id, first_name, last_name, photoUrl, ... }],
//     expiresAt, createdAt, updatedAt,
//   }
//
// Side effects:
//   - Push notification a guardianes de alumnos afectados (async).
//
// Devuelve { success, data, message? } o { success: false, message }.
// NO lanza excepciones.
export const createTeacherAnnouncement = async (payload) => {
  try {
    const response = await api.post(ANNOUNCEMENTS_ENDPOINT, payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (status === 400) {
      return {
        success: false,
        message: serverMessage || 'Datos inválidos. Verifica la información.',
      };
    }
    if (status === 403) {
      return {
        success: false,
        message: serverMessage || 'No tienes permiso para enviar avisos a estos destinatarios.',
      };
    }
    if (status === 409) {
      return {
        success: false,
        message: serverMessage || 'No hay ciclo escolar activo configurado en la escuela.',
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
      message: 'No se pudo publicar el aviso. Inténtalo de nuevo.',
    };
  }
};

// ---------------------------------------------------------------------
// getTeacherAnnouncements(options)
// ---------------------------------------------------------------------
// GET /api/announcements/me
//
// Lista los avisos del maestro por tab con filtros y paginación.
// El backend filtra automáticamente por school + JWT.
//
// Endpoints:
//   - tab=mine    → solo avisos que el teacher publicó.
//   - tab=general → solo avisos tipo general de la escuela.
//   - (sin tab)   → ambos combinados.
//
// Opciones (todas opcionales):
//   - tab:          "mine" | "general"
//   - priority:     "informative" | "urgent"
//   - page:         number (default 1)
//   - limit:        number (default 20, max 100)
//
// Shape del response:
//   {
//     items: Announcement[],
//     total: number,
//     page: number,
//     pages: number,
//     limit: number,
//   }
//
// Devuelve { success, data, message? } o { success: false, message }.
// NO lanza excepciones.
export const getTeacherAnnouncements = async (options = {}) => {
  const params = new URLSearchParams();

  if (options.tab) {
    params.append('tab', options.tab);
  }
  if (options.priority) {
    params.append('priority', options.priority);
  }
  if (typeof options.page === 'number' && options.page > 1) {
    params.append('page', String(options.page));
  }
  if (typeof options.limit === 'number' && options.limit > 0) {
    params.append('limit', String(options.limit));
  }

  const queryString = params.toString();
  const url = `${ANNOUNCEMENTS_ME_ENDPOINT}${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await api.get(url);
    const body = response.data || {};
    const payload = body.data
      ? body.data
      : {
          items: body.items || [],
          total: body.total || 0,
          page: body.page || 1,
          pages: body.pages || body.totalPages || 1,
          limit: body.limit || 20,
        };
    return { success: true, data: payload };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (status === 400) {
      return {
        success: false,
        message: 'La solicitud es inválida.',
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
      message: serverMessage || 'No se pudieron cargar los avisos. Inténtalo de nuevo.',
    };
  }
};

// ---------------------------------------------------------------------
// getTeacherAnnouncementById(id)
// ---------------------------------------------------------------------
// GET /api/announcements/:id
//
// Devuelve UN aviso por su _id. El endpoint es genérico (funciona
// para cualquier rol autenticado: teacher, admin, guardian).
//
// Shape del response (mismo que el listado, con campos populados):
//   {
//     _id, title, message, priority, targetType,
//     targetGroups: [{ _id, grade, section, shift, ... }],
//     targetStudents: [{ _id, first_name, last_name, ... }],
//     sender: { _id, name, last_name, role },
//     schoolYear: { name, isActive },
//     readCount, totalRecipients,
//     expiresAt, createdAt, updatedAt,
//   }
//
// Devuelve { success, data, message? } o { success: false, message }.
// NO lanza excepciones.
export const getTeacherAnnouncementById = async (id) => {
  if (!id) {
    return { success: false, message: 'Falta el id del aviso.' };
  }
  try {
    const response = await api.get(`${ANNOUNCEMENTS_ENDPOINT}/${id}`);
    const body = response.data || {};
    const payload = body.data ? body.data : body;
    return { success: true, data: payload };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 404) {
      return {
        success: false,
        message: serverMessage || 'No se encontró este aviso.',
        reason: 'not_found',
      };
    }
    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (status === 403) {
      return {
        success: false,
        message: serverMessage || 'No tienes permiso para ver este aviso.',
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
      message: serverMessage || 'No se pudo cargar el aviso. Inténtalo de nuevo.',
    };
  }
};

// ---------------------------------------------------------------------
// updateTeacherAnnouncement(id, payload)
// ---------------------------------------------------------------------
// PUT /api/announcements/:id
//
// Actualiza un aviso existente. Solo el sender original o un
// admin/principal/registrar puede editarlo.
//
// Campos editables: title, message, priority, targetType,
// targetGroups, targetStudents, expiresAt.
// NO se puede cambiar: school, schoolYear, sender.
//
// Body del request (parcial, solo campos a cambiar):
//   {
//     title?: string,
//     message?: string,
//     priority?: "informative" | "urgent",
//   }
//
// Devuelve { success, data, message? } o { success: false, message }.
// NO lanza excepciones.
export const updateTeacherAnnouncement = async (id, payload) => {
  if (!id) {
    return { success: false, message: 'Falta el id del aviso.' };
  }
  try {
    const response = await api.put(`${ANNOUNCEMENTS_ENDPOINT}/${id}`, payload);
    const body = response.data || {};
    const data = body.data ? body.data : body;
    return { success: true, data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 404) {
      return {
        success: false,
        message: serverMessage || 'No se encontró este aviso.',
        reason: 'not_found',
      };
    }
    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (status === 403) {
      return {
        success: false,
        message: serverMessage || 'No tienes permiso para editar este aviso.',
      };
    }
    if (status === 400) {
      return {
        success: false,
        message: serverMessage || 'Datos inválidos. Verifica la información.',
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
      message: serverMessage || 'No se pudo actualizar el aviso. Inténtalo de nuevo.',
    };
  }
};

// ---------------------------------------------------------------------
// deleteTeacherAnnouncement(id)
// ---------------------------------------------------------------------
// DELETE /api/announcements/:id
//
// Elimina un aviso. Solo el sender original o un
// admin/principal/registrar puede eliminarlo.
//
// Devuelve { success, data, message? } o { success: false, message }.
// NO lanza excepciones.
export const deleteTeacherAnnouncement = async (id) => {
  if (!id) {
    return { success: false, message: 'Falta el id del aviso.' };
  }
  try {
    const response = await api.delete(`${ANNOUNCEMENTS_ENDPOINT}/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 404) {
      return {
        success: false,
        message: serverMessage || 'No se encontró este aviso.',
        reason: 'not_found',
      };
    }
    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (status === 403) {
      return {
        success: false,
        message: serverMessage || 'No tienes permiso para eliminar este aviso.',
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
      message: serverMessage || 'No se pudo eliminar el aviso. Inténtalo de nuevo.',
    };
  }
};

// ---------------------------------------------------------------------
// getTeacherCitations(options)
// ---------------------------------------------------------------------
// GET /api/citations/me
//
// Lista los citatorios del maestro autenticado. El backend identifica
// al teacher por el JWT del header Authorization.
//
// Filtros opcionales (query params):
//   - status: 'pending' | 'confirmed' | 'completed' | 'no_show'
//   - type: 'academic' | 'behavioral' | 'administrative'
//   - student: ObjectId del alumno
//   - from, to: rango sobre scheduledDate (ISO datetime)
//   - page, limit (max 100)
//
// Shape del response:
//   {
//     items: [{
//       _id, student: { _id, first_name, last_name, photoUrl, controlNumber },
//       creator: { _id, name, last_name, role },
//       schoolYear: { name, isActive },
//       subject: { _id, code, name } | null,
//       groupName: '1°A',
//       scheduledDate, location, type, reason, status,
//     }],
//     total, page, limit, pages,
//   }
//
// Devuelve { success, data, message? } o { success: false, message }.
// NO lanza excepciones.
export const getTeacherCitations = async (options = {}) => {
  try {
    const params = {};
    if (options.status) params.status = options.status;
    if (options.type) params.type = options.type;
    if (options.student) params.student = options.student;
    if (options.from) params.from = options.from;
    if (options.to) params.to = options.to;
    if (options.page) params.page = options.page;
    if (options.limit) params.limit = options.limit;

    const response = await api.get(CITATIONS_ME_ENDPOINT, { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
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
      message: 'No se pudieron cargar los citatorios. Inténtalo de nuevo.',
    };
  }
};

// ---------------------------------------------------------------------
// getTeacherCitationById(id)
// ---------------------------------------------------------------------
// GET /api/citations/:id
//
// Devuelve el detalle de un citatorio específico. Incluye los campos
// poblados de student, creator, schoolYear y subject.
//
// Devuelve { success, data, message? } o { success: false, message }.
// NO lanza excepciones.
export const getTeacherCitationById = async (id) => {
  if (!id) {
    return { success: false, message: 'Falta el id del citatorio.' };
  }
  try {
    const response = await api.get(`${CITATIONS_ENDPOINT}/${id}`);
    const body = response.data || {};
    const data = body.data ? body.data : body;
    return { success: true, data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 404) {
      return {
        success: false,
        message: serverMessage || 'No se encontró este citatorio.',
        reason: 'not_found',
      };
    }
    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (status === 403) {
      return {
        success: false,
        message: serverMessage || 'No tienes permiso para ver este citatorio.',
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
      message: serverMessage || 'No se pudo cargar el citatorio. Inténtalo de nuevo.',
    };
  }
};

// ---------------------------------------------------------------------
// createTeacherCitation(payload)
// ---------------------------------------------------------------------
// POST /api/citations
//
// Crea un nuevo citatorio. El backend identifica al teacher por el JWT.
//
// Body requerido:
//   - student: ObjectId del alumno
//   - scheduledDate: ISO 8601 (ej. "2026-08-25T10:30:00")
//   - type: 'academic' | 'behavioral' | 'administrative'
//   - location: string (max 200 chars)
//   - reason: string (max 1000 chars)
//
// Body opcional:
//   - subject: ObjectId de la materia (requerido si type='academic')
//
// Devuelve { success, data, message? } o { success: false, message }.
// NO lanza excepciones.
export const createTeacherCitation = async (payload) => {
  try {
    const response = await api.post(CITATIONS_ENDPOINT, payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 400) {
      return {
        success: false,
        message: serverMessage || 'Faltan campos requeridos o los datos son inválidos.',
      };
    }
    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (status === 403) {
      return {
        success: false,
        message: serverMessage || 'No puedes citar a este alumno porque no está en tus grupos.',
      };
    }
    if (status === 404) {
      return {
        success: false,
        message: serverMessage || 'El alumno o la materia no existen en tu escuela.',
      };
    }
    if (status === 409) {
      return {
        success: false,
        message: serverMessage || 'No se puede crear el citatorio. Verifica que el alumno tenga tutores y haya un ciclo activo.',
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
      message: serverMessage || 'No se pudo crear el citatorio. Inténtalo de nuevo.',
    };
  }
};

// ---------------------------------------------------------------------
// updateCitation(id, payload)
// ---------------------------------------------------------------------
// PUT /api/citations/:id
//
// Actualiza un citatorio existente. Solo el teacher que lo creó
// (o un admin) puede editarlo.
//
// Body esperado (campos opcionales):
//   - scheduledDate: ISO 8601
//   - location: string
//   - reason: string
//   - type: 'academic' | 'behavioral' | 'administrative'
//   - subject: ObjectId (opcional)
//
// Devuelve { success, data, message? } o { success: false, message }.
export const updateCitation = async (id, payload) => {
  try {
    const response = await api.put(`${CITATIONS_ENDPOINT}/${id}`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 400) {
      return { success: false, message: serverMessage || 'Datos inválidos.' };
    }
    if (status === 401) {
      return { success: false, message: serverMessage || 'Tu sesión expiró.', reason: 'unauthorized' };
    }
    if (status === 403) {
      return { success: false, message: serverMessage || 'No tienes permiso para editar este citatorio.' };
    }
    if (status === 404) {
      return { success: false, message: serverMessage || 'El citatorio no existe.' };
    }
    if (!error?.response) {
      return { success: false, message: 'No se pudo conectar con el servidor.' };
    }
    return { success: false, message: serverMessage || 'No se pudo actualizar el citatorio.' };
  }
};

// ---------------------------------------------------------------------
// rescheduleCitation(id, payload)
// ---------------------------------------------------------------------
// PATCH /api/citations/:id/reschedule
//
// Reagenda un citatorio con nueva fecha/hora/lugar.
//
// Body esperado:
//   - scheduledDate: ISO 8601 (nueva fecha y hora)
//   - location: string (nuevo lugar, opcional)
//
// Devuelve { success, data, message? } o { success: false, message }.
export const rescheduleCitation = async (id, payload) => {
  try {
    const response = await api.patch(`${CITATIONS_ENDPOINT}/${id}/reschedule`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 400) {
      return { success: false, message: serverMessage || 'Datos inválidos para reagendar.' };
    }
    if (status === 401) {
      return { success: false, message: serverMessage || 'Tu sesión expiró.', reason: 'unauthorized' };
    }
    if (status === 403) {
      return { success: false, message: serverMessage || 'No tienes permiso para reagendar este citatorio.' };
    }
    if (status === 404) {
      return { success: false, message: serverMessage || 'El citatorio no existe.' };
    }
    if (status === 409) {
      return { success: false, message: serverMessage || 'No se puede reagendar este citatorio en su estado actual.' };
    }
    if (!error?.response) {
      return { success: false, message: 'No se pudo conectar con el servidor.' };
    }
    return { success: false, message: serverMessage || 'No se pudo reagendar el citatorio.' };
  }
};

// ---------------------------------------------------------------------
// cancelCitation(id)
// ---------------------------------------------------------------------
// PATCH /api/citations/:id/cancel
//
// Cancela un citatorio. Solo se puede cancelar si está en estado
// pending o confirmed.
//
// Devuelve { success, data, message? } o { success: false, message }.
export const cancelCitation = async (id) => {
  try {
    const response = await api.patch(`${CITATIONS_ENDPOINT}/${id}/cancel`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 400) {
      return { success: false, message: serverMessage || 'No se puede cancelar este citatorio.' };
    }
    if (status === 401) {
      return { success: false, message: serverMessage || 'Tu sesión expiró.', reason: 'unauthorized' };
    }
    if (status === 403) {
      return { success: false, message: serverMessage || 'No tienes permiso para cancelar este citatorio.' };
    }
    if (status === 404) {
      return { success: false, message: serverMessage || 'El citatorio no existe.' };
    }
    if (status === 409) {
      return { success: false, message: serverMessage || 'No se puede cancelar un citatorio que ya fue atendido o cancelado.' };
    }
    if (!error?.response) {
      return { success: false, message: 'No se pudo conectar con el servidor.' };
    }
    return { success: false, message: serverMessage || 'No se pudo cancelar el citatorio.' };
  }
};

// ---------------------------------------------------------------------
// updateCitationStatus(id, status)
// ---------------------------------------------------------------------
// PATCH /api/citations/:id/status
//
// Cambia el estado de un citatorio. El teacher lo usa para marcar
// si el padre asistió o no.
//
// Body requerido:
//   - status: 'completed' | 'no_show'
//
// Transiciones válidas:
//   pending    → completed | no_show
//   confirmed  → completed | no_show
//   completed  → (terminal)
//   no_show    → (terminal)
//   cancelled  → (terminal)
//
// Devuelve { success, data, message? } o { success: false, message }.
export const updateCitationStatus = async (id, status) => {
  try {
    const response = await api.patch(`${CITATIONS_ENDPOINT}/${id}/status`, { status });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 400) {
      return { success: false, message: serverMessage || 'Status inválido.' };
    }
    if (status === 401) {
      return { success: false, message: serverMessage || 'Tu sesión expiró.', reason: 'unauthorized' };
    }
    if (status === 403) {
      return { success: false, message: serverMessage || 'No tienes permiso para cambiar el estado de este citatorio.' };
    }
    if (status === 404) {
      return { success: false, message: serverMessage || 'El citatorio no existe.' };
    }
    if (status === 409) {
      return { success: false, message: serverMessage || 'Transición de estado no permitida.' };
    }
    if (!error?.response) {
      return { success: false, message: 'No se pudo conectar con el servidor.' };
    }
    return { success: false, message: serverMessage || 'No se pudo actualizar el estado del citatorio.' };
  }
};

// ---------------------------------------------------------------------
// getTeacherSchedule()
// ---------------------------------------------------------------------
// GET /api/teacher-subjects/me/schedule
//
// Retorna el horario semanal del maestro agrupado por día
// (1=Lunes...5=Viernes), más estadísticas (weeklyHours, groupsCount,
// freeHoursToday) y el día actual (today).
//
// Devuelve { success, data, message? } o { success: false, message }.
// NO lanza excepciones.
export const getTeacherSchedule = async () => {
  try {
    const response = await api.get(SCHEDULE_ENDPOINT);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
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
      message: serverMessage || 'No se pudo cargar el horario. Inténtalo de nuevo.',
    };
  }
};

// ---------------------------------------------------------------------
// getAttendanceSummary({ periodId, groupId })
// ---------------------------------------------------------------------
// GET /api/teacher-subjects/me/attendance-summary
//
// Query params:
//   - period_id: ObjectId (opcional, período de evaluación)
//   - group_id: ObjectId (opcional, filtra por grupo)
//
// Devuelve { success, data, message? } o { success: false, message }.
// La respuesta incluye: groups, periodName, stats, topAbsentStudents, topRetardStudents.
export const getAttendanceSummary = async ({ periodId, groupId } = {}) => {
  try {
    const params = {};
    if (periodId) params.period_id = periodId;
    if (groupId) params.group_id = groupId;
    const response = await api.get(ATTENDANCE_SUMMARY_ENDPOINT, { params });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
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
// STUDENT ATTENDANCE HISTORY (MOCK)
// ---------------------------------------------------------------------
// Mock hasta que exista GET /api/teacher/attendance/student/:studentId
export const getAttendanceStudentHistory = async (studentId) => {
  await new Promise((r) => setTimeout(r, 400));

  const studentsMap = {
    s1: {
      name: 'Hernández Cruz, Luis',
      group: '1° A • Ofimática I',
      absences: 5,
      history: [
        { date: '14/Ago', status: 'falta', subject: 'Ofimática I' },
        { date: '12/Ago', status: 'falta', subject: 'Ofimática I' },
        { date: '11/Ago', status: 'retardo', subject: 'Informática' },
        { date: '10/Ago', status: 'falta', subject: 'Socioemocional' },
        { date: '09/Ago', status: 'falta', subject: 'Ofimática I' },
      ],
    },
    s2: {
      name: 'Castillo Ruiz, Valentina',
      group: '1° A • Ofimática I',
      absences: 4,
      history: [
        { date: '14/Ago', status: 'falta', subject: 'Ofimática I' },
        { date: '12/Ago', status: 'falta', subject: 'Ofimática I' },
        { date: '10/Ago', status: 'retardo', subject: 'Socioemocional' },
        { date: '09/Ago', status: 'falta', subject: 'Ofimática I' },
      ],
    },
    s3: {
      name: 'Sánchez Mora, Paula',
      group: '1° A • Ofimática I',
      absences: 4,
      history: [
        { date: '13/Ago', status: 'falta', subject: 'Ofimática I' },
        { date: '11/Ago', status: 'falta', subject: 'Informática' },
        { date: '10/Ago', status: 'falta', subject: 'Socioemocional' },
        { date: '09/Ago', status: 'retardo', subject: 'Ofimática I' },
      ],
    },
    s4: {
      name: 'Acosta Rodríguez, Mateo',
      group: '2° B • Informática',
      absences: 3,
      history: [
        { date: '11/Ago', status: 'falta', subject: 'Informática' },
        { date: '10/Ago', status: 'falta', subject: 'Socioemocional' },
        { date: '09/Ago', status: 'retardo', subject: 'Informática' },
      ],
    },
    s5: {
      name: 'Bautista Pérez, Diego',
      group: '3° A • Socioemocional',
      absences: 2,
      history: [
        { date: '10/Ago', status: 'falta', subject: 'Socioemocional' },
        { date: '09/Ago', status: 'falta', subject: 'Socioemocional' },
      ],
    },
  };

  const student = studentsMap[studentId] || {
    name: 'Alumno Desconocido',
    group: '—',
    absences: 0,
    history: [],
  };

  return {
    success: true,
    data: { studentId, ...student },
  };
};

// ---------------------------------------------------------------------
// SESSION ATTENDANCE DETAIL (MOCK)
// ---------------------------------------------------------------------
// Mock hasta que exista GET /api/teacher/attendance/session/:date
// Recibe la fecha ISO como identificador de la sesión.
export const getAttendanceSessionDetail = async (date) => {
  await new Promise((r) => setTimeout(r, 400));

  const sessionsMap = {
    '2026-08-14T00:00:00.000Z': {
      date: '2026-08-14T00:00:00.000Z',
      dateFormatted: '14/Ago',
      group: { label: '1°A', type: 'regular' },
      subject: { code: 'TEC', name: 'Ofimática I' },
      stats: { present: 32, absent: 3, late: 0, total: 35 },
      students: [
        { studentId: 's10', name: 'Pérez García, Juan', status: 'present' },
        { studentId: 's11', name: 'García López, María', status: 'present' },
        { studentId: 's12', name: 'Rodríguez Díaz, Carlos', status: 'present' },
        { studentId: 's1', name: 'Hernández Cruz, Luis', status: 'absent' },
        { studentId: 's2', name: 'Castillo Ruiz, Valentina', status: 'absent' },
        { studentId: 's3', name: 'Sánchez Mora, Paula', status: 'absent' },
      ],
    },
    '2026-08-13T00:00:00.000Z': {
      date: '2026-08-13T00:00:00.000Z',
      dateFormatted: '13/Ago',
      group: { label: '1°A', type: 'regular' },
      subject: { code: 'TEC', name: 'Ofimática I' },
      stats: { present: 35, absent: 0, late: 0, total: 35 },
      students: [
        { studentId: 's10', name: 'Pérez García, Juan', status: 'present' },
        { studentId: 's11', name: 'García López, María', status: 'present' },
      ],
    },
    '2026-08-12T00:00:00.000Z': {
      date: '2026-08-12T00:00:00.000Z',
      dateFormatted: '12/Ago',
      group: { label: '1°A', type: 'regular' },
      subject: { code: 'TEC', name: 'Ofimática I' },
      stats: { present: 30, absent: 5, late: 0, total: 35 },
      students: [
        { studentId: 's10', name: 'Pérez García, Juan', status: 'present' },
        { studentId: 's1', name: 'Hernández Cruz, Luis', status: 'absent' },
        { studentId: 's2', name: 'Castillo Ruiz, Valentina', status: 'absent' },
      ],
    },
    '2026-08-11T00:00:00.000Z': {
      date: '2026-08-11T00:00:00.000Z',
      dateFormatted: '11/Ago',
      group: { label: '2°B', type: 'regular' },
      subject: { code: 'INF', name: 'Informática' },
      stats: { present: 28, absent: 4, late: 0, total: 32 },
      students: [
        { studentId: 's4', name: 'Acosta Rodríguez, Mateo', status: 'absent' },
      ],
    },
    '2026-08-10T00:00:00.000Z': {
      date: '2026-08-10T00:00:00.000Z',
      dateFormatted: '10/Ago',
      group: { label: '3°A', type: 'regular' },
      subject: { code: 'SOC', name: 'Socioemocional' },
      stats: { present: 27, absent: 3, late: 0, total: 30 },
      students: [
        { studentId: 's5', name: 'Bautista Pérez, Diego', status: 'absent' },
      ],
    },
  };

  const session = sessionsMap[date] || {
    date: date || '—',
    dateFormatted: '—',
    group: { label: '—', type: 'regular' },
    subject: { code: '—', name: '—' },
    stats: { present: 0, absent: 0, late: 0, total: 0 },
    students: [],
  };

  return {
    success: true,
    data: session,
  };
};

// ---------------------------------------------------------------------
// getGroupsForTeacher()
// ---------------------------------------------------------------------
// GET /api/teacher-subjects/me/groups-with-schedule
//
// Retorna los grupos del maestro con su horario del día actual
// (o el primero si hoy no tiene clase).
//
// Shape del response:
//   {
//     groups: [
//       {
//         _id: string,
//         label: string,        // "1°OFIMÁTICA"
//         type: string,         // "regular" | "taller"
//         subject: {
//           code: string,
//           name: string,
//           macroCategory: string,
//           isTutoria: boolean   // true si la materia es Tutoría/Ed. Socioemocional
//         },
//         totalStudents: number,
//         schedule: {
//           dayOfWeek: number,
//           dayName: string,
//           startTime: string,
//           endTime: string,
//           classroom: string,
//           isToday: boolean
//         }
//       }
//     ]
//   }
//
// Devuelve { success, data, message? } o { success: false, message }.
export const getGroupsForTeacher = async () => {
  try {
    const response = await api.get(GROUPS_WITH_SCHEDULE_ENDPOINT);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
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
      message: serverMessage || 'No se pudieron cargar los grupos.',
    };
  }
};

// ---------------------------------------------------------------------
// getGroupSchedule(groupId)
// ---------------------------------------------------------------------
// GET /api/groups/:groupId/schedule
//
// Retorna el horario semanal COMPLETO de un grupo (todas las materias,
// todos los maestros), agrupado por día (1=Lunes...5=Viernes).
//
// Roles permitidos: admin, principal, registrar, teacher, prefect,
//                   social_worker.
//
// Shape del response:
//   {
//     group: { _id, grade, section, label, shift, type },
//     shift_info: { name, shift, start, end },
//     schedule: {
//       1: [
//         {
//           subject_id, subject, subject_code,
//           classificationType, teacher, start, end,
//           startMinutes, endMinutes, block_count, block_names,
//           classroom, type?  // "receso" para recesos
//         }
//       ],
//       2: [...], 3: [...], 4: [...], 5: [...]
//     }
//   }
//
// Devuelve { success, data, message? } o { success: false, message }.
export const getGroupSchedule = async (groupId) => {
  if (!groupId) {
    return { success: false, message: 'Falta el ID del grupo.' };
  }
  try {
    const response = await api.get(`${GROUP_SCHEDULE_ENDPOINT}/${groupId}/schedule`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (status === 404) {
      return {
        success: false,
        message: serverMessage || 'No se encontró el horario para este grupo.',
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
      message: serverMessage || 'No se pudo cargar el horario del grupo.',
    };
  }
};

// ---------------------------------------------------------------------
// getGroupStudentsSummary()
// ---------------------------------------------------------------------
// GET /api/teacher-subjects/me/group-students-summary
//
// Retorna el resumen de alumnos de un grupo para una materia y período
// determinados, incluyendo promedio, asistencia y citatorios.
//
// Query params:
//   - group_id:   ID del grupo
//   - subject_id: ID de la materia
//   - period_id:  ID del período de calificación
//
// Shape del response:
//   {
//     group: { _id, label, macroCategory, totalStudents },
//     period: { _id, name },
//     stats: { groupAverage, atRiskCount, attendancePercentage },
//     students: [
//       {
//         _id, fullName, controlNumber, initials,
//         average, attendancePercentage, citationsCount,
//         guardian: { _id, fullName, relationship, phone }
//       }
//     ]
//   }
//
// Devuelve { success, data, message? } o { success: false, message }.
export const getGroupStudentsSummary = async (groupId, subjectId, periodId) => {
  try {
    const response = await api.get(GROUP_STUDENTS_SUMMARY_ENDPOINT, {
      params: { group_id: groupId, subject_id: subjectId, period_id: periodId },
    });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
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
      message: serverMessage || 'No se pudo cargar el directorio de alumnos.',
    };
  }
};

// ---------------------------------------------------------------------
// getStudentFile()
// ---------------------------------------------------------------------
// GET /api/teacher-subjects/me/student-file
//
// Retorna el expediente completo de un alumno para una materia específica:
// datos del alumno, métricas, calificaciones por trimestre, asistencia
// detallada y ficha pedagógica (si existe).
//
// Query params:
//   - student_id: ID del alumno
//   - group_id:   ID del grupo
//   - subject_id: ID de la materia
//
// Shape del response:
//   {
//     student: { _id, fullName, controlNumber, initials, guardian },
//     group: { _id, label, section },
//     subject: { _id, name, code },
//     metrics: { average, attendancePercentage, absencesCount },
//     grades: {
//       currentTrimester: string,
//       trimesters: {
//         T1: {
//           evaluations: { [fullName]: { weight, score, type } },
//           average: number,
//           averagingRule: string
//         },
//         T2: null | { ... },
//         T3: null | { ... }
//       }
//     },
//     attendance: [
//       { date, status, trimester }
//     ],
//     pedagogical: null | { ... }
//   }
//
// Notas:
//   - evaluations keys son nombres completos (ej. "Parcial 1", "Examen Parcial").
//   - type: "normal" | "extra" — las evaluaciones extra no tienen weight.
//   - attendance.trimester: "T1" | "T2" | "T3".
//
// Devuelve { success, data, message? } o { success: false, message }.
export const getStudentFile = async (studentId, groupId, subjectId) => {
  try {
    const response = await api.get(STUDENT_FILE_ENDPOINT, {
      params: { student_id: studentId, group_id: groupId, subject_id: subjectId },
    });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (status === 404) {
      return {
        success: false,
        message: serverMessage || 'No se encontró el expediente del alumno.',
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
      message: serverMessage || 'No se pudo cargar el expediente del alumno.',
    };
  }
};

// ---------------------------------------------------------------------
// getStudentTutoriaFile()
// ---------------------------------------------------------------------
// GET /api/teacher-subjects/me/student-tutoria-file
//
// Retorna el expediente completo de tutoría de un alumno: todas las
// materias del grupo con calificaciones, actividades, asistencia
// por materia, citatorios, avisos y conducta (estos últimos generales,
// no filtrados por trimestre).
//
// Query params:
//   - student_id: ID del alumno
//   - group_id:   ID del grupo
//
// Shape del response:
//   {
//     student: { _id, fullName, controlNumber, initials },
//     group: { _id, label, section },
//     taller: { _id, name },          // null si el grupo no es taller
//     citations: [                     // citatorios del alumno (general)
//       { scheduledDate, location, type, reason, status, creator, createdAt, rescheduleRequested }
//     ],
//     announcements: [                 // avisos exclusivos del alumno (general)
//       { title, message, priority, sender, createdAt, expiresAt }
//     ],
//     conduct: [                       // conducta del alumno (general)
//       { id, date, text }
//     ],
//     trimesters: {
//       T1: {
//         subjects: [
//           {
//             name: string,
//             isTaller: boolean,  // true si es materia de taller (Tecnología)
//             average: number | null,
//             activities: [{ name, date, grade }],
//             attendance: { present, absences, tardies, justified }
//           }
//         ],
//         attendanceBySubject: [
//           { name, attendance: { present, absences, tardies, justified } }
//         ],
//         attendance: { present, absences, tardies, justified }
//       },
//       T2: null | { ... },
//       T3: null | { ... }
//     }
//   }
//
// Para materias de taller (isTaller === true), el nombre del taller
// (ej. "OFIMÁTICA") viene en taller.name del nivel raíz, NO en subject.name
// (que es "Tecnología" para todas las materias de taller).
//
// Devuelve { success, data, message? } o { success: false, message }.
export const getStudentTutoriaFile = async (studentId, groupId) => {
  try {
    const response = await api.get(STUDENT_TUTORIA_FILE_ENDPOINT, {
      params: { student_id: studentId, group_id: groupId },
    });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (status === 404) {
      return {
        success: false,
        message: serverMessage || 'No se encontró el expediente de tutoría.',
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
      message: serverMessage || 'No se pudo cargar el expediente de tutoría.',
    };
  }
};

// ---------------------------------------------------------------------
// getGradingPeriods()
// ---------------------------------------------------------------------
// GET /api/teacher-subjects/me/grading-periods
//
// Retorna los períodos de evaluación del ciclo escolar activo.
//
// Shape del response:
//   {
//     periods: [
//       {
//         _id: string,
//         name: string,        // "1er Periodo - Agosto 2026"
//         order: number,
//         startDate: string,   // ISO 8601
//         endDate: string,     // ISO 8601
//         isClosed: boolean
//       }
//     ]
//   }
//
// Devuelve { success, data, message? } o { success: false, message }.
export const getGradingPeriods = async () => {
  try {
    const response = await api.get(GRADING_PERIODS_ENDPOINT);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
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
      message: serverMessage || 'No se pudieron cargar los períodos.',
    };
  }
};

// ---------------------------------------------------------------------
// getGradeValidation(gradingPeriodId)
// ---------------------------------------------------------------------
// GET /api/teacher-subjects/me/grades/validation
//
// Retorna la información de VALIDACIÓN DE CALIFICACIONES del maestro
// para un período específico (trimestre). Se usa en la pantalla
// "Calificaciones" del tab bar del maestro.
//
// Auth: JWT + role teacher + middlewares attachSchoolContext,
//       attachActiveSchoolYear.
//
// Query params:
//   - grading_period_id: ID del período a consultar (requerido).
//
// Shape del response:
//   {
//     gradingPeriod: {
//       _id, name,           // "1er Trimestre" / "2do Trimestre" / "Final"
//       order,               // 1, 2, 3
//       startDate,           // ISO 8601
//       endDate,             // ISO 8601
//       isClosed             // true si el período ya cerró
//     },
//     progress: {
//       totalGroups,         // total de grupos/materias del docente
//       closedGroups,        // grupos con trimestre cerrado
//       percentage           // 0-100
//     },
//     groups: [
//       {
//         _id,                                  // id único del grupo/materia/período
//         group: { _id, label, grade, section, type },
//         subject: { _id, name, code, macroCategory, isTutoria },
//         average,                             // number | null (null = sin calificaciones)
//         status,                              // 'closed' | 'review' | 'pending'
//         closedAt,                            // ISO | null
//         actaUrl,                             // URL del PDF del acta | null
//         studentStats: {
//           totalStudents,  // total de alumnos activos en el grupo
//           failedCount,    // alumnos con promedio < 6
//           atRiskCount,    // alumnos con promedio >= 6 y <= 7
//           ungradedCount   // alumnos sin calificación capturada
//         }
//       },
//       ...
//     ]
//   }
//
// Lógica de status:
//   - 'closed':  trimestre cerrado formalmente (GradeClosing existe).
//                closedAt tiene fecha.
//   - 'review':  hay EvaluationType configurados pero no cerrado.
//   - 'pending': sin EvaluationType — el maestro no ha armado la tabla.
//                En este caso studentStats.failedCount = 0,
//                studentStats.atRiskCount = 0,
//                studentStats.ungradedCount = totalStudents.
//
// Devuelve { success, data, message? } o { success: false, message }.
// NO lanza excepciones.
export const getGradeValidation = async (gradingPeriodId) => {
  if (!gradingPeriodId) {
    return { success: false, message: 'Falta el ID del período.' };
  }
  try {
    const response = await api.get(GRADE_VALIDATION_ENDPOINT, {
      params: { grading_period_id: gradingPeriodId },
    });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
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
      message: serverMessage || 'No se pudo cargar la validación de calificaciones.',
    };
  }
};

// ---------------------------------------------------------------------
// getGradeConfig({ groupId, subjectId, periodId })
// ---------------------------------------------------------------------
// GET /api/teacher-subjects/me/grade-config
//
// Query params requeridos:
//   - group_id: ObjectId
//   - subject_id: ObjectId
//   - period_id: ObjectId
//
// Retorna la configuración de regla de promedio (simple o ponderado)
// para un grupo+materia+período.
//
// Shape del response:
//   { config: { _id: string|null, averagingRule: 'simple'|'weighted' } }
//
// Si no existe configuración, devuelve defaults:
//   { config: { averagingRule: 'simple' } }
//
// Devuelve { success, data, message? } o { success: false, message }.
export const getGradeConfig = async ({ groupId, subjectId, periodId }) => {
  try {
    const response = await api.get(GRADE_CONFIG_ENDPOINT, {
      params: {
        group_id: groupId,
        subject_id: subjectId,
        period_id: periodId,
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (statusCode === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
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
      message: serverMessage || 'No se pudo cargar la configuración de calificaciones.',
    };
  }
};

// ---------------------------------------------------------------------
// updateGradeConfig({ groupId, subjectId, periodId, averagingRule })
// ---------------------------------------------------------------------
// PUT /api/teacher-subjects/me/grade-config
//
// Crea o actualiza la configuración de regla de promedio para un
// grupo+materia+período. Upsert: si ya existe la actualiza, si no
// existe la crea.
//
// Body requerido:
//   - group_id: ObjectId
//   - subject_id: ObjectId
//   - period_id: ObjectId
//   - averagingRule: 'simple' | 'weighted'
//
// Devuelve { success, data, message? } o { success: false, message }.
export const updateGradeConfig = async ({ groupId, subjectId, periodId, averagingRule }) => {
  try {
    const response = await api.put(GRADE_CONFIG_ENDPOINT, {
      group_id: groupId,
      subject_id: subjectId,
      period_id: periodId,
      averagingRule,
    });
    return { success: true, data: response.data };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (statusCode === 400) {
      return { success: false, message: serverMessage || 'Datos inválidos.' };
    }
    if (statusCode === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
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
      message: serverMessage || 'No se pudo guardar la configuración de promedio.',
    };
  }
};

// ---------------------------------------------------------------------
// getEvaluationTypes({ groupId, subjectId, periodId })
// ---------------------------------------------------------------------
// GET /api/teacher-subjects/me/evaluation-types
//
// Query params requeridos:
//   - group_id: ObjectId
//   - subject_id: ObjectId
//   - period_id: ObjectId
//
// Lista las columnas de evaluación (normales y puntos extra) para un
// grupo+materia+período, ordenadas por order.
//
// Shape del response:
//   {
//     evaluationTypes: [
//       { _id, name, abbreviation, type, percentage, maxPoints, order }
//     ]
//   }
//
// Devuelve { success, data, message? } o { success: false, message }.
export const getEvaluationTypes = async ({ groupId, subjectId, periodId }) => {
  try {
    const response = await api.get(EVALUATION_TYPES_ENDPOINT, {
      params: {
        group_id: groupId,
        subject_id: subjectId,
        period_id: periodId,
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (statusCode === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
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
      message: serverMessage || 'No se pudieron cargar las evaluaciones.',
    };
  }
};

// ---------------------------------------------------------------------
// createEvaluationType({ groupId, subjectId, periodId, name, abbreviation, type, percentage, maxPoints })
// ---------------------------------------------------------------------
// POST /api/teacher-subjects/me/evaluation-types
//
// Crea una columna de evaluación (normal o punto extra) para un
// grupo+materia+período.
//
// Body requerido:
//   - group_id: ObjectId
//   - subject_id: ObjectId
//   - period_id: ObjectId
//   - name: string
//   - abbreviation: string (máx 4 chars, se guarda en mayúsculas)
//   - type: 'normal' | 'extra'
//   - percentage: number (requerido si type === 'normal')
//   - maxPoints: number (requerido si type === 'extra')
//
// Devuelve { success, data, message? } o { success: false, message }.
// Errores: 400 (campos faltantes/inválidos), 403 (no asignado), 409 (abreviatura duplicada).
export const createEvaluationType = async ({ groupId, subjectId, periodId, name, abbreviation, type, percentage, maxPoints }) => {
  try {
    const body = {
      group_id: groupId,
      subject_id: subjectId,
      period_id: periodId,
      name,
      abbreviation,
      type,
    };
    if (type === 'normal') {
      body.percentage = percentage;
    } else {
      body.maxPoints = maxPoints;
    }
    const response = await api.post(EVALUATION_TYPES_ENDPOINT, body);
    return { success: true, data: response.data };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (statusCode === 400) {
      return { success: false, message: serverMessage || 'Datos inválidos.' };
    }
    if (statusCode === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (statusCode === 403) {
      return { success: false, message: serverMessage || 'No tienes permiso para crear evaluaciones en este grupo.' };
    }
    if (statusCode === 409) {
      return { success: false, message: serverMessage || 'Ya existe una evaluación con esa abreviatura.', reason: 'conflict' };
    }
    if (!error?.response) {
      return {
        success: false,
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      };
    }
    return {
      success: false,
      message: serverMessage || 'No se pudo crear la evaluación.',
    };
  }
};

// ---------------------------------------------------------------------
// deleteEvaluationType(evaluationTypeId)
// ---------------------------------------------------------------------
// DELETE /api/teacher-subjects/me/evaluation-types/:evaluationTypeId
//
// Elimina una columna de evaluación y todas sus calificaciones
// asociadas. Solo el maestro que creó la evaluación puede eliminarla.
//
// Path param:
//   - evaluationTypeId: ObjectId
//
// Devuelve { success, data, message? } o { success: false, message }.
// Errores: 400 (ID inválido), 404 (no encontrado).
export const deleteEvaluationType = async (evaluationTypeId) => {
  try {
    const response = await api.delete(`${EVALUATION_TYPES_ENDPOINT}/${evaluationTypeId}`);
    return { success: true, data: response.data };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (statusCode === 400) {
      return { success: false, message: serverMessage || 'ID de evaluación inválido.' };
    }
    if (statusCode === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (statusCode === 404) {
      return { success: false, message: serverMessage || 'Evaluación no encontrada.' };
    }
    if (!error?.response) {
      return {
        success: false,
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      };
    }
    return {
      success: false,
      message: serverMessage || 'No se pudo eliminar la evaluación.',
    };
  }
};

// ---------------------------------------------------------------------
// updateEvaluationType(evaluationTypeId, { name, abbreviation, percentage })
// ---------------------------------------------------------------------
// PUT /api/teacher-subjects/me/evaluation-types/:evaluationTypeId
//
// Actualiza una columna de evaluación existente. Todos los campos
// del body son opcionales (solo se envían los que cambian).
//
// Path param:
//   - evaluationTypeId: ObjectId
//
// Body (campos opcionales):
//   - name: string
//   - abbreviation: string (máx 4 chars)
//   - percentage: number (solo para type 'normal')
//
// Devuelve { success, data, message? } o { success: false, message }.
// Errores: 400 (campos inválidos), 404 (no encontrado), 409 (abreviatura duplicada).
export const updateEvaluationType = async (evaluationTypeId, { name, abbreviation, percentage } = {}) => {
  try {
    const body = {};
    if (name !== undefined) body.name = name;
    if (abbreviation !== undefined) body.abbreviation = abbreviation;
    if (percentage !== undefined) body.percentage = percentage;

    const response = await api.put(`${EVALUATION_TYPES_ENDPOINT}/${evaluationTypeId}`, body);
    return { success: true, data: response.data };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (statusCode === 400) {
      return { success: false, message: serverMessage || 'Datos inválidos.' };
    }
    if (statusCode === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (statusCode === 404) {
      return { success: false, message: serverMessage || 'Evaluación no encontrada.' };
    }
    if (statusCode === 409) {
      return { success: false, message: serverMessage || 'Ya existe una evaluación con esa abreviatura.', reason: 'conflict' };
    }
    if (!error?.response) {
      return {
        success: false,
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      };
    }
    return {
      success: false,
      message: serverMessage || 'No se pudo actualizar la evaluación.',
    };
  }
};

// ---------------------------------------------------------------------
// getGrades({ groupId, subjectId, periodId })
// ---------------------------------------------------------------------
// GET /api/teacher-subjects/me/grades
//
// Query params requeridos:
//   - group_id: ObjectId
//   - subject_id: ObjectId
//   - period_id: ObjectId
//
// Devuelve la matriz completa de calificaciones: alumnos × evaluaciones,
// con promedios calculados según la averagingRule configurada.
//
// Shape del response:
//   {
//     students: [{ _id, fullName, enrollment_id }],
//     evaluationTypes: [{ _id, name, abbreviation, type, percentage, maxPoints, order }],
//     grades: { studentId: { evalTypeId: number } },
//     averages: { studentId: number },
//     averagingRule: 'simple' | 'weighted'
//   }
//
// Devuelve { success, data, message? } o { success: false, message }.
export const getGrades = async ({ groupId, subjectId, periodId }) => {
  try {
    const response = await api.get(TEACHER_GRADES_ENDPOINT, {
      params: {
        group_id: groupId,
        subject_id: subjectId,
        period_id: periodId,
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (statusCode === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
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
// saveGrade({ enrollmentId, evaluationTypeId, value, groupId, subjectId, periodId })
// ---------------------------------------------------------------------
// POST /api/teacher-subjects/me/grades
//
// Guarda una calificación de un alumno en una evaluación específica
// (upsert). Calcula y devuelve el promedio actualizado del alumno.
//
// Body requerido:
//   - enrollment_id: ObjectId
//   - evaluation_type_id: ObjectId
//   - value: number (0-10 para normal, 0-maxPoints para extra)
//   - group_id: ObjectId
//   - subject_id: ObjectId
//   - period_id: ObjectId
//
// Devuelve { success, data, message? } o { success: false, message }.
// Errores: 400 (campos faltantes/rango inválido), 404 (no encontrado).
export const saveGrade = async ({ enrollmentId, evaluationTypeId, value, groupId, subjectId, periodId }) => {
  try {
    const response = await api.post(TEACHER_GRADES_ENDPOINT, {
      enrollment_id: enrollmentId,
      evaluation_type_id: evaluationTypeId,
      value,
      group_id: groupId,
      subject_id: subjectId,
      period_id: periodId,
    });
    return { success: true, data: response.data };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (statusCode === 400) {
      return { success: false, message: serverMessage || 'Datos inválidos.' };
    }
    if (statusCode === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (statusCode === 404) {
      return { success: false, message: serverMessage || 'Evaluación o inscripción no encontrada.' };
    }
    if (!error?.response) {
      return {
        success: false,
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      };
    }
    return {
      success: false,
      message: serverMessage || 'No se pudo guardar la calificación.',
    };
  }
};

// ---------------------------------------------------------------------
// closeGrades({ groupId, subjectId, periodId })
// ---------------------------------------------------------------------
// POST /api/teacher-subjects/me/grades/close
//
// Cierra el trimestre para un combo grupo+materia+período.
// Body requerido: group_id, subject_id, period_id.
//
// Devuelve { success, data: { closedAt }, message? } o
// { success: false, message }.
// Errores: 400 (campos faltantes, sin evaluaciones, calificaciones
// pendientes), 401 (sesión expirada).
export const closeGrades = async ({ groupId, subjectId, periodId }) => {
  try {
    const response = await api.post(`${TEACHER_GRADES_ENDPOINT}/close`, {
      group_id: groupId,
      subject_id: subjectId,
      period_id: periodId,
    });
    return { success: true, data: response.data, message: response.data?.message };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (statusCode === 400) {
      return { success: false, message: serverMessage || 'No se puede cerrar el trimestre.' };
    }
    if (statusCode === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
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
      message: serverMessage || 'No se pudo cerrar el trimestre.',
    };
  }
};

// ---------------------------------------------------------------------
// openGrades({ groupId, subjectId, periodId })
// ---------------------------------------------------------------------
// POST /api/teacher-subjects/me/grades/open
//
// Desbloquea el trimestre para un combo grupo+materia+período.
// Elimina el registro GradeClosing, permitiendo volver a editar.
//
// Body requerido: group_id, subject_id, period_id.
//
// Devuelve { success, message } o { success: false, message }.
export const openGrades = async ({ groupId, subjectId, periodId }) => {
  try {
    const response = await api.post(`${TEACHER_GRADES_ENDPOINT}/open`, {
      group_id: groupId,
      subject_id: subjectId,
      period_id: periodId,
    });
    return { success: true, message: response.data?.message };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (statusCode === 400) {
      return { success: false, message: serverMessage || 'Datos inválidos.' };
    }
    if (statusCode === 404) {
      return { success: false, message: serverMessage || 'No se encontró un cierre para este combo.' };
    }
    if (statusCode === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
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
      message: serverMessage || 'No se pudo desbloquear el trimestre.',
    };
  }
};

// ---------------------------------------------------------------------
// getAttendanceSessions({ groupId, subjectId, periodId })
// ---------------------------------------------------------------------
// GET /api/teacher-subjects/me/attendance-sessions
//
// Query params requeridos:
//   - group_id: ObjectId
//   - subject_id: ObjectId
//   - period_id: ObjectId
//
// Retorna las sesiones de asistencia de un grupo+materia dentro de un
// período, más la lista de alumnos del grupo.
//
// Shape del response:
//   {
//     sessions: [
//       {
//         _id: string,
//         date: string,          // ISO 8601
//         dateFormatted: string, // "25/08/2026"
//         records: [
//           { student_id: string, status: string, studentName: string }
//         ],
//         summary: { total, present, retard, absent, justified }
//       }
//     ],
//     students: [
//       { _id: string, fullName: string }
//     ]
//   }
//
// Devuelve { success, data, message? } o { success: false, message }.
export const getAttendanceSessions = async ({ groupId, subjectId, periodId }) => {
  try {
    const response = await api.get(ATTENDANCE_SESSIONS_ENDPOINT, {
      params: {
        group_id: groupId,
        subject_id: subjectId,
        period_id: periodId,
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
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
      message: serverMessage || 'No se pudieron cargar las sesiones de asistencia.',
    };
  }
};

// ---------------------------------------------------------------------
// createAttendanceSession({ groupId, subjectId, date, periodId })
// ---------------------------------------------------------------------
// POST /api/teacher-subjects/me/attendance-sessions
//
// Crea una nueva sesión de asistencia (columna en el grid) con todos
// los alumnos marcados como "presente" por defecto.
//
// Body requerido:
//   - group_id: ObjectId
//   - subject_id: ObjectId
//   - date: string (YYYY-MM-DD)
//   - period_id: ObjectId
//
// Devuelve { success, data, message? } o { success: false, message }.
// Errores: 400 (campos faltantes/inválidos), 403 (no asignado), 409 (ya existe).
export const createAttendanceSession = async ({ groupId, subjectId, date, periodId }) => {
  try {
    const response = await api.post(ATTENDANCE_SESSIONS_ENDPOINT, {
      group_id: groupId,
      subject_id: subjectId,
      date,
      period_id: periodId,
    });
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 400) {
      return { success: false, message: serverMessage || 'Datos inválidos.' };
    }
    if (status === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (status === 403) {
      return { success: false, message: serverMessage || 'No tienes permiso para crear sesiones en este grupo.' };
    }
    if (status === 409) {
      return { success: false, message: serverMessage || 'Ya existe una sesión para esta fecha.', reason: 'conflict' };
    }
    if (!error?.response) {
      return {
        success: false,
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      };
    }
    return {
      success: false,
      message: serverMessage || 'No se pudo crear la sesión de asistencia.',
    };
  }
};

// ---------------------------------------------------------------------
// updateAttendanceRecord({ sessionId, studentId, status })
// ---------------------------------------------------------------------
// PATCH /api/teacher-subjects/me/attendance-sessions/:sessionId/records/:studentId
//
// Actualiza el status de un alumno específico en una sesión de asistencia.
//
// Path params: sessionId, studentId
// Body: { status: 'present' | 'retard' | 'absent' | 'justified' }
//
// Devuelve { success, data, message? } o { success: false, message }.
export const updateAttendanceRecord = async ({ sessionId, studentId, status }) => {
  try {
    const url = `${ATTENDANCE_SESSIONS_ENDPOINT}/${sessionId}/records/${studentId}`;
    const response = await api.patch(url, { status });
    return { success: true, data: response.data };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (statusCode === 400) {
      return { success: false, message: serverMessage || 'Status inválido.' };
    }
    if (statusCode === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (statusCode === 404) {
      return { success: false, message: serverMessage || 'Sesión o alumno no encontrado.' };
    }
    if (!error?.response) {
      return {
        success: false,
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      };
    }
    return {
      success: false,
      message: serverMessage || 'No se pudo actualizar el registro de asistencia.',
    };
  }
};

// ---------------------------------------------------------------------
// getStudentConductDetail(logId)
// ---------------------------------------------------------------------
// GET /api/conduct-logs/:logId
//
// Retorna el detalle completo de un reporte de conducta.
//
// Path params:
//   - logId: ID del reporte de conducta
//
// Response shape:
//   {
//     _id, school,
//     student_id: { _id, controlNumber, first_name, last_name },
//     school_year_id: { _id, name, startDate, endDate, isActive },
//     eventType: "demerit" | "merit",
//     severity: "minor" | "moderate" | "severe" | null,
//     points_impact: number,
//     description: string,
//     details: string | null,
//     incident_date: ISO date,
//     reported_by: { _id, name, email, role },
//     status: "active" | "cancelled",
//     createdAt, updatedAt
//   }
//
// Devuelve { success, data, message? } o { success: false, message }.
export const getStudentConductDetail = async (logId) => {
  try {
    const response = await api.get(`/api/conduct-logs/${logId}`);
    return { success: true, data: response.data };
  } catch (error) {
    const statusCode = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (statusCode === 401) {
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (statusCode === 404) {
      return { success: false, message: serverMessage || 'Reporte de conducta no encontrado.' };
    }
    if (!error?.response) {
      return {
        success: false,
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      };
    }
    return {
      success: false,
      message: serverMessage || 'No se pudo cargar el detalle del reporte de conducta.',
    };
  }
};
