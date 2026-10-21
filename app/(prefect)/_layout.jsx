// =====================================================================
// app/(prefect)/_layout.jsx
// ---------------------------------------------------------------------
// Layout del ROUTE GROUP "(prefect)" — pantallas del PREFECTO.
//
// Responsabilidades (mismo patrón que (teacher)/_layout.jsx):
//   1. Auth gate: si no hay user logueado → Redirect a "/" (login).
//   2. Role gate: si user.role !== 'prefect' → Redirect al dashboard
//      del grupo correcto según su rol.
//   3. Push notifications: registra el push token (usePushNotifications)
//      cuando hay user.
//   4. Stack raíz: contiene las rutas top-level + Tabs navigator.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, ActivityIndicator, Text.
import { View, ActivityIndicator, Text } from 'react-native';

// Stack y Redirect de expo-router.
import { Stack, Redirect } from 'expo-router';

// Hook de autenticación.
import { useAuth } from '../../src/hooks/useAuth';

// Fuente única de navegación por rol (role → href del home de su
// grupo). Ver src/utils/roleRoutes.js (documenta la anti-garantía
// de bucle de este gate).
import { roleHomeHref } from '../../src/utils/roleRoutes';

// Hook de push notifications.
import { usePushNotifications } from '../../src/hooks/usePushNotifications';

// ---------------------------------------------------------------------
// Splash: mismo estilo que en el resto de layouts.
// ---------------------------------------------------------------------
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

export default function PrefectLayout() {
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

  // Role gate: este grupo es SOLO de 'prefect'. Cualquier otro rol
  // se envía a su propio home vía roleHomeHref (fuente única), o a
  // "/" si su rol no tiene home en la app (index.jsx muestra el
  // aviso de "sin acceso" sin redirigir → sin posibilidad de bucle).
  //
  // ANTES solo se pateaban teacher/tutor/principal: un social_worker,
  // registrar o admin entraba a las pantallas del prefecto (gate
  // laxo → data expuesta a rol equivocado).
  if (user?.role !== 'prefect') {
    return <Redirect href={roleHomeHref(user.role) || '/'} />;
  }

  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
      }}
    >
      {/* Tabs root: contiene TODO el flujo del prefecto (Inicio,
          Grupos, Alumnos, Maestros, Perfil). */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Feed screens — accesibles desde quick actions del dashboard,
          NO viven en (tabs)/ porque no son visibles en la bottom tab bar. */}
      <Stack.Screen name="announcements" options={{ headerShown: false }} />
      <Stack.Screen name="citations" options={{ headerShown: false }} />
      <Stack.Screen name="reports" options={{ headerShown: false }} />
      <Stack.Screen name="exit-passes" options={{ headerShown: false }} />
      <Stack.Screen name="attendance-summary" options={{ headerShown: false }} />

      {/* Pantallas de detalle — header off. */}
      <Stack.Screen name="announcements/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="citations/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="reports/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="exit-passes/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="groups/[groupId]" options={{ headerShown: false }} />
      <Stack.Screen name="students/[studentId]" options={{ headerShown: false }} />
      <Stack.Screen name="teachers/[teacherId]" options={{ headerShown: false }} />
    </Stack>
  );
}
