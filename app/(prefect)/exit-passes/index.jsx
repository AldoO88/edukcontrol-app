// =====================================================================
// app/(prefect)/exit-passes/index.jsx
// ---------------------------------------------------------------------
// Pantalla de listado de Pases de Salida.
// Muestra todos los pases generados con pull-to-refresh y paginación.
// FAB naranja abre la modal de creación GenerateExitPassModal.
// =====================================================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { useRouter } from 'expo-router';

import {
  ChevronLeft,
  LogOut,
  Plus,
  User,
  Search,
  X,
} from 'lucide-react-native';

import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import { useAuth } from '@/src/hooks/useAuth';
import { usePrefectDashboard } from '@/src/hooks/usePrefectDashboard';
import {
  getGroups,
  getGroupStudents,
  getExitPasses,
} from '@/src/services/prefectService';
import GenerateExitPassModal from '@/app/(prefect)/_components/GenerateExitPassModal';

// ---------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------
const RELATIONSHIP_LABELS = {
  father: 'Padre',
  mother: 'Madre',
  guardian: 'Tutor',
  family: 'Familiar',
};

const REASON_LABELS = {
  illness: 'Enfermedad',
  medical: 'Cita médica',
  family: 'Asunto familiar',
  personal: 'Personal',
  other: 'Otro',
};

// ---------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------
const formatExitTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
};

const formatExitDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (isToday) return 'Hoy';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return 'Ayer';
  const day = d.getDate();
  const month = d.toLocaleString('es', { month: 'short' });
  return `${day} ${month}`;
};

