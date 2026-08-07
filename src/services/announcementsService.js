// =====================================================================
// announcementsService.js
// ---------------------------------------------------------------------
// Capa de servicio para el feed de "Avisos" del tutor.
//
// Endpoints:
//   1. GET /api/guardians/me/announcements
//      Devuelve el feed unificado de avisos + citatorios del tutor,
//      paginado y filtrable por student_id.
//
//   2. GET /api/guardians/me/announcements/:id
//      Devuelve UN aviso por su _id. El endpoint es específico
//      para avisos (no para citatorios — ver #3).
//
//   3. GET /api/guardians/me/citations/:id
//      Devuelve UN citatorio por su _id. Es la contraparte del
//      endpoint #2 para citatorios. La respuesta incluye
//      `student.controlNumber` para que el front pueda mostrar
//      la matrícula sin un fetch extra.
//
//   4. PATCH /api/guardians/me/students/:studentId/citations/:citationId/confirm
//      Confirma la asistencia del tutor al citatorio. Cambia el
//      status de 'pending' a 'confirmed'. Solo aplica a citatorios
//      en status 'pending'.
//
// Auth: JWT (tutor autenticado). El backend ya aplica los middlewares
// attachSchoolContext + attachActiveSchoolYear.
//
// Reglas de filtrado del feed (importantes para la UI):
//   - Vencidos NO aparecen (si expiresAt < ahora, se filtran).
//   - Citatorios terminales NO aparecen (status completed / no_show).
//   - Sort: eventDate DESC (mezcla createdAt de avisos y
//     scheduledDate de citatorios en un único feed ordenado).
// =====================================================================

// Cliente axios. Trae ya el interceptor JWT que añade el header
// Authorization automáticamente.
import api from './api';

// Endpoint base. Sigue la convención de prefijos del proyecto:
// /auth/* NO lleva prefijo /api/, el resto SÍ. Ver api.js.
const ANNOUNCEMENTS_ENDPOINT = '/api/guardians/me/announcements';

