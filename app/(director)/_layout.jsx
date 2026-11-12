// =====================================================================
// app/(director)/_layout.jsx
// ---------------------------------------------------------------------
// Layout del ROUTE GROUP "(director)" — pantallas del DIRECTOR.
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
// Banner de permiso de notificaciones denegado (Fase 4): se pinta en el
// top del layout cuando el hook queda en status='denied' y ofrece el
// salto a Ajustes del sistema con openSettings().
import PushPermissionBanner from '../../src/components/PushPermissionBanner';

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

export default function DirectorLayout() {
  const { user, isLoading } = useAuth();

  // Capturamos el status para pintar PushPermissionBanner (Fase 4).
  const { status: pushStatus } = usePushNotifications(!!user);

  if (isLoading) {
    return <RootSplash />;
  }

  if (!user) {
    return <Redirect href="/" />;
  }

  // Role gate: este grupo es SOLO de 'principal'. Cualquier otro rol
  // se envía a su propio home vía roleHomeHref (fuente única), o a
  // "/" si su rol no tiene home en la app (index.jsx muestra el
  // aviso de "sin acceso" sin redirigir → sin posibilidad de bucle).
  //
  // ANTES solo se pateaban teacher y tutor: un prefect, social_worker,
  // registrar o admin entraba a las pantallas del director (gate
  // laxo → data de una escuela visible para un rol equivocado).
  if (user?.role !== 'principal') {
    return <Redirect href={roleHomeHref(user.role) || '/'} />;
  }

  return (
    <View className="flex-1 bg-slate-50">
      {/* Banner de permiso denegado (Fase 4): solo pinta con
          status='denied'; ocupa el top y empuja el Stack hacia abajo. */}
      <PushPermissionBanner status={pushStatus} />

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
    </View>
  );
}
