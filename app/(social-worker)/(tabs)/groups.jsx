// =====================================================================
// app/(social-worker)/(tabs)/groups.jsx
// ---------------------------------------------------------------------
// Pantalla de Grupos del trabajador social. Muestra la lista de todos los
// grupos con estadísticas: alumnos, niño/niñas, reportes, asistencia.
// Al tocar un grupo, navega al detalle (alumnos, asistencia, horario).
// =====================================================================

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  Search,
  X,
  ChevronRight,
  BookOpen,
  User,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';

import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import { useAuth } from '@/src/hooks/useAuth';
import { useSocialWorkerDashboard } from '@/src/hooks/useSocialWorkerDashboard';
import { getGroupsSummary } from '@/src/services/socialWorkerService';

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function SocialWorkerGroupsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: dashboardData } = useSocialWorkerDashboard();

  const school = useMemo(() => {
    if (!dashboardData?.school) return null;
    return {
      ...dashboardData.school,
      logo_url: dashboardData.school.logoUrl,
      current_school_year: dashboardData.school.cycle || null,
    };
  }, [dashboardData?.school, dashboardData?.currentSchoolYear]);

  const currentDate = dashboardData?.currentDate || '';

  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');

  // ============================================================
  // FETCH — una sola llamada con todas las stats
  // ============================================================
  const fetchGroups = useCallback(async () => {
    try {
      const result = await getGroupsSummary();
      if (result.success) {
        setGroups(result.data?.groups || []);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al cargar grupos.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchGroups();
  }, [fetchGroups]);

  // ============================================================
  // FILTRO POR BÚSQUEDA
  // ============================================================
  const filteredGroups = useMemo(() => {
    const term = searchText.toLowerCase().trim();
    if (!term) return groups;
    return groups.filter(
      (g) =>
        g.label?.toLowerCase().includes(term) ||
        g.grade?.toString().includes(term) ||
        g.section?.toLowerCase().includes(term),
    );
  }, [groups, searchText]);

  // ============================================================
  // COLOR DE BARRA DE ASISTENCIA
  // ============================================================
  const getAttendanceColor = (rate) => {
    if (rate >= 80) return '#10B981'; // emerald-500
    if (rate >= 60) return '#F59E0B'; // amber-500
    return '#EF4444'; // rose-500
  };

  const getAttendanceBg = (rate) => {
    if (rate >= 80) return 'bg-emerald-50';
    if (rate >= 60) return 'bg-amber-50';
    return 'bg-rose-50';
  };

  // ============================================================
  // RENDER DE CADA TARJETA DE GRUPO
  // ============================================================
  const renderGroup = useCallback(
    ({ item }) => {
      const attendanceColor = getAttendanceColor(item.attendanceRate);
      const attendanceBg = getAttendanceBg(item.attendanceRate);

      return (
        <Pressable
          onPress={() => router.push(`/(social-worker)/groups/${item._id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Ver grupo ${item.label}`}
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
            {/* Fila superior: Grupo + Total alumnos */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-xl items-center justify-center bg-indigo-100 mr-3">
                  <BookOpen size={18} color="#4F46E5" strokeWidth={2} />
                </View>
                <View>
                  <Text className="text-lg font-bold text-slate-900">
                    {item.label}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    {item.shift === 'matutino' ? 'Matutino' : 'Vespertino'}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-2xl font-bold text-slate-900">
                  {item.studentCount}
                </Text>
                <Text className="text-[10px] text-slate-400">
                  alumno{item.studentCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* Fila de stats: Niños, Niñas, Reportes */}
            <View className="flex-row items-center gap-2 mb-3">
              {/* Niños */}
              <View className="flex-1 flex-row items-center bg-blue-50 rounded-xl px-3 py-2">
                <User size={14} color="#2563EB" strokeWidth={2} />
                <Text className="text-xs font-bold text-blue-700 ml-1.5">
                  {item.maleCount}
                </Text>
                <Text className="text-[10px] text-blue-500 ml-1">Niños</Text>
              </View>

              {/* Niñas */}
              <View className="flex-1 flex-row items-center bg-pink-50 rounded-xl px-3 py-2">
                <User size={14} color="#DB2777" strokeWidth={2} />
                <Text className="text-xs font-bold text-pink-700 ml-1.5">
                  {item.femaleCount}
                </Text>
                <Text className="text-[10px] text-pink-500 ml-1">Niñas</Text>
              </View>

              {/* Reportes */}
              <View className="flex-1 flex-row items-center bg-amber-50 rounded-xl px-3 py-2">
                <AlertTriangle size={14} color="#D97706" strokeWidth={2} />
                <Text className="text-xs font-bold text-amber-700 ml-1.5">
                  {item.conductReportCount}
                </Text>
                <Text className="text-[10px] text-amber-500 ml-1">Reportes</Text>
              </View>
            </View>

            {/* Barra de asistencia */}
            <View>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-[10px] font-semibold text-slate-500">
                  Asistencia hoy
                </Text>
                <Text className="text-[10px] font-bold text-slate-700">
                  {item.attendedToday}/{item.studentCount} • {item.attendanceRate}%
                </Text>
              </View>
              <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <View
                  style={{
                    width: `${Math.min(item.attendanceRate, 100)}%`,
                    backgroundColor: attendanceColor,
                    height: '100%',
                    borderRadius: 999,
                  }}
                />
              </View>
            </View>

            {/* Deméritos / Méritos (mini stats) */}
            {(item.demeritCount > 0 || item.meritCount > 0) && (
              <View className="flex-row items-center gap-3 mt-2 pt-2 border-t border-slate-100">
                {item.demeritCount > 0 && (
                  <View className="flex-row items-center">
                    <TrendingDown size={10} color="#E11D48" strokeWidth={2} />
                    <Text className="text-[10px] font-semibold text-rose-600 ml-1">
                      {item.demeritCount} demérito{item.demeritCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
                {item.meritCount > 0 && (
                  <View className="flex-row items-center">
                    <TrendingUp size={10} color="#047857" strokeWidth={2} />
                    <Text className="text-[10px] font-semibold text-emerald-600 ml-1">
                      {item.meritCount} mérito{item.meritCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </Pressable>
      );
    },
    [router],
  );

  // ============================================================
  // ESTADOS DE CARGA / ERROR
  // ============================================================
  if (isLoading && groups.length === 0) {
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
          <Text className="text-slate-400 text-sm mt-3">Cargando grupos...</Text>
        </View>
      </View>
    );
  }

  if (error && groups.length === 0) {
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
        <View className="flex-1 items-center justify-center px-6">
          <AlertTriangle size={40} color="#e11d48" strokeWidth={1.5} />
          <Text className="text-slate-900 text-lg font-bold mt-4">Error al cargar</Text>
          <Text className="text-slate-500 text-sm mt-2 text-center">{error}</Text>
          <Pressable onPress={handleRefresh} className="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600">
            <Text className="text-white font-semibold">Reintentar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
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
      <View className="px-4 mt-4 mb-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl font-bold text-slate-900">Grupos</Text>
          <View className="bg-indigo-100 px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-bold text-indigo-700">TRABAJO SOCIAL</Text>
          </View>
        </View>
        <Text className="text-sm text-slate-500 mt-1">
          Selecciona un grupo para ver alumnos, asistencia y horario
        </Text>
      </View>

      {/* SEARCH BAR */}
      <View className="px-4 mt-3 mb-3">
        <View
          className="flex-row items-center bg-white rounded-xl border border-slate-200 px-3"
          style={{ height: 44 }}
        >
          <Search size={16} color="#94A3B8" strokeWidth={2} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar grupo..."
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
      </View>

      {/* LIST */}
      <FlatList
        data={filteredGroups}
        renderItem={renderGroup}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#4F46E5']} />
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <Users size={40} color="#CBD5E1" strokeWidth={1.5} />
            <Text className="text-slate-400 text-sm mt-3">
              {groups.length === 0 ? 'No hay grupos' : 'No hay grupos con estos filtros'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
