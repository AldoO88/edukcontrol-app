// =====================================================================
// src/utils/attendanceHelpers.js
// ---------------------------------------------------------------------
// Helpers puros y reutilizables relacionados con asistencia y fechas
// (matriz de pases de lista). Sin dependencias de React ni de RN — se
// pueden importar en cualquier contexto (componentes, hooks, tests).
//
// Helpers de fecha:
//   - pad2(n): asegura 2 dígitos en DD/MM/YYYY.
//   - todayIso(): devuelve la fecha actual en formato ISO (YYYY-MM-DD).
//   - formatShort(iso): "YYYY-MM-DD" → "DD/MM/YYYY".
//   - formatFull(iso): "YYYY-MM-DD" → "Miércoles, 14 de Agosto".
//   - isPastOrToday(iso): bool — true si iso <= hoy.
//   - dayLabel(iso): bool — true si iso es hoy.
// =====================================================================

const pad2 = (n) => String(n).padStart(2, '0');

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const formatShort = (iso) => {
  if (!iso || iso.length < 10) return iso || '';
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
};

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const formatFull = (iso) => {
  if (!iso || iso.length < 10) return iso || '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return iso;
  return `${WEEKDAYS[date.getDay()]}, ${d} de ${MONTHS[m - 1]}`;
};

// Compara dos fechas ISO (YYYY-MM-DD) lexicográficamente — funciona porque
// el formato es sortable.
export const compareIso = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// true si la fecha es hoy o anterior (permite agregar).
export const isPastOrToday = (iso) => compareIso(iso, todayIso()) <= 0;

// true si la fecha es estrictamente futura.
export const isFuture = (iso) => compareIso(iso, todayIso()) > 0;
