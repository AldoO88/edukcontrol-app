// =====================================================================
// app/(social-worker)/(tabs)/teachers.jsx
// ---------------------------------------------------------------------
// Pantalla de Maestros del trabajador social. Muestra la lista de todos los
// maestros de la escuela. Al tocar un maestro, navega a su horario.
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Briefcase, Search, X, ChevronRight } from 'lucide-react-native';

import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import { useAuth } from '@/src/hooks/useAuth';
import { useSocialWorkerDashboard } from '@/src/hooks/useSocialWorkerDashboard';
import { getAllTeachers } from '@/src/services/socialWorkerService';

export default function SocialWorkerTeachersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: dashboardData } = useSocialWorkerDashboard();

  const school = React.useMemo(() => {
    if (!dashboardData?.school) return null;
    return {
      ...dashboardData.school,
      logo_url: dashboardData.school.logoUrl,
      current_school_year: dashboardData.school.cycle || null,
    };
  }, [dashboardData?.school, dashboardData?.currentSchoolYear]);

  const currentDate = dashboardData?.currentDate || '';

  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');

  const fetchTeachers = useCallback(async () => {
    try {
      const result = await getAllTeachers();
      if (result.success) {
        setTeachers(result.data?.teachers || []);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al cargar maestros.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchTeachers();
  }, [fetchTeachers]);

  // Filtrar por búsqueda
  const filteredTeachers = React.useMemo(() => {
    const term = searchText.toLowerCase().trim();
    if (!term) return teachers;
    return teachers.filter(
      (t) => {
        const fullName = `${t.last_name || ''} ${t.name || ''}`.toLowerCase();
        return fullName.includes(term) ||
          t.name?.toLowerCase().includes(term) ||
          t.last_name?.toLowerCase().includes(term);
      },
    );
  }, [teachers, searchText]);

  const renderTeacher = useCallback(
    ({ item }) => {
      const fullName = item.fullName || `${item.last_name || ''} ${item.name || ''}`.trim();
      return (
        <Pressable
          onPress={() => router.push(`/(social-worker)/teachers/${item._id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Ver horario de ${fullName}`}
        >
          <View
            className="bg-white rounded-2xl p-4 mb-3 border border-purple-200 flex-row items-center"
            style={{
              borderLeftWidth: 4,
              borderLeftColor: '#7C3AED',
              elevation: 2,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <View className="w-12 h-12 rounded-xl items-center justify-center bg-purple-100 mr-3">
              <Text className="text-sm font-bold text-purple-600">
                {`${item.name?.[0] || ''}${item.last_name?.[0] || ''}`.toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-900">
                {fullName}
              </Text>
              {item.phoneNumber && (
                <Text className="text-xs text-slate-500 mt-0.5">{item.phoneNumber}</Text>
              )}
              {item.totalHours > 0 && (
                <Text className="text-xs text-slate-400 mt-0.5">
                  {item.totalHours} hora{item.totalHours !== 1 ? 's' : ''}/semana
                </Text>
              )}
            </View>
            <ChevronRight size={16} color="#7C3AED" strokeWidth={2} />
          </View>
        </Pressable>
      );
    },
    [router],
  );

  // Loading state
  if (isLoading && teachers.length === 0) {
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
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text className="text-slate-400 text-sm mt-3">Cargando maestros...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && teachers.length === 0) {
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
          <Text className="text-slate-900 text-lg font-bold mt-4">Error al cargar</Text>
          <Text className="text-slate-500 text-sm mt-2 text-center">{error}</Text>
          <Pressable onPress={handleRefresh} className="mt-4 px-6 py-2.5 rounded-xl bg-purple-600">
            <Text className="text-white font-semibold">Reintentar</Text>
          </Pressable>
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
      <View className="px-4 mt-4 mb-1">
        <Text className="text-2xl font-bold text-slate-900">Maestros</Text>
        <Text className="text-sm text-slate-500 mt-1">
          Consulta horarios y información de contactos
        </Text>
      </View>

      {/* SEARCH BAR */}
      <View className="px-4 mt-3 mb-3">
        <View className="flex-row items-center bg-white rounded-xl border border-slate-200 px-3" style={{ height: 44 }}>
          <Search size={16} color="#94A3B8" strokeWidth={2} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar maestro..."
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
        data={filteredTeachers}
        renderItem={renderTeacher}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#7C3AED']} />
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <Briefcase size={40} color="#CBD5E1" strokeWidth={1.5} />
            <Text className="text-slate-400 text-sm mt-3">
              {teachers.length === 0 ? 'No hay maestros' : 'No hay maestros con estos filtros'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
