// =====================================================================
// app/(teacher)/(tabs)/groups/[groupId]/attendance/today.jsx
// ---------------------------------------------------------------------
// Ruta "/groups/:groupId/attendance/today" del route group (teacher).
// Sub-route de `attendance/index.jsx` (la matriz completa). Esta pantalla
// es la "vista de acción rápida" del pase de lista del día actual:
//
//   ┌────────────────────────────────────────┐
//   │ DashboardHeader + SchoolInfoCard       │  chrome compartido
//   ├────────────────────────────────────────┤
//   │ < Volver (a la matriz)                 │
//   ├────────────────────────────────────────┤
//   │ Header: "Tomar Asistencia"             │
//   │ Card info clase + pill de fecha (hoy)  │
//   ├────────────────────────────────────────┤
//   │ 3 stats (Total / Presentes / Ausentes) │
//   ├────────────────────────────────────────┤
//   │ Lista de alumnos (REALES del grupo)    │
//   │   - StudentAvatar + "N. Nombre"        │
//   │   - Status pill                        │
//   │   - Tap → EditAttendanceModal (P/F/…)  │
//   │ - "Guardar Asistencia" (sticky)        │
//   └────────────────────────────────────────┘
//
// DATOS REALES (antes era 100% mock con MOCK_STUDENTS):
//   1. GET /grading-periods  → auto-selecciona el período que contiene
//      hoy (o el primero abierto) — misma fuente que la matriz.
//   2. GET /attendance-sessions (groupId + subjectId + periodId) →
//      lista REAL de alumnos del grupo (orden del backend, con
//      photoUrl) + sesiones del período.
//   3. Si ya existe sesión de HOY → se hidrata el status de cada
//      alumno desde sus records (mapBackendStatus).
//   4. Si NO existe sesión de HOY → los taps se acumulan en `dirty` y
//      "Guardar Asistencia" crea la sesión (POST, todos nacen
//      "present") + hace PATCH de los no-presentes.
//
// Flujo de edición (1-tap, igual que la matriz):
//   - Tap en alumno → EditAttendanceModal → una opción → el modal
//     notifica vía onSaved y la PANTALLA persiste con PATCH si ya
//     existe sesión de hoy (optimista + rehidratación en fallo).
// =====================================================================

// React + hooks.
import React, { useState, useMemo, useEffect, useCallback } from 'react';

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
import { useRouter, useLocalSearchParams } from 'expo-router';

// Iconos Lucide.
import {
  ChevronLeft,   // Back a la matriz.
  Save,          // Botón Guardar.
  Users,         // Stats: Total.
  CheckCircle2,  // Stats: Presentes.
  XCircle,       // Stats: Ausentes.
  Calendar,      // Header fecha.
  ChevronRight,  // Hint: tap to edit.
} from 'lucide-react-native';

// Hook del dashboard docente (escuela + maestro).
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';
import { useAuth } from '@/src/hooks/useAuth';

// Chrome compartido (mismo patrón que el resto de pantallas del
// grupo (teacher): brand + school card arriba).
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Modal reusable con la lista de opciones de status (P/F/R/FJ + nota).
// Mismo componente que usa la matriz (attendance/index.jsx) para editar
// celdas — UX consistente cross-feature. El modal solo NOTIFICA la
// elección; la persistencia (PATCH/POST) vive en esta pantalla.
import EditAttendanceModal from '@/app/(teacher)/_components/EditAttendanceModal';

// Avatar circular de alumno (foto Cloudinary → iniciales).
import StudentAvatar from '@/src/components/StudentAvatar';

// Endpoints de asistencia + períodos (mismos que la matriz).
import {
  getGradingPeriods,
  getAttendanceSessions,
  createAttendanceSession,
  updateAttendanceRecord,
} from '@/src/services/teacherService';

// Helpers de fecha/status compartidos con la matriz. `mapBackendStatus`
// hidrata desde los records del backend; `toBackendStatus` traduce el
// código de UI para el PATCH.
import {
  todayIso,
  formatFull,
  STATUS_STYLES,
  mapBackendStatus,
  toBackendStatus,
} from '@/src/utils/attendanceHelpers';

