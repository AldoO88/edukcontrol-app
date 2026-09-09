// =====================================================================
// app/(prefect)/(tabs)/gate.jsx
// ---------------------------------------------------------------------
// Ruta "/gate" del grupo (prefect) — "Control de Puerta".
//
// Placeholder: muestra un mensaje indicando que la pantalla está
// en desarrollo. Se implementará cuando se defina el flujo de
// control de puerta (registro de entradas/salidas de alumnos).
//
// Estructura visual futura:
//   ┌──────────────────────────────────┐
//   │ DashboardHeader (brand + 🔔)    │
//   ├──────────────────────────────────┤
//   │ < Volver                         │
//   ├──────────────────────────────────┤
//   │ Título: Control de Puerta        │
//   ├──────────────────────────────────┤
//   │ [Scanner / Registro manual]      │
//   ├──────────────────────────────────┤
//   │ BottomTabBar (Gate activo)       │
//   └──────────────────────────────────┘
// =====================================================================

// React.
import React from 'react';

// Primitivas RN.
import { View, Text } from 'react-native';

// Iconos Lucide.
import { DoorOpen } from 'lucide-react-native';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';

export default function GateScreen() {
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
            backgroundColor: '#F0F9FF',
          }}
        >
          <DoorOpen size={28} color="#0284C7" strokeWidth={2} />
        </View>
        <Text
          className="text-slate-900 text-center"
          style={{ fontSize: 17, fontWeight: '700' }}
        >
          Control de Puerta
        </Text>
        <Text
          className="text-slate-500 text-center mt-2"
          style={{ fontSize: 13, fontWeight: '500', lineHeight: 20 }}
        >
          Registro de entradas y salidas de alumnos.{'\n'}Próximamente disponible.
        </Text>
      </View>
    </View>
  );
}
