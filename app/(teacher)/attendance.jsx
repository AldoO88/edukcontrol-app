// =====================================================================
// app/(teacher)/attendance.jsx
// ---------------------------------------------------------------------
// Ruta "/attendance" del route group (teacher). Pantalla de
// **RESUMEN / ANALYTICS** de asistencia.
//
// Complementa las otras 2 rutas de asistencia del proyecto:
//   - Dashboard → "Tomar Asistencia" (clase en curso, acción live).
//   - Groups card → "Asistencia" → matrix per-grupo (escribir asistencia).
//   - Esta pantalla → vista histórica + stats cross-grupo
//                       (lectura + drill-down).
//
// Estructura visual:
//
//   ┌────────────────────────────────────────┐
//   │ DashboardHeader + SchoolInfoCard       │
//   ├────────────────────────────────────────┤
//   │ [← Volver]                            │
//   │ 📊 Resumen de Asistencia              │
//   │ Análisis de asistencia                │
//   ├────────────────────────────────────────┤
//   │ Chips de grupo: [Todos] [1°A] [2°B]  │
//   ├────────────────────────────────────────┤
//   │ Chips de período: [1er Periodo] [...]  │
//   ├────────────────────────────────────────┤
//   │ 3 stat cards (% / sesiones / faltas)   │
//   ├────────────────────────────────────────┤
//   │ Top absent students                     │
//   ├────────────────────────────────────────┤
//   │ Top retard students                     │
//   └────────────────────────────────────────┘
// =====================================================================

// React + hooks.
import React, { useState, useEffect, useMemo } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Navegación.
import { useRouter } from 'expo-router';

// Iconos Lucide.
import {
  BarChart3,
  ChevronLeft,
  Users,
  Clock,
  AlertCircle,
  TrendingUp,
} from 'lucide-react-native';

