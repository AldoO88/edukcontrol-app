// =====================================================================
// app/(app)/grades.jsx
// ---------------------------------------------------------------------
// Ruta "/grades" del route group (app). Pantalla de
// "Calificaciones" para el tutor.
//
// =====================================================================
// CHROME COMPARTIDO
// ---------------------------------------------------------------------
//   - DashboardHeader:    isotipo sky-500 + "EdukControl" + campana
//   - SchoolInfoCard:     logo + nombre + ciclo escolar
//   - StudentFilter:      pills de alumnos con avatar
//   - BottomTabBar:       5 tabs (Calificaciones activa)
//
// =====================================================================
// DATA SOURCE
// ---------------------------------------------------------------------
// Datos reales del backend vía useGrades(studentId):
//   - GET /api/guardians/me/students/:id/grades   → calificaciones
//   - GET /api/guardians/me/students/:id/schedule  → horario
//
// Ambos endpoints se llaman en paralelo (Promise.all) dentro
// del hook. El hook maneja loading, error, y refetch al cambiar
// de alumno o al volver a la pantalla (useFocusEffect).
//
// =====================================================================
// SECCIONES
// ---------------------------------------------------------------------
//   1. Filtro por estudiante (StudentFilter).
//   2. Card de promedio general (número + descripción).
//   3. Calificaciones por materia (CalificacionesTable).
//   4. Selector de día + horario escolar del día seleccionado.
// =====================================================================

// React + hooks.
import React, { useEffect, useMemo, useState } from 'react';

// Primitivas RN: View, Text, ScrollView, Pressable, ActivityIndicator.
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';

// Iconos Lucide.
import {
  TrendingUp,
  Sigma,         // Matemáticas.
  BookOpen,      // Lengua Española.
  FlaskConical,  // Ciencias Naturales.
  Globe,         // Historia / Geografía.
  Palette,       // Arte.
  Music,         // Música.
  Dumbbell,      // Educación física.
  Languages,     // Inglés / Idiomas.
  Landmark,      // Formación Cívica.
  AlertCircle,   // Error.
  RefreshCw,     // Retry.
} from 'lucide-react-native';

// clsx.
import { clsx } from 'clsx';

// Componentes del chrome compartido del route group (app).
import DashboardHeader from './_components/DashboardHeader';
import SchoolInfoCard from './_components/SchoolInfoCard';
import BottomTabBar from './_components/BottomTabBar';
import StudentFilter from './_components/StudentFilter';

// Componentes específicos de esta pantalla.
import CalificacionesTable from './_components/CalificacionesTable';
import HorarioList from './_components/HorarioList';

// Hook del dashboard del tutor: data.school + data.students.
import { useGuardianDashboard } from '../../src/hooks/useGuardianDashboard';

// Hook de calificaciones + horario.
import { useGrades } from '../../src/hooks/useGrades';

// Helper que transforma los students al shape de StudentFilter.
import { studentsForFilter } from '../../src/utils/studentHelpers';

// ---------------------------------------------------------------------
// SUBJECT_ICON_MAP
// ---------------------------------------------------------------------
// Mapa de keywords → iconos Lucide para asignar un ícono a cada
// materia basándose en su nombre. El backend NO provee iconos,
// así que usamos matching por substring (case-insensitive).
// El orden importa: el primer match gana.
// ---------------------------------------------------------------------
const SUBJECT_ICON_RULES = [
  { keywords: ['matem', 'cálculo', 'algebra'],     Icon: Sigma },
  { keywords: ['español', 'lengua', 'literatura'],  Icon: BookOpen },
  { keywords: ['ciencia', 'biología', 'química', 'física'], Icon: FlaskConical },
  { keywords: ['historia', 'geografía', 'sociales'], Icon: Globe },
  { keywords: ['arte', 'pintura', 'dibujo'],        Icon: Palette },
  { keywords: ['música', 'coro'],                   Icon: Music },
  { keywords: ['física', 'deporte', 'educación física', 'formación física'], Icon: Dumbbell },
  { keywords: ['inglés', 'idioma', 'francés'],      Icon: Languages },
  { keywords: ['cívica', 'ética', 'formación cívica'], Icon: Landmark },
];

