// =====================================================================
// app/(teacher)/announcements.jsx
// ---------------------------------------------------------------------
// Pantalla "Avisos" del MAESTRO (rol "teacher").
//
// Feed de avisos reales con:
//   - Tabs "Mis Publicaciones" (solo avisos del teacher) /
//     "Generales" (avisos generales de la dirección).
//   - Filtro de prioridad (toggle) en ambas tabs.
//   - Date range chips (Hoy/Semana/15 días/Historial).
//   - Búsqueda client-side por título, mensaje, remitente.
//   - Scroll infinito (FlatList con onEndReached → loadMore).
//   - FAB "Crear Nuevo Aviso" con targetType group/student.
//   - Tap en una card → navega a detalle (/announcements/:id).
//
// DATA SOURCE:
//   - Feed: useTeacherAnnouncements() → GET /api/announcements/me
//     (tabs: mine | general, filtros: priority, from, to, paginación)
// =====================================================================

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';

import { useRouter } from 'expo-router';
import { clsx } from 'clsx';

// Iconos Lucide.
import {
  Plus,
  Megaphone,
  User,
  AlertTriangle,
  Search,
  X,
  Filter,
} from 'lucide-react-native';

// Componentes compartidos.
import DashboardHeader from '../../src/components/DashboardHeader';
import SchoolInfoCard from '../../src/components/SchoolInfoCard';

// Hooks.
import { useAuth } from '../../src/hooks/useAuth';
import { useTeacherDashboard } from '../../src/hooks/useTeacherDashboard';
import { useTeacherAnnouncements } from '../../src/hooks/useTeacherAnnouncements';
import { useAnnouncementFilters, DATE_RANGE_OPTIONS } from '../../src/hooks/useAnnouncementFilters';
import { useAnnouncementGroups } from '../../src/hooks/useAnnouncementGroups';

// Service.
import { getMyGroups, getGroupStudents } from '../../src/services/teacherService';
// Helpers.
import { formatPriorityLabel } from '../../src/utils/announcementHelpers';
import { formatRelativeDateTime } from '../../src/utils/dateHelpers';
import { ROLE_LABELS } from '../../src/constants/roleLabels';

// Modal de creación.
import CreateAnnouncementModal from './_components/CreateAnnouncementModal';

// ---------------------------------------------------------------------
// TABS del control segmentado
// ---------------------------------------------------------------------
const SEGMENT_TABS = ['Mis Publicaciones', 'Generales'];

