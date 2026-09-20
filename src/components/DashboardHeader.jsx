// =====================================================================
// src/components/DashboardHeader.jsx (chrome compartido)
// ---------------------------------------------------------------------
// Top header compartido por los route groups por rol ((guardian) y
// (teacher)). Pinta:
//   - Isotipo sky-500 (cuadrado con birrete blanco) + wordmark
//     "EdukControl" en sky-500.
//   - <NotificationBell /> — campanita con badge de no leídas + dropdown.
//   - paddingTop dinámico según useSafeAreaInsets para que no
//     choque con el status bar / Dynamic Island en iOS.
//
// Vive en src/components/ → chrome compartido entre roles.
//
// Self-contained: no recibe props. Si en el futuro se quiere
// personalizar (otro color de marca, ocultar la campana, etc.),
// se exponen props con defaults sensatos.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text.
import { View, Text } from 'react-native';

// Safe area: paddingTop dinámico.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Iconos Lucide.
import { GraduationCap } from 'lucide-react-native';

// Campanita con dropdown.
import NotificationBell from './NotificationBell';

export default function DashboardHeader() {
  const insets = useSafeAreaInsets();

  return (
    // bg-white: fondo blanco.
    // border-b border-slate-100: línea sutil de 1px abajo.
    // paddingTop = insets.top + 12 → respeta el área del status
    // bar / Dynamic Island y suma 12px de aire visual.
    <View
      className="bg-white flex-row items-center justify-between px-4 pb-1 border-b border-slate-100"
      style={{ paddingTop: insets.top + 12 }}
    >
      {/* Brand (isotipo + wordmark). */}
      <View className="flex-row items-center">
        {/* Isotipo: cuadrado sky-500 con birrete blanco.
            shadow-sm + elevation 2: leve profundidad. */}
        <View
          className="bg-sky-500 rounded-xl p-1.5 shadow-sm"
          style={{ elevation: 2 }}
        >
          <GraduationCap
            size={20}
            color="#ffffff"
            strokeWidth={2.25}
          />
        </View>
        <Text className="text-xl font-bold text-sky-500 ml-2.5 tracking-tight">
          EdukControl
        </Text>
      </View>

      {/* Campanita con dropdown (auto-contenida: maneja su propio state). */}
      <NotificationBell />
    </View>
  );
}
