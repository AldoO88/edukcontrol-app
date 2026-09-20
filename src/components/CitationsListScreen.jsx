// =====================================================================
// CitationsListScreen.jsx
// ---------------------------------------------------------------------
// Componente compartido de listado de citatorios para teacher y prefect.
//
// Estructura:
//   - DashboardHeader + SchoolInfoCard
//   - Back button (condicional — teacher)
//   - Título + subtítulo con total
//   - Nivel 1 (scope tabs): "Mis Citatorios" / "Todos los Citatorios"
//     Solo visible para prefect (showMyCitations=true).
//   - Nivel 2 (status tabs): "Pendientes" / "Atendidos" / "Cancelados"
//     Siempre visible.
//   - Stats row: 3 cards
//   - Search bar con clear button
//   - FlatList con CitatorioCard
//   - FAB flotante para crear
//
// Props:
//   items, isLoading, isLoadingMore, error, pagination, refetch, loadMore
//   school, staffMember, currentDate, user
//   userId, showMyCitations
//   onNavigateToDetail, onOpenCreate
//   showBackButton, onBack
// =====================================================================

import React, { useMemo, useCallback } from 'react';

import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import {
  ChevronLeft,
  Plus,
  Search,
  X,
  AlertCircle,
} from 'lucide-react-native';

import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import StatCard from '@/src/components/StatCard';
import CitatorioCard from '@/src/components/CitatorioCard';

// =====================================================================
// CONSTANTS
// =====================================================================
const STATUS_TABS = ['Pendientes', 'Atendidos', 'Cancelados'];

const SCOPE_TABS = [
  { id: 'mine', label: 'Mis Citatorios' },
  { id: 'all', label: 'Todos los Citatorios' },
];

