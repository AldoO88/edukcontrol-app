// =====================================================================
// app/(prefect)/(tabs)/reports.jsx
// ---------------------------------------------------------------------
// Ruta "/reports" del grupo (prefect) — "Reportes e Incidencias".
//
// Placeholder: muestra un mensaje indicando que la pantalla está
// en desarrollo. Se implementará cuando se defina el flujo de
// reportes (levantar reportes, consultar historial, filtrar).
//
// Estructura visual futura:
//   ┌──────────────────────────────────┐
//   │ DashboardHeader (brand + 🔔)    │
//   ├──────────────────────────────────┤
//   │ < Volver                         │
//   ├──────────────────────────────────┤
//   │ Título: Reportes                 │
//   ├──────────────────────────────────┤
//   │ [Levantar Reporte] (botón)       │
//   │ [Filtros]                        │
//   │ [Lista de reportes]              │
//   ├──────────────────────────────────┤
//   │ BottomTabBar (Reports activo)    │
//   └──────────────────────────────────┘
// =====================================================================

// React.
import React from 'react';

// Primitivas RN.
import { View, Text } from 'react-native';

// Iconos Lucide.
import { FileText } from 'lucide-react-native';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';

export default function ReportsScreen() {
  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <DashboardHeader />

      <View className="flex-1 items-center justify-center px-6">
        <View
          className="items-center justify-center mb-4"
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: '#FEF2F2',
          }}
        >
          <FileText size={28} color="#DC2626" strokeWidth={2} />
        </View>
        <Text
          className="text-slate-900 text-center"
          style={{ fontSize: 17, fontWeight: '700' }}
        >
          Reportes e Incidencias
        </Text>
        <Text
          className="text-slate-500 text-center mt-2"
          style={{ fontSize: 13, fontWeight: '500', lineHeight: 20 }}
        >
          Levantar y consultar reportes de conducta.{'\n'}Próximamente disponible.
        </Text>
      </View>
    </View>
  );
}
