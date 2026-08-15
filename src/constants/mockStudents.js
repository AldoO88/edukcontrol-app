// =====================================================================
// src/constants/mockStudents.js
// ---------------------------------------------------------------------
// Datos MOCK de alumnos para el directorio. Se reemplazan por la
// respuesta del endpoint real cuando exista el hook correspondiente.
// =====================================================================

// Re-export del shape JSDoc para que los call-sites tengan IntelliSense.
// (No es obligatorio; lo agregamos solo para mantener consistencia con
// otros módulos que re-exportan desde types/.)

/**
 * @typedef {import('../types/student.js').Student} Student
 */

/** @type {import('../types/student.js').Student[]} */
const MOCK_STUDENTS = [
  {
    _id: 's1',
    name: 'Acosta Rodríguez, Mateo',
    controlNumber: '2025014701',
    listNumber: 1,
    photoUrl: null,
    status: 'regular',
    metrics: {
      average: 9.4,
      attendance: 96,
      citatorios: 0,
    },
    tutor: {
      name: 'Carmen Gómez',
      relationship: 'Madre',
      phone: '771-123-4567',
    },
  },
  {
    _id: 's2',
    name: 'Álvarez Gómez, Sofía',
    controlNumber: '2025014702',
    listNumber: 2,
    photoUrl: null,
    status: 'at_risk',
    metrics: {
      average: 5.6,
      attendance: 80,
      citatorios: 1,
    },
    tutor: {
      name: 'Carmen Gómez',
      relationship: 'Madre',
      phone: '771-234-5678',
    },
    supportProgram: 'USAER',
  },
  {
    _id: 's3',
    name: 'Bautista Pérez, Diego',
    controlNumber: '2025014703',
    listNumber: 3,
    photoUrl: null,
    status: 'regular',
    metrics: {
      average: 8.9,
      attendance: 92,
      citatorios: 0,
    },
    tutor: {
      name: 'Laura Pérez',
      relationship: 'Madre',
      phone: '771-345-6789',
    },
  },
  {
    _id: 's4',
    name: 'Castillo Ruiz, Valentina',
    controlNumber: '2025014704',
    listNumber: 4,
    photoUrl: null,
    status: 'at_risk',
    metrics: {
      average: 6.1,
      attendance: 78,
      citatorios: 2,
    },
    tutor: {
      name: 'Andrés Castillo',
      relationship: 'Padre',
      phone: '771-456-7890',
    },
    supportProgram: 'Apoyo',
  },
  {
    _id: 's5',
    name: 'Delgado Ríos, Fernanda',
    controlNumber: '2025014705',
    listNumber: 5,
    photoUrl: null,
    status: 'regular',
    metrics: {
      average: 8.7,
      attendance: 100,
      citatorios: 0,
    },
    tutor: {
      name: 'Lucía Ríos',
      relationship: 'Madre',
      phone: '771-567-8901',
    },
  },
  {
    _id: 's6',
    name: 'Hernández Cruz, Luis',
    controlNumber: '2025014706',
    listNumber: 6,
    photoUrl: null,
    status: 'at_risk',
    metrics: {
      average: 5.4,
      attendance: 72,
      citatorios: 1,
    },
    tutor: {
      name: 'Marta Cruz',
      relationship: 'Madre',
      phone: '771-678-9012',
    },
    supportProgram: 'USAER',
  },
  {
    _id: 's7',
    name: 'Sánchez Mora, Paula',
    controlNumber: '2025014707',
    listNumber: 7,
    photoUrl: null,
    status: 'regular',
    metrics: {
      average: 7.8,
      attendance: 88,
      citatorios: 0,
    },
    tutor: {
      name: 'Javier Sánchez',
      relationship: 'Padre',
      phone: '771-789-0123',
    },
  },
  {
    _id: 's8',
    name: 'Ramírez Torres, Emiliano',
    controlNumber: '2025014708',
    listNumber: 8,
    photoUrl: null,
    status: 'regular',
    metrics: {
      average: 9.0,
      attendance: 94,
      citatorios: 0,
    },
    tutor: {
      name: 'Sofía Torres',
      relationship: 'Madre',
      phone: '771-890-1234',
    },
  },
];

export default MOCK_STUDENTS;
