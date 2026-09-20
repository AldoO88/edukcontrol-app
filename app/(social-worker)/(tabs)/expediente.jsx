// =====================================================================
// app/(social-worker)/(tabs)/expediente.jsx
// ---------------------------------------------------------------------
// Pantalla de "Expediente" del trabajador social. Muestra una lista
// de alumnos con un resumen de su estado de salud e inclusión. Al
// tocar un alumno, navega a su expediente completo (student-health).
// =====================================================================

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  FolderOpen,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  Heart,
  AlertTriangle,
  CheckCircle,
  Filter,
} from 'lucide-react-native';

import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import { useAuth } from '@/src/hooks/useAuth';
import { useSocialWorkerDashboard } from '@/src/hooks/useSocialWorkerDashboard';
import { getStudents, getGroups } from '@/src/services/socialWorkerService';

// ---------------------------------------------------------------------
// healthStatusBadge
// ---------------------------------------------------------------------
const healthStatusBadge = (student) => {
  const health = student.health_inclusion || {};
  const alerts = health.alerts || [];
  const conditions = health.medical_conditions || [];

  if (alerts.length > 0) {
    return {
      label: `${alerts.length} alerta${alerts.length > 1 ? 's' : ''}`,
      bg: '#FEE2E2',
      fg: '#DC2626',
      Icon: AlertTriangle,
    };
  }
  if (conditions.length > 0) {
    return {
      label: `${conditions.length} condición${conditions.length > 1 ? 'es' : ''}`,
      bg: '#FEF3C7',
      fg: '#D97706',
      Icon: Heart,
    };
  }
  return {
    label: 'Sin alertas',
    bg: '#D1FAE5',
    fg: '#047857',
    Icon: CheckCircle,
  };
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function ExpedienteScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: dashboardData } = useSocialWorkerDashboard();

  const school = React.useMemo(() => {
    if (!dashboardData?.school) return null;
    return {
      ...dashboardData.school,
      logo_url: dashboardData.school.logoUrl,
    };
  }, [dashboardData?.school]);

  const currentDate = dashboardData?.currentDate || '';

  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch groups for filter
  const fetchGroups = useCallback(async () => {
    try {
      const result = await getGroups();
      if (result.success) {
        const regularGroups = (result.data || []).filter((g) => g.type !== 'taller');
        setGroups(regularGroups.map((g) => ({ ...g, label: `${g.grade}°${g.section}` })));
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  }, []);

  // Fetch students
  const fetchStudents = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        const params = { page: pageNum, limit: 50 };
        if (searchText.trim()) params.search = searchText.trim();
        if (selectedGroup) params.group = selectedGroup;

        const result = await getStudents(params);
        if (result.success) {
          const items = result.data?.items || [];
          setStudents((prev) => (append ? [...prev, ...items] : items));
          setHasMore(items.length >= 50);
          setPage(pageNum);
          setError(null);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Error al cargar alumnos.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [searchText, selectedGroup],
  );

  // Initial fetch
  useEffect(() => {
    fetchGroups();
    fetchStudents(1, false);
  }, [fetchGroups, fetchStudents]);

  // Refetch on search/group change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(1, false);
    }, searchText ? 500 : 0);
    return () => clearTimeout(timer);
  }, [searchText, selectedGroup, fetchStudents]);

  // Refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchStudents(1, false);
  }, [fetchStudents]);

  // Load more
  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchStudents(page + 1, true);
    }
  }, [isLoading, hasMore, page, fetchStudents]);

  // Render student card
  const renderStudent = useCallback(
    ({ item }) => {
      const badge = healthStatusBadge(item);
      const BadgeIcon = badge.Icon;
      const groupName = item.current_group_id
        ? `${item.current_group_id.grade}°${item.current_group_id.section}`
        : '';

      return (
        <Pressable
          onPress={() => router.push(`/(social-worker)/student-health/${item._id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Ver expediente de ${item.first_name} ${item.last_name}`}
        >
          <View
            className="bg-white rounded-2xl p-4 mb-3 border border-slate-100"
            style={{
              elevation: 2,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
                <Text className="text-xs font-bold text-indigo-700">
                  {`${item.first_name?.[0] || ''}${item.last_name?.[0] || ''}`.toUpperCase()}
                </Text>
              </View>

              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900">
                  {item.last_name}, {item.first_name}
                </Text>
                {groupName ? (
                  <Text className="text-xs text-slate-500 mt-0.5">
                    {groupName} • {item.controlNumber || ''}
                  </Text>
                ) : (
                  <Text className="text-xs text-slate-500 mt-0.5">
                    {item.controlNumber || ''}
                  </Text>
                )}
              </View>

              <View
                className="flex-row items-center px-2 py-1 rounded-full"
                style={{ backgroundColor: badge.bg }}
              >
                <BadgeIcon size={10} color={badge.fg} strokeWidth={2.5} />
                <Text
                  className="ml-1"
                  style={{ fontSize: 9, fontWeight: '700', color: badge.fg }}
                >
                  {badge.label}
                </Text>
              </View>

              <ChevronRight size={16} color="#CBD5E1" strokeWidth={2} className="ml-2" />
            </View>
          </View>
        </Pressable>
      );
    },
    [router],
  );

  // Loading state
  if (isLoading && students.length === 0) {
    return (
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
        <SchoolInfoCard
          school={school}
          isLoading={!school}
          className="mx-4 mt-2"
          teacher={dashboardData?.socialWorker}
          date={currentDate}
          user={user}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-slate-400 text-sm mt-3">Cargando expedientes...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <DashboardHeader />
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-2"
        teacher={dashboardData?.socialWorker}
        date={currentDate}
        user={user}
      />

      {/* HEADER */}
      <View className="px-4 mt-4 mb-1 flex-row items-center">
        <FolderOpen size={20} color="#4F46E5" strokeWidth={2} />
        <View className="ml-2">
          <Text className="text-2xl font-bold text-slate-900">Expediente</Text>
          <Text className="text-sm text-slate-500 mt-0.5">
            Salud, inclusión y acuerdos de los alumnos
          </Text>
        </View>
      </View>

      {/* SEARCH + FILTER */}
      <View className="px-4 mt-3 mb-3 flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center bg-white rounded-xl border border-slate-200 px-3" style={{ height: 40 }}>
          <Search size={16} color="#94A3B8" strokeWidth={2} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar por nombre o no. control..."
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

        <Pressable
          onPress={() => setShowGroupDropdown(true)}
          className="flex-row items-center bg-white rounded-xl border border-slate-200 px-3"
          style={{ height: 40 }}
        >
          <Filter size={14} color="#64748B" strokeWidth={2} />
          <Text className="text-xs font-semibold text-slate-700 ml-1.5">
            {selectedGroup ? groups.find((g) => g._id === selectedGroup)?.label || 'Grupo' : 'Todos'}
          </Text>
          <ChevronDown size={14} color="#64748B" strokeWidth={2} style={{ marginLeft: 4 }} />
        </Pressable>
      </View>

      {/* STUDENT LIST */}
      <FlatList
        data={students}
        renderItem={renderStudent}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View className="bg-white rounded-2xl p-8 items-center mt-4">
            <FolderOpen size={32} color="#CBD5E1" strokeWidth={1.5} />
            <Text className="text-sm text-slate-500 mt-3 text-center">
              {searchText || selectedGroup
                ? 'No se encontraron alumnos con estos filtros.'
                : 'No hay alumnos registrados.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          isLoading && page > 1 ? (
            <View className="py-4">
              <ActivityIndicator size="small" color="#4F46E5" />
            </View>
          ) : null
        }
      />

      {/* GROUP DROPDOWN MODAL */}
      <Modal
        visible={showGroupDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGroupDropdown(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center items-center"
          onPress={() => setShowGroupDropdown(false)}
        >
          <Pressable
            className="bg-white rounded-2xl w-64 overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="px-4 py-3 border-b border-slate-100 flex-row items-center justify-between">
              <Text className="text-sm font-bold text-slate-900">Filtrar por grupo</Text>
              {selectedGroup && (
                <Pressable onPress={() => { setSelectedGroup(null); setShowGroupDropdown(false); }}>
                  <Text className="text-xs text-rose-500 font-semibold">Limpiar</Text>
                </Pressable>
              )}
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {/* Todos */}
              <Pressable
                onPress={() => {
                  setSelectedGroup(null);
                  setShowGroupDropdown(false);
                }}
                className="px-4 py-3 flex-row items-center justify-between"
                style={{ backgroundColor: !selectedGroup ? '#EEF2FF' : 'transparent' }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: !selectedGroup ? '700' : '500',
                    color: !selectedGroup ? '#4F46E5' : '#334155',
                  }}
                >
                  Todos
                </Text>
                {!selectedGroup && (
                  <View className="w-5 h-5 rounded-full bg-indigo-500 items-center justify-center">
                    <Text className="text-white text-[10px] font-bold">✓</Text>
                  </View>
                )}
              </Pressable>

              {groups.map((group) => {
                const isActive = selectedGroup === group._id;
                return (
                  <Pressable
                    key={group._id}
                    onPress={() => {
                      setSelectedGroup(group._id);
                      setShowGroupDropdown(false);
                    }}
                    className="px-4 py-3 flex-row items-center justify-between"
                    style={{ backgroundColor: isActive ? '#EEF2FF' : 'transparent' }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: isActive ? '700' : '500',
                        color: isActive ? '#4F46E5' : '#334155',
                      }}
                    >
                      {group.label}
                    </Text>
                    {isActive && (
                      <View className="w-5 h-5 rounded-full bg-indigo-500 items-center justify-center">
                        <Text className="text-white text-[10px] font-bold">✓</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
