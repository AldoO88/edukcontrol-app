// =====================================================================
// app/(director)/(tabs)/announcements.jsx
// ---------------------------------------------------------------------
// Pantalla de Avisos del director (vista resumen en tab bar).
// El director puede crear, editar y eliminar avisos (CRUD completo).
// =====================================================================

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Megaphone,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import { useAuth } from '@/src/hooks/useAuth';
import { useDirectorDashboard } from '@/src/hooks/useDirectorDashboard';
import { getAnnouncements } from '@/src/services/directorService';

const PRIORITY_COLORS = {
  urgent: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' },
  high: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  normal: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', dot: 'bg-sky-500' },
  low: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', dot: 'bg-slate-400' },
};

const TARGET_LABELS = {
  general: 'General',
  group: 'Grupo',
  student: 'Alumno',
};

export default function DirectorAnnouncementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: dashboardData } = useDirectorDashboard();

  const school = useMemo(() => {
    if (!dashboardData?.school) return null;
    return {
      ...dashboardData.school,
      logo_url: dashboardData.school.logoUrl,
      current_school_year: dashboardData.school.cycle || null,
    };
  }, [dashboardData?.school]);

  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnnouncements = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      const result = await getAnnouncements({ page: 1, limit: 50 });
      if (result.success) {
        setAnnouncements(result.data?.items || result.data || []);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al cargar avisos');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleRefresh = useCallback(() => {
    fetchAnnouncements(true);
  }, [fetchAnnouncements]);

  const handlePress = useCallback((id) => {
    router.push(`/(director)/announcements/${id}`);
  }, [router]);

  const renderItem = useCallback(({ item }) => {
    const colors = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.normal;
    const targetLabel = TARGET_LABELS[item.targetType] || item.targetType;

    return (
      <Pressable
        onPress={() => handlePress(item._id)}
        className={`mx-4 mb-3 rounded-2xl p-4 border ${colors.border} ${colors.bg}`}
        style={{ elevation: 1 }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-1">
              <View className={`w-2 h-2 rounded-full ${colors.dot} mr-2`} />
              <Text className={`text-xs font-bold uppercase ${colors.text}`}>
                {item.priority === 'urgent' ? 'Urgente' : item.priority === 'high' ? 'Alta' : 'Normal'}
              </Text>
            </View>
            <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
              {item.title}
            </Text>
            <Text className="text-xs text-slate-500 mt-1" numberOfLines={2}>
              {item.message}
            </Text>
            <View className="flex-row items-center mt-2">
              <Megaphone size={12} color="#64748b" />
              <Text className="text-[10px] text-slate-400 ml-1">{targetLabel}</Text>
              <Text className="text-[10px] text-slate-300 mx-2">•</Text>
              <Text className="text-[10px] text-slate-400">
                {item.sender?.name || 'Desconocido'}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#CBD5E1" />
        </View>
      </Pressable>
    );
  }, [handlePress]);

  return (
    <View className="flex-1 bg-slate-50">
      <DashboardHeader />
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-2"
        teacher={dashboardData?.director}
        date={dashboardData?.currentDate}
        user={user}
      />

      <View className="flex-row items-center justify-between px-4 mt-4 mb-2">
        <Text className="text-lg font-bold text-slate-900">Avisos</Text>
        <Text className="text-xs text-slate-400">
          {announcements.length} aviso{announcements.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {isLoading && !isRefreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0284C7" />
          <Text className="text-slate-400 text-sm mt-3">Cargando avisos...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <AlertTriangle size={40} color="#e11d48" strokeWidth={1.5} />
          <Text className="text-slate-900 text-lg font-bold mt-4">Error al cargar</Text>
          <Text className="text-slate-500 text-sm mt-2 text-center">{error}</Text>
          <Pressable onPress={handleRefresh} className="mt-4 bg-sky-500 px-6 py-2.5 rounded-xl">
            <Text className="text-white font-semibold">Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={announcements}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#0284C7']} />
          }
          ListEmptyComponent={
            <View className="items-center py-16">
              <Megaphone size={40} color="#CBD5E1" strokeWidth={1.5} />
              <Text className="text-slate-400 text-sm mt-4">No hay avisos</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
