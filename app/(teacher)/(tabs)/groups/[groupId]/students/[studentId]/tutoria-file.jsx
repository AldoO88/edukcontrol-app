// =====================================================================
// app/(teacher)/(tabs)/groups/[groupId]/students/[studentId]/tutoria-file.jsx
// ---------------------------------------------------------------------
// Ruta "/groups/:groupId/students/:studentId/tutoria-file" del route
// group (teacher). Pantalla "Expediente de Tutoría / Educación
// Socioemocional".
//
// A diferencia de file.jsx (materia regular: evaluación + asistencia
// de UNA materia), esta pantalla muestra el SEGUIMIENTO integral del
// alumno en todas sus materias, su asistencia general, citatorios,
// avisos y reportes de conducta — el rol del tutor/maestro de
// socioemocional.
//
// Se renderiza condicionalmente desde students/index.jsx cuando el
// grupo tiene isTutoria === true.
//
// Estructura visual (de arriba a abajo):
//
//   ┌────────────────────────────────────────┐
//   │ DashboardHeader + SchoolInfoCard       │
//   ├────────────────────────────────────────┤
//   │ < Volver (al directorio del grupo)     │
//   ├────────────────────────────────────────┤
//   │ Student Profile Card                   │
//   │  - [Alumno Bajo Tutoría] (amber pill)  │
//   │  - Avatar + Nombre                     │
//   │  - Group X • No. Control: Y           │
//   ├────────────────────────────────────────┤
//   │ Action Buttons (phone/email/whatsapp)  │
//   ├────────────────────────────────────────┤
//   │ Ficha de Inclusión y Salud (trigger)   │
//   ├────────────────────────────────────────┤
//   │ Trimestre Selector (T1 | T2 | T3)     │
//   ├────────────────────────────────────────┤
//   │ Actividades por Materia (acordeón)     │
//   │  - Matemáticas 9.2 ▼                  │
//   │  - Tecnología 8.0 ▼ [OFIMÁTICA]       │
//   ├────────────────────────────────────────┤
//   │ Historial del Alumno                   │
//   │ [ Citatorios | Avisos | Conducta ]     │
//   │  (contenido según tab activa)          │
//   └────────────────────────────────────────┘
//
// Recibe `groupId` y `studentId` (MongoDB ObjectIds) desde la URL
// anidada. Carga datos vía `getStudentTutoriaFile` del endpoint real.
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
  ChevronRight,
  Phone,
  Mail,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  Eye,
  ShieldCheck,
  Megaphone,
  Bell,
  MapPin,
} from 'lucide-react-native';

// Servicio del endpoint.
import { getStudentTutoriaFile } from '@/src/services/teacherService';

// Config de íconos y colores por materia.
import { getSubjectConfig } from '@/src/constants/subjectConfig';

// Hook del dashboard docente (escuela + maestro).
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Modal de Ficha de Inclusión y Salud.
import InclusionModal from '@/app/(teacher)/_components/InclusionModal';

// Helpers.
import { getInitials } from '@/src/utils/textHelpers';
// ---------------------------------------------------------------------
// PERIODS: configuración del selector de trimestre.
// ---------------------------------------------------------------------
const PERIODS = [
  { id: 'T1', label: 'T1' },
  { id: 'T2', label: 'T2' },
  { id: 'T3', label: 'T3' },
];

// ---------------------------------------------------------------------
// HISTORY_TABS: configuración del selector de historial del alumno.
// ---------------------------------------------------------------------
const HISTORY_TABS = [
  { id: 'citations', label: 'Citatorios' },
  { id: 'announcements', label: 'Avisos' },
  { id: 'conduct', label: 'Conducta' },
];

// ---------------------------------------------------------------------
// CITATION_TYPE_STYLES: colores y labels por tipo de citatorio.
// ---------------------------------------------------------------------
const CITATION_TYPE_STYLES = {
  behavioral:    { bg: '#FEF2F2', fg: '#DC2626', label: 'Conductual' },
  academic:      { bg: '#EFF6FF', fg: '#2563EB', label: 'Académico' },
  administrative:{ bg: '#FEF3C7', fg: '#D97706', label: 'Administrativo' },
};

