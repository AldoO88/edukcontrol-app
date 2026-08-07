// =====================================================================
// app/(app)/attendance.jsx
// ---------------------------------------------------------------------
// Ruta "/attendance" del route group (app). Pantalla de
// "Asistencia" para el tutor: muestra el % total de asistencia
// del alumno, contadores de eventos (asistencias, faltas,
// retardos), las inasistencias recientes y un historial de
// entradas/salidas.
//
// =====================================================================
// CHROME COMPARTIDO
// ---------------------------------------------------------------------
//   - DashboardHeader:    isotipo sky-500 + "EdukControl" + campana
//   - SchoolInfoCard:     logo + nombre + ciclo escolar
//   - StudentFilter:      pills de alumnos con avatar
//   - BottomTabBar:       5 tabs (la tab "Asistencia" se
//                         resalta con CalendarCheck)
//
// =====================================================================
// DATA SOURCE
// ---------------------------------------------------------------------
// Datos reales del backend vía useAttendance(studentId):
//   - GET /api/guardians/me/students/:id/attendance/summary
//   - GET /api/guardians/me/students/:id/attendance/history
//
// Ambos endpoints se llaman en paralelo (Promise.all) dentro
// del hook. El hook maneja loading, error, y refetch al cambiar
// de alumno o al volver a la pantalla (useFocusEffect).
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
  AlertCircle,   // error.
  RefreshCw,     // retry.
} from 'lucide-react-native';

// clsx.
import { clsx } from 'clsx';

// Componentes del chrome compartido del route group (app).
import DashboardHeader from './_components/DashboardHeader';
import SchoolInfoCard from './_components/SchoolInfoCard';
import BottomTabBar from './_components/BottomTabBar';
import StudentFilter from './_components/StudentFilter';

// Componentes específicos de esta pantalla.
import AttendanceRing from './_components/AttendanceRing';
import AttendanceStatCard from './_components/AttendanceStatCard';
import RecentAbsenceCard from './_components/RecentAbsenceCard';
import AttendanceHistoryTable from './_components/AttendanceHistoryTable';

// Hook del dashboard del tutor: data.school + data.students.
import { useGuardianDashboard } from '../../src/hooks/useGuardianDashboard';

// Hook de asistencia.
import { useAttendance } from '../../src/hooks/useAttendance';

// Helper que transforma los students al shape de StudentFilter.
import { studentsForFilter } from '../../src/utils/studentHelpers';

