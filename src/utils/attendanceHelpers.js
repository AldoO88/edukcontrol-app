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
//   - compareIso(a, b): ordena dos ISO.
//   - isPastOrToday(iso): bool — true si iso <= hoy.
//   - isFuture(iso): bool — true si iso > hoy.
//
// Helpers de status (compartidos entre matrix y today view):
//   - STATUS_STYLES:  mapeo status → { soft, color, label }.
//   - STATUS_CYCLE:   orden del ciclo al tap en una celda.
//   - cycleStatus(c): devuelve el siguiente status del ciclo.
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

// ---------------------------------------------------------------------
// Status codes del pase de lista (matrix + today view).
// Compartidos para que el color/label sea siempre el mismo entre
// componentes.
// ---------------------------------------------------------------------
export const ATTENDANCE_STATUS = {
  PRESENTE:            'P',
  AUSENTE:             'F',
  RETARDO:             'R',
  FALTA_JUSTIFICADA:   'FJ',
  SIN_REGISTRO:        '-',
};

export const STATUS_STYLES = {
  P:  { soft: '#DCFCE7', color: '#16A34A', label: 'Presente' },
  F:  { soft: '#FEE2E2', color: '#DC2626', label: 'Falta' },
  R:  { soft: '#FEF3C7', color: '#D97706', label: 'Retardo' },
  FJ: { soft: '#E0F2FE', color: '#0284C7', label: 'F. Justificada' },
  '-': { soft: '#F1F5F9', color: '#94A3B8', label: 'Sin registro' },
};

// Orden del ciclo al tap en una celda. Termina en '-' (sin registro)
// y vuelve a 'P' para que el docente pueda "desmarcar" cualquier estado.
export const STATUS_CYCLE = ['P', 'F', 'R', 'FJ', '-'];

/**
 * Devuelve el siguiente status del ciclo (P → F → R → FJ → - → P).
 * Si el status actual no está en el ciclo (caso raro / data legacy),
 * arranca desde 'P'.
 */
export const cycleStatus = (current) => {
  const i = STATUS_CYCLE.indexOf(current);
  const next = STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length];
  return next || 'P';
};
