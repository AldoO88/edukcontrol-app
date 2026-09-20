// =====================================================================
// app/(prefect)/attendance-summary/index.jsx
// ---------------------------------------------------------------------
// Pantalla de FALTAS ESCOLARES del prefecto.
//
// Muestra top alumnos con más faltas a la escuela
// (AttendanceLog status=absent), filtrable por grupo.
//
// Ruta: /attendance-summary
// Accesible desde: Acción rápida "Inasistencias" del dashboard.
// =====================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';

import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { useRouter } from 'expo-router';

import {
  ChevronLeft,
  UserX,
  Users,
  X,
} from 'lucide-react-native';

import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import { usePrefectDashboard } from '@/src/hooks/usePrefectDashboard';
import { useAuth } from '@/src/hooks/useAuth';
import {
  getSchoolAbsences,
  getGroups,
} from '@/src/services/prefectService';

// ---------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------
export default function AttendanceSummaryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: dashboardData } = usePrefectDashboard();

  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showGroupFilter, setShowGroupFilter] = useState(false);

  const school = useMemo(() => {
    if (!dashboardData?.school) return null;
    return {
      ...dashboardData.school,
      logo_url: dashboardData.school.logoUrl,
      current_school_year: dashboardData.school.cycle || null,
    };
  }, [dashboardData?.school]);

  // --- Cargar grupos al montar ---
  useEffect(() => {
    const loadGroups = async () => {
      const result = await getGroups();
      if (result.success) {
        const items = result.data || [];
        const regularGroups = (Array.isArray(items) ? items : []).filter(
          (g) => g.type !== 'taller',
        );
        setGroups(regularGroups);
      }
    };
    loadGroups();
  }, []);

  // --- Fetch faltas escolares ---
  const fetchAbsences = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getSchoolAbsences({
        groupId: selectedGroupId,
      });
      if (result.success) {
        setSummaryData(result.data);
      } else {
        setError(result.message);
      }
    } catch {
      setError('No se pudo cargar el resumen de faltas.');
    }
    setIsLoading(false);
  }, [selectedGroupId]);

  useEffect(() => {
    fetchAbsences();
  }, [fetchAbsences]);

  // --- Handlers de filtros ---
  const handleSelectGroup = useCallback((groupId) => {
    setSelectedGroupId((prev) => (prev === groupId ? null : groupId));
    setShowGroupFilter(false);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedGroupId(null);
  }, []);

  // --- Labels derivados ---
  const selectedGroupLabel = useMemo(() => {
    if (!selectedGroupId) return null;
    const g = groups.find((gr) => gr._id === selectedGroupId);
    return g ? `${g.grade}°${g.section}` : null;
  }, [selectedGroupId, groups]);

  // --- Datos del resumen ---
  const summary = summaryData?.summary || {};
  const topAbsent = summaryData?.topAbsentStudents || [];

  // --- Loading state ---
  if (isLoading && !summaryData) {
    return (
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
        <SchoolInfoCard
          school={school}
          isLoading={!school}
          className="mx-4 mt-4"
          teacher={dashboardData?.prefect}
          date={new Date().toISOString()}
          user={user}
        />
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center px-4 mt-4"
        >
          <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
          <Text className="text-sm font-semibold text-sky-600 ml-1">Volver</Text>
        </Pressable>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#e11d48" />
          <Text className="text-slate-400 text-sm mt-3">Cargando faltas...</Text>
        </View>
      </View>
    );
  }

  // --- Error state ---
  if (error && !summaryData) {
    return (
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
        <SchoolInfoCard
          school={school}
          isLoading={!school}
          className="mx-4 mt-4"
          teacher={dashboardData?.prefect}
          date={new Date().toISOString()}
          user={user}
        />
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center px-4 mt-4"
        >
          <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
          <Text className="text-sm font-semibold text-sky-600 ml-1">Volver</Text>
        </Pressable>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-slate-900 text-lg font-bold">Error</Text>
          <Text className="text-slate-500 text-sm text-center mt-2">{error}</Text>
          <Pressable
            onPress={fetchAbsences}
            className="mt-4 bg-rose-500 px-6 py-2.5 rounded-xl"
          >
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
        className="mx-4 mt-4"
        teacher={dashboardData?.prefect}
        date={new Date().toISOString()}
        user={user}
      />

      <Pressable
        onPress={() => router.back()}
        className="flex-row items-center px-4 mt-4"
      >
        <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
        <Text className="text-sm font-semibold text-sky-600 ml-1">Volver</Text>
      </Pressable>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchAbsences}
            colors={['#e11d48']}
            tintColor="#e11d48"
          />
        }
      >
        {/* HEADER */}
        <View className="flex-row items-center justify-between px-5 mt-4 mb-2">
          <View className="flex-row items-center">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: '#FFF1F2' }}
            >
              <UserX size={20} color="#e11d48" strokeWidth={2} />
            </View>
            <Text className="text-xl font-bold text-slate-900 ml-3">
              Faltas Escolares
            </Text>
          </View>
        </View>

        {/* FILTRO GRUPO */}
        <View className="px-4 mt-3 mb-4">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setShowGroupFilter((prev) => !prev)}
              className="flex-row items-center bg-white rounded-xl border px-3 py-2.5"
              style={{
                elevation: 1,
                borderColor: selectedGroupId ? '#e11d48' : '#E2E8F0',
              }}
            >
              <Users size={14} color={selectedGroupId ? '#e11d48' : '#64748b'} strokeWidth={2} />
              <Text
                className="ml-1.5 text-xs font-semibold"
                style={{ color: selectedGroupId ? '#e11d48' : '#64748b' }}
              >
                {selectedGroupLabel || 'Filtrar por grupo'}
              </Text>
            </Pressable>

            {selectedGroupId && (
              <Pressable
                onPress={clearFilters}
                className="flex-row items-center bg-rose-50 rounded-xl px-3 py-2.5"
              >
                <X size={14} color="#e11d48" strokeWidth={2} />
                <Text className="ml-1 text-xs font-semibold text-rose-600">
                  Limpiar
                </Text>
              </Pressable>
            )}
          </View>

          {showGroupFilter && (
            <View
              className="mt-2 bg-white rounded-xl border border-slate-200 py-1"
              style={{ elevation: 3 }}
            >
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {groups.map((g) => (
                  <Pressable
                    key={g._id}
                    onPress={() => handleSelectGroup(g._id)}
                    className="px-4 py-2.5"
                    style={{
                      backgroundColor:
                        selectedGroupId === g._id ? '#FFF1F2' : 'transparent',
                    }}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{
                        color:
                          selectedGroupId === g._id ? '#e11d48' : '#334155',
                      }}
                    >
                      {g.grade}°{g.section}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* STATS */}
        <View className="px-4 mb-5">
          <View className="flex-row gap-2">
            <View
              className="flex-1 bg-white rounded-2xl p-3 border border-slate-100"
              style={{ elevation: 1 }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-[10px] font-bold text-slate-500 uppercase">
                  Total Faltas
                </Text>
                <UserX size={14} color="#64748b" />
              </View>
              <Text className="text-2xl font-extrabold text-rose-600 mt-1">
                {summary.totalAbsences || 0}
              </Text>
            </View>
            <View
              className="flex-1 bg-white rounded-2xl p-3 border border-slate-100"
              style={{ elevation: 1 }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-[10px] font-bold text-slate-500 uppercase">
                  Alumnos
                </Text>
                <Users size={14} color="#64748b" />
              </View>
              <Text className="text-2xl font-extrabold text-slate-900 mt-1">
                {summary.affectedStudents || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* TOP ALUMNOS CON MÁS FALTAS */}
        <View className="px-4 mb-5">
          <View className="flex-row items-center mb-3">
            <View
              className="w-8 h-8 rounded-lg items-center justify-center"
              style={{ backgroundColor: '#FFF1F2' }}
            >
              <UserX size={16} color="#e11d48" strokeWidth={2} />
            </View>
            <Text className="text-sm font-bold text-slate-900 ml-2">
              Mayor número de faltas
            </Text>
          </View>
          {topAbsent.length === 0 ? (
            <View
              className="items-center py-8 bg-white rounded-2xl border border-slate-100"
              style={{ elevation: 1 }}
            >
              <Text className="text-xs text-slate-400">
                Sin inasistencias registradas
              </Text>
            </View>
          ) : (
            topAbsent.map((student, index) => (
              <View
                key={student._id}
                className="bg-white rounded-2xl p-4 mb-2 border border-slate-100"
                style={{
                  elevation: 1,
                  borderLeftWidth: 3,
                  borderLeftColor: index < 3 ? '#e11d48' : '#F1F5F9',
                }}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center mr-3"
                    style={{
                      backgroundColor:
                        index === 0
                          ? '#FEE2E2'
                          : index === 1
                            ? '#FECACA'
                            : index === 2
                              ? '#FCA5A5'
                              : '#F1F5F9',
                    }}
                  >
                    <Text
                      className="font-bold"
                      style={{
                        fontSize: 12,
                        color: index < 3 ? '#e11d48' : '#64748b',
                      }}
                    >
                      {student.rank}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-sm font-bold text-slate-900"
                      numberOfLines={1}
                    >
                      {student.fullName}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      {student.group ? (
                        <Text className="text-xs text-slate-500">
                          {student.group}
                        </Text>
                      ) : null}
                      {student.controlNumber ? (
                        <>
                          <Text className="text-xs text-slate-300 mx-1">·</Text>
                          <Text className="text-xs text-slate-400">
                            #{student.controlNumber}
                          </Text>
                        </>
                      ) : null}
                    </View>
                  </View>
                  <View
                    className="px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: '#FFF1F2' }}
                  >
                    <Text
                      className="font-bold"
                      style={{ fontSize: 13, color: '#e11d48' }}
                    >
                      {student.absenceCount}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
