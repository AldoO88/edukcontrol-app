// =====================================================================
// app/(teacher)/citations/index.jsx
// ---------------------------------------------------------------------
// Ruta "/citations" del route group (teacher). Pantalla "Citas" —
// gestión de citatorios / citas con padres de familia.
//
// Wrapper delgado que delega la UI a CitationsListScreen.
// =====================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';

import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';
import { useTeacherCitations } from '@/src/hooks/useTeacherCitations';
import { useAuth } from '@/src/hooks/useAuth';
import CitationsListScreen from '@/src/components/CitationsListScreen';
import GenerateCitationModal from '@/app/(teacher)/_components/GenerateCitationModal';

export default function CitationsScreen() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Dashboard data.
  const { data } = useTeacherDashboard();
  const { user } = useAuth();
  const school = useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.currentSchoolYear?.name || null,
    };
  }, [data?.school, data?.currentSchoolYear]);

  // Citations data.
  const {
    items,
    isLoading,
    isLoadingMore,
    error,
    pagination,
    loadMore,
    refetch,
  } = useTeacherCitations();

  // Handlers.
  const handleNavigateToDetail = useCallback(
    (id) => router.push(`/(teacher)/citations/${id}`),
    [router],
  );

  const handleBack = useCallback(() => router.back(), [router]);

  return (
    <>
      <CitationsListScreen
        items={items}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        error={error}
        pagination={pagination}
        refetch={refetch}
        loadMore={loadMore}
        school={school}
        staffMember={data?.teacher}
        currentDate={data?.currentDate}
        user={user}
        showMyCitations={false}
        onNavigateToDetail={handleNavigateToDetail}
        onOpenCreate={() => setIsCreateModalOpen(true)}
        showBackButton={true}
        onBack={handleBack}
      />

      <GenerateCitationModal
        isVisible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={refetch}
        student={null}
        groupName=""
      />
    </>
  );
}
