// =====================================================================
// app/(guardian)/_components/AttendanceRing.jsx
// ---------------------------------------------------------------------
// Anillo circular de progreso con porcentaje en el centro, usado en
// la pantalla "Asistencia" para mostrar el % total de asistencia
// del alumno. Implementado con `react-native-svg` (ya disponible
// en el proyecto), que es la forma estándar de hacer arcos
// parciales en React Native (no hay conic-gradient nativo).
//
// Layout:
//
//     ╭───────────╮
//    ╱   ╭─────╮   ╲
//   │   │ 98%  │   │   ← track slate-200 + progress sky-500
//   │   ╰─────╯   │      (rotated -90° para que el inicio sea arriba)
//    ╲           ╱
//     ╰───────────╯
//
// Props:
//   - percentage: number 0-100.
//   - size:      diámetro del círculo en px (default 160).
//   - strokeWidth: grosor del trazo en px (default 12).
//   - trackColor:  color del track (default slate-200).
//   - progressColor: color del progreso (default sky-500).
//   - label:      texto pequeño bajo el porcentaje (opcional).
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text.
import { View, Text } from 'react-native';

// react-native-svg: primitivas SVG para React Native. Permite
// dibujar el arco del progreso (que con View+borderRadius no
// se puede lograr de forma parcial).
import Svg, { Circle } from 'react-native-svg';

const AttendanceRing = ({
  percentage = 0,
  size = 160,
  strokeWidth = 12,
  trackColor = '#e2e8f0',     // slate-200
  progressColor = '#0ea5e9',  // sky-500
  label = null,
}) => {
  // El radio es (size - strokeWidth) / 2 para que el trazo
  // encaje exactamente dentro del View (sin clipping).
  const radius = (size - strokeWidth) / 2;
  // Circunferencia del círculo (2πr). La usaremos para el
  // strokeDasharray del círculo de progreso.
  const circumference = 2 * Math.PI * radius;
  // Distancia a "saltar" para que solo se pinte el porcentaje
  // deseado. Si percentage = 100, offset = 0 (anillo completo).
  // Si percentage = 0, offset = circumference (anillo vacío).
  const offset = circumference - (percentage / 100) * circumference;

  return (
    // Contenedor absoluto para apilar el SVG y el texto del
    // centro. position: relative en el padre para que los
    // hijos absolutos se anclen aquí.
    <View
      style={{ width: size, height: size, position: 'relative' }}
      accessibilityRole="image"
      accessibilityLabel={`${percentage} por ciento de asistencia`}
    >
      {/* SVG con el círculo de track y el de progreso.
          width/height explícitos. */}
      <Svg width={size} height={size}>
        {/* Track (anillo de fondo, completo). */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progreso (anillo pintado hasta el % dado).
            strokeDasharray + strokeDashoffset = técnica estándar
            para "pintar solo una fracción" de un trazo.
            strokeLinecap="round" redondea los extremos.
            transform="rotate(-90 ...)" para que el inicio sea
            arriba (12 en punto) en vez de a la derecha
            (3 en punto, default de SVG). */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>

      {/* Contenido del centro: porcentaje grande + label
          opcional debajo. absolute inset-0 + items-center +
          justify-center para centrar perfectamente sobre el
          anillo. */}
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-4xl font-bold text-sky-500">
          {percentage}%
        </Text>
        {label && (
          <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
            {label}
          </Text>
        )}
      </View>
    </View>
  );
};

export default AttendanceRing;
