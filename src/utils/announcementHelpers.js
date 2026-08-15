// =====================================================================
// announcementHelpers.js
// ---------------------------------------------------------------------
// Helpers para transformar el feed que llega del backend
// (GET /api/guardians/me/announcements) al shape que consume
// <AnnouncementCard>, y para formatear campos derivados
// (fechas, targetType, motivo del citatorio, status derivado).
//
// Shape del backend (un solo feed unificado):
//
//   AnnouncementItem:
//     {
//       _id, kind: 'announcement',
//       priority: 'informative' | 'urgent',
//       title, message,
//       createdAt, expiresAt,
//       sender: { _id, name, last_name, role } | null,
//       audience: {
//         type: 'general' | 'group' | 'student',
//         groups: [{ _id, grade, section, shift, school_year_id, label }],
//         students: [{ _id, first_name, last_name, photoUrl }],
//       },
//       eventDate,
//     }
//
//   CitationItem (feed):
//     {
//       _id, kind: 'citation',
//       type: 'academic' | 'behavioral' | 'administrative',
//       reason,
//       scheduledDate, status: 'pending' | 'confirmed',
//       student: { _id, first_name, last_name, photoUrl } | null,
//       creator: { _id, name, last_name, role } | null,
//       eventDate,
//     }
//
//   CitationDetail (endpoint /citations/:id — el detail trae MÁS
//   campos y los 4 estados del status, no solo pending/confirmed):
//     {
//       _id,
//       school, schoolYear: { _id, name, startDate, endDate, isActive },
//       student: { _id, first_name, last_name, photoUrl, controlNumber },
//       creator: { _id, name, last_name, role },
//       scheduledDate,
//       type: 'academic' | 'behavioral' | 'administrative',
//       reason,
//       status: 'pending' | 'confirmed' | 'completed' | 'no_show',
//       createdAt, updatedAt,
//       // kind es inyectado por el service (ver announcementsService.js)
//     }
//
// Shape de <AnnouncementCard> (lo que el componente espera):
//
//   {
//     id,
//     kind: 'announcement' | 'citation',
//     priority: 'urgent' | 'informative' | null,
//     title,                             // citatorio: el TIPO ("Conductual")
//     description,                       // citatorio: el `reason` redactado
//     date,                              // formato corto: "24 oct"
//     targetType: string | null,         // "General" | "Grupo 2°A" | "Personal: Pedro"
//     citatorioStudentName: string|null,// nombre del alumno (citatorio)
//     citatorioStatus:                   // { label, bgClass, textClass } | null
//       {                              // label ∈ { ASISTIÓ, NO ASISTIÓ,
//         label,                       //   CONFIRMADO, HOY, PRÓXIMO,
//         bgClass,                     //   FUTURO, VENCIDO, PENDIENTE }
//         textClass,
//       },
//   }
// =====================================================================

// ---------------------------------------------------------------------
// CITATION_TYPE_LABELS
// ---------------------------------------------------------------------
// Mapeo del `type` del citatorio a la etiqueta en español que se
// muestra como TÍTULO de la card del citatorio (donde los anuncios
// muestran su `title`). "Aprovechamiento" / "Conductual" /
// "Administrativo" en singular, para que se lea como el tipo de
// cita que es.
// ---------------------------------------------------------------------
const CITATION_TYPE_LABELS = {
  academic: 'Aprovechamiento',
  behavioral: 'Conductual',
  administrative: 'Administrativo',
};

// ---------------------------------------------------------------------
// formatAnnouncementDate(iso)
// ---------------------------------------------------------------------
// Devuelve la fecha corta para mostrar en la card, ej: "24 oct".
// Sigue EXACTAMENTE la convención del spec del backend:
//   new Date(iso).toLocaleDateString('es-MX', {
//     day: '2-digit', month: 'short',
//   })
// En es-MX con month:'short' eso devuelve "24 oct" (día primero,
// mes abreviado en minúsculas). Devuelve '' si la fecha es inválida.
// ---------------------------------------------------------------------
export const formatAnnouncementDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
  });
};

