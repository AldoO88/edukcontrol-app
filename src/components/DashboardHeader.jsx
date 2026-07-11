// =====================================================================
// DashboardHeader.jsx
// ---------------------------------------------------------------------
// Encabezado institucional de los dashboards (Guardian y Teacher).
// Fondo slate-900 con saludo + nombre + fecha. Se usa con
// marginTop negativo en el contenido para superponer la primera
// card sobre el header (patrón de profundidad visual).
// =====================================================================

// React.
import React from 'react';

// Primitivas RN.
import { View, Text } from 'react-native';

// dateHelpers.js: helper para formatear fechas en español.
import { formatLongDate } from '../utils/dateHelpers';

// Props:
//   - greeting: string (e.g. "Buen día," o "Hola,").
//   - name: nombre a mostrar.
//   - subtitle: string opcional bajo el nombre (e.g. "Tienes 3
//     clases programadas para hoy"). Si se omite, muestra la
//     fecha actual formateada.
const DashboardHeader = ({ greeting, name, subtitle = null }) => {
  return (
    <View className="bg-slate-900 px-6 pt-6 pb-12 rounded-b-3xl">
      {/* Saludo (e.g. "Buen día,"). */}
      <Text className="text-slate-300 text-sm font-medium">{greeting}</Text>
      {/* Nombre del usuario, en grande y bold. */}
      <Text className="text-white text-3xl font-bold mt-1" numberOfLines={1}>
        {name}
      </Text>
      {/* Subtítulo: si no se pasa, mostramos la fecha actual. */}
      <Text className="text-slate-400 text-sm mt-1">
        {subtitle || formatLongDate(new Date())}
      </Text>
    </View>
  );
};

export default DashboardHeader;
