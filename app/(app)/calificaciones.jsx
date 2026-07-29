// =====================================================================
// app/(app)/calificaciones.jsx
// ---------------------------------------------------------------------
// Ruta "/calificaciones" del route group (app). Pantalla de
// "Calificaciones" para el tutor.
//
// =====================================================================
// CHROME COMPARTIDO
// ---------------------------------------------------------------------
//   - DashboardHeader:    isotipo sky-500 + "EdukControl" + campana
//   - SchoolInfoCard:     logo + nombre + ciclo escolar
//   - StudentFilter:      pills de alumnos con avatar
//   - BottomTabBar:       5 tabs (Calificaciones activa)
//
// =====================================================================
// SECCIONES
// ---------------------------------------------------------------------
//   1. Filtro por estudiante (Carlos / Ana).
//   2. Card de promedio general (número + trend + descripción).
//   3. Calificaciones por materia (lista vertical con promedio).
//   4. Selector de día + horario escolar del día seleccionado.
// =====================================================================

// React + hooks.
import React, { useState } from 'react';

// Primitivas RN: View, Text, ScrollView, Pressable.
import { View, Text, ScrollView, Pressable } from 'react-native';

// Iconos Lucide.
import {
  TrendingUp,
  Sigma,         // Matemáticas.
  BookOpen,      // Lengua Española.
  FlaskConical,  // Ciencias Naturales.
  Globe,         // Historia.
} from 'lucide-react-native';

// clsx.
import { clsx } from 'clsx';

// Componentes del chrome compartido del route group (app).
import DashboardHeader from './_components/DashboardHeader';
import SchoolInfoCard from './_components/SchoolInfoCard';
import BottomTabBar from './_components/BottomTabBar';
import StudentFilter from './_components/StudentFilter';

// Componentes específicos de esta pantalla.
import CalificacionesTable from './_components/CalificacionesTable';
import HorarioList from './_components/HorarioList';

// Hook del dashboard del tutor: encapsula la carga de datos del
// backend (escuela, alumnos, stats). Aquí solo consumimos `data.school`
// para pasárselo a SchoolInfoCard — el resto lo ignora esta pantalla.
import { useGuardianDashboard } from '../../src/hooks/useGuardianDashboard';

// ---------------------------------------------------------------------
// MOCK_STUDENTS
// ---------------------------------------------------------------------
// Mismo shape que en avisos/conducta.
// ---------------------------------------------------------------------
const MOCK_STUDENTS = [
  { id: 'carlos', name: 'Carlos', avatarLetter: 'C', avatarUrl: 'https://i.pravatar.cc/100?img=12' },
  { id: 'ana',    name: 'Ana',    avatarLetter: 'A', avatarUrl: 'https://i.pravatar.cc/100?img=47' },
];

// ---------------------------------------------------------------------
// DAYS
// ---------------------------------------------------------------------
// Días lectivos disponibles. Etiquetas en MAYÚSCULAS de 3 chars
// para que las pills del selector sean compactas (LUN, MAR,
// MIÉ, JUE, VIE).
// ---------------------------------------------------------------------
const DAYS = [
  { id: 'lunes',     label: 'LUN', labelFull: 'Lunes' },
  { id: 'martes',    label: 'MAR', labelFull: 'Martes' },
  { id: 'miercoles', label: 'MIÉ', labelFull: 'Miércoles' },
  { id: 'jueves',    label: 'JUE', labelFull: 'Jueves' },
  { id: 'viernes',   label: 'VIE', labelFull: 'Viernes' },
];

