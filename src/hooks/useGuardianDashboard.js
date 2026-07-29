// =====================================================================
// useGuardianDashboard.js
// ---------------------------------------------------------------------
// Hook que orquesta la carga de datos del dashboard del guardian.
// Encapsula: fetch inicial, loading state, error state, y refetch
// cuando la pantalla vuelve a tener foco (useFocusEffect de
// Expo Router).
//
// =====================================================================
// FIX DE LOOP INFINITO (turno anterior)
// ---------------------------------------------------------------------
// La versión anterior tenía `refetch` con `[data]` en su useCallback
// dep array. Esto causaba un loop infinito:
//   1. refetch setea data
//   2. data cambia → useCallback recrea refetch (nueva referencia)
//   3. useFocusEffect detecta que su callback cambió → re-dispara
//   4. refetch se llama de nuevo → setea data → goto 1
//
// El fix: usar un useRef para el "data actual" (lectura sin
// suscripción a cambios), y dejar el useCallback del refetch con
// deps vacías. Así refetch es estable entre renders y useFocusEffect
// solo lo re-ejecuta en eventos de focus (no en cada cambio de state).
// =====================================================================

// React hooks.
import { useState, useEffect, useRef, useCallback } from 'react';

// useFocusEffect de expo-router: corre el callback cada vez que
// la pantalla gana foco (incluye el initial mount).
import { useFocusEffect } from 'expo-router';

// Servicio de guardian.
import { getGuardianDashboard } from '../services/guardianService';

export const useGuardianDashboard = () => {
  // data: el payload completo del backend (school + children + subtitle).
  // null mientras no se ha cargado la primera vez.
  const [data, setData] = useState(null);
  // isLoading: true durante el fetch inicial y durante refetches.
  // false cuando hay datos (o un error terminal).
  const [isLoading, setIsLoading] = useState(true);
  // error: mensaje de error si la carga falló. null si todo OK.
  const [error, setError] = useState(null);

  // ---------------------------------------------------------------------
  // Refs (NO causan re-renders, solo almacenan valores)
  // ---------------------------------------------------------------------

  // dataRef: espejo de `data` accesible dentro de callbacks sin
  // causar re-renders. Lo usamos en refetch para chequear "ya había
  // data previa?" sin meter `data` en las deps del useCallback.
  const dataRef = useRef(data);
  // Esta línea corre en cada render y mantiene el ref sincronizado
  // con el state. NO es un side-effect problemático: useRef solo
  // guarda la referencia, no dispara re-renders.
  dataRef.current = data;

  // inFlightRef: guard anti-concurrencia. Si refetch se llama dos
  // veces seguidas (ej. por React 18 strict mode en dev, o por un
  // focus rápido), solo la primera corre. Las demás se ignoran
  // silenciosamente. Esto evita race conditions donde dos fetches
  // compiten por escribir `data` y `error`.
  const inFlightRef = useRef(false);

  // ---------------------------------------------------------------------
  // refetch: estable entre renders (deps vacías). Lee dataRef.current
  // para saber si había data previa. Esta función es la ÚNICA vía
  // para recargar datos (externa o internamente).
  // ---------------------------------------------------------------------
  const refetch = useCallback(async () => {
    // Guard anti-concurrencia: si ya hay un fetch en curso, no
    // iniciar otro. Esto es importante porque useFocusEffect puede
    // dispararse múltiples veces seguidas (React 18 strict mode
    // duplica los effects en dev, y un usuario podría tab-back
    // rápidamente entre pantallas).
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setIsLoading(true);
    setError(null);
    try {
      const result = await getGuardianDashboard();
      if (!result.success) {
        setError(result.message);
        // NO limpiamos data en un refetch: queremos mostrar los
        // datos viejos + el banner de error arriba, en vez de
        // un flash a estado vacío. Usamos dataRef.current (no
        // `data`) para evitar meter `data` en las deps del useCallback
        // (eso era el bug del loop).
        if (dataRef.current === null) {
          setData(null);
        }
      } else {
        setData(result.data);
        setError(null);
      }
    } catch (err) {
      // Catch defensivo: el service ya captura errores, pero por
      // si acaso (e.g. el backend responde algo que rompe JSON.parse
      // en axios), caemos aquí.
      console.error('[useGuardianDashboard] unexpected error:', err);
      setError('Error inesperado al cargar el dashboard.');
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, []); // <-- DEPS VACÍAS. Esto es clave para que useFocusEffect
          //     no re-dispare cuando refetch se recrea por cambios
          //     de state.

  // useFocusEffect: corre el callback cada vez que la pantalla
  // gana foco. En el initial mount también corre (es el comportamiento
  // de useFocusEffect). Como refetch es estable (deps []), el callback
  // que pasamos a useFocusEffect es siempre la misma referencia, así
  // que useFocusEffect solo re-ejecuta el effect en eventos de focus
  // (no en cada render).
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // Devolvemos también una función `refetch` manual por si la UI
  // quiere agregar un pull-to-refresh o un botón "Reintentar".
  return { data, isLoading, error, refetch };
};
