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

// Hook de push notifications.
import { usePushNotifications } from '../../src/hooks/usePushNotifications';

// ---------------------------------------------------------------------
// Splash: mismo estilo que en el resto de layouts.
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

  // Role gate: si el user NO es prefect, lo mandamos al dashboard
  // de su rol correspondiente.
  if (user?.role === 'teacher') {
    return <Redirect href="/(teacher)/dashboard" />;
  }
  if (user?.role === 'tutor') {
    return <Redirect href="/(guardian)/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
      }}
    >
      {/* Tabs root: contiene TODO el flujo del prefecto (Inicio,
          Control de Puerta, Reportes, Perfil). */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
