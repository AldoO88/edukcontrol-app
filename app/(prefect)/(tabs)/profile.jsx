// =====================================================================
// app/(prefect)/(tabs)/profile.jsx
// ---------------------------------------------------------------------
// Ruta "/profile" del grupo (prefect) — "Perfil del Prefecto".
//
// Placeholder: muestra un mensaje indicando que la pantalla está
// en desarrollo. Se implementará con la info del prefecto (nombre,
// correo, opciones de cuenta, cerrar sesión).
//
// Estructura visual futura:
//   ┌──────────────────────────────────┐
//   │ DashboardHeader (brand + 🔔)    │
//   ├──────────────────────────────────┤
//   │ < Volver                         │
//   ├──────────────────────────────────┤
//   │ Avatar + Nombre + Rol            │
//   ├──────────────────────────────────┤
//   │ [Cerrar Sesión]                  │
//   ├──────────────────────────────────┤
//   │ BottomTabBar (Profile activo)    │
//   └──────────────────────────────────┘
// =====================================================================

// React.
import React from 'react';

// Primitivas RN.
import { View, Text } from 'react-native';

// Iconos Lucide.
import { User } from 'lucide-react-native';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';

export default function ProfileScreen() {
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
            backgroundColor: '#F1F5F9',
          }}
        >
          <User size={28} color="#64748B" strokeWidth={2} />
        </View>
        <Text
          className="text-slate-900 text-center"
          style={{ fontSize: 17, fontWeight: '700' }}
        >
          Perfil del Prefecto
        </Text>
        <Text
          className="text-slate-500 text-center mt-2"
          style={{ fontSize: 13, fontWeight: '500', lineHeight: 20 }}
        >
          Información personal y opciones de cuenta.{'\n'}Próximamente disponible.
        </Text>
      </View>
    </View>
  );
}
