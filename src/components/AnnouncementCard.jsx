// =====================================================================
// AnnouncementCard.jsx
// ---------------------------------------------------------------------
// Tarjeta de anuncio individual. Encapsula:
//   - Badge de categoría (con color según variant).
//   - Icono Pin si está fijado.
//   - Título + fecha con icono Calendar.
//   - Cuerpo expandible (preview vs completo) con chevron que rota.
// Reemplaza el renderItem inline de AnnouncementsScreen.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text, TouchableOpacity.
import { View, Text, TouchableOpacity } from 'react-native';

// Iconos.
import { Calendar, Pin, ChevronRight } from 'lucide-react-native';

// Componentes reutilizables.
import Card from './Card';
import Badge from './Badge';

// Constantes.
import { announcementCategoryVariant } from '../constants/statusUi';

// Props:
//   - announcement: objeto con { id, title, body, date, pinned, category }.
//   - isExpanded: boolean.
//   - onToggle: callback al pulsar la card (expandir/colapsar).
const AnnouncementCard = ({ announcement, isExpanded, onToggle }) => {
  // Destructuramos para legibilidad.
  const { title, body, date, pinned, category } = announcement;

  // Variant del badge según categoría.
  const badgeVariant = announcementCategoryVariant(category);

  return (
    <Card className="mb-3">
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${isExpanded ? 'Toque para colapsar' : 'Toque para expandir'}`}
        accessibilityState={{ expanded: isExpanded }}
      >
        {/* Header: badge + pin + chevron. */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row items-center flex-1">
            {/* Badge de categoría. */}
            <Badge label={category} variant={badgeVariant} className="mr-2" />
            {/* Pin si está fijado. */}
            {pinned && <Pin size={14} color="#0284c7" />}
          </View>
          {/* Chevron rotatorio según isExpanded. */}
          <ChevronRight
            size={20}
            color="#94a3b8"
            style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
          />
        </View>

        {/* Título. */}
        <Text className="text-slate-900 text-base font-bold mb-1">
          {title}
        </Text>

        {/* Fecha con icono. */}
        <View className="flex-row items-center mb-2">
          <Calendar size={12} color="#94a3b8" />
          <Text className="text-slate-500 text-xs ml-1.5">{date}</Text>
        </View>

        {/* Cuerpo: número de líneas según isExpanded. */}
        <Text
          className="text-slate-600 text-sm"
          numberOfLines={isExpanded ? undefined : 2}
        >
          {body}
        </Text>

        {/* Indicador "Ver más" cuando está colapsado. */}
        {!isExpanded && (
          <Text className="text-sky-600 text-xs font-semibold mt-2">
            Ver más
          </Text>
        )}
      </TouchableOpacity>
    </Card>
  );
};

export default AnnouncementCard;
