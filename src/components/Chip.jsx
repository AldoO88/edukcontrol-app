// =====================================================================
// Chip.jsx
// ---------------------------------------------------------------------
// Chip seleccionable (estilo filtro). Encapsula el patrón repetido
// en AttendanceHistory, GradesUpload y SendMessage:
//   TouchableOpacity con clases condicionales active vs inactive.
//   Estado activo: bg-sky-500 + texto blanco.
//   Estado inactivo: bg-white + borde + texto slate-700.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: TouchableOpacity, Text.
import { TouchableOpacity, Text } from 'react-native';

// clsx.
import { clsx } from 'clsx';

// Props:
//   - label: string obligatorio con el texto del chip.
//   - selected: boolean. Si true, renderiza estilo "activo".
//   - onPress: callback al pulsar.
//   - icon: componente Lucide opcional que se muestra a la izquierda.
//   - className: clases extra.
//   - accessibilityLabel, accessibilityRole: a11y.
const Chip = ({
  label,
  selected = false,
  onPress,
  icon: Icon = null,
  className = '',
  accessibilityLabel,
  accessibilityRole = 'button',
  ...rest
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      // accessibilityState.selected para lectores de pantalla.
      accessibilityRole={accessibilityRole}
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel || label}
      className={clsx(
        // Base común.
        'px-4 py-2 rounded-full flex-row items-center mr-2',
        // Estado activo vs inactivo.
        selected
          ? 'bg-sky-500'
          : 'bg-white border border-slate-200',
        className,
      )}
      activeOpacity={0.7}
      {...rest}
    >
      {Icon && (
        <Icon
          size={14}
          color={selected ? '#ffffff' : '#0f172a'}
          strokeWidth={2.5}
        />
      )}
      <Text
        className={clsx(
          'text-xs',
          Icon ? 'ml-1.5' : '',
          selected ? 'text-white font-bold' : 'text-slate-700 font-semibold',
        )}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default Chip;
