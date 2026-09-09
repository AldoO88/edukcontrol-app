// =====================================================================
// app/(teacher)/announcements/[id].jsx
// ---------------------------------------------------------------------
// Pantalla de DETALLE de un aviso del maestro.
//
// Ruta: /announcements/:id
//
// El teacher toca una card del feed → se navega acá con el _id.
// Esta pantalla carga el aviso completo con GET /api/announcements/:id
// y muestra:
//   - Header EdukControl (GraduationCap + Bell)
//   - SchoolInfoCard (escuela + nombre del docente + fecha)
//   - Back button ("Volver")
//   - Badge de prioridad + fecha corta
//   - Título del aviso
//   - Card "De:" (sender + role)
//   - Card "Para:" (targetGroups o targetStudents)
//   - Card "Mensaje" (body completo)
//   - Read count (si está disponible)
//   - Meta info (Publicado / Expira)
//   - Botones Editar/Eliminar (si el usuario tiene permiso)
//
// Permisos (canEdit):
//   - El sender del aviso es el usuario actual.
//   - O el usuario es admin/principal/registrar.
//
// Edit: modal con title, message, priority (pre-fill).
// Delete: Alert.alert de confirmación → DELETE → router.back().
// =====================================================================

// React + hooks.
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// useRouter y useLocalSearchParams de expo-router.
import { useRouter, useLocalSearchParams } from 'expo-router';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Iconos Lucide.
import {
  GraduationCap,
  Bell,
  ChevronLeft,
  User,
  Users,
  Megaphone,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Pencil,
  Trash2,
  Send,
  X,
} from 'lucide-react-native';

// Componentes compartidos.
import SchoolInfoCard from '../../../src/components/SchoolInfoCard';

// Hooks.
import { useAuth } from '../../../src/hooks/useAuth';
import { useTeacherDashboard } from '../../../src/hooks/useTeacherDashboard';

// Service.
import {
  getTeacherAnnouncementById,
  updateTeacherAnnouncement,
  deleteTeacherAnnouncement,
} from '../../../src/services/teacherService';

// Helpers.
import { formatPriorityLabel } from '../../../src/utils/announcementHelpers';
import { formatFullDateTime } from '../../../src/utils/dateHelpers';
// clsx.
import { clsx } from 'clsx';

// ---------------------------------------------------------------------
// PRIORITY_CONFIG — estilos de accent por prioridad (paleta EdukControl)
// ---------------------------------------------------------------------
const PRIORITY_CONFIG = {
  urgent: {
    rightBorderClass: 'border-r-[#DC2626]',
    badgeBg: '#FEF2F2',
    badgeText: '#DC2626',
  },
  informative: {
    rightBorderClass: 'border-r-[#2563EB]',
    badgeBg: '#EFF6FF',
    badgeText: '#2563EB',
  },
};

// ---------------------------------------------------------------------
// PRIORITY_OPTIONS — para el toggle de edición
// ---------------------------------------------------------------------
const PRIORITY_OPTIONS = [
  { value: 'informative', label: 'Informativo' },
  { value: 'urgent', label: 'Urgente' },
];

// ---------------------------------------------------------------------
// formatDateShort(iso) — helper local para fecha corta del header
// ---------------------------------------------------------------------
function formatDateShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
  });
}

// ---------------------------------------------------------------------
// ROLE_LABELS — traducción de roles a español
// ---------------------------------------------------------------------
const ROLE_LABELS = {
  admin: 'Administrador',
  principal: 'Director(a)',
  registrar: 'Secretaría',
  teacher: 'Docente',
  prefect: 'Prefecto(a)',
  social_worker: 'Trabajador(a) social',
  super_admin: 'Super administrador',
};

