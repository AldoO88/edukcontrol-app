// =====================================================================
// app/(guardian)/announcements.jsx
// ---------------------------------------------------------------------
// Ruta "/announcements" del route group (app). Pantalla de "Avisos" para el
// tutor: feed unificado de anuncios de la escuela + citatorios de
// los hijos, filtrable por hijo.
//
// =====================================================================
// DATA SOURCE (julio 2026)
// ---------------------------------------------------------------------
// El feed proviene del endpoint:
//   GET /api/guardians/me/announcements
//
// El backend devuelve un array `items` mezclado de dos tipos:
//   - AnnouncementItem: priority informative/urgent, title, message,
//     sender, audience (general | group | student).
//   - CitationItem: type academic/behavioral/administrative, reason,
//     scheduledDate, status, student.
//
// La capa de transformación (src/utils/announcementHelpers.js) mapea
// cada item al shape que consume <AnnouncementCard>. El hook
// (src/hooks/useAnnouncements.js) maneja carga / error / refetch /
// focus. Esta pantalla solo orquesta: filtro de estudiante + render
// condicional de loading / error / lista.
// =====================================================================
// CHROME COMPARTIDO
// ---------------------------------------------------------------------
// Esta pantalla consume el chrome compartido del route group (app):
//   - DashboardHeader:   isotipo sky-500 + "EdukControl" + campana
//   - SchoolInfoCard:    logo + nombre + ciclo escolar de la escuela
//   - BottomTabBar:      5 tabs (Inicio / Avisos / Conducta /
//                        Calificaciones / Asistencia)
//
// El mismo chrome lo usa GuardianDashboard, así que cualquier
// cambio de branding/navegación se propaga a todas las pantallas
// del flujo logueado con un único edit.
// =====================================================================
// COMPORTAMIENTO DEL FILTRO "TODOS" (julio 2026)
// ---------------------------------------------------------------------
// Si el tutor tiene MÁS DE UN hijo registrado, mostramos el filtro
// completo: chip "Todos" + un chip por cada hijo. El chip "Todos"
// es el sentinel ALL_STUDENTS_ID ('all') que el useAnnouncements()
// traduce a "no enviar student_id" (feed global del tutor).
//
// Si el tutor tiene EXACTAMENTE UN hijo:
//   - NO mostramos el chip "Todos" (sería redundante — siempre
//     estarías viendo "todos" los avisos de tu único hijo).
//   - El chip del hijo queda auto-seleccionado y NO se puede
//     cambiar (no hay otra opción).
//
// El estado del filtro (`activeFilterId`) se inicializa VACÍO y se
// resuelve en un useEffect cuando llega la lista de hijos del
// backend. Esto evita un flash de "Todos" → "Hijo" en el caso
// del hijo único, y permite que el hook de avisos NO haga un
// fetch con student_id=null antes de saber qué hijo seleccionar
// (la lista se muestra solo cuando el filtro ya está decidido).
// =====================================================================

// React + hooks.
import React, { useMemo, useState, useEffect, useCallback } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';

// useRouter de expo-router para navegar a la pantalla de detalle.
import { useRouter } from 'expo-router';

// Iconos vectoriales (lucide).
import { AlertCircle, RefreshCw } from 'lucide-react-native';

// Hook del dashboard del tutor: encapsula la carga de datos del
// backend (escuela, alumnos, stats). Aquí solo consumimos
// `data.school` (para SchoolInfoCard) y `data.students` (para
// alimentar el filtro de alumnos).
import { useGuardianDashboard } from '../../src/hooks/useGuardianDashboard';

// Hook de avisos: encapsula la carga del feed unificado de
// anuncios + citatorios. Re-fetchea al cambiar de filtro y al
// volver a foco.
import { useAnnouncements } from '../../src/hooks/useAnnouncements';

// Helper que transforma los students del backend al shape que
// consume <StudentFilter> ({ id, name, avatarUrl, avatarLetter }).
// Aquí lo usamos para construir la lista de pills.
import { studentsForFilter } from '../../src/utils/studentHelpers';

