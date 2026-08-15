// =====================================================================
// app/(guardian)/_components/AttendanceStatCard.jsx
// ---------------------------------------------------------------------
// Card pequeña de estadística (asistencias / faltas / retardos) que
// se muestra en la fila de 3 cards bajo el anillo de porcentaje en
// la pantalla "Asistencia".
//
// Shape:
//
//   ┌─────────────┐
//   │    168      │   ← número grande (color según tipo)
//   │ ASISTENCIAS │   ← label UPPERCASE tracking
//   └─────────────┘
//
// Props:
//   - value:     string con el valor (ej: "168", "2", "3").
//   - label:     string con la etiqueta (ej: "Asistencias").
//   - color:     clave del mapa STAT_COLORS para número + label
//               (sky | rose | amber).
//   - className: clases extra para el contenedor.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text.
import { View, Text } from 'react-native';

// clsx. librería para concatenar clases condicionalmente (como classnames).
import { clsx } from 'clsx';

// ---------------------------------------------------------------------
// STAT_COLORS
// ---------------------------------------------------------------------
// Mapa estático de colores por tipo de estadística. El número va
// en un color saturado y el label en una versión más clara del
// mismo color (mismo hue, diferente opacidad) para mantener
// coherencia visual.
// ---------------------------------------------------------------------
const STAT_COLORS = {
  sky:     { number: 'text-sky-500',     label: 'text-sky-600' },
  rose:    { number: 'text-rose-500',    label: 'text-rose-600' },
  amber:   { number: 'text-amber-500',   label: 'text-amber-600' },
  emerald: { number: 'text-emerald-500', label: 'text-emerald-600' },
};

const AttendanceStatCard = ({
  value,
  label,
  color = 'sky',
  className = '',
}) => {
  const colors = STAT_COLORS[color] || STAT_COLORS.sky;

  return (
    // bg-white: fondo blanco sobre el slate-50 de la pantalla.
    // rounded-2xl: bordes generosos (consistente con el resto).
    // shadow-sm + elevation 1: sombra sutil.
    // flex-1 por defecto: cuando el padre usa flex-row con
    //   gap-X, las 3 cards se reparten el ancho disponible
    //   equitativamente (1/3 del espacio menos los gaps). Esto
    //   hace que abarquen todo el ancho entre los tres, como
    //   pidió el usuario.
    <View
      className={clsx(
        'flex-1 bg-white rounded-2xl shadow-sm px-3 py-4 items-center',
        className,
      )}
      style={{ elevation: 1 }}
    >
      {/* Número grande: text-2xl bold con el color saturado. */}
      <Text className={clsx('text-2xl font-bold', colors.number)}>
        {value}
      </Text>
      {/* Label: UPPERCASE tracking-wide, un poco más claro que
          el número (labelClass) para jerarquía visual. */}
      <Text
        className={clsx(
          'text-[10px] font-bold uppercase tracking-wider mt-1 text-center',
          colors.label,
        )}
      >
        {label}
      </Text>
    </View>
  );
};

export default AttendanceStatCard;
