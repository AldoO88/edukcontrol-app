// =====================================================================
// app/(teacher)/(tabs)/groups/[groupId]/students/[studentId]/file.jsx
// ---------------------------------------------------------------------
// Ruta "/groups/:groupId/students/:studentId/file" del route group
// (teacher). Pantalla "Expediente del Alumno y Ficha de Inclusión".
// Drill-down anidado: groups → [groupId] → students → [studentId] →
// file. Reúne:
//
//   ┌────────────────────────────────────────┐
//   │ DashboardHeader + SchoolInfoCard       │
//   ├────────────────────────────────────────┤
//   │ < Volver (al directorio del grupo)     │
//   ├────────────────────────────────────────┤
//   │ Student Profile Card (Stitch-style)    │
//   │  - Subject pill (solo nombre materia)  │
//   │  - Avatar + Nombre                     │
//   │  - Grupo X • No. Control: Y           │
//   ├────────────────────────────────────────┤
//   │ [Inclusión Trigger Button]              │  ← NEW
//   ├────────────────────────────────────────┤
//   │ Overall Summary Metrics (CUMULATIVE)   │
//   │  Promedio General | Asistencia General  │
//   ├────────────────────────────────────────┤
//   │ Period Selector (General | T1 | T2 | T3)│  ← NEW POSITION
//   ├────────────────────────────────────────┤
//   │ Tab Switcher (Evaluación | Asistencia) │
//   ├────────────────────────────────────────┤
//   │ Tab Content (varía por activeTab)      │
//   └────────────────────────────────────────┘
//
// Recibe `groupId` y `studentId` (MongoDB ObjectIds) desde la URL
// anidada. Carga los datos del expediente vía mockStudentFile.js.
//
// ESTADOS:
//   - selectedPeriod  → 'ALL' | 'T1' | 'T2' | 'T3' (filtra tabs).
//   - activeTab        → 'evaluacion' | 'asistencia'.
//   - isInclusionModalOpen → bool (Modal de Ficha de Inclusión).
//
// TODO: cuando exista el endpoint real, reemplazar `getMockStudentFile`
// por una llamada al service correspondiente.
// =====================================================================

// React + hooks.
import React, { useState, useMemo, useEffect } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Navegación.
import { useRouter, useLocalSearchParams } from 'expo-router';

// Iconos Lucide.
import {
  ChevronLeft,
  AlertTriangle,
  Eye,
} from 'lucide-react-native';

// Servicio del endpoint.
import { getStudentFile, getGradingPeriods, getEvaluationTypes } from '@/src/services/teacherService';

// Hook del dashboard docente (escuela + maestro).
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Helpers.
import { getInitials } from '@/src/utils/textHelpers';
// Sub-componentes independientes.
import EvaluationTab from '@/app/(teacher)/_components/EvaluationTab';
import AttendanceTab from '@/app/(teacher)/_components/AttendanceTab';
import InclusionModal from '@/app/(teacher)/_components/InclusionModal';

// ---------------------------------------------------------------------
// PERIODS + TABS: configuración de los selectores.
// ---------------------------------------------------------------------
// Selector de periodo (sobre los tabs): permite ver datos globales
// ('ALL') o filtrar por trimestre (T1/T2/T3).
const PERIODS = [
  { id: 'ALL', label: 'General' },
  { id: 'T1',  label: 'T1' },
  { id: 'T2',  label: 'T2' },
  { id: 'T3',  label: 'T3' },
];

