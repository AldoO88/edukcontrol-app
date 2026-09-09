// =====================================================================
// app/(teacher)/(tabs)/groups/[groupId]/index.jsx
// ---------------------------------------------------------------------
// Ruta "/groups/:groupId" del route group (teacher). Pantalla de
// DETALLE de un grupo: muestra info del grupo (nombre, tag, horario,
// aula, nº alumnos) y las 3 acciones disponibles sobre el grupo:
//
//   ┌────────────────────────────────────────┐
//   │ DashboardHeader (brand + 🔔)          │
//   ├────────────────────────────────────────┤
//   │ SchoolInfoCard compuesta                │
//   ├────────────────────────────────────────┤
//   │ < Volver                                │  ← back a /groups
//   ├────────────────────────────────────────┤
//   │ Card Grupo                             │
//   │ - [tag TALLER TÉCNICO]   1° OFIMÁTICA │
//   │ - 👥 35 Alumnos                         │
//   │ - 🕒 Hoy 08:00 - 09:40               │
//   │ - 📍 Taller 2                           │
//   ├────────────────────────────────────────┤
//   │ 3 botones de acción:                    │
//   │   [Asistencia] [Calificar] [Alumnos]  │
//   ├────────────────────────────────────────┤
//   │ BottomTabBar (Mis Grupos activo)       │
//   └────────────────────────────────────────┘
//
// Las 3 acciones navegan a sub-rutas del grupo (drill-down anidado).
// =====================================================================

// React.
import React, { useMemo, useState, useEffect } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Navegación.
import { useRouter, useLocalSearchParams } from 'expo-router';

// Iconos Lucide.
import {
  ChevronLeft,
  UserCheck,         // Botón "Asistencia" (Pase de Lista).
  FileSpreadsheet,   // Botón "Calificar".
  List,              // Botón "Alumnos".
  Users,             // Info: nº alumnos.
  Clock,             // Info: horario.
  MapPin,            // Info: aula.
  Calendar,
} from 'lucide-react-native';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// NOTA: BottomTabBar + TEACHER_TABS ya NO se importan aquí. La barra
// de navegación inferior es pintada por el Tabs navigator raíz
// (app/(teacher)/(tabs)/_layout.jsx) vía la prop `tabBar`. Si la
// pintamos en cada pantalla provoca doble render.

// Hook del dashboard docente (escuela + maestro).
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';

// Servicio para obtener grupos reales del maestro.
import { getGroupsForTeacher } from '@/src/services/teacherService';

