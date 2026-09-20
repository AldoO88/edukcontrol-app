// =====================================================================
// app/(director)/(tabs)/reports.jsx
// ---------------------------------------------------------------------
// Ruta "/reports" del tab "Reportes" del trabajador social.
// CRUD de reportes de conducta.
// =====================================================================

import React, { useState, useCallback, useMemo } from 'react';

import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';

import { useRouter } from 'expo-router';

import {
  ChevronLeft,
  FileText,
  Plus,
  AlertTriangle,
  TrendingUp,
  XCircle,
  Search,
  X,
  ChevronDown,
  Filter,
} from 'lucide-react-native';

import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

import { useAuth } from '@/src/hooks/useAuth';
import { useDirectorDashboard } from '@/src/hooks/useDirectorDashboard';

import {
  getConductLogs,
  createConductLog,
  getConductConfig,
  getGroups,
  getGroupStudents,
} from '@/src/services/directorService';

import GenerateConductReportModal from '@/app/(director)/_components/GenerateConductReportModal';

// ---------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------
const EVENT_TYPES = [
  { value: 'demerit', label: 'Demérito', icon: XCircle, color: '#E11D48', bg: 'bg-rose-100' },
  { value: 'merit', label: 'Mérito', icon: TrendingUp, color: '#047857', bg: 'bg-emerald-100' },
];

const STATUS_CONFIG = {
  active: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Activo' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Cancelado' },
};

const SEVERITY_LABELS = {
  minor: 'Menor',
  moderate: 'Moderado',
  severe: 'Grave',
};

const SCOPE_TABS = [
  { id: 'mine', label: 'Mis Reportes' },
  { id: 'all', label: 'Todos los Reportes' },
];