// ---------------------------------------------------------------------
// MOCK_GRADES_DATA
// ---------------------------------------------------------------------
// Calificaciones por alumno. Cada materia tiene 3 notas
// (t1/t2/t3) — null si el trimestre aún no se ha evaluado.
// `average` es el promedio general ACTUAL (se muestra como texto
// plano en la card de Promedio General). `averageByTrimester`
// es el promedio por trimestre, mostrado en la fila destacada
// de la tabla.
//
// Diferencia con la versión anterior (que mostraba solo 1
// columna): ahora la tabla tiene 3 columnas (T1, T2, T3) y
// la fila de promedio muestra el promedio de cada trimestre.
// ---------------------------------------------------------------------
const MOCK_GRADES_DATA = {
  carlos: {
    average: 9.2,
    averageChange: 0.3,
    averageDescription:
      'Excelente desempeño. El progreso de este trimestre supera el promedio institucional.',
    averageByTrimester: { t1: 9.1, t2: null, t3: null },
    subjects: [
      { id: 'mat',  name: 'Matemáticas',       icon: Sigma,        t1: 9.5, t2: null, t3: null },
      { id: 'len',  name: 'Lengua Española',   icon: BookOpen,     t1: 8.8, t2: null, t3: null },
      { id: 'cn',   name: 'Ciencias Naturales', icon: FlaskConical, t1: 10,  t2: null, t3: null },
      { id: 'hist', name: 'Historia',          icon: Globe,        t1: 8.2, t2: null, t3: null },
    ],
  },
  ana: {
    average: 9.8,
    averageChange: 0.5,
    averageDescription:
      'Desempeño excepcional. Ana se mantiene en el cuadro de honor de su grupo.',
    averageByTrimester: { t1: 9.8, t2: null, t3: null },
    subjects: [
      { id: 'mat',  name: 'Matemáticas',       icon: Sigma,        t1: 9.8, t2: null, t3: null },
      { id: 'len',  name: 'Lengua Española',   icon: BookOpen,     t1: 9.7, t2: null, t3: null },
      { id: 'cn',   name: 'Ciencias Naturales', icon: FlaskConical, t1: 10,  t2: null, t3: null },
      { id: 'hist', name: 'Historia',          icon: Globe,        t1: 9.9, t2: null, t3: null },
    ],
  },
};

// ---------------------------------------------------------------------
// BASE_SCHEDULE
// ---------------------------------------------------------------------
// Horario base de la escuela. Aplica a TODOS los días (lun-vie)
// y a TODOS los alumnos, según especificación del usuario
// (julio 2026): jornada de 7:30 a 14:30 con receso de 10:50
// a 11:10 (20 min). 8 períodos de clase (4 antes del receso +
// 4 después) + 1 receso.
//
// Cada slot de clase tiene:
//   - time:        rango horario ("HH:MM - HH:MM").
//   - subject:     código de 3 letras que se muestra en el pill
//                  ("Mat", "Esp", "Cie", etc.).
//   - subjectFull: nombre completo de la materia ("Matemáticas",
//                  "Lengua Española", etc.) que se muestra junto
//                  al pill en la card.
//   - teacher:     nombre del maestro que imparte la materia.
//   - color:       clave de SUBJECT_COLORS (mapa en HorarioList).
//
// El receso es un slot con `type: 'receso'` y solo `time`.
//
// Como el array es read-only (el componente HorarioList solo
// lee, nunca muta), lo referenciamos directamente desde todas
// las entradas de MOCK_SCHEDULE_BY_DAY sin copiar — un único
// objeto compartido evita 10 duplicaciones literales.
// ---------------------------------------------------------------------
const BASE_SCHEDULE = [
  { time: '07:30 - 08:20', subject: 'Mat', subjectFull: 'Matemáticas',     teacher: 'Prof. García',    color: 'sky' },
  { time: '08:20 - 09:10', subject: 'Mat', subjectFull: 'Matemáticas',     teacher: 'Prof. García',    color: 'sky' },
  { time: '09:10 - 10:00', subject: 'Esp', subjectFull: 'Español', teacher: 'Prof. Rodríguez',  color: 'rose' },
  { time: '10:00 - 10:50', subject: 'Cie', subjectFull: 'Español',        teacher: 'Prof. Martínez',   color: 'rose' },
  { type: 'receso', time: '10:50 - 11:10' },
  { time: '11:10 - 12:00', subject: 'His', subjectFull: 'Historia',        teacher: 'Prof. López',      color: 'amber' },
  { time: '12:00 - 12:50', subject: 'Ing', subjectFull: 'Historia',          teacher: 'Prof. Hernández',  color: 'amber' },
  { time: '12:50 - 13:40', subject: 'Art', subjectFull: 'Ingles',           teacher: 'Prof. Sánchez',    color: 'purple' },
  { time: '13:40 - 14:30', subject: 'Dep', subjectFull: 'Ingles',        teacher: 'Prof. Torres',     color: 'purple' },
];

