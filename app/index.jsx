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

// Redirect de expo-router: navegación declarativa en el render.
import { Redirect } from 'expo-router';

// Hook de auth: lee { user, isLoading } del AuthContext.
import { useAuth } from '../src/hooks/useAuth';

// Wrapper de pantalla institucional.
import Screen from '../src/components/Screen';

// Componentes privados del route (viven en _components/, el "_"
// los esconde del routing de Expo Router).
import BrandHeader from './_components/BrandHeader';
import LoginForm from './_components/LoginForm';
import SecurityNotice from './_components/SecurityNotice';

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

      <View className="flex-1 items-center justify-center px-6 py-8 w-full">
        <View className="w-full max-w-sm">
          <LoginForm />
          <SecurityNotice />
          <View className="items-center mt-12">
            <Text className="text-slate-400 text-xs">
              © {new Date().getFullYear()} EdukControl · Todos los derechos reservados
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}
