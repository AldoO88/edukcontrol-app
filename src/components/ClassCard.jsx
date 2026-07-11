// =====================================================================
// ClassCard.jsx
// ---------------------------------------------------------------------
// Fila de clase para el dashboard del docente. Muestra icono,
// nombre, horario + aula y conteo de alumnos con chevron.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text, TouchableOpacity.
import { View, Text, TouchableOpacity } from 'react-native';

// Iconos.
import { BookOpen, Users, ChevronRight } from 'lucide-react-native';

// Componente base.
import Card from './Card';

// Props:
//   - classItem: objeto con { id, name, time, room, students }.
//   - isLast: boolean. Si true, no dibuja border-b.
//   - onPress: callback al pulsar.
const ClassCard = ({ classItem, isLast, onPress }) => {
  const { name, time, room, students } = classItem;

  return (
    <Card>
      <TouchableOpacity
        onPress={onPress}
        className={`flex-row items-center py-3 ${isLast ? '' : 'border-b border-slate-100'}`}
        accessibilityRole="button"
        accessibilityLabel={`${name} a las ${time}`}
      >
        {/* Icono del libro. */}
        <View className="bg-sky-100 p-2 rounded-lg mr-3">
          <BookOpen size={20} color="#0284c7" strokeWidth={2.25} />
        </View>

        {/* Nombre + horario. */}
        <View className="flex-1">
          <Text className="text-slate-900 text-base font-semibold" numberOfLines={1}>
            {name}
          </Text>
          <Text className="text-slate-500 text-xs mt-0.5">
            {time} · {room}
          </Text>
        </View>

        {/* Conteo de alumnos + chevron. */}
        <View className="flex-row items-center">
          <Users size={14} color="#94a3b8" />
          <Text className="text-slate-500 text-xs ml-1 mr-2">
            {students}
          </Text>
          <ChevronRight size={20} color="#94a3b8" />
        </View>
      </TouchableOpacity>
    </Card>
  );
};

export default ClassCard;
