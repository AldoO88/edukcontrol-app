// =====================================================================
// app/(app)/avisos.jsx
// ---------------------------------------------------------------------
// Ruta "/avisos" del route group (app). Pantalla de "Avisos" para el
// tutor: lista de anuncios publicados por la escuela, filtrable por
// hijo.
//
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

// React + hooks.
import React, { useMemo, useState } from 'react';

// Primitivas RN: View, Text, ScrollView.
import {
  View,
  Text,
  ScrollView,
} from 'react-native';

// Hook del dashboard del tutor: encapsula la carga de datos del
// backend (escuela, alumnos, stats). Aquí solo consumimos `data.school`
// para pasárselo a SchoolInfoCard.
import { useGuardianDashboard } from '../../src/hooks/useGuardianDashboard';

// Componentes del chrome compartido del route group (app).
import DashboardHeader from './_components/DashboardHeader';
import SchoolInfoCard from './_components/SchoolInfoCard';
import BottomTabBar from './_components/BottomTabBar';

// Filtro de alumnos reutilizable (compartido con conducta.jsx).
import StudentFilter from './_components/StudentFilter';

// Card de anuncio (componente privado del route group (app)).
import AnnouncementCard from './_components/AnnouncementCard';

// ---------------------------------------------------------------------
// MOCK_STUDENTS
// ---------------------------------------------------------------------
// Lista simulada de hijos del tutor para los filtros. En la versión
// final, esto vendrá del backend (mismo endpoint /api/guardians/me/
// dashboard que ya consume GuardianDashboard). Lo dejamos hardcoded
// para que la pantalla sea renderizable y testeable de inmediato.
//
// Cada item tiene:
//   - id:            identificador único (string).
//   - name:          texto que se muestra en el pill.
//   - avatarLetter:  inicial que se muestra cuando no hay foto
//                    (o como fallback si la foto falla al cargar).
//   - avatarUrl:     URL absoluta de la foto del alumno. Si está
//                    presente, el StudentFilter la usa; si falla,
//                    cae al avatarLetter.
//
// "Todos" no tiene avatar: el StudentFilter detecta que no hay
// avatarUrl ni avatarLetter y omite el círculo (solo muestra
// el nombre).
// ---------------------------------------------------------------------
const MOCK_STUDENTS = [
  { id: 'all',    name: 'Todos' },
  { id: 'carlos', name: 'Carlos', avatarLetter: 'C', avatarUrl: 'https://i.pravatar.cc/100?img=12' },
  { id: 'ana',    name: 'Ana',    avatarLetter: 'A', avatarUrl: 'https://i.pravatar.cc/100?img=47' },
];

// ---------------------------------------------------------------------
// MOCK_ANNOUNCEMENTS
// ---------------------------------------------------------------------
// Lista de anuncios simulados. Shape:
//
//   {
//     id,
//     priority: 'urgent' | 'informative',
//     title,
//     description,
//     date,           // formato corto: "Oct 24"
//     author: {
//       name,
//       subtitle?,    // ej: "2ºB"
//       avatarUrl?,   // URL absoluta (opcional)
//       avatarLetter?,// ej: "G" para forzar una letra
//     },
//     studentIds: [], // ids de MOCK_STUDENTS a los que aplica.
//                      // Si está vacío o incluye 'all', aparece
//                      // siempre que el filtro sea "Todos" o el
//                      // alumno correspondiente.
//   }
//
// En la versión final, esto se obtendrá de un endpoint
// /api/guardians/me/announcements (o similar) con el mismo shape.
// ---------------------------------------------------------------------
const MOCK_ANNOUNCEMENTS = [
  {
    id: 'ann-001',
    priority: 'urgent',
    title: 'Suspensión de clases por consejo técnico',
    description:
      'Se informa a toda la comunidad educativa que el próximo viernes 24 de octubre no habrá clases debido a la sesión ordinaria del Consejo Técnico Escolar.',
    date: 'Oct 24',
    author: {
      name: 'General',
      avatarLetter: 'G',
    },
    studentIds: ['all'],
  },
  {
    id: 'ann-002',
    priority: 'informative',
    title: 'Reunión de Padres de Familia',
    description:
      'Estimados padres de familia del grupo 2ºB, los invitamos a la sesión informativa del próximo martes donde se presentarán los resultados del primer trimestre.',
    date: 'Oct 25',
    author: {
      name: 'Carlos',
      subtitle: '2ºB',
      avatarUrl: 'https://i.pravatar.cc/100?img=12',
    },
    studentIds: ['carlos'],
  },
  {
    id: 'ann-003',
    priority: 'informative',
    title: 'Entrega de boletas del primer trimestre',
    description:
      'Las boletas de calificaciones del primer trimestre se entregarán del 28 al 30 de octubre. Revisa la sección de reportes para descargarlas.',
    date: 'Oct 22',
    author: {
      name: 'Ana',
      subtitle: '1ºA',
      avatarUrl: 'https://i.pravatar.cc/100?img=47',
    },
    studentIds: ['ana'],
  },
];

