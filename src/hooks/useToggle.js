// =====================================================================
// useToggle.js
// ---------------------------------------------------------------------
// Hook genérico para manejar estado booleano con función toggle.
// Reemplaza el patrón useState(false) + setX(!x) en componentes que
// necesitan alternar visibilidad, modales, switches, etc.
// =====================================================================

// useCallback se usa para memoizar la función toggle y evitar
// renders innecesarios en consumidores que dependen de su identidad.
import { useState, useCallback } from 'react';

// El hook recibe un valor inicial opcional (default: false) y
// devuelve una tupla [value, toggle, setValue].
//   - value: estado booleano actual.
//   - toggle(): invierte el estado.
//   - setValue(v): setter directo (útil para forzar un valor concreto).
export const useToggle = (initialValue = false) => {
  // useState con el valor inicial. Pasamos la función directamente,
  // NO una función lazy, porque initialValue ya es un primitivo.
  const [value, setValue] = useState(initialValue);

  // toggle: alterna entre true y false. useCallback garantiza
  // identidad estable entre renders para evitar romper el memo de
  // hijos que reciban esta función como prop.
  const toggle = useCallback(() => {
    // Usamos la forma funcional de setState para basarnos en el
    // valor previo y evitar closures desactualizadas.
    setValue((prev) => !prev);
  }, []);

  // Devolvemos la tupla. setValue se expone "as-is" para permitir
  // casos de uso donde necesitamos forzar true/false explícitamente.
  return [value, toggle, setValue];
};
