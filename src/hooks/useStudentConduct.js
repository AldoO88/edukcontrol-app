// =====================================================================
// useStudentConduct.js
// ---------------------------------------------------------------------
// Hook que carga los datos de conducta de UN alumno específico.
// Internamente llama 2 endpoints en paralelo:
//
//   1. getConductSummary(studentId)  → score + maxScore
//   2. getConductLogs(studentId)     → items[] (faltas + méritos)
//
// Sigue el patrón de useGuardianDashboard (mismo manejo de refs
// anti-loop, guard anti-concurrencia, deps vacías en useCallback).
//
// Uso:
//
//   const { activeStudentId } = useState('...');
//   const { summary, logs, isLoading, error, refetch } =
//     useStudentConduct(activeStudentId);
//
// Si `studentId` es null o vacío, el hook NO fetchea (devuelve
// { summary: null, logs: [], isLoading: false }). Esto es importante
// para el caso de "no hay alumno seleccionado" (primera carga antes
// de que llegue la lista del backend).
// =====================================================================

// React hooks.
import { useState, useEffect, useRef, useCallback } from 'react';

// useFocusEffect de expo-router: corre el callback cada vez que
// la pantalla gana foco (incluye initial mount). Lo importamos
// para que el hook se refresque cuando el usuario vuelve a la
// pantalla de conducta después de ver otra pestaña.
import { useFocusEffect } from 'expo-router';

// Servicio de conducta.
import { getConductSummary, getConductLogs } from '../services/conductService';

export const useStudentConduct = (studentId) => {
  // -----------------------------------------------------------------
  // STATE
  // -----------------------------------------------------------------
  // summary: { currentScore, maxScore, recentLogs } del backend.
  //   null mientras no se ha cargado o si no hay studentId.
  // logs: array de items (faltas + méritos) del backend.
  // isLoading: true durante fetch inicial / refetch.
  // error: mensaje de error si la carga falló. null si todo OK.
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------
  // REFS (no causan re-renders)
  // -----------------------------------------------------------------
  // studentIdRef: espejo del studentId actual. Lo usamos dentro
  // de fetchData para saber qué studentId estamos cargando sin
  // meterlo en las deps del useCallback (eso era la causa del
  // loop infinito en useGuardianDashboard).
  const studentIdRef = useRef(studentId);
  studentIdRef.current = studentId;

  // inFlightRef: guard anti-concurrencia. Si refetch se llama
  // dos veces seguidas (ej. focus rápido entre tabs, o React
  // 18 strict mode duplicando effects en dev), solo la primera
  // corre. Las demás se ignoran silenciosamente.
  const inFlightRef = useRef(false);

  // -----------------------------------------------------------------
  // fetchData: función estable (deps vacías) que carga los 2
  // endpoints en paralelo usando Promise.all.
  // -----------------------------------------------------------------
  const fetchData = useCallback(async () => {
    // No fetcheamos si no hay studentId (caso de "todavía no
    // se ha seleccionado alumno"). El padre puede mostrar
    // empty state sin un loading falso.
    if (!studentIdRef.current) {
      setSummary(null);
      setLogs([]);
      setIsLoading(false);
      return;
    }

    // Guard anti-concurrencia.
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setIsLoading(true);
    setError(null);
    try {
      // Promise.all: ambos endpoints se disparan en paralelo
      // (no secuencial). Si alguno falla, el Promise.all
      // rechaza con el primer error.
      const [summaryResult, logsResult] = await Promise.all([
        getConductSummary(studentIdRef.current),
        getConductLogs(studentIdRef.current),
      ]);

      // Si AMBOS fallaron, mostramos un solo error.
      // Si solo UNO falló, mostramos el error pero dejamos los
      // datos del otro (mejor UX: ver el score aunque los logs
      // no hayan llegado, o ver los logs aunque el score no).
      if (!summaryResult.success && !logsResult.success) {
        setError(summaryResult.message || logsResult.message);
      } else {
        if (summaryResult.success) {
          setSummary(summaryResult.data);
        }
        if (logsResult.success) {
          setLogs(logsResult.data?.items || []);
        }
        // Si solo uno falló, logueamos el error del que falló
        // pero NO lo mostramos al usuario (es "degraded mode").
        if (!summaryResult.success) {
          console.warn('[useStudentConduct] summary falló:', summaryResult.message);
        }
        if (!logsResult.success) {
          console.warn('[useStudentConduct] logs fallaron:', logsResult.message);
        }
      }
    } catch (err) {
      // Catch defensivo: el service ya captura errores, pero
      // por si acaso (e.g. JSON.parse falla), caemos aquí.
      console.error('[useStudentConduct] unexpected error:', err);
      setError('Error inesperado al cargar la conducta.');
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, []); // DEPS VACÍAS — clave para evitar loops con useFocusEffect.

  // -----------------------------------------------------------------
  // EFECTO: cuando cambia el studentId, reseteamos y refetchamos.
  // -----------------------------------------------------------------
  // Si NO usamos useEffect, el primer mount no fetchea (porque
  // fetchData solo se llama dentro de useFocusEffect). Para
  // garantizar el fetch inicial, este useEffect dispara fetchData
  // cuando studentId cambia de null/string vacío a un valor real.
  useEffect(() => {
    // Reset al cambiar de alumno (evita "flash" del alumno previo
    // mientras carga el nuevo).
    setSummary(null);
    setLogs([]);
    setError(null);
    if (studentId) {
      fetchData();
    }
    // fetchData es estable (deps []), no necesita estar aquí.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // -----------------------------------------------------------------
  // useFocusEffect: re-fetchea cuando la pantalla gana foco.
  // Útil para cuando el usuario vuelve de otra pestaña y los
  // datos podrían haber cambiado.
  // -----------------------------------------------------------------
  useFocusEffect(
    useCallback(() => {
      // Solo re-fetcheamos si hay studentId activo. Si no hay,
      // el useEffect de arriba ya se encarga.
      if (studentId) {
        fetchData();
      }
    }, [studentId, fetchData]),
  );

  return { summary, logs, isLoading, error, refetch: fetchData };
};