// ---------------------------------------------------------------------
// getFullName(person) — combina first_name + last_name + name
// ---------------------------------------------------------------------
function getFullName(person) {
  if (!person) return '';
  return [person.first_name, person.last_name, person.name]
    .filter(Boolean)
    .join(' ')
    .trim();
}

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function TeacherAnnouncementDetail() {
  const router = useRouter();
  const { id, fromTutoria } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // -----------------------------------------------------------------
  // USUARIO ACTUAL (para permisos canEdit)
  // -----------------------------------------------------------------
  const { user } = useAuth();

  // -----------------------------------------------------------------
  // DATA DE LA ESCUELA (para el SchoolInfoCard)
  // -----------------------------------------------------------------
  const { data: dashboardData } = useTeacherDashboard();

  const school = useMemo(() => {
    if (!dashboardData?.school) return null;
    return {
      ...dashboardData.school,
      logo_url: dashboardData.school.logoUrl,
      current_school_year: dashboardData.currentSchoolYear?.name || null,
    };
  }, [dashboardData?.school, dashboardData?.currentSchoolYear]);

  const currentDate = dashboardData?.currentDate || '';

  // -----------------------------------------------------------------
  // STATE
  // -----------------------------------------------------------------
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit modal state.
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editPriority, setEditPriority] = useState('informative');
  const [isSaving, setIsSaving] = useState(false);

  // Delete state.
  const [isDeleting, setIsDeleting] = useState(false);

  // -----------------------------------------------------------------
  // FETCH DEL DETALLE
  // -----------------------------------------------------------------
  const fetchDetail = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      setError('Falta el identificador del aviso.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getTeacherAnnouncementById(id);
      if (result.success) {
        setItem(result.data);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('[TeacherAnnouncementDetail] unexpected error:', err);
      setError('Error inesperado al cargar el aviso.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Fetch al montar y cuando cambia el id.
  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // -----------------------------------------------------------------
  // PERMISOS
  // -----------------------------------------------------------------
  const isFromTutoria = fromTutoria === 'true';
  const canEdit = useMemo(() => {
    if (!item || !user) return false;
    if (isFromTutoria) return false;
    const isSender = item.sender?._id === user.id;
    const isPrivileged = ['admin', 'principal', 'registrar'].includes(user.role);
    return isSender || isPrivileged;
  }, [item, user, isFromTutoria]);

  // -----------------------------------------------------------------
  // DERIVADOS
  // -----------------------------------------------------------------
  const priority = item?.priority;
  const visualConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.informative;
  const senderName = getFullName(item?.sender);
  const senderRole = item?.sender?.role;
  const roleLabel = senderRole ? ROLE_LABELS[senderRole] || senderRole : null;
  const createdAt = item?.createdAt ? new Date(item.createdAt) : null;
  const expiresAt = item?.expiresAt ? new Date(item.expiresAt) : null;

  // Target audience info.
  const isGroupTarget = item?.targetType === 'group';
  const isStudentTarget = item?.targetType === 'student';
  const isGeneral = item?.targetType === 'general';
  const targetGroups = item?.targetGroups || [];
  const targetStudents = item?.targetStudents || [];

  // -----------------------------------------------------------------
  // HANDLER: Abrir modal de edición
  // -----------------------------------------------------------------
  const openEditModal = useCallback(() => {
    if (!item) return;
    setEditTitle(item.title || '');
    setEditMessage(item.message || '');
    setEditPriority(item.priority || 'informative');
    setIsEditModalVisible(true);
  }, [item]);

  // -----------------------------------------------------------------
  // HANDLER: Guardar edición
  // -----------------------------------------------------------------
  const handleSaveEdit = useCallback(async () => {
    if (!editTitle.trim() || !editMessage.trim()) {
      Alert.alert('Campos requeridos', 'El título y el mensaje son obligatorios.');
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    try {
      const result = await updateTeacherAnnouncement(id, {
        title: editTitle.trim(),
        message: editMessage.trim(),
        priority: editPriority,
      });

      if (!result.success) {
        Alert.alert('No se pudo guardar', result.message);
        return;
      }

      // Actualizar el item local con los nuevos datos.
      setItem((prev) => ({
        ...prev,
        title: editTitle.trim(),
        message: editMessage.trim(),
        priority: editPriority,
      }));
      setIsEditModalVisible(false);
    } catch (err) {
      console.error('[TeacherAnnouncementDetail] save error:', err);
      Alert.alert('Error inesperado', 'Ocurrió un error al guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  }, [id, editTitle, editMessage, editPriority, isSaving]);

  // -----------------------------------------------------------------
  // HANDLER: Eliminar aviso
  // -----------------------------------------------------------------
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Eliminar aviso',
      '¿Estás seguro de que deseas eliminar este aviso? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (isDeleting) return;
            setIsDeleting(true);
            try {
              const result = await deleteTeacherAnnouncement(id);
              if (!result.success) {
                Alert.alert('No se pudo eliminar', result.message);
                setIsDeleting(false);
                return;
              }
              router.back();
            } catch (err) {
              console.error('[TeacherAnnouncementDetail] delete error:', err);
              Alert.alert('Error inesperado', 'Ocurrió un error al eliminar el aviso.');
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  }, [id, isDeleting, router]);

  // -----------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------
  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* ============================================================
          HEADER FIJO — EdukControl brand + Bell
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
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
      >
        {/* SCHOOL INFO CARD */}
        <SchoolInfoCard
          school={school}
          isLoading={!school}
          className="mx-4 mt-4"
          teacher={dashboardData?.teacher}
          date={currentDate}
        />

        {/* BACK BUTTON */}
        <View className="px-4 py-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="flex-row items-center self-start"
            accessibilityRole="button"
            accessibilityLabel="Volver al listado de avisos"
          >
            <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
            <Text className="text-sm font-semibold text-sky-600 ml-1">
              Volver
            </Text>
          </Pressable>
        </View>

        {/* --- Loading inicial --- */}
        {isLoading && !item && (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#0284C7" />
            <Text className="text-sm text-[#64748B] mt-3 font-medium">
              Cargando aviso...
            </Text>
          </View>
        )}

        {/* --- Error sin data previa --- */}
        {!isLoading && error && !item && (
          <View
            className="bg-white rounded-2xl p-6 items-center mx-4 mt-4"
            style={{ elevation: 2 }}
          >
            <AlertCircle size={32} color="#C76F02" strokeWidth={2} />
            <Text className="text-sm font-semibold text-[#0F172A] mt-3 text-center">
              No se pudo cargar el aviso
            </Text>
            <Text className="text-xs text-[#64748B] mt-1 text-center">
              {error}
            </Text>
            <Pressable
              onPress={fetchDetail}
              className="flex-row items-center mt-4 px-4 py-2 bg-[#0284C7] rounded-xl"
              accessibilityRole="button"
              accessibilityLabel="Reintentar carga del aviso"
            >
              <RefreshCw size={14} color="#ffffff" strokeWidth={2.5} />
              <Text className="text-sm font-semibold text-white ml-1.5">
                Reintentar
              </Text>
            </Pressable>
          </View>
        )}

        {/* ============================================================
            DATA OK: RENDER DEL DETALLE
            ============================================================ */}
        {!isLoading && !error && item && (
          <View className="px-4 pt-2">
            {/* ========================================================
                HEADER: badge prioridad + fecha corta
                ======================================================== */}
            <View className="flex-row items-center justify-between">
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: visualConfig.badgeBg }}
              >
                <Text
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: visualConfig.badgeText }}
                >
                  {formatPriorityLabel(item.priority)}
                </Text>
              </View>
              <Text className="text-xs font-medium text-[#94A3B8]">
                {formatDateShort(item.createdAt)}
              </Text>
            </View>

            {/* ========================================================
                CARD TÍTULO
                ======================================================== */}
            <View
              className={clsx(
                'bg-white rounded-2xl p-5 mt-4 shadow-sm',
                'border border-[#F1F5F9]',
                'border-r-4',
                visualConfig.rightBorderClass,
              )}
              style={{ elevation: 2 }}
            >
              <Text className="text-[10px] font-bold uppercase tracking-wider text-[#275972]">
                Título
              </Text>
              <Text className="text-lg font-bold text-[#0F172A] mt-1 leading-tight">
                {item.title || 'Sin título'}
              </Text>
            </View>

            {/* ========================================================
                CARD "DE:" (sender + role)
                ======================================================== */}
            <View
              className={clsx(
                'bg-white rounded-2xl p-4 mt-3 shadow-sm',
                'border border-[#F1F5F9]',
                'border-r-4',
                visualConfig.rightBorderClass,
                'flex-row items-center',
              )}
              style={{ elevation: 1 }}
            >
              <View className="w-11 h-11 rounded-full bg-[#E0F2FE] items-center justify-center mr-3">
                <User size={20} color="#0284C7" strokeWidth={2.25} />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-[#275972]">
                  De
                </Text>
                <Text className="text-base font-semibold text-[#0F172A] mt-0.5">
                  {senderName || 'Remitente no especificado'}
                </Text>
                {roleLabel && (
                  <Text className="text-xs text-[#64748B] mt-0.5">
                    {roleLabel}
                  </Text>
                )}
              </View>
            </View>

            {/* ========================================================
                CARD "PARA:" (targetGroups o targetStudents)
                ======================================================== */}
            {(isGroupTarget || isStudentTarget || isGeneral) && (
              <View
                className={clsx(
                  'bg-white rounded-2xl p-4 mt-3 shadow-sm',
                  'border border-[#F1F5F9]',
                  'border-r-4',
                  visualConfig.rightBorderClass,
                )}
                style={{ elevation: 1 }}
              >
                <View className="flex-row items-center">
                  <View className="w-11 h-11 rounded-full bg-[#F1F5F9] items-center justify-center mr-3">
                    {isGeneral ? (
                      <Megaphone size={20} color="#275972" strokeWidth={2.25} />
                    ) : isGroupTarget ? (
                      <Users size={20} color="#275972" strokeWidth={2.25} />
                    ) : (
                      <User size={20} color="#275972" strokeWidth={2.25} />
                    )}
                  </View>
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-[#275972]">
                    Para
                  </Text>
                </View>

                <View className="mt-2 ml-14">
                  {isStudentTarget && targetStudents.length > 0 ? (
                    <>
                      {targetStudents.map((s, idx) => (
                        <Text
                          key={s._id || idx}
                          className="text-base font-semibold text-[#0F172A]"
                          style={{ lineHeight: 24 }}
                        >
                          {s.first_name} {s.last_name}
                        </Text>
                      ))}
                      <Text className="text-xs text-[#64748B] mt-1">
                        {targetStudents.length} alumno{targetStudents.length !== 1 ? 's' : ''}
                      </Text>
                    </>
                  ) : (
                    <Text className="text-base font-semibold text-[#0F172A]">
                      {isGeneral
                        ? 'General (toda la escuela)'
                        : isGroupTarget
                          ? targetGroups.map((g) => `${g.grade}°${g.section}`).join(', ') || 'Grupos'
                          : 'Sin destinatarios'}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* ========================================================
                CARD "MENSAJE" (body completo)
                ======================================================== */}
            <View
              className={clsx(
                'bg-white rounded-2xl p-4 mt-3 shadow-sm',
                'border border-[#F1F5F9]',
                'border-r-4',
                visualConfig.rightBorderClass,
              )}
              style={{ elevation: 1 }}
            >
              <Text className="text-[10px] font-bold uppercase tracking-wider text-[#275972]">
                Mensaje
              </Text>
              <Text className="text-[15px] text-[#334155] mt-2 leading-relaxed">
                {item.message || ''}
              </Text>
            </View>

            {/* ========================================================
                READ COUNT (si está disponible)
                ======================================================== */}
            {item.totalRecipients != null && (
              <View
                className={clsx(
                  'bg-white rounded-2xl p-4 mt-3 shadow-sm',
                  'border border-[#F1F5F9]',
                  'border-r-4',
                  visualConfig.rightBorderClass,
                  'flex-row items-center',
                )}
                style={{ elevation: 1 }}
              >
                <View className="w-11 h-11 rounded-full bg-[#F0FDF4] items-center justify-center mr-3">
                  <CheckCircle2 size={20} color="#16A34A" strokeWidth={2.25} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-[#275972]">
                    Lecturas
                  </Text>
                  <Text className="text-base font-semibold text-[#0F172A] mt-0.5">
                    {item.readCount != null
                      ? `${item.readCount} / ${item.totalRecipients}`
                      : `${item.totalRecipients} destinatarios`}
                  </Text>
                </View>
              </View>
            )}

            {/* ========================================================
                META: Publicado / Expira
                ======================================================== */}
            <View className="mt-5 px-1">
              {createdAt && (
                <View className="flex-row items-center">
                  <Calendar size={13} color="#94A3B8" strokeWidth={2} />
                  <Text className="text-xs text-[#94A3B8] ml-1.5">
                    Publicado: {formatFullDateTime(createdAt)}
                  </Text>
                </View>
              )}
              {expiresAt && (
                <View className="flex-row items-center mt-1.5">
                  <Clock size={13} color="#94A3B8" strokeWidth={2} />
                  <Text className="text-xs text-[#94A3B8] ml-1.5">
                    Expira: {formatFullDateTime(expiresAt)}
                  </Text>
                </View>
              )}
            </View>

            {/* ========================================================
                BOTONES EDITAR / ELIMINAR (full-width, solo si canEdit)
                ========================================================
                Botones apilados verticalmente, al ancho completo,
                al final del detalle. Uno debajo del otro.
                ======================================================== */}
            {canEdit && (
              <View className="mt-6 mb-2 gap-3">
                <Pressable
                  onPress={openEditModal}
                  className="flex-row items-center justify-center py-3.5 rounded-2xl bg-[#0284C7]"
                  style={{ elevation: 2 }}
                  accessibilityRole="button"
                  accessibilityLabel="Editar aviso"
                >
                  <Pencil size={16} color="#ffffff" strokeWidth={2.5} />
                  <Text className="text-[15px] font-bold text-white ml-2">
                    Editar Aviso
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  disabled={isDeleting}
                  className="flex-row items-center justify-center py-3.5 rounded-2xl bg-white border border-[#FECACA]"
                  style={{ elevation: 1, opacity: isDeleting ? 0.5 : 1 }}
                  accessibilityRole="button"
                  accessibilityLabel="Eliminar aviso"
                >
                  <Trash2 size={16} color="#DC2626" strokeWidth={2.5} />
                  <Text className="text-[15px] font-bold text-[#DC2626] ml-2">
                    {isDeleting ? 'Eliminando...' : 'Eliminar Aviso'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ============================================================
          MODAL DE EDICIÓN
          ============================================================
          Bottom-sheet modal con formulario de edición.
          Solo permite editar title, message, priority.
          Los targets (grupos/alumnos) NO se pueden cambiar.
          ============================================================ */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditModalVisible(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
            }}
            onPress={() => setIsEditModalVisible(false)}
          >
            <Pressable
              onPress={() => {}}
              className="bg-white w-full px-5"
              style={{
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingTop: 12,
                paddingBottom: insets.bottom + 8,
                maxHeight: '85%',
              }}
            >
              {/* Handle */}
              <View style={{
                width: 40, height: 4, backgroundColor: '#0284C7',
                borderRadius: 2, marginBottom: 16, alignSelf: 'center',
              }} />

              {/* Header del modal */}
              <View className="flex-row items-center justify-between mb-5">
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A' }}>
                  Editar Aviso
                </Text>
                <Pressable
                  onPress={() => setIsEditModalVisible(false)}
                  className="items-center justify-center"
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9' }}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar"
                  hitSlop={8}
                >
                  <X size={18} color="#64748B" strokeWidth={2.25} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* TÍTULO */}
                <Text
                  className="uppercase mb-2"
                  style={{ fontSize: 12, fontWeight: '700', color: '#275972', letterSpacing: 0.5 }}
                >
                  Título del aviso
                </Text>
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Título del aviso"
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1.5,
                    borderColor: '#E2E8F0',
                    borderRadius: 12,
                    padding: 14,
                    fontSize: 14,
                    color: '#0F172A',
                  }}
                  maxLength={200}
                />

                {/* PRIORIDAD */}
                <Text
                  className="uppercase mt-5 mb-2"
                  style={{ fontSize: 12, fontWeight: '700', color: '#275972', letterSpacing: 0.5 }}
                >
                  Nivel de Prioridad
                </Text>
                <View
                  className="flex-row"
                  style={{ backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4 }}
                >
                  {PRIORITY_OPTIONS.map((option) => {
                    const isActive = editPriority === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setEditPriority(option.value)}
                        className="flex-1 items-center justify-center py-2.5"
                        style={{
                          backgroundColor: isActive
                            ? option.value === 'urgent' ? '#FEF2F2' : '#EFF6FF'
                            : 'transparent',
                          borderRadius: 8,
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                        accessibilityLabel={option.label}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: isActive ? '700' : '400',
                            color: isActive
                              ? option.value === 'urgent' ? '#DC2626' : '#2563EB'
                              : '#64748B',
                          }}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* MENSAJE */}
                <Text
                  className="uppercase mt-5 mb-2"
                  style={{ fontSize: 12, fontWeight: '700', color: '#275972', letterSpacing: 0.5 }}
                >
                  Mensaje
                </Text>
                <TextInput
                  value={editMessage}
                  onChangeText={setEditMessage}
                  placeholder="Escribe el mensaje del aviso..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1.5,
                    borderColor: '#E2E8F0',
                    borderRadius: 12,
                    padding: 14,
                    fontSize: 14,
                    height: 110,
                    textAlignVertical: 'top',
                    color: '#0F172A',
                  }}
                  maxLength={5000}
                />

                {/* BOTÓN GUARDAR */}
                <Pressable
                  onPress={handleSaveEdit}
                  disabled={isSaving}
                  className="flex-row items-center justify-center"
                  style={{
                    backgroundColor: isSaving ? '#7DD3FC' : '#0284C7',
                    height: 52,
                    borderRadius: 16,
                    marginTop: 20,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Guardar cambios"
                >
                  <Send
                    size={18}
                    color="#ffffff"
                    strokeWidth={2.25}
                    style={{ transform: [{ rotate: '-15deg' }], marginRight: 8 }}
                  />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#ffffff' }}>
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </Text>
                </Pressable>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