const BASE_SCHEDULEMARTES = [
  { time: '07:30 - 08:20', subject: 'ESP', subjectFull: 'Español', teacher: 'Prof. García',    color: 'sky' },
  { time: '08:20 - 09:10', subject: 'ESP', subjectFull: 'Español', teacher: 'Prof. García',    color: 'sky' },
  { time: '09:10 - 10:00', subject: 'BIO', subjectFull: 'Biología', teacher: 'Prof. Rodríguez',  color: 'rose' },
  { time: '10:00 - 10:50', subject: 'BIO', subjectFull: 'Biología', teacher: 'Prof. Martínez',   color: 'rose' },
  { type: 'receso', time: '10:50 - 11:10' },
  { time: '11:10 - 12:00', subject: 'TALLER', subjectFull: 'Ciencia y Tecnología', teacher: 'Prof. López', color: 'amber' },
  { time: '12:00 - 12:50', subject: 'TALLER', subjectFull: 'Ciencia y Tecnología', teacher: 'Prof. Hernández', color: 'amber' },
  { time: '12:50 - 13:40', subject: 'FCYT', subjectFull: 'FORMACION CIVICA Y ÉTICA', teacher: 'Prof. Sánchez', color: 'purple' },
  { time: '13:40 - 14:30', subject: 'FCYT', subjectFull: 'FORMACION CIVICA Y ÉTICA', teacher: 'Prof. Torres', color: 'purple' },
];
// ---------------------------------------------------------------------
// MOCK_SCHEDULE_BY_DAY
// ---------------------------------------------------------------------
// Horario por alumno y por día. Shape:
//   {
//     [studentId]: {
//       [dayId]: [slot, ...]
//     }
//   }
//
// Como BASE_SCHEDULE aplica a todos los días y todos los alumnos
// (jornada escolar única), simplemente referenciamos el mismo
// array en cada entrada. Si en el futuro un alumno tiene
// horario diferente (e.g. turno vespertino), se reemplaza la
// referencia por un array propio.
// ---------------------------------------------------------------------
const MOCK_SCHEDULE_BY_DAY = {
  carlos: {
    lunes:     BASE_SCHEDULE,
    martes:    BASE_SCHEDULEMARTES,
    miercoles: BASE_SCHEDULE,
    jueves:    BASE_SCHEDULE,
    viernes:   BASE_SCHEDULE,
  },
  ana: {
    lunes:     BASE_SCHEDULE,
    martes:    BASE_SCHEDULE,
    miercoles: BASE_SCHEDULE,
    jueves:    BASE_SCHEDULE,
    viernes:   BASE_SCHEDULE,
  },
};

