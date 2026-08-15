// =====================================================================
// teacherService.js
// ---------------------------------------------------------------------
// Capa de servicio para endpoints del teacher (maestro). El backend
// identifica al teacher por el JWT del header Authorization (el
// "me" en el path), por lo que NO necesitamos pasar el id del user.
//
// Endpoints:
//   - getTeacherDashboard() → GET /teacher-subjects/me/dashboard
//     Retorna teacher + school + currentSchoolYear + todaySchedule.
//   - getGroupStudents(groupId) → GET /teacher-subjects/me/groups/:groupId/students
//     Retorna group info + students array + total.
//   - saveAttendance(data) → POST /teacher-subjects/me/attendance
//     Guarda el pase de lista de un grupo.
//   - createTeacherAnnouncement(payload) → POST /teacher-subjects/me/announcements
//     Crea un aviso del maestro con prioridad de 2 niveles
//     (INFORMATIVO | URGENTE) dirigido a uno o varios grupos.
//   - updateAttendanceRecord(payload) → PATCH /api/attendance
//     Actualiza el estado de asistencia de un alumno en una fecha
//     concreta desde la matriz matricial de asistencias.
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
const TEACHER_ANNOUNCEMENTS_ENDPOINT = '/api/teacher-subjects/me/announcements';

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
// POST /api/teacher-subjects/me/announcements
//
// Crea un aviso del maestro (rol teacher). El backend identifica al
// maestro por el JWT del header Authorization.
//
// IMPORTANTE (estructura estricta de prioridad de 2 niveles): el
// backend SOLO acepta dos niveles de prioridad, sin ambigüedad:
//   - "INFORMATIVO" → aviso normal / informativo.
//   - "URGENTE"     → aviso urgente (destacado para el tutor).
// No hay niveles intermedios ni "alta/media/baja".
//
// Body del request:
//   {
//     group_ids: string[],     // ObjectIds de los grupos destino.
//                              // Se exige al menos UNO.
//     priority: "INFORMATIVO" | "URGENTE",
//     title: string,           // Título del aviso (no vacío).
//     content: string,         // Mensaje para los tutores (no vacío).
//   }
//
// Shape del response (201):
//   {
//     message: "Announcement created successfully.",
//     announcement: {
//       _id: string,
//       title: string,
//       content: string,
//       priority: "INFORMATIVO" | "URGENTE",
//       group_ids: string[],
//       created_at: string,
//       ...
//     }
//   }
//
// Devuelve { success, data, message? } o { success: false, message }.
// NO lanza excepciones.
export const createTeacherAnnouncement = async (payload) => {
  try {
    const response = await api.post(TEACHER_ANNOUNCEMENTS_ENDPOINT, payload);
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
      message: 'No se pudo publicar el aviso. Inténtalo de nuevo.',
    };
  }
};

// ---------------------------------------------------------------------
// updateAttendanceRecord(payload)
// ---------------------------------------------------------------------
// PATCH /api/attendance
//
// Actualiza el estado de asistencia de UN alumno en UNA fecha
// concreta. Se dispara desde el modal de edición de la matriz
// matricial de asistencias ("Pase de Lista Matricial"), cuando el
// maestro toca una celda y guarda el nuevo estado.
//
// Body del request:
//   {
//     groupId: string,
//     studentId: string,
//     date: string,        // "2026-08-10" (ISO yyyy-mm-dd)
//     status: string,      // "P" | "F" | "R" | "J" | "-"
//     note?: string | null // Motivo o aclaración (opcional).
//   }
//
// Shape del response (200):
//   {
//     message: string,
//     record: { ... }
//   }
//
// Devuelve { success, data, message? } o { success: false, message }.
// NO lanza excepciones.
export const updateAttendanceRecord = async (payload) => {
  try {
    const response = await api.patch(ATTENDANCE_MATRIX_ENDPOINT, payload);
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
      message: 'No se pudo actualizar la asistencia. Inténtalo de nuevo.',
    };
  }
};
