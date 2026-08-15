// =====================================================================
// app/(guardian)/dashboard.jsx
// ---------------------------------------------------------------------
// Ruta "/dashboard" del grupo (guardian) — el dashboard del TUTOR.
//
// Con el refactor de route groups por rol, cada grupo tiene su propio
// dashboard.jsx (shared route: (guardian)/dashboard y (teacher)/dashboard
// comparten la URL /dashboard, pero se navegan explícitamente con
// '/(guardian)/dashboard' o '/(teacher)/dashboard'). El dispatcher por
// rol que vivía en app/(app)/dashboard.jsx ya no existe: cada grupo
// es autónomo y el role gate vive en su _layout.jsx.
//
// El role gate (redirect si el rol no coincide) lo hace el layout del
// grupo. Esta pantalla SOLO renderiza el dashboard del tutor.
// =====================================================================

// Componente privado del grupo: vive en _components/, no es ruta.
import GuardianDashboard from './_components/GuardianDashboard';

export default function GuardianDashboardScreen() {
  return <GuardianDashboard />;
}
