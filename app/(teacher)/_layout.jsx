// =====================================================================
// app/(teacher)/_layout.jsx
// ---------------------------------------------------------------------
// Layout del ROUTE GROUP "(teacher)" — pantallas del MAESTRO.
//
// Responsabilidades:
//   1. Auth gate: si no hay user logueado → Redirect a "/" (login).
//   2. Role gate: si user.role !== 'teacher' → Redirect al dashboard
//      del tutor ('(guardian)/dashboard').
//   3. Push notifications: registra el push token (usePushNotifications)
//      cuando hay user.
//   4. Stack raíz: contiene únicamente las rutas top-level que NO
//      viven bajo el Tabs navigator. Todo el contenido real del
//      maestro (Inicio / Mis Grupos / Calificaciones / Perfil) está
//      anidado bajo (tabs)/, que provee su propio navigator.
//
// Top-level routes actuales (placeholders):
//   - announcements  → /announcements  (quick action del dashboard).
//   - attendance     → /attendance     (placeholder huérfano, no se usa
//                                       activamente pero se conserva
//                                       por si hay deep links).
//
// Top-level routes (fuera de tabs):
//   - schedule          → /schedule (horario semanal del docente).
//   - attendance        → /attendance (tomar asistencia).
//   - announcements     → /announcements (comunicados).
//   - citations         → /citatorios (gestión de citaciones).
//   - groups/[groupId]/grades → /groups/:groupId/grades (calificar).
//
// Todo lo demás vive bajo /(tabs)/:
//   - dashboard           → /
//   - groups/index        → /groups
//   - groups/[groupId]/*  → /groups/:groupId/{attendance|students}
//   - groups/[groupId]/students/[studentId]/file → /groups/:groupId/students/:studentId/file
//   - profile             → /profile (con change-password como hijo)
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
      {/* Tabs root: contiene TODO el flujo del maestro (Inicio, Mis
          Grupos, Calificaciones, Perfil) con stacks anidados para
          drill-down. Ver app/(teacher)/(tabs)/_layout.jsx. */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Top-level routes (placeholders / quick actions). */}
      <Stack.Screen name="announcements" options={{ headerShown: false }} />
      <Stack.Screen name="announcements/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="attendance" options={{ headerShown: false }} />
      <Stack.Screen name="citations" options={{ headerShown: false }} />
      <Stack.Screen
        name="citations/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="schedule" options={{ headerShown: false }} />
    </Stack>
  );
}