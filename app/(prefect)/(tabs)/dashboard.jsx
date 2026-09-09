// =====================================================================
// app/(prefect)/(tabs)/dashboard.jsx
// ---------------------------------------------------------------------
// Ruta "/dashboard" del grupo (prefect) — el dashboard del PREFECTO.
//
// Screen wrapper: delega en PrefectDashboard (componente privado
// del route group, vive en _components/).
// =====================================================================

// Componente privado del grupo: vive en _components/, no es ruta.
import PrefectDashboard from '../../(prefect)/_components/PrefectDashboard.jsx';

export default function PrefectDashboardScreen() {
  return <PrefectDashboard />;
}
