// =====================================================================
// useAnnouncementFilters.js
// ---------------------------------------------------------------------
// Hook compartido que maneja el estado de filtros de la pantalla de
// Avisos (tanto para teacher como para prefect).
//
// Encapsula:
//   - Segment tabs (activeSegment)
//   - Filtro de prioridad (selectedPriority)
//   - Rango de fechas (dateRangeId)
//   - Búsqueda client-side (searchText)
//   - Sincronización de filtros con el hook de datos (setFilters)
//   - Filtrado client-side de items por búsqueda
//
// Props:
//   - setFilters: función del hook de datos (useTeacherAnnouncements
//     o usePrefectAnnouncements) para sincronizar filtros al backend.
//   - segmentTabs: array de labels de los tabs (default: genérico).
//   - tabMapping: objeto { tabLabel → backendValue } (ej:
//     { 'Mis Publicaciones': 'mine', 'Generales': 'general' }).
//   - defaultDateRange: id del rango de fechas inicial (default: 'all').
//   - items: array de items del feed (para búsqueda client-side).
//   - searchFields: array de campos por los que buscar (default:
//     ['title', 'message', 'sender', 'targetGroups', 'targetStudents']).
// =====================================================================

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

// ---------------------------------------------------------------------
// CONSTANTS: date range options (compartido entre roles).
// ---------------------------------------------------------------------
const getStartOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const DATE_RANGE_OPTIONS = [
  { id: 'today',  label: 'Hoy',       from: () => getStartOfToday(), to: () => new Date() },
  { id: 'week',   label: 'Semana',    from: () => daysAgo(7),        to: () => new Date() },
  { id: '15days', label: '15 días',    from: () => daysAgo(15),       to: () => new Date() },
  { id: 'all',    label: 'Historial',  from: () => null,              to: () => null },
];

// ---------------------------------------------------------------------
// Hook principal
// ---------------------------------------------------------------------
export const useAnnouncementFilters = ({
  setFilters,
  segmentTabs = ['tab1', 'tab2'],
  tabMapping = {},
  defaultDateRange = 'all',
  items = [],
  searchIncludesTitle = true,
  searchIncludesMessage = true,
}) => {
  // -----------------------------------------------------------------
  // STATE DE FILTROS
  // -----------------------------------------------------------------
  const [activeSegment, setActiveSegment] = useState(segmentTabs[0]);
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [dateRangeId, setDateRangeId] = useState(defaultDateRange);
  const [searchText, setSearchText] = useState('');

  // -----------------------------------------------------------------
  // REFS para efectos de sincronización (evitar fetch en mount)
  // -----------------------------------------------------------------
  const isInitialDateMount = useRef(true);
  const isInitialPriorityMount = useRef(true);

  // -----------------------------------------------------------------
  // COMPUTED: active date range
  // -----------------------------------------------------------------
  const activeRange = useMemo(
    () => DATE_RANGE_OPTIONS.find((r) => r.id === dateRangeId),
    [dateRangeId],
  );

  // -----------------------------------------------------------------
  // CAMBIO DE TAB
  // -----------------------------------------------------------------
  const handleTabChange = useCallback((tab) => {
    setActiveSegment(tab);
    setSelectedPriority(null);
    setSearchText('');
    const backendTab = tabMapping[tab] || tab;
    setFilters({ tab: backendTab, priority: null });
  }, [setFilters, tabMapping]);

  // -----------------------------------------------------------------
  // TOGGLE PRIORIDAD
  // -----------------------------------------------------------------
  const togglePriorityFilter = useCallback((priority) => {
    setSelectedPriority((prev) => (prev === priority ? null : priority));
  }, []);

  // -----------------------------------------------------------------
  // SINCRONIZACIÓN: date range → setFilters
  // -----------------------------------------------------------------
  useEffect(() => {
    if (isInitialDateMount.current) {
      isInitialDateMount.current = false;
      return;
    }
    const from = activeRange?.from();
    const to = activeRange?.to();
    setFilters({
      from: from ? from.toISOString() : null,
      to: to ? to.toISOString() : null,
    });
  }, [dateRangeId, activeRange, setFilters]);

  // -----------------------------------------------------------------
  // SINCRONIZACIÓN: prioridad → setFilters
  // -----------------------------------------------------------------
  useEffect(() => {
    if (isInitialPriorityMount.current) {
      isInitialPriorityMount.current = false;
      return;
    }
    setFilters({ priority: selectedPriority });
  }, [selectedPriority, setFilters]);

  // -----------------------------------------------------------------
  // BÚSQUEDA CLIENT-SIDE
  // -----------------------------------------------------------------
  const filteredItems = useMemo(() => {
    if (!searchText.trim()) return items;
    const q = searchText.toLowerCase().trim();
    return items.filter((item) => {
      // Buscar en título.
      if (searchIncludesTitle && item.title?.toLowerCase().includes(q)) return true;
      // Buscar en mensaje.
      if (searchIncludesMessage && item.message?.toLowerCase().includes(q)) return true;
      // Buscar en nombre del remitente.
      const senderName = item.sender
        ? `${item.sender.last_name || ''} ${item.sender.name || ''}`.toLowerCase()
        : '';
      if (senderName.includes(q)) return true;
      // Buscar en grupos destino.
      const groupNames = (item.targetGroups || []).map(
        (g) => `${g.grade}${g.section}`.toLowerCase(),
      );
      if (groupNames.some((n) => n.includes(q))) return true;
      // Buscar en alumnos destino.
      const studentNames = (item.targetStudents || []).map(
        (s) => `${s.last_name || ''} ${s.first_name || ''}`.toLowerCase(),
      );
      if (studentNames.some((n) => n.includes(q))) return true;
      return false;
    });
  }, [items, searchText, searchIncludesTitle, searchIncludesMessage]);

  // -----------------------------------------------------------------
  // HELPERS
  // -----------------------------------------------------------------
  const hasSearch = searchText.trim().length > 0;

  const clearSearch = useCallback(() => setSearchText(''), []);

  // -----------------------------------------------------------------
  // RETURN
  // -----------------------------------------------------------------
  return {
    // State
    activeSegment,
    selectedPriority,
    dateRangeId,
    searchText,
    // Setters
    setActiveSegment,
    setSelectedPriority,
    setDateRangeId,
    setSearchText,
    // Handlers
    handleTabChange,
    togglePriorityFilter,
    clearSearch,
    // Computed
    activeRange,
    filteredItems,
    hasSearch,
  };
};
