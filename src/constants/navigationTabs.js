// =====================================================================
// src/constants/navigationTabs.js
// ---------------------------------------------------------------------
// FUENTE ÚNICA de las configuraciones de la bottom tab bar por rol.
//
// ANTES: TEACHER_TABS estaba duplicado en TeacherDashboard.jsx,
// grades.jsx y attendance.jsx, y DEFAULT_TABS vivía dentro de
// BottomTabBar.jsx. Cualquier cambio de ruta/label/ícono exigía
// editar 4 archivos. Ahora cada rol tiene su array en UN solo lugar:
//   - GUARDIAN_TABS  → BottomTabBar por defecto (5 tabs del tutor).
//   - TEACHER_TABS   → se pasa explícitamente a <BottomTabBar /> en
//                       las pantallas del maestro.
//   - PREFECT_TABS   → se pasa explícitamente a <BottomTabBar /> en
//                       las pantallas del prefecto.
//
// IMPORTANTE (shared routes): las rutas de cada tab incluyen el
// route group del rol ((guardian) / (teacher) / (prefect)) para que
// Expo Router desambigüe URLs que comparten nombre (dashboard,
// attendance, etc.) entre los grupos. El `match` sigue siendo el
// segmento hoja para resaltar el tab activo.
// =====================================================================

// Iconos Lucide de los tabs.
import {
  Home,           // Tab: Inicio (ambos roles).
  Megaphone,      // Tab: Avisos (guardian).
  UserCheck,      // Tab: Conducta (guardian).
  GraduationCap,  // Tab: Calificaciones (guardian y teacher).
  ClipboardCheck, // Tab: Asistencia (guardian).
  Users,          // Tab: Mis Grupos (teacher).
  User,           // Tab: Perfil (teacher y prefect).
  DoorOpen,       // Tab: Gate (prefect — control de puerta).
  FileText,       // Tab: Reports (prefect — reportes/incidencias).
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
//   - Mis Grupos      → /(teacher)/(tabs)/groups (lista de grupos).
//   - Calificaciones  → /(teacher)/(tabs)/grades (placeholder).
//   - Perfil          → /(teacher)/(tabs)/profile.
//
// Las rutas usan el prefijo /(teacher)/(tabs)/ porque el Tabs
// navigator vive en (tabs)/. Los `match` siguen siendo segmentos
// hoja del screen name (no del path completo) — así el BottomTabBar
// resalta el tab activo correctamente aunque estés en un drill-down
// anidado (e.g. /groups/:groupId/students/[studentId]/file sigue
// resaltando "Mis Grupos" porque match='groups' ≠ 'students' ni
// 'studentId').
// ---------------------------------------------------------------------
export const TEACHER_TABS = [
  { id: 'home',    label: 'Inicio',         icon: Home,          route: '/(teacher)/(tabs)/dashboard', match: 'dashboard' },
  { id: 'groups',  label: 'Mis Grupos',     icon: Users,         route: '/(teacher)/(tabs)/groups',    match: 'groups' },
  { id: 'grades',  label: 'Calificaciones', icon: GraduationCap, route: '/(teacher)/(tabs)/grades',    match: 'grades' },
  { id: 'profile', label: 'Perfil',         icon: User,          route: '/(teacher)/(tabs)/profile',   match: 'profile' },
];

// ---------------------------------------------------------------------
// PREFECT_TABS
// ---------------------------------------------------------------------
// 4 tabs del prefecto (Home, Gate, Reports, Profile).
//   - Home     → dashboard del prefecto (resumen diario + incidencias).
//   - Gate     → control de puerta (registro de salidas/entradas).
//   - Reports  → reportes e incidencias (levantar/conultar reportes).
//   - Profile  → perfil del prefecto.
// ---------------------------------------------------------------------
export const PREFECT_TABS = [
  { id: 'home',    label: 'Home',    icon: Home,       route: '/(prefect)/(tabs)/dashboard', match: 'dashboard' },
  { id: 'gate',    label: 'Gate',    icon: DoorOpen,   route: '/(prefect)/(tabs)/gate',      match: 'gate' },
  { id: 'reports', label: 'Reports', icon: FileText,   route: '/(prefect)/(tabs)/reports',   match: 'reports' },
  { id: 'profile', label: 'Profile', icon: User,       route: '/(prefect)/(tabs)/profile',   match: 'profile' },
];
