// =====================================================================
// app/(teacher)/(tabs)/grades/_layout.jsx
// ---------------------------------------------------------------------
// Stack del tab "Calificaciones". Contiene:
//   - index           → /grades (validación de calificaciones).
//   - [groupId]       → /grades/:groupId (revisión de calificaciones
//                       por grupo — drill-down sin bottom bar).
//
// Sin header (cada pantalla pinta su propio chrome DashboardHeader +
// SchoolInfoCard, igual que en el resto del (teacher)).
// =====================================================================

import React from 'react';
import { Stack } from 'expo-router';

export default function GradesStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[groupId]" />
    </Stack>
  );
}
