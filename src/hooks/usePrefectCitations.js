// =====================================================================
// usePrefectCitations.js
// ---------------------------------------------------------------------
// Hook que carga el feed de citatorios del PREFECTO.
//
// Mismo patrón que useTeacherCitations pero usando prefectService
// (GET /api/citations — endpoint admin que ve todos los citatorios).
//
// Encapsula:
//   - Fetch inicial al montar y refetch al volver a foco.
//   - Filtros: status, type.
//   - Paginación: loadMore() para scroll infinito (concatena items).
//   - Loading state, error state, refetch manual.
//
// Uso:
//
//   const {
//     items, isLoading, isLoadingMore, error, pagination,
//     setFilters, loadMore, refetch,
//   } = usePrefectCitations();
// =====================================================================

// React hooks.
import { useState, useRef, useCallback, useEffect } from 'react';

// useFocusEffect de expo-router.
import { useFocusEffect } from 'expo-router';

// Servicio del prefecto.
import { getCitations } from '../services/prefectService';

// Normalizador del shape del API → shape de UI.
import { normalizeCitation } from '../utils/citationHelpers';

const PAGE_SIZE = 20;

export const usePrefectCitations = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const filtersRef = useRef({ status: null, type: null });
  const itemsRef = useRef([]);
  const inFlightRef = useRef(false);
  const loadMoreInFlightRef = useRef(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const fetchData = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const isInitialLoad = itemsRef.current.length === 0;
    if (isInitialLoad) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const filters = filtersRef.current;
      const result = await getCitations({
        status: filters.status || undefined,
        type: filters.type || undefined,
        page: 1,
        limit: PAGE_SIZE,
      });

      if (!result.success) {
        setError(result.message);
      } else {
        const payload = result.data || {};
        const rawItems = Array.isArray(payload.items) ? payload.items : [];
        setItems(rawItems.map(normalizeCitation));
        setPagination({
          page: payload.page || 1,
          totalPages: payload.pages || payload.totalPages || 1,
          total: payload.total || 0,
        });
        setError(null);
      }
    } catch (err) {
      console.error('[usePrefectCitations] unexpected error:', err);
      setError('Error inesperado al cargar los citatorios.');
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadMoreInFlightRef.current) return;
    if (pagination.page >= pagination.totalPages) return;
    if (inFlightRef.current) return;

    loadMoreInFlightRef.current = true;
    setIsLoadingMore(true);

    try {
      const nextPage = pagination.page + 1;
      const filters = filtersRef.current;
      const result = await getCitations({
        status: filters.status || undefined,
        type: filters.type || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      });

      if (result.success) {
        const payload = result.data || {};
        const newRawItems = Array.isArray(payload.items) ? payload.items : [];
        const newItems = newRawItems.map(normalizeCitation);
        setItems((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const unique = newItems.filter((i) => !existingIds.has(i.id));
          return [...prev, ...unique];
        });
        setPagination({
          page: payload.page || nextPage,
          totalPages: payload.pages || payload.totalPages || 1,
          total: payload.total || 0,
        });
      }
    } catch (err) {
      console.error('[usePrefectCitations] loadMore error:', err);
    } finally {
      setIsLoadingMore(false);
      loadMoreInFlightRef.current = false;
    }
  }, [pagination.page, pagination.totalPages]);

  const setFilters = useCallback((newFilters) => {
    filtersRef.current = {
      ...filtersRef.current,
      ...newFilters,
    };
    setItems([]);
    setPagination({ page: 1, totalPages: 1, total: 0 });
    setError(null);
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  return {
    items,
    isLoading,
    isLoadingMore,
    error,
    pagination,
    setFilters,
    loadMore,
    refetch: fetchData,
  };
};