export default function CalificacionesScreen() {
  // -----------------------------------------------------------------
  // HOOKS
  // -----------------------------------------------------------------
  const { data, isLoading } = useGuardianDashboard();

  // -----------------------------------------------------------------
  // ESTADO LOCAL
  // -----------------------------------------------------------------
  // Alumno activo. Default: 'carlos' (mismo que en conducta).
  const [activeFilterId, setActiveFilterId] = useState('carlos');

  // Día activo del horario. Default: 'lunes' (LUN) para que
  // la primera vista muestre el horario del lunes.
  const [activeDay, setActiveDay] = useState('lunes');

  // -----------------------------------------------------------------
  // DERIVADOS
  // -----------------------------------------------------------------
  // Calificaciones del alumno activo. Fallback a {} si el id
  // no existe.
  const gradesData = MOCK_GRADES_DATA[activeFilterId] || {
    average: 0,
    averageChange: 0,
    averageDescription: '',
    averageByTrimester: { t1: null, t2: null, t3: null },
    subjects: [],
  };

  // Horario del alumno + día activo (single-day view).
  const daySchedule =
    MOCK_SCHEDULE_BY_DAY[activeFilterId]?.[activeDay] || [];

  // Etiqueta del día activo (LUN, MAR, MIÉ...) para el header
  // de la tabla de horario.
  const activeDayLabel =
    DAYS.find((d) => d.id === activeDay)?.labelFull|| 'LUNES';

  const isPositiveTrend = gradesData.averageChange >= 0;
  const trendColor = isPositiveTrend ? 'text-emerald-600' : 'text-rose-600';
  const trendSign = isPositiveTrend ? '+' : '';

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
          accessibilityLabel="Filtro de calificaciones por estudiante"
        />

        {/* ============================================================
            PROMEDIO GENERAL (solo texto, sin card)
            ============================================================
            A petición del usuario (julio 2026), esta sección YA
            NO se renderiza como un card. Es texto plano sobre el
            fondo slate-50 de la pantalla, sin bg-white / border /
            shadow. La jerarquía visual la marca el tamaño del
            número (text-5xl sky-500) y la separación vertical
            entre las 3 líneas (label → número+trend → descripción).
            Mismo padding lateral (mx-4) que el resto de secciones
            para mantener la alineación.
            ============================================================ */}
        <View className="mx-4 mt-6">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Promedio general
          </Text>

          <View className="flex-row items-baseline mt-1">
            <Text className="text-5xl font-bold text-sky-500">
              {gradesData.average.toFixed(1)}
            </Text>
            <View className="flex-row items-center ml-3">
              <TrendingUp
                size={16}
                color={isPositiveTrend ? '#059669' : '#dc2626'}
                strokeWidth={2.5}
              />
              <Text className={`text-sm font-bold ml-1 ${trendColor}`}>
                {trendSign}{gradesData.averageChange.toFixed(1)} este mes
              </Text>
            </View>
          </View>

          <Text className="text-xs text-slate-500 mt-3 leading-relaxed">
            {gradesData.averageDescription}
          </Text>
        </View>

        {/* ============================================================
            CALIFICACIONES POR TRIMESTRE
            ============================================================ */}
        <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-7 mb-3 px-5">
          Calificaciones por trimestre
        </Text>

        <View className="px-4">
          <CalificacionesTable
            subjects={gradesData.subjects}
            averageByTrimester={gradesData.averageByTrimester}
          />
        </View>

        {/* ============================================================
            HORARIO ESCOLAR + SELECTOR DE DÍA
            ============================================================
            A petición del usuario (julio 2026), el horario vuelve
            a la versión de UN día a la vez (con selector de día
            arriba), pero ahora cada clase muestra:
              - Código de materia (Mat, Esp, etc.) en pill
              - Nombre completo de la materia (Matemáticas, etc.)
              - Nombre del maestro que la imparte (Prof. García)
            ============================================================ */}
        <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-7 mb-3 px-5">
          Horario escolar
        </Text>

        {/* Selector de día. Mismo patrón visual que StudentFilter
            (pills horizontales con bg-slate-900 activo /
            bg-slate-100 inactivo) pero SIN avatar (solo texto
            de 3 chars). */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-5 mb-4"
          accessibilityLabel="Selector de día del horario"
        >
          {DAYS.map((day) => {
            const isActive = day.id === activeDay;
            return (
              <Pressable
                key={day.id}
                onPress={() => setActiveDay(day.id)}
                className={clsx(
                  'rounded-full px-5 py-2',
                  isActive ? 'bg-slate-900' : 'bg-slate-100',
                )}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Ver horario del ${day.id}`}
              >
                <Text
                  className={clsx(
                    'text-xs font-bold tracking-wider',
                    isActive ? 'text-white' : 'text-slate-700',
                  )}
                >
                  {day.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Tabla de horario del día seleccionado. */}
        <View className="px-4">
          <HorarioList
            day={activeDayLabel}
            schedule={daySchedule}
          />
        </View>
      </ScrollView>

      {/* Tab bar compartida. */}
      <BottomTabBar />
    </View>
  );
}
