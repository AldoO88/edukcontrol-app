// =====================================================================
// app/(social-worker)/_components/SocialWorkerDashboard.jsx
// ---------------------------------------------------------------------
// Dashboard del TRABAJADOR SOCIAL (rol "social_worker").
// =====================================================================

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Megaphone,
  Mail,
  AlertTriangle,
  ClipboardList,
  DoorOpen,
  Users,
  TrendingUp,
  LogOut,
  UserX,
  User,
  Heart,
  FileCheck,
} from 'lucide-react-native';

import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import DashboardHeader from '@/src/components/DashboardHeader';
import { useSocialWorkerDashboard } from '@/src/hooks/useSocialWorkerDashboard';

export default function SocialWorkerDashboard() {
  const router = useRouter();
  const { data, isLoading, isRefreshing, error, refetch } = useSocialWorkerDashboard();

  const school = useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.school.cycle || null,
    };
  }, [data?.school]);

  const workerName = data?.socialWorker?.name || 'Trabajo Social';
  const currentDate = data?.currentDate || '';

  const quickActions = [
    {
      id: 'avisos',
      label: 'Avisos',
      icon: Megaphone,
      iconBg: 'bg-sky-100',
      iconColor: '#0284c7',
      route: '/(social-worker)/announcements',
    },
    {
      id: 'citations',
      label: 'Citatorios',
      icon: Mail,
      iconBg: 'bg-rose-100',
      iconColor: '#e11d48',
      route: '/(social-worker)/citations',
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: AlertTriangle,
      iconBg: 'bg-amber-100',
      iconColor: '#b45309',
      route: '/(social-worker)/reports',
    },
    {
      id: 'exit-pass',
      label: 'Pase de Salida',
      icon: LogOut,
      iconBg: 'bg-orange-100',
      iconColor: '#ea580c',
      route: '/(social-worker)/exit-passes',
    },
    {
      id: 'justificantes',
      label: 'Justificantes',
      icon: FileCheck,
      iconBg: 'bg-emerald-100',
      iconColor: '#047857',
      route: '/(social-worker)/justificantes',
    },
    {
      id: 'attendance',
      label: 'Inasistencias',
      icon: UserX,
      iconBg: 'bg-rose-100',
      iconColor: '#e11d48',
      route: '/(social-worker)/attendance-summary',
    },
  ];

  const handleQuickAction = useCallback((route) => {
    router.push(route);
  }, [router]);

  const stats = data?.stats || { dayPresent: 0, dayAbsent: 0, dayTotal: 0, totalStudents: 0, totalGroups: 0, maleCount: 0, femaleCount: 0 };
  const conductLogs = data?.recentConductLogs || [];
  const announcements = data?.recentAnnouncements || [];
  const pendingCitations = data?.pendingCitationsCount || 0;

  if (isLoading && !data) {
    return (
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0284C7" />
          <Text className="text-slate-400 text-sm mt-3">Cargando dashboard...</Text>
        </View>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
        <View className="flex-1 items-center justify-center px-6">
          <AlertTriangle size={40} color="#e11d48" strokeWidth={1.5} />
          <Text className="text-slate-900 text-lg font-bold mt-4">Error al cargar</Text>
          <Text className="text-slate-500 text-sm mt-2 text-center">{error}</Text>
          <Pressable onPress={refetch} className="mt-4 bg-sky-500 px-6 py-2.5 rounded-xl">
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
        isLoading={isLoading}
        className="mx-4 mt-2"
        user={data?.socialWorker}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refetch} colors={['#0284C7']} />
        }
      >
        {/* SALUDO + BADGE */}
        <View className="px-4 mt-6">
          <Text className="text-3xl font-bold text-slate-900">
            {`Hola, ${workerName}`}
          </Text>
          <View className="self-start mt-2 px-3 py-1 bg-violet-50 rounded-full">
            <Text className="text-xs font-bold uppercase tracking-wide text-violet-700">
              TRABAJO SOCIAL
            </Text>
          </View>
          <Text className="text-sm text-slate-500 mt-2">
            Gestiona el bienestar y seguimiento{'\n'}de los estudiantes.
          </Text>
        </View>

        {/* QUICK ACTIONS */}
        <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-6 mb-3 px-5">
          Accesos rápidos
        </Text>
        <View className="px-4 flex-row flex-wrap gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Pressable
                key={action.id}
                onPress={() => handleQuickAction(action.route)}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm items-center justify-center py-5 px-4"
                style={{ elevation: 1, width: '47%' }}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <View className={`w-14 h-14 rounded-2xl items-center justify-center ${action.iconBg}`}>
                  <Icon size={24} color={action.iconColor} strokeWidth={2} />
                </View>
                <Text className="text-sm font-semibold text-slate-700 mt-3">
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ESTADÍSTICAS DEL DÍA */}
        <View className="px-4 mt-6">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
            Resumen del Día
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1 bg-white rounded-2xl p-3 border border-slate-100" style={{ elevation: 1 }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[10px] font-bold text-slate-500 uppercase">Alumnos</Text>
                <Users size={14} color="#64748b" />
              </View>
              <Text className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalStudents}</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-3 border border-slate-100" style={{ elevation: 1 }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[10px] font-bold text-slate-500 uppercase">Grupos</Text>
                <ClipboardList size={14} color="#64748b" />
              </View>
              <Text className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalGroups}</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-3 border border-slate-100" style={{ elevation: 1 }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[10px] font-bold text-slate-500 uppercase">% Asist.</Text>
                <TrendingUp size={14} color="#64748b" />
              </View>
              <Text className="text-2xl font-extrabold text-sky-600 mt-1">
                {stats.dayTotal > 0 ? Math.round((stats.dayPresent / stats.dayTotal) * 100) : 0}%
              </Text>
            </View>
          </View>
        </View>

        {/* NIÑOS / NIÑAS */}
        <View className="px-4 mt-3">
          <View className="flex-row gap-2">
            <View className="flex-1 bg-white rounded-2xl p-3 border border-slate-100" style={{ elevation: 1 }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[10px] font-bold text-slate-500 uppercase">Niños</Text>
                <User size={14} color="#0284c7" />
              </View>
              <Text className="text-2xl font-extrabold text-sky-600 mt-1">{stats.maleCount}</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-3 border border-slate-100" style={{ elevation: 1 }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[10px] font-bold text-slate-500 uppercase">Niñas</Text>
                <User size={14} color="#e11d48" />
              </View>
              <Text className="text-2xl font-extrabold text-rose-600 mt-1">{stats.femaleCount}</Text>
            </View>
          </View>
        </View>

        {/* ASISTENCIA DE HOY */}
        <View className="px-4 mt-6">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
            Asistencia de Hoy
          </Text>
          <View className="bg-white rounded-2xl border border-slate-100 shadow-sm" style={{ elevation: 1 }}>
            <View className="flex-row">
              <View className="flex-1 items-center py-3">
                <Text className="text-[11px] font-semibold text-slate-500">Presentes</Text>
                <Text className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.dayPresent}</Text>
              </View>
              <View className="w-px bg-slate-100" />
              <View className="flex-1 items-center py-3">
                <Text className="text-[11px] font-semibold text-slate-500">Faltas</Text>
                <Text className="text-2xl font-extrabold text-rose-600 mt-1">{stats.dayAbsent}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* CITATORIOS PENDIENTES */}
        {pendingCitations > 0 && (
          <View className="px-4 mt-6">
            <View className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
              <View className="flex-row items-center">
                <Mail size={18} color="#b45309" />
                <Text className="text-sm font-bold text-amber-800 ml-2">
                  {pendingCitations} citatorio{pendingCitations !== 1 ? 's' : ''} pendiente{pendingCitations !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ÚLTIMAS INCIDENCIAS */}
        <View className="px-4 mt-6">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
            Últimas Incidencias
          </Text>
          {conductLogs.length === 0 && (
            <View className="items-center py-8">
              <Text className="text-xs text-slate-400">Sin incidencias registradas</Text>
            </View>
          )}
          {conductLogs.map((log) => (
            <View
              key={log._id}
              className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 shadow-sm"
              style={{ elevation: 1 }}
            >
              <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-full items-center justify-center ${log.eventType === 'demerit' ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                  {log.eventType === 'demerit' ? (
                    <AlertTriangle size={18} color="#e11d48" strokeWidth={2} />
                  ) : (
                    <TrendingUp size={18} color="#047857" strokeWidth={2} />
                  )}
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
                    {log.studentName}
                  </Text>
                  <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                    {log.description || (log.eventType === 'demerit' ? 'Demérito' : 'Mérito')}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* AVISOS RECIENTES */}
        {announcements.length > 0 && (
          <View className="px-4 mt-6">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
              Avisos Recientes
            </Text>
            {announcements.map((ann) => (
              <View
                key={ann._id}
                className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 shadow-sm"
                style={{ elevation: 1, borderLeftWidth: 3, borderLeftColor: ann.priority === 'urgent' ? '#e11d48' : '#0284C7' }}
              >
                <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>{ann.title}</Text>
                <Text className="text-xs text-slate-500 mt-1" numberOfLines={2}>{ann.message}</Text>
                <Text className="text-[10px] text-slate-400 mt-2">{ann.sender}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