// ---------------------------------------------------------------------
// getAnnouncements(options)
// ---------------------------------------------------------------------
// Opciones (todas opcionales):
//   - studentId:     ObjectId del hijo. Si viene, el backend filtra
//                    a ese hijo. Si no viene, devuelve el feed global
//                    (mezcla de "general", "group" y "student" del
//                    tutor). Si el studentId NO es un hijo del tutor,
//                    el backend responde 403.
//   - schoolYearId:  Override del ciclo escolar. Si no viene, el
//                    backend usa attachActiveSchoolYear.
//   - limit:         Cantidad máxima de items a devolver (max 200).
//                    Default del backend: 50.
//
// Retorna { success: true, data: { items, total, truncated } } o
// { success: false, message }. NO lanza excepciones — los errores
// de red/HTTP se mapean a un objeto con success:false para que el
// hook los maneje sin try/catch.
//
// Mapeo de status codes (alineado con la documentación del endpoint):
//   400 → student_id mal formado.
//   401 → sin JWT (manejado también por api.js; limpiamos sesión).
//   403 → student_id no es hijo del tutor.
//   409 → escuela sin ciclo escolar activo configurado.
//   500 → error inesperado (logueado en el backend).
// ---------------------------------------------------------------------
export const getAnnouncements = async (options = {}) => {
  // Construimos los query params con URLSearchParams (built-in en
  // RN/Hermes). Si no hay params, la URL queda limpia sin "?" suelto.
  const params = new URLSearchParams();
  if (options.studentId) {
    params.append('student_id', options.studentId);
  }
  if (options.schoolYearId) {
    params.append('school_year_id', options.schoolYearId);
  }
  if (typeof options.limit === 'number' && options.limit > 0) {
    params.append('limit', String(options.limit));
  }

  const queryString = params.toString();
  const url = `${ANNOUNCEMENTS_ENDPOINT}${
    queryString ? `?${queryString}` : ''
  }`;

  try {
    const response = await api.get(url);
    // El backend envuelve la respuesta como { success, data, message? }.
    // Si lo hace, sacamos data; si no, devolvemos el body crudo.
    const body = response.data || {};
    const payload = body.data
      ? body.data
      : { items: body.items || [], total: body.total || 0, truncated: !!body.truncated };
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
    if (status === 403) {
      return {
        success: false,
        message: serverMessage || 'No tienes permiso para ver los avisos de este estudiante.',
      };
    }
    if (status === 400) {
      return {
        success: false,
        message: serverMessage || 'La solicitud es inválida.',
      };
    }
    if (status === 409) {
      return {
        success: false,
        message: serverMessage || 'La escuela no tiene un ciclo escolar activo configurado.',
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
// getAnnouncementById(id)
// ---------------------------------------------------------------------
// GET /api/guardians/me/announcements/:id
// Path param: id (ObjectId del aviso).
//
// Devuelve UN aviso con la shape AnnouncementItem del feed (sin
// truncar). En el feed los items pueden venir truncados (preview)
// y limitados por paginación; en el detalle queremos el body
// completo (`message` sin truncar).
//
// Errores comunes:
//   404 → id no encontrado, o no pertenece a este tutor.
//   401 → token inválido (manejado en api.js).
// ---------------------------------------------------------------------
export const getAnnouncementById = async (id) => {
  if (!id) {
    return {
      success: false,
      message: 'Falta el id del aviso.',
    };
  }
  try {
    const response = await api.get(`/api/guardians/me/announcements/${id}`);
    // Aceptamos tanto el shape envuelto { success, data, message? }
    // como el body crudo. Algunos endpoints devuelven uno u otro.
    const body = response.data || {};
    const payload = body.data ? body.data : body;

    // -----------------------------------------------------------------
    // Normalización: el detail del backend NO incluye `kind` en el
    // body (el kind ya viaja en la URL, así que el backend lo
    // considera redundante). Lo agregamos acá para que el consumer
    // pueda discriminar con `item.kind` sin tener que conocer la
    // URL o hacer suposiciones sobre el shape.
    //
    // Además, el detail expone los campos de audiencia a NIVEL RAÍZ
    // (targetType, targetGroups, targetStudents) — distinto del
    // feed, que los envuelve en `audience`. Para que el consumer
    // (helper, card, detalle) use el mismo código para ambos
    // endpoints, normalizamos acá: si el detail trae los campos
    // top-level, los envolvemos en un `audience` con el mismo shape
    // del feed. Si ya trae `audience`, lo respetamos.
    // -----------------------------------------------------------------
    let audience = payload.audience;
    if (!audience && payload.targetType) {
      audience = {
        type: payload.targetType,
        // El detail no tiene `summary` pre-formateado; el helper
        // compone el label como fallback.
        summary: null,
        groups: payload.targetGroups || [],
        students: payload.targetStudents || [],
      };
    }

    return {
      success: true,
      data: {
        ...payload,
        kind: 'announcement',
        audience,
      },
    };
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
// getCitationById(id)
// ---------------------------------------------------------------------
// GET /api/guardians/me/citations/:id
// Path param: id (ObjectId del citatorio).
//
// Devuelve UN citatorio con la shape CitationItem del feed. La
// respuesta incluye `student.controlNumber` para que el front
// pueda mostrar la matrícula del alumno sin un fetch extra.
//
// Errores comunes:
//   404 → id no encontrado, o no pertenece a este tutor.
//   401 → token inválido (manejado en api.js).
// ---------------------------------------------------------------------
export const getCitationById = async (id) => {
  if (!id) {
    return {
      success: false,
      message: 'Falta el id del citatorio.',
    };
  }
  try {
    const response = await api.get(`/api/guardians/me/citations/${id}`);
    const body = response.data || {};
    const payload = body.data ? body.data : body;
    // Normalización: el detail del backend no incluye `kind` en el
    // body (el kind ya viaja en la URL). Lo agregamos acá para que
    // el consumer pueda discriminar con `item.kind` sin tener que
    // conocer la URL. Ver getAnnouncementById para el mismo
    // rationale.
    return { success: true, data: { ...payload, kind: 'citation' } };
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
// confirmCitation(studentId, citationId)
// ---------------------------------------------------------------------
// PATCH /api/guardians/me/students/:studentId/citations/:citationId/confirm
// Path params:
//   - studentId: ObjectId del alumno asociado al citatorio.
//   - citationId: ObjectId del citatorio a confirmar.
//
// Cambia el status del citatorio de 'pending' a 'confirmed'. Solo
// aplica a citatorios en status 'pending' (los 'confirmed' o
// terminales devuelven 409 o 400 según la implementación del backend).
//
// Retorna el citatorio actualizado en `data` para que el front pueda
// refrescar la UI sin un fetch extra.
//
// Errores comunes:
//   404 → citatorio o alumno no encontrado, o no pertenece al tutor.
//   409 → citatorio ya confirmado / cancelado / no_show.
//   401 → token inválido (manejado en api.js).
// ---------------------------------------------------------------------
export const confirmCitation = async (studentId, citationId) => {
  if (!studentId || !citationId) {
    return {
      success: false,
      message: 'Faltan datos para confirmar el citatorio.',
    };
  }
  try {
    const response = await api.patch(
      `/api/guardians/me/students/${studentId}/citations/${citationId}/confirm`,
    );
    const body = response.data || {};
    const payload = body.data ? body.data : body;
    return { success: true, data: payload };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 404) {
      return {
        success: false,
        message: serverMessage || 'No se encontró el citatorio.',
        reason: 'not_found',
      };
    }
    if (status === 409) {
      return {
        success: false,
        message: serverMessage || 'Este citatorio ya no se puede confirmar.',
        reason: 'conflict',
      };
    }
    if (status === 400) {
      return {
        success: false,
        message: serverMessage || 'La solicitud para confirmar el citatorio es inválida.',
      };
    }
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
      message: serverMessage || 'No se pudo confirmar el citatorio. Inténtalo de nuevo.',
    };
  }
};
