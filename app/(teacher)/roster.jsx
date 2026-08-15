// =====================================================================
// app/(teacher)/roster.jsx
// ---------------------------------------------------------------------
// Ruta "/roster" del route group (teacher). Lista de alumnos de un
// grupo del maestro. Se abre desde el botón "Alumnos" de la card
// destacada en /groups (Mis Grupos), pasando { groupId, groupName }.
//
// DATA SOURCE:
//   - useGroupStudents(groupId): lista de alumnos del grupo.
//     Endpoint: GET /api/teacher-subjects/me/groups/:groupId/students
//   - useTeacherDashboard: info de la escuela (SchoolInfoCard).
//
// Misma estructura que take-attendance.jsx pero en modo SOLO LECTURA:
// aquí solo listamos a los alumnos (avatar + nombre + No. Control),
// sin botones P/R/F ni guardado de asistencia.
// =====================================================================

// React + hooks.
import React, { useMemo, useEffect } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';

// Navegación.
import { useRouter, useLocalSearchParams } from 'expo-router';

// Iconos Lucide.
import {
  ChevronLeft,
  Users,
  AlertCircle,
  GraduationCap,
} from 'lucide-react-native';

// Chrome compartido del grupo (teacher).
import DashboardHeader from '../../src/components/DashboardHeader';
import SchoolInfoCard from '../../src/components/SchoolInfoCard';

// Hooks.
import { useTeacherDashboard } from '../../src/hooks/useTeacherDashboard';
import { useGroupStudents } from '../../src/hooks/useGroupStudents';

// =====================================================================
// COMPONENTE: StudentRosterRow
// ---------------------------------------------------------------------
// Fila de un alumno en modo lectura: avatar (o iniciales), nombre
// formateado "N. Apellido1 Apellido2 Nombre" y No. Control.
// =====================================================================
function StudentRosterRow({ student, index }) {
  // Iniciales para el avatar fallback.
  const initials = useMemo(() => {
    const name = student.fullName || '';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, [student]);

  // Formatear nombre: "Numero. Apellido1 Apellido2 Nombre"
  // El backend envía "Nombre Apellido1 Apellido2".
  const displayName = useMemo(() => {
    const name = student.fullName || '';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 3) {
      const firstName = parts[0];
      const lastNames = parts.slice(1).join(' ');
      return `${index}. ${lastNames} ${firstName}`;
    }
    return `${index}. ${name}`;
  }, [student, index]);

  return (
    <View
      className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 mb-3 flex-row items-center"
      style={{ elevation: 1 }}
    >
      {/* Avatar o iniciales. */}
      {student.photoUrl ? (
        <Image
          source={{ uri: student.photoUrl }}
          className="w-12 h-12 rounded-full"
          accessibilityLabel={`Foto de ${student.fullName}`}
        />
      ) : (
        <View className="w-12 h-12 rounded-full bg-sky-100 items-center justify-center">
          <Text className="text-sm font-bold text-sky-700">
            {initials}
          </Text>
        </View>
      )}

      {/* Nombre + No. Control. */}
      <View className="flex-1 ml-3">
        <Text className="text-base font-bold text-slate-900" numberOfLines={2}>
          {displayName}
        </Text>
        <Text className="text-sm text-slate-500 mt-0.5">
          No. Control: {student.controlNumber}
        </Text>
      </View>
    </View>
  );
}

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function RosterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parámetros de navegación: { groupId, groupName } desde /groups.
  const groupId = params.groupId;
  const groupName = params.groupName || 'Grupo';

  // Datos de la escuela (SchoolInfoCard) desde el dashboard.
  const { data, isLoading: isLoadingDashboard } = useTeacherDashboard();

  // Alumnos del grupo vía useGroupStudents.
  const {
    data: groupData,
    isLoading: isLoadingStudents,
    error: studentsError,
    fetchStudents,
  } = useGroupStudents(groupId);

  // Cargar alumnos al montar o cuando cambie el groupId.
  useEffect(() => {
    if (groupId) {
      fetchStudents();
    }
  }, [groupId, fetchStudents]);

  const students = groupData?.students || [];

  // School info normalizada.
  const school = useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.currentSchoolYear?.name || null,
    };
  }, [data?.school, data?.currentSchoolYear]);

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header compartido: brand + campana. */}
      <DashboardHeader />

      {/* School info card. */}
      <SchoolInfoCard
        school={school}
        isLoading={isLoadingDashboard}
        className="mx-4 mt-4"
      />

      {/* Link "Volver". */}
      <Pressable
        onPress={() => router.back()}
        className="flex-row items-center px-4 mt-4"
        accessibilityRole="button"
        accessibilityLabel="Volver a mis grupos"
      >
        <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
        <Text className="text-sm font-semibold text-sky-600 ml-1">
          Volver
        </Text>
      </Pressable>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ============================================================
            ENCABEZADO DEL GRUPO
            ============================================================ */}
        <View className="px-4 mt-5">
          <Text className="text-[22px] font-bold text-slate-900">
            {groupName}
          </Text>

          {/* Badge contador de alumnos. */}
          <View className="self-start mt-2 px-3 py-1 rounded-full bg-[#E0F2FE]">
            <Text className="text-xs font-bold text-[#0369A1]">
              {students.length} Alumnos
            </Text>
          </View>
        </View>

        {/* ============================================================
            LISTA DE ALUMNOS
            ============================================================ */}
        <View className="px-4 mt-4">
          {isLoadingStudents ? (
            <View className="bg-white rounded-2xl p-6 items-center">
              <ActivityIndicator size="small" color="#0f172a" />
              <Text className="text-sm text-slate-500 mt-2">
                Cargando alumnos...
              </Text>
            </View>
          ) : studentsError ? (
            <View className="bg-white rounded-2xl p-6 items-center">
              <AlertCircle size={24} color="#e11d48" strokeWidth={2} />
              <Text className="text-sm text-rose-600 mt-2 text-center">
                {studentsError}
              </Text>
              <Pressable
                onPress={fetchStudents}
                className="mt-3 px-4 py-2 bg-sky-600 rounded-xl"
                accessibilityRole="button"
                accessibilityLabel="Reintentar carga de alumnos"
              >
                <Text className="text-sm font-semibold text-white">
                  Reintentar
                </Text>
              </Pressable>
            </View>
          ) : students.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center">
              <Users size={24} color="#94a3b8" strokeWidth={2} />
              <Text className="text-sm text-slate-500 mt-2 text-center">
                No hay alumnos registrados en este grupo.
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
              style={{ elevation: 2 }}
            >
              {students.map((student, index) => (
                <View key={student.controlNumber}>
                  <View className="px-1 pt-1">
                    <StudentRosterRow student={student} index={index + 1} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Pie informativo del prototipo: el total viene del backend. */}
        {groupData?.total !== undefined && !isLoadingStudents && !studentsError && (
          <View className="px-4 mt-1">
            <View className="flex-row items-center justify-center bg-white rounded-2xl py-3 border border-slate-100">
              <GraduationCap size={16} color="#0ea5e9" strokeWidth={2} />
              <Text className="text-sm font-semibold text-slate-600 ml-2">
                {groupData.total} alumnos en total
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
