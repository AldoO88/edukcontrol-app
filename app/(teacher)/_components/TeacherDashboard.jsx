// =====================================================================
// app/(teacher)/_components/TeacherDashboard.jsx
// ---------------------------------------------------------------------
// Dashboard del MAESTRO (rol "teacher"). Pantalla principal
// post-login para usuarios con ese rol. Se monta desde el dispatcher
// de la ruta app/(teacher)/dashboard.jsx (grupo del maestro).
//
// Componente privado del route group (app): vive en _components/
// (prefijo "_") para que Expo Router lo ignore como ruta.
//
// Estructura (de arriba a abajo):
//   ┌──────────────────────────────────┐
//   │ Top header: EdukControl + 🔔    │  ← brand del producto + campana
//   ├──────────────────────────────────┤
//   │ School info card                 │  ← nombre + logo de la escuela
//   ├──────────────────────────────────┤
//   │ Hola, Prof. [Nombre]            │  ← saludo + fecha del backend
//   ├──────────────────────────────────┤
//   │ ┌────────────────────────────┐   │
//   │ │ CLASE EN CURSO             │   │  ← card de la clase actual
//   │ │ [Materia]                  │   │
//   │ │ [Grupo]  [Hora]            │   │
//   │ │ [Tomar Asistencia]         │   │  ← botón teal
//   │ └────────────────────────────┘   │
//   ├──────────────────────────────────┤
//   │ RESTO DEL DÍA                    │  ← horario restante
//   │ 09:30 │ Informática · 1°A        │
//   │ 10:20 │ Informática · 2°B        │
//   ├──────────────────────────────────┤
//   │ ┌──────┐ ┌──────┐               │
//   │ │Avisos│ │Calif.│               │  ← grid 2x2 de accesos rápidos
//   │ └──────┘ └──────┘               │
//   │ ┌──────┐ ┌──────┐               │
//   │ │Citator│ │Mis Gr│               │
//   │ └──────┘ └──────┘               │
//   ├──────────────────────────────────┤
//   │ Bottom tab bar (4 tabs teacher)  │  ← Inicio / Asistencia / etc.
//   └──────────────────────────────────┘
//
// =====================================================================
// DATA SOURCE
// ---------------------------------------------------------------------
// Datos reales del backend vía useTeacherDashboard():
//   - GET /api/teacher-subjects/me/dashboard
//     Retorna teacher + school + currentSchoolYear + todaySchedule.
// =====================================================================

// React.
import React, { useMemo } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';

// Navegación.
import { useRouter } from 'expo-router';

// Iconos Lucide.
import {
  Megaphone,      // Avisos (grid).
  AlertCircle,    // Citatorios (grid) + error state.
  ClipboardCheck, // Asistencia (grid).
  Calendar,       // Horario (grid).
  UsersRound,     // Grupo de la clase actual.
  Clock,          // Hora de la clase.
  CheckCircle,    // Tomar Asistencia.
  RefreshCw,      // Retry en error state.
} from 'lucide-react-native';

// Tabs del bottom bar para el rol teacher. Fuente única en
// src/constants/navigationTabs.js.
import { TEACHER_TABS } from '../../../src/constants/navigationTabs';

// Componentes del chrome compartido (src/components).
import DashboardHeader from '../../../src/components/DashboardHeader';
import SchoolInfoCard from '../../../src/components/SchoolInfoCard';
import BottomTabBar from '../../../src/components/BottomTabBar';

// Hook de auth: provee { user }.
import { useAuth } from '../../../src/hooks/useAuth';

// Hook del dashboard del teacher: data del backend.
import { useTeacherDashboard } from '../../../src/hooks/useTeacherDashboard';

// clsx.
import { clsx } from 'clsx';