// Helper para resolver color e ícono de materia.
import {
  getSubjectIcon,
  getSubjectColor,
  tintWithAlpha,
} from '@/src/utils/subjectIcons';
// ---------------------------------------------------------------------
// Sombra estandar de card según spec (multiplica para iOS/Android).
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
export default function GroupDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const groupId = params.groupId;

  // Estado de carga de grupos desde el API real.
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Fetch grupos del maestro desde el endpoint real.
  useEffect(() => {
    let cancelled = false;
    const fetchGroups = async () => {
      setLoadingGroups(true);
      const result = await getGroupsForTeacher();
      if (cancelled) return;
      if (result.success) {
        setGroups(result.data?.groups || []);
      }
      setLoadingGroups(false);
    };
    fetchGroups();
    return () => { cancelled = true; };
  }, []);

  // Lookup del grupo por _id (MongoDB ObjectId del API real).
  const group = useMemo(
    () => groups.find((g) => g._id === groupId),
    [groups, groupId],
  );

  // Dashboard data (escuela + maestro + fecha). Mismo endpoint que el
  // resto del grupo (teacher), patrón consistente.
  const { data } = useTeacherDashboard();
  const currentDate = data?.currentDate || 'Viernes, 14 de agosto';
  const school = useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.currentSchoolYear?.name || null,
    };
  }, [data?.school, data?.currentSchoolYear]);

  // Datos derivados del grupo real para el template.
  const schedule = group?.schedule;
  const timeRange = schedule
    ? `${schedule.startTime} - ${schedule.endTime}`
    : '—';
  const classroom = schedule?.classroom || '—';
  const macroCategory = group?.subject?.macroCategory || '';
  const totalStudents = group?.totalStudents || 0;

  // Determinar si es grupo de Tutoría/Ed. Socioemocional.
  // Fuente primaria: subject.isTutoria (si el API lo manda).
  // Fallback: detectar por macroCategory o nombre de materia.
  const isTutoria = useMemo(() => {
    if (group?.subject?.isTutoria) return true;
    const macro = (macroCategory || '').toLowerCase();
    const subjectName = (group?.subject?.name || '').toLowerCase();
    return (
      macro.includes('tutoría') ||
      macro.includes('tutoria') ||
      macro.includes('socioemocional') ||
      subjectName.includes('tutoría') ||
      subjectName.includes('tutoria') ||
      subjectName.includes('socioemocional')
    );
  }, [group?.subject?.isTutoria, macroCategory, group?.subject?.name]);

  // ---------------------------------------------------------------------
  // NAVEGACIÓN A LAS 3 SUB-RUTAS DEL GRUPO
  // ---------------------------------------------------------------------
  // Cada acción navega a la sub-ruta correspondiente del grupo (drill-
  // down). Las URLs reflejan la jerarquía: /groups/:groupId/<action>.
  const goAttendance = () => {
    router.push({
      pathname: `/(teacher)/groups/${groupId}/attendance`,
      params: { groupName: group?.label || 'Grupo', subjectId: group?.subject?._id },
    });
  };
  const goGrades = () => {
    router.push({
      pathname: `/(teacher)/groups/${groupId}/grades`,
      params: { groupName: group?.label || 'Grupo', subjectId: group?.subject?._id },
    });
  };
  const goStudents = () => {
    router.push({
      pathname: `/(teacher)/groups/${groupId}/students`,
      params: {
        groupName: group?.label || 'Grupo',
        subjectId: group?.subject?._id,
        isTutoria: isTutoria ? 'true' : 'false',
        subjectName: group?.subject?.name || '',
        totalStudents: totalStudents,
      },
    });
  };

  // ---------------------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------------------
  if (loadingGroups) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <ActivityIndicator size="large" color="#0284C7" />
        <Text className="text-slate-400 text-sm mt-3">Cargando grupo...</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------
  // NOT FOUND
  // ---------------------------------------------------------------------
  if (!group) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <Text
          className="text-slate-900"
          style={{ fontSize: 16, fontWeight: '700' }}
        >
          Grupo no encontrado
        </Text>
        <Text
          className="text-slate-500 mt-1"
          style={{ fontSize: 12 }}
        >
          {`ID: ${groupId}`}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-4 py-2 rounded-xl"
          style={{ backgroundColor: '#0284C7' }}
        >
          <Text className="text-white font-bold">Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* ============================================================
          CHROME COMPARTIDO (brand + school card)
          ============================================================ */}
      <DashboardHeader />
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-2"
        teacher={data?.teacher}
        date={currentDate}
      />

      {/* Botón "Volver" → lista de grupos. */}
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
        contentContainerStyle={{
          paddingBottom: insets.bottom + 96,
        }}
      >
        {/* ============================================================
            CARD DEL GRUPO
            ============================================================ */}
        <View
          className="bg-white rounded-[20px] p-4 mx-4 mt-3 mb-3 border border-slate-100"
          style={[
            CARD_SHADOW,
            // Color del borde izquierdo viene del backend (subject.color).
            { borderLeftWidth: 4, borderLeftColor: getSubjectColor(group.subject?.color) },
          ]}
        >
          {/* Header: ícono + título (izq) + tag (der). */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <View
                className="items-center justify-center rounded-lg mr-2"
                style={{
                  backgroundColor: tintWithAlpha(getSubjectColor(group.subject?.color), 0.12),
                  width: 32,
                  height: 32,
                }}
              >
                {(() => {
                  const Icon = getSubjectIcon(group.subject?.icon);
                  return <Icon size={16} color={getSubjectColor(group.subject?.color)} strokeWidth={2.25} />;
                })()}
              </View>
              <Text
                className="text-slate-900 flex-1"
                style={{ fontSize: 17, fontWeight: '700' }}
                numberOfLines={1}
              >
                {group.label}
              </Text>
            </View>
            <View
              className="flex-row items-center px-2.5 py-1 rounded-lg ml-2"
              style={{
                backgroundColor: tintWithAlpha(getSubjectColor(group.subject?.color), 0.12),
              }}
            >
              <Text
                className="text-[11px] font-bold"
                style={{ color: getSubjectColor(group.subject?.color) }}
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
                {totalStudents} Alumnos
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

          {/* Botón "Ver Horario" — solo para materias de Tutoría. */}
          {isTutoria && (
            <Pressable
              onPress={() => router.push('/(teacher)/schedule')}
              className="mt-3 flex-row items-center justify-center py-2.5 rounded-xl"
              style={{ backgroundColor: '#EFF6FF' }}
              accessibilityRole="button"
              accessibilityLabel="Ver horario del grupo"
            >
              <Clock size={16} color="#2563EB" strokeWidth={2.5} />
              <Text
                className="ml-2"
                style={{ fontSize: 13, fontWeight: '700', color: '#2563EB' }}
              >
                Ver Horario del Grupo
              </Text>
            </Pressable>
          )}
        </View>

        {/* ============================================================
            3 BOTONES DE ACCIÓN (Asistencia / Calificar / Alumnos)
            ============================================================ */}
        <View className="px-4">
          <Text
            className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2"
          >
            Acciones del Grupo
          </Text>

          <View className="flex-row" style={{ gap: 8 }}>
            {/* Pase de Lista: botón primario #0284C7. */}
            <Pressable
              onPress={goAttendance}
              accessibilityRole="button"
              accessibilityLabel={`Pase de lista de ${group.label}`}
              className="flex-1 flex-row items-center justify-center rounded-xl py-3"
              style={{ backgroundColor: '#0284C7' }}
            >
              <UserCheck size={16} color="#ffffff" strokeWidth={2.25} />
              <Text className="text-white font-bold text-[12px] ml-1.5">
                Asistencia
              </Text>
            </Pressable>

            {/* Calificar: botón outline. */}
            <Pressable
              onPress={goGrades}
              accessibilityRole="button"
              accessibilityLabel={`Calificar ${group.label}`}
              className="flex-1 flex-row items-center justify-center bg-white border border-[#E2E8F0] rounded-xl py-3"
            >
              <FileSpreadsheet size={16} color="#0F172A" strokeWidth={2.25} />
              <Text className="text-[#0F172A] font-bold text-[12px] ml-1.5">
                Calificar
              </Text>
            </Pressable>

            {/* Alumnos: botón outline. */}
            <Pressable
              onPress={goStudents}
              accessibilityRole="button"
              accessibilityLabel={`Directorio de alumnos de ${group.label}`}
              className="flex-1 flex-row items-center justify-center bg-white border border-[#E2E8F0] rounded-xl py-3"
            >
              <List size={16} color="#0F172A" strokeWidth={2.25} />
              <Text className="text-[#0F172A] font-bold text-[12px] ml-1.5">
                Alumnos
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* BottomTabBar proveído por el Tabs navigator raíz. */}
    </View>
  );
}