const FILTER_OPTIONS = [
  { id: 'all', label: 'Todos', status: null, eventType: null },
  { id: 'active', label: 'Activos', status: 'active', eventType: null },
  { id: 'cancelled', label: 'Cancelados', status: 'cancelled', eventType: null },
  { id: 'demerit', label: 'Deméritos', status: null, eventType: 'demerit' },
  { id: 'merit', label: 'Méritos', status: null, eventType: 'merit' },
];

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function DirectorReportsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: dashboardData } = useDirectorDashboard();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const school = useMemo(() => {
    if (!dashboardData?.school) return null;
    return {
      ...dashboardData.school,
      logo_url: dashboardData.school.logoUrl,
      current_school_year: dashboardData.school.cycle || null,
    };
  }, [dashboardData?.school, dashboardData?.currentSchoolYear]);

  const currentDate = dashboardData?.currentDate || '';
  const schoolYearId = dashboardData?.school?.school_year_id
    || dashboardData?.school?.current_school_year_id?._id
    || null;

  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filter state.
  const [activeScope, setActiveScope] = useState('mine');
  const [activeFilter, setActiveFilter] = useState('active');
  const [searchText, setSearchText] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // ============================================================
  // FETCH
  // ============================================================
  const fetchLogs = useCallback(async (pageNum = 1, append = false) => {
    try {
      const result = await getConductLogs({ page: pageNum, limit: 20 });
      if (result.success) {
        const items = result.data?.items || [];
        setLogs(prev => append ? [...prev, ...items] : items);
        setHasMore(items.length >= 20);
        setPage(pageNum);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al cargar reportes.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLogs(1, false);
  }, [fetchLogs]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchLogs(1, false);
  }, [fetchLogs]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchLogs(page + 1, true);
    }
  }, [isLoading, hasMore, page, fetchLogs]);

  // ============================================================
  // ADAPTER FUNCTIONS (social worker → modal interface)
  // ============================================================
  const fetchDirectorGroups = useCallback(async () => {
    const result = await getGroups();
    if (result.success) {
      const regularGroups = (result.data || []).filter((g) => g.type !== 'taller');
      const groupsWithStudents = await Promise.all(
        regularGroups.map(async (g) => {
          const students = await fetchDirectorStudents(g._id);
          return { ...g, label: `${g.grade}°${g.section}`, students };
        }),
      );
      return { success: true, data: { groups: groupsWithStudents } };
    }
    return { success: false, data: { groups: [] } };
  }, []);

  const fetchDirectorStudents = useCallback(async (groupId) => {
    const result = await getGroupStudents(groupId);
    if (result.success) {
      return (result.data?.items || []).map((s) => ({
        _id: s._id,
        first_name: s.first_name || '',
        last_name: s.last_name || '',
        fullName: `${s.last_name || ''} ${s.first_name || ''}`.trim(),
        photoUrl: s.photoUrl,
      }));
    }
    return [];
  }, []);

  const createDirectorConductLog = useCallback(async (payload) => {
    return createConductLog({ ...payload, school_year_id: schoolYearId });
  }, [schoolYearId]);

  // ============================================================
  // FILTERS
  // ============================================================
  const filteredLogs = useMemo(() => {
    let result = logs;

    // Filter by scope (mine vs all).
    if (activeScope === 'mine') {
      result = result.filter((l) => l.reported_by?._id === user?.id);
    }

    // Filter by unified filter option.
    const filterOption = FILTER_OPTIONS.find((o) => o.id === activeFilter);
    if (filterOption) {
      if (filterOption.status) {
        result = result.filter((l) => l.status === filterOption.status);
      }
      if (filterOption.eventType) {
        result = result.filter((l) => l.eventType === filterOption.eventType);
      }
    }

    // Filter by search text.
    const term = searchText.toLowerCase().trim();
    if (term) {
      result = result.filter((l) => {
        const studentName = l.studentName || l.student_id?.name || '';
        const groupName = l.student_id?.current_group_id
          ? `${l.student_id.current_group_id.grade}°${l.student_id.current_group_id.section}`
          : '';
        const reporterName = l.reported_by
          ? `${l.reported_by.last_name || ''} ${l.reported_by.name || ''}`.trim()
          : '';
        const description = l.description || '';
        return (
          studentName.toLowerCase().includes(term) ||
          groupName.toLowerCase().includes(term) ||
          reporterName.toLowerCase().includes(term) ||
          description.toLowerCase().includes(term)
        );
      });
    }

    return result;
  }, [logs, activeScope, user, activeFilter, searchText]);

  // ============================================================
  // RENDER ITEM
  // ============================================================
  const renderLog = useCallback(({ item }) => {
    const event = EVENT_TYPES.find(e => e.value === item.eventType) || EVENT_TYPES[0];
    const EventIcon = event.icon;
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;
    const isDemerit = item.eventType === 'demerit';
    const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-MX', {
      day: 'numeric', month: 'short', year: 'numeric',
    }) : '';

    // Resolver nombre del alumno desde student_id (poblado) o studentName
    let resolvedName = 'Alumno';
    if (item.studentName) {
      resolvedName = item.studentName;
    } else if (item.student_id) {
      const s = item.student_id;
      if (s.first_name || s.last_name) {
        resolvedName = `${s.last_name || ''} ${s.first_name || ''}`.trim();
      } else if (s.name) {
        resolvedName = s.name;
      }
    }

    // Resolver grupo del alumno desde current_group_id poblado
    let resolvedGroup = '';
    if (item.student_id?.current_group_id) {
      const g = item.student_id.current_group_id;
      resolvedGroup = `${g.grade}°${g.section}`;
    }

    // Resolver nombre completo del creador del reporte
    const reporterName = item.reported_by
      ? `${item.reported_by.last_name || ''} ${item.reported_by.name || ''}`.trim()
      : '';

    const severityLabel = SEVERITY_LABELS[item.severity] || item.severity;

    return (
      <Pressable
        onPress={() => router.push(`/(director)/reports/${item._id}`)}
        accessibilityRole="button"
        accessibilityLabel={`Ver reporte de ${resolvedName}`}
      >
        <View
          className="bg-white rounded-2xl p-4 mb-3 border border-slate-100"
          style={{
            elevation: 3,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            borderRightWidth: 4,
            borderRightColor: isDemerit ? '#E11D48' : '#047857',
          }}
        >
        <View className="flex-row items-start">
          <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${event.bg}`}>
            <EventIcon size={18} color={event.color} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-slate-900 flex-1 mr-2" numberOfLines={1}>
                {resolvedName}{resolvedGroup ? ` — ${resolvedGroup}` : ''}
              </Text>
              <View className={`px-2 py-0.5 rounded-full ${status.bg}`}>
                <Text className={`text-[10px] font-bold ${status.text}`}>{status.label}</Text>
              </View>
            </View>
            <Text className="text-xs text-slate-500 mt-1" numberOfLines={2}>
              {item.description}
            </Text>
            <View className="flex-row items-center mt-2 gap-2">
              <View className="px-2 py-0.5 rounded-full bg-slate-100">
                <Text className="text-[10px] font-semibold text-slate-600">{event.label}</Text>
              </View>
              {item.severity && (
                <View className="px-2 py-0.5 rounded-full bg-slate-100">
                  <Text className="text-[10px] font-semibold text-slate-600">{severityLabel}</Text>
                </View>
              )}
              {item.points_impact != null && (
                <View className={`px-2 py-0.5 rounded-full ${item.eventType === 'demerit' ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                  <Text className={`text-[10px] font-bold ${item.eventType === 'demerit' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {item.eventType === 'merit' ? '+' : '-'}{item.points_impact} pts
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-[10px] text-slate-400 mt-1.5">
              {date}{reporterName ? ` — ${reporterName}` : ''}
            </Text>
          </View>
        </View>
      </View>
      </Pressable>
    );
  }, [router]);

  // ============================================================
  // LOADING
  // ============================================================
  if (isLoading && logs.length === 0) {
    return (
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
        <SchoolInfoCard
          school={school}
          isLoading={!school}
          className="mx-4 mt-2"
          teacher={dashboardData?.director}
          date={currentDate}
          user={user}
        />
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver al dashboard"
          className="flex-row items-center px-4 mt-4"
        >
          <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
          <Text className="text-sm font-semibold text-sky-600 ml-1">
            Volver
          </Text>
        </Pressable>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E11D48" />
          <Text className="text-slate-400 text-sm mt-3">Cargando reportes...</Text>
        </View>
      </View>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================
  if (error && logs.length === 0) {
    return (
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
        <SchoolInfoCard
          school={school}
          isLoading={!school}
          className="mx-4 mt-2"
          teacher={dashboardData?.director}
          date={currentDate}
          user={user}
        />
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver al dashboard"
          className="flex-row items-center px-4 mt-4"
        >
          <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
          <Text className="text-sm font-semibold text-sky-600 ml-1">
            Volver
          </Text>
        </Pressable>
        <View className="flex-1 items-center justify-center px-6">
          <AlertTriangle size={40} color="#e11d48" strokeWidth={1.5} />
          <Text className="text-slate-900 text-lg font-bold mt-4">Error al cargar</Text>
          <Text className="text-slate-500 text-sm mt-2 text-center">{error}</Text>
          <Pressable onPress={handleRefresh} className="mt-4 px-6 py-2.5 rounded-xl" style={{ backgroundColor: '#E11D48' }}>
            <Text className="text-white font-semibold">Reintentar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
        <SchoolInfoCard
          school={school}
          isLoading={!school}
          className="mx-4 mt-2"
          teacher={dashboardData?.director}
          date={currentDate}
          user={user}
        />

        {/* Botón "Volver" */}
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver al dashboard"
          className="flex-row items-center px-4 mt-4"
        >
          <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
          <Text className="text-sm font-semibold text-sky-600 ml-1">
            Volver
          </Text>
        </Pressable>

        {/* HEADER */}
        <View className="px-4 mt-4 mb-1">
          <Text className="text-2xl font-bold text-slate-900">Reportes</Text>
          <Text className="text-sm text-slate-500 mt-1">
            {activeScope === 'mine' ? 'Tus reportes de conducta' : 'Reportes de conducta de la escuela'}
          </Text>
        </View>

        {/* SCOPE TABS (underline style — same as CitationsListScreen) */}
        <View className="mt-3 border-b border-slate-200 flex-row px-4">
          {SCOPE_TABS.map((scope) => {
            const isActive = activeScope === scope.id;
            return (
              <Pressable
                key={scope.id}
                onPress={() => {
                  setActiveScope(scope.id);
                  setActiveFilter('active');
                  setSearchText('');
                }}
                className="mr-6 items-center"
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={scope.label}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? '#E11D48' : '#64748B',
                    paddingBottom: 8,
                  }}
                >
                  {scope.label}
                </Text>
                <View
                  style={{
                    height: 3,
                    borderTopLeftRadius: 2,
                    borderTopRightRadius: 2,
                    width: '100%',
                    backgroundColor: isActive ? '#E11D48' : 'transparent',
                  }}
                />
              </Pressable>
            );
          })}
        </View>

        {/* SEARCH + FILTER ROW */}
        <View className="px-4 mt-3 mb-3 flex-row items-center gap-2">
          {/* Search bar */}
          <View className="flex-1 flex-row items-center bg-white rounded-xl border border-slate-200 px-3" style={{ height: 40 }}>
            <Search size={16} color="#94A3B8" strokeWidth={2} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Buscar..."
              placeholderTextColor="#94A3B8"
              className="flex-1 ml-2 text-sm text-slate-900"
              style={{ paddingVertical: 0 }}
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText('')} hitSlop={8}>
                <X size={16} color="#94A3B8" strokeWidth={2} />
              </Pressable>
            )}
          </View>

          {/* Filter dropdown trigger */}
          <Pressable
            onPress={() => setShowFilterDropdown(true)}
            className="flex-row items-center bg-white rounded-xl border border-slate-200 px-3"
            style={{ height: 40 }}
            accessibilityRole="button"
            accessibilityLabel={`Filtro: ${FILTER_OPTIONS.find((o) => o.id === activeFilter)?.label || 'Todos'}`}
          >
            <Filter size={14} color="#64748B" strokeWidth={2} />
            <Text className="text-xs font-semibold text-slate-700 ml-1.5">
              {FILTER_OPTIONS.find((o) => o.id === activeFilter)?.label || 'Todos'}
            </Text>
            <ChevronDown size={14} color="#64748B" strokeWidth={2} style={{ marginLeft: 4 }} />
          </Pressable>
        </View>

        {/* LIST */}
        <FlatList
          data={filteredLogs}
          renderItem={renderLog}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#E11D48']} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View className="items-center py-12">
              <FileText size={40} color="#CBD5E1" strokeWidth={1.5} />
              <Text className="text-slate-400 text-sm mt-3">
                {logs.length === 0 ? 'No hay reportes' : 'No hay reportes con estos filtros'}
              </Text>
            </View>
          }
          ListFooterComponent={
            isLoading && logs.length > 0 ? (
              <ActivityIndicator size="small" color="#E11D48" className="my-4" />
            ) : null
          }
        />

        {/* FAB */}
        <Pressable
          onPress={() => setIsCreateModalOpen(true)}
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center"
          style={{
            backgroundColor: '#E11D48',
            shadowColor: '#E11D48',
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
          accessibilityRole="button"
          accessibilityLabel="Crear nuevo reporte"
        >
          <Plus size={24} color="#ffffff" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* MODAL */}
      <GenerateConductReportModal
        isVisible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => fetchLogs(1, false)}
        fetchGroupsFn={fetchDirectorGroups}
        createConductLogFn={createDirectorConductLog}
        fetchStudentsForGroup={fetchDirectorStudents}
        fetchConfigFn={getConductConfig}
      />

      {/* FILTER DROPDOWN MODAL */}
      <Modal
        visible={showFilterDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterDropdown(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center items-center"
          onPress={() => setShowFilterDropdown(false)}
        >
          <Pressable
            className="bg-white rounded-2xl w-64 overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="px-4 py-3 border-b border-slate-100">
              <Text className="text-sm font-bold text-slate-900">Filtrar por</Text>
            </View>
            {FILTER_OPTIONS.map((option) => {
              const isActive = activeFilter === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    setActiveFilter(option.id);
                    setShowFilterDropdown(false);
                  }}
                  className="px-4 py-3 flex-row items-center justify-between"
                  style={{ backgroundColor: isActive ? '#FFF1F2' : 'transparent' }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isActive ? '600' : '400',
                      color: isActive ? '#E11D48' : '#334155',
                    }}
                  >
                    {option.label}
                  </Text>
                  {isActive && (
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E11D48' }} />
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
