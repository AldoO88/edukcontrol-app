// =====================================================================
// App.js
// ---------------------------------------------------------------------
// Componente raíz de la aplicación "EdukControl". Su responsabilidad
// es montar los PROVIDERS en el orden correcto para que TODA la
// app pueda consumir:
//
//   1) SafeAreaProvider  → provee insets de safe-area a todas las
//                          pantallas (notch, dynamic island, home
//                          indicator). DEBE ir en la raíz.
//   2) AuthProvider      → expone { user, login, logout, isLoading }
//                          a través de useAuth().
//   3) AppNavigator      → decide qué árbol de navegación renderizar
//                          según el estado de auth y el rol del
//                          usuario. Incluye su propio
//                          <NavigationContainer>.
//
// El orden NO es arbitrario: SafeAreaProvider debe envolver
// CUALQUIER cosa que use useSafeAreaInsets (todas las pantallas),
// por eso va primero. AuthProvider debe envolver cualquier cosa que
// use useAuth (AppNavigator incluido), por eso va segundo.
// =====================================================================

// Importamos SafeAreaProvider de react-native-safe-area-context.
// Esta librería REEMPLAZA a la SafeAreaView deprecada de RN.
// Necesita envolver la app en la raíz para que los hooks
// useSafeAreaInsets() y los <SafeAreaView> funcionen en cualquier
// parte del árbol.
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Importamos AuthProvider, el proveedor del contexto de
// autenticación que vive en src/context/AuthContext.js.
import { AuthProvider } from './src/context/AuthContext';

// Importamos el navegador raíz, que ya incluye el
// <NavigationContainer> y decide entre Auth/Guardian/Teacher.
import AppNavigator from './src/navigation/AppNavigator';

// Importamos el StatusBar de Expo para controlar la apariencia
// de la barra de estado del sistema. style="light" significa que
// los iconos serán BLANCOS (apropiado para nuestros headers
// oscuros slate-900). backgroundColor="transparent" deja que el
// contenido respete las safe-areas por sí solo.
import { StatusBar } from 'expo-status-bar';

// Importamos el CSS global con las directivas de Tailwind.
// DEBE ser el primer import de la app (antes que cualquier
// componente que use className) para que Metro lo procese y
// NativeWind pueda transformar las clases en estilos nativos.
import './global.css';

// Definimos y exportamos el componente raíz. Por convención de
// Expo (index.js → registerRootComponent), debe ser default export
// y llamarse "App".
export default function App() {
  return (
    // 1) SafeAreaProvider en la raíz absoluta. initialMetrics=null
    //    (default) le pide a la librería que mida los insets en
    //    runtime. En SSR Web habría que pasar initialWindowMetrics.
    <SafeAreaProvider>
      {/* 2) AuthProvider. Todos los componentes hijos pueden usar
             useAuth() para leer/controlar la sesión. */}
      <AuthProvider>
        {/* 3) StatusBar con estilo "light" (iconos blancos) para
              que se vean sobre el slate-900 del header de login
              y dashboards. */}
        <StatusBar style="light" backgroundColor="#0f172a" translucent={false} />
        {/* 4) AppNavigator contiene el NavigationContainer y
              todas las rutas. */}
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