// Helper que transforma el feed del backend al shape que consume
// <AnnouncementCard>. Aplica:
//   - Formato de fecha "24 oct" desde eventDate.
//   - Mapeo de audience → targetType ("General" | "Grupo 2°A" | "Personal: X").
//   - Mapeo de citation.type → "Motivo: Aprovechamiento" etc.
//   - Status derivado del citatorio (VENCIDO / HOY / PRÓXIMO / etc.).
//   - Truncado del message del aviso a ~120 chars.
import { transformFeedToCards } from '../../src/utils/announcementHelpers';

// Componentes del chrome compartido del route group (app).
import DashboardHeader from '../../src/components/DashboardHeader';
import SchoolInfoCard from '../../src/components/SchoolInfoCard';
import BottomTabBar from '../../src/components/BottomTabBar';

// Filtro de alumnos reutilizable (compartido con conduct.jsx).
import StudentFilter from '../../src/components/StudentFilter';

// Card de anuncio / citatorio (componente privado del route group (app)).
import AnnouncementCard from './_components/AnnouncementCard';

// ---------------------------------------------------------------------
// ALL_STUDENTS_ID
// ---------------------------------------------------------------------
// ID especial del filtro "Todos". No es un id real de ningún
// student del backend — es un sentinel que:
//   - El <StudentFilter> entiende como "mostrar todo" (sin avatar).
//   - El useAnnouncements() entiende como "no enviar student_id"
//     (devuelve el feed global del tutor: general + group + student).
//
// Solo se prepende al array de pills cuando hay MÁS DE UN hijo.
// Con un solo hijo, este sentinel no se usa (no se renderiza).
// ---------------------------------------------------------------------
const ALL_STUDENTS_ID = 'all';

