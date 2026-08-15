// =====================================================================
// app/(teacher)/take-attendance.jsx
// ---------------------------------------------------------------------
// Ruta "/take-attendance" del route group (app). Pantalla para
// tomar asistencia como docente. Muestra la información de la
// clase actual, un resumen de contadores (presentes, retardos,
// ausentes) y la lista de alumnos con botones P/R/F.
//
// =====================================================================
// CHROME COMPARTIDO
// ---------------------------------------------------------------------
//   - DashboardHeader:    isotipo sky-500 + "EdukControl" + campana
//   - SchoolInfoCard:     logo + nombre + ciclo escolar
//
// =====================================================================
// DATA SOURCE
// ---------------------------------------------------------------------
// - useTeacherDashboard: info de la clase actual y school.
// - useGroupStudents(groupId): lista de alumnos del grupo.
//   Endpoint: GET /api/teacher-subjects/me/groups/:groupId/students
// =====================================================================

// React + hooks.
import React, { useMemo, useState, useCallback } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';

// Navegación.
import { useRouter, useLocalSearchParams } from 'expo-router';

// Iconos Lucide.
import {
  ChevronLeft,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react-native';

// clsx.
import { clsx } from 'clsx';

// Componentes del chrome compartido.
import DashboardHeader from '../../src/components/DashboardHeader';
import SchoolInfoCard from '../../src/components/SchoolInfoCard';

// Hook del dashboard docente.
import { useTeacherDashboard } from '../../src/hooks/useTeacherDashboard';

// Hook de alumnos del grupo.
import { useGroupStudents } from '../../src/hooks/useGroupStudents';

// Servicio de teacher para guardar asistencia.
import { saveAttendance } from '../../src/services/teacherService';

// =====================================================================
// CONSTANTS
// ---------------------------------------------------------------------
// Estados de asistencia disponibles para cada alumno.
// =====================================================================
const ATTENDANCE_STATES = {
  PRESENT: 'present',
  LATE: 'late',
  ABSENT: 'absent',
};

// Colores para cada estado de asistencia.
const STATE_COLORS = {
  [ATTENDANCE_STATES.PRESENT]: {
    bg: 'bg-emerald-500',
    text: 'text-white',
    icon: CheckCircle,
  },
  [ATTENDANCE_STATES.LATE]: {
    bg: 'bg-amber-500',
    text: 'text-white',
    icon: Clock,
  },
  [ATTENDANCE_STATES.ABSENT]: {
    bg: 'bg-rose-500',
    text: 'text-white',
    icon: XCircle,
  },
};

// Labels para los botones de estado.
const STATE_LABELS = {
  [ATTENDANCE_STATES.PRESENT]: 'P',
  [ATTENDANCE_STATES.LATE]: 'R',
  [ATTENDANCE_STATES.ABSENT]: 'F',
};

// =====================================================================
// COMPONENTE: AttendanceStateButton
// ---------------------------------------------------------------------
// Botón circular para seleccionar el estado de asistencia de un
// alumno. Muestra P, R o F según el estado.
// =====================================================================
function AttendanceStateButton({ state, isSelected, onPress }) {
  const colors = STATE_COLORS[state];

  return (
    <Pressable
      onPress={onPress}
      className={clsx(
        'w-12 h-12 rounded-full items-center justify-center ml-2',
        isSelected ? colors.bg : 'bg-slate-100',
      )}
      accessibilityRole="button"
      accessibilityLabel={`Marcar como ${
        state === ATTENDANCE_STATES.PRESENT
          ? 'presente'
          : state === ATTENDANCE_STATES.LATE
          ? 'retardo'
          : 'ausente'
      }`}
    >
      {isSelected ? (
        <colors.icon size={20} color="#ffffff" strokeWidth={2.5} />
      ) : (
        <Text className={clsx(
          'text-base font-bold',
          isSelected ? colors.text : 'text-slate-500',
        )}>
          {STATE_LABELS[state]}
        </Text>
      )}
    </Pressable>
  );
}

// =====================================================================
// COMPONENTE: StudentAttendanceRow
// ---------------------------------------------------------------------
// Fila de un alumno con avatar, nombre, ID y botones de asistencia.
// =====================================================================
function StudentAttendanceRow({ student, attendance, onStateChange, index }) {
  // Determinar iniciales para el avatar fallback.
  const initials = useMemo(() => {
    const name = student.fullName || '';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, [student]);

  // Formatear nombre: "Numero. Apellido1 Apellido2 Nombre"
  // El backend envía "Nombre Apellido1 Apellido2".
  // Queremos mostrar "1. Aguilar Delgado Fernanda"
  const displayName = useMemo(() => {
    const name = student.fullName || '';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 3) {
      const firstName = parts[0];
      const lastNames = parts.slice(1).join(' ');
      return `${index}. ${lastNames} ${firstName}`;
    }
    return `${index}. ${name}`;
  }, [student, index]);

  return (
    <View
      className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 mb-3 flex-row items-center"
      style={{ elevation: 1 }}
    >
      {/* Avatar o iniciales. */}
      {student.photoUrl ? (
        <Image
          source={{ uri: student.photoUrl }}
          className="w-12 h-12 rounded-full"
          accessibilityLabel={`Foto de ${student.fullName}`}
        />
      ) : (
        <View className="w-12 h-12 rounded-full bg-sky-100 items-center justify-center">
          <Text className="text-sm font-bold text-sky-700">
            {initials}
          </Text>
        </View>
      )}

      {/* Nombre + No. Control + Estado de asistencia. */}
      <View className="flex-1 ml-3">
        <Text className="text-base font-bold text-slate-900" numberOfLines={2}>
          {displayName}
        </Text>
        <Text className="text-sm text-slate-500 mt-0.5">
          No. Control: {student.controlNumber}
        </Text>
        {/* Badge de checked_in: verde si está en la escuela. */}
        {student.checked_in !== undefined && (
          <View className={clsx(
            'self-start mt-1 px-2 py-0.5 rounded-full',
            student.checked_in ? 'bg-emerald-100' : 'bg-slate-100',
          )}>
            <Text className={clsx(
              'text-[10px] font-bold',
              student.checked_in ? 'text-emerald-700' : 'text-slate-400',
            )}>
              {student.checked_in ? 'En escuela' : 'Sin registro'}
            </Text>
          </View>
        )}
      </View>

      {/* Botones de asistencia: P, R, F. */}
      <View className="flex-row items-center">
        <AttendanceStateButton
          state={ATTENDANCE_STATES.PRESENT}
          isSelected={attendance === ATTENDANCE_STATES.PRESENT}
          onPress={() => onStateChange(ATTENDANCE_STATES.PRESENT)}
        />
        <AttendanceStateButton
          state={ATTENDANCE_STATES.LATE}
          isSelected={attendance === ATTENDANCE_STATES.LATE}
          onPress={() => onStateChange(ATTENDANCE_STATES.LATE)}
        />
        <AttendanceStateButton
          state={ATTENDANCE_STATES.ABSENT}
          isSelected={attendance === ATTENDANCE_STATES.ABSENT}
          onPress={() => onStateChange(ATTENDANCE_STATES.ABSENT)}
        />
      </View>
    </View>
  );
}

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function TakeAttendanceScreen() {
  // -----------------------------------------------------------------
  // HOOKS
  // -----------------------------------------------------------------
  const router = useRouter();
  const params = useLocalSearchParams();
  const { data, isLoading: isLoadingDashboard } = useTeacherDashboard();

  // groupId y subjectId vienen como parámetros de navegación desde el dashboard.
  const groupId = params.groupId;
  const subjectId = params.subjectId;

  // Hook de alumnos del grupo: se llama cuando hay groupId y subjectId.
  const {
    data: groupData,
    isLoading: isLoadingStudents,
    error: studentsError,
    fetchStudents,
  } = useGroupStudents(groupId, subjectId);

  // Cargar alumnos al montar o cuando cambie el groupId o subjectId.
  // subjectId es opcional: cuando se llega desde "Mis Grupos" (groups.jsx)
  // solo se pasa groupId (el endpoint de alumnos funciona sin subject_id).
  React.useEffect(() => {
    if (groupId) {
      fetchStudents();
    }
  }, [groupId, subjectId, fetchStudents]);

  // -----------------------------------------------------------------
  // ESTADO LOCAL
  // -----------------------------------------------------------------
  // Mapa de controlNumber → estado seleccionado.
  const [attendanceMap, setAttendanceMap] = useState({});
  // Estado de envío de asistencia.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // -----------------------------------------------------------------
  // DERIVADOS
  // -----------------------------------------------------------------
  // Obtener la info de la clase actual del dashboard.
  const currentClass = data?.todaySchedule?.currentClass;

  // Students del endpoint de grupo.
  const students = groupData?.students || [];
  const groupInfo = groupData?.group;
  const attendanceId = groupData?.attendance_id || null;

  // Pre-llenar attendanceMap con saved_status cuando llegan los datos.
  React.useEffect(() => {
    if (groupData?.students?.length > 0) {
      const initialMap = {};
      groupData.students.forEach((student) => {
        // Si tiene saved_status, mapearlo al formato del frontend.
        if (student.saved_status) {
          // Mapear del backend al frontend: "retard" → "late"
          initialMap[student.controlNumber] =
            student.saved_status === 'retard' ? ATTENDANCE_STATES.LATE : student.saved_status;
        }
      });
      setAttendanceMap(initialMap);
    }
  }, [groupData]);

  // School info normalizada.
  const school = useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.currentSchoolYear?.name || null,
    };
  }, [data?.school, data?.currentSchoolYear]);

  // Contadores de asistencia.
  const counters = useMemo(() => {
    const values = Object.values(attendanceMap);
    return {
      present: values.filter((v) => v === ATTENDANCE_STATES.PRESENT).length,
      late: values.filter((v) => v === ATTENDANCE_STATES.LATE).length,
      absent: values.filter((v) => v === ATTENDANCE_STATES.ABSENT).length,
    };
  }, [attendanceMap]);

  // -----------------------------------------------------------------
  // HANDLERS
  // -----------------------------------------------------------------
  // Manejar cambio de estado de asistencia de un alumno.
  const handleStateChange = useCallback((controlNumber, state) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [controlNumber]: state,
    }));
  }, []);

  // Confirmar asistencia: enviar datos al backend.
  const handleConfirm = useCallback(async () => {
    // Evitar múltiples envíos.
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Validar que todos los alumnos tengan estatus seleccionado.
      const studentsWithoutStatus = students.filter(
        (student) => !attendanceMap[student.controlNumber]
      );

      if (studentsWithoutStatus.length > 0) {
        setSubmitError(
          `Faltan ${studentsWithoutStatus.length} alumno(s) por marcar. Selecciona P, R o F para todos.`
        );
        setIsSubmitting(false);
        return;
      }

      // Obtener fecha actual.
      const now = new Date();

      // Construir el array de records.
      const records = students.map((student) => {
        const status = attendanceMap[student.controlNumber];
        // Mapear estados del frontend al formato del backend.
        const backendStatus = status === ATTENDANCE_STATES.LATE ? 'retard' : status;

        return {
          student_id: student._id,
          status: backendStatus,
        };
      });

      // Construir el body del request.
      const attendanceData = {
        group_id: groupId,
        subject_id: groupData?.subject_id || subjectId,
        date: now.toISOString().split('T')[0], // "2026-08-09"
        records,
      };

      // Si ya existe asistencia, incluir attendance_id para actualizar.
      if (attendanceId) {
        attendanceData.attendance_id = attendanceId;
      }

      // Enviar al backend.
      const result = await saveAttendance(attendanceData);

      if (!result.success) {
        setSubmitError(result.message);
        return;
      }

      // Éxito: navegar de vuelta.
      router.back();
    } catch (err) {
      console.error('[TakeAttendance] unexpected error:', err);
      setSubmitError('Error inesperado al guardar la asistencia.');
    } finally {
      setIsSubmitting(false);
    }
  }, [students, attendanceMap, groupId, subjectId, groupData, attendanceId, isSubmitting, router]);

  // -----------------------------------------------------------------
  // RENDER: LOADING
  // -----------------------------------------------------------------
  if (isLoadingDashboard && !data) {
    return (
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0f172a" />
          <Text className="text-sm text-slate-500 mt-3 font-medium">
            Cargando alumnos...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header compartido: brand + campana. */}
      <DashboardHeader />

      {/* School info card. */}
      <SchoolInfoCard
        school={school}
        isLoading={isLoadingDashboard}
        className="mx-4 mt-4"
      />

      {/* Link "Volver". */}
      <Pressable
        onPress={() => router.back()}
        className="flex-row items-center px-4 mt-4"
        accessibilityRole="button"
        accessibilityLabel="Volver al dashboard"
      >
        <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
        <Text className="text-sm font-semibold text-sky-600 ml-1">
          Volver
        </Text>
      </Pressable>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ============================================================
            INFO DE LA CLASE ACTUAL
            ============================================================ */}
        {currentClass && (
          <View className="px-4 mt-5">
            <View
              className="bg-white rounded-2xl border border-slate-200 border-t-[5px] border-t-sky-500 shadow-sm px-5 py-4"
              style={{ elevation: 2 }}
            >
              {/* Materia + Grupo. */}
              <Text className="text-lg font-bold text-slate-900">
                {currentClass.subject?.name} · {currentClass.group?.label}
              </Text>

              {/* Horario. */}
              <View className="flex-row items-center mt-2">
                <Clock size={14} color="#64748b" strokeWidth={2} />
                <Text className="text-sm text-slate-600 ml-2">
                  {currentClass.startTime} - {currentClass.endTime}
                </Text>
              </View>

              {/* Contadores de asistencia. */}
              <View className="flex-row flex-wrap gap-2 mt-4">
                {/* Presentes. */}
                <View className="flex-row items-center bg-emerald-50 px-4 py-2 rounded-full">
                  <CheckCircle size={16} color="#059669" strokeWidth={2} />
                  <Text className="text-sm font-bold text-emerald-700 ml-1.5">
                    {counters.present} Presentes
                  </Text>
                </View>

                {/* Retardos. */}
                <View className="flex-row items-center bg-amber-50 px-4 py-2 rounded-full">
                  <Clock size={16} color="#d97706" strokeWidth={2} />
                  <Text className="text-sm font-bold text-amber-700 ml-1.5">
                    {counters.late} Retardos
                  </Text>
                </View>

                {/* Ausentes. */}
                <View className="flex-row items-center bg-rose-50 px-4 py-2 rounded-full">
                  <XCircle size={16} color="#e11d48" strokeWidth={2} />
                  <Text className="text-sm font-bold text-rose-700 ml-1.5">
                    {counters.absent} Ausentes
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ============================================================
            LISTA DE ALUMNOS
            ============================================================ */}
        <View className="px-4 mt-5">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">
            Alumnos ({students.length})
          </Text>

          {isLoadingStudents ? (
            <View className="bg-white rounded-2xl p-6 items-center">
              <ActivityIndicator size="small" color="#0f172a" />
              <Text className="text-sm text-slate-500 mt-2">
                Cargando alumnos...
              </Text>
            </View>
          ) : studentsError ? (
            <View className="bg-white rounded-2xl p-6 items-center">
              <AlertCircle size={24} color="#e11d48" strokeWidth={2} />
              <Text className="text-sm text-rose-600 mt-2 text-center">
                {studentsError}
              </Text>
              <Pressable
                onPress={fetchStudents}
                className="mt-3 px-4 py-2 bg-sky-600 rounded-xl"
              >
                <Text className="text-sm font-semibold text-white">
                  Reintentar
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {students.map((student, index) => (
                <View key={student.controlNumber}>
                  <StudentAttendanceRow
                    student={student}
                    attendance={attendanceMap[student.controlNumber]}
                    onStateChange={(state) => handleStateChange(student.controlNumber, state)}
                    index={index + 1}
                  />
                  {/* Indicador de alumno sin marcar. */}
                  {submitError && !attendanceMap[student.controlNumber] && (
                    <View className="bg-amber-50 rounded-xl px-3 py-1 mb-2 -mt-2">
                      <Text className="text-[10px] font-bold text-amber-600">
                        ⚠ Selecciona un estatus para este alumno
                      </Text>
                    </View>
                  )}
                </View>
              ))}

              {students.length === 0 && (
                <View className="bg-white rounded-2xl p-6 items-center">
                  <Users size={24} color="#94a3b8" strokeWidth={2} />
                  <Text className="text-sm text-slate-500 mt-2 text-center">
                    No hay alumnos registrados en este grupo.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* ============================================================
          BOTÓN CONFIRMAR (fijo abajo)
          ============================================================ */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
        {/* Error message. */}
        {submitError && (
          <View className="bg-rose-50 rounded-xl px-4 py-2 mb-3">
            <Text className="text-sm text-rose-600 text-center">
              {submitError}
            </Text>
          </View>
        )}

        <Pressable
          onPress={handleConfirm}
          disabled={isSubmitting}
          className={clsx(
            'flex-row items-center justify-center rounded-2xl py-4 shadow-md',
            isSubmitting ? 'bg-slate-400' : 'bg-sky-600 active:bg-sky-700',
          )}
          style={{ elevation: 4 }}
          accessibilityRole="button"
          accessibilityLabel="Confirmar asistencia"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <CheckCircle size={20} color="#ffffff" strokeWidth={2.25} />
          )}
          <Text className="text-white font-bold text-base ml-2">
            {isSubmitting ? 'Guardando...' : 'Confirmar Asistencia'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
