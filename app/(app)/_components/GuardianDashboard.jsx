// =====================================================================
// app/(app)/_components/GuardianDashboard.jsx
// ---------------------------------------------------------------------
// Dashboard del PADRE / TUTOR (rol "tutor"). Pantalla principal
// post-login para usuarios con ese rol. Se monta desde el dispatcher
// de app/(app)/dashboard.jsx cuando useAuth().userRole === 'tutor'.
//
// Componente privado del route group (app): vive en _components/
// (prefijo "_") para que Expo Router lo ignore como ruta.
//
// Estructura (de arriba a abajo):
//   ┌──────────────────────────────────┐
//   │ Top header: EdukControl + 🔔    │  ← brand del producto + campana
//   ├──────────────────────────────────┤
//   │ School info card                 │  ← nombre + logo de la escuela
//   ├──────────────────────────────────┤
//   │ Hola, [user.greeting del back]  │  ← saludo desde el backend
//   │ [Padre de Familia]               │
//   ├──────────────────────────────────┤
//   │ Stats bar (N hijos activos)      │  ← resumen del backend
//   ├──────────────────────────────────┤
//   │ ┌────────────────────────────┐   │
//   │ │ StudentCard (Juan)    ▌sky │   │  ← borde derecho alternado
//   │ └────────────────────────────┘   │
//   │ ┌────────────────────────────┐   │
//   │ │ StudentCard (otro)   ▌emerald│
//   │ └────────────────────────────┘   │
//   ├──────────────────────────────────┤
//   │ Bottom tab bar (5 tabs)          │  ← Inicio / Avisos / etc.
//   └──────────────────────────────────┘
//
// =====================================================================
// LOOK & FEEL (alineado con el rediseño del login)
// ---------------------------------------------------------------------
// Esta pantalla hereda el lenguaje visual que aplicamos al login
// (julio 2026): cards `rounded-3xl`, sombras más fuertes, acento
// sky-500, labels en mayúsculas con tracking. La única lógica que
// cambia respecto al dashboard previo es COSMÉTICA — la carga de
// datos, el refetch, la navegación y la lectura del backend no se
// tocan. Ver CHANGELOG abajo.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN.
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

// Componentes del chrome compartido del route group (app). Vivir
// aquí como _components/ permite que Dashboard y Avisos (y futuras
// rutas) los reutilicen sin duplicar el header / la card de
// escuela / la tab bar.
import DashboardHeader from './DashboardHeader';
import SchoolInfoCard from './SchoolInfoCard';
import BottomTabBar from './BottomTabBar';

// Iconos vectoriales (lucide).
import {
  GraduationCap, // fallback del logo de la escuela.
  User,          // fallback del avatar del alumno.
  AlertCircle,   // ícono de error.
  RefreshCw,     // ícono de retry.
  History,       // último evento tipo "entrada" (reloj con flecha).
  LogOut,        // último evento tipo "salida".
  Clock,         // fallback cuando no hay last_event.
  Percent,       // KPI #1: porcentaje de asistencia.
  Award,         // KPI #2: promedio acumulado (medalla).
  Star,          // KPI #3: puntos de conducta.
} from 'lucide-react-native';

// Hook de auth: provee { user, isLoading, userRole, ... }. Aquí
// solo necesitamos user.name como fallback (el backend envía el
// greeting en data.user.greeting).
import { useAuth } from '../../../src/hooks/useAuth';

// Hook del dashboard: encapsula la carga de datos del backend,
// loading state, error state, y refetch al volver a foco.
import { useGuardianDashboard } from '../../../src/hooks/useGuardianDashboard';

// Helper de fechas: formatea el timestamp del último evento de
// entrada/salida como "Hoy, 7:25 a. m." / "Ayer, 2:15 p. m." / etc.
import { formatRelativeDateTime } from '../../../src/utils/dateHelpers';

// clsx para componer classNames condicionales.
import { clsx } from 'clsx';

// ---------------------------------------------------------------------
// Paleta del borde derecho de StudentCard (alternada por índice).
// ---------------------------------------------------------------------
// Cuando el tutor tiene varios hijos registrados, cada card lleva
// una franja vertical de color en el borde derecho para diferenciar
// visualmente a cada alumno de un vistazo. La alternancia es
// PAR/IMPAR (índice 0, 2, 4… → sky; 1, 3, 5… → emerald) y se
// mantiene estable entre renders (no se randomiza).
const STUDENT_ACCENT_COLORS = [
  { borderClass: 'border-sky-500', label: 'sky' },     // índice par
  { borderClass: 'border-emerald-500', label: 'emerald' }, // índice impar
];

