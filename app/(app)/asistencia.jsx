// =====================================================================
// app/(app)/asistencia.jsx
// ---------------------------------------------------------------------
// Ruta "/asistencia" del route group (app). Pantalla de
// "Asistencia" para el tutor: muestra el % total de asistencia
// del alumno, contadores de eventos (asistencias, faltas,
// retardos), las inasistencias recientes y un historial de
// entradas/salidas.
//
// =====================================================================
// CHROME COMPARTIDO
// ---------------------------------------------------------------------
//   - DashboardHeader:    isotipo sky-500 + "EdukControl" + campana
//   - SchoolInfoCard:     logo + nombre + ciclo escolar
//   - StudentFilter:      pills de alumnos con avatar
//   - BottomTabBar:       5 tabs (la tab "Asistencia" se
//                         resalta con CalendarCheck)
//
// =====================================================================
// SECCIONES DE LA PANTALLA
// ---------------------------------------------------------------------
//   1. Filtro por estudiante.
//   2. Anillo de porcentaje de asistencia (98% Asistencia Total).
//   3. Fila de 3 stat cards (Asistencias / Faltas / Retardos).
//   4. Inasistencias recientes.
//   5. Historial de entradas y salidas (tabla).
// =====================================================================

// React + hooks.
import React, { useState } from 'react';

// Primitivas RN: View, Text, ScrollView, Pressable.
import { View, Text, ScrollView, Pressable } from 'react-native';

// Iconos Lucide.
import { Calendar, TrendingUp } from 'lucide-react-native';

// clsx.
import { clsx } from 'clsx';

// Componentes del chrome compartido del route group (app).
import DashboardHeader from './_components/DashboardHeader';
import SchoolInfoCard from './_components/SchoolInfoCard';
import BottomTabBar from './_components/BottomTabBar';
import StudentFilter from './_components/StudentFilter';

// Componentes específicos de esta pantalla.
import AttendanceRing from './_components/AttendanceRing';
import AttendanceStatCard from './_components/AttendanceStatCard';
import RecentAbsenceCard from './_components/RecentAbsenceCard';
import AttendanceHistoryTable from './_components/AttendanceHistoryTable';

// Hook del dashboard del tutor: encapsula la carga de datos del
// backend (escuela, alumnos, stats). Aquí solo consumimos
// `data.school` para pasárselo a SchoolInfoCard — el resto lo
// ignora esta pantalla.
import { useGuardianDashboard } from '../../src/hooks/useGuardianDashboard';

// ---------------------------------------------------------------------
// MOCK_STUDENTS
// ---------------------------------------------------------------------
// Mismo shape que en avisos/conducta/calificaciones.
// ---------------------------------------------------------------------
const MOCK_STUDENTS = [
  { id: 'mateo',  name: 'Mateo',  avatarLetter: 'M', avatarUrl: 'https://i.pravatar.cc/100?img=33' },
  { id: 'carlos', name: 'Carlos', avatarLetter: 'C', avatarUrl: 'https://i.pravatar.cc/100?img=12' },
  { id: 'ana',    name: 'Ana',    avatarLetter: 'A', avatarUrl: 'https://i.pravatar.cc/100?img=47' },
];

