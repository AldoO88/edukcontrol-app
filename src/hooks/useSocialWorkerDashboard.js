// =====================================================================
// useSocialWorkerDashboard.js
// ---------------------------------------------------------------------
// Hook que orquesta la carga de datos del dashboard del trabajador social.
// Estructura base de usePrefectDashboard + isRefreshing/refresh() para que
// el RefreshControl nativo SOLO se active con el pull-to-refresh real
// (nunca con el refetch programático al ganar foco — en iOS su spinner
// gris quedaba pegado entre la SchoolInfoCard y las acciones rápidas).
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

    // Refresh SILENCIOSO cuando ya hay datos (refetch al ganar foco).
    // NO se toca isRefreshing aquí: activar el RefreshControl nativo de
    // forma programática en iOS dejaba su spinner gris pegado para
    // siempre entre la SchoolInfoCard y las acciones rápidas. Con datos
    // viejos en pantalla el refresco ocurre en background sin spinner.
    // Solo el pull-to-refresh real (refresh()) activa el RefreshControl.
    if (!dataRef.current) {
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

  // refresh: SOLO para el gesto real de pull-to-refresh (onRefresh del
  // RefreshControl). Activa el spinner nativo, corre el mismo refetch y
  // lo apaga en finally — incluso si refetch hace early-return por
  // inFlightRef, este finally igual limpia el spinner.
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return { data, isLoading, isRefreshing, error, refetch, refresh };
};
