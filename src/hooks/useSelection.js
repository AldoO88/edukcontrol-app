// =====================================================================
// useSelection.js
// ---------------------------------------------------------------------
// Hook para manejar selección múltiple basada en Set. Útil para
// listas de destinatarios, checkboxes, multi-select de alumnos, etc.
// Provee toggle, selectAll, clearAll, isSelected y count.
// =====================================================================

// useState, useCallback, useMemo. useMemo para derivar props
// computados (count, array) que consumen los hijos.
import { useState, useCallback, useMemo } from 'react';

// El hook acepta:
//   - initialIds: array opcional de ids preseleccionados al montar.
//   - allIds: array con TODOS los ids válidos. Si se pasa, se
//     habilitan los helpers selectAll/clearAll.
// Devuelve:
//   - selected: Set<id> con los ids seleccionados.
//   - toggle(id): alterna la presencia de un id.
//   - selectAll(): marca todos los allIds.
//   - clearAll(): vacía la selección.
//   - isSelected(id): boolean.
//   - count: número de seleccionados.
//   - asArray: array (orden estable) de ids seleccionados.
export const useSelection = (initialIds = [], allIds = []) => {
  // Estado: Set con los ids seleccionados. Usamos Set (no array)
  // porque las operaciones de add/delete/has son O(1).
  const [selected, setSelected] = useState(() => new Set(initialIds));

  // toggle: alterna la presencia de un id.
  const toggle = useCallback((id) => {
    // Forma funcional para evitar race conditions.
    setSelected((prev) => {
      // Clonamos el Set para no mutar el estado (regla de inmutabilidad).
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // selectAll: añade todos los allIds a la selección. Si ya están
  // todos marcados, vacía la selección (comportamiento "toggle all"
  // común en apps modernas).
  const selectAll = useCallback(() => {
    setSelected((prev) => {
      // Comprobamos si YA están todos seleccionados.
      const allSelected = allIds.length > 0 && allIds.every((id) => prev.has(id));
      if (allSelected) {
        // Si ya están todos, vaciamos.
        return new Set();
      }
      // Si no, añadimos todos.
      return new Set(allIds);
    });
  }, [allIds]);

  // clearAll: vacía la selección sin tocar la lógica "toggle all".
  const clearAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  // isSelected: helper para consultar la selección. La definición
  // como función evita que los consumidores tengan que hacer
  // selected.has(id) en cada render.
  const isSelected = useCallback((id) => selected.has(id), [selected]);

  // count: número de seleccionados. useMemo para no recalcular en
  // cada render si el Set no cambia.
  const count = useMemo(() => selected.size, [selected]);

  // asArray: array de ids seleccionados (útil para enviar al backend
  // con JSON.stringify, que no soporta Set nativamente).
  const asArray = useMemo(() => Array.from(selected), [selected]);

  return {
    selected,
    toggle,
    selectAll,
    clearAll,
    isSelected,
    count,
    asArray,
  };
};
