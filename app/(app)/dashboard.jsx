// =====================================================================
// app/(app)/dashboard.jsx
// ---------------------------------------------------------------------
// Ruta "/dashboard". ÚNICA ruta post-login de la app por ahora.
//
// Esta pantalla implementa el "Render Condicional por Rol" (opción
// 2 del plan de migración). En lugar de tener un dashboard.jsx en
// cada route group —lo que generaba una colisión de URL porque los
// paréntesis NO aparecen en la URL— tenemos UN SOLO dashboard que
// consulta el rol del usuario y renderiza el placeholder apropiado.
//
// Flujo:
//   1) Si el AuthContext sigue restaurando sesión → splash.
//   2) Si no hay usuario → Redirect al login (safety net; el
//      layout raíz ya debería habernos redirigido antes).
//   3) Si user.role === 'teacher'  → TeacherDashboardPlaceholder.
//   4) Si user.role === 'parent' → GuardianDashboard.
//   5) Cualquier otro rol (dato corrupto del backend) → fallback.
//
// Cuando agreguemos rutas internas (asistencia, calificaciones,
// mensajes, etc.), el rol ya estará garantizado por el flujo del
// login: este dashboard seguirá siendo el landing post-login.
// =====================================================================

// Primitivas RN: View, Text, ActivityIndicator para el splash.
import { View, Text, ActivityIndicator } from 'react-native';

// Redirect: navegación declarativa de expo-router.
import { Redirect } from 'expo-router';

// Hook de auth: provee { user, isLoading, isAuthenticated, userRole }.
import { useAuth } from '../../src/hooks/useAuth';

// Placeholders privados del grupo (viven en _components/, no son
// rutas porque empiezan con "_"). Cada uno encapsula la UI del
// dashboard de su rol. El guardian ya tiene UI real; el teacher
// sigue en placeholder hasta que se implemente.
import TeacherDashboardPlaceholder from './_components/TeacherDashboardPlaceholder';
import GuardianDashboard from './_components/GuardianDashboard';

// Splash interno: se muestra mientras el AuthContext está
// restaurando la sesión. Mismo estilo visual que el LoadingSplash
// del antiguo AppNavigator para mantener la coherencia.
function DashboardSplash() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50">
      <ActivityIndicator size="large" color="#0f172a" />
      <Text className="text-slate-500 text-sm mt-4 font-medium">
        Cargando EdukControl...
      </Text>
    </View>
  );
}

// Fallback: si el rol del usuario no es ninguno de los esperados
// (caso "huérfano" o token con payload corrupto), mostramos una
// pantalla segura en lugar de crashear. El usuario puede hacer
// logout y reintentar.
function UnknownRoleFallback() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 px-6">
      <View
        className="bg-white rounded-2xl p-8 w-full max-w-sm items-center border border-slate-100"
        style={{ elevation: 3 }}
      >
        <Text className="text-rose-600 text-base font-bold text-center">
          Rol no reconocido
        </Text>
        <Text className="text-slate-500 text-sm text-center mt-2">
          Tu cuenta no tiene un rol válido asignado. Cierra sesión
          e inténtalo de nuevo, o contacta al administrador de la
          escuela.
        </Text>
      </View>
    </View>
  );
}

export default function Dashboard() {
  // Consumimos el contexto. userRole ya viene calculado en el
  // AuthContext como user?.role || null.
  const { user, isLoading, userRole } = useAuth();

  console.log('[dashboard] userRole:', userRole);

  // 1) Estado de carga: mientras AuthContext está leyendo de
  //    AsyncStorage y verificando el token contra el backend,
  //    mostramos splash. Evita el "flash" del login.
  if (isLoading) {
    return <DashboardSplash />;
  }

  // 2) Sin usuario: safety net. El layout raíz ya debería haber
  //    redirigido, pero si por algún motivo llegamos acá, mandamos
  //    al login.
  if (!user) {
    console.warn('[dashboard] No hay usuario logueado; redirigiendo al login.');
    return <Redirect href="/" />;
  }

  // 3) y 4) RENDER CONDICIONAL POR ROL (opción 2).
  //    Aquí está la magia: en lugar de tener dos archivos
  //    dashboard.jsx (uno por route group) que colisionan en la
  //    URL, tenemos UNO SOLO que decide qué subtree renderizar
  //    según el rol del usuario.
  //
  //    Esto es lo que hace que la app sea multi-rol sin
  //    multiplicar URLs ni layouts: el routing se mantiene
  //    agnóstico al rol, y la decisión vive en este switch.
  if (userRole === 'teacher') {
    return <TeacherDashboardPlaceholder />;
  }

  if (userRole === 'tutor') {
    return <GuardianDashboard />;
  }

  // 5) Fallback: rol desconocido. Mejor mostrar UI explícita que
  //    una pantalla en blanco.
  return <UnknownRoleFallback />;
}
