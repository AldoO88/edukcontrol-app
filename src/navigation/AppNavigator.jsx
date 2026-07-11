// =====================================================================
// AppNavigator.js
// ---------------------------------------------------------------------
// Navegador raíz de la aplicación. Su única responsabilidad es
// decidir QUÉ árbol de navegación mostrar según el estado de
// autenticación y el rol del usuario:
//
//   - isLoading === true  → Splash simple (ActivityIndicator)
//   - user === null       → AuthNavigator (flujo de login)
//   - user.role === 'guardian' → GuardianNavigator (Bottom Tabs)
//   - user.role === 'teacher'  → TeacherNavigator (Stack)
//
// Este patrón se llama "Conditional Navigation" o "Auth Flow" y es
// la forma estándar de manejar sesiones en React Navigation.
// =====================================================================

// React: hooks useEffect y useState por si necesitamos lógica extra.
import React from 'react';

// Componentes base: View, Text, ActivityIndicator para el splash
// mientras se restaura la sesión.
import { View, ActivityIndicator, Text } from 'react-native';

// NavigationContainer: proveedor raíz de React Navigation. TODA la
// app debe estar dentro de UN SOLO NavigationContainer; por eso lo
// declaramos aquí y NO en cada sub-navegador.
import { NavigationContainer } from '@react-navigation/native';

// createNativeStackNavigator: usamos un stack raíz para poder
// cambiar entre AuthNavigator, GuardianNavigator y TeacherNavigator
// como "pantallas" del stack raíz. Esto permite transiciones suaves
// (slide) entre el login y la app logueada.
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Hook de auth para leer el estado global.
import { useAuth } from '../hooks/useAuth';

// Sub-navegadores. Cada uno encapsula su propio flujo.
import AuthNavigator from './AuthNavigator';
import GuardianNavigator from './GuardianNavigator';
import TeacherNavigator from './TeacherNavigator';

// Instancia del stack raíz. La llamamos "RootStack" para distinguirla
// de los stacks internos de cada sub-navegador.
const RootStack = createNativeStackNavigator();

// Constantes con los nombres de rutas raíz. Usar constantes evita
// errores de tipeo al referenciar rutas desde otros archivos.
const ROOT_ROUTES = {
  AUTH: 'Auth',
  GUARDIAN: 'Guardian',
  TEACHER: 'Teacher',
};

// Componente interno: splash de carga. Se muestra mientras
// AuthContext está restaurando la sesión desde AsyncStorage.
const LoadingSplash = () => (
  // View a pantalla completa, fondo slate-50, contenido centrado.
  <View className="flex-1 items-center justify-center bg-slate-50">
    {/* ActivityIndicator: spinner nativo del sistema. size="large"
        es el tamaño recomendado para splash screens. */}
    <ActivityIndicator size="large" color="#0f172a" />
    <Text className="text-slate-500 text-sm mt-4 font-medium">
      Cargando EdukControl...
    </Text>
  </View>
);

// Componente principal exportado.
const AppNavigator = () => {
  // Extraemos del contexto: user (objeto|null) e isLoading (bool).
  const { user, isLoading } = useAuth();

  // Si todavía estamos restaurando la sesión desde AsyncStorage,
  // mostramos el splash y NO renderizamos el NavigationContainer.
  // Esto evita el "flash" de la pantalla de Login cuando en
  // realidad hay una sesión válida persistida.
  if (isLoading) {
    return <LoadingSplash />;
  }

  // Si llegamos aquí, ya sabemos si hay sesión o no.
  // Renderizamos el NavigationContainer que envolverá TODO.
  return (
    // NavigationContainer: provee contexto a todos los navegadores
    // hijos. Es el único punto donde se monta en toda la app.
    <NavigationContainer>
      {/* RootStack.Navigator: stack que decide qué sub-flujo
          mostrar. Usamos screenOptions globales para ocultar el
          header del stack raíz (cada sub-navegador maneja el suyo). */}
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          // animation: 'fade' da una transición suave al cambiar
          // entre el login y la app principal. Es menos brusca que
          // 'slide_from_right' para un cambio de "mundo".
          animation: 'fade',
          // duration: duración personalizada de la animación (ms).
          animationDuration: 250,
        }}
      >
        {/* Renderizamos UNA pantalla según el estado de auth.
            - Sin usuario: AuthNavigator (login + futuras pantallas
              de recuperación de contraseña).
            - Usuario con rol 'guardian': GuardianNavigator.
            - Usuario con rol 'teacher': TeacherNavigator.
            - Cualquier otro caso (rol desconocido): caemos al
              AuthNavigator como fallback seguro. */}
        {!user ? (
          <RootStack.Screen
            name={ROOT_ROUTES.AUTH}
            component={AuthNavigator}
          />
        ) : user.role === 'guardian' ? (
          <RootStack.Screen
            name={ROOT_ROUTES.GUARDIAN}
            component={GuardianNavigator}
          />
        ) : user.role === 'teacher' ? (
          <RootStack.Screen
            name={ROOT_ROUTES.TEACHER}
            component={TeacherNavigator}
          />
        ) : (
          // Fallback: si el rol del usuario no es ninguno de los
          // esperados, lo mandamos al login. Esto evita que un
          // usuario "huérfano" se quede en una pantalla rota.
          <RootStack.Screen
            name={ROOT_ROUTES.AUTH}
            component={AuthNavigator}
          />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
