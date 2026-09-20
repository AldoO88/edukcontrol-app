// =====================================================================
// app/(director)/(tabs)/announcements.jsx
// ---------------------------------------------------------------------
// Ruta "/announcements" del tab "Avisos" del trabajador social.
//
// Segment tabs: "Mis Avisos" (sender=user.id) / "Todos" (sin filtro).
// Filtros: rango de fechas (Hoy/Semana/15 días/Historial) +
//   búsqueda client-side por maestro, grupo o alumno.
// Creación vía CreateAnnouncementModal (soporta "general").
// Tap en card → navega a detalle (/(director)/announcements/:id).
// =====================================================================

// React + hooks.
import React, { useMemo, useCallback } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

// useRouter de expo-router.
import { useRouter } from 'expo-router';

// Iconos Lucide.
import {
  ChevronLeft,
  Megaphone,
  Plus,
  AlertTriangle,
  Search,
  X,
  User,
  CheckCircle2,
  Filter,
} from 'lucide-react-native';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Modal de creación de avisos (reutilizado del teacher).
import CreateAnnouncementModal from '@/app/(director)/_components/CreateAnnouncementModal';

// Hook de autenticación.
import { useAuth } from '@/src/hooks/useAuth';

// Hook del dashboard del trabajador social (datos de la escuela).
import { useDirectorDashboard } from '@/src/hooks/useDirectorDashboard';

// Hook de avisos del trabajador social.
import { usePrefectAnnouncements } from '@/src/hooks/usePrefectAnnouncements';

// Hooks compartidos de avisos.
import { useAnnouncementFilters, DATE_RANGE_OPTIONS } from '@/src/hooks/useAnnouncementFilters';
import { useAnnouncementGroups } from '@/src/hooks/useAnnouncementGroups';

// Servicio del trabajador social (para grupos y alumnos del modal).
import {
  getGroups,
  getGroupStudents,
} from '@/src/services/directorService';

// Helpers de formato.
import { formatRelativeDateTime } from '@/src/utils/dateHelpers';
import { formatPriorityLabel } from '@/src/utils/announcementHelpers';
import { ROLE_LABELS } from '@/src/constants/roleLabels';

// clsx para clases condicionales.
import { clsx } from 'clsx';

// ---------------------------------------------------------------------
// CONSTANTS: segment tabs.
// ---------------------------------------------------------------------
const SEGMENT_TABS = ['Mis Avisos', 'Todos'];