// ---------------------------------------------------------------------
// PROGRESS_LABEL_COLORS
// ---------------------------------------------------------------------
// Mapa de progress_label a colores de UI. El backend devuelve
// "Excelente", "Bueno", "Regular", "Necesita mejorar" o null.
// ---------------------------------------------------------------------
const PROGRESS_LABEL_COLORS = {
  'Excelente':         'text-emerald-600',
  'Bueno':             'text-sky-600',
  'Regular':           'text-amber-600',
  'Necesita mejorar':  'text-rose-600',
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function AttendanceScreen() {
  // -----------------------------------------------------------------
  // HOOKS
  // -----------------------------------------------------------------
  const { data: dashboardData, isLoading: isLoadingDashboard } = useGuardianDashboard();

  // -----------------------------------------------------------------
  // ESTADO LOCAL
  // -----------------------------------------------------------------
  const [activeFilterId, setActiveFilterId] = useState('');

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

  // Hook de asistencia para el alumno activo.
  const {
    summary,
    history,
    isLoading,
    error,
    refetch,
  } = useAttendance(activeFilterId);

  // Color del progress_label.
  const progressColor = summary?.progressLabel
    ? PROGRESS_LABEL_COLORS[summary.progressLabel] || 'text-sky-600'
    : 'text-sky-600';

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
            Cargando asistencia...
          </Text>
        </View>
      </View>
    );
  }

  // -----------------------------------------------------------------
  // RENDER: ERROR FATAL
  // -----------------------------------------------------------------
  if (error && !summary && history.length === 0) {
    return (
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 items-center shadow-sm border border-rose-100">
            <AlertCircle size={32} color="#e11d48" strokeWidth={2} />
            <Text className="text-sm font-semibold text-rose-700 mt-3 text-center">
              No se pudo cargar la asistencia
            </Text>
            <Text className="text-xs text-slate-500 mt-1 text-center">
              {error}
            </Text>
            <Pressable
              onPress={refetch}
              className="flex-row items-center mt-4 px-4 py-2 bg-sky-600 active:bg-sky-700 rounded-xl"
              accessibilityRole="button"
              accessibilityLabel="Reintentar carga de asistencia"
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
          accessibilityLabel="Filtro de asistencia por estudiante"
        />

        {/* ============================================================
            CARD DE ASISTENCIA TOTAL (anillo + label)
            ============================================================ */}
        <View
          className="bg-white rounded-3xl border border-slate-200 border-t-[5px] border-t-sky-500 shadow-md mx-4 mt-6 px-5 py-6 items-center"
          style={{ elevation: 3 }}
        >
          {isLoading && !summary ? (
            <View className="items-center py-4">
              <View className="w-[180px] h-[180px] rounded-full bg-slate-100" />
              <View className="h-4 w-32 bg-slate-100 rounded mt-4" />
              <View className="h-2 w-full bg-slate-100 rounded mt-4" />
            </View>
          ) : (
            <>
              <AttendanceRing
                percentage={summary?.percentage ?? 0}
                size={180}
                strokeWidth={14}
                label="Asistencia Total"
              />

              <View className="flex-row items-center justify-between w-full mt-5">
                <Text className="text-xs font-semibold text-slate-500">
                  Progreso del Ciclo Escolar
                </Text>
                <Text className={clsx('text-xs font-bold', progressColor)}>
                  {summary?.progressLabel || 'Sin datos'}
                </Text>
              </View>

              <View className="h-2 rounded-full bg-slate-200 w-full mt-2 overflow-hidden">
                <View
                  className="h-full rounded-full bg-sky-500"
                  style={{ width: `${summary?.percentage ?? 0}%` }}
                />
              </View>
            </>
          )}
        </View>

        {/* ============================================================
            STAT CARDS (3 columnas)
            ============================================================ */}
        <View className="flex-row justify-center gap-2 mx-4 mt-4">
          {isLoading && !summary ? (
            <>
              <View className="flex-1 h-16 bg-slate-100 rounded-xl" />
              <View className="flex-1 h-16 bg-slate-100 rounded-xl" />
              <View className="flex-1 h-16 bg-slate-100 rounded-xl" />
            </>
          ) : (
            <>
              <AttendanceStatCard
                value={summary?.totalAttendances ?? 0}
                label="Asistencias"
                color="sky"
              />
              <AttendanceStatCard
                value={summary?.totalAbsences ?? 0}
                label="Faltas"
                color="rose"
              />
              <AttendanceStatCard
                value={summary?.totalLates ?? 0}
                label="Retardos"
                color="amber"
              />
            </>
          )}
        </View>

        {/* ============================================================
            INASISTENCIAS RECIENTES
            ============================================================ */}
        <View className="flex-row items-center justify-between mt-7 px-5 mb-3">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Inasistencias recientes
          </Text>
          <Pressable
            onPress={() => {
              // TODO: navegar a calendario completo.
            }}
            hitSlop={8}
            accessibilityRole="link"
            accessibilityLabel="Ver calendario completo"
          >
            <Text className="text-xs font-bold text-sky-600">
              Ver Calendario
            </Text>
          </Pressable>
        </View>

        <View className="px-4">
          {isLoading && !summary ? (
            [1, 2].map((i) => (
              <View
                key={i}
                className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
                style={{ opacity: 1 - i * 0.3 }}
              >
                <View className="w-14 h-14 rounded-2xl bg-slate-100" />
                <View className="flex-1 ml-4">
                  <View className="h-4 bg-slate-100 rounded w-28" />
                  <View className="h-3 bg-slate-50 rounded w-40 mt-1" />
                </View>
              </View>
            ))
          ) : summary?.recentAbsences?.length > 0 ? (
            summary.recentAbsences.map((absence) => (
              <RecentAbsenceCard
                key={absence.id}
                absence={absence}
                onPress={() => {
                  // TODO: navegar a detalle de la inasistencia.
                }}
              />
            ))
          ) : (
            <View className="bg-white rounded-2xl p-6 items-center">
              <Text className="text-sm text-slate-500 text-center">
                Sin inasistencias recientes.
              </Text>
              <Text className="text-xs text-slate-400 mt-1 text-center">
                ¡Puntaje perfecto de asistencia!
              </Text>
            </View>
          )}
        </View>

        {/* ============================================================
            ENTRADAS Y SALIDAS
            ============================================================ */}
        <View className="flex-row items-center justify-between mt-7 px-5 mb-3">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Entradas y Salidas
          </Text>
          <Pressable
            onPress={() => {
              // TODO: navegar a historial completo.
            }}
            hitSlop={8}
            accessibilityRole="link"
            accessibilityLabel="Ver historial completo"
          >
            <Text className="text-xs font-bold text-sky-600">
              Ver Historial
            </Text>
          </Pressable>
        </View>

        <View className="px-4">
          {isLoading && history.length === 0 ? (
            <View className="bg-white rounded-2xl p-5">
              {[1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  className="flex-row items-center py-3"
                  style={{ opacity: 1 - i * 0.15 }}
                >
                  <View className="flex-1 h-4 bg-slate-100 rounded" />
                  <View className="w-20 h-4 bg-slate-100 rounded mx-2" />
                  <View className="w-20 h-4 bg-slate-100 rounded mx-2" />
                  <View className="w-24 h-6 bg-slate-100 rounded-full" />
                </View>
              ))}
            </View>
          ) : (
            <AttendanceHistoryTable history={history} />
          )}
        </View>
      </ScrollView>

      <BottomTabBar />
    </View>
  );
}
