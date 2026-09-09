// =====================================================================
// app/(teacher)/announcements.jsx
// ---------------------------------------------------------------------
// Pantalla "Avisos y Comunicados" del MAESTRO (rol "teacher").
//
// Feed de avisos reales con:
//   - Tabs "Mis Publicaciones" (solo avisos del teacher) /
//     "Generales" (avisos generales de la dirección).
//   - Filtro de prioridad (toggle) — solo en tab "Mis Publicaciones".
//   - Scroll infinito (FlatList con onEndReached → loadMore).
//   - Modal "Crear Nuevo Aviso" con targetType group/student.
//   - Tap en una card → navega a detalle (/announcements/:id).
//
// DATA SOURCE:
//   - Feed: useTeacherAnnouncements() → GET /api/announcements/me
//     (tabs: mine | general, filtros: priority, paginación)
// =====================================================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { clsx } from 'clsx';

// Iconos Lucide.
import {
  GraduationCap,
  Bell,
  Plus,
  Megaphone,
  User,
  CheckCircle2,
  ChevronLeft,
  Filter,
  AlertTriangle,
} from 'lucide-react-native';

// Componentes compartidos.
import SchoolInfoCard from '../../src/components/SchoolInfoCard';

// Hooks.
import { useAuth } from '../../src/hooks/useAuth';
import { useTeacherDashboard } from '../../src/hooks/useTeacherDashboard';
import { useTeacherAnnouncements } from '../../src/hooks/useTeacherAnnouncements';