// ---------------------------------------------------------------------
// CONSTANTS: sombras.
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
export default function DirectorAnnouncementsScreen() {
  const router = useRouter();

  // Usuario actual (para filtrar "Mis Avisos" por sender).
  const { user } = useAuth();

  // Datos del dashboard: school info.
  const { data: dashboardData } = useDirectorDashboard();

  // Hook de avisos con segment tabs y paginación.
  const {
    items,
    isLoading,
    isLoadingMore,
    error,
    pagination,
    setFilters,
    loadMore,
    refetch,
  } = usePrefectAnnouncements(user?.id);

  // ============================================================
  // GRUPOS + MODAL (vía useAnnouncementGroups)
  // ============================================================
  const fetchDirectorGroups = useCallback(async () => {
    const result = await getGroups();
    if (result.success) {
      const groups = (result.data || []).filter((g) => g.type !== 'taller');
      return { success: true, data: groups };
    }
    return { success: false, data: [] };
  }, []);

  const mapDirectorGroup = useCallback((g) => ({
    id: g._id,
    label: g.type === 'taller' ? g.section : `${g.grade}°${g.section}`,
    grade: g.grade,
    section: g.section,
    type: g.type || 'regular',
    students: [],
    tallerGrade: g.type === 'taller' ? g.grade : null,
  }), []);

  const fetchDirectorStudents = useCallback(async (groupId) => {
    const result = await getGroupStudents(groupId);
    if (result.success) {
      return (result.data?.items || []).map((s) => ({
        _id: s._id,
        first_name: s.first_name || '',
        last_name: s.last_name || '',
        fullName: `${s.last_name || ''} ${s.first_name || ''}`.trim(),
        photoUrl: s.photoUrl,
      }));
    }
    return [];
  }, []);

  const {
    showModal,
    groups,
    handleOpenCreate,
    handleFetchStudents,
    handlePublished,
    handleClose,
  } = useAnnouncementGroups({
    fetchGroupsFn: fetchDirectorGroups,
    mapGroupFn: mapDirectorGroup,
    fetchStudentsFn: fetchDirectorStudents,
    onPublished: refetch,
  });

  // ============================================================
  // FILTROS (vía useAnnouncementFilters)
  // ============================================================
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
    tabMapping: { [SEGMENT_TABS[0]]: 'mine', [SEGMENT_TABS[1]]: 'all' },
    defaultDateRange: '15days',
    items,
    searchIncludesTitle: false,
  });

  // ============================================================
  // COMPUTED: school info para SchoolInfoCard.
  // ============================================================
  const school = useMemo(() => {
    if (!dashboardData?.school) return null;
    return {
      ...dashboardData.school,
      logo_url: dashboardData.school.logoUrl,
      current_school_year: dashboardData.currentSchoolYear?.name || null,
    };
  }, [dashboardData?.school, dashboardData?.currentSchoolYear]);

  const currentDate = dashboardData?.currentDate || '';

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // ============================================================
  // RENDER ITEM
  // ============================================================
  const renderAnnouncement = useCallback(({ item }) => {
    const isUrgent = item.priority === 'urgent';
    const isStudentTarget = item.targetType === 'student';
    const isGeneral = item.targetType === 'general';
    const firstGroup = item.targetGroups?.[0];

    // Borde derecho según prioridad.
    const borderColor = isUrgent ? '#DC2626' : '#2563EB';

    // Colores del badge de prioridad.
    const priorityBg = isUrgent ? '#FEF2F2' : '#EFF6FF';
    const priorityColor = isUrgent ? '#DC2626' : '#2563EB';

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
        onPress={() => router.push(`/(director)/announcements/${item._id}`)}
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

          {/* Footer: prioridad badge + sender con rol + readCount. */}
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
              {item.totalRecipients != null && (
                <View className="flex-row items-center ml-2">
                  <CheckCircle2 size={12} color="#16A34A" strokeWidth={2.25} />
                  <Text className="text-[11px] font-semibold text-[#334155] ml-1">
                    {item.readCount != null
                      ? `${item.readCount}/${item.totalRecipients}`
                      : `${item.totalRecipients}`}
                  </Text>
                </View>
              )}
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

  // ============================================================
  // FILTER CHIP (reusable).
  // ============================================================
  const FilterChip = ({ active, onPress, children }) => (
    <Pressable
      onPress={onPress}
      className={`px-3 py-1.5 rounded-full ${active ? 'bg-sky-500' : 'bg-slate-100'}`}
    >
      <Text
        className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-600'}`}
      >
        {children}
      </Text>
    </Pressable>
  );

  // ============================================================
  // LOADING
  // ============================================================
  if (isLoading && items.length === 0) {
    return (
      <View className="flex-1 bg-[#F8FAFC]">
        <DashboardHeader />
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver al dashboard"
          className="flex-row items-center px-4 mt-4"
        >
          <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
          <Text className="text-sm font-semibold text-sky-600 ml-1">
            Volver
          </Text>
        </Pressable>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0284C7" />
          <Text className="text-slate-400 text-sm mt-3">Cargando avisos...</Text>
        </View>
      </View>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================
  if (error && items.length === 0) {
    return (
      <View className="flex-1 bg-[#F8FAFC]">
        <DashboardHeader />
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver al dashboard"
          className="flex-row items-center px-4 mt-4"
        >
          <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
          <Text className="text-sm font-semibold text-sky-600 ml-1">
            Volver
          </Text>
        </Pressable>
        <View className="flex-1 items-center justify-center px-6">
          <AlertTriangle size={40} color="#F59E0B" strokeWidth={1.5} />
          <Text className="text-[14px] font-semibold text-[#0F172A] mt-3 text-center">
            No se pudieron cargar los avisos
          </Text>
          <Text className="text-[13px] text-[#64748B] mt-1 text-center">
            {error}
          </Text>
          <Pressable
            onPress={handleRefresh}
            className="mt-4 px-5 py-2 rounded-full bg-[#0284C7]"
          >
            <Text className="text-white font-semibold text-[13px]">Reintentar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <DashboardHeader />

      {/* SCHOOL INFO CARD — modo compuesto (escuela + trabajador social + fecha). */}
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-4"
        teacher={dashboardData?.director}
        date={currentDate}
        user={user}
      />

      {/* Botón "Volver" */}
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Volver al dashboard"
        className="flex-row items-center px-4 mt-4"
      >
        <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
        <Text className="text-sm font-semibold text-sky-600 ml-1">
          Volver
        </Text>
      </Pressable>

      {/* ============================================================
          HEADER CON TÍTULO + BOTÓN CREAR
          ============================================================ */}
      <View className="px-4 mt-4 mb-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-[22px] font-bold text-[#0F172A]">Avisos</Text>
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

      {/* ============================================================
          SEGMENT TABS: Mis Avisos | Todos (underline style)
          ============================================================ */}
      <View className="mt-4 border-b border-[#E2E8F0] flex-row px-4">
        {SEGMENT_TABS.map((tab) => {
          const isActive = activeSegment === tab;
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

      {/* ============================================================
          FILTROS: prioridad (solo tab "Todos") + date range + búsqueda
          ============================================================ */}
      <View className="px-4 mt-3 mb-1">
        {/* Fila 0: Prioridad pills (solo en tab "Todos"). */}
        {activeSegment === SEGMENT_TABS[1] && (
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
        )}
        {/* Fila 1: Rango de fechas */}
        <View className="flex-row items-center gap-1.5 mb-2">
          {DATE_RANGE_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.id}
              active={dateRangeId === opt.id}
              onPress={() => setDateRangeId(opt.id)}
            >
              {opt.label}
            </FilterChip>
          ))}
        </View>

        {/* Fila 2: Búsqueda */}
        <View className="flex-row items-center bg-white rounded-xl border border-slate-200 px-3 py-2 mb-1">
          <Search size={16} color="#94A3B8" />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar por maestro, grupo o alumno..."
            placeholderTextColor="#94A3B8"
            className="flex-1 text-sm text-slate-900 ml-2"
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <Pressable onPress={clearSearch} hitSlop={8}>
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
            <Pressable onPress={clearSearch}>
              <Text className="text-[11px] font-semibold text-sky-600">Limpiar</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* ============================================================
          LIST
          ============================================================ */}
      <FlatList
        data={filteredItems}
        renderItem={renderAnnouncement}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            colors={['#0284C7']}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View className="items-center py-12 px-6">
            {hasSearch ? (
              <>
                <Search size={40} color="#CBD5E1" strokeWidth={1.5} />
                <Text className="text-[14px] font-semibold text-[#0F172A] mt-3 text-center">
                  No hay avisos con estos filtros
                </Text>
                <Text className="text-[13px] text-[#64748B] mt-1 text-center">
                  Intenta con otros términos de búsqueda.
                </Text>
              </>
            ) : activeSegment === SEGMENT_TABS[0] ? (
              <>
                <Megaphone size={40} color="#CBD5E1" strokeWidth={1.5} />
                <Text className="text-[14px] font-semibold text-[#0F172A] mt-3 text-center">
                  No has publicado avisos
                </Text>
                <Text className="text-[13px] text-[#64748B] mt-1 text-center">
                  Crea tu primer aviso usando el botón de abajo.
                </Text>
              </>
            ) : (
              <>
                <Megaphone size={40} color="#CBD5E1" strokeWidth={1.5} />
                <Text className="text-[14px] font-semibold text-[#0F172A] mt-3 text-center">
                  No hay avisos
                </Text>
                <Text className="text-[13px] text-[#64748B] mt-1 text-center">
                  Los avisos aparecerán cuando se publiquen.
                </Text>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator size="small" color="#0284C7" className="my-4" />
          ) : null
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
          CREATE MODAL
          ============================================================ */}
      <CreateAnnouncementModal
        visible={showModal}
        onClose={handleClose}
        groups={groups}
        onPublished={handlePublished}
        targetTypes={['general', 'group', 'student']}
        fetchStudentsForGroup={handleFetchStudents}
      />
    </View>
  );
}
