// =====================================================================
// app/(teacher)/_layout.jsx
// ---------------------------------------------------------------------
// Layout del ROUTE GROUP "(teacher)" — pantallas del MAESTRO.
//
// Mismo patrón que app/(guardian)/_layout.jsx pero con el role gate
// invertido: si userRole NO es 'teacher' → Redirect al dashboard del
// tutor ('/(guardian)/dashboard').
//
// Pantallas del grupo:
//   - dashboard           → /dashboard (shared route con (guardian)).
//   - take-attendance     → /take-attendance (tomar asistencia).
//   - announcements       → /announcements (avisos y comunicados).
//   - attendance          → /attendance (shared route; placeholder maestro).
//   - grades              → /grades (shared route; tab "Horario" del maestro).
//   - groups              → /groups (Mis Grupos y Asignaturas).
//   - roster              → /roster (alumnos de un grupo; dest. "Alumnos" legacy).
//   - student-directory  → /student-directory (Directorio y Expediente).
//   - matrix              → /matrix (Pase de Lista Matricial; dest. "Asistencia").
//   - grade-entry         → /grade-entry (Registro de Calificaciones; dest. "Calificar").
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, ActivityIndicator, Text.
import { View, ActivityIndicator, Text } from 'react-native';

// Stack y Redirect de expo-router.
import { Stack, Redirect } from 'expo-router';

// Hook de autenticación.
import { useAuth } from '../../src/hooks/useAuth';

// Hook de push notifications (mismo patrón que el antiguo (app) layout).
import { usePushNotifications } from '../../src/hooks/usePushNotifications';

// ---------------------------------------------------------------------
// Splash: mismo estilo que en app/index.jsx.
// ---------------------------------------------------------------------
function RootSplash() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50">
      <ActivityIndicator size="large" color="#0f172a" />
      <Text className="text-slate-500 text-sm mt-4 font-medium">
        Cargando EdukControl...
      </Text>
    </View>
  );
}

export default function TeacherLayout() {
  const { user, isLoading } = useAuth();

  // Push notifications: solo cuando hay user logueado.
  usePushNotifications(!!user);

  // Mientras carga, splash.
  if (isLoading) {
    return <RootSplash />;
  }

  // Auth gate: sin user, al login.
  if (!user) {
    return <Redirect href="/" />;
  }

  // Role gate: si el user NO es teacher (p. ej. un tutor intenta
  // entrar a una ruta del grupo maestro), lo mandamos al dashboard
  // del tutor.
  if (user?.role !== 'teacher') {
    return <Redirect href="/(guardian)/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="take-attendance" options={{ headerShown: false }} />
      <Stack.Screen name="announcements" options={{ headerShown: false }} />
      <Stack.Screen name="attendance" options={{ headerShown: false }} />
      <Stack.Screen name="grades" options={{ headerShown: false }} />
      <Stack.Screen name="groups" options={{ headerShown: false }} />
      <Stack.Screen name="roster" options={{ headerShown: false }} />
      <Stack.Screen name="student-directory" options={{ headerShown: false }} />
      <Stack.Screen name="matrix" options={{ headerShown: false }} />
      <Stack.Screen name="grade-entry" options={{ headerShown: false }} />
    </Stack>
  );
}
