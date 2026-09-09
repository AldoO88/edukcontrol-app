// =====================================================================
// src/constants/mockStudentFile.js
// ---------------------------------------------------------------------
// Datos MOCK del Expediente del Alumno (incluye expediente académico
// + ficha de inclusión + bitácora). Se reemplazan por la respuesta
// del endpoint real cuando exista.
//
// Shape por estudiante:
//   {
//     studentId:        string,
//     group:            { name, subject, section },
//     subject:          { name, code },
//     metrics:          { average, attendance, absences },
//     grades:           { currentTrimester, trimesters: { T1, T2, T3 } },
//     attendance:       Array<{ date, status, trimester }>,
//                       status    ∈ 'presente'|'ausente'|'retardo',
//                       trimester ∈ 'T1'|'T2'|'T3',
//     pedagogical:      {
//       learningStyle:   string,
//       styleHint:       string,
//     alerts:          Array<{ id, type, iconName, title, subtitle }>,
//       allergies:       string | null,
//     },
//     socialWork:       Array<{ id, date, text }>,
//     teacherNotes:     Array<{ id, date, text }>,
//   }
//
// `getMockStudentFile(id)` devuelve el file o null si no existe.
// =====================================================================

const SPANISH_MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

// Helper para crear una fecha formateada 'DD/Mes' a partir de un offset
// de días hacia atrás desde hoy.
const offsetDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const day = String(d.getDate()).padStart(2, '0');
  return `${day}/${SPANISH_MONTHS_SHORT[d.getMonth()]}`;
};

// Helper para generar N sesiones de asistencia con un % deseado de
// ausentismo. Distribuye las ausencias de forma intercalada.
const generateAttendance = (totalSessions, absencesCount) => {
  const sessions = [];
  const statuses = Array(totalSessions).fill('presente');
  // Marcar las primeras N como ausentes (al inicio para que las
  // recientes sean presente, más realista).
  for (let i = 0; i < absencesCount && i < totalSessions; i += 1) {
    statuses[i] = 'ausente';
  }
  // Shuffle simple (intercambia pares para intercalar).
  for (let i = 1; i < statuses.length - 1; i += 2) {
    [statuses[i], statuses[i + 1]] = [statuses[i + 1], statuses[i]];
  }
  for (let i = 0; i < totalSessions; i += 1) {
    sessions.push({ date: offsetDate(i), status: statuses[i] });
  }
  return sessions;
};

// ---------------------------------------------------------------------
// Sofía Álvarez (s2) — caso completo del spec
// ---------------------------------------------------------------------
const sofiaFile = {
  studentId: 's2',
  group: {
    name: '1° OFIMÁTICA',
    subject: 'Taller de Ofimática I',
    section: '1° A',
  },
  subject: {
    name: 'Taller de Ofimática I',
    code: 'TOF-101',
  },
  metrics: {
    average: 5.6,
    attendance: 88,
    absences: 3,
  },
  grades: {
    currentTrimester: 'T1',
    trimesters: {
      // T1 activo: pesos 40/30/20/10 cuyo promedio ponderado = 5.6.
      T1: {
        practices: { weight: 40, score: 5.0 },
        exam:       { weight: 30, score: 6.0 },
        tasks:      { weight: 20, score: 5.5 },
        formative:  { weight: 10, score: 7.0 },
      },
      T2: null, // No ha iniciado.
      T3: null,
    },
  },
  // 14 sesiones, 3 ausencias (≈ 88%). Todas marcadas como T1 (el
  // trimestre actual); T2/T3 aún no han iniciado, por lo que sus
  // listas de asistencia están vacías. El tab "Asistencia" filtra
  // por trimester para reflejar esta realidad.
  attendance: (() => {
    const sessions = generateAttendance(14, 3);
    return sessions.map((s) => ({ ...s, trimester: 'T1' }));
  })(),
  pedagogical: {
    learningStyle: 'VISUAL / KINESTÉSICO',
    styleHint:
      'Aprende mejor mediante ejemplos prácticos en pantalla y guías ilustradas.',
    alerts: [
      {
        id: 'a1',
        type: 'visual',
        iconName: 'Eye',
        title: 'Limitante visual',
        subtitle: 'Sentar en filas frontales',
      },
      {
        id: 'a2',
        type: 'medical',
        iconName: 'Stethoscope',
        title: 'Diagnóstico activo',
        subtitle: 'TDAH en tratamiento',
      },
      {
        id: 'a3',
        type: 'usaer',
        iconName: 'Puzzle',
        title: 'Canalizada a USAER',
        subtitle:
          'Requiere adecuación de tiempo en evaluaciones',
      },
    ],
    allergies:
      'Alergia al polen - Notificar en actividades al aire libre',
  },
  socialWork: [
    {
      id: 'sw1',
      date: '12 / Ago / 2024',
      text:
        'Compromiso firmado con la madre para entrega de tareas pendientes del primer bloque.',
    },
    {
      id: 'sw2',
      date: '05 / Ago / 2024',
      text: 'Cita inicial con Trabajo Social - Acudió la madre.',
    },
  ],
  teacherNotes: [
    {
      id: 'tn1',
      date: '15/Ago',
      text: 'Mostró mayor concentración al trabajar en parejas.',
    },
  ],
};

