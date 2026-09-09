// =====================================================================
// useTeacherAnnouncements.js
// ---------------------------------------------------------------------
// Hook que carga el feed de "Avisos y Comunicados" del MAESTRO.
//
// Encapsula:
//   - Fetch inicial al montar y refetch al volver a foco.
//   - Filtros: tab ('mine' | 'general'), priority ("informative" |
//     "urgent" | null = ambos).
//   - Paginación: loadMore() para scroll infinito (concatena items).
//   - Loading state, error state, refetch manual.
//
// Filtros por tab (backed by GET /api/announcements/me):
//   - 'mine': solo avisos que el teacher publicó.
//   - 'general': solo avisos generales de la escuela.
//   - undefined: ambos combinados.
//
// Uso:
//
//   const {
//     items, isLoading, error, pagination,
//     setFilters, loadMore, refetch,
//   } = useTeacherAnnouncements();
//
//   // Cambiar a tab "Generales":
//   setFilters({ tab: 'general' });
//
//   // Cambiar filtros (resetea page y items):
//   setFilters({ priority: 'urgent' });
//
//   // Scroll infinito:
//   <FlatList onEndReached={loadMore} />
// =====================================================================

// React hooks.
import { useState, useRef, useCallback, useEffect } from 'react';

// useFocusEffect de expo-router.
import { useFocusEffect } from 'expo-router';

// Servicio.
import { getTeacherAnnouncements } from '../services/teacherService';

// Cantidad de items por página (default del backend: 20).
const PAGE_SIZE = 20;

export const useTeacherAnnouncements = () => {
  // -----------------------------------------------------------------
  // STATE
  // -----------------------------------------------------------------
  // items: array acumulado de avisos (crece con loadMore).
  // pagination: { page, totalPages, total } del último response.
  // isLoading: true durante fetch inicial.
  // isLoadingMore: true mientras loadMore está en vuelo (para mostrar
  //   spinner al final de la lista).
  // error: mensaje de error o null.
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
  const filtersRef = useRef({ tab: 'mine', priority: null });

  // itemsRef: espejo del array de items. Lo usamos para saber si
  //   es la primera carga (evitar spinner en refetches).
  const itemsRef = useRef([]);

  // inFlightRef: guard anti-concurrencia para fetch inicial / refetch.
  const inFlightRef = useRef(false);

  // loadMoreInFlightRef: guard separado para loadMore (puede
  //   solaparse con un refetch si el usuario scrollea rápido).
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
  // Solo muestra el spinner de loading en la carga inicial (items
  // vacíos). En refetches (volver de otra pantalla, pull-to-refresh)
  // mantiene los datos visibles para evitar parpadeos.
  // -----------------------------------------------------------------
  const fetchData = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    // Solo mostrar spinner si es la primera carga (sin items previos).
    const isInitialLoad = itemsRef.current.length === 0;
    if (isInitialLoad) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const filters = filtersRef.current;
      const result = await getTeacherAnnouncements({
        tab: filters.tab || undefined,
        priority: filters.tab === 'mine' ? (filters.priority || undefined) : undefined,
        page: 1,
        limit: PAGE_SIZE,
      });

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
      console.error('[useTeacherAnnouncements] unexpected error:', err);
      setError('Error inesperado al cargar los avisos.');
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  // -----------------------------------------------------------------
  // loadMore: siguiente página (scroll infinito).
  // -----------------------------------------------------------------
  const loadMore = useCallback(async () => {
    // No cargar si ya estamos en la última página o ya hay un load
    // // en vuelo o el fetch inicial aún no terminó.
    if (loadMoreInFlightRef.current) return;
    if (pagination.page >= pagination.totalPages) return;
    if (inFlightRef.current) return;

    loadMoreInFlightRef.current = true;
    setIsLoadingMore(true);

    try {
      const nextPage = pagination.page + 1;
      const filters = filtersRef.current;
      const result = await getTeacherAnnouncements({
        tab: filters.tab || undefined,
        priority: filters.tab === 'mine' ? (filters.priority || undefined) : undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      });

      if (result.success) {
        const payload = result.data || {};
        const newItems = Array.isArray(payload.items) ? payload.items : [];
        // Concatenar items (dedup por _id por si acaso).
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
      console.error('[useTeacherAnnouncements] loadMore error:', err);
    } finally {
      setIsLoadingMore(false);
      loadMoreInFlightRef.current = false;
    }
  }, [pagination.page, pagination.totalPages]);

  // -----------------------------------------------------------------
  // setFilters: actualiza filtros + resetea a página 1.
  // -----------------------------------------------------------------
  // Acepta un objeto parcial: { groupIds?, priority? }. Los campos
  // que no se pasan se mantienen con el valor anterior (merge).
  const setFilters = useCallback((newFilters) => {
    filtersRef.current = {
      ...filtersRef.current,
      ...newFilters,
    };
    // Reset: limpiamos items y volvemos a página 1.
    setItems([]);
    setPagination({ page: 1, totalPages: 1, total: 0 });
    setError(null);
    // fetchData es estable (deps []), no necesita estar en deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
