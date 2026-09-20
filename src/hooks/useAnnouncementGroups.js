// =====================================================================
// useAnnouncementGroups.js
// ---------------------------------------------------------------------
// Hook compartido que maneja la carga de grupos y el modal de creación
// de avisos (tanto para teacher como para prefect).
//
// Encapsula:
//   - Carga de grupos asignados al abrir el modal.
//   - Lazy load de alumnos por grupo (talleres incluidos).
//   - Estado de visibilidad del modal.
//   - Callback de publicación exitosa.
//
// Props:
//   - fetchGroupsFn: async () => { success, data } — servicio que
//     retorna los grupos (getMyGroups para teacher, getGroups para
//     prefect).
//   - mapGroupFn: (rawGroup) => mappedGroup — función que normaliza
//     el formato del grupo según el servicio.
//   - fetchStudentsFn: async (groupId) => students[] — servicio que
//     retorna los alumnos de un grupo (lazy load).
//   - onPublished: fn() — callback opcional después de publicar.
// =====================================================================

import { useState, useCallback } from 'react';

export const useAnnouncementGroups = ({
  fetchGroupsFn,
  mapGroupFn,
  fetchStudentsFn,
  onPublished,
}) => {
  // -----------------------------------------------------------------
  // STATE
  // -----------------------------------------------------------------
  const [showModal, setShowModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // -----------------------------------------------------------------
  // HANDLE OPEN: carga grupos y abre el modal
  // -----------------------------------------------------------------
  const handleOpenCreate = useCallback(async () => {
    setIsLoadingGroups(true);
    try {
      const result = await fetchGroupsFn();
      if (result.success) {
        const raw = result.data || [];
        const mapped = Array.isArray(raw) ? raw.map(mapGroupFn) : [];
        setGroups(mapped);
      }
    } catch (err) {
      console.error('[useAnnouncementGroups] error loading groups:', err);
    } finally {
      setIsLoadingGroups(false);
      setShowModal(true);
    }
  }, [fetchGroupsFn, mapGroupFn]);

  // -----------------------------------------------------------------
  // FETCH STUDENTS: lazy load de alumnos para un grupo
  // -----------------------------------------------------------------
  const handleFetchStudents = useCallback(async (groupId) => {
    if (!fetchStudentsFn) return [];
    try {
      const result = await fetchStudentsFn(groupId);
      return result || [];
    } catch (err) {
      console.error('[useAnnouncementGroups] error fetching students:', err);
      return [];
    }
  }, [fetchStudentsFn]);

  // -----------------------------------------------------------------
  // HANDLE PUBLISHED: cierra modal y ejecuta callback
  // -----------------------------------------------------------------
  const handlePublished = useCallback(() => {
    setShowModal(false);
    onPublished?.();
  }, [onPublished]);

  // -----------------------------------------------------------------
  // HANDLE CLOSE: cierra modal
  // -----------------------------------------------------------------
  const handleClose = useCallback(() => {
    setShowModal(false);
  }, []);

  // -----------------------------------------------------------------
  // RETURN
  // -----------------------------------------------------------------
  return {
    // State
    showModal,
    groups,
    isLoadingGroups,
    // Handlers
    handleOpenCreate,
    handleFetchStudents,
    handlePublished,
    handleClose,
  };
};
