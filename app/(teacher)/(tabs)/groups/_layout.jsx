// =====================================================================
// app/(teacher)/(tabs)/groups/_layout.jsx
// ---------------------------------------------------------------------
// Stack del tab "Mis Grupos". Contiene:
//   - index           → /groups (lista de grupos).
//   - [groupId]       → /groups/:groupId (Stack anidado con detalle
//                       del grupo + sub-rutas attendance/grades/students).
//
// Sin header (cada pantalla pinta su propio chrome DashboardHeader +
// SchoolInfoCard, igual que en el resto del (teacher)).
// =====================================================================

import React from 'react';
import { Stack } from 'expo-router';

export default function GroupsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[groupId]" />
    </Stack>
  );
}