// ---------------------------------------------------------------------
// Helper para generar files mínimos para el resto de los alumnos.
// Toma los datos básicos del mockStudents.js (average, status) y los
// mapea a un file con datos plausibles.
// ---------------------------------------------------------------------
const buildMinimalFile = (student) => {
  const avg = Number(student.metrics?.average || 0);
  const att = Number(student.metrics?.attendance || 0);
  const absences = Math.round((100 - att) / 100 * 14); // sobre 14 sesiones
  const isAtRisk = avg < 6.0;

  return {
    studentId: student._id,
    group: {
      name: '1° OFIMÁTICA',
      subject: 'Taller de Ofimática I',
      section: '1° A',
    },
    subject: {
      name: 'Taller de Ofimática I',
      code: 'TOF-101',
    },
    metrics: {
      average: avg,
      attendance: att,
      absences,
    },
    grades: {
      currentTrimester: 'T1',
      trimesters: {
        T1: {
          practices: { weight: 40, score: isAtRisk ? avg - 0.5 : avg + 0.3 },
          exam:       { weight: 30, score: isAtRisk ? avg + 0.4 : avg - 0.2 },
          tasks:      { weight: 20, score: isAtRisk ? avg - 0.4 : avg + 0.1 },
          formative:  { weight: 10, score: isAtRisk ? avg + 1.4 : avg + 0.5 },
        },
        T2: null,
        T3: null,
      },
    },
    attendance: generateAttendance(14, absences).map((s) => ({
      ...s,
      trimester: 'T1',
    })),
    pedagogical: {
      // Si tiene supportProgram en mockStudents.js, mostramos el
      // estilo kinestésico como pista; si no, visual.
      learningStyle: student.supportProgram ? 'KINESTÉSICO' : 'VISUAL',
      styleHint: student.supportProgram
        ? 'Aprende mejor con actividades manipulativas y práctica guiada paso a paso.'
        : 'Aprende mejor con material visual y ejemplos paso a paso.',
      alerts: student.supportProgram
        ? [
            {
              id: 'p1',
              type: 'usaer',
              iconName: 'Puzzle',
              title: `Canalizada a ${student.supportProgram}`,
              subtitle: 'Requiere adecuación de actividades y tiempos.',
            },
          ]
        : [],
      allergies: null,
    },
    socialWork: [],
    teacherNotes: [],
  };
};

// ---------------------------------------------------------------------
// Mapa por studentId (single source of truth).
// Sofía tiene datos completos del spec; el resto usa el builder
// mínimo basado en sus métricas de mockStudents.js.
// ---------------------------------------------------------------------
import MOCK_STUDENTS from './mockStudents';

const MOCK_STUDENT_FILES = MOCK_STUDENTS.reduce((acc, student) => {
  if (student._id === sofiaFile.studentId) {
    acc[student._id] = sofiaFile;
  } else {
    acc[student._id] = buildMinimalFile(student);
  }
  return acc;
}, {});

/**
 * Devuelve el mock file del alumno por ID, o null si no existe.
 */
export const getMockStudentFile = (id) => {
  return MOCK_STUDENT_FILES[id] || null;
};

export default MOCK_STUDENT_FILES;