// =====================================================================
// app/(teacher)/attendance.jsx
// ---------------------------------------------------------------------
// Ruta "/attendance" del grupo (teacher) — shared route con el tutor.
// Pantalla de ASISTENCIA del maestro.
//
// El maestro toma asistencia desde el dashboard (quick action "Tomar
// asistencia" → /take-attendance). Esta pantalla es el placeholder
// de la vista de historial/resumen de asistencia (TODO pendiente,
// mismo estado que en la versión previa del proyecto).
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text.
import { View, Text } from 'react-native';

// Icono decorativo (lista de asistencia).
import { ClipboardCheck } from 'lucide-react-native';

// Chrome compartido del grupo.
import DashboardHeader from '../../src/components/DashboardHeader';
import SchoolInfoCard from '../../src/components/SchoolInfoCard';
import BottomTabBar from '../../src/components/BottomTabBar';

// Tabs del maestro (fuente única).
import { TEACHER_TABS } from '../../src/constants/navigationTabs';

// Hook del dashboard docente: nos da la info de la escuela.
import { useTeacherDashboard } from '../../src/hooks/useTeacherDashboard';

export default function TeacherAttendanceScreen() {
  const { data, isLoading } = useTeacherDashboard();

  // Escuela activa: los mismos datos que usa el dashboard.
  const school = data
    ? {
        name: data.school?.name,
        logo_url: data.school?.logoUrl,
        current_school_year: data.currentSchoolYear?.name,
      }
    : null;

  return (
    <View className="flex-1 bg-slate-50">
      <DashboardHeader />
      <View className="flex-1">
        <SchoolInfoCard school={school} isLoading={isLoading} className="mx-4 mt-4" />

        {/* Placeholder de la vista de asistencia. */}
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="bg-white rounded-2xl p-8 w-full max-w-sm items-center border border-slate-100"
            style={{ elevation: 3 }}
          >
            <View className="w-16 h-16 rounded-full bg-sky-50 items-center justify-center mb-4">
              <ClipboardCheck size={28} color="#0ea5e9" strokeWidth={2.25} />
            </View>
            <Text className="text-xl font-bold text-slate-900 text-center">
              Asistencia del docente
            </Text>
            <Text className="text-slate-500 text-sm text-center mt-2">
              Placeholder. Aquí vivirá el historial de asistencia
              de los grupos del maestro.
            </Text>
          </View>
        </View>
      </View>
      <BottomTabBar tabs={TEACHER_TABS} />
    </View>
  );
}
