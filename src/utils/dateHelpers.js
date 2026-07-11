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