// ---------------------------------------------------------------------
// SOMBRAS
// ---------------------------------------------------------------------
const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.04,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function TeacherAnnouncements() {
  const router = useRouter();

  // Usuario actual (para filtrar "Mis Publicaciones" por sender).
  const { user } = useAuth();

  // Datos del dashboard: school info.
  const { data } = useTeacherDashboard();
  const { items, isLoading, isLoadingMore, error, pagination, setFilters, loadMore, refetch } =
    useTeacherAnnouncements();

  // -------------------------------------------------------------------
  // GRUPOS + MODAL (vía useAnnouncementGroups)
  // -------------------------------------------------------------------
  const fetchTeacherGroups = useCallback(async () => {
    const result = await getMyGroups();
    if (result.success) {
      return { success: true, data: result.data?.groups || [] };
    }
    return { success: false, data: [] };
  }, []);

  const mapTeacherGroup = useCallback((g) => ({
    id: g._id,
    label: g.label || `${g.grade}°${g.section}`,
    grade: g.grade,
    section: g.section,
    type: g.type || 'regular',
    students: g.students || [],
    tallerGrade: g.type === 'taller' ? g.grade : null,
  }), []);

  const fetchTeacherStudents = useCallback(async (groupId) => {
    const result = await getGroupStudents(groupId);
    if (result.success) {
      return result.data?.students || [];
    }
    return [];
  }, []);

  const {
    showModal: isCreateModalVisible,
    groups: assignedGroups,
    handleOpenCreate,
    handleFetchStudents,
    handlePublished,
    handleClose: handleModalClose,
  } = useAnnouncementGroups({
    fetchGroupsFn: fetchTeacherGroups,
    mapGroupFn: mapTeacherGroup,
    fetchStudentsFn: fetchTeacherStudents,
  });

  // -------------------------------------------------------------------
  // FILTROS (vía useAnnouncementFilters)
  // -------------------------------------------------------------------
  const {
    activeSegment,
    selectedPriority,
    dateRangeId,
    searchText,
    setDateRangeId,
    setSearchText,
    handleTabChange,
    togglePriorityFilter,
    clearSearch,
    activeRange,
    filteredItems,
    hasSearch,
  } = useAnnouncementFilters({
    setFilters,
    segmentTabs: SEGMENT_TABS,
    tabMapping: { [SEGMENT_TABS[0]]: 'mine', [SEGMENT_TABS[1]]: 'general' },
    defaultDateRange: 'all',
    items,
  });

  // -------------------------------------------------------------------
  // SCHOOL INFO (normalizada para SchoolInfoCard)
  // -------------------------------------------------------------------
  const school = useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.currentSchoolYear?.name || null,
    };
  }, [data?.school, data?.currentSchoolYear]);

  const currentDate = data?.currentDate || '';

  // -------------------------------------------------------------------
  // RENDER: ITEM DEL FEED
  // -------------------------------------------------------------------
  const renderFeedItem = useCallback(({ item }) => {
    const firstGroup = item.targetGroups?.[0];
    const isStudentTarget = item.targetType === 'student';
    const isGeneral = item.targetType === 'general';
    const isUrgent = item.priority === 'urgent';

    // Colores del badge de prioridad.
    const priorityBg = isUrgent ? '#FEF2F2' : '#EFF6FF';
    const priorityColor = isUrgent ? '#DC2626' : '#2563EB';

    // Borde derecho según prioridad.
    const borderColor = isUrgent ? '#DC2626' : '#2563EB';

    // Colores del badge de tipo de audiencia.
    const tagConfig = isStudentTarget
      ? { bg: '#FFFBEB', color: '#D97706', label: `${item.targetStudents?.length || 0} alumno(s)` }
      : isGeneral
        ? { bg: '#ECFDF5', color: '#059669', label: 'General' }
        : { bg: '#EFF6FF', color: '#2563EB', label: firstGroup ? `${firstGroup.grade}°${firstGroup.section}` : 'Grupo' };

    const TagIcon = isStudentTarget ? User : Megaphone;

    // Sender info.
    const senderName = item.sender
      ? `${item.sender.last_name || ''} ${item.sender.name || ''}`.trim()
      : '';
    const senderRole = item.sender?.role;
    const roleLabel = senderRole ? ROLE_LABELS[senderRole] || senderRole : null;

    return (
      <Pressable
        onPress={() => router.push(`/(teacher)/announcements/${item._id}`)}
        accessibilityRole="button"
        accessibilityLabel={`Ver aviso: ${item.title}`}
      >
        <View
          className="bg-white rounded-[20px] p-4 mb-4 border border-[#F1F5F9] border-r-4"
          style={{ ...CARD_SHADOW, borderRightColor: borderColor }}
        >
          {/* Header: tag de tipo (izq) + timestamp (der). */}
          <View className="flex-row items-center justify-between">
            <View
              className="flex-row items-center px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: tagConfig.bg }}
            >
              <TagIcon size={13} color={tagConfig.color} strokeWidth={2.5} />
              <Text
                className="text-[12px] font-bold ml-1.5"
                style={{ color: tagConfig.color }}
              >
                {tagConfig.label}
              </Text>
            </View>
            <Text className="text-[12px] text-[#64748B]">
              {formatRelativeDateTime(item.createdAt)}
            </Text>
          </View>

          {/* Título. */}
          <Text className="text-[16px] font-bold text-[#0F172A] mt-1.5">
            {item.title}
          </Text>

          {/* Body: 2 líneas truncado. */}
          <Text
            className="text-[13px] text-[#475569] mt-1"
            numberOfLines={2}
          >
            {item.message}
          </Text>

          {/* Footer: prioridad badge + sender con rol. */}
          <View className="h-px bg-[#F1F5F9] my-3" />
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className="px-2 py-0.5 rounded-md"
                style={{ backgroundColor: priorityBg }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: priorityColor,
                  }}
                >
                  {formatPriorityLabel(item.priority)}
                </Text>
              </View>
            </View>
            {senderName ? (
              <View className="flex-row items-center">
                <Text className="text-[12px] text-[#64748B]" numberOfLines={1}>
                  {senderName}
                  {roleLabel ? ` · ${roleLabel}` : ''}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  }, [router]);

  const keyExtractor = useCallback((item) => item._id, []);

  // -------------------------------------------------------------------
  // FOOTER DE LA FLATLIST
  // -------------------------------------------------------------------
  const renderFooter = useCallback(() => {
    if (isLoadingMore) {
      return (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#0284C7" />
        </View>
      );
    }
    if (pagination.page >= pagination.totalPages && filteredItems.length > 0) {
      return (
        <Text className="text-center text-[12px] text-[#94A3B8] py-4">
          No hay más avisos
        </Text>
      );
    }
    return null;
  }, [isLoadingMore, pagination.page, pagination.totalPages, filteredItems.length]);

  // -------------------------------------------------------------------
  // EMPTY STATE
  // -------------------------------------------------------------------
  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View className="py-12 items-center">
          <ActivityIndicator size="large" color="#0284C7" />
          <Text className="text-[14px] text-[#64748B] mt-3">Cargando avisos...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View className="py-12 items-center px-6">
          <AlertTriangle size={40} color="#F59E0B" strokeWidth={1.5} />
          <Text className="text-[14px] font-semibold text-[#0F172A] mt-3 text-center">
            No se pudieron cargar los avisos
          </Text>
          <Text className="text-[13px] text-[#64748B] mt-1 text-center">
            {error}
          </Text>
          <Pressable
            onPress={refetch}
            className="mt-4 px-5 py-2 rounded-full bg-[#0284C7]"
          >
            <Text className="text-white font-semibold text-[13px]">Reintentar</Text>
          </Pressable>
        </View>
      );
    }
    if (hasSearch) {
      return (
        <View className="py-12 items-center px-6">
          <Search size={40} color="#CBD5E1" strokeWidth={1.5} />
          <Text className="text-[14px] font-semibold text-[#0F172A] mt-3 text-center">
            No hay avisos con estos filtros
          </Text>
          <Text className="text-[13px] text-[#64748B] mt-1 text-center">
            Intenta con otros términos de búsqueda.
          </Text>
        </View>
      );
    }
    if (activeSegment === SEGMENT_TABS[1]) {
      return (
        <View className="py-12 items-center px-6">
          <Megaphone size={40} color="#CBD5E1" strokeWidth={1.5} />
          <Text className="text-[14px] font-semibold text-[#0F172A] mt-3 text-center">
            No hay avisos generales
          </Text>
          <Text className="text-[13px] text-[#64748B] mt-1 text-center">
            Los avisos generales son creados por la dirección escolar.
          </Text>
        </View>
      );
    }
    return (
      <View className="py-12 items-center px-6">
        <Megaphone size={40} color="#CBD5E1" strokeWidth={1.5} />
        <Text className="text-[14px] font-semibold text-[#0F172A] mt-3 text-center">
          No has publicado avisos
        </Text>
        <Text className="text-[13px] text-[#64748B] mt-1 text-center">
          Crea tu primer aviso usando el botón de abajo.
        </Text>
      </View>
    );
  }, [isLoading, error, refetch, activeSegment, hasSearch]);

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <DashboardHeader />

      {/* ============================================================
          CONTENIDO SCROLLEABLE
          ============================================================ */}
      <FlatList
        data={filteredItems}
        renderItem={renderFeedItem}
        keyExtractor={keyExtractor}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4"
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshing={isLoading}
        onRefresh={refetch}
        ListHeaderComponent={
          <>
            {/* SchoolInfoCard. */}
            <SchoolInfoCard
              school={school}
              isLoading={!school}
              className="mx-4 mt-2"
              user={user}
              teacher={data?.teacher}
              date={currentDate}
            />

            {/* Sección "Avisos" + conteo. */}
            <View className="mt-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text className="text-[22px] font-bold text-[#0F172A]">
                    Avisos
                  </Text>
                  {hasSearch && (
                    <View className="ml-2 bg-sky-100 rounded-full px-2 py-0.5">
                      <Text className="text-[10px] font-bold text-sky-700">Filtrado</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text className="text-sm text-slate-500 mt-1">
                {pagination.total} aviso{pagination.total !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* ==========================================================
                TAB SEGMENTED CONTROL (underline style)
                ========================================================== */}
            <View className="mt-4 border-b border-[#E2E8F0] flex-row">
              {SEGMENT_TABS.map((tab) => {
                const isActive = tab === activeSegment;
                return (
                  <Pressable
                    key={tab}
                    onPress={() => handleTabChange(tab)}
                    className="mr-8 items-center"
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={tab}
                  >
                    <Text className={clsx(
                      'text-[15px] font-semibold pb-2.5',
                      isActive ? 'text-[#0284C7]' : 'text-[#64748B]',
                    )}>
                      {tab}
                    </Text>
                    <View
                      className={clsx(
                        'h-[3px] rounded-t-full w-full',
                        isActive ? 'bg-[#0284C7]' : 'bg-transparent',
                      )}
                    />
                  </Pressable>
                );
              })}
            </View>

            {/* ==========================================================
                FILTROS: prioridad + date range + búsqueda
                ========================================================== */}
            <View className="mt-3">
              {/* Fila 1: Prioridad pills. */}
              <View className="flex-row items-center mb-2">
                <Filter size={14} color="#64748B" strokeWidth={2} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginRight: 8 }}>
                  Prioridad:
                </Text>
                {['informative', 'urgent'].map((p) => {
                  const isActive = selectedPriority === p;
                  const isUrgentFilter = p === 'urgent';
                  return (
                    <Pressable
                      key={p}
                      onPress={() => togglePriorityFilter(p)}
                      className="mr-2"
                      style={{
                        backgroundColor: isActive
                          ? isUrgentFilter ? '#FEF2F2' : '#EFF6FF'
                          : '#F1F5F9',
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: isActive ? '700' : '500',
                          color: isActive
                            ? isUrgentFilter ? '#DC2626' : '#2563EB'
                            : '#64748B',
                        }}
                      >
                        {p === 'informative' ? 'Informativo' : 'Urgente'}
                      </Text>
                    </Pressable>
                  );
                })}
                {selectedPriority && (
                  <Pressable onPress={() => setSelectedPriority(null)} style={{ marginLeft: 'auto' }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#0284C7' }}>
                      Limpiar
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Fila 2: Date range chips. */}
              <View className="flex-row items-center gap-1.5 mb-2">
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.id}
                    onPress={() => setDateRangeId(opt.id)}
                    className={`px-3 py-1.5 rounded-full ${dateRangeId === opt.id ? 'bg-sky-500' : 'bg-slate-100'}`}
                  >
                    <Text className={`text-xs font-semibold ${dateRangeId === opt.id ? 'text-white' : 'text-slate-600'}`}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Fila 3: Búsqueda. */}
              <View className="flex-row items-center bg-white rounded-xl border border-slate-200 px-3 py-2 mb-1">
                <Search size={16} color="#94A3B8" />
                <TextInput
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Buscar por título, mensaje o remitente..."
                  placeholderTextColor="#94A3B8"
                  className="flex-1 text-sm text-slate-900 ml-2"
                  returnKeyType="search"
                />
                {searchText.length > 0 && (
                  <Pressable onPress={() => setSearchText('')} hitSlop={8}>
                    <X size={16} color="#94A3B8" />
                  </Pressable>
                )}
              </View>

              {/* Indicador de búsqueda activa */}
              {hasSearch && (
                <View className="flex-row items-center justify-between mt-1 mb-1">
                  <Text className="text-[11px] text-slate-400">
                    Mostrando {filteredItems.length} de {items.length} avisos
                  </Text>
                  <Pressable onPress={() => setSearchText('')}>
                    <Text className="text-[11px] font-semibold text-sky-600">Limpiar</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </>
        }
      />

      {/* ============================================================
          FAB "CREAR NUEVO AVISO"
          ============================================================ */}
      <Pressable
        onPress={handleOpenCreate}
        className="absolute bottom-6 right-6 bg-[#0284C7] w-14 h-14 rounded-full items-center justify-center"
        style={{
          shadowColor: '#0284C7',
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
        accessibilityRole="button"
        accessibilityLabel="Crear nuevo aviso"
      >
        <Plus size={24} color="#ffffff" strokeWidth={2.5} />
      </Pressable>

      {/* ============================================================
          MODAL "CREAR NUEVO AVISO"
          ============================================================ */}
      <CreateAnnouncementModal
        visible={isCreateModalVisible}
        onClose={handleModalClose}
        groups={assignedGroups}
        onPublished={handlePublished}
        fetchStudentsForGroup={handleFetchStudents}
      />
    </View>
  );
}
