// =====================================================================
// useDirectorDashboard.js
// ---------------------------------------------------------------------
// Hook que orquesta la carga de datos del dashboard del director.
// Misma estructura que useSocialWorkerDashboard.
// =====================================================================

import { useState, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getDirectorDashboard } from '../services/directorService';

export const useDirectorDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const dataRef = useRef(data);
  dataRef.current = data;
  const inFlightRef = useRef(false);

  const refetch = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (dataRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const result = await getDirectorDashboard();
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.message || 'No se pudo cargar el dashboard.');
      }
    } catch (err) {
      console.error('[useDirectorDashboard] unexpected error:', err);
      setError('Error inesperado al cargar el dashboard.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      inFlightRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return { data, isLoading, isRefreshing, error, refetch };
};
