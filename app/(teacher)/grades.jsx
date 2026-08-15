// =====================================================================
// app/(teacher)/grades.jsx
// ---------------------------------------------------------------------
// Ruta "/grades" del grupo (teacher) — shared route con el tutor.
// Pantalla de CALIFICACIONES/HORARIO del maestro.
//
// El tab "Horario" del maestro apunta aquí (ver TEACHER_TABS en
// src/constants/navigationTabs.js). Es el placeholder de la vista de
// horario/grupos del docente (TODO pendiente, mismo estado que en la
// versión previa del proyecto).
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text.
import { View, Text } from 'react-native';

// Icono decorativo (calendario/horario).
import { CalendarDays } from 'lucide-react-native';

// Chrome compartido del grupo.
import DashboardHeader from '../../src/components/DashboardHeader';
import SchoolInfoCard from '../../src/components/SchoolInfoCard';
import BottomTabBar from '../../src/components/BottomTabBar';

// Tabs del maestro (fuente única).
import { TEACHER_TABS } from '../../src/constants/navigationTabs';

// Hook del dashboard docente: nos da la info de la escuela.
import { useTeacherDashboard } from '../../src/hooks/useTeacherDashboard';

export default function TeacherGradesScreen() {
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

        {/* Placeholder de la vista de horario. */}
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="bg-white rounded-2xl p-8 w-full max-w-sm items-center border border-slate-100"
            style={{ elevation: 3 }}
          >
            <View className="w-16 h-16 rounded-full bg-sky-50 items-center justify-center mb-4">
              <CalendarDays size={28} color="#0ea5e9" strokeWidth={2.25} />
            </View>
            <Text className="text-xl font-bold text-slate-900 text-center">
              Horario del docente
            </Text>
            <Text className="text-slate-500 text-sm text-center mt-2">
              Placeholder. Aquí vivirá el horario y los grupos
              del maestro.
            </Text>
          </View>
        </View>
      </View>
      <BottomTabBar tabs={TEACHER_TABS} />
    </View>
  );
}