// Service.
import { getMyGroups } from '../../src/services/teacherService';
// Helpers.
import { formatPriorityLabel } from '../../src/utils/announcementHelpers';
import { formatRelativeDateTime } from '../../src/utils/dateHelpers';

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
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Usuario actual (para filtrar "Mis Publicaciones" por sender).
  const { user } = useAuth();

  // Datos del dashboard: school info.
  const { data } = useTeacherDashboard();
  const { items, isLoading, isLoadingMore, error, pagination, setFilters, loadMore, refetch } =
    useTeacherAnnouncements();

  // -------------------------------------------------------------------
  // GRUPOS ASIGNADOS (para el modal de creación)
  // -------------------------------------------------------------------
  const [assignedGroups, setAssignedGroups] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const fetchGroups = async () => {
      const result = await getMyGroups();
      if (!cancelled && result.success) {
        const raw = result.data?.groups || [];
        setAssignedGroups(
          raw.map((g) => ({
            id: g._id,
            label: g.label || `${g.grade}°${g.section}`,
            grade: g.grade,
            section: g.section,
            students: g.students || [],
          })),
        );
      }
    };
    fetchGroups();
    return () => { cancelled = true; };
  }, []);

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
  // ESTADO DE FILTROS / TABS
  // -------------------------------------------------------------------
  const [activeSegment, setActiveSegment] = useState(SEGMENT_TABS[0]);
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  // -------------------------------------------------------------------
  // CAMBIO DE TAB
  // -------------------------------------------------------------------
  // Al cambiar de tab, notificamos al hook para que cambie el
  // targetType del fetch. "Mis Publicaciones" → sin targetType
  // (el front filtra por sender). "Generales" → targetType: "general".
  const isInitialTabMount = React.useRef(true);
  const handleTabChange = useCallback((tab) => {
    setActiveSegment(tab);
    // Reset prioridad al cambiar de tab.
    setSelectedPriority(null);
    const newTab = tab === SEGMENT_TABS[0] ? 'mine' : 'general';
    setFilters({ tab: newTab, priority: null });
  }, [setFilters]);

  // -------------------------------------------------------------------
  // TOGGLE FILTROS (solo para tab "Mis Publicaciones")
  // -------------------------------------------------------------------
  const isInitialMount = React.useRef(true);
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setFilters({ priority: selectedPriority });
  }, [selectedPriority, setFilters]);

  const togglePriorityFilter = useCallback((priority) => {
    setSelectedPriority((prev) => (prev === priority ? null : priority));
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedPriority(null);
  }, []);

  // -------------------------------------------------------------------
  // ITEMS FILTRADOS POR TAB
  // -------------------------------------------------------------------
  // "Mis Publicaciones": solo avisos donde el sender es el teacher actual.
  // "Generales": ya vienen filtrados por targetType: "general" desde la API.
  const filteredItems = useMemo(() => {
    if (activeSegment === SEGMENT_TABS[1]) {
      // Tab "Generales": ya vienen filtrados del backend.
      return items;
    }
    // Tab "Mis Publicaciones": filtrar por sender._id === user.id.
    if (!user?.id) return items;
    return items.filter((item) => item.sender?._id === user.id);
  }, [items, activeSegment, user?.id]);

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

          {/* Footer: prioridad badge + info de audiencia. */}
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
            {item.totalRecipients != null && (
              <View className="flex-row items-center">
                <CheckCircle2 size={14} color="#16A34A" strokeWidth={2.25} />
                <Text className="text-[12px] font-semibold text-[#334155] ml-1.5">
                  {item.readCount != null
                    ? `${item.readCount}/${item.totalRecipients} Lecturas`
                    : `${item.totalRecipients} destinatarios`}
                </Text>
              </View>
            )}
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
          Crea tu primer aviso usando el botón de arriba.
        </Text>
      </View>
    );
  }, [isLoading, error, refetch, activeSegment]);

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* ============================================================
          HEADER FIJO
          ============================================================ */}
      <View
        className="bg-white flex-row items-center justify-between px-4 pb-3 border-b border-[#E2E8F0]"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center">
          <GraduationCap size={24} color="#0284C7" strokeWidth={2.25} />
          <Text className="text-[20px] font-bold text-[#0284C7] ml-2 tracking-tight">
            EdukControl
          </Text>
        </View>
        <Pressable
          className="relative"
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Notificaciones"
        >
          <Bell size={24} color="#64748B" strokeWidth={2} />
          <View className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#EF4444] border-2 border-[#F8FAFC]" />
        </Pressable>
      </View>

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
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshing={isLoading}
        onRefresh={refetch}
        ListHeaderComponent={
          <>
            {/* SchoolInfoCard. */}
            <SchoolInfoCard
              school={school}
              isLoading={!school}
              className="mt-4"
              teacher={data?.teacher}
              date={currentDate}
            />

            {/* Botón "Volver". */}
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center mt-4"
              accessibilityRole="button"
              accessibilityLabel="Volver al dashboard"
            >
              <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
              <Text className="text-sm font-semibold text-sky-600 ml-1">
                Volver
              </Text>
            </Pressable>

            {/* Sección "Avisos y Comunicados" + botón nuevo. */}
            <View className="mt-5">
              <Text className="text-[22px] font-bold text-[#0F172A]">
                Avisos y Comunicados
              </Text>
              <Pressable
                onPress={() => setIsCreateModalVisible(true)}
                className="self-start mt-3 flex-row items-center bg-[#0284C7] rounded-full px-4 py-2.5"
                accessibilityRole="button"
                accessibilityLabel="Crear nuevo aviso"
              >
                <Plus size={16} color="#ffffff" strokeWidth={2.75} />
                <Text className="text-white font-bold text-[14px] ml-1.5">
                  Nuevo Aviso
                </Text>
              </Pressable>
            </View>

            {/* ==========================================================
                TAB SEGMENTED CONTROL
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
                BARRA DE FILTROS (solo tab "Mis Publicaciones")
                ========================================================== */}
            {activeSegment === SEGMENT_TABS[0] && (
              <View className="mt-3">
                {/* Filtro de prioridad: pills inline. */}
                <View className="flex-row items-center">
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
                    <Pressable onPress={clearFilters} style={{ marginLeft: 'auto' }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#0284C7' }}>
                        Limpiar
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </>
        }
      />

      {/* ============================================================
          MODAL "CREAR NUEVO AVISO"
          ============================================================ */}
      <CreateAnnouncementModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        groups={assignedGroups}
      />
    </View>
  );
}
