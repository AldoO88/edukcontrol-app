// =====================================================================
// app/(teacher)/citations/index.jsx
// ---------------------------------------------------------------------
// Ruta "/citations" del route group (teacher). Pantalla "Citas" —
// gestión de citatorios / citas con padres de familia
// desde la óptica del docente.
//
// Estructura visual:
//
//   ┌────────────────────────────────────────┐
//   │ DashboardHeader (brand + 🔔)          │
//   ├────────────────────────────────────────┤
//   │ SchoolInfoCard compuesta                │
//   ├────────────────────────────────────────┤
//   │ < Volver  •  Título  •  [+ Crear]    │
//   ├────────────────────────────────────────┤
//   │ Stats row: 3 cards (Pend/Conf/Atend) │
//   ├────────────────────────────────────────┤
//   │ Search bar                             │
//   ├────────────────────────────────────────┤
//   │ Tabs: [Próximos / Activos] [Historial]│
//   ├────────────────────────────────────────┤
//   │ Lista de citatorio cards (FlatList)   │
//   └────────────────────────────────────────┘
//
// Estado: conectado al backend vía useTeacherCitations hook.
// =====================================================================

// React + hooks.
import React, { useState, useMemo } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Navegación.
import { useRouter } from 'expo-router';

// Iconos Lucide.
import {
  ChevronLeft,    // Back.
  Plus,            // Crear citatorio (botón primario).
  Search,          // Search input.
  Calendar,        // Fecha.
  Users,           // Grupo / location (school).
  Clock,           // Hora.
  CheckCircle2,    // Confirmado por tutor / atendido.
  AlertCircle,     // Pendiente de confirmación / no_show.
  MapPin,
  ChevronRight,    // Indicador de navegación en cards.
} from 'lucide-react-native';

// Hook del dashboard docente (escuela + maestro).
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Modal reutilizable para crear citaciones.
import GenerateCitationModal from '@/app/(teacher)/_components/GenerateCitationModal';

