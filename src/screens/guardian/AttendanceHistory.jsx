// =====================================================================
// AttendanceHistory.jsx
// ---------------------------------------------------------------------
// Historial de asistencia del rol "guardian". Muestra eventos
// (presente/retardo/falta) de los hijos, con filtros rápidos.
// Refactorizado para usar ScreenHeader, Chip y AttendanceRow.
// =====================================================================

// React.
import React, { useState, useMemo, useCallback } from 'react';

// Primitivas RN: View, Text, ScrollView, FlatList.
import { View, Text, ScrollView, FlatList } from 'react-native';

// Iconos: Filter.
import { Filter } from 'lucide-react-native';

// Componentes reutilizables.
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import Chip from '../../components/Chip';
import AttendanceRow from '../../components/AttendanceRow';
import EmptyState from '../../components/EmptyState';

// Constantes.
import { ATTENDANCE_STATUS, ATTENDANCE_LABELS } from '../../constants/statusUi';

// Opciones de filtro. Lo extraemos a una constante para que el
// componente se enfoque en la lógica, no en datos estáticos.
const FILTER_OPTIONS = [
  { key: 'all', label: 'Todos' },
  { key: ATTENDANCE_STATUS.PRESENT, label: ATTENDANCE_LABELS[ATTENDANCE_STATUS.PRESENT] },
  { key: ATTENDANCE_STATUS.LATE, label: 'Retardos' },
  { key: ATTENDANCE_STATUS.ABSENT, label: ATTENDANCE_LABELS[ATTENDANCE_STATUS.ABSENT] },
];

// Componente principal.
const AttendanceHistory = ({ route }) => {
  // Si llegamos aquí con un childId (desde GuardianDashboard),
  // podríamos filtrar por ese hijo. Por ahora solo lo capturamos.
  const childId = route?.params?.childId || null;

  // Filtro activo. 'all' | 'present' | 'late' | 'absent'.
  const [filter, setFilter] = useState('all');

  // filteredHistory: aplicamos el filtro. useMemo evita recalcular
  // cuando no cambian ni filter ni la data.
  const filteredHistory = useMemo(
    () => mockHistory.filter((entry) => filter === 'all' || entry.status === filter),
    [filter],
  );

  // renderItem: delega en AttendanceRow.
  const renderItem = useCallback(
    ({ item }) => <AttendanceRow entry={item} />,
    [],
  );

  return (
    <Screen scroll={false}>
      {/* Header con botón volver. */}
      <ScreenHeader title="Historial de Asistencia" />

      {/* Filtros rápidos. */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center mb-2">
          <Filter size={16} color="#64748b" />
          <Text className="text-slate-700 text-sm font-semibold ml-2">
            Filtrar por
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTER_OPTIONS.map((opt) => (
            <Chip
              key={opt.key}
              label={opt.label}
              selected={filter === opt.key}
              onPress={() => setFilter(opt.key)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Lista de eventos. */}
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        ListEmptyComponent={
          <EmptyState title="No hay registros para mostrar." />
        }
      />

      {/* childId se mantiene accesible para el futuro cuando se
          conecte al backend y se use para fetchear. */}
      {/* eslint-disable-next-line no-unused-vars */}
      {childId && null}
    </Screen>
  );
};

// Mock de historial. En producción, vendrá del backend.
const mockHistory = [
  { id: 1, date: '2026-07-09', child: 'Sofía Hernández', status: ATTENDANCE_STATUS.PRESENT, time: '08:02' },
  { id: 2, date: '2026-07-09', child: 'Mateo Hernández', status: ATTENDANCE_STATUS.LATE, time: '08:25' },
  { id: 3, date: '2026-07-08', child: 'Sofía Hernández', status: ATTENDANCE_STATUS.PRESENT, time: '07:58' },
  { id: 4, date: '2026-07-08', child: 'Mateo Hernández', status: ATTENDANCE_STATUS.ABSENT, time: null },
  { id: 5, date: '2026-07-07', child: 'Sofía Hernández', status: ATTENDANCE_STATUS.LATE, time: '08:15' },
];

export default AttendanceHistory;
