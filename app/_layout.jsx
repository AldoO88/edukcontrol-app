// =====================================================================
// app/_layout.jsx
// ---------------------------------------------------------------------
// Layout RAÍZ de Expo Router. Equivalente al antiguo App.jsx.
// En este archivo SOLO se montan los providers globales y el Stack
// raíz. NO se hace auth check aquí (eso vive en cada screen/layout
// file) y NO se declaran Stack.Screen hijos (las rutas se
// auto-descubren del filesystem en Expo Router v5).
//
// =====================================================================
// PATRÓN DE EXPO ROUTER v5 (CORREGIDO)
// ---------------------------------------------------------------------
// 1) El root layout exporta UN NAVIGADOR (Stack/Tabs) SIN hijos.
//    Las rutas se infieren del filesystem:
//      app/index.jsx                    → "/"
//      app/(guardian)/_layout.jsx       → route group "(guardian)" con su Stack
//      app/(guardian)/dashboard.jsx     → "/dashboard" (shared route con teacher)
//      app/(teacher)/_layout.jsx        → route group "(teacher)" con su Stack
//      app/(teacher)/dashboard.jsx      → "/dashboard" (shared route con guardian)
// 2) Para opciones de UNA pantalla específica, se usa el export
//    `options` desde el archivo de la pantalla:
//      // app/index.jsx
//      export const options = { headerShown: false };
// 3) Para auth flow, cada screen/layout file tiene su propio check
//    con <Redirect> declarativo. Esto evita que el AuthProvider se
//    remonte (que era el bug original).
// =====================================================================
// POLÍTICA DE ESCALADO DE FUENTE (Dynamic Type iOS / tamaño de texto
// Android) — REGLA OBLIGATORIA AL AÑADIR TEXTO NUEVO
// ---------------------------------------------------------------------
// React Native escala las fuentes POR DEFECTO según la preferencia de
// accesibilidad del sistema (allowFontScaling = true es el default en
// Text.js; React 19 eliminó Text.defaultProps y RN 0.86 no expone un
// cap global, así que NO existe API única para limitarlo). En iOS,
// con "Tamaño de texto" en Grande/Máximo, los <Text> crecen hasta
// ~3.5x y ROMPEN los layouts: textos encimados, botones desbordados,
// tarjetas cortadas y scroll vertical inacabable.
//
// Solución aplicada (aprobada por el usuario, 2026-10-21): TODO
// <Text> y <TextInput> de app/ y src/ lleva
// maxFontSizeMultiplier={1.3} — la escala se RESPETA pero se limita
// a 1.3x. Mejora real de accesibilidad (el texto responde al usuario)
// sin destruir la maquetación. Inyectado masivamente por script:
// 197 archivos modificados, 2,935 tags, cero pendientes (verificado
// por conteo: opens totales = opens con prop, dobles = 0).
//
// REGLA AL ESCRIBIR TEXTO NUEVO: incluir SIEMPRE la prop, p. ej.
//   <Text maxFontSizeMultiplier={1.3} className="text-sm">Hola</Text>
//   <TextInput maxFontSizeMultiplier={1.3} ... />
//
// Opciones descartadas y por qué:
//   - allowFontScaling={false} global: ignora por completo la
//     preferencia del usuario (peor accesibilidad, no cumple la
//     intención de Dynamic Type).
//   - Cap por pantalla/componente: olvidadizo y difícil de auditar;
//     el cap por tag es mecánico y comprobable con grep.
// =====================================================================

// IMPORTANTE: este import DEBE ser el primero de toda la app.
// Carga las directivas @tailwind de global.css y permite que
// NativeWind transforme las className de los componentes en
// StyleSheet nativo. Si se mueve más abajo o se omite, las clases
// de Tailwind se ignoran y la UI sale "plana" sin estilos.
import '../global.css';

// React.
import React from 'react';

// SafeAreaProvider: provee los insets de safe-area a TODA la app.
import { SafeAreaProvider } from 'react-native-safe-area-context';

// StatusBar de Expo.
import { StatusBar } from 'expo-status-bar';

// Stack de expo-router. SIN hijos: las rutas se auto-descubren.
import { Stack } from 'expo-router';

// AuthProvider: vive UNA SOLA VEZ en la raíz, arriba del Stack.
// Nunca se desmonta durante la navegación.
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* AuthProvider se monta UNA SOLA VEZ aquí. Al estar arriba
          del Stack, no se remonta cuando el router navega entre
          rutas. Sus consumers (los hooks useAuth en los screens
          y layouts hijos) siempre ven el mismo contexto. */}
      <AuthProvider>
        <StatusBar style="light" />

        {/* Stack raíz SIN hijos. Las rutas se descubren del
            filesystem: app/index.jsx, app/(guardian)/_layout.jsx,
            app/(teacher)/_layout.jsx, etc.

            No inyectamos un header global porque cada screen/layout
            file es responsable del suyo propio:
              - app/index.jsx           → pinta su propio BrandHeader "EdukControl"
              - app/(guardian)/_layout.jsx y app/(teacher)/_layout.jsx
                                        → cada rol pinta su propio header

            `headerShown: false` en screenOptions desactiva el
            header nativo de Expo Router (la barra con título de la
            ruta + botón back + settings) para TODAS las rutas. Sin
            esto, en / verías una barra fea con "index" y un ícono
            de engranaje encima del BrandHeader custom.

            Si en el futuro una pantalla quiere el header nativo de
            vuelta, basta con export const options = { headerShown: true }
            desde el archivo de esa screen. */}
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
