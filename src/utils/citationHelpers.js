// =====================================================================
// src/utils/citationHelpers.js
// ---------------------------------------------------------------------
// Helpers + estilos compartidos entre los screens del feature
// `citations/` del route group (teacher):
//   - `citations/index.jsx`  (lista)
//   - `citations/[id].jsx`   (detalle)
//
// Incluye:
//   - STATUS_STYLES          → mapeo status → { bg, fg, label, Icon }.
//   - TYPE_STYLES            → mapeo type → { bg, fg, border, label }.
//   - HISTORY_EVENT_LABELS   → mapeo evento del workflow → label ES.
//   - formatDate, formatTime12, isProximo
//                             → formatters / helpers de fecha.
//   - attendanceColor        → threshold color del % asistencia.
//   - getMockCitatorioById   → lookup helper (wrapper sobre MOCK_CITATORIOS).
//
// Datos: MOCK_CITATORIOS vive en `src/constants/mockCitatorios.js`
// (separado para mantener separación mocks/constants vs helpers/utils
// según la convención del proyecto).
// =====================================================================

// Lucide icons (reutilizados desde STATUS_STYLES).
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react-native';

import MOCK_CITATORIOS from '@/src/constants/mockCitatorios';

// Helper para componer el nombre completo del maestro y el prefijo
// dinámico (Prof./Profa. según `creator.sex`).
import {
  getTeacherFullName,
  getTeacherTitle,
} from '@/src/utils/teacherName';

// ---------------------------------------------------------------------
// STATUS_STYLES
// ---------------------------------------------------------------------
// Mapeo status → { bg, fg, label, Icon }. Basado en el enum del
// Citation schema (5 valores: pending, confirmed, completed, no_show,
// expired). Los 3 estados visibles en el dashboard del docente
// (Pendientes / Confirmados / Atendidos) corresponden a: pending,
// confirmed, completed.
// ---------------------------------------------------------------------
export const STATUS_STYLES = {
  pending: {
    bg: '#FEF3C7',
    fg: '#92400E',
    label: 'Pendiente de Confirmación',
    Icon: AlertCircle,
  },
  confirmed: {
    bg: '#DCFCE7',
    fg: '#15803D',
    label: 'Confirmado por Tutor',
    Icon: CheckCircle2,
  },
  completed: {
    bg: '#DBEAFE',
    fg: '#1D4ED8',
    label: 'Atendido',
    Icon: CheckCircle2,
  },
  no_show: {
    bg: '#FEE2E2',
    fg: '#B91C1C',
    label: 'Tutor no se presentó',
    Icon: AlertCircle,
  },
  expired: {
    bg: '#F1F5F9',
    fg: '#64748B',
    label: 'Expirado',
    Icon: Clock,
  },
  cancelled: {
    bg: '#F1F5F9',
    fg: '#64748B',
    label: 'Cancelado',
    Icon: XCircle,
  },
};

// ---------------------------------------------------------------------
// TYPE_STYLES
// ---------------------------------------------------------------------
// Mapeo type → { bg, fg, border, label }. Basado en el enum `type` del
// Citation schema ('academic' | 'behavioral' | 'administrative').
// El label en la UI es el equivalente en español claro para el docente.
// El `border` se usa como acento vertical (borderLeftWidth: 4) en el
// card, mismo patrón que GroupInfoBanner / GroupDiagnosticDashboard /
// PedagogyTab / StudentAccordionRow.
// ---------------------------------------------------------------------
export const TYPE_STYLES = {
  academic: {
    bg: '#FEF3C7',
    fg: '#92400E',
    border: '#D97706',
    label: 'Académico',
  },
  behavioral: {
    bg: '#FEE2E2',
    fg: '#B91C1C',
    border: '#DC2626',
    label: 'Conductual',
  },
  administrative: {
    bg: '#F3E8FF',
    fg: '#6B21A8',
    border: '#7C3AED',
    label: 'Administrativo',
  },
};

// ---------------------------------------------------------------------
// HISTORY_EVENT_LABELS
// ---------------------------------------------------------------------
// Mapeo de evento del workflow del citatorio → label legible en
// español. Usado en la pantalla de detalle para renderizar el
// array `citatorio.history`.
// ---------------------------------------------------------------------
export const HISTORY_EVENT_LABELS = {
  created:         'Citatorio creado',
  sent_to_tutor:   'Enviado al tutor',
  confirmed:       'Confirmado por tutor',
  completed:       'Reunión atendida',
  no_show:         'Tutor no se presentó',
  rescheduled:     'Reagendado',
  expired:         'Expirado',
  cancelled:       'Cancelado',
};

