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
  FileText,
  AlertTriangle,
  Eye,
  ShieldCheck,
  Megaphone,
  TrendingUp,
} from 'lucide-react-native';

// Servicio del endpoint.
import { getStudentTutoriaFile, getConductConfig } from '@/src/services/teacherService';
import { getStudentById } from '@/src/services/prefectService';

// Config de íconos y colores por materia.
import { getSubjectConfig } from '@/src/constants/subjectConfig';

// Hook del dashboard docente (escuela + maestro).
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';
import { useAuth } from '@/src/hooks/useAuth';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Modal de Trabajo Social.
import TrabajoSocialModal from '@/src/components/TrabajoSocialModal';

// Modales del expediente (Citatorios / Avisos / Conducta).
import CitationsModal from './_components/CitationsModal';
import AnnouncementsModal from './_components/AnnouncementsModal';
import ConductModal from './_components/ConductModal';

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
  const { user } = useAuth();
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
  const [isCitationsModalOpen, setIsCitationsModalOpen] = useState(false);
  const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState(false);
  const [isConductModalOpen, setIsConductModalOpen] = useState(false);
  const [healthInclusion, setHealthInclusion] = useState(null);
  const [conductConfig, setConductConfig] = useState(null);

  // ============================================================
  // FETCH: health_inclusion del alumno (endpoint separado)
  // ============================================================
  useEffect(() => {
    let cancelled = false;
    const fetchHealth = async () => {
      try {
        const result = await getStudentById(studentId);
        if (!cancelled && result.success) {
          setHealthInclusion(result.data?.health_inclusion || null);
        }
      } catch (_) {}
    };
    if (studentId) fetchHealth();
    return () => { cancelled = true; };
  }, [studentId]);

  // ============================================================
  // FETCH: conduct_config de la escuela (para el modal de conducta)
  // ============================================================
  useEffect(() => {
    let cancelled = false;
    const fetchConductConfig = async () => {
      try {
        const result = await getConductConfig();
        if (!cancelled && result.success) {
          setConductConfig(result.data);
        }
      } catch (_) {}
    };
    fetchConductConfig();
    return () => { cancelled = true; };
  }, []);

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
          user={user}
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
            TRIGGER: Trabajo Social
            ============================================================
            Abre el Modal de Trabajo Social.
            ============================================================ */}
        <Pressable
          onPress={() => setIsInclusionModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Ver trabajo social"
          className="bg-white rounded-2xl mx-4 mt-3 px-4 py-4 border border-emerald-200 flex-row items-center"
          style={{
            borderLeftWidth: 4,
            borderLeftColor: '#059669',
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
              backgroundColor: '#D1FAE5',
            }}
          >
            <Eye size={20} color="#059669" strokeWidth={2.25} />
          </View>
          <Text
            className="flex-1 ml-3 text-slate-900"
            style={{ fontSize: 14, fontWeight: '700' }}
          >
            Trabajo Social
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
            TRIGGER: Citatorios
            ============================================================
            Abre el modal de citatorios del alumno (estilo Trabajo
            Social del prefect). Patrón consistente: card blanca con
            border-left de color + icono + label + contador + chevron.
            ============================================================ */}
        <Pressable
          onPress={() => setIsCitationsModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Ver citatorios del alumno"
          className="bg-white rounded-2xl mx-4 mt-4 px-4 py-4 border border-amber-200 flex-row items-center"
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
            <FileText size={20} color="#D97706" strokeWidth={2.25} />
          </View>
          <Text
            className="flex-1 ml-3 text-slate-900"
            style={{ fontSize: 14, fontWeight: '700' }}
          >
            Citatorios
          </Text>
          {citationsData.length > 0 && (
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
                {citationsData.length}
              </Text>
            </View>
          )}
          <ChevronRight
            size={18}
            color="#94A3B8"
            strokeWidth={2}
            style={{ marginLeft: 8 }}
          />
        </Pressable>

        {/* ============================================================
            TRIGGER: Avisos
            ============================================================
            Abre el modal de avisos del alumno.
            ============================================================ */}
        <Pressable
          onPress={() => setIsAnnouncementsModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Ver avisos del alumno"
          className="bg-white rounded-2xl mx-4 mt-3 px-4 py-4 border border-sky-200 flex-row items-center"
          style={{
            borderLeftWidth: 4,
            borderLeftColor: '#0284C7',
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
              backgroundColor: '#E0F2FE',
            }}
          >
            <Megaphone size={20} color="#0284C7" strokeWidth={2.25} />
          </View>
          <Text
            className="flex-1 ml-3 text-slate-900"
            style={{ fontSize: 14, fontWeight: '700' }}
          >
            Avisos
          </Text>
          {announcementsData.length > 0 && (
            <View
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: '#BAE6FD' }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: '#0369A1',
                  letterSpacing: 0.3,
                }}
              >
                {announcementsData.length}
              </Text>
            </View>
          )}
          <ChevronRight
            size={18}
            color="#94A3B8"
            strokeWidth={2}
            style={{ marginLeft: 8 }}
          />
        </Pressable>

        {/* ============================================================
            TRIGGER: Conducta
            ============================================================
            Abre el modal de conducta (score + historial).
            ============================================================ */}
        <Pressable
          onPress={() => setIsConductModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Ver conducta del alumno"
          className="bg-white rounded-2xl mx-4 mt-3 px-4 py-4 border border-rose-200 flex-row items-center"
          style={{
            borderLeftWidth: 4,
            borderLeftColor: '#E11D48',
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
              backgroundColor: '#FEF2F2',
            }}
          >
            <TrendingUp size={20} color="#E11D48" strokeWidth={2.25} />
          </View>
          <Text
            className="flex-1 ml-3 text-slate-900"
            style={{ fontSize: 14, fontWeight: '700' }}
          >
            Conducta
          </Text>
          {conductData.length > 0 && (
            <View
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: '#FECDD3' }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: '#9F1239',
                  letterSpacing: 0.3,
                }}
              >
                {conductData.length}
              </Text>
            </View>
          )}
          <ChevronRight
            size={18}
            color="#94A3B8"
            strokeWidth={2}
            style={{ marginLeft: 8 }}
          />
        </Pressable>
      </ScrollView>

      {/* ============================================================
          MODALES DEL EXPEDIENTE
          ============================================================ */}
      <TrabajoSocialModal
        isVisible={isInclusionModalOpen}
        onClose={() => setIsInclusionModalOpen(false)}
        healthInclusion={healthInclusion}
      />
      <CitationsModal
        isVisible={isCitationsModalOpen}
        onClose={() => setIsCitationsModalOpen(false)}
        citations={citationsData}
      />
      <AnnouncementsModal
        isVisible={isAnnouncementsModalOpen}
        onClose={() => setIsAnnouncementsModalOpen(false)}
        announcements={announcementsData}
      />
      <ConductModal
        isVisible={isConductModalOpen}
        onClose={() => setIsConductModalOpen(false)}
        conductLogs={conductData}
        conductConfig={conductConfig}
      />
    </View>
  );
}
