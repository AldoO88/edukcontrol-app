// =====================================================================
// usePrefectDashboard.js
// ---------------------------------------------------------------------
// Hook que orquesta la carga de datos del dashboard del prefecto.
// Misma estructura que useTeacherDashboard: fetch inicial,
// loading state, error state, y refetch cuando la pantalla vuelve
// a tener foco (useFocusEffect de Expo Router).
// =====================================================================

import { useState, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getPrefectDashboard } from '../services/prefectService';

export const usePrefectDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const dataRef = useRef(data);
  dataRef.current = data;
  const inFlightRef = useRef(false);

  const refetch = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setIsLoading(true);
    setError(null);
    try {
      const result = await getPrefectDashboard();
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.message || 'No se pudo cargar el dashboard.');
      }
    } catch (err) {
      console.error('[usePrefectDashboard] unexpected error:', err);
      setError('Error inesperado al cargar el dashboard.');
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return { data, isLoading, error, refetch };
};
