// =====================================================================
// useGrades.js
// ---------------------------------------------------------------------
// Hook que carga las calificaciones y el horario de UN alumno
// específico. Internamente llama 2 endpoints en paralelo:
//
//   1. getStudentGrades(studentId)  → grades_matrix + summary
//   2. getStudentSchedule(studentId) → schedule por día
//
// Sigue el patrón de useStudentConduct (refs anti-loop, guard
// anti-concurrencia, deps vacías en useCallback).
//
// Uso:
//
//   const { grades, schedule, isLoading, error, refetch } =
//     useGrades(activeStudentId);
//
// Si `studentId` es null o vacío, el hook NO fetchea (devuelve
// { grades: null, schedule: null, isLoading: false }).
// =====================================================================

// React hooks.
import { useState, useEffect, useRef, useCallback } from 'react';

// useFocusEffect de expo-router.
import { useFocusEffect } from 'expo-router';

// Servicios.
import { getStudentGrades, getStudentSchedule } from '../services/gradesService';

// ---------------------------------------------------------------------
// SCHOOL_DAY_KEYS
// ---------------------------------------------------------------------
// Mapeo de los keys numéricos del backend ("1"-"5") a los ids
// de los días de la semana usados en la UI. El backend usa:
//   "1" = Lunes, "2" = Martes, "3" = Miércoles,
//   "4" = Jueves, "5" = Viernes
// ---------------------------------------------------------------------
const SCHOOL_DAY_KEYS = {
  '1': 'lunes',
  '2': 'martes',
  '3': 'miercoles',
  '4': 'jueves',
  '5': 'viernes',
};

// ---------------------------------------------------------------------
// mapScheduleByDay(rawSchedule)
// ---------------------------------------------------------------------
// Transforma el objeto `schedule` del backend (keys numéricas "1"-"5")
// a un objeto con keys de días de la UI ("lunes", "martes", etc.).
//
// Input shape (backend):
//   {
//     "1": { day_name: "LUN", classes: [{ subject, subject_code, teacher, start, end, classroom }] },
//     "2": { day_name: "MAR", classes: [...] },
//     ...
//   }
//
// Output shape (UI):
//   {
//     lunes: [{ time, subject, subjectFull, teacher, color }],
//     martes: [...],
//     ...
//   }
//
// El campo `color` se asigna de forma determinista basándose en
// el subject_code para que cada materia tenga un color consistente.
// ---------------------------------------------------------------------
const SUBJECT_COLOR_CYCLE = ['sky', 'rose', 'emerald', 'amber', 'purple', 'cyan'];

const mapScheduleByDay = (rawSchedule) => {
  if (!rawSchedule || typeof rawSchedule !== 'object') return {};

  // Mapa de subject_code → color para mantener consistencia
  // entre materias. Si una materia ya tiene color asignado, se
  // reutiliza; si no, se toma el siguiente del ciclo.
  const subjectColorMap = {};
  let colorIndex = 0;

  const result = {};

  Object.entries(rawSchedule).forEach(([dayKey, dayData]) => {
    const dayId = SCHOOL_DAY_KEYS[dayKey];
    if (!dayId) return;

    const classes = dayData?.classes || [];

    result[dayId] = classes.map((cls) => {
      const code = cls.subject_code || cls.subject?.slice(0, 3)?.toUpperCase() || '---';

      // Asignar color determinista por subject_code.
      if (!subjectColorMap[code]) {
        subjectColorMap[code] = SUBJECT_COLOR_CYCLE[colorIndex % SUBJECT_COLOR_CYCLE.length];
        colorIndex += 1;
      }

      return {
        time: `${cls.start} - ${cls.end}`,
        subject: code,
        subjectFull: cls.subject || 'Sin materia',
        teacher: cls.teacher || 'Sin asignar',
        color: subjectColorMap[code],
      };
    });
  });

  return result;
};

