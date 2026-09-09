// =====================================================================
// app/(teacher)/(tabs)/groups/[groupId]/attendance/today.jsx
// ---------------------------------------------------------------------
// Ruta "/groups/:groupId/attendance/today" del route group (teacher).
// Sub-route de `attendance.jsx` (la matrix completa). Esta pantalla
// es la "vista de acción rápida" del pase de lista del día actual:
//
//   ┌────────────────────────────────────────┐
//   │ DashboardHeader + SchoolInfoCard       │  chrome compartido
//   ├────────────────────────────────────────┤
//   │ < Volver (a la matrix)                 │
//   ├────────────────────────────────────────┤
//   │ Header: "Tomar Asistencia"            │
//   │ Card info clase + pill de fecha (hoy) │
//   ├────────────────────────────────────────┤
//   │ 3 stats (Total / Presentes / Ausentes)│
//   ├────────────────────────────────────────┤
//   │ Lista de alumnos                      │
//   │   - Avatar + name + listNumber       │
//   │   - Status pill                       │
//   │   - Tap en status pill →             │
//   │     abre EditAttendanceModal con la  │
//   │     lista de opciones (P/F/R/FJ)     │
//   │ - "Guardar Asistencia" (sticky)     │
//   └────────────────────────────────────────┘
//
// Comportamiento nuevo (vs. ciclo de taps anterior):
//   - Antes: tap en status → ciclaba P → F → R → FJ → - → P (4+ taps).
//   - Ahora: tap en status → abre EditAttendanceModal con la lista
//     de 4 estados + nota. El docente toca UNA opción y listo.
//
// TODO: cuando exista el endpoint POST /api/attendance/session,
// el handler de "Guardar Asistencia" hace el POST del array
// de status y navega de vuelta a la matrix.
// =====================================================================

// React + hooks.
import React, { useState, useMemo } from 'react';

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
  ChevronLeft,   // Back a la matrix.
  Save,           // Botón Guardar.
  Users,          // Stats: Total.
  CheckCircle2,   // Stats: Presentes.
  XCircle,        // Stats: Ausentes.
  Calendar,       // Header fecha.
  ChevronRight,   // Hint: tap to edit.
} from 'lucide-react-native';

// Hook del dashboard docente (escuela + maestro).
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';

// Chrome compartido (mismo patrón que el resto de pantallas del
// grupo (teacher): brand + school card arriba).
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Modal reusable con la lista de opciones de status (P/F/R/FJ + nota).
// Mismo componente que usa la matrix (attendance.jsx) para editar
// celdas — UX consistente cross-feature.
import EditAttendanceModal from '@/app/(teacher)/_components/EditAttendanceModal';

// Datos (alumnos del grupo) y helpers de status/fecha compartidos
// con la matrix. Misma convención que `citationHelpers` + `mockCitatorios`.
import MOCK_STUDENTS from '@/src/constants/mockStudents';
import {
  todayIso,
  formatFull,
  STATUS_STYLES,
} from '@/src/utils/attendanceHelpers';
// ---------------------------------------------------------------------
// MOCK_INITIAL_STATUS
// ---------------------------------------------------------------------
// Estado inicial de la sesión de HOY para cada alumno. Usamos el
// esquema del modelo del backend (mapa studentId → status code 'P' |
// 'F' | 'R' | 'FJ' | '-'). Inicializamos todo a '-' (sin registro) para
// que el docente tenga que tocar a cada uno explícitamente. Cuando
// exista el endpoint, este objeto se hidrata del backend.
// ---------------------------------------------------------------------
const MOCK_INITIAL_TODAY_STATUS = MOCK_STUDENTS.reduce((acc, s) => {
  acc[s._id] = '-';
  return acc;
}, {});