// ---------------------------------------------------------------------
// MOCK_ATTENDANCE_DATA
// ---------------------------------------------------------------------
// Datos mock de asistencia por alumno. Shape esperado (cuando
// exista el endpoint):
//
//   {
//     [studentId]: {
//       percentage:        number 0-100 (asistencia total).
//       totalAttendances:  number (días con asistencia).
//       totalAbsences:     number (faltas totales).
//       totalLates:        number (retardos totales).
//       recentAbsences:    [{ id, month, day, type, title, description }]
//       history:           [{ id, date, entry, exit, status }]
//     },
//   }
//
// status: 'a_tiempo' | 'tarde' | 'falta' (claves de STATUS_CONFIG
// en AttendanceHistoryTable.jsx).
// type:   'injustificada' | 'justificada' (claves para el
//         render del icono derecho en RecentAbsenceCard).
// ---------------------------------------------------------------------
const MOCK_ATTENDANCE_DATA = {
  mateo: {
    percentage: 98,
    totalAttendances: 168,
    totalAbsences: 2,
    totalLates: 3,
    recentAbsences: [
      {
        id: 'a-001',
        month: 'Oct',
        day: 14,
        type: 'injustificada',
        title: 'Falta Injustificada',
        description: 'Sin reporte médico entregado.',
      },
      {
        id: 'a-002',
        month: 'Sep',
        day: 2,
        type: 'justificada',
        title: 'Falta Justificada',
        description: 'Motivos de salud - Comprobante OK.',
      },
    ],
    history: [
      { id: 'h-001', date: 'Oct 24', entry: '07:45 AM', exit: '02:15 PM', status: 'a_tiempo' },
      { id: 'h-002', date: 'Oct 23', entry: '07:50 AM', exit: '02:19 PM', status: 'a_tiempo' },
      { id: 'h-003', date: 'Oct 22', entry: '08:05 AM', exit: '02:15 PM', status: 'tarde' },
      { id: 'h-004', date: 'Oct 21', entry: '07:42 AM', exit: '02:15 PM', status: 'a_tiempo' },
      { id: 'h-005', date: 'Oct 20', entry: '07:45 AM', exit: '02:15 PM', status: 'a_tiempo' },
    ],
  },
  carlos: {
    percentage: 92,
    totalAttendances: 156,
    totalAbsences: 9,
    totalLates: 7,
    recentAbsences: [
      {
        id: 'a-c01',
        month: 'Oct',
        day: 15,
        type: 'injustificada',
        title: 'Falta Injustificada',
        description: 'Sin justificación registrada.',
      },
    ],
    history: [
      { id: 'h-c01', date: 'Oct 24', entry: '08:10 AM', exit: '02:15 PM', status: 'tarde' },
      { id: 'h-c02', date: 'Oct 23', entry: '07:50 AM', exit: '02:15 PM', status: 'a_tiempo' },
      { id: 'h-c03', date: 'Oct 22', entry: '07:55 AM', exit: '02:15 PM', status: 'a_tiempo' },
      { id: 'h-c04', date: 'Oct 21', entry: '08:25 AM', exit: '02:15 PM', status: 'tarde' },
      { id: 'h-c05', date: 'Oct 20', entry: '07:45 AM', exit: '02:15 PM', status: 'a_tiempo' },
    ],
  },
  ana: {
    percentage: 100,
    totalAttendances: 170,
    totalAbsences: 0,
    totalLates: 1,
    recentAbsences: [],
    history: [
      { id: 'h-a01', date: 'Oct 24', entry: '07:30 AM', exit: '02:15 PM', status: 'a_tiempo' },
      { id: 'h-a02', date: 'Oct 23', entry: '07:32 AM', exit: '02:15 PM', status: 'a_tiempo' },
      { id: 'h-a03', date: 'Oct 22', entry: '07:35 AM', exit: '02:15 PM', status: 'a_tiempo' },
      { id: 'h-a04', date: 'Oct 21', entry: '07:30 AM', exit: '02:15 PM', status: 'a_tiempo' },
      { id: 'h-a05', date: 'Oct 20', entry: '07:33 AM', exit: '02:15 PM', status: 'a_tiempo' },
    ],
  },
};