// ---------------------------------------------------------------------
// countByStatus
// ---------------------------------------------------------------------
// Cuenta totales a partir del mapa de status de HOY
// (studentId → 'P' | 'F' | 'R' | 'FJ' | '-').
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// pickInitialPeriod(periods)
// ---------------------------------------------------------------------
// Auto-selección de período para esta vista (no hay dropdown):
//   1. El período ABIERTO que contiene hoy (startDate ≤ hoy ≤ endDate).
//   2. Si ninguno contiene hoy → el primer período abierto.
//   3. Si todos están cerrados → el primero de la lista.
// Los períodos llegan ordenados por `order` desde el backend (igual
// que en attendance/index.jsx).
// ---------------------------------------------------------------------
const pickInitialPeriod = (periods) => {
  if (!periods || periods.length === 0) return null;
  const today = todayIso();
  const open = periods.filter((p) => !p.isClosed);
  const candidates = open.length ? open : periods;
  const containing = candidates.find((p) => {
    // startDate/endDate vienen como ISO 8601 → comparar solo el
    // prefijo de fecha (YYYY-MM-DD) funciona con strings.
    const start = p.startDate ? String(p.startDate).slice(0, 10) : null;
    const end = p.endDate ? String(p.endDate).slice(0, 10) : null;
    if (!start || !end) return false;
    return today >= start && today <= end;
  });
  return containing || candidates[0];
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function TakeAttendanceTodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  // groupId viene del segmento [groupId]; subjectId lo pasa el
  // TeacherDashboard al navegar (currentClass.subject._id).
  const groupId = params.groupId;
  const subjectId = params.subjectId;

  // ============================================================
  // DASHBOARD DATA (mismo endpoint que el resto del (teacher))
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

  // Fecha de hoy (YYYY-MM-DD) — usada en los fetch y en el modal.
  const today = todayIso();
  const todayLabel = formatFull(today);

  // ============================================================
  // ESTADO: períodos (auto-selección, sin dropdown)
  // ============================================================
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // ============================================================
  // ESTADO: alumnos + sesión de hoy
  // ============================================================
  // Lista REAL de alumnos del grupo (orden del backend, con photoUrl).
  const [students, setStudents] = useState([]);
  // id de la sesión ClassAttendance de HOY (null si aún no existe).
  const [todaySessionId, setTodaySessionId] = useState(null);
  // Mapa studentId → código de status ('P' | 'F' | 'R' | 'FJ' | '-').
  const [statusByStudent, setStatusByStudent] = useState({});
  // Taps hechos SIN sesión de hoy: studentId → código. Se persisten
  // en "Guardar Asistencia" (POST crea la sesión + PATCH de faltantes).
  const [dirty, setDirty] = useState({});
  // Loading / error / guardado.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // ============================================================
  // ESTADO: modal de edición
  // ============================================================
  // `editingStudent` = objeto alumno en el modal (null = cerrado).
  const [editingStudent, setEditingStudent] = useState(null);

  // ============================================================
  // FETCH 1: períodos de evaluación → auto-selección
  // ============================================================
  useEffect(() => {
    let cancelled = false;
    const fetchPeriods = async () => {
      setPeriodsLoading(true);
      const result = await getGradingPeriods();
      if (cancelled) return;
      if (result.success && result.data?.periods) {
        const periods = result.data.periods;
        setSelectedPeriod(pickInitialPeriod(periods));
      } else {
        setError(result.message || 'No se pudieron cargar los períodos.');
      }
      setPeriodsLoading(false);
    };
    fetchPeriods();
    return () => { cancelled = true; };
  }, []);

  // ============================================================
  // FETCH 2: sesiones + alumnos del grupo
  // ============================================================
  // Se reutiliza como callback para: carga inicial, reintento tras
  // fallo y recuperación del sessionId cuando el POST responde 409.
  // Devuelve el id de la sesión de hoy (o null).
  const loadSessions = useCallback(async () => {
    if (!groupId || !subjectId || !selectedPeriod?._id) return null;
    setLoading(true);
    setError(null);
    const result = await getAttendanceSessions({
      groupId,
      subjectId,
      periodId: selectedPeriod._id,
    });
    if (!result.success) {
      setError(result.message || 'No se pudieron cargar las sesiones.');
      setLoading(false);
      return null;
    }
    const { sessions = [], students: backendStudents = [] } = result.data || {};

    // Lista de alumnos (orden del backend, con foto → iniciales).
    setStudents(
      backendStudents.map((s) => ({
        _id: s._id,
        fullName: s.fullName,
        photoUrl: s.photoUrl || null,
      })),
    );

    // ¿Ya existe sesión de HOY? → su id habilita el PATCH directo.
    const todaySession = sessions.find(
      (sess) => String(sess.date).split('T')[0] === today,
    );
    const sid = todaySession?._id || null;
    setTodaySessionId(sid);

    // Hidratar el status de HOY: todos en '-' y luego pisa con los
    // records de la sesión de hoy (si existe).
    const initial = {};
    backendStudents.forEach((s) => { initial[s._id] = '-'; });
    if (todaySession) {
      (todaySession.records || []).forEach((rec) => {
        if (initial[rec.student_id] !== undefined) {
          initial[rec.student_id] = mapBackendStatus(rec.status);
        }
      });
    }
    setStatusByStudent(initial);
    setDirty({});
    setLoading(false);
    return sid;
  }, [groupId, subjectId, selectedPeriod?._id, today]);

  // Dispara la carga cuando cambia el período seleccionado / params.
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ============================================================
  // HANDLERS
  // ============================================================
  // Tap en un alumno: abre el modal con las 4 opciones (P/F/R/FJ).
  const handleStudentTap = (student) => {
    setEditingStudent(student);
  };

  // El modal notificó la elección → persistimos y actualizamos local.
  const handleSaved = async (student, newStatus) => {
    setEditingStudent(null);
    const backendStatus = toBackendStatus(newStatus);

    // Actualización optimista: la UI responde al toque de inmediato.
    setStatusByStudent((prev) => ({
      ...prev,
      [student._id]: newStatus,
    }));

    if (!todaySessionId) {
      // La sesión de hoy aún no existe → se acumula para "Guardar".
      setDirty((prev) => ({ ...prev, [student._id]: newStatus }));
      return;
    }
    if (!backendStatus) return; // '-' no tiene equivalente backend.

    // Persistencia directa (la sesión de hoy ya existe).
    const result = await updateAttendanceRecord({
      sessionId: todaySessionId,
      studentId: student._id,
      status: backendStatus,
    });
    if (!result.success) {
      Alert.alert('Error', result.message || 'No se pudo actualizar la asistencia.');
      // Rehidratar contra el servidor para reflejar el estado real.
      loadSessions();
    }
  };

  // Tap en el modal (fuera / X): solo cerrar.
  const handleCloseModal = () => {
    setEditingStudent(null);
  };

  // "Guardar Asistencia": crea la sesión de hoy si no existe (POST,
  // todos nacen "present"), persiste los taps acumulados en `dirty`
  // y navega de vuelta a la matriz (que re-fetchea del backend).
  const handleSave = async () => {
    if (!groupId || !subjectId || !selectedPeriod?._id || saving) return;
    setSaving(true);
    try {
      let sid = todaySessionId;

      // 1) Crear la sesión de HOY si no existe.
      if (!sid) {
        const created = await createAttendanceSession({
          groupId,
          subjectId,
          date: today,
          periodId: selectedPeriod._id,
        });
        if (created.success) {
          sid = created.data?.session?._id || null;
        } else if (created.reason === 'conflict') {
          // Ya existe (creada desde otro dispositivo): recupera su id.
          sid = await loadSessions();
          if (!sid) {
            Alert.alert('Error', 'La sesión de hoy existe pero no se pudo cargar.');
            return;
          }
        } else {
          Alert.alert('Error', created.message || 'No se pudo crear la sesión.');
          return;
        }
      }

      // 2) Persistir los statuses tocados mientras no existía la sesión.
      //    ('P' es el default de la sesión creada → no requiere PATCH.)
      let failed = 0;
      for (const [studentId, code] of Object.entries(dirty)) {
        const backendStatus = toBackendStatus(code);
        if (backendStatus && backendStatus !== 'present') {
          const result = await updateAttendanceRecord({
            sessionId: sid,
            studentId,
            status: backendStatus,
          });
          if (!result.success) {
            failed += 1;
            continue; // queda en `dirty` para un reintento.
          }
        }
        // Registrado (o ya satisfecho por el default 'present').
        setDirty((prev) => {
          const next = { ...prev };
          delete next[studentId];
          return next;
        });
      }
      if (failed > 0) {
        Alert.alert(
          'Aviso',
          `No se pudieron guardar ${failed} registro(s). Reintenta el guardado.`,
        );
        return; // nos quedamos en la pantalla (la sesión ya existe).
      }

      // Volvemos a la matriz para que el docente vea el resultado
      // persistido (la matriz re-fetchea del backend).
      router.replace(`/(teacher)/groups/${groupId}/attendance`);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DERIVADOS (stats + fecha para el modal)
  // ============================================================
  const counts = useMemo(
    () => countByStatus(statusByStudent),
    [statusByStudent],
  );

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

  // ¿La pantalla aún no tiene datos para mostrar?
  const showLoading = (periodsLoading || loading) && Boolean(subjectId);
  // Falta el parámetro subjectId (deep link sin materia).
  const missingSubject = !subjectId;

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
        user={user}
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
            HEADER DE LISTA + hint
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
            {`Alumnos (${students.length})`}
          </Text>
          <Text
            className="text-slate-400"
            style={{ fontSize: 11 }}
          >
            Toca el status
          </Text>
        </View>

        {/* ============================================================
            ESTADOS: loading / error / sin materia / lista real
            ============================================================ */}
        {showLoading && (
          <View
            className="bg-white rounded-2xl mx-4 border border-slate-100 items-center justify-center py-10"
            style={{ elevation: 1 }}
          >
            <ActivityIndicator size="large" color="#0284C7" />
            <Text className="text-slate-400 text-sm mt-3">
              Cargando alumnos...
            </Text>
          </View>
        )}

        {!showLoading && error && (
          <View
            className="bg-white rounded-2xl mx-4 border border-slate-100 items-center px-5 py-6"
            style={{ elevation: 1 }}
          >
            <Text
              className="text-slate-700 text-center"
              style={{ fontSize: 13, fontWeight: '600' }}
            >
              {error}
            </Text>
            <Pressable
              onPress={loadSessions}
              accessibilityRole="button"
              accessibilityLabel="Reintentar cargar la asistencia"
              className="mt-4 px-5 py-2.5 rounded-xl bg-sky-500"
            >
              <Text
                className="text-white"
                style={{ fontSize: 13, fontWeight: '700' }}
              >
                Reintentar
              </Text>
            </Pressable>
          </View>
        )}

        {!showLoading && !error && missingSubject && (
          <View
            className="bg-white rounded-2xl mx-4 border border-slate-100 items-center px-5 py-6"
            style={{ elevation: 1 }}
          >
            <Text
              className="text-slate-700 text-center"
              style={{ fontSize: 13, fontWeight: '600' }}
            >
              No se pudo identificar la materia. Abre esta pantalla desde
              tu clase de hoy en el dashboard.
            </Text>
          </View>
        )}

        {!showLoading && !error && !missingSubject && students.length === 0 && (
          <View
            className="bg-white rounded-2xl mx-4 border border-slate-100 items-center px-5 py-6"
            style={{ elevation: 1 }}
          >
            <Text
              className="text-slate-500 text-center"
              style={{ fontSize: 13 }}
            >
              Este grupo no tiene alumnos activos.
            </Text>
          </View>
        )}

        {!showLoading && !error && students.length > 0 && (
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
            {students.map((student, index) => {
              const code = statusByStudent[student._id] || '-';
              const status = STATUS_STYLES[code] || STATUS_STYLES['-'];
              const isLast = index === students.length - 1;
              return (
                <Pressable
                  key={student._id}
                  onPress={() => handleStudentTap(student)}
                  accessibilityRole="button"
                  accessibilityLabel={`Cambiar estado de ${student.fullName}, actual ${status.label}`}
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
                  {/* Avatar: foto Cloudinary → iniciales. */}
                  <StudentAvatar
                    uri={student.photoUrl}
                    name={student.fullName}
                    size={36}
                  />

                  {/* Student name (prefijo = posición en la lista). */}
                  <Text
                    className="flex-1 text-slate-900 ml-3"
                    style={{ fontSize: 13, fontWeight: '700' }}
                    numberOfLines={1}
                  >
                    {`${index + 1}. ${student.fullName}`}
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
        )}
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
          disabled={
            saving ||
            showLoading ||
            Boolean(error) ||
            missingSubject ||
            students.length === 0
          }
          accessibilityRole="button"
          accessibilityLabel="Guardar asistencia de hoy"
          className="flex-row items-center justify-center py-3 rounded-xl"
          style={{
            backgroundColor:
              saving ||
              showLoading ||
              error ||
              missingSubject ||
              students.length === 0
                ? '#94A3B8'
                : '#0284C7',
            shadowColor: '#0284C7',
            shadowOpacity: 0.25,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Save size={16} color="#ffffff" strokeWidth={2.5} />
          )}
          <Text
            className="text-white ml-1.5"
            style={{ fontSize: 14, fontWeight: '700' }}
          >
            {saving ? 'Guardando...' : 'Guardar Asistencia'}
          </Text>
        </Pressable>
      </View>

      {/* ============================================================
          EDIT ATTENDANCE MODAL
          ============================================================
          Bottom-sheet con la lista de opciones de status (P/F/R/FJ).
          Mismo componente que usa la matriz — UX consistente. El modal
          solo notifica vía `onSaved`; el PATCH lo hace `handleSaved`
          (si ya existe sesión de hoy) o "Guardar Asistencia" (si no).
          ============================================================ */}
      <EditAttendanceModal
        visible={editingStudent !== null}
        student={editingStudent}
        date={todayDateObj}
        currentStatus={editingCurrentStatus}
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