// Tabs activas: solo Evaluación y Asistencia (Bitácora + Inclusión se
// removieron del bar — viven en otros flows).
const TABS = [
  { id: 'evaluacion', label: 'Evaluación' },
  { id: 'asistencia', label: 'Asistencia' },
];

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function StudentFileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  // IDs vienen como path params de la URL anidada
  // (/groups/:groupId/students/:studentId/file).
  const studentId = params.studentId;
  const groupId = params.groupId;
  // subjectId viene del navigation params (pasado desde el directorio).
  const subjectId = params.subjectId;

  // ============================================================
  // FETCH DEL ENDPOINT REAL
  // ============================================================
  const [studentData, setStudentData] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Mapa abreviatura → nombre completo de evaluaciones.
  const [evalNameMap, setEvalNameMap] = useState({});

  useEffect(() => {
    let cancelled = false;
    const fetchFile = async () => {
      if (!studentId || !groupId || !subjectId) {
        setError('Faltan parámetros para cargar el expediente.');
        setLoading(false);
        return;
      }
      setLoading(true);
      const result = await getStudentFile(studentId, groupId, subjectId);
      if (cancelled) return;
      if (result.success && result.data) {
        setStudentData(result.data.student);
        setFileData({
          subject: result.data.subject,
          group: result.data.group,
          metrics: result.data.metrics,
          grades: result.data.grades,
          attendance: result.data.attendance,
          pedagogical: result.data.pedagogical,
        });
      } else {
        setError(result.message || 'No se pudo cargar el expediente.');
      }
      setLoading(false);
    };
    fetchFile();
    return () => { cancelled = true; };
  }, [studentId, groupId, subjectId]);

  // ============================================================
  // FETCH DE EVALUATION TYPES → MAPA abreviatura → nombre
  // ============================================================
  useEffect(() => {
    let cancelled = false;
    const fetchEvalNames = async () => {
      if (!groupId || !subjectId) return;
      // Obtener períodos para tener los period_ids.
      const periodsResult = await getGradingPeriods();
      if (cancelled || !periodsResult.success) return;
      const periods = periodsResult.data?.periods || [];
      if (periods.length === 0) return;
      // Fetch evaluation types con el primer período disponible.
      const evalResult = await getEvaluationTypes({
        groupId,
        subjectId,
        periodId: periods[0]._id,
      });
      if (cancelled || !evalResult.success) return;
      const types = evalResult.data?.evaluationTypes || [];
      // Construir mapa: abbreviation → name.
      const map = {};
      types.forEach((et) => {
        if (et.abbreviation && et.name) {
          map[et.abbreviation] = et.name;
        }
      });
      setEvalNameMap(map);
    };
    fetchEvalNames();
    return () => { cancelled = true; };
  }, [groupId, subjectId]);

  // ============================================================
  // DASHBOARD DATA (escuela + maestro + fecha)
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
  // ESTADOS
  // ============================================================
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');
  const [activeTab, setActiveTab] = useState('evaluacion');
  const [isInclusionModalOpen, setIsInclusionModalOpen] = useState(false);

  // ============================================================
  // MÉTRICAS CUMULATIVAS (Overall Summary)
  // ============================================================
  const overallMetrics = useMemo(() => {
    if (!fileData) {
      return { average: 0, attendance: 0, absences: 0 };
    }
    return {
      average: Number(fileData.metrics?.average || 0),
      attendance: Number(fileData.metrics?.attendancePercentage || 0),
      absences: Number(fileData.metrics?.absencesCount || 0),
    };
  }, [fileData]);

  // ============================================================
  // CONTEO DE ALERTAS (para el badge amber en el trigger button).
  // ============================================================
  const alertCount = useMemo(() => {
    if (!fileData?.pedagogical?.alerts) return 0;
    return fileData.pedagogical.alerts.length;
  }, [fileData]);

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <Text className="text-slate-500" style={{ fontSize: 14 }}>
          Cargando expediente...
        </Text>
      </View>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================
  if (error || !studentData) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <Text
          className="text-slate-900"
          style={{ fontSize: 16, fontWeight: '700' }}
        >
          {error || 'Alumno no encontrado'}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center px-4 mt-3"
          accessibilityRole="button"
          accessibilityLabel="Volver a alumnos"
        >
          <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
          <Text className="text-sm font-semibold text-sky-600 ml-1">
            Volver
          </Text>
        </Pressable>
      </View>
    );
  }

  // Color del promedio (red si < 6.0, cyan si pasa).
  const averageColor = overallMetrics.average < 6.0 ? '#DC2626' : '#0284C7';

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* ============================================================
          A) CHROME COMPARTIDO (brand + school card)
          ============================================================ */}
      <>
        <DashboardHeader />
        <SchoolInfoCard
          school={school}
          isLoading={!school}
          className="mx-4 mt-2"
          teacher={data?.teacher}
          date={currentDate}
        />
      </>

      {/* ============================================================
          HEADER FIJO (back + título de la pantalla)
        */}
      <View className="flex-col items-start px-4 mt-2">
        <Pressable
        onPress={() => router.back()}
        className="flex-row items-center mt-2"
        accessibilityRole="button"
        accessibilityLabel="Volver a mis grupos"
      >
        <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
        <Text className="text-sm font-semibold text-sky-600 ml-1">
          Volver
        </Text>
      </Pressable>

        <View className="mt-2">
          <Text
            className="text-slate-900"
            style={{ fontSize: 17, fontWeight: '700' }}
            numberOfLines={1}
          >
            Expediente del Alumno
          </Text>
        </View>
      </View>

      {/* ============================================================
          SCROLL CONTENT
        */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* ============================================================
            STUDENT PROFILE CARD (Stitch-style: centered hero)
            ============================================================ */}
        <View
          className="bg-white rounded-3xl p-5 mx-4 mt-3 border border-slate-100 items-center"
          style={{
            shadowColor: '#0F172A',
            shadowOpacity: 0.04,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        >
          {/* Subject pill: SOLO el nombre de la materia. */}
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: '#0284C7' }}
          >
            <Text
              className="text-white"
              style={{
                fontSize: 11,
                fontWeight: '800',
                letterSpacing: 0.4,
              }}
            >
              {fileData?.subject?.name || 'Materia'}
            </Text>
          </View>

          {/* Avatar grande (iniciales en círculo azul claro). */}
          <View
            className="items-center justify-center mt-4"
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: '#DBEAFE',
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: '800',
                color: '#0284C7',
                letterSpacing: 0.5,
              }}
            >
              {studentData.initials || getInitials(studentData.fullName)}
            </Text>
          </View>

          {/* Nombre completo. */}
          <Text
            className="mt-3 text-slate-900 text-center"
            style={{ fontSize: 19, fontWeight: '800' }}
            numberOfLines={2}
          >
            {studentData.fullName}
          </Text>

          {/* Subtitle: Grupo X  •  No. Control: Y. */}
          <Text
            className="mt-1 text-slate-500 text-center"
            style={{ fontSize: 12, fontWeight: '500' }}
          >
            {`Grupo ${fileData?.group?.label || ''}  •  No. Control: ${studentData.controlNumber || ''}`}
          </Text>
        </View>

        {/* ============================================================
            INCLUSION TRIGGER BUTTON
            ============================================================
            Abre el Modal de Ficha de Inclusión y Salud. Muestra un
            badge amber con el conteo de alertas si hay.
            ============================================================ */}
        <Pressable
          onPress={() => setIsInclusionModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Ver ficha de inclusión y salud"
          className="bg-white rounded-2xl mx-4 mt-3 px-4 py-4 border border-amber-200 flex-row items-center"
          style={{
            borderLeftWidth: 4,
            borderLeftColor: '#D97706',
            shadowColor: '#0F172A',
            shadowOpacity: 0.04,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        >
          {/* Icono amber. */}
          <View
            className="items-center justify-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: '#FEF3C7',
            }}
          >
            <Eye size={20} color="#D97706" strokeWidth={2.25} />
          </View>

          {/* Título. */}
          <Text
            className="flex-1 ml-3 text-slate-900"
            style={{ fontSize: 14, fontWeight: '700' }}
          >
            Ficha de Inclusión y Salud
          </Text>

          {/* Badge amber de alertas (solo si > 0). */}
          {alertCount > 0 ? (
            <View
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: '#FED7AA' }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: '#C2410C',
                  letterSpacing: 0.3,
                }}
              >
                {`${alertCount} Alertas`}
              </Text>
            </View>
          ) : null}
        </Pressable>

        {/* ============================================================
            OVERALL SUMMARY METRICS (CUMULATIVE)
            ============================================================
            Cards globales del expediente (no por trimestre). Reflejan
            los valores agregados que vienen del backend (file.metrics).
            ============================================================ */}
        <View className="flex-row mx-4 mt-3" style={{ gap: 8 }}>
          {/* Card 1: Promedio General. */}
          <View
            className="flex-1 bg-white rounded-2xl p-4 border border-slate-100"
            style={{
              shadowColor: '#0F172A',
              shadowOpacity: 0.04,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1,
            }}
          >
            <Text
              className="text-slate-500"
              style={{ fontSize: 11, fontWeight: '600' }}
            >
              Promedio General
            </Text>
            <View className="flex-row items-end mt-2">
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: '800',
                  color: averageColor,
                }}
              >
                {overallMetrics.average.toFixed(1)}
              </Text>
              {overallMetrics.average < 6.0 ? (
                <AlertTriangle
                  size={14}
                  color="#DC2626"
                  strokeWidth={2.5}
                  style={{ marginLeft: 4, marginBottom: 4 }}
                />
              ) : null}
            </View>
          </View>

          {/* Card 2: Asistencia General. */}
          <View
            className="flex-1 bg-white rounded-2xl p-4 border border-slate-100"
            style={{
              shadowColor: '#0F172A',
              shadowOpacity: 0.04,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1,
            }}
          >
            <Text
              className="text-slate-500"
              style={{ fontSize: 11, fontWeight: '600' }}
            >
              Asistencia General
            </Text>
            <View className="flex-row items-end mt-2">
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: '800',
                  color: '#0F172A',
                }}
              >
                {`${overallMetrics.attendance}%`}
              </Text>
              {/* Pill "N Faltas Totales" (siempre visible si > 0). */}
              {overallMetrics.absences > 0 ? (
                <View
                  className="ml-2 mb-1 px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#FED7AA' }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '800',
                      color: '#C2410C',
                    }}
                  >
                    {`${overallMetrics.absences} Faltas Totales`}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* ============================================================
            PERIOD SELECTOR (General | T1 | T2 | T3)
            ============================================================
            Selector de periodo global: scope de los tabs Evaluación y
            // Asistencia. "General" muestra datos agregados / completos.
            // ============================================================ */}
        <View
          className="mx-4 mt-4 flex-row rounded-xl p-1"
          style={{ backgroundColor: '#F1F5F9' }}
        >
          {PERIODS.map((p) => {
            const isActive = selectedPeriod === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setSelectedPeriod(p.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                className="flex-1 items-center justify-center py-2 rounded-lg"
                style={{
                  backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                  shadowColor: isActive ? '#0F172A' : 'transparent',
                  shadowOpacity: isActive ? 0.06 : 0,
                  shadowRadius: 3,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: isActive ? 2 : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: isActive ? '#0284C7' : '#64748B',
                  }}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ============================================================
            TAB SWITCHER (Evaluación | Asistencia)
            ============================================================
            Solo 2 tabs (Bitácora e Inclusión fueron removidas del bar
            según el spec). Inclusión vive en el Modal disparado desde
            // el trigger button.
            ============================================================ */}
        <View
          className="mx-4 mt-3 flex-row rounded-xl p-1"
          style={{ backgroundColor: '#F1F5F9' }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                className="flex-1 items-center justify-center py-2 rounded-lg"
                style={{
                  backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                  shadowColor: isActive ? '#0F172A' : 'transparent',
                  shadowOpacity: isActive ? 0.06 : 0,
                  shadowRadius: 3,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: isActive ? 2 : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: isActive ? '#0284C7' : '#64748B',
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ============================================================
            TAB CONTENT
            ============================================================
            Ambos tabs reciben `selectedPeriod` para saber qué
            datos mostrar (ALL vs T1/T2/T3).
            ============================================================ */}
        {activeTab === 'evaluacion' && (
          <EvaluationTab file={fileData} selectedPeriod={selectedPeriod} evalNameMap={evalNameMap} />
        )}
        {activeTab === 'asistencia' && (
          <AttendanceTab file={fileData} selectedPeriod={selectedPeriod} />
        )}
      </ScrollView>

      {/* ============================================================
          MODAL: Ficha de Inclusión y Salud
          ============================================================
          Controlado por `isInclusionModalOpen`. Se monta al final del
          árbol (fuera del ScrollView) para que el stacking de RN lo
          pinte por encima del contenido.
          ============================================================ */}
      <InclusionModal
        isVisible={isInclusionModalOpen}
        onClose={() => setIsInclusionModalOpen(false)}
        pedagogical={fileData?.pedagogical}
      />
    </View>
  );
}