export default function AsistenciaScreen() {
  // -----------------------------------------------------------------
  // HOOKS
  // -----------------------------------------------------------------
  const { data, isLoading } = useGuardianDashboard();

  // -----------------------------------------------------------------
  // ESTADO LOCAL
  // -----------------------------------------------------------------
  // Alumno activo. Default: 'mateo' (el primero del mock, que
  // es el que aparece en la imagen del usuario).
  const [activeFilterId, setActiveFilterId] = useState('mateo');

  // -----------------------------------------------------------------
  // DERIVADOS
  // -----------------------------------------------------------------
  // Datos del alumno activo. Fallback a {} si el id no existe.
  const attendanceData = MOCK_ATTENDANCE_DATA[activeFilterId] || {
    percentage: 0,
    totalAttendances: 0,
    totalAbsences: 0,
    totalLates: 0,
    recentAbsences: [],
    history: [],
  };

  return (
    // Contenedor raíz. bg-slate-50.
    <View className="flex-1 bg-slate-50">
      {/* Header compartido. */}
      <DashboardHeader />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
      >
        {/* School info card compartida. */}
        <SchoolInfoCard
          school={data?.school}
          isLoading={isLoading}
          className="mx-4 mt-4 mb-4"
        />

        {/* Filtro por estudiante (compartido). */}
        <StudentFilter
          students={MOCK_STUDENTS}
          activeId={activeFilterId}
          onChange={setActiveFilterId}
          accessibilityLabel="Filtro de asistencia por estudiante"
        />

        {/* ============================================================
            CARD DE ASISTENCIA TOTAL (anillo + label)
            ============================================================
            White card `rounded-3xl` con:
              - Anillo SVG (AttendanceRing) centrado
              - "ASISTENCIA TOTAL" label bajo el %
              - "Progreso del Ciclo Escolar" (izq) + estado (der)
              - Progress bar al fondo
            ============================================================ */}
        <View
          className="bg-white rounded-3xl border border-slate-200 border-t-[5px] border-t-sky-500 shadow-md mx-4 mt-6 px-5 py-6 items-center"
          style={{ elevation: 3 }}
        >
          {/* Anillo SVG. size=180 para que ocupe buen espacio
              sin apretar la card. */}
          <AttendanceRing
            percentage={attendanceData.percentage}
            size={180}
            strokeWidth={14}
            label="Asistencia Total"
          />

          {/* "Progreso del Ciclo Escolar" + estado. mt-5 separa
              del anillo. flex-row justify-between para alinear
              extremos. */}
          <View className="flex-row items-center justify-between w-full mt-5">
            <Text className="text-xs font-semibold text-slate-500">
              Progreso del Ciclo Escolar
            </Text>
            <Text className="text-xs font-bold text-sky-600">
              Excelente
            </Text>
          </View>

          {/* Progress bar al fondo. h-2 + rounded-full + bg
              slate-200 para el track. Inner con bg-sky-500 al
              mismo porcentaje del anillo (refuerza visualmente
              el % del attendance). */}
          <View className="h-2 rounded-full bg-slate-200 w-full mt-2 overflow-hidden">
            <View
              className="h-full rounded-full bg-sky-500"
              style={{ width: `${attendanceData.percentage}%` }}
            />
          </View>
        </View>

        {/* ============================================================
            STAT CARDS (3 columnas)
            ============================================================
            Asistencias / Faltas / Retardos en una fila de 3.
            gap-2 para separación. mt-6 separa de la card de
            asistencia.
            ============================================================ */}
        <View className="flex-row justify-center gap-2 mx-4 mt-4">
          <AttendanceStatCard
            value={attendanceData.totalAttendances}
            label="Asistencias"
            color="sky"
          />
          <AttendanceStatCard
            value={attendanceData.totalAbsences}
            label="Faltas"
            color="rose"
          />
          <AttendanceStatCard
            value={attendanceData.totalLates}
            label="Retardos"
            color="amber"
          />
        </View>

        {/* ============================================================
            INASISTENCIAS RECIENTES + VER CALENDARIO
            ============================================================
            Header de sección: label a la izq + link a la der.
            ============================================================ */}
        <View className="flex-row items-center justify-between mt-7 px-5 mb-3">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Inasistencias recientes
          </Text>
          <Pressable
            onPress={() => {
              // TODO: cuando exista la pantalla de calendario,
              // navegar allí.
            }}
            hitSlop={8}
            accessibilityRole="link"
            accessibilityLabel="Ver calendario completo"
          >
            <Text className="text-xs font-bold text-sky-600">
              Ver Calendario
            </Text>
          </Pressable>
        </View>

        {/* Lista de inasistencias recientes. */}
        <View className="px-4">
          {attendanceData.recentAbsences.length > 0 ? (
            attendanceData.recentAbsences.map((absence) => (
              <RecentAbsenceCard
                key={absence.id}
                absence={absence}
                onPress={() => {
                  // TODO: navegar a detalle de la inasistencia.
                }}
              />
            ))
          ) : (
            // Empty state: si no hay inasistencias recientes
            // (caso de Ana con 100% asistencia).
            <View className="bg-white rounded-2xl p-6 items-center">
              <Text className="text-sm text-slate-500 text-center">
                Sin inasistencias recientes.
              </Text>
              <Text className="text-xs text-slate-400 mt-1 text-center">
                ¡Puntaje perfecto de asistencia!
              </Text>
            </View>
          )}
        </View>

        {/* ============================================================
            ENTRADAS Y SALIDAS + VER HISTORIAL
            ============================================================ */}
        <View className="flex-row items-center justify-between mt-7 px-5 mb-3">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Entradas y Salidas
          </Text>
          <Pressable
            onPress={() => {
              // TODO: navegar a historial completo.
            }}
            hitSlop={8}
            accessibilityRole="link"
            accessibilityLabel="Ver historial completo"
          >
            <Text className="text-xs font-bold text-sky-600">
              Ver Historial
            </Text>
          </Pressable>
        </View>

        {/* Tabla de historial de entradas y salidas. */}
        <View className="px-4">
          <AttendanceHistoryTable history={attendanceData.history} />
        </View>
      </ScrollView>

      {/* Tab bar compartida. */}
      <BottomTabBar />
    </View>
  );
}
