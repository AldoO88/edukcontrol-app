// =====================================================================
// app/index.jsx
// ---------------------------------------------------------------------
// Ruta raíz "/" de Expo Router. Pantalla de Login de EdukControl.
// Esta es la única ruta "pública" de la app.
//
// Auth flow (DECLARATIVO, dentro del screen — NO en el layout raíz):
//   - isLoading === true   → splash.
//   - user existe          → <Redirect href="/dashboard" />.
//   - sin user             → renderizar la pantalla de login.
// El <Redirect> declarativo es el patrón canónico de Expo Router
// v5: navega en la fase de render sin necesidad de useEffect ni
// router.replace. Como el AuthProvider vive en el layout raíz (arriba
// del Stack), no se remonta cuando se dispara el redirect — el
// state del contexto se preserva.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text, ActivityIndicator (splash).
import { View, Text, ActivityIndicator } from 'react-native';

// Redirect de expo-router: navegación declarativa.
import { Redirect } from 'expo-router';

// Hook de auth: lee { user, isLoading } del AuthContext.
import { useAuth } from '../src/hooks/useAuth';

// Wrapper de pantalla institucional.
import Screen from '../src/components/Screen';

// Componentes privados del route (viven en _components/, el "_"
// los esconde del routing de Expo Router).
import BrandHeader from './_components/BrandHeader';
import LoginForm from './_components/LoginForm';
import FeatureBadges from './_components/FeatureBadges';

// ---------------------------------------------------------------------
// Export `options` (específico de Expo Router v5)
// ---------------------------------------------------------------------
// El header nativo de Expo Router está deshabilitado globalmente en
// el screenOptions del root layout (app/_layout.jsx) con
// `headerShown: false`. Aquí lo dejamos explícito de nuevo a nivel
// de pantalla por DEFENSA EN PROFUNDIDAD: si en el futuro alguien
// quita el headerShown del root, esta pantalla seguirá oculta.
// Cada screen pinta su propio header visual (BrandHeader en login,
// top bar en dashboards) — el header nativo no aporta nada.
// ---------------------------------------------------------------------
export const options = {
  headerShown: false,
};

// ---------------------------------------------------------------------
// Splash inicial: se muestra mientras AuthContext está restaurando
// la sesión desde AsyncStorage. Mismo estilo en toda la app.
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

// Versión mostrada en el footer (sincronizada con la app store /
// la release). Se hardcodea aquí; cuando haya un endpoint público
// /version se puede hidratar.
const APP_VERSION = '1.0.0';

export default function LoginScreen() {
  const { user, isLoading } = useAuth();

  // Mientras el contexto está cargando, mostramos splash para
  // evitar el "flash" del login en cold-start.
  if (isLoading) {
    return <RootSplash />;
  }

  // Si el usuario YA está autenticado, saltamos al dashboard.
  // El <Redirect> se monta durante el render → Expo Router navega
  // sin remontar el AuthProvider (que está arriba del Stack).
  if (user) {
    return <Redirect href="/dashboard" />;
  }

  // Sin user: renderizar la pantalla de login.
  return (
    // Screen wrapper: edges={['top']} reserva el espacio del status
    // bar / notch para que el BrandHeader NO quede debajo. Sin esto,
    // en iOS con notch el header quedaría invisible bajo la barra
    // de estado.
    <Screen
      edges={['top']}
      background="bg-slate-50"
      keyboardAvoid
    >
      <BrandHeader />

      {/* Contenedor principal: centra verticalmente la card +
          feature badges + footer. px-6 mantiene el gutter lateral
          en pantallas anchas. max-w-sm en el form interior evita
          que la card se estire demasiado en tablets. */}
      <View className="flex-1 items-center justify-center px-6 py-4 w-full">
        <View className="w-full max-w-sm">
          <LoginForm />

          {/* Feature badges: tres "value props" (Seguro / Rápido /
              Nube) bajo la card. Sustituyen al antiguo SecurityNotice
              — el shield ya no aparece aquí porque la card no tiene
              el aviso de seguridad (asumimos que el badge "Seguro"
              comunica lo mismo de forma más visual). */}
          <FeatureBadges />

          {/* Footer institucional: versión + tagline en mayúsculas,
              tracking muy ancho (estilo "system status"). Color
              slate-400 para que NO compita con la card. */}
          <View className="items-center mt-6 mb-2">
            <Text className="text-slate-300 text-[10px] font-semibold tracking-[0.2em]">
              VERSIÓN {APP_VERSION} · SISTEMA DE GESTIÓN ESCOLAR
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}
