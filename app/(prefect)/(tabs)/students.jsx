// =====================================================================
// app/(prefect)/(tabs)/students.jsx
// ---------------------------------------------------------------------
// Pantalla de Búsqueda de Alumnos del prefecto. Muestra una lista
// global de alumnos con búsqueda y filtro por grupo. Al tocar un
// alumno, navega a su ficha completa.
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
import { GraduationCap, Search, X, ChevronRight, Filter, ChevronDown } from 'lucide-react-native';

import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import { useAuth } from '@/src/hooks/useAuth';
import { usePrefectDashboard } from '@/src/hooks/usePrefectDashboard';
import { getStudents, getGroups } from '@/src/services/prefectService';

export default function PrefectStudentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: dashboardData } = usePrefectDashboard();

  const school = React.useMemo(() => {
    if (!dashboardData?.school) return null;
    return {
      ...dashboardData.school,
      logo_url: dashboardData.school.logoUrl,
      current_school_year: dashboardData.school.cycle || null,
    };
  }, [dashboardData?.school, dashboardData?.currentSchoolYear]);

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

  // Refetch on search/group change (debounced for search)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(1, false);
    }, searchText ? 500 : 0);
    return () => clearTimeout(timer);
  }, [searchText, selectedGroup, fetchStudents]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchStudents(1, false);
  }, [fetchStudents]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchStudents(page + 1, true);
    }
  }, [isLoading, hasMore, page, fetchStudents]);

  const renderStudent = useCallback(
    ({ item }) => (
      <Pressable
        onPress={() => router.push(`/(prefect)/students/${item._id}`)}
        accessibilityRole="button"
        accessibilityLabel={`Ver ficha de ${item.last_name} ${item.first_name}`}
      >
        <View
          className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 flex-row items-center"
          style={{
            elevation: 2,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
            <Text className="text-xs font-bold text-blue-700">
              {`${item.first_name?.[0] || ''}${item.last_name?.[0] || ''}`.toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-slate-900">
              {item.last_name}, {item.first_name}
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              {item.current_group_id?.grade || ''}°{item.current_group_id?.section || ''} • {item.controlNumber || ''}
            </Text>
          </View>
          <ChevronRight size={16} color="#CBD5E1" strokeWidth={2} />
        </View>
      </Pressable>
    ),
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
          teacher={dashboardData?.prefect}
          date={currentDate}
          user={user}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-slate-400 text-sm mt-3">Cargando alumnos...</Text>
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
        teacher={dashboardData?.prefect}
        date={currentDate}
        user={user}
      />

      {/* HEADER */}
      <View className="px-4 mt-4 mb-1">
        <Text className="text-2xl font-bold text-slate-900">Alumnos</Text>
        <Text className="text-sm text-slate-500 mt-1">
          Busca y consulta la información de cualquier alumno
        </Text>
      </View>

      {/* SEARCH + FILTER */}
      <View className="px-4 mt-3 mb-3 flex-row items-center gap-2">
        {/* Search bar */}
        <View className="flex-1 flex-row items-center bg-white rounded-xl border border-slate-200 px-3" style={{ height: 40 }}>
          <Search size={16} color="#94A3B8" strokeWidth={2} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar por nombre, CURP..."
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

        {/* Group filter */}
        <Pressable
          onPress={() => setShowGroupDropdown(true)}
          className="flex-row items-center bg-white rounded-xl border border-slate-200 px-3"
          style={{ height: 40 }}
        >
          <Filter size={14} color="#64748B" strokeWidth={2} />
          <Text className="text-xs font-semibold text-slate-700 ml-1.5">
            {selectedGroup ? groups.find((g) => g._id === selectedGroup)?.label || 'Grupo' : 'Grupo'}
          </Text>
          <ChevronDown size={14} color="#64748B" strokeWidth={2} style={{ marginLeft: 4 }} />
        </Pressable>
      </View>

      {/* LIST */}
      <FlatList
        data={students}
        renderItem={renderStudent}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#4F46E5']} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View className="items-center py-12">
            <GraduationCap size={40} color="#CBD5E1" strokeWidth={1.5} />
            <Text className="text-slate-400 text-sm mt-3">
              {students.length === 0 ? 'No hay alumnos' : 'No hay alumnos con estos filtros'}
            </Text>
          </View>
        }
        ListFooterComponent={
          isLoading && students.length > 0 ? (
            <ActivityIndicator size="small" color="#4F46E5" className="my-4" />
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
                        fontWeight: isActive ? '600' : '400',
                        color: isActive ? '#4F46E5' : '#334155',
                      }}
                    >
                      {group.label}
                    </Text>
                    {isActive && (
                      <View className="w-2 h-2 rounded-full bg-indigo-500" />
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
