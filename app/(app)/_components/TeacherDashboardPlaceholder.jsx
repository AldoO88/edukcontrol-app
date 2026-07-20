// =====================================================================
// app/(app)/_components/TeacherDashboardPlaceholder.jsx
// ---------------------------------------------------------------------
// Placeholder PRIVADO de la pantalla "Dashboard del Docente". Vive
// dentro de app/(app)/_components/, una carpeta con prefijo "_"
// que expo-router IGNORA para el routing (no genera ninguna URL).
//
// Esto nos permite tener componentes específicos de este grupo de
// rutas sin contaminar la URL ni el árbol de navegación. Cuando
// implementemos el dashboard real del docente, reemplazaremos el
// contenido de este archivo (o lo importaremos desde un componente
// de mayor nivel).
// =====================================================================

// Primitivas RN: View, Text.
import { View, Text } from 'react-native';

// Icono decorativo (pizarrón / marcador).
import { BookOpenCheck } from 'lucide-react-native';

// Screen wrapper institucional (SafeAreaView + defaults de fondo).
import Screen from '../../../src/components/Screen';

export default function TeacherDashboardPlaceholder() {
  return (
    // edges=[]: este placeholder va a pintar su propio header
    // propio (brand + campana) en algún punto; por ahora el Screen
    // no debe reservar el top edge para no duplicar la safe area.
    <Screen edges={[]} background="bg-slate-50" scroll={false}>
      <View className="flex-1 items-center justify-center px-6">
        {/* Card blanca con la estética del sistema de diseño. */}
        <View
          className="bg-white rounded-2xl p-8 w-full max-w-sm items-center border border-slate-100"
          style={{ elevation: 3 }}
        >
          {/* Ícono de badge sky-50 (acento activo del sistema). */}
          <View className="w-16 h-16 rounded-full bg-sky-50 items-center justify-center mb-4">
            <BookOpenCheck size={28} color="#0ea5e9" strokeWidth={2.25} />
          </View>

          <Text className="text-xl font-bold text-slate-900 text-center">
            Dashboard del docente
          </Text>

          <Text className="text-slate-500 text-sm text-center mt-2">
            Placeholder. Aquí vivirá el resumen del maestro:
            clases del día, pase de lista, calificaciones
            pendientes, mensajes, etc.
          </Text>
        </View>
      </View>
    </Screen>
  );
}
