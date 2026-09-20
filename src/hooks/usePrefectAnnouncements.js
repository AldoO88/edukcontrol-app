// =====================================================================
// usePrefectAnnouncements.js
// ---------------------------------------------------------------------
// Hook que carga el feed de "Avisos y Comunicados" del PREFECTO.
//
// Encapsula:
//   - Fetch inicial al montar y refetch al volver a foco.
//   - Filtros: tab ('mine' | 'all'), priority, date range (from/to).
//   - Paginación: loadMore() para scroll infinito (concatena items).
//   - Loading state, error state, refetch manual.
//
// Filtros por tab (backed by GET /api/announcements):
//   - 'mine': solo avisos que el prefecto publicó (sender=user.id).
//   - 'all': todos los avisos de la escuela (sin filtro sender).
//
// Uso:
//
//   const {
//     items, isLoading, isLoadingMore, error, pagination,
//     setFilters, loadMore, refetch,
//   } = usePrefectAnnouncements();
//
//   // Cambiar a tab "Todos":
//   setFilters({ tab: 'all' });
//
//   // Cambiar filtros (resetea page y items):
//   setFilters({ priority: 'urgent', from: ..., to: ... });
// =====================================================================

// React hooks.
import { useState, useRef, useCallback, useEffect } from 'react';

// useFocusEffect de expo-router.
import { useFocusEffect } from 'expo-router';

// Servicio.
import { getAnnouncements } from '../services/prefectService';

// Cantidad de items por página (default del backend: 20).
const PAGE_SIZE = 20;

export const usePrefectAnnouncements = (userId) => {
  // -----------------------------------------------------------------
  // STATE
  // -----------------------------------------------------------------
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------
  // REFS (no causan re-renders)
  // -----------------------------------------------------------------
  // filtersRef: espejo de los filtros actuales. Leemos desde aquí
  //   dentro de fetchData/loadMore sin meter filtros en deps.
  const filtersRef = useRef({ tab: 'mine', priority: null, from: null, to: null });

  // itemsRef: espejo del array de items.
  const itemsRef = useRef([]);

  // inFlightRef: guard anti-concurrencia para fetch inicial / refetch.
  const inFlightRef = useRef(false);

  // loadMoreInFlightRef: guard separado para loadMore.
  const loadMoreInFlightRef = useRef(false);

  // -----------------------------------------------------------------
  // Sync itemsRef con items state
  // -----------------------------------------------------------------
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // -----------------------------------------------------------------
  // fetchData: carga la página 1 con los filtros actuales.
  // -----------------------------------------------------------------
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
      const params = {
        page: 1,
        limit: PAGE_SIZE,
      };

      // Filtro sender: solo en tab 'mine'.
      if (filters.tab === 'mine' && userId) {
        params.sender = userId;
      }

      // Filtro prioridad.
      if (filters.priority) {
        params.priority = filters.priority;
      }

      // Filtros de fecha.
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const result = await getAnnouncements(params);

      if (!result.success) {
        setError(result.message);
      } else {
        const payload = result.data || {};
        setItems(Array.isArray(payload.items) ? payload.items : []);
        setPagination({
          page: payload.page || 1,
          totalPages: payload.pages || payload.totalPages || 1,
          total: payload.total || 0,
        });
        setError(null);
      }
    } catch (err) {
      console.error('[usePrefectAnnouncements] unexpected error:', err);
      setError('Error inesperado al cargar los avisos.');
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, [userId]);

  // -----------------------------------------------------------------
  // loadMore: siguiente página (scroll infinito).
  // -----------------------------------------------------------------
  const loadMore = useCallback(async () => {
    if (loadMoreInFlightRef.current) return;
    if (pagination.page >= pagination.totalPages) return;
    if (inFlightRef.current) return;

    loadMoreInFlightRef.current = true;
    setIsLoadingMore(true);

    try {
      const nextPage = pagination.page + 1;
      const filters = filtersRef.current;
      const params = {
        page: nextPage,
        limit: PAGE_SIZE,
      };

      if (filters.tab === 'mine' && userId) {
        params.sender = userId;
      }
      if (filters.priority) params.priority = filters.priority;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const result = await getAnnouncements(params);

      if (result.success) {
        const payload = result.data || {};
        const newItems = Array.isArray(payload.items) ? payload.items : [];
        setItems((prev) => {
          const existingIds = new Set(prev.map((i) => i._id));
          const unique = newItems.filter((i) => !existingIds.has(i._id));
          return [...prev, ...unique];
        });
        setPagination({
          page: payload.page || nextPage,
          totalPages: payload.pages || payload.totalPages || 1,
          total: payload.total || 0,
        });
      }
    } catch (err) {
      console.error('[usePrefectAnnouncements] loadMore error:', err);
    } finally {
      setIsLoadingMore(false);
      loadMoreInFlightRef.current = false;
    }
  }, [pagination.page, pagination.totalPages, userId]);

  // -----------------------------------------------------------------
  // setFilters: actualiza filtros + resetea a página 1.
  // -----------------------------------------------------------------
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

  // -----------------------------------------------------------------
  // useFocusEffect: re-fetchea cuando la pantalla gana foco.
  // -----------------------------------------------------------------
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
