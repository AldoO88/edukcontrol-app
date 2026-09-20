// =====================================================================
// useSocialWorkerDashboard.js
// ---------------------------------------------------------------------
// Hook que orquesta la carga de datos del dashboard del trabajador social.
// Misma estructura que usePrefectDashboard.
// =====================================================================

import { useState, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getSocialWorkerDashboard } from '../services/socialWorkerService';

export const useSocialWorkerDashboard = () => {
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
      const result = await getSocialWorkerDashboard();
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.message || 'No se pudo cargar el dashboard.');
      }
    } catch (err) {
      console.error('[useSocialWorkerDashboard] unexpected error:', err);
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