// ---------------------------------------------------------------------
// CITATION_STATUS_STYLES: colores y labels por status de citatorio.
// ---------------------------------------------------------------------
const CITATION_STATUS_STYLES = {
  pending:   { bg: '#FEF3C7', fg: '#92400E', label: 'Pendiente' },
  confirmed: { bg: '#DBEAFE', fg: '#1E40AF', label: 'Confirmado' },
  completed: { bg: '#D1FAE5', fg: '#065F46', label: 'Atendido' },
  no_show:   { bg: '#FEE2E2', fg: '#991B1B', label: 'Inasistió' },
  cancelled: { bg: '#F1F5F9', fg: '#64748B', label: 'Cancelado' },
};

// =====================================================================
// SUB-COMPONENTE: SubjectCard (acordeón de materia)
// =====================================================================
// Card expandible que muestra el nombre de la materia, su promedio
// y al expandir despliega las actividades individuales con fecha y
// calificación.
// =====================================================================
function SubjectCard({ subject, tallerName, isExpanded, onToggle }) {
  // Color del promedio: red si < 6.0, slate oscuro si pasa, gray si null.
  const averageColor = subject.average == null ? '#94A3B8' : subject.average < 6.0 ? '#DC2626' : '#0F172A';

  // Ícono y color de la materia desde la config centralizada.
  const { Icon: SubjectIcon, color: subjectColor } = getSubjectConfig(subject.name);

  return (
    <View
      className="bg-white rounded-2xl border border-slate-100 mb-3 overflow-hidden"
      style={{
        shadowColor: '#0F172A',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}
    >
      {/* Header de la materia: nombre + promedio + chevron. */}
      <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between px-4 py-3"
        accessibilityRole="button"
        accessibilityLabel={`${subject.name}, promedio ${subject.average}`}
        accessibilityState={{ expanded: isExpanded }}
      >
        <View className="flex-row items-center flex-1">
          <SubjectIcon size={16} color={subjectColor} strokeWidth={2} />
          <Text
            className="ml-2 text-slate-900 flex-1"
            style={{ fontSize: 14, fontWeight: '700' }}
            numberOfLines={1}
          >
            {subject.name}
          </Text>
          {subject.isTaller && tallerName && (
            <View
              className="px-2 py-0.5 rounded-full ml-2"
              style={{ backgroundColor: '#F3E8FF' }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '700',
                  color: '#7C3AED',
                  letterSpacing: 0.3,
                }}
                numberOfLines={1}
              >
                {tallerName}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center">
          <Text
            style={{
              fontSize: 16,
              fontWeight: '800',
              color: averageColor,
            }}
          >
            {subject.average != null ? subject.average.toFixed(1) : '--'}
          </Text>
          <View className="ml-2">
            {isExpanded ? (
              <ChevronUp size={16} color="#64748B" strokeWidth={2.5} />
            ) : (
              <ChevronDown size={16} color="#64748B" strokeWidth={2.5} />
            )}
          </View>
        </View>
      </Pressable>

      {/* Actividades individuales + Asistencia (solo si está expandido). */}
      {isExpanded && (
        <View
          className="border-t border-slate-100 px-4 py-2"
          style={{ backgroundColor: '#FAFBFC' }}
        >
          {/* Lista de actividades */}
          {subject.activities.length > 0 ? (
            subject.activities.map((activity, idx) => {
              const actColor = activity.grade == null ? '#94A3B8' : activity.grade < 6.0 ? '#DC2626' : '#0284C7';
              return (
                <View
                  key={idx}
                  className="flex-row items-center justify-between py-2"
                  style={{
                    borderBottomWidth: idx < subject.activities.length - 1 || subject.attendance ? 1 : 0,
                    borderBottomColor: '#F1F5F9',
                  }}
                >
                  <Text
                    className="flex-1 text-slate-700"
                    style={{ fontSize: 12, fontWeight: '500' }}
                    numberOfLines={1}
                  >
                    {activity.name}
                  </Text>
                  <Text
                    className="text-slate-400 mx-3"
                    style={{ fontSize: 11, fontWeight: '500' }}
                  >
                    {activity.date}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: actColor,
                    }}
                  >
                    {activity.grade != null ? activity.grade.toFixed(1) : '--'}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text className="text-slate-400 py-2" style={{ fontSize: 12 }}>
              Sin actividades registradas
            </Text>
          )}

          {/* Resumen de asistencia de la materia */}
          {subject.attendance && (
            <View
              className="flex-row items-center justify-around py-3 mt-2 rounded-xl"
              style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#F8FAFC' }}
            >
              {/* Presentes */}
              <View className="items-center">
                <CheckCircle size={16} color="#10B981" strokeWidth={2.5} />
                <Text className="text-slate-900 mt-1" style={{ fontSize: 14, fontWeight: '700' }}>
                  {subject.attendance.present}
                </Text>
                <Text className="text-slate-400" style={{ fontSize: 9, fontWeight: '600' }}>
                  Presentes
                </Text>
              </View>
              {/* Faltas */}
              <View className="items-center">
                <XCircle size={16} color="#EF4444" strokeWidth={2.5} />
                <Text className="text-slate-900 mt-1" style={{ fontSize: 14, fontWeight: '700' }}>
                  {subject.attendance.absences}
                </Text>
                <Text className="text-slate-400" style={{ fontSize: 9, fontWeight: '600' }}>
                  Faltas
                </Text>
              </View>
              {/* Justificadas */}
              <View className="items-center">
                <ShieldCheck size={16} color="#10B981" strokeWidth={2.5} />
                <Text className="text-slate-900 mt-1" style={{ fontSize: 14, fontWeight: '700' }}>
                  {subject.attendance.justified || 0}
                </Text>
                <Text className="text-slate-400" style={{ fontSize: 9, fontWeight: '600' }}>
                  Justificadas
                </Text>
              </View>
              {/* Retardos */}
              <View className="items-center">
                <Clock size={16} color="#F97316" strokeWidth={2.5} />
                <Text className="text-slate-900 mt-1" style={{ fontSize: 14, fontWeight: '700' }}>
                  {subject.attendance.tardies}
                </Text>
                <Text className="text-slate-400" style={{ fontSize: 9, fontWeight: '600' }}>
                  Retardos
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function TutoriaFileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  // IDs vienen como path params de la URL anidada
  // (/groups/:groupId/students/:studentId/tutoria-file).
  const studentId = params.studentId;
  const groupId = params.groupId;

  // ============================================================
  // FETCH DEL ENDPOINT REAL
  // ============================================================
  const [studentData, setStudentData] = useState(null);
  const [tallerData, setTallerData] = useState(null);
  const [tutoriaData, setTutoriaData] = useState(null);
  const [citationsData, setCitationsData] = useState([]);
  const [announcementsData, setAnnouncementsData] = useState([]);
  const [conductData, setConductData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchFile = async () => {
      if (!studentId || !groupId) {
        setError('Faltan parámetros para cargar el expediente.');
        setLoading(false);
        return;
      }
      setLoading(true);
      const result = await getStudentTutoriaFile(studentId, groupId);
      if (cancelled) return;
      if (result.success && result.data) {
        setStudentData(result.data.student);
        setTallerData(result.data.taller);
        setTutoriaData({
          group: result.data.group,
          trimesters: result.data.trimesters,
        });
        setCitationsData(result.data.citations || []);
        setAnnouncementsData(result.data.announcements || []);
        setConductData(result.data.conduct || []);
      } else {
        setError(result.message || 'No se pudo cargar el expediente.');
      }
      setLoading(false);
    };
    fetchFile();
    return () => { cancelled = true; };
  }, [studentId, groupId]);

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
  const [selectedPeriod, setSelectedPeriod] = useState('T1');
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [isInclusionModalOpen, setIsInclusionModalOpen] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState('citations');

  // ============================================================
  // DATA DEL TRIMESTRE SELECCIONADO
  // ============================================================
  const currentTrimesterData = useMemo(() => {
    if (!tutoriaData) return null;
    return tutoriaData.trimesters[selectedPeriod] || null;
  }, [tutoriaData, selectedPeriod]);

  // ============================================================
  // TOGGLE ACORDEÓN DE MATERIA
  // ============================================================
  const toggleSubject = (subjectName) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjectName]: !prev[subjectName],
    }));
  };

  // ============================================================
  // NAVEGACIÓN A DETALLE (Historial del Alumno)
  // ============================================================
  const navigateToCitation = (id) => {
    router.push({ pathname: `/(teacher)/citations/${id}`, params: { fromTutoria: 'true' } });
  };
  const navigateToAnnouncement = (id) => {
    router.push({ pathname: `/(teacher)/announcements/${id}`, params: { fromTutoria: 'true' } });
  };
  const navigateToConduct = (id) => {
    router.push({ pathname: `/(teacher)/conduct/${id}`, params: { fromTutoria: 'true' } });
  };

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
          ============================================================ */}
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
            Expediente de Tutoría
          </Text>
        </View>
      </View>

      {/* ============================================================
          SCROLL CONTENT
          ============================================================ */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* ============================================================
            STUDENT PROFILE CARD
            ============================================================
            Card centrada con: badge "Alumno Bajo Tutoría", avatar,
            nombre, grupo y No. Control. Patrón Stitch-style (mismo
            que file.jsx).
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
          {/* Badge: Alumno Bajo Tutoría (amber). */}
          <View
            className="flex-row items-center px-3 py-1.5 rounded-full"
            style={{ backgroundColor: '#FEF3C7' }}
          >
            <AlertTriangle size={12} color="#D97706" strokeWidth={2.5} />
            <Text
              className="ml-1.5"
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: '#92400E',
                letterSpacing: 0.3,
              }}
            >
              Alumno Bajo Tutoría
            </Text>
          </View>

          {/* Avatar grande (iniciales en círculo). */}
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

          {/* Subtitle: Group X  •  No. Control: Y. */}
          <Text
            className="mt-1 text-slate-500 text-center"
            style={{ fontSize: 12, fontWeight: '500' }}
          >
            {`Grupo ${tutoriaData?.group?.label || ''}  •  No. Control: ${studentData.controlNumber || ''}`}
          </Text>
        </View>

        {/* ============================================================
            ACTION BUTTONS (phone / email / whatsapp)
            ============================================================
            Botones de acción mockup: solo UI, sin handler funcional.
            Se implementarán cuando exista el backend real.
            ============================================================ */}
        <View className="flex-row justify-center mx-4 mt-4" style={{ gap: 16 }}>
          {/* Teléfono. */}
          <Pressable
            onPress={() => {}}
            className="items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: '#F1F5F9',
            }}
            accessibilityRole="button"
            accessibilityLabel="Llamar al tutor"
          >
            <Phone size={20} color="#64748B" strokeWidth={2} />
          </Pressable>

          {/* Email. */}
          <Pressable
            onPress={() => {}}
            className="items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: '#F1F5F9',
            }}
            accessibilityRole="button"
            accessibilityLabel="Enviar email al tutor"
          >
            <Mail size={20} color="#64748B" strokeWidth={2} />
          </Pressable>

          {/* WhatsApp. */}
          <Pressable
            onPress={() => {}}
            className="items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: '#FEF3C7',
            }}
            accessibilityRole="button"
            accessibilityLabel="Enviar WhatsApp al tutor"
          >
            <MessageCircle size={20} color="#D97706" strokeWidth={2} />
          </Pressable>
        </View>

        {/* ============================================================
            INCLUSION TRIGGER BUTTON
            ============================================================
            Abre el Modal de Ficha de Inclusión y Salud.
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
          <Text
            className="flex-1 ml-3 text-slate-900"
            style={{ fontSize: 14, fontWeight: '700' }}
          >
            Ficha de Inclusión y Salud
          </Text>
          <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
        </Pressable>

        {/* ============================================================
            TRIMESTRE SELECTOR (T1 | T2 | T3)
            ============================================================
            Selector de trimestre: filtra las materias, asistencia y
            conducta mostrados. Default: T1.
            ============================================================ */}
        <View
          className="mx-4 mt-5 flex-row rounded-xl p-1"
          style={{ backgroundColor: '#F1F5F9' }}
        >
          {PERIODS.map((p) => {
            const isActive = selectedPeriod === p.id;
            const hasData = tutoriaData?.trimesters?.[p.id] !== undefined;
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
                  opacity: hasData ? 1 : 0.4,
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
            ACTIVIDADES POR MATERIA (TRIMESTRAL)
            ============================================================
            Sección de acordeones: cada materia muestra su nombre,
            promedio general y al expandir despliega las actividades
            individuales con fecha y calificación.
            ============================================================ */}
        <View className="mx-4 mt-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text
              className="text-slate-900 flex-1"
              style={{ fontSize: 15, fontWeight: '700' }}
            >
              Actividades por Materia{'\n'}(Trimestral)
            </Text>
            <View
              className="px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: '#F1F5F9' }}
            >
              <Text
                className="text-slate-500"
                style={{ fontSize: 10, fontWeight: '600' }}
              >
                Trimestre{'\n'}{selectedPeriod.replace('T', '')}
              </Text>
            </View>
          </View>

          {/* Sin datos del trimestre seleccionado. */}
          {!currentTrimesterData && (
            <View className="items-center py-8">
              <Text className="text-slate-400" style={{ fontSize: 13 }}>
                Sin datos para este trimestre
              </Text>
            </View>
          )}

          {/* Lista de materias (acordeón). */}
          {currentTrimesterData?.subjects.map((subject) => (
            <SubjectCard
              key={subject.name}
              subject={subject}
              tallerName={tallerData?.name}
              isExpanded={!!expandedSubjects[subject.name]}
              onToggle={() => toggleSubject(subject.name)}
            />
          ))}
        </View>

        {/* ============================================================
            HISTORIAL DEL ALUMNO (Citatorios | Avisos | Conducta)
            ============================================================
            Sección general (no filtrada por trimestre) con segmented
            control para alternar entre citatorios, avisos y conducta.
            ============================================================ */}
        <View className="mx-4 mt-5">
          <Text
            className="text-slate-900 mb-3"
            style={{ fontSize: 15, fontWeight: '700' }}
          >
            Historial del Alumno
          </Text>

          {/* Segmented control: Citatorios | Avisos | Conducta. */}
          <View
            className="flex-row rounded-xl p-1 mb-4"
            style={{ backgroundColor: '#F1F5F9' }}
          >
            {HISTORY_TABS.map((tab) => {
              const isActive = activeHistoryTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveHistoryTab(tab.id)}
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
              TAB: CITATORIOS
              ============================================================ */}
          {activeHistoryTab === 'citations' && (
            <View>
              {citationsData.length > 0 ? (
                <View
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
                  style={{
                    shadowColor: '#0F172A',
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 1,
                  }}
                >
                  {citationsData.map((citation, idx) => {
                    const typeStyle = CITATION_TYPE_STYLES[citation.type] || CITATION_TYPE_STYLES.behavioral;
                    const statusStyle = CITATION_STATUS_STYLES[citation.status] || CITATION_STATUS_STYLES.pending;
                    const scheduledDate = citation.scheduledDate
                      ? new Date(citation.scheduledDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '';
                    return (
                      <Pressable
                        key={citation._id}
                        onPress={() => navigateToCitation(citation._id)}
                        className="px-4 py-3"
                        style={{
                          borderBottomWidth: idx < citationsData.length - 1 ? 1 : 0,
                          borderBottomColor: '#F1F5F9',
                        }}
                      >
                        {/* Fila superior: icono + tipo + status. */}
                        <View className="flex-row items-center">
                          <View
                            className="items-center justify-center"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: typeStyle.bg,
                            }}
                          >
                            <AlertTriangle size={14} color={typeStyle.fg} strokeWidth={2.5} />
                          </View>
                          <View
                            className="px-2 py-0.5 rounded-full ml-2"
                            style={{ backgroundColor: typeStyle.bg }}
                          >
                            <Text
                              style={{
                                fontSize: 9,
                                fontWeight: '700',
                                color: typeStyle.fg,
                                letterSpacing: 0.3,
                              }}
                            >
                              {typeStyle.label}
                            </Text>
                          </View>
                          <View
                            className="px-2 py-0.5 rounded-full ml-auto"
                            style={{ backgroundColor: statusStyle.bg }}
                          >
                            <Text
                              style={{
                                fontSize: 9,
                                fontWeight: '700',
                                color: statusStyle.fg,
                                letterSpacing: 0.3,
                              }}
                            >
                              {statusStyle.label}
                            </Text>
                          </View>
                        </View>

                        {/* Motivo del citatorio. */}
                        <Text
                          className="text-slate-900 mt-2"
                          style={{ fontSize: 13, fontWeight: '600' }}
                          numberOfLines={2}
                        >
                          {citation.reason}
                        </Text>

                        {/* Fecha + ubicación + creador. */}
                        <View className="flex-row items-center mt-1.5 flex-wrap">
                          <View className="flex-row items-center">
                            <Calendar size={11} color="#94A3B8" strokeWidth={2} />
                            <Text
                              className="text-slate-400 ml-1"
                              style={{ fontSize: 11, fontWeight: '500' }}
                            >
                              {scheduledDate}
                            </Text>
                          </View>
                          {citation.location && (
                            <View className="flex-row items-center ml-3">
                              <MapPin size={11} color="#94A3B8" strokeWidth={2} />
                              <Text
                                className="text-slate-400 ml-1"
                                style={{ fontSize: 11, fontWeight: '500' }}
                              >
                                {citation.location}
                              </Text>
                            </View>
                          )}
                          {citation.creator && (
                            <Text
                              className="text-slate-400 ml-auto"
                              style={{ fontSize: 10, fontWeight: '500' }}
                            >
                              {citation.creator.name}
                            </Text>
                          )}
                        </View>

                        {/* Chevron de navegación. */}
                        <View className="absolute right-3 top-1/2 -translate-y-1/2">
                          <ChevronRight size={14} color="#CBD5E1" strokeWidth={2.5} />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View
                  className="bg-white rounded-2xl p-6 border border-slate-100 items-center"
                  style={{
                    shadowColor: '#0F172A',
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 1,
                  }}
                >
                  <AlertTriangle size={24} color="#94A3B8" strokeWidth={2} />
                  <Text
                    className="text-slate-500 mt-2"
                    style={{ fontSize: 13, fontWeight: '500' }}
                  >
                    Sin citatorios registrados
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ============================================================
              TAB: AVISOS
              ============================================================ */}
          {activeHistoryTab === 'announcements' && (
            <View>
              {announcementsData.length > 0 ? (
                <View
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
                  style={{
                    shadowColor: '#0F172A',
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 1,
                  }}
                >
                  {announcementsData.map((aviso, idx) => {
                    const isUrgent = aviso.priority === 'urgent';
                    const createdDate = aviso.createdAt
                      ? new Date(aviso.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '';
                    return (
                      <Pressable
                        key={aviso._id}
                        onPress={() => navigateToAnnouncement(aviso._id)}
                        className="px-4 py-3"
                        style={{
                          borderBottomWidth: idx < announcementsData.length - 1 ? 1 : 0,
                          borderBottomColor: '#F1F5F9',
                        }}
                      >
                        {/* Fila superior: icono + prioridad badge. */}
                        <View className="flex-row items-center">
                          <View
                            className="items-center justify-center"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: isUrgent ? '#FEF2F2' : '#EFF6FF',
                            }}
                          >
                            {isUrgent ? (
                              <Bell size={14} color="#DC2626" strokeWidth={2.5} />
                            ) : (
                              <Megaphone size={14} color="#2563EB" strokeWidth={2.5} />
                            )}
                          </View>
                          <View
                            className="px-2 py-0.5 rounded-full ml-2"
                            style={{ backgroundColor: isUrgent ? '#FEF2F2' : '#EFF6FF' }}
                          >
                            <Text
                              style={{
                                fontSize: 9,
                                fontWeight: '700',
                                color: isUrgent ? '#DC2626' : '#2563EB',
                                letterSpacing: 0.3,
                              }}
                            >
                              {isUrgent ? 'Urgente' : 'Informativo'}
                            </Text>
                          </View>
                        </View>

                        {/* Título del aviso. */}
                        <Text
                          className="text-slate-900 mt-2"
                          style={{ fontSize: 13, fontWeight: '600' }}
                          numberOfLines={1}
                        >
                          {aviso.title}
                        </Text>

                        {/* Mensaje truncado. */}
                        <Text
                          className="text-slate-500 mt-0.5"
                          style={{ fontSize: 12, fontWeight: '400' }}
                          numberOfLines={2}
                        >
                          {aviso.message}
                        </Text>

                        {/* Fecha + remitente. */}
                        <View className="flex-row items-center mt-1.5">
                          <View className="flex-row items-center">
                            <Calendar size={11} color="#94A3B8" strokeWidth={2} />
                            <Text
                              className="text-slate-400 ml-1"
                              style={{ fontSize: 11, fontWeight: '500' }}
                            >
                              {createdDate}
                            </Text>
                          </View>
                          {aviso.sender && (
                            <Text
                              className="text-slate-400 ml-auto"
                              style={{ fontSize: 10, fontWeight: '500' }}
                            >
                              {aviso.sender.name}
                            </Text>
                          )}
                        </View>

                        {/* Chevron de navegación. */}
                        <View className="absolute right-3 top-1/2 -translate-y-1/2">
                          <ChevronRight size={14} color="#CBD5E1" strokeWidth={2.5} />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View
                  className="bg-white rounded-2xl p-6 border border-slate-100 items-center"
                  style={{
                    shadowColor: '#0F172A',
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 1,
                  }}
                >
                  <Megaphone size={24} color="#94A3B8" strokeWidth={2} />
                  <Text
                    className="text-slate-500 mt-2"
                    style={{ fontSize: 13, fontWeight: '500' }}
                  >
                    Sin avisos registrados
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ============================================================
              TAB: CONDUCTA
              ============================================================ */}
          {activeHistoryTab === 'conduct' && (
            <View>
              {conductData.length > 0 ? (
                <View
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
                  style={{
                    shadowColor: '#0F172A',
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 1,
                  }}
                >
                  {conductData.map((report, idx) => (
                    <Pressable
                      key={report.id}
                      onPress={() => navigateToConduct(report.id)}
                      className="flex-row items-start px-4 py-3"
                      style={{
                        borderBottomWidth: idx < conductData.length - 1 ? 1 : 0,
                        borderBottomColor: '#F1F5F9',
                      }}
                    >
                      <View
                        className="items-center justify-center mt-0.5"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: '#FEF2F2',
                        }}
                      >
                        <AlertTriangle size={14} color="#EF4444" strokeWidth={2.5} />
                      </View>
                      <View className="flex-1 ml-3">
                        <Text
                          className="text-slate-900"
                          style={{ fontSize: 13, fontWeight: '600' }}
                        >
                          {report.text}
                        </Text>
                        <Text
                          className="text-slate-400 mt-0.5"
                          style={{ fontSize: 11, fontWeight: '500' }}
                        >
                          {report.date}
                        </Text>
                      </View>

                      {/* Chevron de navegación. */}
                      <View className="items-center justify-center ml-2" style={{ height: 28 }}>
                        <ChevronRight size={14} color="#CBD5E1" strokeWidth={2.5} />
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View
                  className="bg-white rounded-2xl p-6 border border-slate-100 items-center"
                  style={{
                    shadowColor: '#0F172A',
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 1,
                  }}
                >
                  <Calendar size={24} color="#10B981" strokeWidth={2} />
                  <Text
                    className="text-slate-500 mt-2"
                    style={{ fontSize: 13, fontWeight: '500' }}
                  >
                    Sin reportes de conducta
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ============================================================
          MODAL: Ficha de Inclusión y Salud
          ============================================================ */}
      <InclusionModal
        isVisible={isInclusionModalOpen}
        onClose={() => setIsInclusionModalOpen(false)}
        pedagogical={null}
      />
    </View>
  );
}