// Hook del dashboard docente.
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';
// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Servicios.
import {
  getAttendanceSummary,
  getGradingPeriods,
} from '@/src/services/teacherService';

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function TeacherAttendanceSummaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ============================================================
  // DASHBOARD DATA
  // ============================================================
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

  // ============================================================
  // ESTADO
  // ============================================================
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // FETCH: períodos de evaluación al montar
  // ============================================================
  useEffect(() => {
    let cancelled = false;
    const fetchPeriods = async () => {
      setPeriodsLoading(true);
      const result = await getGradingPeriods();
      if (cancelled) return;
      if (result.success && result.data?.periods) {
        const fetchedPeriods = result.data.periods.filter((p) => p.order > 0);
        setPeriods(fetchedPeriods);
        // Auto-seleccionar el período que contiene la fecha actual
        const today = new Date();
        const currentPeriod = fetchedPeriods.find(
          (p) => new Date(p.startDate) <= today && new Date(p.endDate) >= today
        );
        if (currentPeriod) {
          setSelectedPeriod(currentPeriod);
        } else if (fetchedPeriods.length > 0) {
          setSelectedPeriod(fetchedPeriods[0]);
        }
      }
      setPeriodsLoading(false);
    };
    fetchPeriods();
    return () => { cancelled = true; };
  }, []);

  // ============================================================
  // FETCH: analytics cada vez que cambia período o grupo
  // ============================================================
  useEffect(() => {
    if (!selectedPeriod) return;
    let cancelled = false;
    const fetchAnalytics = async () => {
      setLoading(true);
      const result = await getAttendanceSummary({ periodId: selectedPeriod._id, groupId: selectedGroupId });
      if (cancelled) return;
      if (result.success) {
        setAnalytics(result.data);
      } else {
        Alert.alert('Error', result.message || 'No se pudo cargar el resumen.');
      }
      setLoading(false);
    };
    fetchAnalytics();
    return () => { cancelled = true; };
  }, [selectedPeriod, selectedGroupId]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* ========================================================
          CHROME COMPARTIDO
          ======================================================== */}
      <DashboardHeader />
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-2"
        teacher={data?.teacher}
        date={currentDate}
      />

      {/* Botón "Volver". */}
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Volver al dashboard"
        className="flex-row items-center px-4 mt-4"
      >
        <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
        <Text className="text-sm font-semibold text-sky-600 ml-1">
          Volver
        </Text>
      </Pressable>

      {/* ========================================================
          TÍTULO
          ======================================================== */}
      <View className="flex-row items-center px-4 mt-4">
        <View
          className="items-center justify-center"
          style={{
            backgroundColor: '#F0F9FF',
            padding: 8,
            borderRadius: 12,
          }}
        >
          <BarChart3 size={20} color="#0284C7" strokeWidth={2.25} />
        </View>
        <View className="flex-1 ml-3">
          <Text
            className="text-slate-900"
            style={{ fontSize: 17, fontWeight: '700' }}
            numberOfLines={1}
          >
            Resumen de Asistencia
          </Text>
          <Text
            className="text-slate-500"
            style={{ fontSize: 12, fontWeight: '500' }}
            numberOfLines={1}
          >
            Análisis de asistencia
          </Text>
        </View>
      </View>

      {/* ========================================================
          FILTRO DE GRUPO (chips scrollables)
          ======================================================== */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 8,
          alignItems: 'center',
        }}
        style={{ maxHeight: 48 }}
      >
        {/* Chip "Todos". */}
        <Pressable
          onPress={() => setSelectedGroupId(null)}
          className="px-3 py-1.5 rounded-full"
          style={{
            backgroundColor: selectedGroupId === null ? '#0284C7' : '#F1F5F9',
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: selectedGroupId === null ? '#FFFFFF' : '#475569',
            }}
          >
            Todos
          </Text>
        </Pressable>

        {/* Chips por grupo. */}
        {(analytics?.groups || []).map((g) => {
          const isActive = selectedGroupId === g._id;
          const label = g.label || `${g.grade}° ${g.section}`;
          return (
            <Pressable
              key={g._id}
              onPress={() => setSelectedGroupId(g._id)}
              className="px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: isActive ? '#0284C7' : '#F1F5F9',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: isActive ? '#FFFFFF' : '#475569',
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ========================================================
          PERIOD SELECTOR (chips scrollables desde BD)
          ======================================================== */}
      {!periodsLoading && periods.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 8,
            alignItems: 'center',
          }}
          style={{ maxHeight: 48 }}
        >
          {periods.map((p) => {
            const isActive = selectedPeriod?._id === p._id;
            return (
              <Pressable
                key={p._id}
                onPress={() => setSelectedPeriod(p)}
                className="px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: isActive ? '#0284C7' : '#F1F5F9',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: isActive ? '#FFFFFF' : '#475569',
                  }}
                >
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* ========================================================
          SCROLL CONTENT
          ======================================================== */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* Loading state. */}
        {loading && (
          <View className="items-center justify-center mt-12">
            <ActivityIndicator size="large" color="#0284C7" />
            <Text className="text-slate-400 text-sm mt-3">
              Cargando resumen...
            </Text>
          </View>
        )}

        {/* Contenido solo cuando no está cargando. */}
        {!loading && analytics && (
          <>
            {/* ========================================================
                STATS ROW
                ======================================================== */}
            <View className="flex-row mx-4 mt-3" style={{ gap: 8 }}>
              <StatCard
                label="% Asistencia"
                value={`${analytics.stats?.attendancePercentage ?? 0}%`}
                valueColor="#0284C7"
                bgColor="#F0F9FF"
                icon={TrendingUp}
                iconColor="#0284C7"
              />
              <StatCard
                label="Sesiones"
                value={`${analytics.stats?.totalSessions ?? 0}`}
                valueColor="#0F172A"
                bgColor="#F1F5F9"
              />
              <StatCard
                label="Inasistencias"
                value={`${analytics.stats?.totalAbsences ?? 0}`}
                valueColor="#DC2626"
                bgColor="#FEE2E2"
                icon={AlertCircle}
                iconColor="#DC2626"
              />
            </View>

            {/* ========================================================
                TOP ABSENT STUDENTS
                ======================================================== */}
            <SectionHeader
              icon={Users}
              iconColor="#D97706"
              title="Alumnos con más inasistencias"
            />
            <View
              className="bg-white rounded-2xl p-2 mx-4 border border-slate-100"
              style={{
                shadowColor: '#0F172A',
                shadowOpacity: 0.04,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 1 },
                elevation: 1,
              }}
            >
              {analytics.topAbsentStudents.length === 0 && (
                <Text className="text-slate-400 text-center text-sm py-6">
                  No hay inasistencias en este período.
                </Text>
              )}
              {(analytics.topAbsentStudents || []).map((student, index) => {
                const isLast =
                  index === analytics.topAbsentStudents.length - 1;
                return (
                  <View
                    key={student._id}
                    className="flex-row items-center p-3"
                    style={
                      !isLast
                        ? {
                            borderBottomWidth: 1,
                            borderBottomColor: '#F1F5F9',
                          }
                        : undefined
                    }
                  >
                    {/* Rank circle. */}
                    <View
                      className="items-center justify-center"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: index === 0 ? '#FEE2E2' : '#F1F5F9',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '800',
                          color: index === 0 ? '#B91C1C' : '#475569',
                        }}
                      >
                        {index + 1}
                      </Text>
                    </View>

                    {/* Name + group. */}
                    <View className="flex-1 ml-3">
                      <Text
                        className="text-slate-900"
                        style={{ fontSize: 13, fontWeight: '700' }}
                        numberOfLines={1}
                      >
                        {student.fullName}
                      </Text>
                      <Text
                        className="text-slate-500 mt-0.5"
                        style={{ fontSize: 11, fontWeight: '500' }}
                        numberOfLines={1}
                      >
                        {student.originGroup} · {student.subject}
                      </Text>
                    </View>

                    {/* Absences pill. */}
                    <View
                      className="px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: '#FEE2E2' }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '800',
                          color: '#B91C1C',
                        }}
                      >
                        {`${student.absenceCount} faltas`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* ========================================================
                TOP RETARD STUDENTS
                ======================================================== */}
            <SectionHeader
              icon={Clock}
              iconColor="#D97706"
              title="Alumnos con más retardos"
            />
            <View
              className="bg-white rounded-2xl p-2 mx-4 border border-slate-100"
              style={{
                shadowColor: '#0F172A',
                shadowOpacity: 0.04,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 1 },
                elevation: 1,
              }}
            >
              {analytics.topRetardStudents.length === 0 && (
                <Text className="text-slate-400 text-center text-sm py-6">
                  No hay retardos en este período.
                </Text>
              )}
              {(analytics.topRetardStudents || []).map((student, index) => {
                const isLast =
                  index === analytics.topRetardStudents.length - 1;
                return (
                  <View
                    key={student._id}
                    className="flex-row items-center p-3"
                    style={
                      !isLast
                        ? {
                            borderBottomWidth: 1,
                            borderBottomColor: '#F1F5F9',
                          }
                        : undefined
                    }
                  >
                    {/* Rank circle. */}
                    <View
                      className="items-center justify-center"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: index === 0 ? '#FEF3C7' : '#F1F5F9',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '800',
                          color: index === 0 ? '#B45309' : '#475569',
                        }}
                      >
                        {index + 1}
                      </Text>
                    </View>

                    {/* Name + group. */}
                    <View className="flex-1 ml-3">
                      <Text
                        className="text-slate-900"
                        style={{ fontSize: 13, fontWeight: '700' }}
                        numberOfLines={1}
                      >
                        {student.fullName}
                      </Text>
                      <Text
                        className="text-slate-500 mt-0.5"
                        style={{ fontSize: 11, fontWeight: '500' }}
                        numberOfLines={1}
                      >
                        {student.originGroup} · {student.subject}
                      </Text>
                    </View>

                    {/* Retards pill. */}
                    <View
                      className="px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: '#FEF3C7' }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '800',
                          color: '#B45309',
                        }}
                      >
                        {`${student.retardCount} retardos`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------
// SUBCOMPONENTES LOCALES
// ---------------------------------------------------------------------

// StatCard: tarjeta de métrica.
const StatCard = ({
  label,
  value,
  valueColor,
  bgColor,
  icon: Icon,
  iconColor,
}) => (
  <View
    className="flex-1 rounded-2xl p-3"
    style={{ backgroundColor: bgColor }}
  >
    <View className="flex-row items-center justify-between">
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: '#475569',
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
      {Icon ? (
        <Icon size={14} color={iconColor} strokeWidth={2.25} />
      ) : null}
    </View>
    <Text
      className="mt-1"
      style={{ fontSize: 24, fontWeight: '800', color: valueColor }}
    >
      {value}
    </Text>
  </View>
);

// SectionHeader: header de sección.
const SectionHeader = ({ icon: Icon, iconColor, title }) => (
  <View className="flex-row items-center mt-4 mx-4 mb-2">
    <Icon size={14} color={iconColor} strokeWidth={2.25} />
    <Text
      className="ml-1.5 text-slate-500"
      style={{
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}
    >
      {title}
    </Text>
  </View>
);
