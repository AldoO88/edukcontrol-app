// =====================================================================
// app/(teacher)/dashboard.jsx
// ---------------------------------------------------------------------
// Ruta "/dashboard" del grupo (teacher) — el dashboard del MAESTRO.
//
// Con el refactor de route groups por rol, cada grupo tiene su propio
// dashboard.jsx (shared route: (teacher)/dashboard y (guardian)/dashboard
// comparten la URL /dashboard, pero se navegan explícitamente con
// '/(teacher)/dashboard' o '/(guardian)/dashboard'). El dispatcher por
// rol que vivía en app/(app)/dashboard.jsx ya no existe: cada grupo
// es autónomo y el role gate vive en su _layout.jsx.
//
// El role gate (redirect si el rol no coincide) lo hace el layout del
// grupo. Esta pantalla SOLO renderiza el dashboard del maestro.
// =====================================================================

// Componente privado del grupo: vive en _components/, no es ruta.
import TeacherDashboard from './_components/TeacherDashboard';

export default function TeacherDashboardScreen() {
  return <TeacherDashboard />;
}
