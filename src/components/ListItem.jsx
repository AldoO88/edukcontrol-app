// =====================================================================
// ListItem.jsx
// ---------------------------------------------------------------------
// Fila de lista con icono izquierdo, contenido central, slot derecho.
// Pensado para "Mis hijos", "Clases de hoy", etc. en dashboards.
// Usa Card por debajo para heredar la sombra y el rounded.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text, TouchableOpacity.
import { View, Text, TouchableOpacity } from 'react-native';

// clsx.
import { clsx } from 'clsx';

// Componente base de tarjeta.
import Card from './Card';

// Props:
//   - icon: componente Lucide (e.g. Users, BookOpen).
//   - iconColor: color del icono (default slate-900).
//   - iconBgClass: clase Tailwind para el fondo del icono
//     (e.g. 'bg-sky-100', 'bg-emerald-100').
//   - title: string principal.
//   - subtitle: string opcional bajo el título.
//   - rightSlot: nodo a la derecha (e.g. ChevronRight, contador).
//   - onPress: callback. Si se pasa, la fila es tappable.
//   - showBorder: boolean. Si true (default en filas no-últimas),
//     dibuja un border-b entre filas.
//   - isLast: boolean. Si true, NO dibuja border-b.
//   - accessibilityLabel, accessibilityRole: a11y.
const ListItem = ({
  icon: Icon = null,
  iconColor = '#0284c7', // sky-600
  iconBgClass = 'bg-sky-100',
  title,
  subtitle = null,
  rightSlot = null,
  onPress = null,
  isLast = false,
  className = '',
  accessibilityLabel,
  accessibilityRole = 'button',
  ...rest
}) => {
  // Renderizamos el contenido interno (icono + texto + rightSlot).
  const content = (
    <View
      className={clsx(
        'flex-row items-center py-3',
        // border-b solo si no es la última fila.
        !isLast && 'border-b border-slate-100',
      )}
    >
      {/* Icono izquierdo con su fondo. */}
      {Icon && (
        <View className={clsx('p-2 rounded-lg mr-3', iconBgClass)}>
          <Icon size={20} color={iconColor} strokeWidth={2.25} />
        </View>
      )}

      {/* Textos. flex-1 para ocupar espacio y empujar rightSlot. */}
      <View className="flex-1">
        <Text className="text-slate-900 text-base font-semibold" numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-slate-500 text-xs mt-0.5" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Slot derecho. */}
      {rightSlot}
    </View>
  );

  // Si NO hay onPress, devolvemos un View dentro de un Card.
  // Card sin onPress ya devuelve un View, así que simplemente lo
  // envolvemos.
  if (!onPress) {
    return (
      <Card className={className} {...rest}>
        {content}
      </Card>
    );
  }

  // Si HAY onPress, devolvemos un Card tappable.
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole={accessibilityRole}
      className={className}
      {...rest}
    >
      {content}
    </Card>
  );
};

export default ListItem;
