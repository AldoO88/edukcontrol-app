// =====================================================================
// src/constants/navigationTabs.js
// ---------------------------------------------------------------------
// FUENTE ÚNICA de las configuraciones de la bottom tab bar por rol.
//
// ANTES: TEACHER_TABS estaba duplicado en TeacherDashboard.jsx,
// grades.jsx y attendance.jsx, y DEFAULT_TABS vivía dentro de
// BottomTabBar.jsx. Cualquier cambio de ruta/label/ícono exigía
// editar 4 archivos. Ahora cada rol tiene su array en UN solo lugar:
//   - GUARDIAN_TABS → BottomTabBar por defecto (5 tabs del tutor).
//   - TEACHER_TABS  → se pasa explícitamente a <BottomTabBar /> en
//                      las pantallas del maestro.
//
// IMPORTANTE (shared routes): las rutas de cada tab incluyen el
// route group del rol ((guardian) / (teacher)) para que Expo Router
// desambigüe URLs que comparten nombre (dashboard, attendance, etc.)
// entre ambos grupos. El `match` sigue siendo el segmento hoja para
// resaltar el tab activo.
// =====================================================================

// Iconos Lucide de los tabs.
import {
  Home,           // Tab: Inicio (ambos roles).
  Megaphone,      // Tab: Avisos (guardian).
  UserCheck,      // Tab: Conducta (guardian).
  GraduationCap,  // Tab: Calificaciones (guardian y teacher).
  ClipboardCheck, // Tab: Asistencia (guardian).
  Users,          // Tab: Mis Grupos (teacher).
  User,           // Tab: Perfil (teacher).
} from 'lucide-react-native';

// ---------------------------------------------------------------------
// GUARDIAN_TABS
// ---------------------------------------------------------------------
// 5 tabs del tutor según el rediseño. Default de <BottomTabBar />.
// ---------------------------------------------------------------------
export const GUARDIAN_TABS = [
  { id: 'home',          label: 'Inicio',         icon: Home,            route: '/(guardian)/dashboard',     match: 'dashboard' },
  { id: 'announcements', label: 'Avisos',         icon: Megaphone,       route: '/(guardian)/announcements', match: 'announcements' },
  { id: 'conduct',       label: 'Conducta',       icon: UserCheck,       route: '/(guardian)/conduct',       match: 'conduct' },
  { id: 'grades',        label: 'Calificaciones', icon: GraduationCap,   route: '/(guardian)/grades',        match: 'grades' },
  { id: 'attendance',    label: 'Asistencia',     icon: ClipboardCheck,  route: '/(guardian)/attendance',    match: 'attendance' },
];

// ---------------------------------------------------------------------
// TEACHER_TABS
// ---------------------------------------------------------------------
// 4 tabs del maestro (Inicio, Mis Grupos, Calificaciones, Perfil).
//   - Inicio          → dashboard del maestro.
//   - Mis Grupos      → /(teacher)/groups (Mis Grupos y Asignaturas).
//   - Calificaciones  → /(teacher)/grades (calificaciones/horario).
//   - Perfil          → aún no tiene pantalla propia → apunta al
//                       dashboard (TODO pendiente, igual que antes).
// ---------------------------------------------------------------------
export const TEACHER_TABS = [
  { id: 'home',    label: 'Inicio',         icon: Home,          route: '/(teacher)/dashboard', match: 'dashboard' },
  { id: 'groups',  label: 'Mis Grupos',     icon: Users,         route: '/(teacher)/groups',    match: 'groups' },
  { id: 'grades',  label: 'Calificaciones', icon: GraduationCap, route: '/(teacher)/grades',    match: 'grades' },
  { id: 'profile', label: 'Perfil',         icon: User,          route: '/(teacher)/dashboard', match: 'profile' },
];
