// =====================================================================
// app/(teacher)/(tabs)/groups/[groupId]/attendance.jsx
// ---------------------------------------------------------------------
// Ruta "/groups/:groupId/attendance" del route group (teacher).
// Pantalla "Pase de Lista Matricial" del MAESTRO: tabla de
// asistencias alumno × fecha con columnas dinámicas (agregar /
// eliminar fechas desde la UI).
//
// Se abre desde el botón "Asistencia" del detalle del grupo
// (`/groups/[groupId]`). Recibe `groupId` por URL.
//
// NOTA DE ARQUITECTURA (mock visual):
//   PROTOTIPO VISUAL. Los alumnos y las fechas son datos estáticos
//   en esta fase. Las fechas iniciales sirven como demo; el maestro
//   puede agregar más (+ Nueva Fecha) o eliminarlas (tap en el
//   encabezado de la columna). Los cambios son LOCALES (useState).
//
// INTERACCIÓN:
//   - Tap en celda:       cicla P → F → R → FJ → - → P.
//   - Long press en celda: abre EditAttendanceModal (con nota).
//   - Tap en encabezado de columna: confirma y elimina la fecha.
//
// MODALES REUTILIZABLES (en /_components/):
//   - EditAttendanceModal: edición detallada (long press).
//   - AddDateModal:        agregar columna (calendario visual).
// =====================================================================

// React.
import React, { useMemo, useState, useEffect } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';

// Navegación.
import { useLocalSearchParams, useRouter } from 'expo-router';

// Iconos Lucide.
import { ChevronLeft, Users, Plus, ChevronDown } from 'lucide-react-native';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Chrome compartido.
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import DashboardHeader from '@/src/components/DashboardHeader';

// Servicio para obtener períodos de evaluación y sesiones de asistencia.
import {
  getGradingPeriods,
  getAttendanceSessions,
  createAttendanceSession,
  updateAttendanceRecord,
} from '@/src/services/teacherService';

// Helpers puros.
import {
  todayIso,
  formatShort,
  formatFull,
  STATUS_STYLES,
} from '@/src/utils/attendanceHelpers';
// Modales privados del route group (teacher).
import EditAttendanceModal from '@/app/(teacher)/_components/EditAttendanceModal';
import AddDateModal from '@/app/(teacher)/_components/AddDateModal';

// ---------------------------------------------------------------------
// STATUS_STYLES → importado de '@/src/utils/attendanceHelpers' (status
// colors y labels compartidos con el today view).
// '@/src/utils/attendanceHelpers' (compartidos con la today view).
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// HELPERS: mapeo de status del backend al código del front.
// ---------------------------------------------------------------------
const mapBackendStatus = (status) => {
  const map = { present: 'P', absent: 'F', retard: 'R', justified: 'FJ' };
  return map[status] || '-';
};

// Mapeo inverso: código del front → status del backend.
const mapToFrontendStatus = (code) => {
  const map = { P: 'present', F: 'absent', R: 'retard', FJ: 'justified' };
  return map[code] || 'present';
};

const buildRecordsFromSessions = (sessions, studentId) => {
  const records = {};
  sessions.forEach((sess) => {
    const record = sess.records.find((r) => r.student_id === studentId);
    if (record) {
      const dateKey = sess.date.split('T')[0];
      records[dateKey] = mapBackendStatus(record.status);
    }
  });
  return records;
};

