// =====================================================================
// app/_components/FeatureBadges.jsx
// ---------------------------------------------------------------------
// Tres badges horizontales que se muestran bajo la card de login:
//   [Seguro]  [Rápido]  [Nube]
// Cada uno es un círculo de color claro con un icono + una etiqueta
// corta debajo. Reemplaza al antiguo SecurityNotice (que vivía en
// el mismo slot visual) y sirve como "value props" rápidos que
// dan confianza al usuario antes de iniciar sesión.
//
// Componente puramente presentacional: sin props, sin estado.
// Vive en app/_components/ (prefijo "_") → privado, no es ruta.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View (contenedor flex-row), Text (etiquetas).
import { View, Text } from 'react-native';

// Iconos Lucide para los tres badges.
//   - Shield: "Seguro" — cifrado/protección de datos.
//   - Zap:    "Rápido" — velocidad/performance.
//   - Cloud:  "Nube" — disponible desde cualquier lugar.
import { Shield, Zap, Cloud } from 'lucide-react-native';

// Configuración de cada badge. Centralizarlo como array de objetos
// hace trivial añadir/quitar/reordenar badges sin tocar el JSX.
const FEATURES = [
  {
    key: 'secure',
    label: 'Seguro',
    icon: Shield,
    bg: '#dbeafe', // blue-100
    color: '#3b82f6', // blue-500
  },
  {
    key: 'fast',
    label: 'Rápido',
    icon: Zap,
    bg: '#fed7aa', // orange-200 (un punto más suave que amber-100)
    color: '#f97316', // orange-500
  },
  {
    key: 'cloud',
    label: 'Nube',
    icon: Cloud,
    bg: '#dbeafe', // blue-100 (mismo círculo que "Seguro" para
                   //         coherencia visual)
    color: '#0ea5e9', // sky-500
  },
];

export default function FeatureBadges() {
  return (
    // flex-row: los 3 badges en línea horizontal.
    // justify-center: centrados en la pantalla.
    // mt-8: separación cómoda sobre la card.
    // mb-4: pequeño margen bajo los badges (antes del footer).
    <View className="flex-row justify-center items-center mt-8 mb-4">
      {FEATURES.map((feature, index) => (
        // Cada badge: columna vertical (icono + label) centrada.
        // mx-4: separación horizontal generosa entre badges.
        <View
          key={feature.key}
          className="items-center mx-4"
        >
          {/* Círculo de color claro. w-14 h-14 (56px) para que el
              icono (size=22) tenga espacio sin verse "pegado".
              items-center + justify-center para centrar el icono. */}
          <View
            className="w-14 h-14 rounded-full items-center justify-center"
            style={{ backgroundColor: feature.bg }}
          >
            <feature.icon
              size={22}
              color={feature.color}
              strokeWidth={2.25}
            />
          </View>

          {/* Etiqueta bajo el círculo. mt-2 separa del icono.
              text-sm = 14px (legible pero no compite con la card). */}
          <Text className="text-slate-600 text-sm font-semibold mt-2">
            {feature.label}
          </Text>

          {/* Separador invisible: no necesitamos divider entre
              badges porque el gap de mx-4 ya los separa. */}
          {index < FEATURES.length - 1 && null}
        </View>
      ))}
    </View>
  );
}