// Hook conectado al backend + helpers.
import { useTeacherCitations } from '@/src/hooks/useTeacherCitations';
import {
  STATUS_STYLES,
  TYPE_STYLES,
  formatDate,
  formatTime12,
  isProximo,
} from '@/src/utils/citationHelpers';
// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function CitationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ============================================================
  // DASHBOARD DATA (mismo endpoint que el resto del (teacher))
  // ============================================================
  const { data } = useTeacherDashboard();
  const currentDate = data?.currentDate || 'Viernes, 14 de agosto';
  const school = useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.currentSchoolYear?.name || null,
    };
  }, [data?.school, data?.currentSchoolYear]);

  // ============================================================
  // CITATIONS HOOK (conectado al backend)
  // ============================================================
  const {
    items,
    isLoading,
    isLoadingMore,
    error,
    pagination,
    setFilters,
    loadMore,
    refetch,
  } = useTeacherCitations();

  // ============================================================
  // ESTADOS LOCALES
  // ============================================================
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('proximos'); // 'proximos' | 'historial' | 'cancelados'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // ============================================================
  // STATS (resumen del expediente de citaciones)
  // ============================================================
  // Derivados de los items cargados (aproximación que mejora al
  // hacer scroll con loadMore).
  // ============================================================
  const stats = useMemo(() => {
    const acc = { pendientes: 0, confirmados: 0, atendidos: 0 };
    for (const c of items) {
      if (c.status === 'pending' || c.status === 'no_show') {
        acc.pendientes += 1;
      } else if (c.status === 'confirmed') {
        acc.confirmados += 1;
      } else if (c.status === 'completed') {
        acc.atendidos += 1;
      }
    }
    return acc;
  }, [items]);

  // ============================================================
  // FILTRADO
  // ============================================================
  // 1) Tab: 'proximos' vs 'historial' vs 'cancelados'.
  // 2) Search: matchea contra studentName y groupName.
  // ============================================================
  const filteredCitations = useMemo(() => {
    const term = String(searchTerm || '').trim().toLowerCase();
    return items.filter((c) => {
      // Tab filter.
      let matchesTab;
      if (activeTab === 'proximos') {
        matchesTab = isProximo(c.status);
      } else if (activeTab === 'cancelados') {
        matchesTab = c.status === 'cancelled';
      } else {
        matchesTab = c.status === 'completed';
      }
      // Search filter.
      const matchesSearch =
        !term ||
        String(c.studentName || '').toLowerCase().includes(term) ||
        String(c.groupName || '').toLowerCase().includes(term) ||
        String(c.subject || '').toLowerCase().includes(term);
      return matchesTab && matchesSearch;
    });
  }, [items, searchTerm, activeTab]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // ============================================================
  // RENDER: citatorio card (key extractor para FlatList)
  // ============================================================
  const renderCitation = ({ item: citatorio }) => (
    <Pressable
      onPress={() => router.push(`/(teacher)/citations/${citatorio.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalle de citatorio para ${citatorio.studentName}`}
    >
      <CitatorioCard citatorio={citatorio} />
    </Pressable>
  );

  // ============================================================
  // RENDER: empty state
  // ============================================================
  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View
        className="bg-white rounded-2xl p-8 mx-4 mt-3 items-center border border-slate-100"
        style={{
          shadowColor: '#0F172A',
          shadowOpacity: 0.04,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}
      >
        <Text
          className="text-slate-500"
          style={{ fontSize: 13, fontWeight: '600' }}
        >
          {activeTab === 'proximos'
            ? 'No hay citaciones próximas'
            : activeTab === 'cancelados'
              ? 'No hay citaciones canceladas'
              : 'No hay citaciones en el historial'}
        </Text>
        <Text
          className="text-slate-400 mt-1 text-center"
          style={{ fontSize: 11 }}
        >
          {searchTerm
            ? 'Intenta ajustar la búsqueda.'
            : 'Cuando haya citatorios los verás aquí.'}
        </Text>
      </View>
    );
  };

  // ============================================================
  // RENDER: footer de carga (spinner al final de FlatList)
  // ============================================================
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#0284C7" />
      </View>
    );
  };

  // ============================================================
  // HEADER de la FlatList: chrome + stats + search + tabs
  // ============================================================
  const listHeader = (
    <>
      {/* CHROME COMPARTIDO */}
      <DashboardHeader />
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-2"
        teacher={data?.teacher}
        date={currentDate}
      />

      {/* HEADER: back "Volver" + título + botón "+ Crear Citatorio" */}
      <View className="px-4 mt-4">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="flex-row items-center self-start"
          accessibilityRole="button"
          accessibilityLabel="Volver al dashboard"
        >
          <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
          <Text className="text-sm font-semibold text-sky-600 ml-1">
            Volver
          </Text>
        </Pressable>

        <Text className="text-[22px] font-bold text-[#0F172A] mt-4">
          Citatorios y Citas
        </Text>
        <Pressable
          onPress={() => setIsCreateModalOpen(true)}
          className="self-start mt-3 flex-row items-center bg-[#0284C7] rounded-full px-4 py-2.5"
          accessibilityRole="button"
          accessibilityLabel="Crear nuevo citatorio"
        >
          <Plus size={16} color="#ffffff" strokeWidth={2.75} />
          <Text className="text-white font-bold text-[14px] ml-1.5">
            Crear Citatorio
          </Text>
        </Pressable>
      </View>

      {/* STATS ROW */}
      <View className="flex-row mx-4 mt-3" style={{ gap: 8 }}>
        <StatCard
          label="Pendientes"
          value={stats.pendientes}
          valueColor="#D97706"
          bgColor="#FEF3C7"
        />
        <StatCard
          label="Confirmados"
          value={stats.confirmados}
          valueColor="#16A34A"
          bgColor="#DCFCE7"
        />
        <StatCard
          label="Atendidos"
          value={stats.atendidos}
          valueColor="#0284C7"
          bgColor="#DBEAFE"
        />
      </View>

      {/* SEARCH BAR */}
      <View
        className="flex-row items-center rounded-xl px-3 mx-4 mt-3"
        style={{
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          height: 44,
        }}
      >
        <Search size={18} color="#94A3B8" strokeWidth={2} />
        <TextInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Buscar por alumno o grupo..."
          placeholderTextColor="#94A3B8"
          className="flex-1 ml-2 text-slate-900"
          style={{ fontSize: 13 }}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Buscar citatorio por alumno o grupo"
        />
      </View>

      {/* TABS */}
      <View
        className="mx-4 mt-3 flex-row rounded-xl p-1"
        style={{ backgroundColor: '#F1F5F9' }}
      >
        <TabPill
          active={activeTab === 'proximos'}
          label="Próximos"
          onPress={() => handleTabChange('proximos')}
        />
        <TabPill
          active={activeTab === 'historial'}
          label="Historial"
          onPress={() => handleTabChange('historial')}
        />
        <TabPill
          active={activeTab === 'cancelados'}
          label="Cancelados"
          onPress={() => handleTabChange('cancelados')}
        />
      </View>

      {/* LOADING STATE (solo carga inicial) */}
      {isLoading && (
        <View className="py-8 items-center">
          <ActivityIndicator size="large" color="#0284C7" />
          <Text className="text-slate-400 mt-2" style={{ fontSize: 12 }}>
            Cargando citatorios...
          </Text>
        </View>
      )}

      {/* ERROR STATE */}
      {error && !isLoading && (
        <View className="bg-white rounded-2xl p-6 mx-4 mt-3 items-center border border-rose-100">
          <AlertCircle size={24} color="#DC2626" strokeWidth={2} />
          <Text className="text-rose-600 mt-2 text-center" style={{ fontSize: 13, fontWeight: '600' }}>
            {error}
          </Text>
          <Pressable
            onPress={refetch}
            className="mt-3 px-4 py-2 rounded-xl"
            style={{ backgroundColor: '#0284C7' }}
          >
            <Text className="text-white font-bold" style={{ fontSize: 12 }}>
              Reintentar
            </Text>
          </Pressable>
        </View>
      )}
    </>
  );

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <FlatList
        data={filteredCitations}
        keyExtractor={(item) => item.id}
        renderItem={renderCitation}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
      />

      {/* MODAL: Crear Citatorio */}
      <GenerateCitationModal
        isVisible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={refetch}
        student={null}
        groupName=""
      />
    </View>
  );
}

