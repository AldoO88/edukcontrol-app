// =====================================================================
// app/(teacher)/(tabs)/groups/[groupId]/grades/_layout.jsx
// ---------------------------------------------------------------------
// Stack de sub-rutas del feature `grades/` (registro de calificaciones
// del grupo). Contiene:
//   - index  → /groups/:groupId/grades
//                (matriz alumno × evaluaciones con keypad).
//
// Sin header (la pantalla pinta su propio chrome).
// =====================================================================

import React from 'react';
import { Stack } from 'expo-router';

export default function GradesStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
