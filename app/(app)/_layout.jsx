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

// Hook de push notifications. Lo montamos SOLO cuando hay user
// logueado (enabled = !!user). El hook se encarga de pedir
// permisos, obtener el FCM token, registrarlo en el backend y
// escuchar rotaciones. La limpieza (unregister) la hace
// AuthContext.logout() en el momento del logout, NO en el unmount
// del layout.
import { usePushNotifications } from '../../src/hooks/usePushNotifications';

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

  // Hook de push notifications. Lo montamos solo cuando hay user
  // (enabled = !!user). Antes del login, no hay credenciales para
  // el endpoint /api/guardians/me/fcm-token, así que es inútil.
  // El hook maneja internamente permisos, canal, token, registro
  // y rotación; no necesitamos su return value aquí.
  usePushNotifications(!!user);

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
      {/* Ruta /announcements (pantalla "Avisos"). headerShown:false
          porque la pantalla pinta su propio header (o, en el futuro,
          lo heredará del layout cuando se extraiga de
          GuardianDashboard). Los nombres de ruta van en inglés
          (igual que componentes, hooks y services); el copy visible
          sigue en español. */}
      <Stack.Screen
        name="announcements"
        options={{ headerShown: false }}
      />
      {/* Ruta dinámica /announcements/:kind/:id. El :kind discrimina
          entre 'announcement' y 'citation' (endpoints separados
          en el backend). headerShown:false + back button custom
          dentro de la propia pantalla. El name sigue la convención
          de path relativo de Expo Router:
          "announcements/[kind]/[id]". */}
      <Stack.Screen
        name="announcements/[kind]/[id]"
        options={{ headerShown: false }}
      />
      {/* Ruta /conduct (pantalla "Conducta"). Mismo patrón que
          announcements. */}
      <Stack.Screen
        name="conduct"
        options={{ headerShown: false }}
      />
      {/* Ruta /grades (pantalla "Calificaciones"). Mismo patrón que
          announcements/conduct. */}
      <Stack.Screen
        name="grades"
        options={{ headerShown: false }}
      />
      {/* Ruta /attendance (pantalla "Asistencia"). Mismo patrón que
          las otras pantallas. */}
      <Stack.Screen
        name="attendance"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
