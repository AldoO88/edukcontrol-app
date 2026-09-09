// =====================================================================
// useTeacherCitations.js
// ---------------------------------------------------------------------
// Hook que carga el feed de "Citatorios y Citas" del MAESTRO.
//
// Encapsula:
//   - Fetch inicial al montar y refetch al volver a foco.
//   - Filtros: status, type.
//   - Paginación: loadMore() para scroll infinito (concatena items).
//   - Loading state, error state, refetch manual.
//
// Filtros (backed by GET /api/citations/me):
//   - status: 'pending' | 'confirmed' | 'completed' | 'no_show' | null
//   - type: 'academic' | 'behavioral' | 'administrative' | null
//
// Los items del response se normalizan con normalizeCitation() para
// que los componentes de UI (CitatorioCard, detail screen) consuman
// el mismo shape que usaban con MOCK_CITATORIOS.
//
// Uso:
//
//   const {
//     items, isLoading, isLoadingMore, error, pagination,
//     setFilters, loadMore, refetch,
//   } = useTeacherCitations();
//
//   // Cambiar a tab "Confirmados":
//   setFilters({ status: 'confirmed' });
//
//   // Scroll infinito:
//   <FlatList onEndReached={loadMore} />
// =====================================================================

// React hooks.
import { useState, useRef, useCallback, useEffect } from 'react';

// useFocusEffect de expo-router.
import { useFocusEffect } from 'expo-router';

// Servicio.
import { getTeacherCitations } from '../services/teacherService';

// Normalizador del shape del API → shape de UI.
import { normalizeCitation } from '../utils/citationHelpers';

// Cantidad de items por página (default del backend: 20).
const PAGE_SIZE = 20;

export const useTeacherCitations = () => {
  // -----------------------------------------------------------------
  // STATE
  // -----------------------------------------------------------------
  // items: array acumulado de citatorios (crece con loadMore), ya
  //   normalizados con normalizeCitation().
  // pagination: { page, totalPages, total } del último response.
  // isLoading: true durante fetch inicial.
  // isLoadingMore: true mientras loadMore está en vuelo.
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
  const filtersRef = useRef({ status: null, type: null });

  // itemsRef: espejo del array de items. Lo usamos para saber si
  //   es la primera carga (evitar spinner en refetches).
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
  // Solo muestra el spinner de loading en la carga inicial (items
  // vacíos). En refetches mantiene los datos visibles.
  // -----------------------------------------------------------------
  const fetchData = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    // Solo mostrar spinner si es la primera carga.
    const isInitialLoad = itemsRef.current.length === 0;
    if (isInitialLoad) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const filters = filtersRef.current;
      const result = await getTeacherCitations({
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
      console.error('[useTeacherCitations] unexpected error:', err);
      setError('Error inesperado al cargar los citatorios.');
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, []);

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
      const result = await getTeacherCitations({
        status: filters.status || undefined,
        type: filters.type || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      });

      if (result.success) {
        const payload = result.data || {};
        const newRawItems = Array.isArray(payload.items) ? payload.items : [];
        const newItems = newRawItems.map(normalizeCitation);
        // Concatenar items (dedup por id).
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
      console.error('[useTeacherCitations] loadMore error:', err);
    } finally {
      setIsLoadingMore(false);
      loadMoreInFlightRef.current = false;
    }
  }, [pagination.page, pagination.totalPages]);

  // -----------------------------------------------------------------
  // setFilters: actualiza filtros + resetea a página 1.
  // -----------------------------------------------------------------
  // Acepta un objeto parcial: { status?, type? }. Los campos
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
