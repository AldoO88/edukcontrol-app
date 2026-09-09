// =====================================================================
// app/(teacher)/(tabs)/groups/[groupId]/students/_layout.jsx
// ---------------------------------------------------------------------
// Stack para sub-rutas de los alumnos de un grupo específico.
// Contiene:
//   - index           → /groups/:groupId/students (directorio de alumnos).
//   - [studentId]     → /groups/:groupId/students/:studentId (Stack
//                       anidado con file como drill-down).
//
// Sin header.
// =====================================================================

import React from 'react';
import { Stack } from 'expo-router';

export default function StudentsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[studentId]" />
    </Stack>
  );
}