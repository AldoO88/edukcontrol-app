// =====================================================================
// app/(guardian)/conduct.jsx
// ---------------------------------------------------------------------
// Ruta "/conduct" del route group (app). Pantalla de "Conducta
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
import React, { useEffect, useMemo, useState } from 'react';

// Primitivas RN: View, Text, ScrollView.
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

// Componentes del chrome compartido del route group (app).
import DashboardHeader from '../../src/components/DashboardHeader';
import SchoolInfoCard from '../../src/components/SchoolInfoCard';
import BottomTabBar from '../../src/components/BottomTabBar';

// Filtro de alumnos reutilizable (compartido con announcements.jsx).
import StudentFilter from '../../src/components/StudentFilter';

// Card de reporte de conducta.
import ConductReportCard from './_components/ConductReportCard';

// Hook del dashboard del tutor: encapsula la carga de datos del
// backend (escuela, alumnos, stats). Aquí solo consumimos
// `data.school` (para SchoolInfoCard) + `data.students` (para
// alimentar el filtro de alumnos).
import { useGuardianDashboard } from '../../src/hooks/useGuardianDashboard';

// Hook de conducta: carga score + historial de UN alumno
// específico. Recibe el studentId y dispara los 2 endpoints
// en paralelo.
import { useStudentConduct } from '../../src/hooks/useStudentConduct';

// Helper que transforma los students del backend al shape que
// consume <StudentFilter> ({ id, name, avatarUrl, avatarLetter }).
import { studentsForFilter } from '../../src/utils/studentHelpers';

// clsx.
import { clsx } from 'clsx';

// ---------------------------------------------------------------------
// Mapeo de severidad del backend → tipo interno de la UI.
// ---------------------------------------------------------------------
// El backend devuelve `severity: 'minor' | 'moderate' | 'severe' | null`
// en los reports de tipo 'demerit'. El componente <ConductReportCard>
// espera un `type: 'falta_leve' | 'falta_moderada' | 'falta_grave' | 'merito'`.
// Esta función mapea entre las dos convenciones. Si la severidad
// llega como null/undefined (caso borde), fallback a 'falta_leve'.
// ---------------------------------------------------------------------
const severityToType = (eventType, severity) => {
  if (eventType === 'merit') return 'merito';
  if (severity === 'minor') return 'falta_leve';
  if (severity === 'moderate') return 'falta_moderada';
  if (severity === 'severe') return 'falta_grave';
  return 'falta_leve'; // fallback defensivo
};

// ---------------------------------------------------------------------
// scoreToBarColor(currentScore)
// ---------------------------------------------------------------------
// Helper: dado un score numérico, devuelve la clase Tailwind para
// el color de la barra de progreso. Convenciones del spec:
//
//   >= 80  → emerald-500 (verde, "Excelente")
//   >= 50  → amber-500   (amarillo, "Aceptable")
//   <  50  → rose-500    (rojo, "Necesita atención")
// ---------------------------------------------------------------------
const scoreToBarColor = (score) => {
  if (typeof score !== 'number') return 'bg-sky-500';
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
};

// ---------------------------------------------------------------------
// scoreToStatusLabel(currentScore)
// ---------------------------------------------------------------------
// Helper: etiqueta cualitativa según el score (mostrada al lado de
// "Progreso del Ciclo Escolar" en la card de puntaje).
// ---------------------------------------------------------------------
const scoreToStatusLabel = (score) => {
  if (typeof score !== 'number') return '—';
  if (score >= 80) return 'Excelente';
  if (score >= 50) return 'Aceptable';
  return 'Necesita atención';
};