export default function AvisosScreen() {
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
  // id del filtro activo. Inicia en 'all' para que la primera vista
  // muestre todos los anuncios.
  const [activeFilterId, setActiveFilterId] = useState('all');

  // -----------------------------------------------------------------
  // DERIVADOS
  // -----------------------------------------------------------------
  // Anuncios filtrados. useMemo evita recalcular el filtro en cada
  // render si ni activeFilterId ni MOCK_ANNOUNCEMENTS cambiaron.
  // Cuando se filtre por un hijo específico, los anuncios "General"
  // (studentIds: ['all']) NO se incluyen — solo los específicos
  // de ese hijo. Esto replica el comportamiento esperado de un feed
  // personal: el tutor solo ve lo relevante para el hijo seleccionado.
  const visibleAnnouncements = useMemo(() => {
    if (activeFilterId === 'all') return MOCK_ANNOUNCEMENTS;
    return MOCK_ANNOUNCEMENTS.filter((ann) =>
      // Incluye el anuncio si su studentIds contiene el id del
      // filtro activo, O si está marcado como 'all' (genérico).
      ann.studentIds?.includes(activeFilterId)
      || ann.studentIds?.includes('all'),
    );
  }, [activeFilterId]);

  return (
    // Contenedor raíz. bg-slate-50 para que las cards blancas
    // destaquen (mismo fondo que el resto de la app).
    <View className="flex-1 bg-slate-50">
      {/* Header compartido: brand + campana. */}
      <DashboardHeader />

      {/* ============================================================
          SCROLLVIEW PRINCIPAL
          ============================================================
          flex-1 para que ocupe el espacio entre el header y la
          tab bar. pb-8 deja aire al final para que la última card
          no quede pegada a la tab bar.
          ============================================================ */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
      >
        {/* School info card compartida. className="mx-4 mt-4" aplica
            el gutter lateral y el margen superior. */}
        <SchoolInfoCard
          school={data?.school}
          isLoading={isLoading}
          className="mx-4 mt-4"
        />

        {/* ============================================================
            FILTRO POR ESTUDIANTE (compartido con conducta.jsx)
            ============================================================
            Label "FILTRAR POR ESTUDIANTE" + componente
            <StudentFilter> que renderiza pills con avatar (foto
            o inicial) + nombre. El componente maneja el estado
            de error de la imagen internamente.
            ============================================================ */}
        <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-6 mb-3 px-5">
          Filtrar por estudiante
        </Text>

        <StudentFilter
          students={MOCK_STUDENTS}
          activeId={activeFilterId}
          onChange={setActiveFilterId}
          accessibilityLabel="Filtro de anuncios por estudiante"
        />

        {/* ============================================================
            LISTA DE ANUNCIOS
            ============================================================
            Render de visibleAnnouncements. Cada item se mapea a
            <AnnouncementCard> con su onPress (en esta fase no
            navega a nada — el endpoint de detalle aún no existe;
            cuando exista, será router.push('/avisos/<id>')).
            ============================================================ */}
        <View className="px-4 mt-2">
          {visibleAnnouncements.length > 0 ? (
            visibleAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onPress={() => {
                  // TODO: cuando exista el endpoint de detalle,
                  // navegar a /avisos/<id> aquí. Por ahora noop
                  // para que la UI sea testeable sin backend.
                }}
              />
            ))
          ) : (
            // Empty state: si el filtro activo no tiene anuncios
            // (caso raro, pero contemplado por si en el futuro
            // llegan filtros más específicos).
            <View className="bg-white rounded-2xl p-8 mt-4 items-center">
              <Text className="text-sm text-slate-500 text-center">
                No hay avisos para este estudiante.
              </Text>
              <Text className="text-xs text-slate-400 mt-1 text-center">
                Prueba cambiando el filtro.
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
