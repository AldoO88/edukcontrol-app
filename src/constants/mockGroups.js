// =====================================================================
// src/constants/mockGroups.js
// ---------------------------------------------------------------------
// Datos MOCK de grupos asignados al maestro. Fuente única de verdad
// para las pantallas "Mis Grupos" (groups/index.jsx) y "Detalle del
// Grupo" (groups/[groupId]/index.jsx).
//
// Se reemplaza por la respuesta del endpoint real (p. ej.
// GET /api/teacher-subjects/me/groups) cuando exista.
//
// Campo clave para expediente condicional:
//   subject.isTutoria → true si la materia es Tutoría o Ed. Socioemocional.
//                       Determina si "Ver Expediente" abre file.jsx o
//                       tutoria-file.jsx.
// =====================================================================

const MOCK_GROUPS = [
  {
    id: '1-ofimatica',
    name: '1° OFIMÁTICA',
    tagLabel: 'TALLER TÉCNICO',
    tagBg: '#E0F2FE',
    tagColor: '#0284C7',
    students: 35,
    day: 'Hoy',
    time: '08:00 - 09:40',
    classroom: 'Taller 2',
    accentColor: '#0284C7',
    isTutoria: false,
  },
  {
    id: '3a-socioemocional',
    name: '3°A - Ed. Socioemocional',
    tagLabel: 'TUTORÍA',
    tagBg: '#FEF3C7',
    tagColor: '#92400E',
    students: 30,
    day: 'Martes',
    time: '10:00 - 10:50',
    classroom: 'Aula 12',
    accentColor: '#D97706',
    isTutoria: true,
  },
  {
    id: '2b-informatica',
    name: '2°B - Informática',
    tagLabel: 'MATERIA BASE',
    tagBg: '#F3E8FF',
    tagColor: '#6B21A8',
    students: 32,
    day: 'Miércoles',
    time: '11:40 - 13:20',
    classroom: 'Lab 1',
    accentColor: '#7C3AED',
    isTutoria: false,
  },
];

/**
 * Busca un grupo por ID.
 * @param {string} groupId
 * @returns {object|undefined}
 */
export const findGroupById = (groupId) => {
  return MOCK_GROUPS.find((g) => g.id === groupId);
};

export default MOCK_GROUPS;
