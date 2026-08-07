// =====================================================================
// dateHelpers.js
// ---------------------------------------------------------------------
// Helpers para formatear fechas en español. Centralizar la
// localización evita pasar 'es-MX' repetido en cada componente.
// =====================================================================

// Opciones de formato. Usar constantes hace los formatos
// consistentes en toda la app.
const OPTIONS = {
  longDate: {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  },
  fullDate: {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  },
  fullDateTime: {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  },
  scheduledDateTime: {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  },
};

// formatLongDate: devuelve "miércoles, 9 de julio".
export const formatLongDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('es-MX', OPTIONS.longDate);
};

// ---------------------------------------------------------------------
// formatFullDate(date)
// ---------------------------------------------------------------------
// Devuelve la fecha completa SIN hora, ej: "23 de octubre de 2025".
// Usado en la pantalla de detalle de avisos para "Publicado" y
// "Expira" (donde la hora exacta no es relevante).
// Devuelve '' si la fecha es inválida.
// ---------------------------------------------------------------------
export const formatFullDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('es-MX', OPTIONS.fullDate);
};

// ---------------------------------------------------------------------
// formatFullDateTime(date)
// ---------------------------------------------------------------------
// Devuelve la fecha completa CON hora, ej:
// "23 de octubre de 2025, 4:30 PM".
// Usado en la pantalla de detalle cuando queremos fecha + hora
// (ej. "Programado para: ..." en un citatorio, con year incluido).
// Devuelve '' si la fecha es inválida.
// ---------------------------------------------------------------------
export const formatFullDateTime = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString('es-MX', OPTIONS.fullDateTime);
};

// ---------------------------------------------------------------------
// formatScheduledDateTime(date)
// ---------------------------------------------------------------------
// Devuelve la fecha con weekday + día + mes + hora (sin year):
// "lunes, 28 de octubre, 4:30 PM".
// Usado en el detalle de citatorios ("Programado para:") donde el
// weekday es importante para el contexto (los citatorios casi
// siempre son próximos, así que el year estorba más que ayuda).
// Devuelve '' si la fecha es inválida.
// ---------------------------------------------------------------------
export const formatScheduledDateTime = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString('es-MX', OPTIONS.scheduledDateTime);
};

// ---------------------------------------------------------------------
// formatScheduledSentenceDate(date)
// ---------------------------------------------------------------------
// Devuelve SOLO la parte de fecha de la oración del citatorio:
// "el martes 28 de octubre".
// Pensado para componer la frase "Cita con el Profesor X [FECHA]
// a las [HORA]" que muestra el detalle del citatorio como cuerpo.
//
// El weekday va con artículo ("el martes", "la miércoles" en otros
// dialectos — en es-MX siempre es "el" para weekdays), lowercase,
// seguido del día numérico, "de", y el mes en lowercase. Devuelve
// '' si la fecha es inválida.
// ---------------------------------------------------------------------
export const formatScheduledSentenceDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  const weekday = date.toLocaleDateString('es-MX', { weekday: 'long' });
  const day = date.getDate();
  const month = date.toLocaleDateString('es-MX', { month: 'long' });
  return `el ${weekday} ${day} de ${month}`;
};

// ---------------------------------------------------------------------
// formatScheduledSentenceTime(date)
// ---------------------------------------------------------------------
// Devuelve SOLO la parte de hora de la oración del citatorio:
// "10:30 AM" o "4:30 PM".
// Se usa junto con formatScheduledSentenceDate para componer la
// frase del detalle del citatorio ("Cita con el Profesor X
// el martes 28 de octubre a las 10:30 AM").
// Devuelve '' si la fecha es inválida.
// ---------------------------------------------------------------------
export const formatScheduledSentenceTime = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('es-MX', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// ---------------------------------------------------------------------
// isSameDay(a, b)
// ---------------------------------------------------------------------
// Helper interno: compara año, mes y día de dos objetos Date. Se usa
// para decidir si una fecha cae "hoy" o "ayer" sin depender de
// librerías externas (date-fns, dayjs, etc.).
const isSameDay = (a, b) => (
  a.getFullYear() === b.getFullYear()
  && a.getMonth() === b.getMonth()
  && a.getDate() === b.getDate()
);

// ---------------------------------------------------------------------
// formatRelativeDateTime(date)
// ---------------------------------------------------------------------
// Devuelve una fecha/hora "humanizada", pensada para eventos recientes
// (ej. último check-in/check-out de asistencia):
//   - Si es hoy   → "Hoy, 7:25 a. m."
//   - Si es ayer  → "Ayer, 2:15 p. m."
//   - Cualquier otro día → "9 jul, 7:25 a. m."
// Devuelve '' si la fecha es inválida, para que el caller pueda
// decidir un fallback propio.
export const formatRelativeDateTime = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const time = date.toLocaleTimeString('es-MX', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isSameDay(date, now)) {
    return `Hoy, ${time}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return `Ayer, ${time}`;
  }

  const shortDate = date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
  return `${shortDate}, ${time}`;
};
