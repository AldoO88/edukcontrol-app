// =====================================================================
// notificationData.js
// ---------------------------------------------------------------------
// Helper para parsear el payload `data` que el backend adjunta a cada
// push y traducirlo a una ruta interna de Expo Router (deep linking).
//
// El backend manda `data.kind` con uno de estos valores (definidos en
// services/notification.service.js del backend):
//   - "attendance"              → tap de RFID/face (alumno entró/salió)
//   - "absence"                 → ausencia o retardo marcado
//   - "citation"                → citatorio nuevo para el tutor
//   - "citation_rescheduled"    → citatorio reagendado
//   - "citation_cancelled"      → citatorio cancelado
//   - "citation_confirmed"      → tutor confirmó (va al staff creator)
//   - "citation_reschedule_request" → tutor pide reagendar (al staff)
//   - "announcement"            → aviso nuevo (general/grupo/alumno)
//
// Cada kind mapea a una ruta según el rol del usuario (tutor vs staff).
// Si el kind es desconocido o el usuario no está logueado, retorna null
// y el caller decide qué hacer (ej: solo navegar al dashboard).
// =====================================================================

// =====================================================================
// notificationDataToRoute(notificationData, role)
// =====================================================================
// notificationData: el objeto `data` que viene en notification.request.content.data
//   (Expo lo entrega como objeto plano, no como string JSON).
// role: string con el rol del usuario ('tutor', 'teacher', etc.).
//
// Returns: { pathname: string, params: object } | null
// =====================================================================
const notificationDataToRoute = (notificationData, role) => {
  if (!notificationData || typeof notificationData !== 'object') return null;

  const kind = notificationData.kind;
  if (!kind) return null;

  // Helper para construir el objeto de retorno.
  const buildRoute = (pathname, params = {}) => ({ pathname, params });

  // -----------------------------------------------------------------
  // RUTAS PARA TUTORES (rol = 'tutor')
  // -----------------------------------------------------------------
  if (role === 'tutor') {
    switch (kind) {
      case 'attendance':
      case 'absence': {
        // Las pantallas de attendance/conduct del tutor son top-level
        // (no hay drill-down por attendance log individual desde push).
        // Navegamos a la pantalla de asistencia del alumno afectado.
        const studentId = notificationData.student_id;
        if (studentId) {
          return buildRoute('/(guardian)/attendance', { studentId });
        }
        return buildRoute('/(guardian)/attendance');
      }

      case 'citation':
      case 'citation_rescheduled': {
        // Drill-down al detalle del citatorio.
        const citationId = notificationData.citation_id;
        if (citationId) {
          return buildRoute('/(guardian)/announcements/citation/[id]', {
            id: citationId,
          });
        }
        return buildRoute('/(guardian)/announcements');
      }

      case 'citation_cancelled': {
        // Citatorio cancelado: el más probable es que el tutor quiera
        // ver el listado de citatorios activos, no el detalle del
        // cancelado. Navegamos al listado.
        return buildRoute('/(guardian)/announcements', { kind: 'citation' });
      }

      case 'announcement': {
        const announcementId = notificationData.announcement_id;
        if (announcementId) {
          return buildRoute('/(guardian)/announcements/announcement/[id]', {
            id: announcementId,
          });
        }
        return buildRoute('/(guardian)/announcements');
      }

      default:
        return null;
    }
  }

  // -----------------------------------------------------------------
  // RUTAS PARA STAFF (teacher, admin, prefect, social_worker, principal)
  // -----------------------------------------------------------------
  switch (kind) {
    case 'citation_confirmed':
    case 'citation_reschedule_request': {
      // Staff creator recibe push cuando el tutor confirma o pide
      // reagendar. Navegamos al detalle del citatorio.
      const citationId = notificationData.citation_id;
      if (citationId) {
        return buildRoute('/(teacher)/citations/[id]', { id: citationId });
      }
      return buildRoute('/(teacher)/citations');
    }

    case 'citation':
    case 'citation_rescheduled':
    case 'citation_cancelled': {
      // Variantes donde el staff también podría recibir citatorio
      // notifications en el futuro (ej. multi-tutor). Por ahora fallback.
      const cid = notificationData.citation_id;
      if (cid) {
        return buildRoute('/(teacher)/citations/[id]', { id: cid });
      }
      return buildRoute('/(teacher)/citations');
    }

    case 'announcement': {
      const announcementId = notificationData.announcement_id;
      if (announcementId) {
        return buildRoute('/(teacher)/announcements/[id]', {
          id: announcementId,
        });
      }
      return buildRoute('/(teacher)/announcements');
    }

    default:
      return null;
  }
};

export default notificationDataToRoute;
