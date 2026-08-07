// =====================================================================
// useAnnouncements.js
// ---------------------------------------------------------------------
// Hook que carga el feed de "Avisos" del tutor (anuncios + citatorios
// mezclados en un único feed ordenado por eventDate DESC).
//
// Encapsula:
//   - Fetch inicial al montar y al cambiar el filtro de estudiante.
//   - Loading state (inicial y refetches).
//   - Error state mapeado a mensaje en español (lo hace el service).
//   - Re-fetch al volver a foco (useFocusEffect de Expo Router).
//   - Refetch manual (pull-to-refresh / botón Reintentar).
//
// Sigue el mismo patrón que useGuardianDashboard y useStudentConduct:
//   - dataRef / studentIdRef para evitar meter state en deps de
//     useCallback (eso causaba loop infinito en versiones anteriores).
//   - inFlightRef como guard anti-concurrencia (evita race conditions
//     entre focus rápido + cambio de filtro + React 18 strict mode).
//
// Uso:
//
//   const { items, total, truncated, isLoading, error, refetch } =
//     useAnnouncements(studentId);  // studentId = null para "Todos"
// =====================================================================

// React hooks.
import { useState, useRef, useCallback, useEffect } from 'react';

// useFocusEffect de expo-router: corre el callback cada vez que la
// pantalla gana foco (incluye initial mount).
import { useFocusEffect } from 'expo-router';

// Servicio de avisos.
import { getAnnouncements } from '../services/announcementsService';

export const useAnnouncements = (studentId = null) => {
  // -----------------------------------------------------------------
  // STATE
  // -----------------------------------------------------------------
  // items: array de items del feed (anuncios + citatorios ya mezclados
  //   y ordenados por el backend). [] mientras no se ha cargado.
  // total: total ANTES de truncar por `limit` (para mostrar el
  //   contador "Mostrando X de Y" si truncated === true).
  // truncated: true si el feed se cortó por el limit del backend.
  // isLoading: true durante fetch inicial y refetches.
  // error: mensaje de error si la carga falló. null si todo OK.
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------
  // REFS (no causan re-renders)
  // -----------------------------------------------------------------
  // studentIdRef: espejo del studentId actual. Lo usamos dentro de
  // fetchData para saber qué studentId estamos cargando sin meterlo
  // en las deps del useCallback (eso era la causa del loop infinito
  // en useGuardianDashboard).
  const studentIdRef = useRef(studentId);
  studentIdRef.current = studentId;

  // inFlightRef: guard anti-concurrencia. Si refetch se llama dos
  // veces seguidas (ej. focus rápido, cambio de filtro mientras
  // carga, o React 18 strict mode duplicando effects en dev), solo
  // la primera corre. Las demás se ignoran silenciosamente. Esto
  // evita race conditions donde dos fetches compiten por escribir
  // `items` y `error`.
  const inFlightRef = useRef(false);

  // -----------------------------------------------------------------
  // fetchData: función estable (deps vacías) que llama al service.
  // Es la ÚNICA vía para cargar/recargar datos (interna o externa).
  // -----------------------------------------------------------------
  const fetchData = useCallback(async () => {
    // Guard anti-concurrencia.
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setIsLoading(true);
    setError(null);
    try {
      // El service se encarga de omitir student_id cuando es null/
      // undefined (URL limpia). Leemos el ref (no el state) para
      // mantener fetchData con deps vacías.
      const result = await getAnnouncements({
        studentId: studentIdRef.current || undefined,
      });

      if (!result.success) {
        setError(result.message);
        // NO limpiamos items en un refetch: queremos mostrar los
        // datos viejos + el banner de error, en vez de un flash a
        // estado vacío. Si NO había data previa, tampoco vaciamos
        // (el caller distingue "sin items" con `items.length === 0`).
      } else {
        const payload = result.data || {};
        setItems(Array.isArray(payload.items) ? payload.items : []);
        setTotal(typeof payload.total === 'number' ? payload.total : 0);
        setTruncated(!!payload.truncated);
        setError(null);
      }
    } catch (err) {
      // Catch defensivo: el service ya captura errores, pero por
      // si acaso (e.g. JSON.parse falla en axios), caemos aquí.
      console.error('[useAnnouncements] unexpected error:', err);
      setError('Error inesperado al cargar los avisos.');
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, []); // DEPS VACÍAS — clave para evitar loops con useFocusEffect.

  // -----------------------------------------------------------------
  // EFECTO: cuando cambia el studentId, reseteamos y refetchamos.
  // -----------------------------------------------------------------
  // Sin este useEffect, el primer mount dependería SOLO de
  // useFocusEffect, que en algunas versiones de Expo Router no
  // corre hasta que la pantalla realmente gana foco (puede no
  // dispararse en el initial mount si la pantalla ya está en
  // foco). Este useEffect garantiza el fetch inicial Y el reset
  // al cambiar de filtro (evita "flash" del feed del hijo previo
  // mientras carga el nuevo).
  useEffect(() => {
    // Reset al cambiar de filtro: limpiamos items para que la UI
    // muestre skeletons en vez de datos del filtro anterior.
    setItems([]);
    setTotal(0);
    setTruncated(false);
    setError(null);
    fetchData();
    // fetchData es estable (deps []), no necesita estar aquí.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // -----------------------------------------------------------------
  // useFocusEffect: re-fetchea cuando la pantalla gana foco.
  // -----------------------------------------------------------------
  // Útil para cuando el usuario vuelve de otra pestaña y el feed
  // podría haber cambiado (nuevo aviso, citatorio confirmado, etc.).
  // Como fetchData es estable (deps []), el callback que pasamos
  // a useFocusEffect es siempre la misma referencia → no re-dispara
  // en cada render.
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  return {
    items,
    total,
    truncated,
    isLoading,
    error,
    refetch: fetchData,
  };
};
