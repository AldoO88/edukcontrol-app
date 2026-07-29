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
};

// formatLongDate: devuelve "miércoles, 9 de julio".
export const formatLongDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('es-MX', OPTIONS.longDate);
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
