// =====================================================================
// app/(app)/conducta.jsx
// ---------------------------------------------------------------------
// Ruta "/conducta" del route group (app). Pantalla de "Conducta
// Escolar" para el tutor: muestra el puntaje actual del alumno
// seleccionado y el historial de reportes (faltas + méritos) del
// trimestre en curso.
//
// =====================================================================
// CHROME COMPARTIDO
// ---------------------------------------------------------------------
// Esta pantalla consume el chrome compartido del route group (app):
//   - DashboardHeader:   isotipo sky-500 + "EdukControl" + campana
//   - SchoolInfoCard:    logo + nombre + ciclo escolar
//   - BottomTabBar:      5 tabs (la tab "Conducta" se resalta)
//
// Los 3 componentes son self-contained y se reutilizan en
// GuardianDashboard y Avisos sin cambios.
// =====================================================================

// React + hooks.
import React, { useMemo, useState } from 'react';

// Primitivas RN: View, Text, ScrollView.
import {
  View,
  Text,
  ScrollView,
} from 'react-native';

// Componentes del chrome compartido del route group (app).
import DashboardHeader from './_components/DashboardHeader';
import SchoolInfoCard from './_components/SchoolInfoCard';
import BottomTabBar from './_components/BottomTabBar';

// Filtro de alumnos reutilizable (compartido con avisos.jsx).
import StudentFilter from './_components/StudentFilter';

// Card de reporte de conducta.
import ConductReportCard from './_components/ConductReportCard';

// Hook del dashboard del tutor: encapsula la carga de datos del
// backend (escuela, alumnos, stats). Aquí solo consumimos `data.school`
// para pasárselo a SchoolInfoCard — el resto lo ignora esta pantalla.
import { useGuardianDashboard } from '../../src/hooks/useGuardianDashboard';

// ---------------------------------------------------------------------
// MOCK_STUDENTS
// ---------------------------------------------------------------------
// Lista simulada de hijos del tutor para los filtros. Mismo shape
// que en avisos.jsx (con avatarUrl añadido). En el futuro vendrá
// del backend.
//
// El StudentFilter detecta si el item tiene avatarUrl o
// avatarLetter: si tiene alguno, muestra el círculo del avatar;
// si no (caso "Todos" en avisos), solo muestra el nombre.
// Aquí no hay "Todos" — siempre hay que elegir un alumno para ver
// su puntaje de conducta.
// ---------------------------------------------------------------------
const MOCK_STUDENTS = [
  { id: 'carlos', name: 'Carlos', avatarLetter: 'C', avatarUrl: 'https://i.pravatar.cc/100?img=12' },
  { id: 'ana',    name: 'Ana',    avatarLetter: 'A', avatarUrl: 'https://i.pravatar.cc/100?img=47' },
];

// ---------------------------------------------------------------------
// MOCK_CONDUCT_DATA
// ---------------------------------------------------------------------
// Datos mock por alumno. Shape esperado (cuando exista endpoint
// /api/guardians/me/conduct o similar):
//
//   {
//     [studentId]: {
//       currentScore: number,   // puntaje actual (0-100).
//       baseScore: 100,         // puntaje base de cada trimestre.
//       reports: [
//         {
//           id,
//           type: 'falta_leve' | 'falta_grave' | 'merito',
//           title,
//           description,
//           date: ISO 8601,
//           points: number,      // negativo para faltas, + para meritos.
//         },
//       ],
//     },
//   }
// ---------------------------------------------------------------------
const MOCK_CONDUCT_DATA = {
  carlos: {
    currentScore: 92,
    baseScore: 100,
    reports: [
      {
        id: 'r-001',
        type: 'falta_leve',
        title: 'Uso de celular',
        description:
          'El estudiante utilizó el dispositivo móvil durante la clase de Matemáticas sin autorización previa.',
        date: '2023-10-14T10:45:00',
        points: -5,
      },
      {
        id: 'r-002',
        type: 'merito',
        title: 'Colaboración Proactiva',
        description:
          'Apoyo destacado en la organización de la feria de ciencias y ayuda a compañeros rezagados.',
        date: '2023-10-08T15:20:00',
        points: 2,
      },
      {
        id: 'r-003',
        type: 'falta_leve',
        title: 'Conversación excesiva',
        description:
          'Persistencia en pláticas ajenas al tema durante la explicación del docente.',
        date: '2023-10-02T09:15:00',
        points: -5,
      },
    ],
  },
  ana: {
    currentScore: 100,
    baseScore: 100,
    reports: [],
  },
};