// ---------------------------------------------------------------------
// truncateMessage(text, maxLen = 120)
// ---------------------------------------------------------------------
// Trunca un texto a `maxLen` caracteres, intentando cortar en el
// ÚLTIMO espacio antes del límite para no partir palabras. Si no
// hay un buen corte (>60% del maxLen), corta duro. Añade "..." al
// final cuando recorta. Devuelve '' para texto vacío/null.
// ---------------------------------------------------------------------
export const truncateMessage = (text, maxLen = 120) => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLen) return text;

  const truncated = text.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.6) {
    return `${truncated.slice(0, lastSpace)}...`;
  }
  return `${truncated}...`;
};

// ---------------------------------------------------------------------
// getInitials(name)
// ---------------------------------------------------------------------
// Helper: dado un nombre completo, devuelve 1-2 chars (iniciales)
// para usar como fallback del avatar. Si el nombre está vacío,
// devuelve "?". Mismo patrón que en GuardianDashboard y
// AnnouncementCard — no se centraliza en otro utils porque son 5
// líneas y solo se usa en este archivo.
// ---------------------------------------------------------------------
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ---------------------------------------------------------------------
// getFullName(person)
// ---------------------------------------------------------------------
// Combina first_name + last_name manejando last_name null. Devuelve
// '' si la persona es null/undefined. Usado tanto para el sender de
// un aviso como para el student de un citatorio.
// ---------------------------------------------------------------------
const getFullName = (person) => {
  if (!person) return '';
  return [person.first_name, person.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
};

// ---------------------------------------------------------------------
// audienceTargetTypeLabel(item)
// ---------------------------------------------------------------------
// Resuelve la etiqueta de "targetType" que se muestra en el footer
// de la card de un anuncio y en la card "Para:" del detalle.
//
// Formato del label (alineado con el `summary` que devuelve el
// backend, sin prefijos "Grupo"/"Personal:" para que el copy sea
// más natural):
//
//   audience.type === 'general'  → "Toda la escuela"
//   audience.type === 'group'    → "2°B - Matutino"
//                                 (o "2°A - Matutino y 2°B - Vespertino"
//                                  si audience.groups tiene varios)
//   audience.type === 'student'  → "Pedro González Ramírez"
//                                 (o "Pedro y Juan" si hay varios)
//
// El backend ahora envía un campo `audience.summary` pre-formateado
// (resultado del helper `enrichAnnouncementAudience` que también
// usa el detail). Si está presente, lo usamos directo. Si no,
// componemos manualmente como fallback (defensa en profundidad).
//
// Devuelve null cuando:
//   - El item NO es un aviso.
//   - El item NO trae `audience` (caso típico del endpoint de detail
//     /announcements/:id cuando todavía no se normaliza en el
//     service). Devolver null en este caso es CRÍTICO: si
//     devolviéramos "General" como fallback, TODOS los avisos en
//     el detail mostrarían "General" — incluso los que son para un
//     grupo o un alumno específico. La pantalla de detalle usa el
//     null para decidir si oculta la card "Para:" (ver
//     app/(guardian)/announcements/[kind]/[id].jsx).
//   - El audience.type es un valor desconocido o faltan los datos
//     para componer el label.
// ---------------------------------------------------------------------
export const audienceTargetTypeLabel = (item) => {
  if (item?.kind !== 'announcement') return null;

  const audience = item.audience;
  if (!audience) return null;

  // Camino rápido: el backend ya lo formatea por nosotros.
  if (audience.summary) return audience.summary;

  // Fallback: componer manualmente en el mismo formato que el
  // `summary` del backend (sin prefijos "Grupo"/"Personal:").
  if (audience.type === 'general') {
    return 'Toda la escuela';
  }

  if (audience.type === 'group') {
    const groups = audience.groups || [];
    if (groups.length === 0) return null;
    if (groups.length === 1) {
      const g = groups[0];
      // `full_label` viene del backend como "2°B - Matutino". Si
      // falta, componemos desde `label` + `shift`.
      return g.full_label
        || (g.label ? `${g.label}${g.shift ? ` - ${capitalize(g.shift)}` : ''}` : 'Grupo');
    }
    // Múltiples grupos: "2°A - Matutino y 2°B - Vespertino"
    return groups
      .map((g) => g.full_label
        || (g.label ? `${g.label}${g.shift ? ` - ${capitalize(g.shift)}` : ''}` : ''))
      .filter(Boolean)
      .join(' y ') || null;
  }

  if (audience.type === 'student') {
    const students = audience.students || [];
    if (students.length === 0) return null;
    const names = students.map((s) => getFullName(s)).filter(Boolean);
    if (names.length === 0) return null;
    return names.length === 1
      ? names[0]
      : names.join(' y '); // "Pedro y Juan"
  }

  // Tipo desconocido: null (no mostramos la card).
  return null;
};

// ---------------------------------------------------------------------
// capitalize(str)
// ---------------------------------------------------------------------
// Helper LOCAL: capitaliza la primera letra. Lo usamos para formatear
// el `shift` ("matutino" → "Matutino") cuando no hay `full_label`.
// ---------------------------------------------------------------------
const capitalize = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// ---------------------------------------------------------------------
// citatorioTypeLabel(item)
// ---------------------------------------------------------------------
// Devuelve el TIPO de citatorio traducido al español, sin prefijos:
//
//   academic      → "Aprovechamiento"
//   behavioral    → "Conductual"
//   administrative→ "Administrativo"
//
// Es lo que la card del citatorio muestra como título (en el mismo
// lugar donde un aviso muestra su `title`). Antes existía
// `citatorioReasonLabel`, que devolvía "Motivo: Conductual" para el
// footer; el footer ahora solo muestra el nombre del alumno, así que
// el prefijo desapareció.
//
// Devuelve null si el item NO es un citatorio. Fallback a "General"
// si el type es desconocido o no viene.
// ---------------------------------------------------------------------
export const citatorioTypeLabel = (item) => {
  if (item?.kind !== 'citation') return null;
  return CITATION_TYPE_LABELS[item.type] || 'General';
};

// ---------------------------------------------------------------------
// citatorioStudentName(item)
// ---------------------------------------------------------------------
// Devuelve el nombre completo del alumno asociado al citatorio
// (sin foto, solo el nombre para mostrar en el footer). Devuelve
// null si el item NO es un citatorio o si el student viene null.
// ---------------------------------------------------------------------
export const citatorioStudentName = (item) => {
  if (item?.kind !== 'citation') return null;
  return getFullName(item.student) || null;
};

// ---------------------------------------------------------------------
// citatorioStatusInfo(item)
// ---------------------------------------------------------------------
// Deriva la información visual del status del citatorio a partir de
// `status` (raw) y `scheduledDate`. Devuelve
// { label, bgClass, textClass } o null.
//
// Posibles `status` del citatorio:
//   - 'pending'   → la familia aún no confirmó.
//   - 'confirmed' → la familia confirmó (pero la cita aún no pasó).
//   - 'completed' → la cita pasó y la familia ASISTIÓ (estado terminal).
//   - 'no_show'   → la cita pasó y la familia NO ASISTIÓ (estado terminal).
//
// En el feed del tutor, los `completed` y `no_show` están filtrados
// (solo `pending` y `confirmed` aparecen). En el detail del
// citatorio, el backend sí devuelve los 4 estados — útil cuando el
// tutor entra por deep link o después de que el status cambia.
//
// Reglas de derivación:
//   - status === 'completed'  → "ASISTIÓ"      (emerald)
//   - status === 'no_show'   → "NO ASISTIÓ"   (rose)
//   - status === 'confirmed'  → "CONFIRMADO"   (emerald)
//   - status === 'pending' + scheduledDate < now → "VENCIDO"   (rose)
//   - status === 'pending' + < 24h               → "HOY"        (sky)
//   - status === 'pending' + 24-72h              → "PRÓXIMO"    (amber)
//   - status === 'pending' + > 72h               → "FUTURO"     (slate)
//   - status === 'pending' + scheduledDate inválido → "PENDIENTE" (amber)
//
// Esto le da al tutor una señal más útil que el raw "pending":
// sabe si el citatorio es HOY, si está VENCIDO, etc. Y los estados
// terminales se distinguen visualmente del confirmado (que es verde
// pero pre-evento).
// ---------------------------------------------------------------------
export const citatorioStatusInfo = (item) => {
  if (item?.kind !== 'citation') return null;

  // Estados terminales del citatorio (post-evento).
  // 'completed' → la cita pasó y la familia asistió.
  // 'no_show'   → la cita pasó y la familia no se presentó.
  if (item.status === 'completed') {
    return {
      label: 'ASISTIÓ',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-700',
    };
  }
  if (item.status === 'no_show') {
    return {
      label: 'NO ASISTIÓ',
      bgClass: 'bg-rose-50',
      textClass: 'text-rose-700',
    };
  }

  // Citatorio confirmado: verde, independiente de la fecha.
  if (item.status === 'confirmed') {
    return {
      label: 'CONFIRMADO',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-700',
    };
  }

  // Citatorio pendiente: derivamos urgencia desde scheduledDate.
  const scheduled = item.scheduledDate ? new Date(item.scheduledDate) : null;
  if (!scheduled || Number.isNaN(scheduled.getTime())) {
    return {
      label: 'PENDIENTE',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-700',
    };
  }

  const now = new Date();
  if (scheduled.getTime() < now.getTime()) {
    return {
      label: 'VENCIDO',
      bgClass: 'bg-rose-50',
      textClass: 'text-rose-700',
    };
  }

  const hoursUntil = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntil < 24) {
    return {
      label: 'HOY',
      bgClass: 'bg-sky-50',
      textClass: 'text-sky-700',
    };
  }
  if (hoursUntil < 72) {
    return {
      label: 'PRÓXIMO',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-700',
    };
  }
  return {
    label: 'FUTURO',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
  };
};

