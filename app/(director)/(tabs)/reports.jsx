// =====================================================================
// app/(director)/(tabs)/reports.jsx
// ---------------------------------------------------------------------
// Pantalla de Reportes de Conducta del director (vista resumen en tab).
// El director puede ver todos los reportes y cancelar cualquiera.
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
  FileText,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  Clock,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import { useAuth } from '@/src/hooks/useAuth';
import { useDirectorDashboard } from '@/src/hooks/useDirectorDashboard';
import { getConductLogs } from '@/src/services/directorService';

const SEVERITY_COLORS = {
  minor: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  moderate: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  severe: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
};

export default function DirectorReportsScreen() {
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

  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      const result = await getConductLogs({ page: 1, limit: 50 });
      if (result.success) {
        setReports(result.data?.items || result.data || []);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al cargar reportes');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleRefresh = useCallback(() => {
    fetchReports(true);
  }, [fetchReports]);

  const handlePress = useCallback((id) => {
    router.push(`/(director)/reports/${id}`);
  }, [router]);

  const renderItem = useCallback(({ item }) => {
    const severityColors = SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.minor;
    const isDemerit = item.eventType === 'demerit';

    return (
      <Pressable
        onPress={() => handlePress(item._id)}
        className="mx-4 mb-3 rounded-2xl p-4 border border-slate-100 bg-white"
        style={{ elevation: 1 }}
      >
        <View className="flex-row items-start">
          <View className={`w-10 h-10 rounded-full items-center justify-center ${isDemerit ? 'bg-rose-100' : 'bg-emerald-100'}`}>
            {isDemerit ? (
              <AlertTriangle size={18} color="#e11d48" strokeWidth={2} />
            ) : (
              <TrendingUp size={18} color="#047857" strokeWidth={2} />
            )}
          </View>
          <View className="flex-1 ml-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
                {item.studentName || 'Desconocido'}
              </Text>
              <Text className={`text-[10px] font-bold uppercase ${severityColors.text}`}>
                {item.severity === 'minor' ? 'Leve' : item.severity === 'moderate' ? 'Moderado' : 'Grave'}
              </Text>
            </View>
            <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
              {item.description || (isDemerit ? 'Demérito' : 'Mérito')}
            </Text>
            <View className="flex-row items-center mt-2">
              <Clock size={12} color="#64748b" />
              <Text className="text-[10px] text-slate-400 ml-1">
                {item.incidentDate ? new Date(item.incidentDate).toLocaleDateString('es-MX') : 'Sin fecha'}
              </Text>
              <Text className="text-[10px] text-slate-300 mx-2">•</Text>
              <Text className="text-[10px] text-slate-400">
                {item.reportedBy || 'Desconocido'}
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
        <Text className="text-lg font-bold text-slate-900">Reportes de Conducta</Text>
        <Text className="text-xs text-slate-400">
          {reports.length} reporte{reports.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {isLoading && !isRefreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0284C7" />
          <Text className="text-slate-400 text-sm mt-3">Cargando reportes...</Text>
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
          data={reports}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#0284C7']} />
          }
          ListEmptyComponent={
            <View className="items-center py-16">
              <FileText size={40} color="#CBD5E1" strokeWidth={1.5} />
              <Text className="text-slate-400 text-sm mt-4">No hay reportes</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
