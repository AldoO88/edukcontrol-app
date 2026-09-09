// =====================================================================
// src/constants/mockCitatorios.js
// ---------------------------------------------------------------------
// MOCK_CITATORIOS: datos prototipo del expediente de citaciones del
// módulo (teacher). Cada citatorio modela el shape del Citation
// Mongoose schema:
//
//   {
//     school, schoolYear, student, creator, // ObjectId refs (omitidos en mock)
//     scheduledDate: Date,                  // model: 'YYYY-MM-DDTHH:mm:ssZ'
//     location: String,                      // ej. 'Taller de Ofimática'
//     type: 'academic'|'behavioral'|'administrative',
//     reason: String,                        // ≤ 1000 chars (libre)
//     status: 'pending'|'confirmed'|'completed'|'no_show'|'expired',
//   }
//
// Campos adicionales del mock (no del schema, solo para la UI):
//   - id:           string (slug del citatorio, ej. 'c1').
//   - studentName, groupName, subject: nombres legibles para UI.
//   - date, time:   componentes simples de `scheduledDate`.
//   - creatorName:  nombre del staff que emitió el citatorio.
//   - createdAt:    ISO date de creación.
//   - history:      array de eventos del workflow
//                   [{ ts, actor, event, note? }].
//
// Cuando exista el endpoint, este archivo se reemplaza por la respuesta
// del backend. El shape de MOCK_CITATORIOS matchea el payload del
// endpoint para no romper consumidores (CitationsScreen y
// CitationDetailScreen).
// =====================================================================

const MOCK_CITATORIOS = [
  // ───── Próximos / Activos ─────
  {
    id: 'c1',
    studentName: 'Álvarez Gomez, Sofía',
    groupName: '1° A',
    subject: 'Taller de Ofimática I',
    date: '2026-08-18',
    time: '10:30',
    location: 'Taller de Ofimática',
    type: 'academic',
    reason:
      'Bajo rendimiento en evaluaciones del primer bloque. Se requiere apoyo del tutor para plan de mejora.',
    status: 'confirmed',
    creatorName: 'Prof. González Juárez',
    createdAt: '2026-08-14',
    history: [
      { ts: '14/Ago', actor: 'Prof. González Juárez', event: 'created' },
      { ts: '14/Ago', actor: 'Sistema',              event: 'sent_to_tutor' },
      { ts: '15/Ago', actor: 'Carmen Gómez (Madre)',  event: 'confirmed' },
    ],
  },
  {
    id: 'c2',
    studentName: 'Castillo Ruiz, Valentina',
    groupName: '1° A',
    subject: 'Taller de Ofimática I',
    date: '2026-08-19',
    time: '11:00',
    location: 'Trabajo Social',
    type: 'behavioral',
    reason:
      'Seguimiento conductual acordado con USAER. Ajustar adecuación de tiempo en evaluaciones.',
    status: 'pending',
    creatorName: 'Prof. González Juárez',
    createdAt: '2026-08-14',
    history: [
      { ts: '14/Ago', actor: 'Prof. González Juárez', event: 'created' },
      { ts: '14/Ago', actor: 'Sistema',              event: 'sent_to_tutor' },
    ],
  },
  {
    id: 'c3',
    studentName: 'Hernández Cruz, Luis',
    groupName: '1° A',
    subject: 'Taller de Ofimática I',
    date: '2026-08-20',
    time: '09:00',
    location: 'Dirección',
    type: 'behavioral',
    reason:
      'Incidencia reiterada en el taller. Reunión con el tutor para acordar medidas correctivas.',
    status: 'pending',
    creatorName: 'Prof. González Juárez',
    createdAt: '2026-08-15',
    history: [
      { ts: '15/Ago', actor: 'Prof. González Juárez', event: 'created' },
      { ts: '15/Ago', actor: 'Sistema',              event: 'sent_to_tutor' },
    ],
  },
  {
    id: 'c4',
    studentName: 'Bautista Pérez, Diego',
    groupName: '1° A',
    subject: 'Taller de Ofimática I',
    date: '2026-08-21',
    time: '16:00',
    location: 'Dirección',
    type: 'administrative',
    reason:
      'Trámite administrativo: validación de documentos de reinscripción.',
    status: 'pending',
    creatorName: 'Prof. González Juárez',
    createdAt: '2026-08-15',
    history: [
      { ts: '15/Ago', actor: 'Prof. González Juárez', event: 'created' },
    ],
  },
  // ───── Historial (completados / no_show) ─────
  {
    id: 'h1',
    studentName: 'Acosta Rodríguez, Mateo',
    groupName: '1° A',
    subject: 'Taller de Ofimática I',
    date: '2026-07-15',
    time: '08:30',
    location: 'Taller de Ofimática',
    type: 'academic',
    reason:
      'Revisión de avance académico del primer parcial.',
    status: 'completed',
    creatorName: 'Prof. González Juárez',
    createdAt: '2026-07-10',
    history: [
      { ts: '10/Jul', actor: 'Prof. González Juárez', event: 'created' },
      { ts: '11/Jul', actor: 'Sistema',              event: 'sent_to_tutor' },
      { ts: '12/Jul', actor: 'Roberto Acosta (Padre)', event: 'confirmed' },
      { ts: '15/Jul', actor: 'Prof. González Juárez', event: 'completed',
        note: 'Se acordó plan de regularización. Acudió el padre.' },
    ],
  },
  {
    id: 'h2',
    studentName: 'Delgado Ríos, Fernanda',
    groupName: '1° A',
    subject: 'Taller de Ofimática I',
    date: '2026-07-22',
    time: '10:00',
    location: 'Taller de Ofimática',
    type: 'academic',
    reason:
      'Seguimiento de calificaciones tras segundo parcial.',
    status: 'completed',
    creatorName: 'Prof. González Juárez',
    createdAt: '2026-07-18',
    history: [
      { ts: '18/Jul', actor: 'Prof. González Juárez', event: 'created' },
      { ts: '19/Jul', actor: 'Sistema',              event: 'sent_to_tutor' },
      { ts: '20/Jul', actor: 'Lucía Ríos (Madre)',     event: 'confirmed' },
      { ts: '22/Jul', actor: 'Prof. González Juárez', event: 'completed' },
    ],
  },
  {
    id: 'h3',
    studentName: 'Sánchez Mora, Paula',
    groupName: '1° A',
    subject: 'Taller de Ofimática I',
    date: '2026-08-05',
    time: '09:30',
    location: 'Taller de Ofimática',
    type: 'behavioral',
    reason:
      'Inasistencias reiteradas. Reunión con tutor.',
    status: 'no_show',
    creatorName: 'Prof. González Juárez',
    createdAt: '2026-08-01',
    history: [
      { ts: '01/Ago', actor: 'Prof. González Juárez', event: 'created' },
      { ts: '01/Ago', actor: 'Sistema',              event: 'sent_to_tutor' },
      { ts: '02/Ago', actor: 'Javier Sánchez (Padre)', event: 'confirmed' },
      { ts: '05/Ago', actor: 'Prof. González Juárez', event: 'no_show',
        note: 'El padre no se presentó. Reagendar.' },
    ],
  },
];

export default MOCK_CITATORIOS;