// ---------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------
export default function ExitPassesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: dashboardData } = usePrefectDashboard();
  const flatListRef = useRef(null);

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const school = useMemo(() => {
    if (!dashboardData?.school) return null;
    return {
      ...dashboardData.school,
      logo_url: dashboardData.school.logoUrl,
      current_school_year: dashboardData.school.cycle || null,
    };
  }, [dashboardData?.school]);

  const fetchPasses = useCallback(async (pageNum = 1, append = false) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    setError(null);
    try {
      const result = await getExitPasses({ page: pageNum, limit: 20 });
      if (result.success) {
        const newItems = result.data?.data || result.data || [];
        const total = result.data?.pagination?.total || 0;
        if (append) setItems((prev) => [...prev, ...newItems]);
        else setItems(newItems);
        setPage(pageNum);
        setHasMore(items.length + newItems.length < total);
      } else {
        setError(result.message);
      }
    } catch {
      setError('No se pudieron cargar los pases de salida.');
    }
    setIsLoading(false);
    setIsLoadingMore(false);
  }, [items.length]);

  useEffect(() => { fetchPasses(1, false); }, []);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item) => {
      const student = item.student_id || {};
      const name = `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase();
      const guardian = (item.guardian_name || '').toLowerCase();
      return name.includes(q) || guardian.includes(q);
    });
  }, [items, searchQuery]);

  const handleRefresh = useCallback(() => { fetchPasses(1, false); }, [fetchPasses]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) fetchPasses(page + 1, true);
  }, [fetchPasses, page, isLoadingMore, hasMore]);

  const handleCreated = useCallback(() => {
    fetchPasses(1, false);
    if (flatListRef.current) flatListRef.current.scrollToOffset({ offset: 0, animated: true });
  }, [fetchPasses]);

  const fetchPrefectStudents = useCallback(async (groupId) => {
    const result = await getGroupStudents(groupId);
    if (result.success) {
      return (result.data?.items || []).map((s) => ({
        _id: s._id,
        first_name: s.first_name || '',
        last_name: s.last_name || '',
        fullName: `${s.last_name || ''} ${s.first_name || ''}`.trim(),
        controlNumber: s.controlNumber,
        photoUrl: s.photoUrl,
      }));
    }
    return [];
  }, []);

  const fetchPrefectGroups = useCallback(async () => {
    const result = await getGroups();
    if (result.success) {
      const regularGroups = (result.data || []).filter((g) => g.type !== 'taller');
      const groupsWithStudents = await Promise.all(
        regularGroups.map(async (g) => {
          const students = await fetchPrefectStudents(g._id);
          return { ...g, label: `${g.grade}°${g.section}`, students };
        }),
      );
      return { success: true, data: { groups: groupsWithStudents } };
    }
    return { success: false, data: { groups: [] } };
  }, [fetchPrefectStudents]);

  const renderExitPassCard = useCallback(({ item }) => {
    const student = item.student_id || {};
    const group = item.group_id || {};
    const creator = item.created_by || {};
    const initials = `${(student.last_name || '?')[0]}${(student.first_name || '?')[0]}`.toUpperCase();
    const studentName = `${student.last_name || ''}, ${student.first_name || ''}`.trim();
    const groupLabel = group.grade && group.section ? `${group.grade}° ${group.section}` : '';
    const relationshipLabel = RELATIONSHIP_LABELS[item.relationship] || item.relationship;
    const reasonLabel = REASON_LABELS[item.reason] || item.reason;
    const timeStr = formatExitTime(item.exit_time);
    const dateStr = formatExitDate(item.exit_time);

    return (
      <Pressable
        onPress={() => router.push(`/(prefect)/exit-passes/${item._id}`)}
        className="mx-4 mb-3 bg-white rounded-2xl p-4 border border-slate-100"
        style={{
          elevation: 1,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          borderLeftWidth: 3,
          borderLeftColor: '#ea580c',
        }}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalle del pase de salida de ${studentName}`}
      >
        <View className="flex-row items-start">
          <View className="items-center justify-center rounded-full" style={{ width: 44, height: 44, backgroundColor: '#FFF7ED' }}>
            <Text className="text-orange-700" style={{ fontSize: 15, fontWeight: '700' }}>{initials}</Text>
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-slate-900" style={{ fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{studentName}</Text>
            {groupLabel ? <Text className="text-slate-500" style={{ fontSize: 12 }}>{groupLabel}</Text> : null}
          </View>
          <View className="items-end">
            <Text className="text-slate-900" style={{ fontSize: 13, fontWeight: '700' }}>{timeStr}</Text>
            <Text className="text-slate-400" style={{ fontSize: 11 }}>{dateStr}</Text>
          </View>
        </View>
        <View className="flex-row items-center mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
          <View className="flex-row items-center flex-1">
            <User size={12} color="#94A3B8" strokeWidth={2} />
            <Text className="text-slate-500 ml-1" style={{ fontSize: 12 }}>{item.guardian_name || '—'}</Text>
            <Text className="text-slate-300 mx-1" style={{ fontSize: 12 }}>·</Text>
            <Text className="text-orange-600" style={{ fontSize: 12, fontWeight: '600' }}>{relationshipLabel}</Text>
          </View>
          <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFF7ED' }}>
            <Text className="text-orange-700" style={{ fontSize: 10, fontWeight: '700' }}>{reasonLabel}</Text>
          </View>
        </View>
        {creator.name ? (
          <View className="flex-row items-center mt-2">
            <Text className="text-slate-400" style={{ fontSize: 10 }}>Registrado por: {creator.name} {creator.last_name || ''}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  }, [router]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View className="flex-1 items-center justify-center py-20 px-6">
        <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: '#FFF7ED' }}>
          <LogOut size={28} color="#ea580c" strokeWidth={1.5} />
        </View>
        <Text className="text-slate-900 text-lg font-bold">Sin pases de salida</Text>
        <Text className="text-slate-500 text-sm text-center mt-2">
          No se han registrado pases de salida aún. Toca el botón + para crear uno.
        </Text>
      </View>
    );
  }, [isLoading]);

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#ea580c" />
      </View>
    );
  }, [isLoadingMore]);

  if (isLoading && items.length === 0) {
    return (
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
        <SchoolInfoCard school={school} isLoading={!school} className="mx-4 mt-4" teacher={dashboardData?.prefect} date={new Date().toISOString()} user={user} />
        <Pressable onPress={() => router.back()} className="flex-row items-center px-4 mt-4">
          <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
          <Text className="text-sm font-semibold text-sky-600 ml-1">Volver</Text>
        </Pressable>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ea580c" />
          <Text className="text-slate-400 text-sm mt-3">Cargando pases de salida...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <DashboardHeader />
      <SchoolInfoCard school={school} isLoading={!school} className="mx-4 mt-4" teacher={dashboardData?.prefect} date={new Date().toISOString()} user={user} />

      <Pressable onPress={() => router.back()} className="flex-row items-center px-4 mt-4">
        <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
        <Text className="text-sm font-semibold text-sky-600 ml-1">Volver</Text>
      </Pressable>

      <View className="flex-row items-center justify-between px-5 mt-4 mb-2">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: '#FFF7ED' }}>
            <LogOut size={20} color="#ea580c" strokeWidth={2} />
          </View>
          <Text className="text-xl font-bold text-slate-900 ml-3">Pase de Salida</Text>
        </View>
        <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FFF7ED' }}>
          <Text className="text-orange-700" style={{ fontSize: 12, fontWeight: '700' }}>
            {items.length} registro{items.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* SEARCH INPUT */}
      <View className="mx-4 mt-3 mb-1">
        <View className="flex-row items-center bg-white rounded-xl border border-slate-200 px-3" style={{ elevation: 1 }}>
          <Search size={16} color="#94A3B8" strokeWidth={2} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por alumno o tutor..."
            placeholderTextColor="#94A3B8"
            className="flex-1 ml-2 py-3 text-sm text-slate-900"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={16} color="#94A3B8" strokeWidth={2} />
            </Pressable>
          )}
        </View>
      </View>

      {error && items.length === 0 && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-slate-900 text-lg font-bold">Error</Text>
          <Text className="text-slate-500 text-sm text-center mt-2">{error}</Text>
          <Pressable onPress={handleRefresh} className="mt-4 bg-orange-500 px-6 py-2.5 rounded-xl">
            <Text className="text-white font-semibold">Reintentar</Text>
          </Pressable>
        </View>
      )}

      {!(error && items.length === 0) && (
        <View className="flex-1">
          <FlatList
            ref={flatListRef}
            data={filteredItems}
            renderItem={renderExitPassCard}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 100, flexGrow: 1 }}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} colors={['#ea580c']} tintColor="#ea580c" />}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            showsVerticalScrollIndicator={false}
          />

          <Pressable
            onPress={() => setIsCreateModalOpen(true)}
            className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center"
            style={{ backgroundColor: '#ea580c', shadowColor: '#ea580c', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}
            accessibilityRole="button"
            accessibilityLabel="Crear nuevo pase de salida"
          >
            <Plus size={24} color="#ffffff" strokeWidth={2.5} />
          </Pressable>
        </View>
      )}

      <GenerateExitPassModal
        isVisible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCreated}
        fetchGroupsFn={fetchPrefectGroups}
        fetchStudentsForGroup={fetchPrefectStudents}
      />
    </View>
  );
}