// ---------------------------------------------------------------------
// MOCK_STUDENTS — fallback si el endpoint no devuelve datos.
// ---------------------------------------------------------------------
const MOCK_STUDENTS = [
  {
    _id: 's1',
    name: 'Acosta Rodríguez, Mateo',
    controlNumber: '20241301',
    photoUrl: null,
    records: {
      '2026-08-10': 'P',
      '2026-08-11': 'F',
      '2026-08-12': 'P',
      '2026-08-13': 'R',
      '2026-08-14': 'FJ',
    },
  },
  {
    _id: 's2',
    name: 'Delgado Ríos, Fernanda',
    controlNumber: '20241302',
    photoUrl: null,
    records: {
      '2026-08-10': 'FJ',
      '2026-08-11': 'P',
      '2026-08-12': 'P',
      '2026-08-13': 'P',
      '2026-08-14': 'P',
    },
  },
  {
    _id: 's3',
    name: 'Hernández Cruz, Luis',
    controlNumber: '20241303',
    photoUrl: null,
    records: {
      '2026-08-10': 'P',
      '2026-08-11': 'P',
      '2026-08-12': 'R',
      '2026-08-13': 'F',
      '2026-08-14': 'P',
    },
  },
  {
    _id: 's4',
    name: 'Sánchez Mora, Paula',
    controlNumber: '20241304',
    photoUrl: null,
    records: {
      '2026-08-10': 'F',
      '2026-08-11': 'R',
      '2026-08-12': 'P',
      '2026-08-13': 'FJ',
      '2026-08-14': 'P',
    },
  },
];

// ---------------------------------------------------------------------
// FECHAS INICIALES DE LA MATRIZ
// ---------------------------------------------------------------------
const INITIAL_DATES = [
  '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14',
].map((iso) => ({
  iso,
  short: formatShort(iso),
  full: formatFull(iso),
  day: iso === todayIso(),
}));

// Dimensiones de la matriz.
const STUDENT_COL_WIDTH = 220;
const DATE_COL_WIDTH = 80;
const ROW_HEIGHT = 64;
const CELL_SIZE = 40;