// ---------------------------------------------------------------------
// getInitials(name)
// ---------------------------------------------------------------------
// Helper: dado un nombre completo, devuelve las iniciales (1-2 chars)
// para usar como fallback en el avatar. Si el nombre está vacío,
// devuelve "?" (placeholder genérico).
const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ---------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------
export default function GuardianDashboard() {
  // user.name: fallback del AuthContext (viene del JWT). El backend
  // también manda un greeting en data.user.greeting; preferimos ese.
  const { user } = useAuth();

  // Hook del dashboard: carga los datos del backend, expone loading
  // y error, y refetchea al volver a foco.
  const { data, isLoading, error, refetch } = useGuardianDashboard();

  // Derivados del payload del backend. Usamos optional chaining
  // para que la UI no rompa si la data aún no llegó.
  const userGreeting = data?.user?.greeting || user?.name || 'Familia';
  const students = data?.students || [];
  const stats = data?.stats;

  return (
    // Contenedor raíz flex-1.
    <View className="flex-1 bg-slate-50">
      {/* Header compartido: brand + campana. */}
      <DashboardHeader />

      {/* ScrollView con flex-1. refreshControl permite pull-to-refresh. */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !!data}
            onRefresh={refetch}
            colors={['#0f172a']}
            tintColor="#0f172a"
          />
        }
      >
        {/* School info card compartida. className="mx-4 mt-4" aplica
            el gutter lateral y el margen superior (antes vivían
            inline en este archivo). */}
        <SchoolInfoCard
          school={data?.school}
          isLoading={isLoading}
          className="mx-4 mt-4"
        />

        {/* ============================================================
            SALUDO
            ============================================================
            Mismo patrón que el "Bienvenido" del login: título grande
            + subtítulo gris. El rol ("Padre de Familia") se muestra
            ahora como un pill badge con label UPPERCASE tracking,
            idéntico al estilo de los labels de los inputs del login.
            ============================================================ */}
        <View className="px-4 mt-6">
          <Text className="text-3xl font-bold text-slate-900">
            Hola, {userGreeting}
          </Text>

          {/* Pill "Padre de Familia". self-start para que ocupe solo
              el ancho de su contenido, no toda la línea. */}
          <View className="self-start mt-2 px-3 py-1 bg-sky-50 rounded-full">
            <Text className="text-xs font-bold uppercase tracking-wide text-sky-700">
              Padre de Familia
            </Text>
          </View>

          <Text className="text-sm text-slate-500 mt-3">
            {data?.subtitle ||
              'Sigue el progreso académico de tus hijos en tiempo real.'}
          </Text>
        </View>

        {/* ============================================================
            STATS BAR (opcional)
            ============================================================
            Si el backend manda stats, mostramos un resumen pequeño.
            Si no, no mostramos nada (el backend podría no incluirlos
            en alguna versión). Lo envolvemos en una card con
            rounded-2xl para que tenga el mismo lenguaje que el resto.
            ============================================================ */}
        {stats && (stats.total_students > 0 || stats.active_students > 0) && (
          <View className="px-4 mt-3">
            <View className="bg-sky-50 rounded-2xl px-4 py-3 self-start flex-row items-center">
              <Text className="text-xs font-bold uppercase tracking-wide text-sky-700">
                {stats.active_students} {stats.active_students === 1 ? 'hijo activo' : 'hijos activos'}
                {stats.inactive_students > 0 && (
                  <Text className="text-sky-500 font-medium normal-case">
                    {' · '}{stats.inactive_students} {stats.inactive_students === 1 ? 'inactivo' : 'inactivos'}
                  </Text>
                )}
              </Text>
            </View>
          </View>
        )}

        {/* ============================================================
            STUDENT CARDS
            ============================================================ */}
        <View className="px-4 mt-6">
          {/* Loading inicial: 2 skeletons. */}
          {isLoading && !data && (
            <>
              <StudentCardSkeleton />
              <StudentCardSkeleton />
            </>
          )}

          {/* Error sin data previa: error state con retry. */}
          {!isLoading && error && !data && (
            <View className="bg-white rounded-3xl p-6 items-center shadow-sm border border-rose-100">
              <AlertCircle size={32} color="#e11d48" strokeWidth={2} />
              <Text className="text-sm font-semibold text-rose-700 mt-3 text-center">
                No se pudo cargar el dashboard
              </Text>
              <Text className="text-xs text-slate-500 mt-1 text-center">
                {error}
              </Text>
              <Pressable
                onPress={refetch}
                className="flex-row items-center mt-4 px-4 py-2 bg-sky-600 active:bg-sky-700 rounded-xl"
                accessibilityRole="button"
                accessibilityLabel="Reintentar carga del dashboard"
              >
                <RefreshCw size={14} color="#ffffff" strokeWidth={2.5} />
                <Text className="text-sm font-semibold text-white ml-1.5">
                  Reintentar
                </Text>
              </Pressable>
            </View>
          )}

          {/* Data OK: lista de estudiantes del backend. Pasamos el
              `index` para que StudentCard pueda alternar el color
              del borde derecho (sky → emerald → sky → …). */}
          {!isLoading && data && students.length > 0 && (
            students.map((student, index) => (
              <StudentCard
                key={student._id}
                student={student}
                index={index}
              />
            ))
          )}

          {/* Data OK pero students vacío: empty state. */}
          {!isLoading && data && students.length === 0 && (
            <View className="bg-white rounded-3xl p-6 items-center shadow-sm border border-slate-100">
              <Text className="text-sm text-slate-500 text-center">
                Aún no tienes hijos registrados en tu cuenta.
              </Text>
              <Text className="text-xs text-slate-400 mt-1 text-center">
                Contacta a tu institución para agregarlos.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom tab bar compartido. */}
      <BottomTabBar />
    </View>
  );
}