// Helper: cuenta totales a partir del mapa de status de HOY.
const countByStatus = (statusMap) => {
  const counts = { total: 0, presentes: 0, ausentes: 0, retardo: 0, justificado: 0 };
  for (const code of Object.values(statusMap)) {
    counts.total += 1;
    if (code === 'P') counts.presentes += 1;
    else if (code === 'F') counts.ausentes += 1;
    else if (code === 'R') counts.retardo += 1;
    else if (code === 'FJ') counts.justificado += 1;
  }
  return counts;
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function TakeAttendanceTodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  // groupId viene del segmento [groupId] (lo necesitamos para el PATCH
  // al backend en el EditAttendanceModal).
  const groupId = params.groupId;

  // ============================================================
  // DASHBOARD DATA (mismo endpoint que el resto del (teacher))
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
  // ESTADO: status map de HOY
  // ============================================================
  // Mapa studentId → status code ('P' | 'F' | 'R' | 'FJ' | '-').
  // Inicializado desde MOCK_INITIAL_TODAY_STATUS (todos en '-').
  const [statusByStudent, setStatusByStudent] = useState(
    MOCK_INITIAL_TODAY_STATUS,
  );

  // ============================================================
  // ESTADO: modal de edición
  // ============================================================
  // `editingStudent` = student object actualmente en el modal (o null
  // si el modal está cerrado). Almacenamos el student completo (no
  // solo el id) para que el modal pueda mostrar el nombre + avatar.
  const [editingStudent, setEditingStudent] = useState(null);

  // ============================================================
  // HANDLERS
  // ============================================================
  // Tap en un alumno: abre el modal de edición con las 4 opciones
  // (P / F / R / FJ) en una lista (NO cicla status con múltiples taps).
  const handleStudentTap = (student) => {
    setEditingStudent(student);
  };

  // Cuando el modal guarda (onSaved), actualizamos el status del
  // alumno en el mapa. El modal también maneja su propia lógica
  // del PATCH al backend; acá solo actualizamos el state local.
  const handleSaved = (student, newStatus) => {
    setStatusByStudent((prev) => ({
      ...prev,
      [student._id]: newStatus,
    }));
    setEditingStudent(null);
  };

  // Cuando el modal se cierra sin guardar (tap fuera / X / back).
  const handleCloseModal = () => {
    setEditingStudent(null);
  };

  // Tap en "Guardar Asistencia": POST del status map al backend
  // (TODO cuando exista el endpoint) + navega de vuelta a la matrix.
  const handleSave = () => {
    // TODO: POST al backend con statusByStudent + groupId + date.
    console.log('[TakeAttendanceToday] save:', {
      groupId,
      date: todayIso(),
      statusByStudent,
    });
    // Volvemos a la matrix para que el docente vea el resultado
    // persistido (la matrix re-fetchea del backend).
    router.replace(
      `/(teacher)/groups/${groupId}/attendance`,
    );
  };

  // Stats derivados del estado actual.
  const counts = useMemo(
    () => countByStatus(statusByStudent),
    [statusByStudent],
  );

  // Fecha de hoy (formateada) para el pill del header + el modal.
  const today = todayIso();
  const todayLabel = formatFull(today);
  // Objeto date que consume EditAttendanceModal (label + full + iso).
  const todayDateObj = useMemo(
    () => ({ iso: today, full: todayLabel, label: 'Hoy' }),
    [today, todayLabel],
  );

  // Status actual del alumno en edición (para pre-seleccionar en el
  // modal). Si no hay nadie en edición, default '-'.
  const editingCurrentStatus = editingStudent
    ? statusByStudent[editingStudent._id] || '-'
    : '-';

  return (
    <View className="flex-1 bg-[#F8FAFC]">
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

      {/* ============================================================
          HEADER: back + título
          ============================================================ */}
      <View className="flex-row items-center px-4 mt-4">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver a la matriz de asistencia"
          className="items-center justify-center -ml-2"
          style={{ padding: 8 }}
          hitSlop={8}
        >
          <ChevronLeft size={22} color="#0F172A" strokeWidth={2.25} />
        </Pressable>

        <View className="flex-1 ml-1">
          <Text
            className="text-slate-900"
            style={{ fontSize: 17, fontWeight: '700' }}
            numberOfLines={1}
          >
            Tomar Asistencia
          </Text>
        </View>
      </View>

      {/* ============================================================
          DATE PILL (read-only, "Hoy")
          ============================================================ */}
      <View
        className="mx-4 mt-3 flex-row items-center px-3 py-2 rounded-xl"
        style={{
          backgroundColor: '#E0F2FE',
          borderWidth: 1,
          borderColor: '#BAE6FD',
        }}
      >
        <Calendar size={16} color="#0284C7" strokeWidth={2.25} />
        <Text
          className="ml-2 text-sky-700"
          style={{ fontSize: 13, fontWeight: '700' }}
        >
          {`Hoy · ${todayLabel}`}
        </Text>
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
            STATS ROW (3 cards compactas)
            ============================================================ */}
        <View className="flex-row mx-4 mt-3" style={{ gap: 8 }}>
          <StatCard
            label="Total"
            value={counts.total}
            valueColor="#0F172A"
            bgColor="#F1F5F9"
            icon={Users}
            iconColor="#0284C7"
          />
          <StatCard
            label="Presentes"
            value={counts.presentes}
            valueColor="#15803D"
            bgColor="#DCFCE7"
            icon={CheckCircle2}
            iconColor="#16A34A"
          />
          <StatCard
            label="Ausentes"
            value={counts.ausentes}
            valueColor="#B91C1C"
            bgColor="#FEE2E2"
            icon={XCircle}
            iconColor="#DC2626"
          />
        </View>

        {/* ============================================================
            LISTA DE ALUMNOS (tap → abre modal con opciones)
            ============================================================ */}
        <View className="flex-row items-center justify-between mt-4 mx-4 mb-2">
          <Text
            className="text-slate-500"
            style={{
              fontSize: 11,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {`Alumnos (${MOCK_STUDENTS.length})`}
          </Text>
          <Text
            className="text-slate-400"
            style={{ fontSize: 11 }}
          >
            Toca el status
          </Text>
        </View>
        <View
          className="bg-white rounded-2xl mx-4 border border-slate-100"
          style={{
            shadowColor: '#0F172A',
            shadowOpacity: 0.04,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        >
          {MOCK_STUDENTS.map((student, index) => {
            const code = statusByStudent[student._id] || '-';
            const status = STATUS_STYLES[code] || STATUS_STYLES['-'];
            const isLast = index === MOCK_STUDENTS.length - 1;
            return (
              <Pressable
                key={student._id}
                onPress={() => handleStudentTap(student)}
                accessibilityRole="button"
                accessibilityLabel={`Cambiar estado de ${student.name}, actual ${status.label}`}
                className="flex-row items-center px-3 py-3"
                style={
                  isLast
                    ? undefined
                    : {
                        borderBottomWidth: 1,
                        borderBottomColor: '#F1F5F9',
                      }
                }
              >
                {/* List number circle. */}
                <View
                  className="items-center justify-center mr-3"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: '#F1F5F9',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: '#475569',
                    }}
                  >
                    {student.listNumber}
                  </Text>
                </View>

                {/* Student name. */}
                <Text
                  className="flex-1 text-slate-900"
                  style={{ fontSize: 13, fontWeight: '700' }}
                  numberOfLines={1}
                >
                  {student.name}
                </Text>

                {/* Status pill (tap → abre modal con opciones). */}
                <View
                  className="flex-row items-center pl-2.5 pr-1 py-1 rounded-full"
                  style={{ backgroundColor: status.soft }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: status.color,
                      letterSpacing: 0.5,
                    }}
                  >
                    {code === '-' ? '—' : code}
                  </Text>
                  {/* Chevron hint: indica que se abre un picker. */}
                  <View
                    className="ml-1.5 items-center justify-center"
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: status.color,
                    }}
                  >
                    <ChevronRight
                      size={12}
                      color="#ffffff"
                      strokeWidth={2.5}
                    />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* ============================================================
          SAVE BUTTON (sticky al final, FUERA del ScrollView)
          ============================================================ */}
      <View
        className="px-4 pt-3 border-t border-slate-100"
        style={{
          backgroundColor: '#FFFFFF',
          paddingBottom: insets.bottom + 12,
        }}
      >
        <Pressable
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel="Guardar asistencia de hoy"
          className="flex-row items-center justify-center py-3 rounded-xl"
          style={{
            backgroundColor: '#0284C7',
            shadowColor: '#0284C7',
            shadowOpacity: 0.25,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
        >
          <Save size={16} color="#ffffff" strokeWidth={2.5} />
          <Text
            className="text-white ml-1.5"
            style={{ fontSize: 14, fontWeight: '700' }}
          >
            Guardar Asistencia
          </Text>
        </Pressable>
      </View>

      {/* ============================================================
          EDIT ATTENDANCE MODAL
          ============================================================
          Bottom-sheet con la lista de opciones de status (P/F/R/FJ).
          Mismo componente que usa la matrix para editar celdas — UX
          consistente cross-feature. Al tocar una opción, el modal hace
          el PATCH al backend y nos notifica vía `onSaved` para
          actualizar el state local optimísticamente.
          ============================================================ */}
      <EditAttendanceModal
        visible={editingStudent !== null}
        student={editingStudent}
        date={todayDateObj}
        currentStatus={editingCurrentStatus}
        groupId={groupId}
        onClose={handleCloseModal}
        onSaved={handleSaved}
      />
    </View>
  );
}

// ---------------------------------------------------------------------
// SUBCOMPONENTES LOCALES (no se exportan)
// ---------------------------------------------------------------------

// StatCard: misma firma que las stat cards de citaciones y analytics
// (coherencia visual cross-feature).
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