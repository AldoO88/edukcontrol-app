// =====================================================================
// app/(guardian)/_components/RecentAbsenceCard.jsx
// ---------------------------------------------------------------------
// Card de una inasistencia reciente (falta justificada o
// injustificada) en la pantalla "Asistencia". Muestra:
//   - Badge de fecha (mes + día) a la izquierda
//   - Tipo de falta (Falta Injustificada / Falta Justificada)
//   - Descripción corta
//   - Icono de estado a la derecha (chevron para injustificada,
//     check para justificada)
//
// Shape:
//
//   ┌──────┬─────────────────────────────────────────┐
//   │ OCT  │  Falta Injustificada                   │ →
//   │  14  │  Sin reporte médico entregado.         │
//   └──────┴─────────────────────────────────────────┘
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text, Pressable.
import { View, Text, Pressable } from 'react-native';

// Iconos Lucide.
import { ChevronRight, Check } from 'lucide-react-native';

// clsx.
import { clsx } from 'clsx';

// ---------------------------------------------------------------------
// RecentAbsenceCard
// ---------------------------------------------------------------------
// Props:
//   - absence: {
//       id,
//       month: string (3 letras mayúsculas: "OCT", "SEP", ...),
//       day:   number (1-31),
//       type:  'injustificada' | 'justificada',
//       title: string (ej: "Falta Injustificada"),
//       description: string,
//     }
//   - onPress: callback al tocar la card.
// =====================================================================
const RecentAbsenceCard = ({ absence, onPress }) => {
  const { month, day, type, title, description } = absence || {};

  // El icono y color del badge derecho dependen del tipo.
  // injustificada: chevron a la derecha (sigue pendiente acción).
  // justificada: check verde (ya resuelta, sin acción).
  const isJustificada = type === 'justificada';
  const actionColor = isJustificada
    ? { bg: 'bg-emerald-50', icon: Check, iconColor: '#10b981' }
    : { bg: '', icon: ChevronRight, iconColor: '#94a3b8' };

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl shadow-sm mb-3 flex-row items-center px-4 py-3"
      style={{ elevation: 1 }}
      accessibilityRole="button"
      accessibilityLabel={`${title} del ${day} de ${month}. ${description}`}
    >
      {/* Badge de fecha (izquierda). w-14 h-14 para que el día
          y mes se vean cómodos. rounded-2xl para look "stamp". */}
      <View className="w-14 h-14 rounded-2xl bg-sky-50 items-center justify-center mr-4">
        {/* Mes en UPPERCASE pequeño + día en grande. */}
        <Text className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
          {month}
        </Text>
        <Text className="text-xl font-bold text-sky-700 leading-none mt-0.5">
          {day}
        </Text>
      </View>

      {/* Textos (centro, flex-1 para que ocupe el espacio
          restante y empuje el icono derecho). */}
      <View className="flex-1">
        <Text
          className="text-sm font-bold text-slate-900"
          numberOfLines={1}
        >
          {title || 'Falta'}
        </Text>
        <Text
          className="text-xs text-slate-500 mt-0.5"
          numberOfLines={2}
        >
          {description}
        </Text>
      </View>

      {/* Icono de acción a la derecha. */}
      <View className="ml-2">
        <actionColor.icon
          size={20}
          color={actionColor.iconColor}
          strokeWidth={2}
        />
      </View>
    </Pressable>
  );
};

export default RecentAbsenceCard;
