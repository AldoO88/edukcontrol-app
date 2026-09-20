// =====================================================================
// app/(director)/(tabs)/citations.jsx
// ---------------------------------------------------------------------
// Ruta "/citations" del tab "Citatorios" del trabajador social.
//
// Wrapper delgado que delega la UI a CitationsListScreen.
// El trabajador social ve TODOS los citatorios de la escuela + tab "Mis Citatorios".
// =====================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';

import { useAuth } from '@/src/hooks/useAuth';
import { useDirectorDashboard } from '@/src/hooks/useDirectorDashboard';
import { usePrefectCitations } from '@/src/hooks/usePrefectCitations';
import CitationsListScreen from '@/src/components/CitationsListScreen';
import GenerateCitationModal from '@/app/(director)/_components/GenerateCitationModal';

import {
  getGroups,
  getGroupStudents,
  createCitation,
} from '@/src/services/directorService';

export default function DirectorCitationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Dashboard data.
  const { data: dashboardData } = useDirectorDashboard();
  const school = useMemo(() => {
    if (!dashboardData?.school) return null;
    return {
      ...dashboardData.school,
      logo_url: dashboardData.school.logoUrl,
      current_school_year: dashboardData.currentSchoolYear?.name || null,
    };
  }, [dashboardData?.school, dashboardData?.currentSchoolYear]);

  // Citations data.
  const {
    items,
    isLoading,
    isLoadingMore,
    error,
    pagination,
    loadMore,
    refetch,
  } = usePrefectCitations();

  // Social worker services for the modal.
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

  // Solo grupos regulares (sin talleres), con alumnos precargados.
  const fetchDirectorGroups = useCallback(async () => {
    const result = await getGroups();
    if (result.success) {
      const regularGroups = (result.data || []).filter(
        (g) => g.type !== 'taller',
      );
      const groupsWithStudents = await Promise.all(
        regularGroups.map(async (g) => {
          const students = await fetchDirectorStudents(g._id);
          return {
            ...g,
            label: `${g.grade}°${g.section}`,
            students,
          };
        }),
      );
      return { success: true, data: { groups: groupsWithStudents } };
    }
    return { success: false, data: { groups: [] } };
  }, []);

  const createDirectorCitation = useCallback(async (payload) => {
    return createCitation(payload);
  }, []);

  // Handlers.
  const handleNavigateToDetail = useCallback(
    (id) => router.push(`/(director)/citations/${id}`),
    [router],
  );

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
        staffMember={dashboardData?.director}
        currentDate={dashboardData?.currentDate}
        user={user}
        userId={user?.id}
        showMyCitations={true}
        onNavigateToDetail={handleNavigateToDetail}
        onOpenCreate={() => setIsCreateModalOpen(true)}
        showBackButton={true}
        onBack={() => router.back()}
        primaryColor="#D97706"
      />

      <GenerateCitationModal
        isVisible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={refetch}
        student={null}
        groupName=""
        fetchGroupsFn={fetchDirectorGroups}
        createCitationFn={createDirectorCitation}
        fetchStudentsForGroup={fetchDirectorStudents}
        allowedTypes={['behavioral', 'administrative']}
      />
    </>
  );
}
