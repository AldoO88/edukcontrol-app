// =====================================================================
// app/(teacher)/matrix.jsx
// ---------------------------------------------------------------------
// Ruta "/matrix" del route group (teacher). Pantalla "Pase de Lista
// Matricial" del MAESTRO: tabla de asistencias alumno × fecha con
// columnas dinámicas (agregar / eliminar fechas desde la UI).
//
// Se abre desde el botón "Asistencia" / "Pase de Lista" de la card
// de grupo en "Mis Grupos" (groups.jsx), pasando { groupId, groupName }.
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
import React, { useMemo, useState } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';

// Navegación.
import { useLocalSearchParams, useRouter } from 'expo-router';

// Iconos Lucide.
import { ChevronLeft, Users, Plus } from 'lucide-react-native';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Chrome compartido.
import { useTeacherDashboard } from '../../src/hooks/useTeacherDashboard';
import SchoolInfoCard from '../../src/components/SchoolInfoCard';
import DashboardHeader from '../../src/components/DashboardHeader';

// Helpers puros.
import {
  todayIso,
  formatShort,
  formatFull,
} from '../../src/utils/attendanceHelpers';

// Modales privados del route group (teacher).
import EditAttendanceModal from './_components/EditAttendanceModal';
import AddDateModal from './_components/AddDateModal';

// ---------------------------------------------------------------------
// PALETA DE ESTADOS DE LA MATRIZ
// ---------------------------------------------------------------------
const STATUS_STYLES = {
  P:  { soft: '#DCFCE7', color: '#16A34A', label: 'Presente' },
  F:  { soft: '#FEE2E2', color: '#DC2626', label: 'Falta' },
  R:  { soft: '#FEF3C7', color: '#D97706', label: 'Retardo' },
  FJ: { soft: '#E0F2FE', color: '#0284C7', label: 'F. Justificada' },
  '-': { soft: '#F1F5F9', color: '#94A3B8', label: 'Sin registro' },
};

// Ciclo de estados al tap en una celda: P → F → R → FJ → - → P …
const STATUS_CYCLE = ['P', 'F', 'R', 'FJ', '-'];

// ---------------------------------------------------------------------
// MOCK_STUDENTS
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
function MatrixCell({ status, onPress, onLongPress }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES['-'];
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
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

  const teacherName = data?.teacher?.last_name || data?.teacher?.fullName || 'Juárez';
  const currentDate = data?.currentDate || 'Lunes, 10 de agosto';

  // -----------------------------------------------------------------
  // ESTADO
  // -----------------------------------------------------------------
  const [dates, setDates] = useState(INITIAL_DATES);
  const [matrix, setMatrix] = useState(MOCK_STUDENTS);
  const [editingCell, setEditingCell] = useState(null);
  const [addDateVisible, setAddDateVisible] = useState(false);

  // Iniciales para el avatar de la columna izquierda.
  const getInitials = (name) =>
    (name || '?').split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  // -----------------------------------------------------------------
  // HANDLERS
  // -----------------------------------------------------------------
  // Tap en celda: cicla el estado.
  const handleCellTap = (student, date) => {
    const current = student.records[date.iso] || '-';
    const idx = STATUS_CYCLE.indexOf(current);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    setMatrix((prev) =>
      prev.map((s) =>
        s._id === student._id
          ? { ...s, records: { ...s.records, [date.iso]: next } }
          : s,
      ),
    );
  };

  // Long press: abre el modal con nota.
  const handleCellLongPress = (student, date) => {
    const currentStatus = student.records[date.iso] || '-';
    setEditingCell({ student, date, currentStatus });
  };

  // Guardado desde EditAttendanceModal (local).
  const handleCellSaved = (student, status) => {
    setMatrix((prev) =>
      prev.map((s) =>
        s._id === student._id
          ? { ...s, records: { ...s.records, [editingCell.date.iso]: status } }
          : s,
      ),
    );
  };

  // Agregar nueva fecha (desde AddDateModal). Las celdas inician en 'P'.
  const handleAddDate = (iso) => {
    const newDate = {
      iso,
      short: formatShort(iso),
      full: formatFull(iso),
      day: iso === todayIso(),
    };
    setDates((prev) => [...prev, newDate]);
    setMatrix((prev) =>
      prev.map((s) => ({ ...s, records: { ...s.records, [iso]: 'P' } })),
    );
    setAddDateVisible(false);
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
        teacherName={teacherName}
        date={currentDate}
      />

      {/* Botón "Volver". */}
      <Pressable
        onPress={() => router.back()}
        className="flex-row items-center px-4 mt-4"
        accessibilityRole="button"
        accessibilityLabel="Volver a mis grupos"
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
          <View className="px-3 py-1.5 rounded-full bg-white border border-slate-200">
            <Text className="text-xs font-bold text-slate-700">
              1er Periodo - Agosto 2026
            </Text>
          </View>
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
                            onLongPress={() => handleCellLongPress(student, date)}
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </ScrollView>
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
