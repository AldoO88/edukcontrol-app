// =====================================================================
// useTeacherDashboard.js
// ---------------------------------------------------------------------
// Hook que orquesta la carga de datos del dashboard del teacher.
// Misma estructura que useGuardianDashboard: fetch inicial,
// loading state, error state, y refetch cuando la pantalla vuelve
// a tener foco (useFocusEffect de Expo Router).
// =====================================================================

// React hooks.
import { useState, useRef, useCallback } from 'react';

// useFocusEffect de expo-router: corre el callback cada vez que
// la pantalla gana foco (incluye el initial mount).
import { useFocusEffect } from 'expo-router';

// Servicio de teacher.
import { getTeacherDashboard } from '../services/teacherService';

export const useTeacherDashboard = () => {
  // data: el payload completo del backend (school + classes).
  // null mientras no se ha cargado la primera vez.
  const [data, setData] = useState(null);
  // isLoading: true durante el fetch inicial y durante refetches.
  const [isLoading, setIsLoading] = useState(true);
  // error: mensaje de error si la carga falló. null si todo OK.
  const [error, setError] = useState(null);

  // Refs para evitar loops y concurrencia (mismo patrón que
  // useGuardianDashboard).
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
      const result = await getTeacherDashboard();
      if (!result.success) {
        setError(result.message);
        if (dataRef.current === null) {
          setData(null);
        }
      } else {
        setData(result.data);
        setError(null);
      }
    } catch (err) {
      console.error('[useTeacherDashboard] unexpected error:', err);
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
