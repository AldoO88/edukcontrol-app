// =====================================================================
// src/types/student.js
// ---------------------------------------------------------------------
// Tipos / typedefs JSDoc para el módulo de alumnos (modo JS puro).
// El proyecto no usa TypeScript, pero estos typedefs sirven para
// documentación y validación en editores (JSDoc).
// =====================================================================

/**
 * Status académico del alumno en el grupo.
 *   - 'regular': sin riesgo.
 *   - 'at_risk': en riesgo (bajo promedio o baja asistencia).
 *
 * @typedef {'regular' | 'at_risk'} STUDENT_STATUS
 */

/**
 * Tutor del alumno (padre / madre / tutor legal).
 *
 * @typedef {Object} StudentTutor
 * @property {string} name        - Nombre completo del tutor.
 * @property {string} relationship - Relación (Padre / Madre / Tutor).
 * @property {string} phone       - Número de teléfono del tutor (formato
 *                                  libre: "771-123-4567" o "+52...").
 *                                  Se usa para abrir WhatsApp desde el
 *                                  modal de citatorio.
 */

/**
 * Métricas académicas mostradas en la card del directorio.
 *
 * @typedef {Object} StudentMetrics
 * @property {number} average    - Promedio general (0.0 - 10.0).
 * @property {number} attendance - Porcentaje de asistencia (0 - 100).
 * @property {number} citatorios  - Cantidad de citatorios pendientes.
 */

/**
 * Programa de apoyo / USAER. Si el alumno cuenta con alguno se
 * muestra un badge morado adicional en su card.
 *
 * @typedef {'USAER' | 'Apoyo'} STUDENT_SUPPORT_PROGRAM
 */

/**
 * Forma del alumno en el directorio.
 *
 * @typedef {Object} Student
 * @property {string} _id
 * @property {string} name
 * @property {string} controlNumber
 * @property {number} listNumber
 * @property {string|null} photoUrl
 * @property {STUDENT_STATUS} status
 * @property {StudentMetrics} metrics
 * @property {StudentTutor} tutor
 * @property {STUDENT_SUPPORT_PROGRAM} [supportProgram] - Opcional.
 *           Si existe se renderiza el badge morado en la card
 *           expandida (e.g. "USAER" o "Apoyo").
 */

// Exporta `Object` vacío para que el archivo sea un módulo válido.
export default {};