export default function ConductaScreen() {
  // -----------------------------------------------------------------
  // HOOKS
  // -----------------------------------------------------------------
  // Hook del dashboard para obtener los datos de la escuela.
  // Solo consumimos data.school (nombre, logo, ciclo) — el resto
  // (students, stats) lo ignora esta pantalla.
  const { data, isLoading } = useGuardianDashboard();

  // -----------------------------------------------------------------
  // ESTADO LOCAL
  // -----------------------------------------------------------------
  // id del filtro activo. Inicia en 'carlos' para que la primera
  // vista muestre datos del primer hijo (el mockup muestra a
  // Carlos como activo).
  const [activeFilterId, setActiveFilterId] = useState('carlos');

  // -----------------------------------------------------------------
  // DERIVADOS
  // -----------------------------------------------------------------
  // Datos del alumno seleccionado. Si no existe (caso borde),
  // fallback a un payload vacío.
  const conductData = MOCK_CONDUCT_DATA[activeFilterId] || {
    currentScore: 0,
    baseScore: 100,
    reports: [],
  };

  const currentScore = conductData.currentScore;
  const baseScore = conductData.baseScore;
  const reports = conductData.reports;

  // Porcentaje del progress bar. Lo clampamos a [0, 100] por
  // seguridad (un puntaje > baseScore no debería existir, pero
  // por si el backend mete un bonus).
  const scorePercent = useMemo(() => {
    if (baseScore <= 0) return 0;
    const pct = (currentScore / baseScore) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [currentScore, baseScore]);

  // Nombre del alumno activo (para mensajes de empty state).
  const activeStudentName = MOCK_STUDENTS.find(
    (s) => s.id === activeFilterId,
  )?.name || 'el estudiante';

  return (
    // Contenedor raíz. bg-slate-50 para que las cards blancas
    // destaquen (mismo fondo que el resto de la app).
    <View className="flex-1 bg-slate-50">
      {/* Header compartido: brand + campana. */}
      <DashboardHeader />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
      >
        {/* ============================================================
            SCHOOL INFO CARD (compartida)
            ============================================================
            Misma card que en GuardianDashboard y Avisos: logo de
            la escuela + nombre + ciclo escolar. La añadimos aquí
            para que el tutor identifique la escuela a la que
            pertenecen los reportes (multi-tenant). */}
        <SchoolInfoCard
          school={data?.school}
          isLoading={isLoading}
          className="mx-4 mt-4"
        />

        {/* ============================================================
            TÍTULO + SUBTÍTULO
            ============================================================
            Mismo patrón que el "Bienvenido" del login y el saludo
            del GuardianDashboard: título grande + subtítulo gris.
            Van con padding lateral (px-4) para alinearse con la
            card de puntaje de abajo.
            ============================================================ */}
        <View className="px-4 pt-6">
          <Text className="text-3xl font-bold text-slate-900">
            Conducta Escolar
          </Text>
          <Text className="text-sm text-slate-500 mt-1">
            Seguimiento de comportamiento y valores.
          </Text>
        </View>

        {/* ============================================================
            FILTRO POR ESTUDIANTE (compartido con avisos.jsx)
            ============================================================
            Label + <StudentFilter> con avatar (foto o inicial) +
            nombre. Misma implementación que avisos, diferente
            conjunto de students (sin "Todos" aquí).
            ============================================================ */}
        <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-5 mb-3 px-5">
          Filtrar por estudiante
        </Text>

        <StudentFilter
          students={MOCK_STUDENTS}
          activeId={activeFilterId}
          onChange={setActiveFilterId}
          accessibilityLabel="Filtro de conducta por estudiante"
        />

        {/* ============================================================
            CARD DE PUNTAJE ACTUAL
            ============================================================
            White card con:
              - Label "PUNTAJE ACTUAL" (uppercase, tracking).
              - Número grande sky-500 + "/ 100" en slate-400.
              - Progress bar (sky-500, width = scorePercent%).
              - Texto explicativo.
            Misma estructura "rounded-3xl shadow-md" que el
            SchoolInfoCard y las cards del login.
            ============================================================ */}
        <View
          className="bg-white rounded-3xl shadow-md mx-4 mt-6 p-5"
          style={{ elevation: 3 }}
        >
          {/* Label */}
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Puntaje actual
          </Text>

          {/* Número + "/ 100". El número va en sky-500 (acento
              institucional), el "/ 100" en slate-400 (secundario).
              text-4xl (36px) para que sea el protagonista visual
              de la card. */}
          <View className="flex-row items-baseline mt-1">
            <Text className="text-4xl font-bold text-sky-500">
              {currentScore}
            </Text>
            <Text className="text-xl font-semibold text-slate-400 ml-1.5">
              / {baseScore}
            </Text>
          </View>

          {/* Progress bar.
              - Outer: rounded-full, bg-slate-200, h-2.5 (10px).
              - Inner: rounded-full, bg-sky-500, h-2.5, width
                dinámico en % según scorePercent.
              - overflow-hidden en el outer para que el inner
                respete el borderRadius. */}
          <View className="h-2.5 rounded-full bg-slate-200 mt-3 overflow-hidden">
            <View
              className="h-full rounded-full bg-sky-500"
              style={{ width: `${scorePercent}%` }}
            />
          </View>

          {/* Texto explicativo. mt-3 separa del progress bar.
              leading-relaxed para que respire en multi-línea. */}
          <Text className="text-xs text-slate-500 mt-3 leading-relaxed">
            El puntaje base inicia en 100 puntos cada trimestre. Las
            faltas restan puntos según su gravedad, mientras que los
            méritos otorgan puntos adicionales por conducta ejemplar.
          </Text>
        </View>

        {/* ============================================================
            HEADER DE HISTORIAL
            ============================================================
            - "HISTORIAL DE REPORTES" en uppercase tracking (izq).
            - "Este Trimestre" en sky-600 (der) — label del
              periodo filtrado (futuro: selector dropdown).
            ============================================================ */}
        <View className="flex-row items-center justify-between mt-7 px-5 mb-3">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Historial de reportes
          </Text>
          <Text className="text-xs font-bold text-sky-600">
            Este Trimestre
          </Text>
        </View>

        {/* ============================================================
            LISTA DE REPORTES
            ============================================================
            Render de reports. Cada item se mapea a
            <ConductReportCard> con su onPress (noop por ahora;
            cuando exista el endpoint de detalle, navegar a
            /conducta/<id>).
            ============================================================ */}
        <View className="px-4">
          {reports.length > 0 ? (
            reports.map((report) => (
              <ConductReportCard
                key={report.id}
                report={report}
                onPress={() => {
                  // TODO: cuando exista el endpoint de detalle,
                  // navegar a /conducta/<id> aquí.
                }}
              />
            ))
          ) : (
            // Empty state: el alumno no tiene reportes en el
            // trimestre (caso de Ana en el mock, que tiene
            // puntaje 100 y 0 reportes).
            <View className="bg-white rounded-2xl p-8 items-center">
              <Text className="text-sm text-slate-500 text-center">
                {activeStudentName} no tiene reportes en este trimestre.
              </Text>
              <Text className="text-xs text-slate-400 mt-1 text-center">
                ¡Puntaje perfecto de {baseScore} puntos!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Tab bar compartida. */}
      <BottomTabBar />
    </View>
  );
}
