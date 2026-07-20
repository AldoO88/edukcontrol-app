// =====================================================================
// app/(app)/_layout.jsx
// ---------------------------------------------------------------------
// Layout del ROUTE GROUP "(app)". Esta es la Layout Route que
// Expo Router auto-descubre desde el filesystem y referencia por
// nombre desde el layout raíz (app/_layout.jsx). Es la única
// "pantalla" del root layout que SÍ puede tener `<Stack.Screen>`
// hijos (porque es una Layout Route anidada, no el root).
//
// Como Layout Route, su default export es el componente que se
// renderiza cuando el router navega a cualquier ruta dentro de (app).
// Aquí hace dos cosas:
//   1) Auth gate: si no hay user, <Redirect href="/" /> (safety net;
//      el grueso del redirect de auth vive en app/index.jsx).
//   2) Stack interno con las rutas hijas: actualmente solo /dashboard.
//      Cuando se añadan más rutas (avisos, reportes, etc.) se
//      declaran como <Stack.Screen name="..." /> dentro de este Stack.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, ActivityIndicator, Text.
import { View, ActivityIndicator, Text } from 'react-native';

// Stack y Redirect de expo-router.
import { Stack, Redirect } from 'expo-router';

// Hook de autenticación.
import { useAuth } from '../../src/hooks/useAuth';

// ---------------------------------------------------------------------
// Splash: mismo estilo que en app/index.jsx. En el futuro se puede
// extraer a un componente compartido si se duplica en más sitios.
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

export default function AppLayout() {
  const { user, isLoading } = useAuth();

  // Mientras carga, splash. Esto evita parpadeos durante el
  // cold-start o al restaurar sesión.
  if (isLoading) {
    return <RootSplash />;
  }

  // Auth gate: si NO hay user y el router nos montó (lo que solo
  // debería pasar si alguien navegó directamente a /(app)/* sin
  // pasar por el login), redirigimos. El grueso de este redirect
  // se hace desde app/index.jsx cuando el user está logueado e
  // intenta ver el login.
  if (!user) {
    return <Redirect href="/" />;
  }

  // Si hay user, montamos el Stack interno con las rutas hijas.
  //
  // screenOptions.animation: transición "slide_from_right" entre
  // rutas del flujo logueado (convención iOS para "avanzar").
  //
  // <Stack.Screen name="dashboard" options={{ headerShown: false }} />:
  // ocultamos el header global (SchoolHeader inyectado por
  // app/_layout.jsx) SOLO para /dashboard, porque el GuardianDashboard
  // pinta su propio header (brand del producto + campana) y la info
  // de la escuela vive en una card dentro del contenido, NO en el
  // header bar.
  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
