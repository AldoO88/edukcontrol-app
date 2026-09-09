// =====================================================================
// app/(teacher)/(tabs)/grades.jsx
// ---------------------------------------------------------------------
// Ruta "/grades" del route group (teacher). Tab "Calificaciones" del
// bottom nav.
//
// Pantalla de VALIDACIÓN DE CALIFICACIONES del docente. Muestra el
// progreso de cierre de trimestre por grupo y permite revisar/cerrar.
//
// Estructura visual:
//
//   ┌────────────────────────────────────────┐
//   │ DashboardHeader + SchoolInfoCard       │  chrome compartido
//   ├────────────────────────────────────────┤
//   │ Validación de Calificaciones           │
//   ├────────────────────────────────────────┤
//   │ [1er Trim] [2do Trim] [Final]         │  trimester tabs
//   ├────────────────────────────────────────┤
//   │ PROGRESO DE CIERRE  40%               │  progress card
//   │ 2/5 Grupos Cerrados  ████░░░          │
//   ├────────────────────────────────────────┤
//   │ 1° A • Taller de Ofimática I  PROM:9.1│  group cards
//   │ 3° OFIMÁTICA • Tecnología I   PROM:7.8│
//   │ 1° C • Tutoría                 PROM: -│
//   ├────────────────────────────────────────┤
//   │ [Exportar a Excel]                      │  full-width button
//   └────────────────────────────────────────┘
//
// Data source:
//   - GET /api/teacher-subjects/me/grading-periods
//       → lista de períodos (trimestres) del ciclo activo.
//   - GET /api/teacher-subjects/me/grades/validation?grading_period_id=...
//       → progreso + grupos con su status y promedio del trimestre.
// =====================================================================

// React + hooks.
import React, { useState, useMemo, useEffect } from 'react';

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
  Lock,            // Desbloquear.
  CheckCircle2,    // Trimestre cerrado.
  ChevronDown,     // Selector de período dropdown.
  Clock,           // En revisión.
  AlertCircle,     // Pendiente.
  AlertTriangle,   // En riesgo (promedio 6.0-6.9).
  XCircle,         // Reprobados (promedio < 6.0).
  ClipboardList,   // Sin calificación en el período.
  FileSpreadsheet, // Excel.
} from 'lucide-react-native';

// Hook del dashboard docente (escuela + maestro).
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';

// Hook de validación de calificaciones (período + grupos + status).
import { useGradeValidation } from '@/src/hooks/useGradeValidation';

// Servicio para listar los períodos de calificación del ciclo activo.
import { getGradingPeriods, openGrades } from '@/src/services/teacherService';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Helpers de color/icono por materia.
import { getSubjectIcon, getSubjectColor, tintWithAlpha } from '@/src/utils/subjectIcons';

