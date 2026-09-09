// =====================================================================
// app/(teacher)/(tabs)/groups/[groupId]/students/[studentId]/_layout.jsx
// ---------------------------------------------------------------------
// Stack anidado dentro de [studentId]. Registra las dos pantallas
// de expediente como rutas hermanas:
//
//   - file.jsx         → Expediente de materia regular (evaluación +
//                         asistencia de UNA materia).
//   - tutoria-file.jsx → Expediente de Tutoría / Ed. Socioemocional
//                         (seguimiento integral del alumno).
//
// El router decide cuál abrir según el param `isTutoria` que viaja
// desde students/index.jsx.
// =====================================================================

import React from 'react';
import { Stack } from 'expo-router';

export default function StudentFileStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="file" />
      <Stack.Screen name="tutoria-file" />
    </Stack>
  );
}
