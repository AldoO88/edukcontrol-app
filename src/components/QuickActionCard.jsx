// =====================================================================
// QuickActionCard.jsx
// ---------------------------------------------------------------------
// Tarjeta de acceso rápido para dashboards. Reemplaza el patrón
// duplicado en GuardianDashboard y TeacherDashboard:
//   <View bg-white rounded-2xl p-4> con icono + título + subtítulo.
// Puede ser "compact" (mitad de fila) o "wide" (fila completa).
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text, TouchableOpacity.
import { View, Text, TouchableOpacity } from 'react-native';

// clsx.
import { clsx } from 'clsx';

// Mapa de colores de fondo para el icono según variant.
const ICON_BG = {
  sky: 'bg-sky-100',
  amber: 'bg-amber-100',
  emerald: 'bg-emerald-100',
  rose: 'bg-rose-100',
  slate: 'bg-slate-100',
};

// Mapa de colores del icono.
const ICON_COLOR = {
  sky: '#0284c7',
  amber: '#d97706',
  emerald: '#059669',
  rose: '#dc2626',
  slate: '#475569',
};

// Props:
//   - icon: componente Lucide.
//   - title: string principal.
//   - subtitle: string opcional.
//   - onPress: callback.
//   - variant: 'sky' | 'amber' | 'emerald' | 'rose' | 'slate'.
//   - layout: 'compact' (default, 1/2 fila) | 'wide' (fila completa).
//   - rightSlot: opcional (e.g. ChevronRight).
const QuickActionCard = ({
  icon: Icon,
  title,
  subtitle = null,
  onPress,
  variant = 'sky',
  layout = 'compact',
  rightSlot = null,
  accessibilityLabel,
  className = '',
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      // flex-1 en compact para que ocupe mitad, w-full en wide.
      className={clsx(
        'bg-white rounded-2xl p-4',
        layout === 'compact' ? 'flex-1' : 'w-full',
        layout === 'wide' && 'flex-row items-center',
        className,
      )}
      // Sombra equivalente a Card estándar.
      style={{
        elevation: 2,
        shadowColor: '#0f172a',
        shadowOpacity: 0.06,
        shadowRadius: 6,
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      activeOpacity={0.7}
    >
      {/* Icono. En wide va a la izquierda, en compact arriba. */}
      <View
        className={clsx(
          'p-2 rounded-lg',
          layout === 'wide' ? 'mr-3' : 'self-start mb-3',
          ICON_BG[variant],
        )}
      >
        <Icon
          size={20}
          color={ICON_COLOR[variant]}
          strokeWidth={2.25}
        />
      </View>

      {/* Textos. En wide, flex-1 para ocupar el espacio. */}
      <View className={layout === 'wide' ? 'flex-1' : ''}>
        <Text className="text-slate-900 text-sm font-bold" numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text
            className={clsx(
              'text-slate-500 text-xs mt-0.5',
              layout === 'wide' ? 'mt-0.5' : 'mt-1',
            )}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Slot derecho (e.g. ChevronRight en wide). */}
      {rightSlot && layout === 'wide' && rightSlot}
    </TouchableOpacity>
  );
};

export default QuickActionCard;
