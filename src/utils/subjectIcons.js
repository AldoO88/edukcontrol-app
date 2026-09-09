// =====================================================================
// subjectIcons.js
// ---------------------------------------------------------------------
// Helpers para resolver el ícono y color de una materia a partir del
// nombre del ícono (string) que devuelve el backend.
//
// El backend (endpoints de horario + groups-with-schedule) devuelve
// `color` (hex) e `icon` (nombre del ícono Lucide) en cada entry.
// React Native no permite `require()` dinámico de componentes por
// string, así que necesitamos un mapa pre-registrado de
// nombre → componente Lucide.
//
// Uso:
//   import { getSubjectIcon, getSubjectColor, FALLBACK_ICON, FALLBACK_COLOR } from '@/src/utils/subjectIcons';
//
//   const IconComponent = getSubjectIcon(clase.subject?.icon);
//   const color = clase.subject?.color || FALLBACK_COLOR;
// =====================================================================

// Iconos Lucide. Importamos un set curado de los más comunes.
// Si el backend manda un nombre que no está en el mapa, caemos al
// FALLBACK_ICON.
import {
  // Académicos
  BookOpen,
  BookMarked,
  BookText,
  Calculator,
  Atom,
  FlaskConical,
  Microscope,
  Sigma,
  PiSquare,

  // Ciencias naturales / geografía
  Globe,
  Map,
  MapPin,
  Leaf,
  Trees,
  Mountain,
  Cloud,

  // Historia / sociales
  Landmark,
  Scroll,
  Flag,
  Shield,

  // Arte / música / cultura
  Palette,
  Music,
  Music2,
  Music3,
  Camera,
  Brush,

  // Idiomas
  Languages,

  // Deportes / salud
  Dumbbell,
  Heart,
  HeartPulse,
  Footprints,

  // Tecnología / talleres
  Cpu,
  Wrench,
  Code,
  Code2,
  Terminal,
  Zap,

  // Tutoría / formación
  Users,
  Users2,
  UserCheck,
  Puzzle,
  Lightbulb,
  GraduationCap,

  // Religión / cívica
  Cross,
  Church,

  // Artes escénicas
  Drama,
  Theater,

  // Default
  Circle,
  Star,
  Sun,
} from 'lucide-react-native';

// ---------------------------------------------------------------------
// FALLBACKS
// ---------------------------------------------------------------------
// Si el backend no envía color/icon, usamos defaults neutros para
// que la UI no se rompa.
// ---------------------------------------------------------------------
export const FALLBACK_COLOR = '#64748B'; // slate-500
export const FALLBACK_ICON = BookOpen;
export const FALLBACK_ICON_NAME = 'BookOpen';

// ---------------------------------------------------------------------
// ICON_MAP
// ---------------------------------------------------------------------
// Mapa nombre (string del backend) → componente Lucide. Solo se
// registran los iconos que sabemos que el backend puede mandar.
// Si el backend manda un nombre desconocido, `getSubjectIcon` cae
// al FALLBACK_ICON.
// ---------------------------------------------------------------------
export const ICON_MAP = {
  // Académicos
  BookOpen,
  BookMarked,
  BookText,
  Calculator,
  Atom,
  FlaskConical,
  Microscope,
  Sigma,
  PiSquare,

  // Ciencias / geografía
  Globe,
  Map,
  MapPin,
  Leaf,
  Trees,
  Mountain,
  Cloud,

  // Historia / sociales
  Landmark,
  Scroll,
  Flag,
  Shield,

  // Arte / música / cultura
  Palette,
  Music,
  Music2,
  Music3,
  Camera,
  Brush,

  // Idiomas
  Languages,

  // Deportes / salud
  Dumbbell,
  Heart,
  HeartPulse,
  Footprints,

  // Tecnología / talleres
  Cpu,
  Wrench,
  Code,
  Code2,
  Terminal,
  Zap,

  // Tutoría / formación
  Users,
  Users2,
  UserCheck,
  Puzzle,
  Lightbulb,
  GraduationCap,

  // Religión / cívica
  Cross,
  Church,

  // Artes escénicas
  Drama,
  Theater,

  // Default
  Circle,
  Star,
  Sun,
};

// ---------------------------------------------------------------------
// getSubjectIcon(name)
// ---------------------------------------------------------------------
// Resuelve un nombre de ícono (string del backend) al componente
// Lucide correspondiente. Si no existe en el mapa, devuelve el
// fallback (BookOpen).
//
// Uso:
//   const Icon = getSubjectIcon('Calculator');
//   <Icon size={16} color="#4F46E5" />
// ---------------------------------------------------------------------
export const getSubjectIcon = (name) => {
  if (!name || typeof name !== 'string') return FALLBACK_ICON;
  return ICON_MAP[name] || FALLBACK_ICON;
};

// ---------------------------------------------------------------------
// getSubjectColor(color)
// ---------------------------------------------------------------------
// Valida que el color sea un hex string válido. Si no, devuelve el
// fallback. Previene que la UI se rompa si el backend manda un valor
// inválido (null, undefined, 'auto', etc.).
//
// Uso:
//   const color = getSubjectColor(clase.subject?.color);
// ---------------------------------------------------------------------
export const getSubjectColor = (color) => {
  if (!color || typeof color !== 'string') return FALLBACK_COLOR;
  // Hex debe empezar con # y tener 3, 4, 6 u 8 caracteres.
  if (!/^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color)) {
    return FALLBACK_COLOR;
  }
  return color;
};

// ---------------------------------------------------------------------
// tintWithAlpha(hex, alpha)
// ---------------------------------------------------------------------
// Dado un color hex (#RRGGBB), devuelve el mismo color con el alpha
// especificado (#RRGGBBAA). Útil para fondos suaves a partir del
// color de la materia.
//
// Uso:
//   tintWithAlpha('#4F46E5', 0.1) → '#4F46E51A'
// ---------------------------------------------------------------------
export const tintWithAlpha = (hex, alpha) => {
  const color = getSubjectColor(hex);
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
  return `${color}${a}`;
};