// ---------------------------------------------------------------------
// mapGradesData(rawGrades)
// ---------------------------------------------------------------------
// Transforma la respuesta del backend de grades al shape que
// consumen CalificacionesTable y la pantalla de promedio.
//
// Input shape (backend):
//   {
//     grades_matrix: [
//       { subject_id, subject, periods: { "1": 10, "2": null } },
//       { subject_id: null, subject: "Promedio", periods: { "1": 9.1 } }
//     ],
//     summary: { average, total_grades, by_period: [...], ... }
//   }
//
// Output shape (UI):
//   {
//     average: 9.1,
//     subjects: [
//       { id, name, t1: 10, t2: null, t3: null },
//       ...
//     ],
//     averageByPeriod: { t1: 9.1, t2: null, t3: null },
//     periods: [{ period: 1, name: "Trimestre 1", average: 9.1 }]
//   }
// ---------------------------------------------------------------------
const mapGradesData = (rawGrades) => {
  if (!rawGrades) return null;

  const matrix = rawGrades.grades_matrix || [];
  const summary = rawGrades.summary || {};

  // Mapeo de period key ("1","2","3") a key de UI ("t1","t2","t3").
  const PERIOD_TO_T = { '1': 't1', '2': 't2', '3': 't3' };

  // Extraer el set de periods que existen en la data.
  const allPeriodKeys = new Set();
  matrix.forEach((row) => {
    if (row.periods) {
      Object.keys(row.periods).forEach((k) => allPeriodKeys.add(k));
    }
  });
  const sortedPeriods = Array.from(allPeriodKeys).sort((a, b) => Number(a) - Number(b));

  // Construir subjects excluyendo la fila "Promedio" (subject_id === null).
  const subjects = matrix
    .filter((row) => row.subject_id !== null)
    .map((row) => {
      const entry = { id: row.subject_id, name: row.subject || 'Sin nombre' };
      sortedPeriods.forEach((p) => {
        const tKey = PERIOD_TO_T[p] || `t${p}`;
        entry[tKey] = row.periods?.[p] ?? null;
      });
      return entry;
    });

  // Fila de promedio por periodo.
  const averageByPeriod = {};
  const promedioRow = matrix.find((row) => row.subject_id === null && row.subject === 'Promedio');
  sortedPeriods.forEach((p) => {
    const tKey = PERIOD_TO_T[p] || `t${p}`;
    averageByPeriod[tKey] = promedioRow?.periods?.[p] ?? null;
  });

  // Info de periods para headers dinámicos.
  const periods = (summary.by_period || []).map((bp) => ({
    period: bp.period,
    name: bp.name || `Periodo ${bp.period}`,
    average: bp.average,
    count: bp.count,
  }));

  return {
    average: summary.average ?? averageByPeriod.t1 ?? 0,
    subjects,
    averageByPeriod,
    periods,
  };
};

// =====================================================================
// HOOK PRINCIPAL
// =====================================================================
export const useGrades = (studentId) => {
  // -----------------------------------------------------------------
  // STATE
  // -----------------------------------------------------------------
  // grades: datos de calificaciones transformados para la UI.
  //   null mientras no se ha cargado o si no hay studentId.
  // schedule: horario por día transformado para la UI.
  //   null mientras no se ha cargado.
  const [grades, setGrades] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------
  // REFS
  // -----------------------------------------------------------------
  const studentIdRef = useRef(studentId);
  studentIdRef.current = studentId;

  const inFlightRef = useRef(false);

  // -----------------------------------------------------------------
  // fetchData: carga los 2 endpoints en paralelo.
  // -----------------------------------------------------------------
  const fetchData = useCallback(async () => {
    if (!studentIdRef.current) {
      setGrades(null);
      setSchedule(null);
      setIsLoading(false);
      return;
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setIsLoading(true);
    setError(null);
    try {
      const [gradesResult, scheduleResult] = await Promise.all([
        getStudentGrades(studentIdRef.current),
        getStudentSchedule(studentIdRef.current),
      ]);

      // Si AMBOS fallaron, mostramos un solo error.
      if (!gradesResult.success && !scheduleResult.success) {
        setError(gradesResult.message || scheduleResult.message);
      } else {
        if (gradesResult.success) {
          setGrades(mapGradesData(gradesResult.data));
        }
        if (scheduleResult.success) {
          setSchedule(mapScheduleByDay(scheduleResult.data?.schedule));
        }
        // Degraded mode: log del que falló.
        if (!gradesResult.success) {
          console.warn('[useGrades] grades falló:', gradesResult.message);
        }
        if (!scheduleResult.success) {
          console.warn('[useGrades] schedule falló:', scheduleResult.message);
        }
      }
    } catch (err) {
      console.error('[useGrades] unexpected error:', err);
      setError('Error inesperado al cargar las calificaciones.');
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, []); // DEPS VACÍAS — clave para evitar loops.

  // -----------------------------------------------------------------
  // EFECTO: cuando cambia el studentId, reseteamos y refetchamos.
  // -----------------------------------------------------------------
  useEffect(() => {
    setGrades(null);
    setSchedule(null);
    setError(null);
    if (studentId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // -----------------------------------------------------------------
  // useFocusEffect: re-fetchea cuando la pantalla gana foco.
  // -----------------------------------------------------------------
  useFocusEffect(
    useCallback(() => {
      if (studentId) {
        fetchData();
      }
    }, [studentId, fetchData]),
  );

  return { grades, schedule, isLoading, error, refetch: fetchData };
};
