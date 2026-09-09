// =====================================================================
// app/(teacher)/(tabs)/groups/index.jsx
// ---------------------------------------------------------------------
// Ruta "/groups" del route group (teacher). Pantalla "Mis Grupos y
// Asignaturas" del MAESTRO (rol "teacher").
//
// Ahora conecta al endpoint real:
//   GET /api/teacher-subjects/me/groups-with-schedule
//
// Retorna los grupos del maestro con su horario del día actual
// (o el primero si hoy no tiene clase).
// =====================================================================

// React.
import React, { useState, useEffect } from 'react';

// Primitivas RN: View, Text, Pressable, ScrollView, ActivityIndicator.
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';

// Navegación: useRouter para navegar a los destinos de cada card.
import { useRouter } from 'expo-router';

// Iconos Lucide.
import {
  UserCheck,
  FileSpreadsheet,
  List,
  Users,
  Clock,
  MapPin,
  Calendar,
} from 'lucide-react-native';

// Chrome compartido del grupo (teacher).
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Hook del dashboard del teacher.
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';

// Servicio para obtener grupos con horario.
import { getGroupsForTeacher } from '@/src/services/teacherService';

// Helper para resolver color e ícono de materia.
import {
  getSubjectIcon,
  getSubjectColor,
  tintWithAlpha,
} from '@/src/utils/subjectIcons';
// ---------------------------------------------------------------------
// PALETA
// ---------------------------------------------------------------------
const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.04,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function TeacherGroupsScreen() {
  const router = useRouter();
  const { data } = useTeacherDashboard();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Normalizar school al shape que consume SchoolInfoCard.
  const school = React.useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.currentSchoolYear?.name || null,
    };
  }, [data?.school, data?.currentSchoolYear]);

  const currentDate = data?.currentDate || '';

  // ============================================================
  // FETCH: grupos con horario
  // ============================================================
  useEffect(() => {
    let cancelled = false;
    const fetchGroups = async () => {
      setLoading(true);
      const result = await getGroupsForTeacher();
      if (cancelled) return;
      if (result.success) {
        setGroups(result.data?.groups || []);
      } else {
        Alert.alert('Error', result.message || 'No se pudieron cargar los grupos.');
      }
      setLoading(false);
    };
    fetchGroups();
    return () => { cancelled = true; };
  }, []);

  // ============================================================
  // HANDLERS
  // ============================================================
  const goTakeAttendance = (group) => {
    router.push({
      pathname: `/(teacher)/groups/${group._id}/attendance`,
      params: { groupName: group.label, subjectId: group.subject?._id },
    });
  };

  const goGrades = (group) => {
    router.push({
      pathname: `/(teacher)/groups/${group._id}/grades`,
      params: { groupName: group.label, subjectId: group.subject?._id },
    });
  };

  const goDirectorio = (group) => {
    router.push({
      pathname: `/(teacher)/groups/${group._id}/students`,
      params: {
        groupName: group.label,
        subjectId: group.subject?._id,
        isTutoria: group.subject?.isTutoria ? 'true' : 'false',
        subjectName: group.subject?.name || '',
        totalStudents: group.totalStudents || 0,
      },
    });
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Header compartido del maestro. */}
      <DashboardHeader />

      {/* School info card. */}
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-2"
        teacher={data?.teacher}
        date={currentDate}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* ==========================================================
            SECCIÓN "Mis Grupos y Asignaturas" + badge contador
            ========================================================== */}
        <View className="mt-5">
          <Text className="text-[22px] font-bold text-[#0F172A]">
            Mis Grupos y Asignaturas
          </Text>

          {/* Badge contador. */}
          <View className="self-start mt-2 px-3 py-1 rounded-full bg-[#E0F2FE]">
            <Text className="text-xs font-bold text-[#0369A1]">
              {groups.length} Grupo{groups.length !== 1 ? 's' : ''} Asignado{groups.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Loading. */}
        {loading && (
          <View className="items-center justify-center mt-12">
            <ActivityIndicator size="large" color="#0284C7" />
            <Text className="text-slate-400 text-sm mt-3">
              Cargando grupos...
            </Text>
          </View>
        )}

        {/* ==========================================================
            CARDS DE GRUPOS
            ========================================================== */}
        {!loading && (
          <View className="mt-4">
            {groups.length === 0 && (
              <Text className="text-slate-400 text-center text-sm py-6">
                No tienes grupos asignados.
              </Text>
            )}
            {groups.map((group) => {
              const macroCategory = group.subject?.macroCategory || 'Sin categoría';
              const schedule = group.schedule;
              const timeRange = schedule
                ? `${schedule.startTime} - ${schedule.endTime}`
                : '—';
              const classroom = schedule?.classroom || '—';

              // Color/icon vienen del backend a nivel de subject.
              // Si faltan, caen al fallback definido en subjectIcons.
              const subjectColor = getSubjectColor(group.subject?.color);
              const SubjectIcon = getSubjectIcon(group.subject?.icon);
              const tagBg = tintWithAlpha(subjectColor, 0.12);
              const tagTextColor = subjectColor;

              return (
                <View
                  key={group._id}
                  className="bg-white rounded-[20px] p-4 mb-4 border border-[#F1F5F9]"
                  style={[
                    CARD_SHADOW,
                    {
                      borderLeftWidth: 4,
                      borderLeftColor: subjectColor,
                    },
                  ]}
                >
                  {/* Header: ícono + título (izq) + tag (der). */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 mr-2">
                      <View
                        className="items-center justify-center rounded-lg mr-2"
                        style={{
                          backgroundColor: tagBg,
                          width: 32,
                          height: 32,
                        }}
                      >
                        <SubjectIcon size={16} color={subjectColor} strokeWidth={2.25} />
                      </View>
                      <Text
                        className="text-[17px] font-bold text-[#0F172A] flex-1"
                        numberOfLines={1}
                      >
                        {group.label}
                      </Text>
                    </View>
                    <View
                      className="flex-row items-center px-2.5 py-1 rounded-lg ml-2"
                      style={{ backgroundColor: tagBg }}
                    >
                      <Text
                        className="text-[11px] font-bold"
                        style={{ color: tagTextColor }}
                      >
                        {macroCategory}
                      </Text>
                    </View>
                  </View>

                  {/* Materia (debajo del título). */}
                  {group.subject?.name && (
                    <Text className="text-[13px] text-[#64748B] mt-1">
                      {group.subject.name}
                    </Text>
                  )}

                  {/* Info: alumnos / horario / aula. */}
                  <View className="mt-3">
                    <View className="flex-row items-center">
                      <Users size={15} color="#64748B" strokeWidth={2} />
                      <Text className="text-[13px] text-[#475569] ml-2">
                        {group.totalStudents} Alumnos
                      </Text>
                    </View>
                    <View className="flex-row items-center mt-1.5">
                      <Clock size={15} color="#64748B" strokeWidth={2} />
                      <Text className="text-[13px] text-[#475569] ml-2">
                        {schedule?.dayName || '—'} {timeRange}
                      </Text>
                    </View>
                    <View className="flex-row items-center mt-1.5">
                      <MapPin size={15} color="#64748B" strokeWidth={2} />
                      <Text className="text-[13px] text-[#475569] ml-2">
                        {classroom}
                      </Text>
                    </View>
                    {/* Badge "Hoy" si el grupo tiene clase hoy. */}
                    {schedule?.isToday && (
                      <View className="flex-row items-center mt-1.5">
                        <Calendar size={15} color="#0284C7" strokeWidth={2} />
                        <View className="ml-2 px-2 py-0.5 rounded-full bg-[#E0F2FE]">
                          <Text className="text-[11px] font-bold text-[#0369A1]">
                            Hoy
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Botones de acción. */}
                  <View className="flex-row mt-4">
                    {/* Asistencia. */}
                    <Pressable
                      onPress={() => goTakeAttendance(group)}
                      className="flex-1 flex-row items-center justify-center bg-[#0284C7] active:bg-[#0369A1] rounded-xl py-3"
                      accessibilityRole="button"
                      accessibilityLabel={`Pase de lista de ${group.label}`}
                    >
                      <UserCheck size={16} color="#ffffff" strokeWidth={2.25} />
                      <Text className="text-white font-bold text-[12px] ml-1.5">
                        Asistencia
                      </Text>
                    </Pressable>

                    {/* Calificar. */}
                    <Pressable
                      onPress={() => goGrades(group)}
                      className="flex-1 flex-row items-center justify-center bg-white border border-[#E2E8F0] rounded-xl py-3 ml-2"
                      accessibilityRole="button"
                      accessibilityLabel={`Calificar ${group.label}`}
                    >
                      <FileSpreadsheet size={16} color="#0F172A" strokeWidth={2.25} />
                      <Text className="text-[#0F172A] font-bold text-[12px] ml-1.5">
                        Calificar
                      </Text>
                    </Pressable>

                    {/* Alumnos. */}
                    <Pressable
                      onPress={() => goDirectorio(group)}
                      className="flex-1 flex-row items-center justify-center bg-white border border-[#E2E8F0] rounded-xl py-3 ml-2"
                      accessibilityRole="button"
                      accessibilityLabel={`Directorio de alumnos de ${group.label}`}
                    >
                      <List size={16} color="#0F172A" strokeWidth={2.25} />
                      <Text className="text-[#0F172A] font-bold text-[12px] ml-1.5">
                        Alumnos
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