// =====================================================================
// COMPONENTE
// =====================================================================
const CitationsListScreen = ({
  // Datos del hook
  items = [],
  isLoading = false,
  isLoadingMore = false,
  error = null,
  pagination = { total: 0 },
  refetch = () => {},
  loadMore = () => {},

  // Dashboard
  school = null,
  staffMember = null,
  currentDate = '',
  user = null,

  // Filtros
  userId = null,
  showMyCitations = false,

  // Navegación
  onNavigateToDetail = () => {},
  onOpenCreate = () => {},

  // UI config
  showBackButton = false,
  onBack = () => {},
  primaryColor = '#0284C7',
  roleLabel = null,
}) => {
  // ============================================================
  // FILTER STATE
  // ============================================================
  const [activeScope, setActiveScope] = React.useState(
    showMyCitations ? 'mine' : 'all',
  );
  const [activeStatus, setActiveStatus] = React.useState(STATUS_TABS[0]);
  const [searchText, setSearchText] = React.useState('');

  // Reset scope al cambiar showMyCitations.
  React.useEffect(() => {
    setActiveScope(showMyCitations ? 'mine' : 'all');
  }, [showMyCitations]);

  // Reset status al cambiar scope.
  React.useEffect(() => {
    setActiveStatus(STATUS_TABS[0]);
    setSearchText('');
  }, [activeScope]);

  // ============================================================
  // FILTER: scope (mine / all)
  // ============================================================
  const scopeFilteredItems = useMemo(() => {
    if (activeScope === 'mine') {
      return items.filter((c) => c.creatorId === userId);
    }
    return items;
  }, [items, activeScope, userId]);

  // ============================================================
  // FILTER: status (Pendientes / Atendidos / Cancelados)
  // ============================================================
  const statusFilteredItems = useMemo(() => {
    switch (activeStatus) {
      case 'Pendientes':
        return scopeFilteredItems.filter(
          (c) =>
            c.status === 'pending' ||
            c.status === 'confirmed' ||
            c.status === 'no_show' ||
            c.status === 'expired' ||
            c.status === 'reschedule_requested',
        );
      case 'Atendidos':
        return scopeFilteredItems.filter((c) => c.status === 'completed');
      case 'Cancelados':
        return scopeFilteredItems.filter((c) => c.status === 'cancelled');
      default:
        return scopeFilteredItems;
    }
  }, [scopeFilteredItems, activeStatus]);

  // ============================================================
  // FILTER: search (client-side)
  // ============================================================
  const filteredItems = useMemo(() => {
    const term = searchText.toLowerCase().trim();
    if (!term) return statusFilteredItems;
    return statusFilteredItems.filter(
      (c) =>
        String(c.studentName || '').toLowerCase().includes(term) ||
        String(c.groupName || '').toLowerCase().includes(term) ||
        String(c.subject || '').toLowerCase().includes(term) ||
        String(c.creatorName || '').toLowerCase().includes(term),
    );
  }, [statusFilteredItems, searchText]);

  // ============================================================
  // STATS (scope-aware: stats del scope activo)
  // ============================================================
  const stats = useMemo(() => {
    const acc = { pendientes: 0, confirmados: 0, atendidos: 0 };
    for (const c of scopeFilteredItems) {
      if (c.status === 'pending' || c.status === 'no_show') {
        acc.pendientes += 1;
      } else if (c.status === 'confirmed') {
        acc.confirmados += 1;
      } else if (c.status === 'completed') {
        acc.atendidos += 1;
      }
    }
    return acc;
  }, [scopeFilteredItems]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleScopeChange = useCallback((scope) => {
    setActiveScope(scope);
  }, []);

  const handleStatusChange = useCallback((status) => {
    setActiveStatus(status);
    setSearchText('');
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const hasSearch = searchText.trim().length > 0;
  const clearSearch = useCallback(() => setSearchText(''), []);

  // ============================================================
  // RENDER: citatorio card
  // ============================================================
  const renderCitation = useCallback(
    ({ item: citatorio }) => (
      <Pressable
        onPress={() => onNavigateToDetail(citatorio.id)}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalle de citatorio para ${citatorio.studentName}`}
      >
        <CitatorioCard citatorio={citatorio} />
      </Pressable>
    ),
    [onNavigateToDetail],
  );

  // ============================================================
  // RENDER: empty state
  // ============================================================
  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    const isMine = activeScope === 'mine';
    return (
      <View className="items-center py-12 px-6">
        {hasSearch ? (
          <>
            <Search size={40} color="#CBD5E1" strokeWidth={1.5} />
            <Text className="text-[14px] font-semibold text-[#0F172A] mt-3 text-center">
              No hay citatorios con estos filtros
            </Text>
            <Text className="text-[13px] text-[#64748B] mt-1 text-center">
              Intenta ajustar la búsqueda.
            </Text>
          </>
        ) : isMine ? (
          <>
            <AlertCircle size={40} color="#CBD5E1" strokeWidth={1.5} />
            <Text className="text-[14px] font-semibold text-[#0F172A] mt-3 text-center">
              No has creado citatorios
            </Text>
            <Text className="text-[13px] text-[#64748B] mt-1 text-center">
              Crea tu primer citatorio usando el botón de abajo.
            </Text>
          </>
        ) : (
          <>
            <AlertCircle size={40} color="#CBD5E1" strokeWidth={1.5} />
            <Text className="text-[14px] font-semibold text-[#0F172A] mt-3 text-center">
              No hay citatorios
            </Text>
            <Text className="text-[13px] text-[#64748B] mt-1 text-center">
              Los citatorios aparecerán cuando se creen.
            </Text>
          </>
        )}
      </View>
    );
  }, [isLoading, activeScope, hasSearch]);

  // ============================================================
  // RENDER: footer
  // ============================================================
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={primaryColor} />
      </View>
    );
  }, [isLoadingMore, primaryColor]);

  // ============================================================
  // LIST HEADER
  // ============================================================
  const listHeader = (
    <>
      {/* CHROME COMPARTIDO */}
      <DashboardHeader />
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-4"
        teacher={staffMember}
        date={currentDate}
        user={user}
        roleLabel={roleLabel}
      />

      {/* BACK BUTTON */}
      {showBackButton && (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Volver al dashboard"
          className="flex-row items-center px-4 mt-4"
        >
          <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
          <Text className="text-sm font-semibold text-sky-600 ml-1">
            Volver
          </Text>
        </Pressable>
      )}

      {/* ============================================================
          HEADER: TÍTULO + SUBTÍTULO
          ============================================================ */}
      <View className="px-4 mt-4 mb-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-[22px] font-bold text-[#0F172A]">
              Citatorios
            </Text>
            {hasSearch && (
              <View className="ml-2 rounded-full px-2 py-0.5" style={{ backgroundColor: primaryColor + '20' }}>
                <Text className="text-[10px] font-bold" style={{ color: primaryColor }}>
                  Filtrado
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text className="text-sm text-slate-500 mt-1">
          {pagination.total} citatorio{pagination.total !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* ============================================================
          SCOPE TABS (Nivel 1 — solo para prefect)
          ============================================================ */}
      {showMyCitations && (
        <View className="mt-4 border-b border-[#E2E8F0] flex-row px-4">
          {SCOPE_TABS.map((scope) => {
            const isActive = activeScope === scope.id;
            return (
              <Pressable
                key={scope.id}
                onPress={() => handleScopeChange(scope.id)}
                className="mr-6 items-center"
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={scope.label}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? primaryColor : '#64748B',
                    paddingBottom: 8,
                  }}
                >
                  {scope.label}
                </Text>
                <View
                  style={{
                    height: 3,
                    borderTopLeftRadius: 2,
                    borderTopRightRadius: 2,
                    width: '100%',
                    backgroundColor: isActive ? primaryColor : 'transparent',
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      )}

      {/* ============================================================
          STATUS TABS (Nivel 2 — pills)
          ============================================================ */}
      <View className="mx-4 mt-3 flex-row" style={{ gap: 8 }}>
        {STATUS_TABS.map((status) => {
          const isActive = activeStatus === status;
          return (
            <Pressable
              key={status}
              onPress={() => handleStatusChange(status)}
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor: isActive ? primaryColor : '#F1F5F9',
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={status}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: isActive ? '#FFFFFF' : '#64748B',
                }}
              >
                {status}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ============================================================
          STATS ROW (scope-aware)
          ============================================================ */}
      <View className="flex-row mx-4 mt-3" style={{ gap: 8 }}>
        <StatCard
          label="Pendientes"
          value={stats.pendientes}
          valueColor="#D97706"
          bgColor="#FEF3C7"
        />
        <StatCard
          label="Confirmados"
          value={stats.confirmados}
          valueColor="#16A34A"
          bgColor="#DCFCE7"
        />
        <StatCard
          label="Atendidos"
          value={stats.atendidos}
          valueColor="#0284C7"
          bgColor="#DBEAFE"
        />
      </View>

      {/* ============================================================
          SEARCH BAR
          ============================================================ */}
      <View className="px-4 mt-3 mb-1">
        <View className="flex-row items-center bg-white rounded-xl border border-slate-200 px-3 py-2">
          <Search size={16} color="#94A3B8" />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar por alumno, grupo o materia..."
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

        {hasSearch && (
          <View className="flex-row items-center justify-between mt-1 mb-1">
            <Text className="text-[11px] text-slate-400">
              Mostrando {filteredItems.length} de {scopeFilteredItems.length} citatorios
            </Text>
            <Pressable onPress={clearSearch}>
              <Text className="text-[11px] font-semibold" style={{ color: primaryColor }}>
                Limpiar
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* LOADING STATE */}
      {isLoading && items.length === 0 && (
        <View className="py-8 items-center">
          <ActivityIndicator size="large" color={primaryColor} />
          <Text className="text-slate-400 mt-2" style={{ fontSize: 12 }}>
            Cargando citatorios...
          </Text>
        </View>
      )}

      {/* ERROR STATE */}
      {error && !isLoading && (
        <View className="bg-white rounded-2xl p-6 mx-4 mt-3 items-center border border-rose-100">
          <AlertCircle size={24} color="#DC2626" strokeWidth={2} />
          <Text
            className="text-rose-600 mt-2 text-center"
            style={{ fontSize: 13, fontWeight: '600' }}
          >
            {error}
          </Text>
          <Pressable
            onPress={handleRefresh}
            className="mt-3 px-4 py-2 rounded-xl"
            style={{ backgroundColor: primaryColor }}
          >
            <Text className="text-white font-bold" style={{ fontSize: 12 }}>
              Reintentar
            </Text>
          </Pressable>
        </View>
      )}
    </>
  );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderCitation}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            colors={[primaryColor]}
          />
        }
        contentContainerStyle={{
          paddingBottom: 100,
        }}
      />

      {/* ============================================================
          FAB "CREAR NUEVO CITATORIO"
          ============================================================ */}
      <Pressable
        onPress={onOpenCreate}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center"
        style={{
          backgroundColor: primaryColor,
          shadowColor: primaryColor,
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
        accessibilityRole="button"
        accessibilityLabel="Crear nuevo citatorio"
      >
        <Plus size={24} color="#ffffff" strokeWidth={2.5} />
      </Pressable>
    </View>
  );
};

export default CitationsListScreen;