// =====================================================================
// COMPONENTE: MatrixCell
// =====================================================================
function MatrixCell({ status, onPress }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES['-'];
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center"
      style={{
        width: DATE_COL_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityRole="button"
      accessibilityLabel={`Estado ${status}`}
      accessibilityHint="Toque para ciclar, mantenga para añadir nota"
    >
      <View
        className="items-center justify-center"
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          borderRadius: 12,
          backgroundColor: style.soft,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '800', color: style.color }}>
          {status}
        </Text>
      </View>
    </Pressable>
  );
}

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function TeacherMatrixScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const groupId = params.groupId;
  const groupName = params.groupName || 'Grupo';
  const subjectId = params.subjectId;

  // Datos de la escuela (SchoolInfoCard).
  const { data } = useTeacherDashboard();
  const school = useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.currentSchoolYear?.name || null,
    };
  }, [data?.school, data?.currentSchoolYear]);

  const currentDate = data?.currentDate || 'Lunes, 10 de agosto';

  // -----------------------------------------------------------------
  // ESTADO
  // -----------------------------------------------------------------
  const [dates, setDates] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [addDateVisible, setAddDateVisible] = useState(false);
  const [periods, setPeriods] = useState([]);
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [periodDropdownVisible, setPeriodDropdownVisible] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // ============================================================
  // FETCH: períodos de evaluación
  // ============================================================
  useEffect(() => {
    let cancelled = false;
    const fetchPeriods = async () => {
      setPeriodsLoading(true);
      const result = await getGradingPeriods();
      if (cancelled) return;
      if (result.success && result.data?.periods) {
        setPeriods(result.data.periods);
        // Auto-seleccionar el primer período
        if (result.data.periods.length > 0) {
          setSelectedPeriod(result.data.periods[0]);
        }
      }
      setPeriodsLoading(false);
    };
    fetchPeriods();
    return () => { cancelled = true; };
  }, []);

  // ============================================================
  // FETCH: sesiones de asistencia + alumnos
  // ============================================================
  useEffect(() => {
    if (!groupId || !subjectId || !selectedPeriod?._id) return;

    let cancelled = false;
    const fetchSessions = async () => {
      setLoadingSessions(true);
      const result = await getAttendanceSessions({
        groupId,
        subjectId,
        periodId: selectedPeriod._id,
      });
      if (cancelled) return;
      if (result.success && result.data) {
        const { sessions = [], students = [] } = result.data;

        // Mapear students del endpoint a matrix
        const mappedMatrix = students.map((s) => ({
          _id: s._id,
          name: s.fullName,
          photoUrl: null,
          records: buildRecordsFromSessions(sessions, s._id),
        }));
        setMatrix(mappedMatrix);

        // Mapear sessions a dates (incluyendo sessionId para PATCH)
        const mappedDates = sessions.map((sess) => {
          const iso = sess.date.split('T')[0];
          return {
            iso,
            short: formatShort(iso),
            full: formatFull(iso),
            day: iso === todayIso(),
            sessionId: sess._id,
          };
        });
        setDates(mappedDates);
      }
      setLoadingSessions(false);
    };
    fetchSessions();
    return () => { cancelled = true; };
  }, [groupId, subjectId, selectedPeriod?._id]);

  // Iniciales para el avatar de la columna izquierda.
  const getInitials = (name) =>
    (name || '?').split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  // -----------------------------------------------------------------
  // HANDLERS
  // -----------------------------------------------------------------
  // Tap en celda: abre el EditAttendanceModal con la lista de opciones
  // (P / F / R / FJ) + nota. Mismo flujo que el today view — el
  // docente toca UNA opción y el modal hace el PATCH + notifica.
  // (Ya no ciclamos: el modal reemplaza el ciclo con la UX de lista
  // de opciones que pidió el usuario.)
  const handleCellTap = (student, date) => {
    const currentStatus = student.records[date.iso] || '-';
    setEditingCell({ student, date, currentStatus });
  };

  // Guardado desde EditAttendanceModal. Llama al endpoint PATCH.
  const handleCellSaved = async (student, status) => {
    if (!editingCell?.date?.sessionId) {
      // Fallback: solo actualizar local si no hay sessionId
      setMatrix((prev) =>
        prev.map((s) =>
          s._id === student._id
            ? { ...s, records: { ...s.records, [editingCell.date.iso]: status } }
            : s,
        ),
      );
      return;
    }

    const backendStatus = mapToFrontendStatus(status);
    const result = await updateAttendanceRecord({
      sessionId: editingCell.date.sessionId,
      studentId: student._id,
      status: backendStatus,
    });

    if (result.success) {
      // Actualizar local con el status seleccionado
      setMatrix((prev) =>
        prev.map((s) =>
          s._id === student._id
            ? { ...s, records: { ...s.records, [editingCell.date.iso]: status } }
            : s,
        ),
      );
    } else {
      Alert.alert('Error', result.message || 'No se pudo actualizar la asistencia.');
    }
  };

  // Agregar nueva fecha (desde AddDateModal). Llama al endpoint POST.
  const handleAddDate = async (iso) => {
    if (!groupId || !subjectId || !selectedPeriod?._id) {
      Alert.alert('Error', 'Faltan datos del grupo o período para crear la sesión.');
      return;
    }

    const result = await createAttendanceSession({
      groupId,
      subjectId,
      date: iso,
      periodId: selectedPeriod._id,
    });

    if (result.success && result.data?.session) {
      const sess = result.data.session;
      const newDate = {
        iso: sess.date.split('T')[0],
        short: formatShort(sess.date.split('T')[0]),
        full: formatFull(sess.date.split('T')[0]),
        day: sess.date.split('T')[0] === todayIso(),
        sessionId: sess._id,
      };
      setDates((prev) => [...prev, newDate]);

      // Actualizar matrix con los records de la nueva sesión
      setMatrix((prev) =>
        prev.map((s) => {
          const record = sess.records.find((r) => r.student_id === s._id);
          return {
            ...s,
            records: {
              ...s.records,
              [newDate.iso]: record ? mapBackendStatus(record.status) : 'P',
            },
          };
        }),
      );
      setAddDateVisible(false);
    } else {
      // Manejar error 409 (ya existe sesión para esa fecha)
      if (result.reason === 'conflict') {
        Alert.alert('Fecha duplicada', 'Ya existe una sesión para esta fecha.');
      } else {
        Alert.alert('Error', result.message || 'No se pudo crear la sesión.');
      }
    }
  };

  // Confirmar y eliminar una columna de fecha.
  const handleRemoveDate = (date) => {
    Alert.alert(
      'Eliminar fecha',
      `¿Eliminar la fecha ${formatShort(date.iso)}? Se borrarán los registros de asistencia de todos los alumnos para ese día.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setDates((prev) => prev.filter((d) => d.iso !== date.iso));
            setMatrix((prev) =>
              prev.map((s) => {
                const { [date.iso]: _drop, ...rest } = s.records || {};
                return { ...s, records: rest };
              }),
            );
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* ============================================================
          A) HEADER + SCHOOL INFO CARD compuesta
          ============================================================ */}
      <DashboardHeader />

      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-2"
        teacher={data?.teacher}
        date={currentDate}
      />

      {/* Botón "Volver" → group detail. */}
      <Pressable
        onPress={() => router.back()}
        className="flex-row items-center px-4 mt-4"
        accessibilityRole="button"
        accessibilityLabel="Volver al detalle del grupo"
      >
        <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
        <Text className="text-sm font-semibold text-sky-600 ml-1">
          Volver
        </Text>
      </Pressable>

      {/* ============================================================
          B) TÍTULO + PILL DEL PERIODO + GRUPO
          ============================================================ */}
      <View className="px-4 mt-5">
        <Text className="text-[22px] font-bold text-[#0F172A]">
          Control de Asistencias
        </Text>
        <View className="mt-2 flex-row items-center justify-between">
          <Pressable
            onPress={() => setPeriodDropdownVisible((v) => !v)}
            className="flex-row items-center bg-white border border-[#E2E8F0] rounded-full px-4 py-2"
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
                const isActive = selectedPeriod?._id === period._id;
                return (
                  <Pressable
                    key={period._id}
                    onPress={() => {
                      setSelectedPeriod(period);
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

          <Text
            className="font-bold text-[#0F172A] ml-3"
            style={{ fontSize: 13 }}
            numberOfLines={1}
          >
            {groupName}
          </Text>
        </View>
      </View>

      {/* ============================================================
          C) BOTÓN "+ NUEVA FECHA" + CONTADOR
          ============================================================ */}
      <View className="px-4 mt-4 flex-row items-center justify-between">
        <Pressable
          onPress={() => setAddDateVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Agregar nueva fecha"
          className="flex-row items-center"
          style={{
            backgroundColor: '#0284C7',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            gap: 6,
          }}
        >
          <Plus size={16} color="#ffffff" strokeWidth={2.5} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff' }}>
            Nueva Fecha
          </Text>
        </Pressable>

        <View className="flex-row items-center">
          <Users size={15} color="#64748B" strokeWidth={2} />
          <Text className="text-[13px] text-[#475569] ml-2">
            {matrix.length} Alumnos
          </Text>
        </View>
      </View>

      {/* ============================================================
          D) LEYENDA DE ESTADOS (sin "Sin")
          ============================================================ */}
      <View className="px-4 mt-4">
        <View
          className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex-row justify-between"
          style={{ elevation: 1 }}
        >
          {Object.entries(STATUS_STYLES)
            .filter(([code]) => code !== '-')
            .map(([code, style]) => (
              <View key={code} className="flex-row items-center">
                <View
                  className="items-center justify-center"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 7,
                    backgroundColor: style.soft,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: style.color }}>
                    {code}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    color: '#64748B',
                    marginLeft: 4,
                    fontWeight: '600',
                  }}
                >
                  {style.label}
                </Text>
              </View>
            ))}
        </View>
      </View>

      {/* ============================================================
          E) MATRIZ: columna del alumno FIJA + grid horizontal
          ============================================================ */}
      <View className="mx-4 mt-4 flex-1">
        <View
          className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
          style={{ elevation: 2, flex: 1 }}
        >
          {/* Loading state para sesiones */}
          {loadingSessions && (
            <View className="flex-1 items-center justify-center py-10">
              <ActivityIndicator size="large" color="#0284C7" />
              <Text className="text-slate-400 text-sm mt-3">
                Cargando asistencia...
              </Text>
            </View>
          )}

          {/* Matriz (solo si no está cargando) */}
          {!loadingSessions && (
          <ScrollView
            vertical
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <View className="flex-row">
              {/* Columna fija del alumno. */}
              <View style={{ width: STUDENT_COL_WIDTH }}>
                <View
                  className="border-r border-b border-[#F1F5F9]"
                  style={{ height: 48, justifyContent: 'center', paddingLeft: 14 }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: '#94A3B8',
                      textTransform: 'uppercase',
                    }}
                  >
                    Alumno
                  </Text>
                </View>
                {matrix.map((student, index) => (
                  <View
                    key={student._id}
                    className="flex-row items-center border-b border-[#F8FAFC] border-r"
                    style={{ height: ROW_HEIGHT, paddingHorizontal: 10 }}
                  >
                    {student.photoUrl ? (
                      <Image
                        source={{ uri: student.photoUrl }}
                        style={{ width: 38, height: 38, borderRadius: 18 }}
                        accessibilityLabel={`Foto de ${student.name}`}
                      />
                    ) : (
                      <View
                        className="items-center justify-center"
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 18,
                          backgroundColor: '#E0F2FE',
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0284C7' }}>
                          {getInitials(student.name)}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text
                        numberOfLines={2}
                        ellipsizeMode="tail"
                        style={{ fontSize: 16, fontWeight: '500', color: '#64748B' }}
                      >
                        {`${String(index + 1)}. ${student.name}`}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Grid de fechas (scroll horizontal). */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
              >
                <View>
                  {/* Header de fechas: tap → confirmar eliminación. */}
                  <View
                    className="flex-row border-b border-[#F1F5F9]"
                    style={{ height: 48 }}
                  >
                    {dates.map((date) => (
                      <Pressable
                        key={date.iso}
                        onPress={() => handleRemoveDate(date)}
                        accessibilityRole="button"
                        accessibilityLabel={`Tocar para eliminar la fecha ${formatShort(date.iso)}`}
                        accessibilityHint="Toque largo para más opciones"
                        style={{
                          width: DATE_COL_WIDTH,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <View
                          className="items-center justify-center"
                          style={{
                            borderWidth: date.day ? 2 : 0,
                            borderColor: date.day ? '#0284C7' : 'transparent',
                            borderRadius: 20,
                            paddingHorizontal: 6,
                            paddingVertical: 3,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '800',
                              color: date.day ? '#0284C7' : '#475569',
                            }}
                          >
                            {date.short}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>

                  {/* Filas. */}
                  {matrix.map((student) => (
                    <View
                      key={student._id}
                      className="flex-row border-b border-[#F8FAFC]"
                      style={{ height: ROW_HEIGHT }}
                    >
                      {dates.map((date) => {
                        const status = student.records[date.iso] || '-';
                        return (
                          <MatrixCell
                            key={date.iso}
                            status={status}
                            onPress={() => handleCellTap(student, date)}
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </ScrollView>
          )}
        </View>
      </View>

      {/* ============================================================
          F) MODALES
          ============================================================ */}
      <EditAttendanceModal
        visible={!!editingCell}
        student={editingCell?.student || null}
        date={editingCell?.date || null}
        currentStatus={editingCell?.currentStatus || '-'}
        groupId={groupId}
        onClose={() => setEditingCell(null)}
        onSaved={handleCellSaved}
      />

      <AddDateModal
        visible={addDateVisible}
        existingDates={dates.map((d) => d.iso)}
        onAdd={handleAddDate}
        onClose={() => setAddDateVisible(false)}
      />

    </View>
  );
}