// ---------------------------------------------------------------------
// Helpers de formato
// ---------------------------------------------------------------------
const SPANISH_MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

/**
 * 'YYYY-MM-DD' → 'DD Mes YYYY' (es-MX corto).
 */
export const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${SPANISH_MONTHS[m - 1]} ${y}`;
};

/**
 * 'HH:MM' 24h → 'HH:MM AM/PM' 12h.
 */
export const formatTime12 = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
};

/**
 * Agrupa citatorios por su tab correspondiente. Los estados activos
 * (pending/confirmed/no_show/expired) son "próximos"; 'completed'
 * es "historial".
 */
export const isProximo = (status) =>
  status === 'pending' ||
  status === 'confirmed' ||
  status === 'no_show' ||
  status === 'expired' ||
  status === 'reschedule_requested';

/**
 * Color del % de asistencia según threshold:
 *   ≥ 90% → verde (excelente).
 *   80-89% → amber (aceptable).
 *   < 80% → red (bajo).
 */
export const attendanceColor = (pct) => {
  if (pct >= 90) return { fg: '#15803D', bg: '#DCFCE7' };
  if (pct >= 80) return { fg: '#B45309', bg: '#FEF3C7' };
  return { fg: '#B91C1C', bg: '#FEE2E2' };
};

// ---------------------------------------------------------------------
// Lookup sobre el mock de citatorios.
// ---------------------------------------------------------------------
/**
 * Devuelve el citatorio del mock por ID, o `null` si no existe.
 * Wrapper sobre MOCK_CITATORIOS para que el consumer (lista +
 * detalle) no importe directamente del constants.
 */
export const getMockCitatorioById = (id) => {
  return MOCK_CITATORIOS.find((c) => c.id === id) || null;
};

// ---------------------------------------------------------------------
// formatDateTime
// ---------------------------------------------------------------------
/**
 * Extrae date ('YYYY-MM-DD') y time ('HH:MM') de un ISO datetime
 * string como "2026-08-25T10:30:00.000Z".
 *
 * Devuelve { date: '2026-08-25', time: '10:30' } o { date: '', time: '' }
 * si el input es nulo/vacío.
 */
export const formatDateTime = (isoString) => {
  if (!isoString) return { date: '', time: '' };
  try {
    const d = new Date(isoString);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const min = String(d.getUTCMinutes()).padStart(2, '0');
    return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
  } catch {
    return { date: '', time: '' };
  }
};

// ---------------------------------------------------------------------
// normalizeCitation
// ---------------------------------------------------------------------
/**
 * Transforma el shape de la respuesta del API (GET /api/citations/me)
 * al shape que consumen los componentes de UI (CitatorioCard, detail
 * screen). Mapea campos del backend a los campos legibles que la UI
 * espera del mock.
 *
 * API shape:
 *   { _id, student: { first_name, last_name, photoUrl, ... },
 *     creator: { name, last_name, sex, role }, subject: { name, ... },
 *     groupName, scheduledDate, location, type, reason, status }
 *
 * UI shape:
 *   { id, studentName, groupName, subject, date, time, location,
 *     type, reason, status, creatorName }
 */
export const normalizeCitation = (item) => {
  if (!item) return null;

  // studentName: "Pérez, Juan" → nombre en formato apellido, nombre
  // para consistencia con el formato de lista escolar.
  const studentFirst = item.student?.first_name || '';
  const studentLast = item.student?.last_name || '';
  const studentName = studentLast && studentFirst
    ? `${studentLast}, ${studentFirst}`
    : studentFirst || studentLast || 'Sin nombre';

  // groupName: viene directo del backend (ej. "1°A").
  const groupName = item.groupName || '';

  // subject: nombre de la materia (puede ser null si no se asignó).
  const subject = item.subject?.name || '';

  // Extracción de date + time del ISO datetime.
  const { date, time } = formatDateTime(item.scheduledDate);

  // creatorName: "Prof. González" o "Profa. López" → prefijo
  // dinámico según `creator.sex` + nombre completo. Reusamos los
  // helpers del módulo teacherName para mantener una sola fuente de
  // verdad sobre cómo componer el nombre del staff.
  const creatorName = item.creator
    ? `${getTeacherTitle(item.creator.sex)} ${getTeacherFullName(item.creator)}`.trim()
    : '';

  return {
    id: item._id,
    studentName,
    groupName,
    subject,
    date,
    time,
    location: item.location || '',
    type: item.type || 'academic',
    reason: item.reason || '',
    status: item.status || 'pending',
    creatorName,
    createdAt: item.createdAt || '',
    history: item.history || [],
    rescheduleRequested: item.rescheduleRequested || false,
    rescheduleReason: item.rescheduleReason || '',
  };
};