// =====================================================================
// AttendanceRow.jsx
// ---------------------------------------------------------------------
// Fila individual del historial de asistencia. Muestra icono del
// status, nombre del hijo, fecha/hora y label del status.
// Encapsula el renderItem inline que tenía AttendanceHistory.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text.
import { View, Text } from 'react-native';

// Componentes reutilizables.
import Card from './Card';

// Helpers.
import { attendanceStatusUi } from '../constants/statusUi';

// Props:
//   - entry: objeto con { id, date, child, status, time }.
const AttendanceRow = ({ entry }) => {
  // Obtenemos la UI del status desde la constante compartida.
  const ui = attendanceStatusUi(entry.status);
  const Icon = ui.Icon;

  return (
    <Card className="mb-3">
      <View className="flex-row items-center">
        {/* Icono del status en su color. */}
        <View className={`${ui.bgClass} p-2 rounded-lg mr-3`}>
          <Icon size={20} color={ui.iconColor} strokeWidth={2.25} />
        </View>

        {/* Nombre del hijo + fecha/hora. */}
        <View className="flex-1">
          <Text className="text-slate-900 text-sm font-bold" numberOfLines={1}>
            {entry.child}
          </Text>
          <Text className="text-slate-500 text-xs mt-0.5">
            {entry.date}
            {entry.time && ` · ${entry.time}`}
          </Text>
        </View>

        {/* Label del status (e.g. "A tiempo"). */}
        <Text className={`${ui.textClass} text-xs font-bold`}>
          {ui.label}
        </Text>
      </View>
    </Card>
  );
};

export default AttendanceRow;