// ---------------------------------------------------------------------
// transformFeedItemToCard(item)
// ---------------------------------------------------------------------
// Transforma UN item del feed (anuncio o citatorio) al shape que
// consume <AnnouncementCard>. Devuelve null si el item es null o
// no tiene `_id` (el componente requiere un id estable para el key).
//
// Campos que se devuelven (todos opcionales según kind):
//   - id, kind, priority, title, description, date
//   - targetType          (solo announcement)
//   - citatorioStudentName(solo citation)
//   - citatorioStatus     (solo citation)
//
// Diferencias entre kinds:
//   - announcement: title=title, description=truncate(message, 120),
//     targetType=audienceTargetTypeLabel(item).
//   - citation:     title=citatorioTypeLabel(item) (el TIPO de cita:
//     "Conductual" / "Aprovechamiento" / "Administrativo"),
//     description=truncate(reason, 200) (el motivo redactado),
//     citatorioStudentName + citatorioStatus.
// ---------------------------------------------------------------------
export const transformFeedItemToCard = (item) => {
  if (!item || !item._id) return null;

  // Fecha corta común: ambos kinds ordenan por eventDate.
  const date = formatAnnouncementDate(item.eventDate);

  // --- CITATORIO ---------------------------------------------------
  if (item.kind === 'citation') {
    return {
      id: item._id,
      kind: 'citation',
      priority: null,
      // El título del citatorio es su TIPO (no el reason): el reason
      // ya se muestra completo abajo como descripción, así que
      // repetirlo en el título era redundante.
      title: citatorioTypeLabel(item),
      description: truncateMessage(item.reason, 200),
      date,
      targetType: null,
      citatorioStudentName: citatorioStudentName(item),
      citatorioStatus: citatorioStatusInfo(item),
    };
  }

  // --- AVISO (default) --------------------------------------------
  // Defensivo: si llega un kind desconocido, lo tratamos como aviso.
  return {
    id: item._id,
    kind: 'announcement',
    priority: item.priority || 'informative',
    title: item.title || '',
    description: truncateMessage(item.message, 120),
    date,
    targetType: audienceTargetTypeLabel(item),
    citatorioStudentName: null,
    citatorioStatus: null,
  };
};

// ---------------------------------------------------------------------
// transformFeedToCards(items)
// ---------------------------------------------------------------------
// Atajo: transforma un array de items. Filtra los null que puedan
// salir de transformFeedItemToCard (por si el backend incluye
// items sin _id). Pensado para usar en un useMemo:
//
//   const cards = useMemo(
//     () => transformFeedToCards(items),
//     [items],
//   );
// ---------------------------------------------------------------------
export const transformFeedToCards = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map(transformFeedItemToCard).filter(Boolean);
};
