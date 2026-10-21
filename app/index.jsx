// =====================================================================
// app/index.jsx
// ---------------------------------------------------------------------
// Ruta raíz "/" de Expo Router. Pantalla de Login de EdukControl.
// Esta es la única ruta "pública" de la app.
//
// Auth flow (DECLARATIVO, dentro del screen — NO en el layout raíz):
//   - isLoading === true   → splash.
//   - user existe + rol con home → <Redirect href={roleHomeHref(role)} />
//                            (fuente única: src/utils/roleRoutes.js;
//                            cubre tutor, teacher, prefect,
//                            social_worker y principal).
//   - user existe + rol SIN home (admin, registrar, super_admin)
//                            → vista de "sin acceso" con botón de
//                            cerrar sesión. NO se redirige: un
//                            <Redirect> a un grupo ajeno formaba un
//                            bucle infinito de gates (guardian ⇄
//                            teacher) que colgaba la app.
//   - sin user             → renderizar la pantalla de login.
// El <Redirect> declarativo es el patrón canónico de Expo Router
// v5: navega en la fase de render sin necesidad de useEffect ni
// router.replace. Como el AuthProvider vive en el layout raíz (arriba
// del Stack), no se remonta cuando se dispara el redirect — el
// state del contexto se preserva.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text, ActivityIndicator (splash) y Platform
// (para detectar Android y anclar el form arriba con el teclado).
import { View, Text, ActivityIndicator, Platform } from 'react-native';

// Redirect de expo-router: navegación declarativa.
import { Redirect } from 'expo-router';

// Hook de auth: lee { user, isLoading, logout } del AuthContext.
import { useAuth } from '../src/hooks/useAuth';

// Fuente única de navegación por rol (role → href del dashboard de
// su grupo). Ver src/utils/roleRoutes.js — incluye la explicación
// del bucle infinito que evita.
import { roleHomeHref } from '../src/utils/roleRoutes';

// Hook de visibilidad del teclado: devuelve true mientras el
// teclado virtual está abierto.
import { useKeyboardVisible } from '../src/hooks/useKeyboardVisible';

// Wrapper de pantalla institucional.
import Screen from '../src/components/Screen';

// Botón reutilizable (se usa en la vista de "rol sin acceso" para
// cerrar la sesión).
import Button from '../src/components/Button';

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
      <Text maxFontSizeMultiplier={1.3} className="text-slate-500 text-sm mt-4 font-medium">
        Cargando EdukControl...
      </Text>
    </View>
  );
}

// Versión mostrada en el footer (sincronizada con la app store /
// la release). Se hardcodea aquí; cuando haya un endpoint público
// /version se puede hidratar.
const APP_VERSION = '1.0.1';

// ---------------------------------------------------------------------
// Vista de "rol sin acceso a la app móvil"
// ---------------------------------------------------------------------
// Se renderiza cuando HAY sesión activa pero el rol no tiene grupo
// de rutas en app/ (hoy: admin, registrar, super_admin).
//
// Devolvemos un estado con botón de CERRAR SESIÓN en lugar de un
// <Redirect>: redirigir a un grupo ajeno es lo que provocaba el
// bucle infinito guardian ⇄ teacher (los gates se rebotaban el rol
// para siempre y la app se quedaba colgada con el spinner girando).
// Aquí NO se redirige ⇒ el bucle es imposible por construcción.
function UnsupportedRoleView({ role }) {
  // logout() del AuthContext: limpia tokens locales y (best-effort)
  // el refresh token en el backend.
  const { logout } = useAuth();

  return (
    <Screen edges={['top']} background="bg-slate-50">
      <BrandHeader />
      {/* Card centrada con el aviso. max-w-sm igual que el login para
          que en tablets no se estire. elevation: 3 (sombra Android —
          ver AGENTS.md "Sombras multiplataforma"). */}
      <View className="flex-1 items-center justify-center px-6">
        <View
          className="w-full max-w-sm bg-white rounded-2xl p-6 items-center"
          style={{ elevation: 3 }}
        >
          <Text maxFontSizeMultiplier={1.3} className="text-slate-900 text-lg font-bold text-center">
            Tu cuenta aún no tiene acceso a la app
          </Text>
          <Text maxFontSizeMultiplier={1.3} className="text-slate-500 text-sm text-center mt-2">
            El rol{' '}
            <Text maxFontSizeMultiplier={1.3} className="font-bold text-slate-700">{role}</Text>{' '}
            todavía no está habilitado para la aplicación móvil. Pide
            al administrador de tu escuela que te asigne un rol con
            acceso.
          </Text>
          {/* Cerrar sesión: borra la sesión local y regresa al login,
              de donde el usuario puede entrar con otra cuenta. */}
          <Button
            title="Cerrar sesión"
            variant="danger"
            onPress={() => logout()}
            className="w-full mt-5"
          />
        </View>
      </View>
    </Screen>
  );
}

export default function LoginScreen() {
  const { user, isLoading } = useAuth();

  // Visibilidad del teclado. Se llama SIEMPRE aquí arriba (regla de
  // hooks: nada de hooks detrás de los early-returns de isLoading/
  // user de abajo). Solo se usa en Android: cuando el teclado está
  // abierto anclamos el form arriba para que el teclado no tape los
  // inputs (con pan el contenido centrado queda a medio tapar).
  const keyboardVisible = useKeyboardVisible();
  const anclarArriba = Platform.OS === 'android' && keyboardVisible;

  // Mientras el contexto está cargando, mostramos splash para
  // evitar el "flash" del login en cold-start.
  if (isLoading) {
    return <RootSplash />;
  }

  // Si el usuario YA está autenticado, saltamos a su dashboard.
  // El destino sale de roleHomeHref() (fuente única role → grupo).
  // Si el rol NO tiene home (admin, registrar, super_admin) en vez
  // de redirigir mostramos la vista de "sin acceso": un <Redirect>
  // hacia un grupo ajeno disparaba el bucle infinito de gates
  // (guardian ⇄ teacher) que colgaba la app con el spinner girando.
  if (user) {
    const href = roleHomeHref(user.role);
    if (!href) {
      return <UnsupportedRoleView role={user.role} />;
    }
    return <Redirect href={href} />;
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
          que la card se estire demasiado en tablets.
          Con el teclado abierto en Android (anclarArriba) el
          contenido pasa a alinearse arriba: así los inputs quedan
          en la zona superior que el teclado nunca tapa. */}
      <View
        className={`flex-1 items-center px-6 py-4 w-full ${
          anclarArriba ? 'justify-start' : 'justify-center'
        }`}
      >
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
            <Text maxFontSizeMultiplier={1.3} className="text-slate-300 text-[10px] font-semibold tracking-[0.2em]">
              VERSIÓN {APP_VERSION} · SISTEMA DE GESTIÓN ESCOLAR
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}
