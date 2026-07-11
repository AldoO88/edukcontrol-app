// =====================================================================
// AnnouncementsScreen.jsx
// ---------------------------------------------------------------------
// Pantalla de avisos oficiales para el rol "guardian". Muestra
// una lista de comunicados ordenados (fijados primero) y permite
// expandir/colapsar cada uno. Refactorizado para componerse de
// sub-componentes y delegar la lógica al hook useToggle.
// =====================================================================

// React.
import React, { useCallback, useMemo } from 'react';

// Primitivas RN: FlatList.
import { FlatList } from 'react-native';

// Iconos.
import { Megaphone } from 'lucide-react-native';

// Componentes reutilizables.
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import AnnouncementCard from '../../components/AnnouncementCard';
import EmptyState from '../../components/EmptyState';

// Hooks.
import { useToggle } from '../../hooks/useToggle';

// Componente principal.
const AnnouncementsScreen = () => {
  // useToggle: trackea qué anuncio está expandido. Si el id
  // coincide, está expandido; si no, null.
  const [expandedId, setExpandedId] = useToggle(null);

  // sortedAnnouncements: ordenamos por pinned (fijados primero).
  // useMemo para no reordenar en cada render.
  const sortedAnnouncements = useMemo(
    () => [...mockAnnouncements].sort(sortByPinned),
    [],
  );

  // handleToggle: expande/colapsa. Usamos el setter directo de
  // useToggle (tercer elemento de la tupla) para pasar el id
  // concreto o null.
  const handleToggle = useCallback(
    (id) => {
      setExpandedId((prev) => (prev === id ? null : id));
    },
    [setExpandedId],
  );

  // renderItem: delega en AnnouncementCard. Renderiza un solo item.
  const renderItem = useCallback(
    ({ item }) => (
      <AnnouncementCard
        announcement={item}
        isExpanded={expandedId === item.id}
        onToggle={() => handleToggle(item.id)}
      />
    ),
    [expandedId, handleToggle],
  );

  return (
    <Screen scroll={false}>
      {/* Header con botón volver. */}
      <ScreenHeader title="Avisos" icon={Megaphone} />

      {/* Lista de anuncios. FlatList en lugar de ScrollView+map para
          escalar a listas grandes. */}
      <FlatList
        data={sortedAnnouncements}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 24 }}
        ListEmptyComponent={
          <EmptyState icon={Megaphone} title="No hay avisos publicados." />
        }
      />
    </Screen>
  );
};

// sortByPinned: comparador puro para ordenar por "pinned" primero.
// Lo definimos fuera del componente para no recrearlo en cada render.
const sortByPinned = (a, b) => {
  if (a.pinned && !b.pinned) return -1;
  if (!a.pinned && b.pinned) return 1;
  return 0;
};

// Mock de anuncios. En producción, vendrán del backend.
const mockAnnouncements = [
  {
    id: 1,
    title: 'Reunión de padres - 5° Primaria',
    body: 'Se convoca a los padres de familia de 5° grado a la reunión mensual que se llevará a cabo el próximo viernes 12 de julio a las 17:00 hrs en la sala de usos múltiples. Se tratarán temas académicos y de convivencia escolar.',
    date: '2026-07-09',
    pinned: true,
    category: 'Evento',
  },
  {
    id: 2,
    title: 'Suspensión de clases - 15 de julio',
    body: 'Se informa que el martes 15 de julio habrá suspensión de actividades académicas por motivos de mantenimiento en las instalaciones. Las clases se reanudan con normalidad el miércoles 16.',
    date: '2026-07-08',
    pinned: true,
    category: 'Aviso',
  },
  {
    id: 3,
    title: 'Festival de fin de cursos',
    body: 'Los invitamos al festival de fin de cursos donde los alumnos presentarán sus proyectos artísticos y académicos. Habrá venta de alimentos y rifas.',
    date: '2026-07-07',
    pinned: false,
    category: 'Evento',
  },
  {
    id: 4,
    title: 'Calendario escolar 2026-2027',
    body: 'Ya está disponible el calendario oficial del próximo ciclo escolar. Puedes consultarlo en la página del colegio o solicitar una copia impresa en dirección.',
    date: '2026-07-05',
    pinned: false,
    category: 'Académico',
  },
];

export default AnnouncementsScreen;