// ---------------------------------------------------------------------
// StudentCardSkeleton
// ---------------------------------------------------------------------
// Placeholder mientras el backend responde el primer fetch. Mantiene
// la altura/estructura de una StudentCard real para evitar "jump".
// ---------------------------------------------------------------------
function StudentCardSkeleton() {
  return (
    <View
      className="bg-white rounded-3xl p-5 mb-4 shadow-sm"
      style={{ elevation: 1 }}
    >
      <View className="flex-row items-center">
        <View className="w-20 h-20 rounded-full bg-slate-200" />
        <View className="ml-4 flex-1">
          <View className="h-5 bg-slate-200 rounded w-2/3" />
          <View className="h-4 bg-slate-200 rounded w-1/3 mt-2" />
        </View>
      </View>
      <View className="h-6 bg-slate-200 rounded-full w-1/2 mt-4" />
      <View className="h-12 bg-slate-200 rounded-xl mt-4" />
    </View>
  );
}

// ---------------------------------------------------------------------
// StudentCard
// ---------------------------------------------------------------------
// Card blanca con la info de UN estudiante: foto (o iniciales) +
// nombre completo + grupo + pill de status + último evento de
// entrada/salida (student.last_event). Diseñada para la shape
// actual del backend (sin metrics de asistencia/promedio/conducta —
// se agregarán cuando el backend los exponga).
//
// Recibe `index` (entero, posición del alumno en la lista) para
// alternar el color del borde derecho entre sky (índice par) y
// emerald (índice impar). Esto permite al tutor identificar de
// un vistazo a qué hijo corresponde cada card cuando tiene varios.
// ---------------------------------------------------------------------
function StudentCard({ student, index = 0 }) {
  // Nombre completo: combinamos first_name + last_name, manejando
  // el caso de last_name null (alumnos con un solo nombre).
  const fullName = [student.first_name, student.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Alumno';

  // Grupo: priorizamos group_label (texto legible) sobre current_group
  // (ID). Si ambos son null, mostramos "Sin grupo asignado".
  const groupLabel =
    student.group_label ||
    (student.current_group ? `Grupo ${student.current_group}` : null) ||
    'Sin grupo asignado';

  // Status pill: derivamos del status del backend.
  // "active" → verde "Activo" | "inactive" → gris "Inactivo".
  const isActive = student.status === 'active';
  const statusLabel = isActive ? 'Activo' : 'Inactivo';
  const statusColors = isActive
    ? { bg: 'bg-emerald-50', dot: 'bg-emerald-500', text: 'text-emerald-700' }
    : { bg: 'bg-slate-100', dot: 'bg-slate-400', text: 'text-slate-500' };

  // Foto: el backend manda photo_url (URL absoluta). Si es null
  // o falla al cargar (onError), mostramos las iniciales.
  const [photoError, setPhotoError] = React.useState(false);
  React.useEffect(() => {
    setPhotoError(false);
  }, [student.photo_url]);
  const showPhoto = student.photo_url && !photoError;

  // ---------------------------------------------------------------------
  // Último evento de entrada/salida.
  // ---------------------------------------------------------------------
  // El backend manda `student.last_event` como:
  //   {
  //     event_type: 'entry' | 'exit',
  //     event_type_label: 'Entrada' | 'Salida',
  //     event_time: '2026-07-27T13:45:00.000Z', // ISO datetime
  //     device: 'rfid@reader-01',
  //     is_currently_in_institution: true | false,
  //   }
  // o `null` si el alumno todavía no registra ningún evento (ej. recién
  // inscrito, o la institución no usa control de acceso).
  const lastEvent = student.last_event;
  const lastEventDate = lastEvent?.event_time ? new Date(lastEvent.event_time) : null;
  const hasValidLastEvent = lastEvent
    && lastEventDate
    && !Number.isNaN(lastEventDate.getTime());

  // Etiqueta: preferimos "event_type_label" (ya viene en español desde
  // el backend); si faltara, derivamos un fallback desde "event_type".
  const lastEventLabel = lastEvent?.event_type_label
    || (lastEvent?.event_type === 'exit' ? 'Salida' : 'Entrada');

  // Texto final a mostrar. Si no hay last_event válido, mostramos un
  // texto alternativo neutro en vez de dejar el espacio vacío.
  const lastEventText = hasValidLastEvent
    ? `${lastEventLabel}: ${formatRelativeDateTime(lastEventDate)}`
    : 'Sin registros de entrada/salida';

  // Ícono: "History" para entrada, "LogOut" para salida, "Clock"
  // gris como fallback cuando no hay evento registrado.
  const LastEventIcon = !hasValidLastEvent
    ? Clock
    : (lastEvent.event_type === 'exit' ? LogOut : History);

  // Texto "En el plantel" / "Fuera del plantel", derivado directamente
  // del booleano `is_currently_in_institution` que manda el backend
  // dentro de last_event. Es independiente del tipo del último evento:
  // el backend ya resuelve si el alumno sigue dentro AHORA MISMO. Si
  // no hay last_event (o el campo no viene), no mostramos nada.
  const institutionLabel = typeof lastEvent?.is_currently_in_institution === 'boolean'
    ? (lastEvent.is_currently_in_institution ? 'En el plantel' : 'Fuera del plantel')
    : null;

  // Colores del pill: por defecto usamos statusColors (verde/gris
  // según status activo/inactivo). PERO si el alumno está fuera del
  // plantel (is_currently_in_institution === false), sobreescribimos
  // con ámbar para llamar la atención del tutor, sin importar si el
  // alumno sigue "Activo" a nivel de inscripción.
  const isOutsideInstitution = lastEvent?.is_currently_in_institution === false;
  const pillColors = isOutsideInstitution
    ? { bg: 'bg-amber-50', dot: 'bg-amber-500', text: 'text-amber-700' }
    : statusColors;

  // Color del borde derecho (acento alternado por índice). El cálculo
  // es estable: índice 0 → sky, 1 → emerald, 2 → sky, 3 → emerald…
  // Si en el futuro hay más de 2 hijos, el patrón sigue siendo
  // coherente porque se repite cada 2.
  const accent = STUDENT_ACCENT_COLORS[index % STUDENT_ACCENT_COLORS.length];

  return (
    // Card blanca con borde derecho de color.
    // - rounded-3xl: bordes muy generosos (mismo lenguaje que el login).
    // - shadow-md: sombra más fuerte que la anterior (elevation 3).
    // - border-r-4: 4px de borde en el lado derecho.
    // - border-r-{color}: color del borde alternado por índice
    //   (sky-500 o emerald-500). borderRightWidth respeta el
    //   borderRadius, así que el borde sigue la curva en las
    //   esquinas — queda como un "ribbon" limpio.
    <View
      className={clsx(
        'bg-white rounded-3xl p-5 mb-4 shadow-md border-r-4',
        accent.borderClass,
      )}
      style={{ elevation: 3 }}
    >
      {/* Header: avatar + nombre + grupo. */}
      <View className="flex-row items-center">
        {/* Avatar: 80x80 circular (agrandado para dar más protagonismo
            a la info del alumno, manteniendo la proporción con el
            resto de la card). */}
        <View className="w-20 h-20 rounded-full bg-sky-100 items-center justify-center overflow-hidden">
          {showPhoto ? (
            <Image
              source={{ uri: student.photo_url }}
              className="w-full h-full"
              resizeMode="cover"
              accessibilityLabel={`Foto de ${fullName}`}
              onError={() => setPhotoError(true)}
            />
          ) : (
            // Fallback: iniciales sobre fondo sky-100. Es mejor que
            // un ícono genérico porque personaliza la card.
            <Text className="text-2xl font-bold text-sky-700">
              {getInitials(fullName)}
            </Text>
          )}
        </View>
        <View className="ml-4 flex-1">
          <Text
            className="text-xl font-bold text-slate-900"
            numberOfLines={1}
          >
            {fullName}
          </Text>
          <Text className="text-sm text-slate-500 mt-1" numberOfLines={1}>
            {groupLabel}
          </Text>
          {student.enrollment_number && (
            <Text className="text-sm text-slate-400 mt-0.5">
              No. Control: {student.enrollment_number}
            </Text>
          )}
        </View>
      </View>

      {/* Status pill. */}
      <View className="mt-4">
        <View
          className={clsx(
            'flex-row items-center self-start px-3.5 py-1.5 rounded-full',
            pillColors.bg,
          )}
        >
          <View className={clsx('w-2.5 h-2.5 rounded-full mr-2', pillColors.dot)} />
          <Text className={clsx('text-sm font-semibold', pillColors.text)}>
            {statusLabel}
            {institutionLabel ? ` · ${institutionLabel}` : ''}
          </Text>
        </View>
      </View>

      {/* Último evento de entrada/salida (o texto alternativo si el
          backend todavía no tiene ningún registro para este alumno). */}
      <View className="flex-row items-center mt-3">
        <LastEventIcon size={15} color="#64748b" strokeWidth={2} />
        <Text className="text-sm text-slate-500 ml-1.5">
          {lastEventText}
        </Text>
      </View>

      {/* ============================================================
          FILA DE KPIs (3 columnas)
          ============================================================
          Tres indicadores académicos del alumno, alineados en una
          fila horizontal al final de la card. Cada uno se renderiza
          como <KpiCell> (sub-componente abajo) que centraliza el
          patrón "icono circular + valor grande + sub-valor + label".

          Visualmente:
            [Asistencia]  [Promedio]  [Conducta]
              90 %          8.5          80
             9/10 días      GPA          Puntos

          border-t border-slate-100 + pt-4 separa visualmente
          esta sección del bloque de "último evento" sin necesidad
          de un divider explícito.

          IMPORTANTE: la fila SIEMPRE se renderiza, incluso si el
          backend no manda `student.kpis` o si los valores vienen
          null. En esos casos, cada celda muestra "—" como
          placeholder, manteniendo la altura y alineación de la
          fila (clave para que las cards de varios hijos no
          "salten" en altura cuando uno tiene datos y otro no).
          ============================================================ */}
      {(() => {
        // kpis normalizado a {} para evitar optional chaining repetido
        // y para que la fila se renderice aunque venga undefined.
        const kpis = student.kpis || {};

        return (
          <View className="border-t border-slate-100 mt-4 pt-4 flex-row">
            {/* KPI #1: Asistencia.
                - Porcentaje redondeado a entero (90% vs 90.0%).
                - Sub-label con la fracción "X/Y días" para dar
                  contexto (9/10 días). Si no hay datos, muestra "—". */}
            <KpiCell
              icon={Percent}
              iconBg="bg-emerald-50"
              iconColor="#10b981"
              value={
                typeof kpis.attendance?.percentage === 'number'
                  ? `${Math.round(kpis.attendance.percentage)}%`
                  : '—'
              }
              subValue={
                typeof kpis.attendance?.attended_days === 'number'
                && typeof kpis.attendance?.total_school_days === 'number'
                  ? `${kpis.attendance.attended_days}/${kpis.attendance.total_school_days} días`
                  : '—'
              }
              label="Asistencia"
              borderRight
            />

            {/* KPI #2: Promedio acumulado.
                - cumulative_gpa puede ser null (alumno sin
                  evaluaciones todavía). Mostramos "—" en ese caso. */}
            <KpiCell
              icon={Award}
              iconBg="bg-sky-50"
              iconColor="#0ea5e9"
              value={
                typeof kpis.cumulative_gpa === 'number'
                  ? kpis.cumulative_gpa.toFixed(1)
                  : '—'
              }
              subValue="—"
              label="Promedio"
              borderRight
            />

            {/* KPI #3: Conducta.
                - score parte en 100 y se descuenta por reportes
                  "severe" (kpis.conduct.deduction). */}
            <KpiCell
              icon={Star}
              iconBg="bg-amber-50"
              iconColor="#f59e0b"
              value={
                typeof kpis.conduct?.score === 'number'
                  ? String(kpis.conduct.score)
                  : '—'
              }
              subValue={
                typeof kpis.conduct?.reports_count === 'number'
                && kpis.conduct.reports_count > 0
                  ? `${kpis.conduct.reports_count} ${
                      kpis.conduct.reports_count === 1 ? 'reporte' : 'reportes'
                    }`
                  : '—'
              }
              label="Conducta"
            />
          </View>
        );
      })()}
    </View>
  );
}

// ---------------------------------------------------------------------
// KpiCell
// ---------------------------------------------------------------------
// Sub-componente interno del StudentCard. Renderiza UNA celda de la
// fila de KPIs: ícono en círculo de color + valor grande + sub-valor
// (SIEMPRE visible, con "—" como placeholder) + label chico.
// Se usa 3 veces (asistencia, promedio, conducta) con la misma
// estructura.
//
// Props:
//   - icon: componente Lucide.
//   - iconBg, iconColor: estilos del círculo del icono.
//   - value: string con el valor principal (ej: "90%", "8.5", "80",
//     o "—" si no hay datos).
//   - subValue: string SIEMPRE presente (puede ser "—"). El caller
//     es responsable de pasar "—" cuando el dato no esté disponible,
//     para mantener la altura de la fila constante entre cards.
//   - label: string con la etiqueta final (ej: "Asistencia").
//   - borderRight: boolean. Si true, dibuja un divider vertical
//     sutil a la derecha de la celda para separar visualmente
//     entre KPIs.
// ---------------------------------------------------------------------
function KpiCell({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  subValue = '—',
  label,
  borderRight = false,
}) {
  return (
    // flex-1: las 3 celdas se reparten el ancho equitativamente.
    // items-center: centra el contenido en cada celda.
    // px-2: padding lateral mínimo para que el label no toque los
    // bordes (sobre todo con borderRight).
    <View
      className={clsx(
        'flex-1 items-center px-2',
        borderRight && 'border-r border-slate-100',
      )}
    >
      {/* Círculo del icono. w-10 h-10 (40px) es suficiente para un
          icono size=18. rounded-full para look "badge". */}
      <View
        className={clsx('w-10 h-10 rounded-full items-center justify-center', iconBg)}
      >
        <Icon size={18} color={iconColor} strokeWidth={2.25} />
      </View>

      {/* Valor principal. text-lg (18px) bold, slate-900. */}
      <Text className="text-lg font-bold text-slate-900 mt-2">
        {value}
      </Text>

      {/* Sub-valor SIEMPRE visible. El caller pasa "—" cuando el
          dato no está disponible, así la altura de la fila se
          mantiene estable entre cards (clave cuando el tutor tiene
          varios hijos y uno tiene KPIs y otro no).
          leading-tight evita separación excesiva entre sub-valor y
          label cuando ambos están presentes. */}
      <Text className="text-xs text-slate-500 mt-0.5 leading-tight min-h-[16px]">
        {subValue}
      </Text>

      {/* Label: UPPERCASE + tracking-wide + font-bold, slate-500.
          Mismo patrón que los labels del login → coherencia
          visual entre pantallas. */}
      <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mt-1">
        {label}
      </Text>
    </View>
  );
}
