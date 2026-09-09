// =====================================================================
// app/(teacher)/(tabs)/groups/[groupId]/schedule/_layout.jsx
// ---------------------------------------------------------------------
// Stack de sub-rutas del feature `schedule/` (horario semanal del
// grupo). Contiene:
//   - index  → /groups/:groupId/schedule
//                (tabs por día con las clases del grupo).
//
// Sin header (la pantalla pinta su propio chrome).
// =====================================================================

import React from 'react';
import { Stack } from 'expo-router';

export default function ScheduleStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