export default function AnnouncementsScreen() {
  // -----------------------------------------------------------------
  // HOOKS
  // -----------------------------------------------------------------
  // useRouter: para navegar a la pantalla de detalle al tocar
  // una card. Usamos una sola ruta unificada `/announcements/:kind/:id` que
  // detecta el kind del item (announcement | citation) y muestra
  // el layout apropiado.
  const router = useRouter();

  // Hook del dashboard para obtener los datos de la escuela
  // Y los alumnos del tutor (necesarios para el filtro).
  const { data, isLoading: isLoadingDashboard } = useGuardianDashboard();

  // -----------------------------------------------------------------
  // ESTADO LOCAL
  // -----------------------------------------------------------------
  // id del filtro activo. Inicia VACÍO ('') y se resuelve en el
  // useEffect de abajo cuando llega la lista de hijos del backend.
  // Esto evita:
  //   1. Un flash de "Todos" → "Hijo" cuando hay un solo hijo.
  //   2. Que la lista de avisos se renderice con un filtro sin
  //      decidir (ver useAnnouncements con studentId=null más abajo).
  const [activeFilterId, setActiveFilterId] = useState('');

  // -----------------------------------------------------------------
  // DERIVADOS DE LA LISTA DE HIJOS
  // -----------------------------------------------------------------
  // backendStudents: lista cruda que viene del backend, ya mapeada
  // al shape que consume <StudentFilter> ({ id, name, avatarUrl, ... }).
  const backendStudents = useMemo(() => studentsForFilter(data), [data]);

  // hasSingleChild: true cuando el tutor tiene EXACTAMENTE un hijo.
  // En ese caso, NO mostramos el chip "Todos" y auto-seleccionamos
  // al hijo (más detalle en el bloque "COMPORTAMIENTO DEL FILTRO
  // 'TODOS'" al inicio del archivo).
  const hasSingleChild = backendStudents.length === 1;

  // students: array final que se pasa a <StudentFilter>. Lógica:
  //   - Si no hay datos del backend → [] (no se renderiza el filtro).
  //   - Si hay 1 hijo → solo el chip del hijo (sin "Todos").
  //   - Si hay 2+ hijos → chip "Todos" + un chip por hijo.
  const students = useMemo(() => {
    if (backendStudents.length === 0) return [];
    if (hasSingleChild) return backendStudents;
    return [
      { id: ALL_STUDENTS_ID, name: 'Todos' },
      ...backendStudents,
    ];
  }, [backendStudents, hasSingleChild]);

  // -----------------------------------------------------------------
  // EFECTO: resolver activeFilterId cuando llegan los hijos.
  // -----------------------------------------------------------------
  // Sin este useEffect, activeFilterId se quedaría en '' y la lista
  // de avisos no se renderizaría nunca. Cuando llega la lista de
  // hijos del backend, decidimos el id inicial según el caso:
  //   - 1 hijo  → id del hijo (forzamos selección; el padre no
  //               puede deseleccionarlo porque el chip "Todos" no
  //               existe).
  //   - 2+ hijos → ALL_STUDENTS_ID (modo "ver todo" por defecto).
  //
  // La condición `!activeFilterId` evita re-setear el id si el
  // usuario ya seleccionó manualmente otro hijo. Si en el futuro
  // el padre pierde/gana hijos, solo se resuelve el id inicial;
  // cambios posteriores requieren acción del usuario.
  useEffect(() => {
    if (!activeFilterId && backendStudents.length > 0) {
      if (hasSingleChild) {
        setActiveFilterId(backendStudents[0].id);
      } else {
        setActiveFilterId(ALL_STUDENTS_ID);
      }
    }
  }, [backendStudents, hasSingleChild, activeFilterId]);

  // -----------------------------------------------------------------
  // HOOK DE AVISOS
  // -----------------------------------------------------------------
  // useAnnouncements(studentId) dispara el fetch del feed. Cuando
  // NO hay un filtro decidido (activeFilterId === '') o el filtro
  // es "Todos", pasamos null → el service omite el query param
  // student_id. Cuando hay un hijo seleccionado, le pasamos su _id.
  //
  // NOTA: pasamos null explícitamente también cuando activeFilterId
  // es '' para que el hook reciba SIEMPRE un valor (null o string)
  // y el contrato del hook no dependa del estado de la pantalla.
  const {
    items,
    total,
    truncated,
    isLoading,
    error,
    refetch,
  } = useAnnouncements(
    !activeFilterId || activeFilterId === ALL_STUDENTS_ID ? null : activeFilterId,
  );

  // -----------------------------------------------------------------
  // DERIVADOS
  // -----------------------------------------------------------------
  // Cards ya transformados al shape de <AnnouncementCard>. Se
  // recalcula solo cuando cambia el array de items del backend.
  // Si el helper devuelve null (item sin _id), se filtra para que
  // el .map del render no explote con key=null.
  const visibleAnnouncements = useMemo(
    () => transformFeedToCards(items),
    [items],
  );

  // ¿Hay un alumno seleccionado Y su nombre resuelto? Lo usamos
  // para el copy del empty state. Con un solo hijo este siempre
  // devuelve su nombre (porque el filtro se auto-selecciona a él).
  const activeStudentName = useMemo(
    () => students.find((s) => s.id === activeFilterId)?.name || 'el estudiante',
    [students, activeFilterId],
  );

  // ¿Tenemos un filtro decidido? Lo usamos para gatear la
  // renderización de la lista de avisos. Mientras no haya un
  // activeFilterId (datos del dashboard aún no llegaron), mostramos
  // skeletons en vez de la lista — así evitamos mostrar un
  // resultado "stale" del fetch con student_id=null.
  const hasActiveFilter = Boolean(activeFilterId);

  // -----------------------------------------------------------------
  // HANDLER: tap en una card → navegar al detalle
  // -----------------------------------------------------------------
  // useCallback para que la referencia sea estable entre renders
  // (evita que AnnouncementCard reciba un onPress nuevo en cada
  // render del padre, lo cual podría disparar efectos no deseados
  // si el card usa useEffect con onPress en sus deps).
  //
  // La URL incluye el `kind` del item (`announcement` o `citation`)
  // porque el backend expone endpoints SEPARADOS para cada uno:
  //   - /announcements/announcement/:id
  //   - /announcements/citation/:id
  // Pasamos el kind en la URL para que la pantalla de detalle
  // sepa a qué endpoint llamar SIN un fetch extra de "discovery".
  // Ruta explícita al grupo (guardian): evita ambigüedad con los
  // shared routes (el teacher no define esta sub-ruta, pero ser
  // explícito es el patrón correcto con grupos por rol).
  const handleAnnouncementPress = useCallback(
    (announcement) => {
      if (!announcement?.id || !announcement?.kind) return;
      router.push(`/(guardian)/announcements/${announcement.kind}/${announcement.id}`);
    },
    [router],
  );

  // -----------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------
  return (
    // Contenedor raíz. bg-slate-50 para que las cards blancas
    // destaquen (mismo fondo que el resto de la app).
    <View className="flex-1 bg-slate-50">
      {/* Header compartido: brand + campana. */}
      <DashboardHeader />

      {/* School info card fija (no scrollea). */}
      <SchoolInfoCard
        school={data?.school}
        isLoading={isLoadingDashboard}
        className="mx-4 mt-4"
      />

      {/* ============================================================
          SCROLLVIEW PRINCIPAL
          ============================================================
          flex-1 para que ocupe el espacio entre el header y la
          tab bar. pb-8 deja aire al final para que la última card
          no quede pegada a la tab bar.
          refreshControl: pull-to-refresh dispara refetch del feed.
          Solo muestra el spinner cuando hay data previa (evita
          el "double spinner" durante el loading inicial, que ya
          tiene su propio skeleton).
          ============================================================ */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl
            refreshing={isLoading && items.length > 0}
            onRefresh={refetch}
            colors={['#0f172a']}
            tintColor="#0f172a"
          />
        }
      >

        {/* ============================================================
            TÍTULO + SUBTÍTULO
            ============================================================ */}
        <View className="px-4 pt-6">
          <Text className="text-3xl font-bold text-slate-900">
            Avisos
          </Text>
          <Text className="text-sm text-slate-500 mt-1">
            Comunicados y anuncios de la escuela.
          </Text>
        </View>

        {/* ============================================================
            FILTRO POR ESTUDIANTE (compartido con conduct.jsx)
            ============================================================
            Solo se renderiza cuando hay datos del backend. Si hay
            un solo hijo, el chip "Todos" se omite (el padre no
            puede ver "todo" porque solo tiene un hijo). El
            StudentFilter se encarga de resaltar el chip activo
            (que en el caso de single-child siempre es el hijo).
            ============================================================ */}
        {students.length > 0 && (
          <>
            <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-6 mb-3 px-5">
              Filtrar por estudiante
            </Text>

            <StudentFilter
              students={students}
              activeId={activeFilterId}
              onChange={setActiveFilterId}
              accessibilityLabel="Filtro de avisos por estudiante"
            />
          </>
        )}

        {/* ============================================================
            LISTA DE AVISOS
            ============================================================
            Estados manejados en orden de prioridad:
              0. Sin filtro decidido (datos del dashboard aún no
                 llegaron) → skeletons.
              1. Loading inicial (con filtro decidido, sin data) →
                 skeletons.
              2. Error sin data previa              → error card + retry.
              3. Sin items                          → empty state.
              4. Data OK                            → lista de cards.
            El `truncated` se muestra al final (banner informativo).
            ============================================================ */}
        <View className="px-4 mt-2">
          {/* 0/1) Loading: sin filtro decidido O carga inicial con
                filtro decidido. Mostramos 2 skeletons (mismo alto
                que una card real para evitar "jump" cuando llegue
                la data). */}
          {(!hasActiveFilter || (isLoading && items.length === 0)) && (
            <>
              <AnnouncementCardSkeleton />
              <AnnouncementCardSkeleton />
            </>
          )}

          {/* 2) Error sin data previa: error card con retry. */}
          {hasActiveFilter && !isLoading && error && items.length === 0 && (
            <View className="bg-white rounded-3xl p-6 items-center shadow-sm border border-rose-100">
              <AlertCircle size={32} color="#e11d48" strokeWidth={2} />
              <Text className="text-sm font-semibold text-rose-700 mt-3 text-center">
                No se pudieron cargar los avisos
              </Text>
              <Text className="text-xs text-slate-500 mt-1 text-center">
                {error}
              </Text>
              <Pressable
                onPress={refetch}
                className="flex-row items-center mt-4 px-4 py-2 bg-sky-600 active:bg-sky-700 rounded-xl"
                accessibilityRole="button"
                accessibilityLabel="Reintentar carga de avisos"
              >
                <RefreshCw size={14} color="#ffffff" strokeWidth={2.5} />
                <Text className="text-sm font-semibold text-white ml-1.5">
                  Reintentar
                </Text>
              </Pressable>
            </View>
          )}

          {/* 3) Data OK: lista de cards. Cada onPress navega al
                detalle del item. La pantalla de detalle discrimina
                por `item.kind` (announcement vs citation) y muestra
                el layout apropiado. */}
          {hasActiveFilter && !isLoading && !error && visibleAnnouncements.length > 0 && (
            visibleAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onPress={() => handleAnnouncementPress(announcement)}
              />
            ))
          )}

          {/* 4) Empty state: el backend devolvió 0 items. Copy
                distinto según si el filtro es "Todos" o un hijo
                específico (en el segundo caso, dice "para este
                estudiante" para que quede claro que el filtro sí
                está aplicado). */}
          {hasActiveFilter && !isLoading && !error && items.length === 0 && (
            <View className="bg-white rounded-2xl p-8 mt-4 items-center">
              <Text className="text-sm text-slate-500 text-center">
                {activeFilterId === ALL_STUDENTS_ID
                  ? 'No hay avisos por mostrar.'
                  : `No hay avisos para ${activeStudentName}.`}
              </Text>
              <Text className="text-xs text-slate-400 mt-1 text-center">
                Vuelve más tarde para ver nuevas publicaciones.
              </Text>
            </View>
          )}

          {/* 5) Banner "truncated": solo si el backend truncó el
                feed por el limit. Informa al tutor que hay más
                items de los que se están mostrando (en esta fase
                no hay paginación — se podría agregar un botón
                "ver más" más adelante). */}
          {hasActiveFilter && !isLoading && !error && truncated && items.length > 0 && (
            <View className="bg-white rounded-2xl p-3 mt-2 items-center border border-slate-100">
              <Text className="text-xs text-slate-500 text-center">
                Mostrando los {items.length} más recientes de {total}.
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

// ---------------------------------------------------------------------
// AnnouncementCardSkeleton
// ---------------------------------------------------------------------
// Placeholder mientras el backend responde el primer fetch del feed.
// Mantiene la altura/estructura de una AnnouncementCard real para
// evitar "jump" cuando llega la data.
//
// Reproduce las zonas de la card:
//   - Header: pill (izq) + fecha (der).
//   - Body:   título + descripción (2 líneas).
//   - Footer-1: targetType (1 línea).
//   - Footer-2: status (izq) + action link (der).
// ---------------------------------------------------------------------
function AnnouncementCardSkeleton() {
  return (
    <View
      className="bg-white rounded-2xl p-5 mb-4 shadow-sm"
      style={{ elevation: 1 }}
    >
      {/* Header: pill + fecha. */}
      <View className="flex-row items-center justify-between">
        <View className="h-6 w-20 bg-slate-200 rounded-full" />
        <View className="h-4 w-12 bg-slate-200 rounded" />
      </View>

      {/* Body: título + 2 líneas de descripción. */}
      <View className="h-5 bg-slate-200 rounded w-3/4 mt-3" />
      <View className="h-4 bg-slate-200 rounded w-full mt-2" />
      <View className="h-4 bg-slate-200 rounded w-2/3 mt-1" />

      {/* Footer-1: targetType (1 línea). */}
      <View className="border-t border-slate-100 mt-4 pt-3">
        <View className="h-4 bg-slate-200 rounded w-1/2" />
      </View>

      {/* Footer-2: status (izq) + action (der). */}
      <View className="mt-2 flex-row items-center justify-between">
        <View className="h-5 w-16 bg-slate-200 rounded-full" />
        <View className="h-4 w-16 bg-slate-200 rounded" />
      </View>
    </View>
  );
}
