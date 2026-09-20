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
  Megaphone,      // Tab: Avisos (guardian, prefect).
  UserCheck,      // Tab: Conducta (guardian).
  GraduationCap,  // Tab: Calificaciones (guardian y teacher).
  ClipboardCheck, // Tab: Asistencia (guardian).
  Users,          // Tab: Mis Grupos (teacher), Grupos (prefect).
  User,           // Tab: Perfil (teacher y prefect).
  FileText,       // Tab: Reports (prefect — reportes/incidencias).
  Mail,           // Tab: Citatorios (prefect).
  Briefcase,      // Tab: Maestros (prefect).
  FolderOpen,     // Tab: Expediente (trabajador social).
  BarChart3,      // Tab: Métricas (director).
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
  { id: 'profile',       label: 'Perfil',         icon: User,            route: '/(guardian)/profile',       match: 'profile' },
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
// 5 tabs del prefecto (Inicio, Grupos, Alumnos, Maestros, Perfil).
//   - Inicio      → dashboard del prefecto (resumen diario + quick actions).
//   - Grupos      → lista de grupos → detalle (alumnos, asistencia, horario).
//   - Alumnos     → búsqueda de alumnos → ficha del alumno.
//   - Maestros    → lista de maestros → horario del maestro.
//   - Perfil      → perfil del prefecto + cerrar sesión.
// ---------------------------------------------------------------------
export const PREFECT_TABS = [
  { id: 'home',     label: 'Inicio',   icon: Home,       route: '/(prefect)/(tabs)/dashboard', match: 'dashboard' },
  { id: 'groups',   label: 'Grupos',   icon: Users,      route: '/(prefect)/(tabs)/groups',   match: 'groups' },
  { id: 'students', label: 'Alumnos',  icon: GraduationCap, route: '/(prefect)/(tabs)/students', match: 'students' },
  { id: 'teachers', label: 'Maestros', icon: Briefcase,  route: '/(prefect)/(tabs)/teachers', match: 'teachers' },
  { id: 'profile',  label: 'Perfil',   icon: User,       route: '/(prefect)/(tabs)/profile',  match: 'profile' },
];

// ---------------------------------------------------------------------
// SOCIAL_WORKER_TABS
// ---------------------------------------------------------------------
// 6 tabs del trabajador social (Inicio, Grupos, Alumnos, Maestros,
// Expediente, Perfil).
//   - Inicio      → dashboard del trabajador social.
//   - Grupos      → lista de grupos → detalle (alumnos, asistencia).
//   - Alumnos     → búsqueda de alumnos → ficha del alumno.
//   - Maestros    → lista de maestros → horario del maestro.
//   - Expediente  → lista de alumnos con salud/inclusión/acuerdos.
//   - Perfil      → perfil del trabajador social + cerrar sesión.
// ---------------------------------------------------------------------
export const SOCIAL_WORKER_TABS = [
  { id: 'home',      label: 'Inicio',     icon: Home,          route: '/(social-worker)/(tabs)/dashboard',   match: 'dashboard' },
  { id: 'groups',    label: 'Grupos',     icon: Users,         route: '/(social-worker)/(tabs)/groups',      match: 'groups' },
  { id: 'students',  label: 'Alumnos',    icon: GraduationCap, route: '/(social-worker)/(tabs)/students',    match: 'students' },
  { id: 'teachers',  label: 'Maestros',   icon: Briefcase,     route: '/(social-worker)/(tabs)/teachers',    match: 'teachers' },
  { id: 'expediente', label: 'Expediente', icon: FolderOpen,    route: '/(social-worker)/(tabs)/expediente',  match: 'expediente' },
  { id: 'profile',   label: 'Perfil',     icon: User,          route: '/(social-worker)/(tabs)/profile',     match: 'profile' },
];

// ---------------------------------------------------------------------
// DIRECTOR_TABS
// ---------------------------------------------------------------------
// 7 tabs del director (Inicio, Grupos, Alumnos, Maestros, Avisos,
// Reportes, Perfil).
//   - Inicio      → dashboard del director (métricas globales).
//   - Grupos      → lista de grupos → detalle.
//   - Alumnos     → búsqueda de alumnos → ficha + expediente.
//   - Maestros    → lista de maestros → horario.
//   - Avisos      → CRUD completo de avisos.
//   - Reportes    → reportes de conducta (ver todos + cancelar).
//   - Perfil      → perfil del director + cerrar sesión.
// ---------------------------------------------------------------------
export const DIRECTOR_TABS = [
  { id: 'home',      label: 'Inicio',     icon: Home,          route: '/(director)/(tabs)/dashboard',       match: 'dashboard' },
  { id: 'groups',    label: 'Grupos',     icon: Users,         route: '/(director)/(tabs)/groups',          match: 'groups' },
  { id: 'students',  label: 'Alumnos',    icon: GraduationCap, route: '/(director)/(tabs)/students',        match: 'students' },
  { id: 'teachers',  label: 'Maestros',   icon: Briefcase,     route: '/(director)/(tabs)/teachers',        match: 'teachers' },
  { id: 'profile',   label: 'Perfil',     icon: User,          route: '/(director)/(tabs)/profile',         match: 'profile' },
];