// ---------------------------------------------------------------------
// QUICK_ACTIONS
// ---------------------------------------------------------------------
// Accesos rápidos del grid 2x2 del maestro. Tras el cambio de la
// barra inferior (Mis Grupos y Calificaciones pasaron a ser TABs),
// aquí quedan las otras cuatro: Avisos, Citatorios, Asistencia y
// Horario. Cada uno tiene un icono, label y color de fondo del icono
// (mismo patrón que los pills del guardian).
// ---------------------------------------------------------------------
const QUICK_ACTIONS = [
  { id: 'announcements', label: 'Avisos',     icon: Megaphone,      iconBg: 'bg-sky-100',     iconColor: '#0284c7' },
  { id: 'citations',     label: 'Citatorios', icon: AlertCircle,    iconBg: 'bg-amber-100',   iconColor: '#b45309' },
  { id: 'attendance',    label: 'Asistencia', icon: ClipboardCheck, iconBg: 'bg-emerald-100', iconColor: '#047857' },
  { id: 'schedule',      label: 'Horario',    icon: Calendar,       iconBg: 'bg-purple-100',  iconColor: '#7c3aed' },
];

// ---------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------
export default function TeacherDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  // Hook del dashboard: carga datos del backend, expone loading
  // y error, y refetchea al volver a foco.
  const { data, isLoading, error, refetch } = useTeacherDashboard();

  // Derivados del payload del backend.
  // El saludo viene de teacher.fullName del endpoint.
  const teacherName = data?.teacher?.fullName || user?.name || 'Profesor';
  const currentDate = data?.currentDate;
  // Normalizar school: el backend usa camelCase (logoUrl) pero
  // SchoolInfoCard espera snake_case (logo_url). También inyectamos
  // current_school_year desde el objeto separado del backend.
  const school = useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.currentSchoolYear?.name || null,
    };
  }, [data?.school, data?.currentSchoolYear]);
  // Datos del horario de hoy.
  const currentClass = data?.todaySchedule?.currentClass || null;
  const allClasses = data?.todaySchedule?.allClasses || [];

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header compartido: brand + campana. */}
      <DashboardHeader />

      {/* School info card compartida. */}
      <SchoolInfoCard
        school={school}
        isLoading={isLoading}
        className="mx-4 mt-2"
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !!data}
            onRefresh={refetch}
            colors={['#0f172a']}
            tintColor="#0f172a"
          />
        }
      >
        {/* ============================================================
            LOADING INICIAL
            ============================================================ */}
        {isLoading && !data && (
          <View className="px-4 mt-6">
            <View className="h-8 w-48 bg-slate-200 rounded" />
            <View className="h-4 w-32 bg-slate-100 rounded mt-2" />
          </View>
        )}

        {/* ============================================================
            ERROR STATE
            ============================================================ */}
        {!isLoading && error && !data && (
          <View className="px-4 mt-6">
            <View className="bg-white rounded-3xl p-6 items-center shadow-sm border border-rose-100">
              <AlertCircle size={32} color="#e11d48" strokeWidth={2} />
              <Text className="text-sm font-semibold text-rose-700 mt-3 text-center">
                No se pudo cargar el dashboard
              </Text>
              <Text className="text-xs text-slate-500 mt-1 text-center">
                {error}
              </Text>
              <Pressable
                onPress={refetch}
                className="flex-row items-center mt-4 px-4 py-2 bg-sky-600 active:bg-sky-700 rounded-xl"
                accessibilityRole="button"
                accessibilityLabel="Reintentar carga del dashboard"
              >
                <RefreshCw size={14} color="#ffffff" strokeWidth={2.5} />
                <Text className="text-sm font-semibold text-white ml-1.5">
                  Reintentar
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ============================================================
            CONTENIDO PRINCIPAL (solo si hay data)
            ============================================================ */}
        {!isLoading && data && (
          <>
        {/* ============================================================
            SALUDO
            ============================================================
            "Hola, Prof. [Nombre]" + fecha actual. Mismo estilo que
            el guardian pero sin pill de rol (el maestro ya sabe
            que es maestro).
            ============================================================ */}
        <View className="px-4 mt-6">
          <Text className="text-3xl font-bold text-slate-900">
            Hola, {teacherName}
          </Text>

          <View className="self-start mt-2 px-3 py-1 bg-sky-50 rounded-full">
            <Text className="text-xs font-bold uppercase tracking-wide text-sky-700">
              Docente
            </Text>
          </View>

          <Text className="text-sm text-slate-500 mt-1">
            {currentDate || 'Hoy'}
          </Text>
        </View>

        {/* ============================================================
            CLASES CONCLUIDAS (mismo estilo que pendientes)
            ============================================================
            Lista de las clases que ya pasaron. Card con el mismo
            estilo que "Próximas clases" para mantener coherencia.
            Cada una tiene un botón para corregir asistencia.
            ============================================================ */}
        {allClasses.filter(cls => {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          return cls.endMinutes <= currentMinutes;
        }).length > 0 && (
          <View className="px-4 mt-4">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 px-1">
              Clases de hoy
            </Text>
            <View className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{ elevation: 1 }}>
              {allClasses.filter(cls => {
                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                return cls.endMinutes <= currentMinutes;
              }).map((cls, index) => (
                <View
                  key={index}
                  className={clsx(
                    'flex-row items-center px-3 py-2',
                    index > 0 && 'border-t border-slate-100',
                  )}
                >
                  <Text className="text-[11px] font-medium text-slate-500 w-24">
                    {cls.startTime} - {cls.endTime}
                  </Text>
                  <Text className="text-xs font-semibold text-slate-700 flex-1 text-left" numberOfLines={1}>
                    {cls.subject?.name}
                  </Text>
                  <Text className="text-[11px] text-slate-500 w-24 text-left">
                    {cls.group?.label}
                  </Text>
                  {/*<Pressable
                    onPress={() => router.push({
                      pathname: '/(teacher)/take-attendance',
                      params: {
                        groupId: cls.group?._id,
                        subjectId: cls.subject?._id,
                      },
                    })}
                    className="ml-2 bg-slate-400 px-2 py-1 rounded-lg"
                    accessibilityRole="button"
                    accessibilityLabel={`Corregir asistencia de ${cls.subject?.name}`}
                  >
                    <Text className="text-[9px] font-bold text-white">
                      Corregir
                    </Text>
                  </Pressable>*/}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ============================================================
            CLASE EN CURSO
            ============================================================
            Card destacada con la materia que se está impartiendo
            ahora mismo. Si no hay clase en curso (currentClass null),
            no se muestra esta sección.
            ============================================================ */}
        {currentClass && (
          <View className="px-4 mt-3">
            <View
              className="bg-white rounded-3xl p-5 shadow-md border border-slate-100"
              style={{ elevation: 3 }}
            >
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-rose-500 mr-2" />
                <Text className="text-xs font-bold uppercase tracking-wider text-rose-600">
                  Clase en curso
                </Text>
              </View>

              <Text className="text-2xl font-bold text-slate-900 mt-3">
                {currentClass.subject?.name}
              </Text>

              <View className="flex-row items-center mt-3">
                <UsersRound size={16} color="#64748b" strokeWidth={2} />
                <Text className="text-sm text-slate-600 ml-2">
                  {currentClass.group?.label}
                </Text>
              </View>

              <View className="flex-row items-center mt-2">
                <Clock size={16} color="#64748b" strokeWidth={2} />
                <Text className="text-sm text-slate-600 ml-2">
                  {currentClass.startTime} - {currentClass.endTime}
                </Text>
              </View>
              
              <Pressable
                onPress={() => router.push({
                  pathname: '/(teacher)/take-attendance',
                  params: {
                    groupId: currentClass.group?._id,
                    subjectId: currentClass.subject?._id,
                  },
                })}
                className="flex-row items-center justify-center mt-5 bg-teal-700 active:bg-teal-800 rounded-2xl py-4"
                accessibilityRole="button"
                accessibilityLabel="Tomar asistencia de esta clase"
              >
                <CheckCircle size={20} color="#ffffff" strokeWidth={2.25} />
                <Text className="text-white font-bold text-base ml-2">
                  Tomar Asistencia
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ============================================================
            PRÓXIMAS CLASES (después de la clase en curso)
            ============================================================
            Solo las clases que faltan. Card con las materias
            pendientes para el resto del día. Cada una tiene un
            botón para tomar asistencia.
            ============================================================ */}
        {allClasses.filter(cls => {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const isCurrent = currentClass
            && cls.subject?.code === currentClass.subject?.code
            && cls.group?.label === currentClass.group?.label;
          return cls.startMinutes > currentMinutes && !isCurrent;
        }).length > 0 && (
          <View className="px-4 mt-3">
            <View className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{ elevation: 1 }}>
              {allClasses.filter(cls => {
                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                const isCurrent = currentClass
                  && cls.subject?.code === currentClass.subject?.code
                  && cls.group?.label === currentClass.group?.label;
                return cls.startMinutes > currentMinutes && !isCurrent;
              }).map((cls, index) => (
                <View
                  key={index}
                  className={clsx(
                    'flex-row items-center px-3 py-2',
                    index > 0 && 'border-t border-slate-100',
                  )}
                >
                  <Text className="text-[11px] font-medium text-slate-500 w-24">
                    {cls.startTime} - {cls.endTime}
                  </Text>
                  <Text className="text-xs font-semibold text-slate-700 flex-1" numberOfLines={1}>
                    {cls.subject?.name}
                  </Text>
                  <Text className="text-[11px] text-slate-500 w-12 text-right">
                    {cls.group?.label}
                  </Text>
                  <Pressable
                    onPress={() => router.push({
                      pathname: '/(teacher)/take-attendance',
                      params: {
                        groupId: cls.group?._id,
                        subjectId: cls.subject?._id,
                      },
                    })}
                    className="ml-2 bg-teal-600 px-2 py-1 rounded-lg"
                    accessibilityRole="button"
                    accessibilityLabel={`Tomar asistencia de ${cls.subject?.name}`}
                  >
                    <Text className="text-[9px] font-bold text-white">
                      Lista
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ============================================================
            ACCESOS RÁPIDOS (grid 2x2)
            ============================================================
            Cuatro cards cuadradas con icono + label. Cada una navega
            a su ruta correspondiente. Mismo estilo de cards que el
            guardian (rounded-2xl, sombra sutil).
            ============================================================ */}
        <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-7 mb-3 px-5">
          Accesos rápidos
        </Text>

        <View className="px-4 flex-row flex-wrap gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Pressable
                key={action.id}
                onPress={() => {
                  // Navegación del quick action. "Avisos", "Asistencia"
                  // y "Horario" tienen pantalla propia (prototipo del
                  // maestro). "Citatorios" aún no tiene ruta → TODO.
                  if (action.id === 'announcements') {
                    router.push('/(teacher)/announcements');
                  }
                  if (action.id === 'attendance') {
                    router.push('/(teacher)/attendance');
                  }
                  if (action.id === 'schedule') {
                    router.push('/(teacher)/grades');
                  }
                  // citations: TODO pendiente (aún no hay pantalla).
                }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm items-center justify-center py-5 px-4"
                style={{ elevation: 1, width: '47%' }}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <View className={clsx('w-14 h-14 rounded-2xl items-center justify-center', action.iconBg)}>
                  <Icon size={24} color={action.iconColor} strokeWidth={2} />
                </View>
                <Text className="text-sm font-semibold text-slate-700 mt-3">
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
          </>
        )}
      </ScrollView>

      {/* Bottom tab bar con tabs del maestro. */}
      <BottomTabBar tabs={TEACHER_TABS} />
    </View>
  );
}
