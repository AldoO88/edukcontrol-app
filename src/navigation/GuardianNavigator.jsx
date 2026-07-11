// =====================================================================
// GuardianNavigator.js
// ---------------------------------------------------------------------
// Navegador principal para el rol "guardian" (padre/tutor).
// Usa un Bottom Tab Navigator con 3 pestañas:
//   1) Inicio       → GuardianDashboard
//   2) Asistencia   → AttendanceHistory
//   3) Avisos       → AnnouncementsScreen
// Cada tab tiene un icono vectorial (Lucide) y los colores siguen
// el sistema de diseño institucional (sky-500 activo, slate-500
// inactivo, fondo blanco, borde superior sutil).
// =====================================================================

// createBottomTabNavigator: API para crear una barra de pestañas
// inferior nativa. En iOS usa UITabBar; en Android usa BottomNavigationView.
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Iconos vectoriales de @expo/vector-icons (Lucide).
import { Home, CalendarCheck, Megaphone } from 'lucide-react-native';

// Pantallas del rol guardian.
import GuardianDashboard from '../screens/guardian/GuardianDashboard';
import AttendanceHistory from '../screens/guardian/AttendanceHistory';
import AnnouncementsScreen from '../screens/guardian/AnnouncementsScreen';

// Creamos la instancia del tab navigator.
const Tab = createBottomTabNavigator();

// Componente: renderiza el icono correspondiente a cada tab según
// si está enfocado o no. Es un sub-componente del Navigator para
// mantener todo el código de navegación autocontenido.
const renderTabIcon = (routeName, focused) => {
  // Definimos un mapa de nombre → componente de icono. Esto evita
  // un switch/case repetitivo y es más fácil de mantener.
  const iconMap = {
    Inicio: Home,
    Asistencia: CalendarCheck,
    Avisos: Megaphone,
  };

  // Obtenemos el componente de icono para la ruta actual.
  const IconComponent = iconMap[routeName];

  // Si por alguna razón no hay icono definido, devolvemos null
  // (esto no debería pasar si declaramos bien las tabs abajo).
  if (!IconComponent) return null;

  // Color: sky-500 cuando está activo, slate-400 cuando no.
  // strokeWidth ligeramente mayor cuando está activo (2.5 vs 2)
  // para dar feedback visual adicional.
  const color = focused ? '#0ea5e9' : '#94a3b8';
  const strokeWidth = focused ? 2.5 : 2;

  // Renderizamos el icono con el tamaño estándar de tabs (24px).
  return <IconComponent size={24} color={color} strokeWidth={strokeWidth} />;
};

// Definimos y exportamos el navegador.
const GuardianNavigator = () => {
  return (
    <Tab.Navigator
      // screenOptions recibe la ruta como argumento (además de las
      // props estándar) para poder personalizar el icono por tab.
      screenOptions={({ route }) => ({
        // headerShown: false porque cada pantalla dibuja su propio
        // header (con SafeAreaView y estilos institucionales).
        headerShown: false,
        // tabBarActiveTintColor: color del texto/icono cuando la
        // tab está activa. Lo centralizamos aquí para que TODAS
        // las tabs lo respeten.
        tabBarActiveTintColor: '#0ea5e9', // sky-500.
        // tabBarInactiveTintColor: color cuando NO está activa.
        tabBarInactiveTintColor: '#94a3b8', // slate-400.
        // tabBarShowLabel: true muestra el texto bajo el icono.
        // Lo dejamos en true para que el usuario sepa qué es cada tab.
        tabBarShowLabel: true,
        // tabBarLabelStyle: tipografía de la etiqueta.
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        // tabBarStyle: estilos del contenedor del tab bar.
        // - backgroundColor blanco para que flote sobre el contenido.
        // - borderTopColor slate-200 para una línea sutil.
        // - paddingBottom: en iOS respetamos el safe-area del home
        //   indicator (gestionado automáticamente por la librería).
        // - height: 60 para que sea cómodo de tocar.
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0', // slate-200.
          paddingTop: 6,
          paddingBottom: 6,
          height: 60,
        },
        // tabBarIcon: función que devuelve el JSX del icono.
        // Usamos "focused" para diferenciar activo/inactivo.
        tabBarIcon: ({ focused }) => renderTabIcon(route.name, focused),
        // tabBarAccessibilityLabel: se le pasa a ScreenReader.
        // Lo definimos por pantalla abajo.
      })}
    >
      {/* ============================================
          TAB 1: INICIO
          Resumen del día con estado de los hijos.
          ============================================ */}
      <Tab.Screen
        name="Inicio"
        component={GuardianDashboard}
        options={{
          // accessibilityLabel: leído por VoiceOver/TalkBack.
          tabBarAccessibilityLabel: 'Pantalla de inicio',
        }}
      />

      {/* ============================================
          TAB 2: ASISTENCIA
          Historial de asistencia de los hijos.
          ============================================ */}
      <Tab.Screen
        name="Asistencia"
        component={AttendanceHistory}
        options={{
          tabBarAccessibilityLabel: 'Historial de asistencia',
        }}
      />

      {/* ============================================
          TAB 3: AVISOS
          Comunicados oficiales de la escuela.
          ============================================ */}
      <Tab.Screen
        name="Avisos"
        component={AnnouncementsScreen}
        options={{
          tabBarAccessibilityLabel: 'Avisos y comunicados',
        }}
      />
    </Tab.Navigator>
  );
};

export default GuardianNavigator;
