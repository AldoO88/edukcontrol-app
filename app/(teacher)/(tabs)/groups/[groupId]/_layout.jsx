// =====================================================================
// app/(teacher)/(tabs)/groups/[groupId]/_layout.jsx
// ---------------------------------------------------------------------
// Stack para sub-rutas del grupo (drill-down dentro de un grupo
// específico). Contiene:
//   - index           → /groups/:groupId (detalle del grupo: info + 3
//                       acciones Asistencia / Calificar / Alumnos).
//   - attendance      → /groups/:groupId/attendance (Stack anidado:
//                       matrix + today).
//   - grades          → /groups/:groupId/grades (Stack anidado:
//                       grade-entry con keypad).
//   - schedule        → /groups/:groupId/schedule (Stack anidado:
//                       horario semanal del grupo).
//   - students        → /groups/:groupId/students (Stack anidado para
//                       alumnos del grupo, con file como drill-down).
//
// Sin header (cada pantalla pinta su propio chrome).
// =====================================================================

import React from 'react';
import { Stack } from 'expo-router';

export default function GroupDetailStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="grades" />
      <Stack.Screen name="schedule" />
      <Stack.Screen name="students" />
      {/*
        'attendance' NO se declara aquí porque el sub-layout
        `attendance/_layout.jsx` lo cubre (registra `index` → la matrix
        y `today` → la vista simplificada). Declararlo acá causaría
        "duplicate screen named 'attendance'".
      */}
    </Stack>
  );
}