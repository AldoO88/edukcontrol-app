// =====================================================================
// StatCard.jsx
// ---------------------------------------------------------------------
// Tarjeta de KPI / estadística. Encapsula el patrón "label arriba
// + número grande abajo" usado en AttendanceCheck (KPIs de
// presentes/retardos/faltas) y GradesUpload (promedio).
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text.
import { View, Text } from 'react-native';

// clsx.
import { clsx } from 'clsx';

// Paleta: { bg, text, number }. sky, amber, emerald, rose, slate.
const VARIANT_CLASSES = {
  sky: { bg: 'bg-sky-50', label: 'text-sky-600', number: 'text-sky-700' },
  amber: { bg: 'bg-amber-50', label: 'text-amber-600', number: 'text-amber-700' },
  emerald: { bg: 'bg-emerald-50', label: 'text-emerald-600', number: 'text-emerald-700' },
  rose: { bg: 'bg-rose-50', label: 'text-rose-600', number: 'text-rose-700' },
  slate: { bg: 'bg-slate-50', label: 'text-slate-600', number: 'text-slate-700' },
};

// Props:
//   - label: string pequeño (e.g. "A TIEMPO").
//   - value: number o string grande (e.g. 12 o "8.4").
//   - variant: color.
//   - icon: componente Lucide opcional. Si se da, se muestra a la
//     derecha del número.
//   - layout: 'vertical' (default) | 'horizontal'.
//   - className: clases extra.
const StatCard = ({
  label,
  value,
  variant = 'slate',
  icon: Icon = null,
  iconBgClass = null,
  iconColor = null,
  layout = 'vertical',
  className = '',
}) => {
  const colors = VARIANT_CLASSES[variant] || VARIANT_CLASSES.slate;

  return (
    <View
      className={clsx(
        'rounded-xl p-3',
        colors.bg,
        layout === 'horizontal' ? 'flex-row items-center justify-between' : '',
        className,
      )}
    >
      <View className={layout === 'horizontal' ? 'flex-1' : ''}>
        <Text className={clsx('text-xs font-bold', colors.label)}>
          {label.toUpperCase()}
        </Text>
        <Text className={clsx('text-2xl font-bold mt-1', colors.number)}>
          {value}
        </Text>
      </View>
      {Icon && (
        <View className={clsx('p-3 rounded-2xl', iconBgClass || 'bg-white/60')}>
          <Icon size={32} color={iconColor || colors.number} strokeWidth={2.25} />
        </View>
      )}
    </View>
  );
};

export default StatCard;