// ---------------------------------------------------------------------
// SUBCOMPONENTES LOCALES (no se exportan)
// ---------------------------------------------------------------------

// StatCard: tarjeta pequeña de métrica (label + value grande).
const StatCard = ({ label, value, valueColor, bgColor }) => (
  <View
    className="flex-1 rounded-2xl p-3"
    style={{
      backgroundColor: bgColor,
    }}
  >
    <Text
      style={{
        fontSize: 10,
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
      }}
    >
      {label}
    </Text>
    <Text
      className="mt-1"
      style={{ fontSize: 22, fontWeight: '800', color: valueColor }}
    >
      {value}
    </Text>
  </View>
);

// TabPill: botón de tab dentro del segmented control.
const TabPill = ({ active, label, onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="tab"
    accessibilityState={{ selected: active }}
    className="flex-1 items-center justify-center rounded-lg py-2"
    style={{
      backgroundColor: active ? '#FFFFFF' : 'transparent',
      shadowColor: active ? '#0F172A' : 'transparent',
      shadowOpacity: active ? 0.06 : 0,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: active ? 2 : 0,
    }}
  >
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: active ? '#0284C7' : '#64748B',
      }}
    >
      {label}
    </Text>
  </Pressable>
);

// ---------------------------------------------------------------------
// CitatorioCard: card individual de cada citatorio.
// Layout amigable (top → bottom):
//   1. TYPE badge (categoría del schema).
//   2. Nombre del alumno.
//   3. Group badge (1° A • Materia).
//   4. Date & Time row.
//   5. Location row.
//   6. STATUS badge (workflow del schema).
//   7. ChevronRight (indicador de navegación).
//
// El texto del `reason` NO se renderiza acá — vive en la pantalla
// de detalle para mantener la card escaneable.
// La card completa es tappable (el Pressable envolvente en
// renderCitation se encarga de la navegación).
// ---------------------------------------------------------------------
const CitatorioCard = ({ citatorio }) => {
  const typeStyle = TYPE_STYLES[citatorio.type] || {
    bg: '#F1F5F9',
    fg: '#475569',
    label: citatorio.type || '—',
  };
  const statusStyle =
    STATUS_STYLES[citatorio.status] || STATUS_STYLES.pending;
  const StatusIcon = statusStyle.Icon;

  return (
    <View
      className="bg-white rounded-2xl p-4 mx-4 mt-3 border border-slate-100"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: typeStyle.border,
        shadowColor: '#0F172A',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}
    >
      {/* 1. TYPE BADGE */}
      <View className="flex-row items-center justify-between">
        <View
          className="self-start px-2.5 py-1 rounded-full"
          style={{ backgroundColor: typeStyle.bg }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '800',
              color: typeStyle.fg,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {typeStyle.label}
          </Text>
        </View>
        <ChevronRight size={16} color="#CBD5E1" strokeWidth={2.5} />
      </View>

      {/* 2. Nombre del alumno */}
      <Text
        className="mt-2 text-slate-900"
        style={{ fontSize: 16, fontWeight: '700' }}
        numberOfLines={1}
      >
        {citatorio.studentName}
      </Text>

      {/* 3. Group badge: 1° A • Materia */}
      <Text
        className="mt-0.5 text-slate-500"
        style={{ fontSize: 12, fontWeight: '500' }}
        numberOfLines={1}
      >
        {citatorio.subject
          ? `${citatorio.groupName}  •  ${citatorio.subject}`
          : citatorio.groupName || ''}
      </Text>

      {/* 4. Date & Time row */}
      <View className="flex-row items-center mt-2">
        <Calendar size={14} color="#64748B" strokeWidth={2} />
        <Text
          className="ml-1.5 text-slate-700"
          style={{ fontSize: 12, fontWeight: '600' }}
        >
          {`${formatDate(citatorio.date)}, ${formatTime12(citatorio.time)}`}
        </Text>
      </View>

      {/* 5. Location row */}
      {citatorio.location ? (
        <View className="flex-row items-center mt-1">
          <MapPin size={14} color="#64748B" strokeWidth={2} />
          <Text
            className="ml-1.5 text-slate-700"
            style={{ fontSize: 12, fontWeight: '500' }}
            numberOfLines={1}
          >
            {citatorio.location}
          </Text>
        </View>
      ) : null}

      {/* 6. STATUS */}
      <View className="flex-row items-center mt-3">
        <StatusIcon size={14} color={statusStyle.fg} strokeWidth={2.25} />
        <Text
          className="ml-1.5"
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: statusStyle.fg,
          }}
        >
          {statusStyle.label}
        </Text>
      </View>
    </View>
  );
};