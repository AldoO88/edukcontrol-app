// =====================================================================
// Badge.jsx
// ---------------------------------------------------------------------
// Etiqueta pequeña de categoría. Variantes por color: sky, amber,
// emerald, rose, slate. Pensado para el badge de categoría de los
// anuncios, status labels, etc.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text.
import { View, Text } from 'react-native';

// clsx.
import { clsx } from 'clsx';

// Mapa de variantes -> { bg, text }. Centraliza la paleta.
const VARIANT_CLASSES = {
  sky: { bg: 'bg-sky-100', text: 'text-sky-700' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-700' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-700' },
};

// Props:
//   - label: string con el texto del badge.
//   - variant: 'sky' | 'amber' | 'emerald' | 'rose' | 'slate'.
//   - uppercase: si true (default), transforma a mayúsculas.
//   - className: clases extra.
const Badge = ({
  label,
  variant = 'slate',
  uppercase = true,
  className = '',
}) => {
  // Obtenemos las clases de la variante, con fallback a slate.
  const colors = VARIANT_CLASSES[variant] || VARIANT_CLASSES.slate;

  return (
    <View className={clsx('px-2 py-0.5 rounded self-start', colors.bg, className)}>
      <Text className={clsx('text-xs font-bold', colors.text)}>
        {uppercase ? label.toUpperCase() : label}
      </Text>
    </View>
  );
};

export default Badge;
