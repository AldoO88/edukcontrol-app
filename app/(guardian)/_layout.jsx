// =====================================================================
// app/(guardian)/_layout.jsx
// ---------------------------------------------------------------------
// Layout del ROUTE GROUP "(guardian)" — pantallas del TUTOR.
//
// Con el refactor de route groups por rol, cada rol tiene su propio
// grupo con su propio _layout.jsx. Este layout:
//   1) Auth gate: si no hay user → Redirect al login.
//   2) Role gate: si userRole NO es 'tutor' → Redirect al dashboard
//      del grupo correcto (shared route: el maestro navega a
//      '/(teacher)/dashboard').
//   3) Stack con las pantallas del tutor (headerShown:false porque
//      cada pantalla pinta su propio chrome).
//   4) usePushNotifications montado SOLO cuando hay user logueado
//      (mismo patrón que el antiguo layout (app), ahora dividido
//      entre los dos grupos por rol).
//
// NOTA (shared routes): (guardian)/dashboard y (teacher)/dashboard
// comparten la URL "/dashboard". Expo Router lo soporta; la
// navegación explícita ('/(guardian)/dashboard') desambigua el grupo.
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

export default function GuardianLayout() {
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

  // Role gate: si el user NO es tutor (p. ej. un teacher intenta
  // entrar a una ruta del grupo guardian), lo mandamos al dashboard
  // del maestro. Esto refuerza el flujo: cada grupo es autónomo y
  // decide a qué rol pertenece.
  if (user?.role !== 'tutor') {
    return <Redirect href="/(teacher)/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="announcements" options={{ headerShown: false }} />
      <Stack.Screen name="announcements/[kind]/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="conduct" options={{ headerShown: false }} />
      <Stack.Screen name="grades" options={{ headerShown: false }} />
      <Stack.Screen name="attendance" options={{ headerShown: false }} />
    </Stack>
  );
}