export default function ConductScreen() {
  // -----------------------------------------------------------------
  // HOOKS
  // -----------------------------------------------------------------
  // Hook del dashboard para obtener los datos de la escuela
  // Y los alumnos del tutor.
  const { data, isLoading } = useGuardianDashboard();

  // -----------------------------------------------------------------
  // ESTADO LOCAL
  // -----------------------------------------------------------------
  // id del filtro activo. Inicia vacío; se sincroniza con el
  // primer alumno del backend cuando la data llega.
  const [activeFilterId, setActiveFilterId] = useState('');

  // -----------------------------------------------------------------
  // DERIVADOS
  // -----------------------------------------------------------------
  // Lista de alumnos transformada para <StudentFilter>. Sale
  // del backend via useGuardianDashboard. useMemo para no
  // re-transformar en cada render.
  const students = useMemo(() => studentsForFilter(data), [data]);

  // Cuando llega la lista de alumnos y aún no hay id activo,
  // seleccionamos el primero por defecto.
  useEffect(() => {
    if (!activeFilterId && students.length > 0) {
      setActiveFilterId(students[0].id);
    }
  }, [students, activeFilterId]);

  // -----------------------------------------------------------------
  // HOOK DE CONDUCTA DEL ALUMNO ACTIVO
  // -----------------------------------------------------------------
  // useStudentConduct dispara 2 endpoints en paralelo:
  //   - getConductSummary(studentId)  → { currentScore, maxScore }
  //   - getConductLogs(studentId)     → items[] (faltas + méritos)
  // Si activeFilterId es vacío, el hook no fetchea (summary=null,
  // logs=[]). Esto evita requests con id undefined.
  const {
    summary,
    logs,
    isLoading: isLoadingConduct,
    error: conductError,
  } = useStudentConduct(activeFilterId);

  // -----------------------------------------------------------------
  // DERIVADOS
  // -----------------------------------------------------------------
  // Score y maxScore. Usamos ?? en vez de || para que 0 NO se
  // confunda con null. Si summary es null (loading o sin
  // alumno), mostramos "—" en el número grande.
  const currentScore = summary?.currentScore ?? null;
  const maxScore = summary?.maxScore ?? 100;

  // reports mapeados al shape de <ConductReportCard>:
  //   { id, type, title, description, date, points }
  // La función severityToType (arriba) se encarga del mapping
  // eventType+severity → type.
  const reports = useMemo(
    () =>
      (logs || []).map((log) => ({
        id: log._id,
        type: severityToType(log.eventType, log.severity),
        title: log.description || 'Reporte de conducta',
        description: log.details || null,
        date: log.incident_date,
        // Sign convention: demerit → negativo, merit → positivo.
        // El componente pinta "-N pts" rojo / "+N pts" verde.
        points:
          log.eventType === 'merit'
            ? Math.abs(log.points_impact || 0)
            : -Math.abs(log.points_impact || 0),
      })),
    [logs],
  );

  // Porcentaje del progress bar. Lo clampamos a [0, 100] por
  // seguridad. Si currentScore es null (aún no calculado),
  // el width es 0% (barra vacía).
  const scorePercent = useMemo(() => {
    if (typeof currentScore !== 'number' || maxScore <= 0) return 0;
    const pct = (currentScore / maxScore) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [currentScore, maxScore]);

  // Color dinámico de la barra de progreso según el score
  // (helper al inicio del archivo).
  const barColor = scoreToBarColor(currentScore);
  const statusLabel = scoreToStatusLabel(currentScore);

  // Nombre del alumno activo (para mensajes de empty state).
  const activeStudentName =
    students.find((s) => s.id === activeFilterId)?.name || 'el estudiante';

  // ¿Hay un alumno seleccionado Y ya terminó de cargar el score?
  // Usamos este flag para decidir entre mostrar spinner, error
  // o contenido normal en la zona de la card de puntaje.
  const showScoreLoading = !!activeFilterId && isLoadingConduct && !summary;

  return (
    // Contenedor raíz. bg-slate-50 para que las cards blancas
    // destaquen (mismo fondo que el resto de la app).
    <View className="flex-1 bg-slate-50">
      {/* Header compartido: brand + campana. */}
      <DashboardHeader />

      {/* School info card fija (no scrollea). */}
      <SchoolInfoCard
        school={data?.school}
        isLoading={isLoading}
        className="mx-4 mt-4"
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
      >

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
            FILTRO POR ESTUDIANTE (compartido con announcements.jsx)
            ============================================================
            Label + <StudentFilter> con avatar (foto o inicial) +
            nombre. Misma implementación que avisos, diferente
            conjunto de students (sin "Todos" aquí).
            ============================================================ */}
        <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-5 mb-3 px-5">
          Filtrar por estudiante
        </Text>

        <StudentFilter
          students={students}
          activeId={activeFilterId}
          onChange={setActiveFilterId}
          accessibilityLabel="Filtro de conducta por estudiante"
        />

        {/* ============================================================
            CARD DE PUNTAJE ACTUAL
            ============================================================
            White card con:
              - Label "PUNTAJE ACTUAL" (uppercase, tracking).
              - Número grande dinámico:
                  * Si hay score → text-4xl sky-500
                  * Si currentScore === null → "—" (aún no calculado)
              - "/ maxScore" en slate-400.
              - Progress bar con color DINÁMICO según score
                (verde >=80, ámbar >=50, rojo <50).
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

          {/* Número + "/ maxScore". El número va en sky-500 (acento
              institucional) cuando hay valor, slate-300 cuando es
              "—" (aún no calculado). text-4xl (36px) para que sea
              el protagonista visual de la card. */}
          <View className="flex-row items-baseline mt-1">
            <Text
              className={clsx(
                'text-4xl font-bold',
                typeof currentScore === 'number' ? 'text-sky-500' : 'text-slate-300',
              )}
            >
              {typeof currentScore === 'number' ? currentScore : '—'}
            </Text>
            <Text className="text-xl font-semibold text-slate-400 ml-1.5">
              / {maxScore}
            </Text>
          </View>

          {/* Spinner mientras carga el score (solo si hay alumno
              seleccionado pero el summary aún no llegó). */}
          {showScoreLoading && (
            <View className="mt-3">
              <ActivityIndicator size="small" color="#0ea5e9" />
            </View>
          )}

          {/* Progress bar (solo si NO está loading el score).
              - Outer: rounded-full, bg-slate-200, h-2.5 (10px).
              - Inner: rounded-full, color DINÁMICO (barColor), width
                dinámico en % según scorePercent.
              - overflow-hidden en el outer para que el inner
                respete el borderRadius. */}
          {!showScoreLoading && (
            <View className="h-2.5 rounded-full bg-slate-200 mt-3 overflow-hidden">
              <View
                className={clsx('h-full rounded-full', barColor)}
                style={{ width: `${scorePercent}%` }}
              />
            </View>
          )}

          {/* Header de "Progreso del Ciclo Escolar" + status label.
              flex-row justify-between para alinear extremos. */}
          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-xs font-semibold text-slate-500">
              Progreso del Ciclo Escolar
            </Text>
            <Text
              className={clsx(
                'text-xs font-bold',
                // Color del status: verde / ámbar / rojo, en
                // consonancia con la barra.
                typeof currentScore === 'number' && currentScore >= 80
                  ? 'text-emerald-600'
                  : typeof currentScore === 'number' && currentScore >= 50
                  ? 'text-amber-600'
                  : 'text-rose-600',
              )}
            >
              {statusLabel}
            </Text>
          </View>

          {/* Texto explicativo. mt-3 separa del header.
              leading-relaxed para que respire en multi-línea. */}
          <Text className="text-xs text-slate-500 mt-2 leading-relaxed">
            El puntaje base inicia en {maxScore} puntos cada trimestre. Las
            faltas restan puntos según su gravedad, mientras que los
            méritos otorgan puntos adicionales por conducta ejemplar.
          </Text>

          {/* Error de carga (si falló el summary). */}
          {conductError && !showScoreLoading && (
            <Text className="text-xs text-rose-600 mt-2 leading-relaxed">
              {conductError}
            </Text>
          )}
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
            Render de reports (mapeados desde el shape del backend
            al shape de ConductReportCard en el useMemo de arriba).
            Cada item se mapea a <ConductReportCard> con su onPress
            (noop por ahora; cuando exista el endpoint de detalle,
            navegar a /conduct/<id>).
            ============================================================ */}
        <View className="px-4">
          {/* Loading inicial de los logs (mientras summary ya
              cargó pero logs aún no). */}
          {isLoadingConduct && !logs.length && currentScore !== null && (
            <View className="bg-white rounded-2xl p-8 items-center">
              <ActivityIndicator size="small" color="#0ea5e9" />
            </View>
          )}

          {/* Lista de reports. */}
          {!isLoadingConduct && reports.length > 0 && (
            reports.map((report) => (
              <ConductReportCard
                key={report.id}
                report={report}
                onPress={() => {
                  // TODO: cuando exista el endpoint de detalle,
                  // navegar a /conduct/<id> aquí.
                }}
              />
            ))
          )}

          {/* Empty state: el alumno no tiene reportes en el
              trimestre (caso del alumno con score 100 y 0
              reportes). */}
          {!isLoadingConduct && reports.length === 0 && currentScore !== null && (
            <View className="bg-white rounded-2xl p-8 items-center">
              <Text className="text-sm text-slate-500 text-center">
                {activeStudentName} no tiene reportes en este trimestre.
              </Text>
              <Text className="text-xs text-slate-400 mt-1 text-center">
                ¡Puntaje perfecto de {maxScore} puntos!
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
