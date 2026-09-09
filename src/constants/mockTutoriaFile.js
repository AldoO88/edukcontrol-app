// =====================================================================
// src/constants/mockTutoriaFile.js
// ---------------------------------------------------------------------
// Datos MOCK del Expediente de Tutoría / Educación Socioemocional.
// Se reemplazan por la respuesta del endpoint real cuando exista.
//
// A diferencia de mockStudentFile.js (materia regular: evaluación +
// asistencia de UNA materia), este mock modela el SEGUIMIENTO
// socioemocional del alumno: aprovechamiento en TODAS las materias,
// asistencia general y reportes de conducta.
//
// Shape:
//   {
//     studentId:     string,
//     group:         { name, section },
//     controlNumber: string,
//     trimesters: {
//       T1: {
//         subjects: Array<{
//           name:     string,
//           average:  number,
//           activities: Array<{
//             name:  string,
//             date:  string,    // "DD Mes"
//             grade: number,
//           }>,
//           attendance: {
//             present:  number,
//             absences: number,
//             justified: number,
//             tardies:  number,
//           },
//         }>,
//         attendance: { present, absences, justified, tardies },
//         conduct:    Array<{ id, date, text }>,
//       },
//       T2: null | { ... },
//       T3: null | { ... },
//     },
//   }
//
// `getMockTutoriaFile(id)` devuelve el file o null si no existe.
// =====================================================================

// ---------------------------------------------------------------------
// Mateo Acosta Rodríguez (s1) — caso completo del spec (imagen).
// ---------------------------------------------------------------------
const mateoTutoriaFile = {
  studentId: 's1',
  group: {
    name: '3°A - Ed. Socioemocional',
    section: '3° A',
  },
  controlNumber: '2025014701',
  trimesters: {
    T1: {
      subjects: [
        {
          name: 'Matemáticas',
          average: 9.2,
          activities: [
            { name: 'Proyecto Final: Algebra', date: '15 Oct', grade: 9.5 },
            { name: 'Examen Parcial', date: '05 Oct', grade: 5.8 },
          ],
          attendance: {
            present: 14,
            absences: 1,
            justified: 0,
            tardies: 0,
          },
        },
        {
          name: 'Español',
          average: 8.8,
          activities: [
            { name: 'Ensayo Argumentativo', date: '12 Oct', grade: 9.0 },
            { name: 'Examen Oral', date: '01 Oct', grade: 8.5 },
          ],
          attendance: {
            present: 15,
            absences: 0,
            justified: 0,
            tardies: 1,
          },
        },
        {
          name: 'Tecnología',
          average: 5.5,
          activities: [
            { name: 'Proyecto Web', date: '10 Oct', grade: 5.0 },
            { name: 'Práctica de Laboratorio', date: '28 Sep', grade: 6.2 },
          ],
          attendance: {
            present: 13,
            absences: 1,
            justified: 1,
            tardies: 0,
          },
        },
      ],
      attendance: {
        present: 42,
        absences: 2,
        justified: 1,
        tardies: 1,
      },
      conduct: [
        {
          id: 'c1',
          date: 'Oct 12, 2023',
          text: 'Inasistencia injustificada',
        },
        {
          id: 'c2',
          date: 'Sep 28, 2023',
          text: 'Falta de material',
        },
      ],
    },
    T2: null,
    T3: null,
  },
};

// ---------------------------------------------------------------------
// Helpers para generar datos mínimos para el resto de los alumnos.
// ---------------------------------------------------------------------
import MOCK_STUDENTS from './mockStudents';

const buildMinimalTutoriaFile = (student) => {
  const avg = Number(student.metrics?.average || 0);
  const att = Number(student.metrics?.attendance || 0);
  const totalSessions = 45;
  const absencesCount = Math.round((100 - att) / 100 * totalSessions);
  const tardiesCount = Math.max(0, Math.round(absencesCount * 0.3));
  const presentCount = totalSessions - absencesCount - tardiesCount;

  // Generar calificaciones plausibles basadas en el promedio del alumno.
  const clamp = (v) => Math.min(10, Math.max(0, Number(v.toFixed(1))));
  const subjects = [
    {
      name: 'Matemáticas',
      average: clamp(avg + (Math.random() * 1.0 - 0.5)),
      activities: [
        { name: 'Examen Parcial', date: '05 Oct', grade: clamp(avg + 0.3) },
        { name: 'Tarea Semanal', date: '28 Sep', grade: clamp(avg - 0.2) },
      ],
      attendance: {
        present: Math.round(presentCount / 3),
        absences: Math.round(absencesCount / 3),
        justified: Math.round(Math.random() * 1),
        tardies: Math.round(tardiesCount / 3),
      },
    },
    {
      name: 'Español',
      average: clamp(avg + (Math.random() * 0.8 - 0.3)),
      activities: [
        { name: 'Ensayo', date: '10 Oct', grade: clamp(avg + 0.5) },
        { name: 'Examen Oral', date: '02 Oct', grade: clamp(avg - 0.1) },
      ],
      attendance: {
        present: Math.round(presentCount / 3),
        absences: Math.round(absencesCount / 3),
        justified: Math.round(Math.random() * 1),
        tardies: Math.round(tardiesCount / 3),
      },
    },
    {
      name: 'Tecnología',
      average: clamp(avg + (Math.random() * 1.2 - 0.6)),
      activities: [
        { name: 'Proyecto', date: '08 Oct', grade: clamp(avg + 0.2) },
        { name: 'Práctica', date: '25 Sep', grade: clamp(avg - 0.4) },
      ],
      attendance: {
        present: Math.round(presentCount / 3),
        absences: Math.round(absencesCount / 3),
        justified: Math.round(Math.random() * 1),
        tardies: Math.round(tardiesCount / 3),
      },
    },
  ];

  return {
    studentId: student._id,
    group: {
      name: '3°A - Ed. Socioemocional',
      section: '3° A',
    },
    controlNumber: student.controlNumber,
    trimesters: {
      T1: {
        subjects,
        attendance: {
          present: presentCount,
          absences: absencesCount,
          justified: Math.round(absencesCount * 0.2),
          tardies: tardiesCount,
        },
        conduct: student.status === 'at_risk'
          ? [
              {
                id: `c-${student._id}-1`,
                date: 'Oct 10, 2023',
                text: 'Inasistencia injustificada',
              },
            ]
          : [],
      },
      T2: null,
      T3: null,
    },
  };
};

// ---------------------------------------------------------------------
// Mapa por studentId (single source of truth).
// Mateo tiene datos completos del spec; el resto usa el builder mínimo.
// ---------------------------------------------------------------------
const MOCK_TUTORIA_FILES = MOCK_STUDENTS.reduce((acc, student) => {
  if (student._id === mateoTutoriaFile.studentId) {
    acc[student._id] = mateoTutoriaFile;
  } else {
    acc[student._id] = buildMinimalTutoriaFile(student);
  }
  return acc;
}, {});

/**
 * Devuelve el mock file de tutoría del alumno por ID, o null.
 */
export const getMockTutoriaFile = (id) => {
  return MOCK_TUTORIA_FILES[id] || null;
};

export default MOCK_TUTORIA_FILES;
