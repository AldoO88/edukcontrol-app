// =====================================================================
// useCitationFilters.js
// ---------------------------------------------------------------------
// Hook compartido que maneja el estado de filtros de la pantalla de
// Citatorios (tanto para teacher como para prefect).
//
// Encapsula:
//   - Segment tabs (activeTab)
//   - Búsqueda client-side (searchText)
//   - Filtrado derivado de items por tab + búsqueda
//
// Props:
//   - items: array de citatorios normalizados (del hook de datos).
//   - userId: string — ID del usuario actual (para tab "Mis Citatorios").
//   - segmentTabs: array de labels de los tabs (default genérico).
//   - tabMapping: objeto { tabLabel → filterFn } (mapea tab → filtro).
// =====================================================================

import { useState, useCallback, useMemo } from 'react';

// ---------------------------------------------------------------------
// Hook principal
// ---------------------------------------------------------------------
export const useCitationFilters = ({
  items = [],
  userId = null,
  segmentTabs = ['Todos', 'Próximos', 'Historial', 'Cancelados'],
  isProximo,
}) => {
  // -----------------------------------------------------------------
  // STATE DE FILTROS
  // -----------------------------------------------------------------
  const [activeTab, setActiveTab] = useState(segmentTabs[0]);
  const [searchText, setSearchText] = useState('');

  // -----------------------------------------------------------------
  // FILTRO POR TAB
  // -----------------------------------------------------------------
  const tabFilteredItems = useMemo(() => {
    switch (activeTab) {
      case 'Mis Citatorios':
        return items.filter((c) => c.creatorId === userId);
      case 'Próximos':
        return items.filter((c) => isProximo(c.status));
      case 'Historial':
        return items.filter((c) => c.status === 'completed');
      case 'Cancelados':
        return items.filter((c) => c.status === 'cancelled');
      case 'Todos':
      default:
        return items;
    }
  }, [items, activeTab, userId, isProximo]);

  // -----------------------------------------------------------------
  // BÚSQUEDA CLIENT-SIDE
  // -----------------------------------------------------------------
  const filteredItems = useMemo(() => {
    const term = searchText.toLowerCase().trim();
    if (!term) return tabFilteredItems;
    return tabFilteredItems.filter((c) =>
      String(c.studentName || '').toLowerCase().includes(term) ||
      String(c.groupName || '').toLowerCase().includes(term) ||
      String(c.subject || '').toLowerCase().includes(term) ||
      String(c.creatorName || '').toLowerCase().includes(term)
    );
  }, [tabFilteredItems, searchText]);

  // -----------------------------------------------------------------
  // CAMBIO DE TAB
  // -----------------------------------------------------------------
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setSearchText('');
  }, []);

  // -----------------------------------------------------------------
  // HELPERS
  // -----------------------------------------------------------------
  const hasSearch = searchText.trim().length > 0;
  const clearSearch = useCallback(() => setSearchText(''), []);

  // -----------------------------------------------------------------
  // RETURN
  // -----------------------------------------------------------------
  return {
    activeTab,
    searchText,
    setSearchText,
    handleTabChange,
    filteredItems,
    hasSearch,
    clearSearch,
  };
};
