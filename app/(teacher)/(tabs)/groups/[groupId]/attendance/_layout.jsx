// =====================================================================
// app/(teacher)/(tabs)/groups/[groupId]/attendance/_layout.jsx
// ---------------------------------------------------------------------
// Stack de sub-rutas del feature `attendance/` (matrix de pases de
// lista del grupo). Contiene:
//   - index  → /groups/:groupId/attendance
//                (la matrix completa con date selector + agregar/
//                eliminar fechas + long-press edit modal).
//   - today  → /groups/:groupId/attendance/today
//                (vista simplificada SOLO de hoy, sin date selector).
//
// El `today` se introdujo como vista de "acción rápida" del pase de
// lista (accesible desde el dashboard del docente cuando hay clase
// en curso). La matrix sigue siendo la vista "histórica + completa".
// El back del `today` apunta a la matrix (no al dashboard) para
// mantener la coherencia jerárquica: dashboard → grupo → today ↔ matrix.
// =====================================================================

import React from 'react';
import { Stack } from 'expo-router';

export default function AttendanceStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="today" />
    </Stack>
  );
}