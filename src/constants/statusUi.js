// =====================================================================
// statusUi.js
// ---------------------------------------------------------------------
// Constantes y helpers compartidos para representar visualmente
// los estados de asistencia (present, late, absent) y calificaciones
// (passing, average, failing) en TODA la app.
// Centralizarlo aquí evita tener el mismo "if status === 'present'"
// repetido en 5 componentes diferentes.
// =====================================================================

// Constantes de estados. Usar constantes en vez de strings
// sueltos reduce errores de tipeo y permite refactors seguros.
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  LATE: 'late',
  ABSENT: 'absent',
};

// Etiquetas en español para mostrar al usuario.
export const ATTENDANCE_LABELS = {
  [ATTENDANCE_STATUS.PRESENT]: 'A tiempo',
  [ATTENDANCE_STATUS.LATE]: 'Retardo',
  [ATTENDANCE_STATUS.ABSENT]: 'Falta',
};

// attendanceStatusUi: dado un status, devuelve el "look & feel"
// completo: colores de fondo, color del icono, color del texto,
// el componente Icon, y la etiqueta. Usado en GuardianDashboard,
// AttendanceHistory y AttendanceCheck.
import {
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react-native';

export const attendanceStatusUi = (status) => {
  // Map por status. Centralizar la elección del icono aquí evita
  // if-else encadenados en cada componente que muestra el icono.
  if (status === ATTENDANCE_STATUS.PRESENT) {
    return {
      bgClass: 'bg-emerald-100',
      iconBgClass: 'bg-emerald-100',
      iconColor: '#059669',
      textClass: 'text-emerald-700',
      Icon: CheckCircle2,
      label: ATTENDANCE_LABELS[ATTENDANCE_STATUS.PRESENT],
    };
  }
  if (status === ATTENDANCE_STATUS.LATE) {
    return {
      bgClass: 'bg-amber-100',
      iconBgClass: 'bg-amber-100',
      iconColor: '#d97706',
      textClass: 'text-amber-700',
      Icon: Clock,
      label: ATTENDANCE_LABELS[ATTENDANCE_STATUS.LATE],
    };
  }
  // Default: absent.
  return {
    bgClass: 'bg-rose-100',
    iconBgClass: 'bg-rose-100',
    iconColor: '#dc2626',
    textClass: 'text-rose-700',
    Icon: XCircle,
    label: ATTENDANCE_LABELS[ATTENDANCE_STATUS.ABSENT],
  };
};

// Constantes de rangos de calificación (escala mexicana 0-10).
export const GRADE_THRESHOLDS = {
  FAILING: 6,
  GOOD: 8,
};

// gradeUi: dado un número (o null), devuelve la UI.
//   - null/undefined: 'Sin calificar' (gris).
//   - < 6: 'Reprobado' (rose).
//   - 6-7.9: 'Suficiente' (amber).
//   - >= 8: 'Excelente' (emerald).
export const gradeUi = (grade) => {
  if (grade === null || grade === undefined) {
    return {
      textClass: 'text-slate-400',
      bgClass: 'bg-slate-50',
      label: 'Sin calificar',
    };
  }
  if (grade < GRADE_THRESHOLDS.FAILING) {
    return {
      textClass: 'text-rose-600',
      bgClass: 'bg-rose-50',
      label: 'Reprobado',
    };
  }
  if (grade < GRADE_THRESHOLDS.GOOD) {
    return {
      textClass: 'text-amber-600',
      bgClass: 'bg-amber-50',
      label: 'Suficiente',
    };
  }
  return {
    textClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50',
    label: 'Excelente',
  };
};

// =====================================================================
// Constantes de categorías de anuncios.
// Mapeamos la categoría textual a la variant del componente Badge
// para que la UI sea coherente en toda la app.
// =====================================================================

export const ANNOUNCEMENT_CATEGORIES = {
  EVENT: 'Evento',
  NOTICE: 'Aviso',
  ACADEMIC: 'Académico',
};

// Mapeo categoría -> variant de Badge.
export const ANNOUNCEMENT_CATEGORY_VARIANT = {
  [ANNOUNCEMENT_CATEGORIES.EVENT]: 'sky',
  [ANNOUNCEMENT_CATEGORIES.NOTICE]: 'amber',
  [ANNOUNCEMENT_CATEGORIES.ACADEMIC]: 'emerald',
};

// announcementCategoryVariant: helper que devuelve la variant
// del Badge según la categoría. Si la categoría no se reconoce,
// devuelve 'slate' como fallback.
export const announcementCategoryVariant = (category) =>
  ANNOUNCEMENT_CATEGORY_VARIANT[category] || 'slate';

// parseGradeInput: dado un string del input, devuelve un número
// válido en rango [0, 10] o null si está vacío. Filtra caracteres
// no numéricos. Centraliza la lógica que antes vivía en
// GradesUpload.
export const parseGradeInput = (raw) => {
  // Limpiamos todo lo que no sea dígito o punto.
  const cleaned = String(raw || '').replace(/[^0-9.]/g, '');
  // Si quedó vacío, devolvemos null.
  if (cleaned === '') return null;
  const numeric = parseFloat(cleaned);
  // Si no es un número válido, devolvemos null.
  if (Number.isNaN(numeric)) return null;
  // Si está fuera de rango, devolvemos null (el caller decide si
  // mantener el valor anterior o reiniciar).
  if (numeric < 0 || numeric > 10) return null;
  return numeric;
};
