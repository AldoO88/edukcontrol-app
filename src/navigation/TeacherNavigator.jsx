// =====================================================================
// TeacherNavigator.js
// ---------------------------------------------------------------------
// Navegador principal para el rol "teacher" (maestro).
// Usa un Stack Navigator (no Bottom Tabs) porque las pantallas del
// docente son más "task-oriented": navegas entre funciones (pase de
// lista, calificaciones, mensajes) y vuelves al dashboard.
//
// Estructura:
//   - TeacherDashboard (raíz del stack, con su propio header).
//   - AttendanceCheck (pase de lista).
//   - GradesUpload (subir calificaciones).
//   - SendMessage (enviar mensaje a padres).
// El header lo gestiona cada pantalla individualmente (como en el
// flujo guardian) para mantener la coherencia visual.
// =====================================================================

// createNativeStackNavigator: stack con transiciones nativas.
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Pantallas del rol teacher.
import TeacherDashboard from '../screens/teacher/TeacherDashboard';
import AttendanceCheck from '../screens/teacher/AttendanceCheck';
import GradesUpload from '../screens/teacher/GradesUpload';
import SendMessageScreen from '../screens/teacher/SendMessageScreen';

// Creamos la instancia del stack.
const Stack = createNativeStackNavigator();

// Definimos y exportamos el navegador.
const TeacherNavigator = () => {
  return (
    <Stack.Navigator
      // screenOptions globales: header oculto y contenido con
      // fondo slate-50 (consistencia con el resto de la app).
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      {/* ============================================
          RUTA RAÍZ: DASHBOARD DEL DOCENTE
          ============================================ */}
      <Stack.Screen
        name="TeacherDashboard"
        component={TeacherDashboard}
        options={{
          // No permitimos "swipe to go back" en el dashboard porque
          // es la raíz del flujo del docente; no hay a dónde ir.
          gestureEnabled: false,
        }}
      />

      {/* ============================================
          RUTA: PASE DE LISTA
          Se llega con navigation.navigate('AttendanceCheck').
          ============================================ */}
      <Stack.Screen
        name="AttendanceCheck"
        component={AttendanceCheck}
      />

      {/* ============================================
          RUTA: SUBIR CALIFICACIONES
          ============================================ */}
      <Stack.Screen
        name="GradesUpload"
        component={GradesUpload}
      />

      {/* ============================================
          RUTA: ENVIAR MENSAJE A PADRES
          ============================================ */}
      <Stack.Screen
        name="SendMessage"
        component={SendMessageScreen}
      />
    </Stack.Navigator>
  );
};

export default TeacherNavigator;
