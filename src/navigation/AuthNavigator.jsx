// =====================================================================
// AuthNavigator.js
// ---------------------------------------------------------------------
// Navegador del flujo de autenticación (pre-login). Contiene la
// pantalla de Login y, en el futuro, pantallas adicionales como
// "Recuperar contraseña" o "Verificar código". Se monta cuando
// NO hay usuario logueado (AppNavigator lo decide).
// Usamos un Stack Navigator (no tabs) porque el flujo de auth es
// estrictamente lineal: el usuario no navega libremente entre
// pantallas de auth; cada una lleva a la siguiente.
// =====================================================================

// createNativeStackNavigator: API moderna de React Navigation para
// transiciones nativas (más performante que createStackNavigator
// clásico, ya que usa la API nativa de UINavigationController en
// iOS y Fragments en Android).
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Pantalla de Login. Único destino por ahora.
import LoginScreen from '../screens/auth/LoginScreen';

// Creamos la instancia del stack. La convención es llamarla "Stack"
// y exportarla si fuera necesario (aquí solo la usamos local).
const Stack = createNativeStackNavigator();

// Definimos y exportamos el navegador. Es un componente funcional
// sin estado ni lógica: solo declara las rutas disponibles.
const AuthNavigator = () => {
  return (
    // Stack.Navigator contiene todas las rutas del flujo.
    // screenOptions aplica opciones POR DEFECTO a todas las
    // pantallas; las pantallas individuales pueden sobreescribirlas.
    <Stack.Navigator
      // headerShown: false en TODAS las pantallas: cada pantalla
      // de auth maneja su propio header (o no lo tiene, como Login).
      // Así evitamos doble header y mantenemos control total del
      // diseño institucional.
      screenOptions={{
        headerShown: false,
        // animation: definimos slide_from_right (default en iOS)
        // para que la transición entre pantallas de auth se sienta
        // natural. Si añades una pantalla modal (ej: recuperación
        // de contraseña), usa "presentation: 'modal'".
        animation: 'slide_from_right',
        // contentStyle: fondo slate-50 institucional para todas
        // las pantallas del stack. Importante para que no se vean
        // flashes blancos durante las transiciones.
        contentStyle: { backgroundColor: '#f8fafc' }, // slate-50.
      }}
    >
      {/* ============================================
          RUTA: LOGIN
          name: identificador único de la ruta. Se usa con
          navigation.navigate('Login') o navigation.reset().
          component: el componente de pantalla a renderizar.
          ============================================ */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        // options específicas para esta pantalla (sobrescriben
        // las del Navigator). Aquí solo confirmamos que no hay
        // header, pero podríamos añadir gestos, transiciones
        // especiales, etc.
        options={{
          headerShown: false,
          // En iOS, deshabilitamos el gesto de "swipe to go back"
          // para evitar que el usuario salga accidentalmente del
          // login mientras está capturando credenciales.
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Exportamos por defecto. El AppNavigator lo importará y lo montará
// como una pantalla del Stack raíz.
export default AuthNavigator;
