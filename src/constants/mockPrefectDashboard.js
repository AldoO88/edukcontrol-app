// =====================================================================
// src/constants/mockPrefectDashboard.js
// ---------------------------------------------------------------------
// Datos MOCK del dashboard del PREFECTO. Se reemplazan por la
// respuesta del endpoint real cuando exista.
//
// Shape:
//   {
//     prefect:        { name, role },
//     school:         { name, logoUrl, cycle },
//     currentDate:    string,
//     stats:          { attendances, tardies, absences },
//     recentIncidents: Array<{
//       id, studentName, group, time, type, description,
//     }>,
//   }
//
// Tipos de incidente (type):
//   - 'tardy'     → retardo de entrada (icono Clock, fondo amber).
//   - 'report'    → reporte de conducta (icono AlertTriangle, fondo rojo).
//   - 'citation'  → citatorio entregado (icono Info, fondo azul).
// =====================================================================

const MOCK_PREFECT_DASHBOARD = {
  prefect: {
    name: 'Profr. Encargado de Prefectura',
    role: 'Prefectura',
  },
  school: {
    name: 'Escuela Secundaria Técnica No. 47',
    logoUrl: null,
    cycle: '2025-2026',
  },
  currentDate: 'Lunes, 12 de Octubre',
  stats: {
    attendances: 425,
    punctual: 413,
    tardies: 12,
    absences: 8,
  },
  recentIncidents: [
    {
      id: 'inc1',
      studentName: 'Mateo Acosta',
      group: '3° A',
      time: '07:42 AM',
      type: 'tardy',
      description: 'Retardo de entrada',
    },
    {
      id: 'inc2',
      studentName: 'Luis Pérez',
      group: '2° B',
      time: '09:15 AM',
      type: 'report',
      description: 'Reporte por indisciplina en pasillo',
    },
    {
      id: 'inc3',
      studentName: 'Elena Ruiz',
      group: '2° A',
      time: '10:05 AM',
      type: 'citation',
      description: 'Citatorio entregado a padre de familia',
    },
  ],
};

/**
 * Devuelve el mock data del dashboard del prefecto.
 * En el futuro, este será un endpoint real (p. ej.
 * GET /api/prefect/dashboard).
 */
export const getMockPrefectDashboard = () => {
  return MOCK_PREFECT_DASHBOARD;
};

export default MOCK_PREFECT_DASHBOARD;
