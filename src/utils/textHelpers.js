// =====================================================================
// src/utils/textHelpers.js
// ---------------------------------------------------------------------
// Helpers de texto puros y reutilizables entre pantallas / componentes.
// Sin dependencias de React ni de RN — se pueden importar en cualquier
// contexto (componentes, hooks, tests, etc.).
// =====================================================================

// Iniciales para un avatar fallback (2 letras).
//   "Acosta Rodríguez, Mateo" → "AM"
//   "Mateo" → "MA"
export const getInitials = (name) => {
  const parts = String(name || '?').split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

// Convierte texto a número. Acepta coma o punto decimal. Devuelve 0
// si está vacío o no se puede parsear.
export const toNumber = (value) => {
  const n = parseFloat(String(value).replace(',', '.'));
  return isNaN(n) ? 0 : n;
};