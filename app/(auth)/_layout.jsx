// =====================================================================
// app/(auth)/_layout.jsx
// ---------------------------------------------------------------------
// Layout del ROUTE GROUP "(auth)". Es una Layout Route anidada que
// Expo Router auto-descubre desde el filesystem y referencia por
// nombre desde el layout raíz (app/_layout.jsx). Aquí viven las
// pantallas del flujo de ACTIVACIÓN de cuenta, que es un flujo
// PRE-login (el usuario aún no tiene credenciales).
//
// Hijos del Stack:
//   - activation              → input de número de celular
//   - activation/verify      → código OTP de 6 dígitos
//   - activation/set-password → crear contraseña
//
// El prefijo "(auth)" es un route group OCULTO, por lo que las URLs
// resultantes son limpias: /activation, /activation/verify y
// /activation/set-password (sin el segmento "(auth)" en la URL).
//
// =====================================================================
// DIFERENCIA CON (app)
// ---------------------------------------------------------------------
// (app) es el flujo post-login (dashboards, contenido autenticado).
// (auth) es el flujo pre-login (activación de cuenta, recuperación
// de contraseña, etc. en el futuro). Ambos viven como route groups
// independientes porque sirven a audiencias distintas y no comparten
// el stack de navegación: el back de un activation no debe poder
// saltar al dashboard y viceversa.
// =====================================================================

// React.
import React from 'react';

// Stack de expo-router.
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        // Animación "slide_from_right": convención de iOS para
        // "avanzar" en un flujo lineal (phone → OTP → password).
        animation: 'slide_from_right',
        // El header nativo de Expo Router está oculto en el root
        // (app/_layout.jsx). Lo repetimos aquí para defensa en
        // profundidad: si alguien lo reactiva en el root, estas
        // pantallas siguen ocultas. Cada screen pinta su propio
        // header visual (BrandHeader arriba).
        headerShown: false,
      }}
    >
      {/* index de la carpeta activation → URL "/activation". */}
      <Stack.Screen name="activation" />

      {/* verify.jsx → URL "/activation/verify". */}
      <Stack.Screen name="activation/verify" />

      {/* set-password.jsx → URL "/activation/set-password". */}
      <Stack.Screen name="activation/set-password" />
    </Stack>
  );
}
