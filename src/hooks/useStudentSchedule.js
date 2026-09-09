// =====================================================================
// useStudentSchedule.js
// ---------------------------------------------------------------------
// Hook que carga el horario semanal de un alumno específico.
// Internamente llama getStudentSchedule(studentId) y retorna
// la info del grupo, turno y el mapa de horarios por día.
//
// Uso:
//   const { schedule, group, shiftInfo, isLoading, error, refetch } =
//     useStudentSchedule(activeStudentId);
//
// Si `studentId` es null o vacío, el hook NO fetchea.
// =====================================================================

// React hooks.
import { useState, useEffect, useRef, useCallback } from 'react';

// useFocusEffect de expo-router.
import { useFocusEffect } from 'expo-router';

// Servicio.
import { getStudentSchedule } from '../services/gradesService';

// ---------------------------------------------------------------------
// DAY_NAMES
// ---------------------------------------------------------------------
// Nombres de los días en español para mostrar en la UI.
// ---------------------------------------------------------------------
const DAY_NAMES = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
};

// ---------------------------------------------------------------------
// mapScheduleData(raw)
// ---------------------------------------------------------------------
// Transforma la respuesta del backend al shape que consume la UI.
//
// Input shape (backend):
//   {
//     student_id, school_year, group, taller_group, shift_info,
//     schedule: {
//       1: { day_name, classes: [{
//           subject_id, subject, subject_code,
//           color, icon,                 // hex + nombre Lucide del backend
//           teacher, start, end,
//           classroom, block_count, block_names,
//           is_taller,                   // true si es clase del taller
//           type                         // "receso" para recesos
//         }] },
//       2: { ... },
//       ...
//     }
//   }
//
// Output shape (UI):
//   {
//     studentId, schoolYear, group, tallerGroup, shiftInfo,
//     days: [
//       { dayNumber, dayName, classes: [{
//           id, subject, subjectCode, subjectId,
//           color, icon,                 // pasados del backend al UI
//           teacher, start, end,
//           classroom, blockCount, blockNames,
//           isTaller, type
//         }] }
//     ]
//   }
// ---------------------------------------------------------------------
const mapScheduleData = (raw) => {
  if (!raw) return null;

  return {
    studentId: raw.student_id,
    schoolYear: raw.school_year,
    group: raw.group,
    tallerGroup: raw.taller_group,
    shiftInfo: raw.shift_info,
    days: [1, 2, 3, 4, 5].map((dayNum) => {
      const dayData = raw.schedule?.[dayNum];
      return {
        dayNumber: dayNum,
        dayName: DAY_NAMES[dayNum] || dayData?.day_name || `Día ${dayNum}`,
        classes: (dayData?.classes || []).map((cls, index) => ({
          id: `day${dayNum}-class${index}`,
          subject: cls.subject,
          subjectCode: cls.subject_code,
          subjectId: cls.subject_id,
          color: cls.color,
          icon: cls.icon,
          teacher: cls.teacher,
          start: cls.start,
          end: cls.end,
          classroom: cls.classroom,
          blockCount: cls.block_count,
          blockNames: cls.block_names,
          isTaller: cls.is_taller,
          type: cls.type,
        })),
      };
    }),
  };
};

// =====================================================================
// HOOK PRINCIPAL
// =====================================================================
export const useStudentSchedule = (studentId) => {
  // -----------------------------------------------------------------
  // STATE
  // -----------------------------------------------------------------
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------
  // REFS
  // -----------------------------------------------------------------
  const studentIdRef = useRef(studentId);
  studentIdRef.current = studentId;

  const inFlightRef = useRef(false);

  // -----------------------------------------------------------------
  // fetchData: carga el horario del alumno.
  // -----------------------------------------------------------------
  const fetchData = useCallback(async () => {
    if (!studentIdRef.current) {
      setScheduleData(null);
      setIsLoading(false);
      return;
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getStudentSchedule(studentIdRef.current);

      if (!result.success) {
        setError(result.message);
        setScheduleData(null);
      } else {
        setScheduleData(mapScheduleData(result.data));
        setError(null);
      }
    } catch (err) {
      console.error('[useStudentSchedule] unexpected error:', err);
      setError('Error inesperado al cargar el horario.');
      setScheduleData(null);
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, []); // DEPS VACÍAS — clave para evitar loops.

  // -----------------------------------------------------------------
  // EFECTO: cuando cambia el studentId, reseteamos y refetchamos.
  // -----------------------------------------------------------------
  useEffect(() => {
    setScheduleData(null);
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

  return {
    scheduleData,
    isLoading,
    error,
    refetch: fetchData,
  };
};