// ---------------------------------------------------------------------
// COLORES POR ESTADO
// ---------------------------------------------------------------------
// Mapeo status del backend → { color, bg, label, icon }.
// Se mantienen hardcoded en el front porque son parte del sistema de
// diseño (consistencia con el resto de cards de la app).
// ---------------------------------------------------------------------
const STATUS_CONFIG = {
  closed: {
    label: 'Trimestre Cerrado (Acta Generada)',
    color: '#059669',    // emerald-600
    bg: '#ECFDF5',       // emerald-50
    icon: CheckCircle2,
  },
  review: {
    label: 'En Revisión',
    color: '#D97706',    // amber-600
    bg: '#FFFBEB',       // amber-50
    icon: Clock,
  },
  pending: {
    label: 'Pendiente de Validación',
    color: '#DC2626',    // red-600
    bg: '#FEF2F2',       // red-50
    icon: AlertCircle,
  },
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function GradesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ============================================================
  // DASHBOARD DATA (escuela + maestro)
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
  // PERÍODOS DE CALIFICACIÓN (trimestres)
  // ============================================================
  // Fetch de los períodos disponibles al montar. Selecciona el primero
  // (por orden del backend) por defecto.
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [periodDropdownVisible, setPeriodDropdownVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchPeriods = async () => {
      setPeriodsLoading(true);
      const result = await getGradingPeriods();
      if (cancelled) return;
      if (result.success && result.data?.periods) {
        const fetchedPeriods = result.data.periods;
        setPeriods(fetchedPeriods);
        if (fetchedPeriods.length > 0) {
          setSelectedPeriodId(fetchedPeriods[0]._id);
        }
      }
      setPeriodsLoading(false);
    };
    fetchPeriods();
    return () => { cancelled = true; };
  }, []);

  // ============================================================
  // VALIDACIÓN DE CALIFICACIONES (período seleccionado)
  // ============================================================
  const {
    data: validationData,
    isLoading: validationLoading,
    error: validationError,
    refetch: refetchValidation,
  } = useGradeValidation(selectedPeriodId);

  // ============================================================
  // DERIVADOS para render
  // ============================================================
  const progress = validationData?.progress || {
    totalGroups: 0,
    closedGroups: 0,
    percentage: 0,
  };

  const groups = validationData?.groups || [];

  const selectedPeriod = periods.find((p) => p._id === selectedPeriodId);

  // ============================================================
  // HANDLERS
  // ============================================================
  // Acción placeholder para "Exportar a Excel" — se mantiene como
  // disabled con Alert hasta que exista el endpoint correspondiente.
  const handleExportConcentrados = () => {
    Alert.alert(
      'Próximamente',
      'La exportación a Excel aún no está disponible.',
    );
  };

  // Acción para desbloquear un trimestre cerrado — elimina el
  // GradeClosing y refresca la lista de validación.
  const handleUnlock = ({ groupId, subjectId, groupLabel }) => {
    Alert.alert(
      'Desbloquear trimestre',
      `¿Estás seguro de desbloquear el trimestre de ${groupLabel}? Esto permitirá volver a editar las calificaciones.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desbloquear',
          style: 'destructive',
          onPress: async () => {
            const result = await openGrades({
              groupId,
              subjectId,
              periodId: selectedPeriodId,
            });
            if (result.success) {
              refetchValidation();
            } else {
              Alert.alert('Error', result.message || 'No se pudo desbloquear el trimestre.');
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* ============================================================
          CHROME COMPARTIDO
          ============================================================ */}
      <DashboardHeader />
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
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* ============================================================
            TÍTULO
            ============================================================ */}
        <Text
          className="mx-4 mt-4"
          style={{ fontSize: 22, fontWeight: '800', color: '#0F172A' }}
        >
          Validación de Calificaciones
        </Text>

        {/* ============================================================
            TRIMESTER DROPDOWN (selector de período)
            ============================================================ */}
        <View className="mx-4 mt-3">
          <View className="relative">
            {/* Trigger del dropdown. */}
            <Pressable
              onPress={() => setPeriodDropdownVisible((v) => !v)}
              className="flex-row items-center bg-white border border-[#E2E8F0] rounded-full px-4 py-2 self-start"
              accessibilityRole="button"
              accessibilityLabel="Seleccionar periodo"
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>
                {selectedPeriod?.name || (periodsLoading ? 'Cargando...' : 'Sin períodos')}
              </Text>
              <ChevronDown
                size={16}
                color="#0F172A"
                strokeWidth={2.25}
                style={{ marginLeft: 6 }}
              />
            </Pressable>

            {/* Panel dropdown (absolute, anclado bajo el trigger). */}
            {periodDropdownVisible && periods.length > 0 && (
              <View
                className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-[#E2E8F0] shadow-sm z-50"
                style={{ elevation: 3, minWidth: 200 }}
              >
                {periods.map((period) => {
                  const isActive = selectedPeriodId === period._id;
                  return (
                    <Pressable
                      key={period._id}
                      onPress={() => {
                        setSelectedPeriodId(period._id);
                        setPeriodDropdownVisible(false);
                      }}
                      className="px-4 py-2.5 border-b border-slate-100"
                      style={{ backgroundColor: isActive ? '#F0F9FF' : '#FFFFFF' }}
                      accessibilityRole="button"
                      accessibilityLabel={`Seleccionar ${period.name}`}
                      accessibilityState={{ selected: isActive }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: isActive ? '700' : '500',
                          color: isActive ? '#0284C7' : '#0F172A',
                        }}
                      >
                        {period.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* ============================================================
            LOADING STATE (períodos o validación)
            ============================================================ */}
        {(periodsLoading || validationLoading) && (
          <View className="mx-4 mt-6 items-center py-8">
            <ActivityIndicator size="large" color="#0284C7" />
            <Text className="text-slate-400 text-sm mt-3">
              {periodsLoading
                ? 'Cargando períodos...'
                : 'Cargando validación...'}
            </Text>
          </View>
        )}

        {/* ============================================================
            ERROR STATE
            ============================================================ */}
        {!periodsLoading && validationError && (
          <View
            className="mx-4 mt-4 rounded-2xl p-4"
            style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
            }}
          >
            <View className="flex-row items-center">
              <AlertCircle size={18} color="#DC2626" strokeWidth={2.25} />
              <Text
                className="ml-2"
                style={{ fontSize: 13, fontWeight: '700', color: '#DC2626' }}
              >
                Error al cargar
              </Text>
            </View>
            <Text
              className="mt-1"
              style={{ fontSize: 12, color: '#991B1B' }}
            >
              {validationError}
            </Text>
            <Pressable
              onPress={refetchValidation}
              className="self-start mt-2 px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: '#DC2626' }}
              accessibilityRole="button"
              accessibilityLabel="Reintentar"
            >
              <Text className="text-white font-bold text-xs">Reintentar</Text>
            </Pressable>
          </View>
        )}

        {/* ============================================================
            CONTENIDO PRINCIPAL (solo si hay datos del período)
            ============================================================ */}
        {!periodsLoading && !validationLoading && !validationError && validationData && (
          <>
            {/* PROGRESS CARD */}
            <View
              className="mx-4 mt-4 rounded-2xl p-4"
              style={{
                backgroundColor: '#FFFFFF',
                shadowColor: '#0F172A',
                shadowOpacity: 0.06,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              {/* Header: label + percentage. */}
              <View className="flex-row items-center justify-between">
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                  }}
                >
                  Progreso de Cierre
                </Text>
                <Text
                  style={{ fontSize: 14, fontWeight: '800', color: '#0284C7' }}
                >
                  {progress.percentage}%
                </Text>
              </View>

              {/* Count: "2/5 Grupos Cerrados". */}
              <View className="flex-row items-baseline mt-2">
                <Text
                  style={{ fontSize: 28, fontWeight: '800', color: '#0F172A' }}
                >
                  {progress.closedGroups}
                </Text>
                <Text
                  className="ml-1"
                  style={{ fontSize: 14, fontWeight: '600', color: '#64748B' }}
                >
                  / {progress.totalGroups} Grupos Cerrados
                </Text>
              </View>

              {/* Progress bar. */}
              <View
                className="mt-3 rounded-full overflow-hidden"
                style={{ height: 8, backgroundColor: '#E2E8F0' }}
              >
                <View
                  className="rounded-full"
                  style={{
                    width: `${progress.percentage}%`,
                    height: 8,
                    backgroundColor: '#0284C7',
                  }}
                />
              </View>
            </View>

            {/* GROUP CARDS */}
            <View className="mx-4 mt-4" style={{ gap: 12 }}>
              {groups.length === 0 ? (
                <View className="bg-white rounded-2xl p-6 items-center border border-slate-100">
                  <Text className="text-sm text-slate-500 text-center">
                    No tienes grupos asignados en este período.
                  </Text>
                </View>
              ) : (
                groups.map((g) => (
                  <GradeGroupCard
                    key={g._id}
                    group={g}
                    onPressReview={(groupData) =>
                      router.push({
                        pathname: `/(teacher)/(tabs)/grades/${groupData.groupId}`,
                        params: {
                          subjectId: groupData.subjectId,
                          periodId: selectedPeriodId,
                          groupLabel: groupData.groupLabel,
                          subjectName: groupData.subjectName,
                          periodName: selectedPeriod?.name || '',
                          subjectColor: groupData.subjectColor,
                          subjectIcon: groupData.subjectIcon,
                        },
                      })
                    }
                    onUnlock={handleUnlock}
                  />
                ))
              )}
            </View>

            {/* EXPORT BUTTON */}
            <Pressable
              className="mx-4 mt-5 mb-2 rounded-2xl overflow-hidden"
              style={{
                backgroundColor: '#0284C7',
                shadowColor: '#0284C7',
                shadowOpacity: 0.3,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
              }}
              onPress={handleExportConcentrados}
              accessibilityRole="button"
              accessibilityLabel="Exportar a Excel"
            >
              <View className="flex-row items-center justify-center py-4 px-6">
                <FileSpreadsheet size={20} color="#FFFFFF" strokeWidth={2.25} />
                <Text
                  className="ml-2"
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: '#FFFFFF',
                  }}
                >
                  Exportar a Excel
                </Text>
              </View>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------
// SUBCOMPONENTES LOCALES
// ---------------------------------------------------------------------

// GradeGroupCard: card individual de grupo con estado, promedio y
// acciones según el estado (cerrado / revisión / pendiente).
//
// Props:
//   - group: objeto del backend con shape:
//       {
//         _id, group: { label, ... }, subject: { name, ... },
//         average, status, closedAt,
//         studentStats: {
//           totalStudents,  // total de alumnos activos
//           atRiskCount,    // 6.0 ≤ promedio < 7.0
//           failedCount,    // promedio < 6.0
//           ungradedCount   // sin nota capturada
//         }
//       }
//   - onPressReview: callback al tocar "Revisar y Cerrar Trimestre" (recibe { groupId, subjectId, groupLabel, subjectName }).
//   - onUnlock: callback al tocar "Desbloquear" (recibe { groupId, subjectId, groupLabel }).
const GradeGroupCard = ({ group, onPressReview, onUnlock }) => {
  const statusConfig = STATUS_CONFIG[group.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const groupLabel = group.group?.label || 'Grupo';
  const subjectName = group.subject?.name || 'Materia';

  // Color e ícono de la materia (con fallback).
  const subjectColor = getSubjectColor(group.subject?.color);
  const SubjectIcon = getSubjectIcon(group.subject?.icon);

  // Color del promedio según el valor.
  const getPromColor = (avg) => {
    if (avg === null || avg === undefined) return '#94A3B8'; // slate-400
    if (avg >= 8) return '#059669';        // emerald-600 (bueno)
    if (avg >= 6) return '#D97706';        // amber-600 (regular)
    return '#DC2626';                       // red-600 (bajo)
  };

  return (
    <View
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: '#FFFFFF',
        shadowColor: '#0F172A',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      {/* Top accent bar (color de la materia). */}
      <View style={{ height: 3, backgroundColor: subjectColor }} />

      <View className="p-4">
        {/* Header: group + subject + prom chip. */}
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <View
              className="items-center justify-center rounded-lg mr-2"
              style={{
                width: 32,
                height: 32,
                backgroundColor: tintWithAlpha(subjectColor, 0.12),
              }}
            >
              <SubjectIcon size={14} color={subjectColor} strokeWidth={2.25} />
            </View>
            <Text
              style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}
              numberOfLines={1}
            >
              {`${groupLabel} • ${subjectName}`}
            </Text>
          </View>
          {/* Promedio chip. */}
          <View
            className="px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: '#F1F5F9' }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '800',
                color: getPromColor(group.average),
              }}
            >
              PROM: {group.average !== null && group.average !== undefined
                ? group.average
                : '—'}
            </Text>
          </View>
        </View>

        {/* Status badge. */}
        <View
          className="flex-row items-center self-start mt-2 px-2.5 py-1 rounded-full"
          style={{ backgroundColor: statusConfig.bg }}
        >
          <StatusIcon size={13} color={statusConfig.color} strokeWidth={2.5} />
          <Text
            className="ml-1.5"
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: statusConfig.color,
            }}
          >
            {statusConfig.label}
          </Text>
        </View>

        {/* ============================================================
            STUDENT STATS (en riesgo / reprobados / sin nota)
            ============================================================
            Fila con 3 chips que resumen la salud del grupo:
              - En riesgo   (6.0 ≤ promedio < 7.0) → amber
              - Reprobados  (promedio < 6.0)      → red
              - Sin nota    (sin captura)         → slate

            Solo se muestran los chips con count > 0. Si los 3 son 0,
            la fila se omite completamente → no inflar la UI con ceros.
            ============================================================ */}
        {group.studentStats && (
          group.studentStats.atRiskCount > 0 ||
          group.studentStats.failedCount > 0 ||
          group.studentStats.ungradedCount > 0
        ) && (
          <View className="flex-row mt-2.5" style={{ gap: 6, flexWrap: 'wrap' }}>
            {group.studentStats.atRiskCount > 0 && (
              <StatChip
                icon={AlertTriangle}
                color="#D97706"
                bg="#FEF3C7"
                count={group.studentStats.atRiskCount}
                label="En riesgo"
              />
            )}
            {group.studentStats.failedCount > 0 && (
              <StatChip
                icon={XCircle}
                color="#DC2626"
                bg="#FEE2E2"
                count={group.studentStats.failedCount}
                label="Reprobados"
              />
            )}
            {group.studentStats.ungradedCount > 0 && (
              <StatChip
                icon={ClipboardList}
                color="#64748B"
                bg="#F1F5F9"
                count={group.studentStats.ungradedCount}
                label="Sin nota"
              />
            )}
          </View>
        )}

        {/* Divider. */}
        <View
          className="mt-3"
          style={{ height: 1, backgroundColor: '#F1F5F9' }}
        />

        {/* Action buttons (según estado). */}
        <View className="mt-3">
          {group.status === 'closed' ? (
            /* Desbloquear. */
            <Pressable
              className="flex-row items-center justify-center py-2.5 rounded-xl"
              style={{
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
              onPress={() => onUnlock?.({
                groupId: group._id,
                subjectId: group.subject?._id,
                groupLabel,
              })}
              accessibilityRole="button"
              accessibilityLabel={`Desbloquear trimestre de ${groupLabel}`}
            >
              <Lock size={15} color="#64748B" strokeWidth={2.25} />
              <Text
                className="ml-1.5"
                style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}
              >
                Desbloquear
              </Text>
            </Pressable>
          ) : (
            /* Revisar y Cerrar Trimestre (review / pending). */
            <Pressable
              className="flex-row items-center justify-center py-2.5 rounded-xl"
              style={{
                backgroundColor: '#0284C7',
                shadowColor: '#0284C7',
                shadowOpacity: 0.25,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
              onPress={() => onPressReview?.({
                groupId: group._id,
                subjectId: group.subject?._id,
                groupLabel: group.group?.label || 'Grupo',
                subjectName: group.subject?.name || 'Materia',
                subjectColor: group.subject?.color || null,
                subjectIcon: group.subject?.icon || null,
              })}
              accessibilityRole="button"
              accessibilityLabel={`Revisar y cerrar trimestre de ${groupLabel}`}
            >
              <CheckCircle2 size={15} color="#FFFFFF" strokeWidth={2.25} />
              <Text
                className="ml-1.5"
                style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}
              >
                Revisar y Cerrar Trimestre
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------
// StatChip
// ---------------------------------------------------------------------
// Pill pequeño para mostrar una métrica de salud del grupo:
//   ⚠️ 5 en riesgo
//   ❌ 2 reprobados
//   📋 1 sin nota
//
// Props:
//   - icon:    componente Lucide (AlertTriangle, XCircle, ClipboardList, ...).
//   - color:   color del ícono + texto (hex).
//   - bg:      color de fondo del pill (hex).
//   - count:   número a mostrar.
//   - label:   texto descriptivo ("En riesgo", "Reprobados", "Sin nota").
//
// Si count es 0, NO se debe renderizar este chip (lo controla el padre
// con la condición `count > 0` antes de instanciarlo).
// ---------------------------------------------------------------------
const StatChip = ({ icon: Icon, color, bg, count, label }) => (
  <View
    className="flex-row items-center px-2 py-1 rounded-full"
    style={{ backgroundColor: bg }}
    accessibilityRole="text"
    accessibilityLabel={`${count} ${label}`}
  >
    <Icon size={11} color={color} strokeWidth={2.5} />
    <Text
      className="ml-1"
      style={{ fontSize: 11, fontWeight: '700', color }}
    >
      {`${count} ${label}`}
    </Text>
  </View>
);
