// =====================================================================
// app/(social-worker)/_layout.jsx
// ---------------------------------------------------------------------
// Layout del ROUTE GROUP "(social-worker)" — pantallas del TRABAJADOR SOCIAL.
// =====================================================================

import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
// Fuente única de navegación por rol (role → href del home de su
// grupo). Ver src/utils/roleRoutes.js (documenta la anti-garantía
// de bucle de este gate).
import { roleHomeHref } from '../../src/utils/roleRoutes';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';

function RootSplash() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50">
      <ActivityIndicator size="large" color="#0f172a" />
      <Text maxFontSizeMultiplier={1.3} className="text-slate-500 text-sm mt-4 font-medium">
        Cargando EdukControl...
      </Text>
    </View>
  );
}

export default function SocialWorkerLayout() {
  const { user, isLoading } = useAuth();

  usePushNotifications(!!user);

  if (isLoading) {
    return <RootSplash />;
  }

  if (!user) {
    return <Redirect href="/" />;
  }

  // Role gate: este grupo es SOLO de 'social_worker'. Cualquier otro
  // rol se envía a su propio home vía roleHomeHref (fuente única), o
  // a "/" si su rol no tiene home en la app (index.jsx muestra el
  // aviso de "sin acceso" sin redirigir → sin posibilidad de bucle).
  //
  // ANTES solo se pateaban teacher y tutor: un prefect, principal,
  // registrar o admin entraba a las pantallas del trabajador social
  // (gate laxo → data expuesta a rol equivocado).
  if (user?.role !== 'social_worker') {
    return <Redirect href={roleHomeHref(user.role) || '/'} />;
  }

  return (
    <Stack screenOptions={{ animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="announcements" options={{ headerShown: false }} />
      <Stack.Screen name="citations" options={{ headerShown: false }} />
      <Stack.Screen name="reports" options={{ headerShown: false }} />
      <Stack.Screen name="exit-passes" options={{ headerShown: false }} />
      <Stack.Screen name="attendance-summary" options={{ headerShown: false }} />
      <Stack.Screen name="justificantes" options={{ headerShown: false }} />
      <Stack.Screen name="announcements/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="citations/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="reports/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="exit-passes/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="groups/[groupId]" options={{ headerShown: false }} />
      <Stack.Screen name="students/[studentId]" options={{ headerShown: false }} />
      <Stack.Screen name="student-health/[studentId]" options={{ headerShown: false }} />
      <Stack.Screen name="teachers/[teacherId]" options={{ headerShown: false }} />
    </Stack>
  );
}
