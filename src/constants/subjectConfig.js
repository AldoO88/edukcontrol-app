// =====================================================================
// src/constants/subjectConfig.js
// ---------------------------------------------------------------------
// Mapa de configuración de materias: asigna un ícono Lucide y un
// color institucional a cada materia basándose en su nombre (matching
// por keywords, case-insensitive).
//
// Fuente única de verdad para íconos y colores de materias en toda
// la app. Usado por:
//   - tutoria-file.jsx (expediente de tutoría)
//   - Futuras pantallas que necesiten ícono/color por materia
//
// El backend NO provee íconos ni colores — este módulo los asigna
// client-side con un patrón determinista. Si se agrega una materia
// nueva que no tiene keyword match, se usa un fallback genérico.
//
// Para agregar una materia nueva:
//   1. Agregar un objeto a SUBJECT_CONFIG_RULES con keywords + Icon + color.
//   2. El orden importa: el primer match gana.
// =====================================================================

// Iconos Lucide disponibles para materias.
import {
  Sigma,         // Matemáticas / Álgebra / Cálculo.
  BookOpen,      // Español / Lengua / Literatura (fallback genérico).
  FlaskConical,  // Ciencias Naturales / Biología / Química.
  Globe,         // Historia / Geografía / Ciencias Sociales.
  Palette,       // Arte / Pintura / Dibujo.
  Music,         // Música / Coro.
  Dumbbell,      // Educación Física / Deporte.
  Languages,     // Inglés / Idiomas / Francés.
  Landmark,      // Formación Cívica / Ética.
  Code,          // Tecnología / Informática / Cómputo.
  Users,         // Tutoría / Educación Socioemocional.
  PenTool,       // Redacción / Taller de Escritura.
  Wrench,        // Taller Técnico / Formación para el Trabajo.
  Leaf,          // Ecología / Medio Ambiente.
  Calculator,    // Contabilidad / Administración.
} from 'lucide-react-native';

// ---------------------------------------------------------------------
// SUBJECT_CONFIG_RULES
// ---------------------------------------------------------------------
// Array de reglas de matching. Cada regla tiene:
//   - keywords: array de substrings (case-insensitive) que matchean
//               contra el nombre de la materia.
//   - Icon: componente de Lucide a renderizar.
//   - color: código hex del color de acento de la materia.
//
// El orden importa: el primer match gana. Materias más específicas
// primero (ej. 'taller técnico' antes que 'taller').
// ---------------------------------------------------------------------
const SUBJECT_CONFIG_RULES = [
  // Materias específicas primero (orden importa).
  { keywords: ['tutoría', 'socioemocional'],           Icon: Users,       color: '#D97706' },
  { keywords: ['taller técnico', 'formación para el'],  Icon: Wrench,      color: '#78716C' },
  { keywords: ['taller de escritura', 'redacción'],     Icon: PenTool,     color: '#0EA5E9' },
  { keywords: ['contabilidad', 'administración'],       Icon: Calculator,  color: '#059669' },
  { keywords: ['ecología', 'medio ambiente'],           Icon: Leaf,        color: '#16A34A' },

  // Materias generales.
  { keywords: ['matem', 'álgebra', 'cálculo', 'trigonometría'], Icon: Sigma,       color: '#0284C7' },
  { keywords: ['español', 'lengua', 'literatura', 'redacción'], Icon: BookOpen,    color: '#7C3AED' },
  { keywords: ['ciencia', 'biología', 'química', 'física'],     Icon: FlaskConical,color: '#10B981' },
  { keywords: ['historia', 'geografía', 'sociales'],             Icon: Globe,       color: '#F97316' },
  { keywords: ['tecnología', 'informática', 'cómputo', 'programación'], Icon: Code,  color: '#6366F1' },
  { keywords: ['arte', 'pintura', 'dibujo'],                     Icon: Palette,     color: '#EC4899' },
  { keywords: ['música', 'coro'],                                Icon: Music,       color: '#8B5CF6' },
  { keywords: ['inglés', 'idioma', 'francés'],                   Icon: Languages,   color: '#14B8A6' },
  { keywords: ['educación física', 'deporte', 'formación física'], Icon: Dumbbell,  color: '#EF4444' },
  { keywords: ['cívica', 'ética', 'formación cívica'],           Icon: Landmark,    color: '#A855F7' },
];

// ---------------------------------------------------------------------
// getSubjectConfig
// ---------------------------------------------------------------------
// Dado el nombre de una materia, devuelve { Icon, color }.
// Si no hay match, devuelve un fallback genérico (BookOpen + slate).
//
// @param {string} name - Nombre de la materia (ej. "Matemáticas")
// @returns {{ Icon: React.Component, color: string }}
// ---------------------------------------------------------------------
export const getSubjectConfig = (name) => {
  if (!name) return { Icon: BookOpen, color: '#64748B' };
  const lower = name.toLowerCase();
  for (const rule of SUBJECT_CONFIG_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return { Icon: rule.Icon, color: rule.color };
    }
  }
  return { Icon: BookOpen, color: '#64748B' };
};

export default SUBJECT_CONFIG_RULES;