// Función pura: dado el nombre de una materia, devuelve el
// componente Icon de Lucide o null si no hay match.
const getIconForSubject = (name) => {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const rule of SUBJECT_ICON_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.Icon;
    }
  }
  return null;
};

// ---------------------------------------------------------------------
// DAYS
// ---------------------------------------------------------------------
// Días lectivos disponibles. Etiquetas en MAYÚSCULAS de 3 chars
// para que las pills del selector sean compactas.
// ---------------------------------------------------------------------
const DAYS = [
  { id: 'lunes',     label: 'LUN', labelFull: 'Lunes' },
  { id: 'martes',    label: 'MAR', labelFull: 'Martes' },
  { id: 'miercoles', label: 'MIÉ', labelFull: 'Miércoles' },
  { id: 'jueves',    label: 'JUE', labelFull: 'Jueves' },
  { id: 'viernes',   label: 'VIE', labelFull: 'Viernes' },
];

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function GradesScreen() {
  // -----------------------------------------------------------------
  // HOOKS
  // -----------------------------------------------------------------
  const { data: dashboardData, isLoading: isLoadingDashboard } = useGuardianDashboard();

  // -----------------------------------------------------------------
  // ESTADO LOCAL
  // -----------------------------------------------------------------
  const [activeFilterId, setActiveFilterId] = useState('');
  const [activeDay, setActiveDay] = useState('lunes');

  // -----------------------------------------------------------------
  // DERIVADOS
  // -----------------------------------------------------------------
  const students = useMemo(() => studentsForFilter(dashboardData), [dashboardData]);

  // Auto-seleccionar el primer alumno cuando llegan los datos.
  useEffect(() => {
    if (!activeFilterId && students.length > 0) {
      setActiveFilterId(students[0].id);
    }
  }, [students, activeFilterId]);

  // Hook de calificaciones + horario para el alumno activo.
  const {
    grades,
    schedule,
    isLoading,
    error,
    refetch,
  } = useGrades(activeFilterId);

  // Enriquecer subjects con iconos (el backend no los provee).
  const subjectsWithIcons = useMemo(() => {
    if (!grades?.subjects) return [];
    return grades.subjects.map((s) => ({
      ...s,
      icon: getIconForSubject(s.name),
    }));
  }, [grades?.subjects]);

  // Horario del día activo.
  const daySchedule = useMemo(() => {
    if (!schedule) return [];
    return schedule[activeDay] || [];
  }, [schedule, activeDay]);

  // Etiqueta del día activo para el header de HorarioList.
  const activeDayLabel = useMemo(
    () => DAYS.find((d) => d.id === activeDay)?.labelFull || 'Lunes',
    [activeDay],
  );

  // -----------------------------------------------------------------
  // RENDER: LOADING INICIAL
  // -----------------------------------------------------------------
  if (isLoadingDashboard && !dashboardData) {
    return (
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0f172a" />
          <Text className="text-sm text-slate-500 mt-3 font-medium">
            Cargando calificaciones...
          </Text>
        </View>
      </View>
    );
  }

  // -----------------------------------------------------------------
  // RENDER: ERROR FATAL
  // -----------------------------------------------------------------
  if (error && !grades && !schedule) {
    return (
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 items-center shadow-sm border border-rose-100">
            <AlertCircle size={32} color="#e11d48" strokeWidth={2} />
            <Text className="text-sm font-semibold text-rose-700 mt-3 text-center">
              No se pudieron cargar las calificaciones
            </Text>
            <Text className="text-xs text-slate-500 mt-1 text-center">
              {error}
            </Text>
            <Pressable
              onPress={refetch}
              className="flex-row items-center mt-4 px-4 py-2 bg-sky-600 active:bg-sky-700 rounded-xl"
              accessibilityRole="button"
              accessibilityLabel="Reintentar carga de calificaciones"
            >
              <RefreshCw size={14} color="#ffffff" strokeWidth={2.5} />
              <Text className="text-sm font-semibold text-white ml-1.5">
                Reintentar
              </Text>
            </Pressable>
          </View>
        </View>
        <BottomTabBar />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <DashboardHeader />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
      >
        <SchoolInfoCard
          school={dashboardData?.school}
          isLoading={isLoadingDashboard}
          className="mx-4 mt-4 mb-4"
        />

        <StudentFilter
          students={students}
          activeId={activeFilterId}
          onChange={setActiveFilterId}
          accessibilityLabel="Filtro de calificaciones por estudiante"
        />

        {/* ============================================================
            PROMEDIO GENERAL
            ============================================================ */}
        <View className="mx-4 mt-6">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Promedio general
          </Text>

          {isLoading && !grades ? (
            <View className="mt-2">
              <View className="h-12 w-24 bg-slate-200 rounded-lg" />
              <View className="h-4 w-48 bg-slate-100 rounded mt-2" />
            </View>
          ) : (
            <>
              <View className="flex-row items-baseline mt-1">
                <Text className="text-5xl font-bold text-sky-500">
                  {grades?.average?.toFixed(1) || '0.0'}
                </Text>
              </View>

              {grades?.subjects?.length > 0 && (
                <Text className="text-xs text-slate-500 mt-3 leading-relaxed">
                  {grades.subjects.length} materias evaluadas
                  {grades.periods?.length > 0 && ` · ${grades.periods[grades.periods.length - 1].name}`}
                </Text>
              )}
            </>
          )}
        </View>

        {/* ============================================================
            CALIFICACIONES POR TRIMESTRE
            ============================================================ */}
        <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-7 mb-3 px-5">
          Calificaciones por trimestre
        </Text>

        <View className="px-4">
          {isLoading && !grades ? (
            <View className="bg-white rounded-2xl p-5">
              {[1, 2, 3, 4].map((i) => (
                <View key={i} className="flex-row items-center py-3" style={{ opacity: 1 - i * 0.15 }}>
                  <View className="w-9 h-9 rounded-xl bg-slate-100" />
                  <View className="flex-1 ml-3">
                    <View className="h-4 bg-slate-100 rounded w-32" />
                  </View>
                  <View className="flex-row gap-2">
                    <View className="w-12 h-4 bg-slate-100 rounded" />
                    <View className="w-12 h-4 bg-slate-100 rounded" />
                    <View className="w-12 h-4 bg-slate-100 rounded" />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <CalificacionesTable
              subjects={subjectsWithIcons}
              averageByPeriod={grades?.averageByPeriod || {}}
              periods={grades?.periods || []}
            />
          )}
        </View>

        {/* ============================================================
            HORARIO ESCOLAR + SELECTOR DE DÍA
            ============================================================ */}
        <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-7 mb-3 px-5">
          Horario escolar
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-5 mb-4"
          accessibilityLabel="Selector de día del horario"
        >
          {DAYS.map((day) => {
            const isActive = day.id === activeDay;
            return (
              <Pressable
                key={day.id}
                onPress={() => setActiveDay(day.id)}
                className={clsx(
                  'rounded-full px-5 py-2',
                  isActive ? 'bg-slate-900' : 'bg-slate-100',
                )}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Ver horario del ${day.labelFull}`}
              >
                <Text
                  className={clsx(
                    'text-xs font-bold tracking-wider',
                    isActive ? 'text-white' : 'text-slate-700',
                  )}
                >
                  {day.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="px-4">
          {isLoading && !schedule ? (
            <View className="bg-white rounded-2xl p-5">
              {[1, 2, 3].map((i) => (
                <View key={i} className="flex-row items-center py-3" style={{ opacity: 1 - i * 0.2 }}>
                  <View className="w-20 h-4 bg-slate-100 rounded" />
                  <View className="flex-1 ml-4">
                    <View className="h-4 bg-slate-100 rounded w-40" />
                    <View className="h-3 bg-slate-50 rounded w-24 mt-1" />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <HorarioList
              day={activeDayLabel}
              schedule={daySchedule}
            />
          )}
        </View>
      </ScrollView>

      <BottomTabBar />
    </View>
  );
}
