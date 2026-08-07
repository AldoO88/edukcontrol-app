// =====================================================================
// useAttendance.js
// ---------------------------------------------------------------------
// Hook que carga el resumen y el historial de asistencia de UN
// alumno específico. Internamente llama 2 endpoints en paralelo:
//
//   1. getAttendanceSummary(studentId) → percentage + stats
//   2. getAttendanceHistory(studentId) → history día por día
//
// Sigue el patrón de useStudentConduct (refs anti-loop, guard
// anti-concurrencia, deps vacías en useCallback).
//
// Uso:
//
//   const { summary, history, isLoading, error, refetch } =
//     useAttendance(activeStudentId);
//
// Si `studentId` es null o vacío, el hook NO fetchea.
// =====================================================================

// React hooks.
import { useState, useEffect, useRef, useCallback } from 'react';

// useFocusEffect de expo-router.
import { useFocusEffect } from 'expo-router';

// Servicios.
import {
  getAttendanceSummary,
  getAttendanceHistory,
} from '../services/attendanceService';

// ---------------------------------------------------------------------
// STATUS_MAP
// ---------------------------------------------------------------------
// Mapeo de los status codes del backend (ON_TIME, DELAY, NO_ENTRY)
// a las keys internas que usa AttendanceHistoryTable
// (a_tiempo, tarde, falta).
// ---------------------------------------------------------------------
const STATUS_MAP = {
  ON_TIME:  'a_tiempo',
  DELAY:    'tarde',
  NO_ENTRY: 'falta',
};

// ---------------------------------------------------------------------
// MONTH_LABELS
// ---------------------------------------------------------------------
// Labels de meses en español (3 chars, uppercase) para transformar
// la fecha del backend ("2026-08-01") al shape de RecentAbsenceCard
// ({ month: "AGO", day: 1 }).
// ---------------------------------------------------------------------
const MONTH_LABELS = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
];

// ---------------------------------------------------------------------
// mapSummaryData(rawSummary)
// ---------------------------------------------------------------------
// Transforma la respuesta del backend de summary al shape que
// consumen AttendanceRing, AttendanceStatCard y RecentAbsenceCard.
//
// Input shape (backend):
//   {
//     summary: { percentage, total_assists, total_absences, total_delays, total_days, progress_label },
//     recent_absences: [{ date, type, label, description }]
//   }
//
// Output shape (UI):
//   {
//     percentage: number,
//     totalAttendances: number,
//     totalAbsences: number,
//     totalLates: number,
//     progressLabel: string | null,
//     recentAbsences: [{ id, month, day, type, title, description }]
//   }
// ---------------------------------------------------------------------
const mapSummaryData = (raw) => {
  if (!raw) return null;

  const s = raw.summary || {};

  // Transformar recent_absences al shape de RecentAbsenceCard.
  const recentAbsences = (raw.recent_absences || []).map((absence, index) => {
    // Parsear la fecha ISO a mes + día.
    const dateObj = absence.date ? new Date(absence.date + 'T12:00:00') : null;
    const month = dateObj ? MONTH_LABELS[dateObj.getMonth()] : '---';
    const day = dateObj ? dateObj.getDate() : 0;

    // Mapear el type del backend al type de la UI.
    // El backend manda "absence" o "delay"; la UI espera
    // "injustificada" o "justificada". Como el backend no
    // distingue justificada/injustificada en el type, usamos
    // "injustificada" como default (el label ya trae la info).
    const uiType = absence.type === 'delay' ? 'justificada' : 'injustificada';

    return {
      id: `absence-${index}`,
      month,
      day,
      type: uiType,
      title: absence.label || 'Falta',
      description: absence.description || '',
    };
  });

  return {
    percentage: s.percentage ?? 0,
    totalAttendances: s.total_assists ?? 0,
    totalAbsences: s.total_absences ?? 0,
    totalLates: s.total_delays ?? 0,
    progressLabel: s.progress_label || null,
    recentAbsences,
  };
};

// ---------------------------------------------------------------------
// mapHistoryData(rawHistory)
// ---------------------------------------------------------------------
// Transforma la respuesta del backend de history al shape que
// consume AttendanceHistoryTable.
//
// Input shape (backend):
//   {
//     history: [{ date, date_formatted, entry, exit, status, status_label }]
//   }
//
// Output shape (UI):
//   [
//     { id, date, entry, exit, status }  // status: 'a_tiempo'|'tarde'|'falta'
//   ]
// ---------------------------------------------------------------------
const mapHistoryData = (raw) => {
  if (!raw?.history) return [];

  return raw.history.map((day, index) => ({
    id: `history-${index}`,
    // Usar date_formatted si viene del backend ("4 ago", "31 jul"),
    // sino formatear desde la fecha ISO.
    date: day.date_formatted || formatDateFallback(day.date),
    entry: day.entry || '—',
    exit: day.exit || '—',
    status: STATUS_MAP[day.status] || 'a_tiempo',
  }));
};

// ---------------------------------------------------------------------
// formatDateFallback(iso)
// ---------------------------------------------------------------------
// Fallback: si el backend NO manda date_formatted, formateamos
// la fecha ISO a "DD MMM" ("4 ago", "31 jul").
// ---------------------------------------------------------------------
const formatDateFallback = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return '—';
  const day = d.getDate();
  const month = MONTH_LABELS[d.getMonth()];
  return `${day} ${month}`;
};

// =====================================================================
// HOOK PRINCIPAL
// =====================================================================
export const useAttendance = (studentId) => {
  // -----------------------------------------------------------------
  // STATE
  // -----------------------------------------------------------------
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
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
      setSummary(null);
      setHistory([]);
      setIsLoading(false);
      return;
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setIsLoading(true);
    setError(null);
    try {
      const [summaryResult, historyResult] = await Promise.all([
        getAttendanceSummary(studentIdRef.current),
        getAttendanceHistory(studentIdRef.current),
      ]);

      // Si AMBOS fallaron, mostramos un solo error.
      if (!summaryResult.success && !historyResult.success) {
        setError(summaryResult.message || historyResult.message);
      } else {
        if (summaryResult.success) {
          setSummary(mapSummaryData(summaryResult.data));
        }
        if (historyResult.success) {
          setHistory(mapHistoryData(historyResult.data));
        }
        // Degraded mode: log del que falló.
        if (!summaryResult.success) {
          console.warn('[useAttendance] summary falló:', summaryResult.message);
        }
        if (!historyResult.success) {
          console.warn('[useAttendance] history falló:', historyResult.message);
        }
      }
    } catch (err) {
      console.error('[useAttendance] unexpected error:', err);
      setError('Error inesperado al cargar la asistencia.');
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, []); // DEPS VACÍAS — clave para evitar loops.

  // -----------------------------------------------------------------
  // EFECTO: cuando cambia el studentId, reseteamos y refetchamos.
  // -----------------------------------------------------------------
  useEffect(() => {
    setSummary(null);
    setHistory([]);
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

  return { summary, history, isLoading, error, refetch: fetchData };
};
