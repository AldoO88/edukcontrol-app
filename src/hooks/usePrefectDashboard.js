// =====================================================================
// usePrefectDashboard.js
// ---------------------------------------------------------------------
// Hook que orquesta la carga de datos del dashboard del prefecto.
// Misma estructura que useTeacherDashboard: fetch inicial,
// loading state, error state, y refetch cuando la pantalla vuelve
// a tener foco (useFocusEffect de Expo Router).
//
// TODO: cuando exista el endpoint real, reemplazar
// `getMockPrefectDashboard` por una llamada al service correspondiente.
// =====================================================================

// React hooks.
import { useState, useRef, useCallback } from 'react';

// useFocusEffect de expo-router: corre el callback cada vez que
// la pantalla gana foco (incluye el initial mount).
import { useFocusEffect } from 'expo-router';

// Mock data (se reemplazará por el service real).
import { getMockPrefectDashboard } from '../constants/mockPrefectDashboard';

export const usePrefectDashboard = () => {
  // data: el payload completo del backend (prefect + school + stats).
  // null mientras no se ha cargado la primera vez.
  const [data, setData] = useState(null);
  // isLoading: true durante el fetch inicial y durante refetches.
  const [isLoading, setIsLoading] = useState(true);
  // error: mensaje de error si la carga falló. null si todo OK.
  const [error, setError] = useState(null);

  // Refs para evitar loops y concurrencia (mismo patrón que
  // useTeacherDashboard).
  const dataRef = useRef(data);
  dataRef.current = data;
  const inFlightRef = useRef(false);

  // ---------------------------------------------------------------------
  // refetch: estable entre renders (deps vacías).
  // ---------------------------------------------------------------------
  const refetch = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setIsLoading(true);
    setError(null);
    try {
      // TODO: reemplazar por GET /api/prefect/dashboard cuando
      // exista el endpoint real.
      const result = getMockPrefectDashboard();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('[usePrefectDashboard] unexpected error:', err);
      setError('Error inesperado al cargar el dashboard.');
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  // useFocusEffect: corre refetch en cada focus de pantalla.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return { data, isLoading, error, refetch };
};
