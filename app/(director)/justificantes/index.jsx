// =====================================================================
// app/(director)/justificantes/index.jsx
// ---------------------------------------------------------------------
// Pantalla de JUSTIFICANTES del trabajador social.
//
// Muestra inasistencias (status=absent, event_type=entry) con un
// selector para alternar entre pendientes y justificadas.
//
// Ruta: /justificantes
// =====================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';

import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';

import { useRouter } from 'expo-router';

import {
  ChevronLeft,
  FileCheck,
  Users,
  X,
  CheckCircle,
  Clock,
} from 'lucide-react-native';

import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import { useAuth } from '@/src/hooks/useAuth';
import { useDirectorDashboard } from '@/src/hooks/useDirectorDashboard';
import {
  getAttendanceLogs,
  getGroups,
} from '@/src/services/directorService';
import JustifyAbsenceModal from '@/app/(director)/_components/JustifyAbsenceModal';

// ---------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------
const formatAbsenceDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.toLocaleString('es', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatJustifiedDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.toLocaleString('es', { month: 'long' });
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day} de ${month} ${year}, ${hours}:${mins}`;
};

// ---------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------
export default function JustificantesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: dashboardData } = useDirectorDashboard();

  const [allAbsences, setAllAbsences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showGroupFilter, setShowGroupFilter] = useState(false);

  const [activeTab, setActiveTab] = useState('pending');

  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

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

  // --- Fetch todas las inasistencias ---
  const fetchAbsences = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        status: 'absent',
        event_type: 'entry',
      };
      if (selectedGroupId) params.group_id = selectedGroupId;

      const result = await getAttendanceLogs(params);
      if (result.success) {
        const logs = result.data?.items || result.data?.logs || result.data || [];
        setAllAbsences(Array.isArray(logs) ? logs : []);
      } else {
        setError(result.message);
      }
    } catch {
      setError('No se pudieron cargar las inasistencias.');
    }
    setIsLoading(false);
  }, [selectedGroupId]);

  useEffect(() => {
    fetchAbsences();
  }, [fetchAbsences]);

  // --- Separar por tab ---
  const { pendingAbsences, justifiedAbsences } = useMemo(() => {
    const pending = allAbsences.filter((a) => !a.justified);
    const justified = allAbsences.filter((a) => a.justified);
    return { pendingAbsences: pending, justifiedAbsences: justified };
  }, [allAbsences]);

  const visibleAbsences = activeTab === 'pending' ? pendingAbsences : justifiedAbsences;

  // --- Handlers de filtros ---
  const handleSelectGroup = useCallback((groupId) => {
    setSelectedGroupId((prev) => (prev === groupId ? null : groupId));
    setShowGroupFilter(false);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedGroupId(null);
  }, []);

  // --- Handlers de justificación ---
  const handleOpenJustify = useCallback((absence) => {
    setSelectedAbsence(absence);
    setIsModalVisible(true);
  }, []);

  const handleJustified = useCallback(() => {
    setIsModalVisible(false);
    if (selectedAbsence) {
      setAllAbsences((prev) =>
        prev.map((a) =>
          a._id === selectedAbsence._id
            ? { ...a, justified: true, justified_at: new Date().toISOString() }
            : a,
        ),
      );
    }
    setSelectedAbsence(null);
  }, [selectedAbsence]);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setSelectedAbsence(null);
  }, []);

  // --- Labels derivados ---
  const selectedGroupLabel = useMemo(() => {
    if (!selectedGroupId) return null;
    const g = groups.find((gr) => gr._id === selectedGroupId);
    return g ? `${g.grade}°${g.section}` : null;
  }, [selectedGroupId, groups]);

  // --- Render card de inasistencia pendiente ---
  const renderPendingCard = useCallback(
    ({ item }) => {
      const student = item.student_id || {};
      const group = student.current_group_id || item.group_id || {};
      const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
      const groupLabel =
        group.grade && group.section ? `${group.grade}° ${group.section}` : '';
      const dateStr = formatAbsenceDate(item.event_time || item.date || item.createdAt);

      return (
        <View
          className="mx-4 mb-3 bg-white rounded-2xl p-4 border border-slate-100"
          style={{
            elevation: 1,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            borderLeftWidth: 3,
            borderLeftColor: '#e11d48',
          }}
        >
          <View className="flex-row items-start">
            <View
              className="items-center justify-center rounded-full mr-3"
              style={{ width: 44, height: 44, backgroundColor: '#FFF1F2' }}
            >
              <Text className="text-rose-700" style={{ fontSize: 15, fontWeight: '700' }}>
                {(student.first_name || '?')[0]}{(student.last_name || '?')[0]}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-slate-900"
                style={{ fontSize: 14, fontWeight: '700' }}
                numberOfLines={1}
              >
                {studentName || 'Alumno desconocido'}
              </Text>
              {groupLabel ? (
                <Text className="text-slate-500" style={{ fontSize: 12 }}>
                  {groupLabel}
                </Text>
              ) : null}
              <Text className="text-slate-400" style={{ fontSize: 11 }}>
                {dateStr}
              </Text>
            </View>
          </View>

          <View
            className="flex-row items-center justify-end mt-3 pt-3"
            style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9' }}
          >
            <Pressable
              onPress={() => handleOpenJustify(item)}
              className="flex-row items-center bg-rose-500 px-4 py-2 rounded-xl"
              style={{
                shadowColor: '#e11d48',
                shadowOpacity: 0.2,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              <FileCheck size={14} color="#ffffff" strokeWidth={2} />
              <Text className="text-white font-semibold ml-1.5" style={{ fontSize: 12 }}>
                Justificar
              </Text>
            </Pressable>
          </View>
        </View>
      );
    },
    [handleOpenJustify],
  );

  // --- Render card de inasistencia justificada ---
  const renderJustifiedCard = useCallback(({ item }) => {
    const student = item.student_id || {};
    const group = student.current_group_id || item.group_id || {};
    const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
    const groupLabel =
      group.grade && group.section ? `${group.grade}° ${group.section}` : '';
    const dateStr = formatAbsenceDate(item.event_time || item.date || item.createdAt);
    const justifiedDateStr = formatJustifiedDate(item.justified_at);

    return (
      <View
        className="mx-4 mb-3 bg-white rounded-2xl p-4 border border-slate-100"
        style={{
          elevation: 1,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          borderLeftWidth: 3,
          borderLeftColor: '#22c55e',
        }}
      >
        <View className="flex-row items-start">
          <View
            className="items-center justify-center rounded-full mr-3"
            style={{ width: 44, height: 44, backgroundColor: '#F0FDF4' }}
          >
            <Text className="text-emerald-700" style={{ fontSize: 15, fontWeight: '700' }}>
              {(student.first_name || '?')[0]}{(student.last_name || '?')[0]}
            </Text>
          </View>
          <View className="flex-1">
            <Text
              className="text-slate-900"
              style={{ fontSize: 14, fontWeight: '700' }}
              numberOfLines={1}
            >
              {studentName || 'Alumno desconocido'}
            </Text>
            {groupLabel ? (
              <Text className="text-slate-500" style={{ fontSize: 12 }}>
                {groupLabel}
              </Text>
            ) : null}
            <Text className="text-slate-400" style={{ fontSize: 11 }}>
              {dateStr}
            </Text>
          </View>
          <View
            className="items-center justify-center rounded-full"
            style={{ width: 28, height: 28, backgroundColor: '#F0FDF4' }}
          >
            <CheckCircle size={16} color="#22c55e" strokeWidth={2} />
          </View>
        </View>

        {item.justified_reason ? (
          <View
            className="mt-3 pt-3"
            style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9' }}
          >
            <Text className="text-xs font-bold text-slate-500 uppercase mb-1">
              Motivo
            </Text>
            <Text className="text-sm text-slate-700">{item.justified_reason}</Text>
            {justifiedDateStr ? (
              <Text className="text-xs text-slate-400 mt-1">
                Justificada el {justifiedDateStr}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }, []);

  // --- Render vacío ---
  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    const isPending = activeTab === 'pending';
    return (
      <View className="flex-1 items-center justify-center py-20 px-6">
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: isPending ? '#F0FDF4' : '#F8FAFC' }}
        >
          {isPending ? (
            <CheckCircle size={28} color="#22c55e" strokeWidth={1.5} />
          ) : (
            <Clock size={28} color="#94A3B8" strokeWidth={1.5} />
          )}
        </View>
        <Text className="text-slate-900 text-lg font-bold">
          {isPending ? 'Sin inasistencias pendientes' : 'Sin justificantes'}
        </Text>
        <Text className="text-slate-500 text-sm text-center mt-2">
          {isPending
            ? 'No hay inasistencias injustificadas por justificar.'
            : 'No hay inasistencias justificadas aún.'}
        </Text>
      </View>
    );
  }, [isLoading, activeTab]);

  // --- Loading state ---
  if (isLoading && allAbsences.length === 0) {
    return (
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
        <SchoolInfoCard
          school={school}
          isLoading={!school}
          className="mx-4 mt-4"
          teacher={dashboardData?.director}
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
          <Text className="text-slate-400 text-sm mt-3">Cargando inasistencias...</Text>
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
        teacher={dashboardData?.director}
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

      {/* HEADER */}
      <View className="flex-row items-center justify-between px-5 mt-4 mb-2">
        <View className="flex-row items-center">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: '#FFF1F2' }}
          >
            <FileCheck size={20} color="#e11d48" strokeWidth={2} />
          </View>
          <Text className="text-xl font-bold text-slate-900 ml-3">
            Justificantes
          </Text>
        </View>
      </View>

      {/* SELECTOR DE TAB */}
      <View className="px-4 mt-3 mb-3">
        <View
          className="flex-row bg-slate-100 rounded-xl p-1"
          style={{ elevation: 1 }}
        >
          <Pressable
            onPress={() => setActiveTab('pending')}
            className="flex-1 flex-row items-center justify-center py-2.5 rounded-lg"
            style={{
              backgroundColor: activeTab === 'pending' ? '#ffffff' : 'transparent',
              elevation: activeTab === 'pending' ? 2 : 0,
              shadowColor: activeTab === 'pending' ? '#000' : 'transparent',
              shadowOpacity: activeTab === 'pending' ? 0.08 : 0,
              shadowRadius: activeTab === 'pending' ? 4 : 0,
              shadowOffset: { width: 0, height: 1 },
            }}
          >
            <Clock
              size={14}
              color={activeTab === 'pending' ? '#e11d48' : '#94A3B8'}
              strokeWidth={2}
            />
            <Text
              className="ml-1.5 text-xs font-semibold"
              style={{ color: activeTab === 'pending' ? '#e11d48' : '#94A3B8' }}
            >
              Pendientes
            </Text>
            {pendingAbsences.length > 0 && (
              <View
                className="ml-1.5 px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor:
                    activeTab === 'pending' ? '#FFF1F2' : '#E2E8F0',
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{
                    color: activeTab === 'pending' ? '#e11d48' : '#94A3B8',
                    fontSize: 10,
                  }}
                >
                  {pendingAbsences.length}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('justified')}
            className="flex-1 flex-row items-center justify-center py-2.5 rounded-lg"
            style={{
              backgroundColor: activeTab === 'justified' ? '#ffffff' : 'transparent',
              elevation: activeTab === 'justified' ? 2 : 0,
              shadowColor: activeTab === 'justified' ? '#000' : 'transparent',
              shadowOpacity: activeTab === 'justified' ? 0.08 : 0,
              shadowRadius: activeTab === 'justified' ? 4 : 0,
              shadowOffset: { width: 0, height: 1 },
            }}
          >
            <CheckCircle
              size={14}
              color={activeTab === 'justified' ? '#22c55e' : '#94A3B8'}
              strokeWidth={2}
            />
            <Text
              className="ml-1.5 text-xs font-semibold"
              style={{ color: activeTab === 'justified' ? '#22c55e' : '#94A3B8' }}
            >
              Justificadas
            </Text>
            {justifiedAbsences.length > 0 && (
              <View
                className="ml-1.5 px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor:
                    activeTab === 'justified' ? '#F0FDF4' : '#E2E8F0',
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{
                    color: activeTab === 'justified' ? '#22c55e' : '#94A3B8',
                    fontSize: 10,
                  }}
                >
                  {justifiedAbsences.length}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* FILTRO GRUPO */}
      <View className="px-4 mb-4">
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

      {/* ERROR */}
      {error && allAbsences.length === 0 && (
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
      )}

      {/* LISTA */}
      {!(error && allAbsences.length === 0) && (
        <FlatList
          data={visibleAbsences}
          renderItem={activeTab === 'pending' ? renderPendingCard : renderJustifiedCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100, flexGrow: 1 }}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={fetchAbsences}
              colors={['#e11d48']}
              tintColor="#e11d48"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* MODAL JUSTIFICAR */}
      <JustifyAbsenceModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        absence={selectedAbsence}
        onJustified={handleJustified}
      />
    </View>
  );
}
