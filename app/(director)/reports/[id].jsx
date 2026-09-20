// =====================================================================
// app/(director)/reports/[id].jsx
// ---------------------------------------------------------------------
// Pantalla de DETALLE de un reporte de conducta.
//
// Ruta: /reports/:id
//
// El trabajador social toca una card del feed → se navega acá con el id.
// Esta pantalla carga el reporte completo con getConductLogById(id)
// y muestra:
//   - DashboardHeader (brand + Bell)
//   - SchoolInfoCard (escuela + fecha)
//   - Back button ("Volver")
//   - Hero: EVENT TYPE badge + STATUS badge
//   - Nombre del alumno + grupo
//   - Card: Detalles del Reporte (tipo, gravedad, puntos)
//   - Card: Descripción
//   - Card: Informe por (staff)
//   - Botones Cancelar/Eliminar (solo si el rol lo permite)
//
// Permisos backend:
//   - Cancelar: admin, principal, registrar, super_admin
//   - Eliminar: super_admin only
//   - Trabajador social: solo lectura (no puede cancelar ni eliminar)
// =====================================================================

// React + hooks.
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
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
  ChevronLeft,
  TrendingUp,
  XCircle,
  Users,
  FileText,
  Trash2,
  AlertCircle,
  X,
  Pencil,
  Check,
} from 'lucide-react-native';

// Componentes compartidos.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Hooks.
import { useAuth } from '@/src/hooks/useAuth';
import { useDirectorDashboard } from '@/src/hooks/useDirectorDashboard';

// Service del trabajador social.
import {
  getConductLogById,
  cancelConductLog,
  deleteConductLog,
  updateConductLog,
} from '@/src/services/directorService';

// ---------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------
const EVENT_TYPES = {
  demerit: { label: 'Demérito', icon: XCircle, color: '#E11D48', bg: '#FEE2E2' },
  merit: { label: 'Mérito', icon: TrendingUp, color: '#047857', bg: '#D1FAE5' },
};

const SEVERITY_LABELS = {
  minor: 'Menor',
  moderate: 'Moderado',
  severe: 'Grave',
};

const STATUS_CONFIG = {
  active: { bg: '#D1FAE5', fg: '#047857', label: 'Activo' },
  cancelled: { bg: '#F1F5F9', fg: '#64748B', label: 'Cancelado' },
};

// Roles que pueden cancelar (backend CANCEL_ROLES + creador).
const CAN_CANCEL_ROLES = ['admin', 'principal', 'registrar', 'super_admin'];
// Roles que pueden eliminar (solo super_admin).
const CAN_DELETE_ROLES = ['super_admin'];

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function DirectorReportDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // -----------------------------------------------------------------
  // USUARIO ACTUAL (para permisos)
  // -----------------------------------------------------------------
  const { user } = useAuth();

  // -----------------------------------------------------------------
  // DATA DE LA ESCUELA (para el SchoolInfoCard)
  // -----------------------------------------------------------------
  const { data: dashboardData } = useDirectorDashboard();

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
  const [log, setLog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Action state.
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // -----------------------------------------------------------------
  // FETCH DEL DETALLE
  // -----------------------------------------------------------------
  const fetchDetail = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      setError('Falta el identificador del reporte.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getConductLogById(id);
      if (result.success) {
        setLog(result.data);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('[DirectorReportDetail] unexpected error:', err);
      setError('Error inesperado al cargar el reporte.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Fetch al montar y cuando cambia el id.
  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // -----------------------------------------------------------------
  // PERMISOS — basados en el rol del usuario y si es el creador
  // -----------------------------------------------------------------
  const isCreator = useMemo(() => {
    if (!log || !user) return false;
    return log.reported_by?._id === user.id;
  }, [log, user]);

  const canEdit = useMemo(() => {
    if (!log || !user) return false;
    // Solo el creador puede editar la descripción
    return isCreator && log.status === 'active';
  }, [log, user, isCreator]);

  const canCancel = useMemo(() => {
    if (!log || !user) return false;
    // El creador puede cancelar su propio reporte, o roles autorizados
    return isCreator || CAN_CANCEL_ROLES.includes(user.role);
  }, [log, user, isCreator]);

  const canDelete = useMemo(() => {
    if (!user) return false;
    return CAN_DELETE_ROLES.includes(user.role);
  }, [user]);

  // -----------------------------------------------------------------
  // STATE: Edición de descripción
  // -----------------------------------------------------------------
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');

  // -----------------------------------------------------------------
  // HANDLER: Editar descripción
  // -----------------------------------------------------------------
  const handleStartEdit = useCallback(() => {
    setEditedDescription(log?.description || '');
    setIsEditingDescription(true);
  }, [log]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingDescription(false);
    setEditedDescription('');
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!log?._id) return;
    if (!editedDescription.trim()) {
      Alert.alert('Campo requerido', 'La descripción no puede estar vacía.', [{ text: 'Entendido' }]);
      return;
    }

    setActionLoading(true);
    setActionError(null);
    const result = await updateConductLog(log._id, { description: editedDescription.trim() });
    if (result.success) {
      setIsEditingDescription(false);
      setEditedDescription('');
      fetchDetail();
    } else {
      setActionError(result.message);
    }
    setActionLoading(false);
  }, [log, editedDescription, fetchDetail]);

  // -----------------------------------------------------------------
  // HANDLER: Cancelar reporte
  // -----------------------------------------------------------------
  const handleCancel = useCallback(() => {
    if (!log?._id) return;

    Alert.alert(
      'Cancelar Reporte',
      '¿Estás seguro de que deseas cancelar este reporte? Se restaurarán los puntos del alumno.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            setActionError(null);
            const result = await cancelConductLog(log._id);
            if (result.success) {
              fetchDetail();
            } else {
              setActionError(result.message);
            }
            setActionLoading(false);
          },
        },
      ],
    );
  }, [log, fetchDetail]);

  // -----------------------------------------------------------------
  // HANDLER: Eliminar reporte
  // -----------------------------------------------------------------
  const handleDelete = useCallback(() => {
    if (!log?._id) return;

    Alert.alert(
      'Eliminar Reporte',
      '¿Estás seguro de que deseas eliminar este reporte? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            setActionError(null);
            const result = await deleteConductLog(log._id);
            if (result.success) {
              router.back();
            } else {
              setActionError(result.message);
            }
            setActionLoading(false);
          },
        },
      ],
    );
  }, [log, router]);

  // -----------------------------------------------------------------
  // DERIVADOS para UI
  // -----------------------------------------------------------------
  const event = log ? EVENT_TYPES[log.eventType] || EVENT_TYPES.demerit : EVENT_TYPES.demerit;
  const EventIcon = event.icon;
  const status = log ? STATUS_CONFIG[log.status] || STATUS_CONFIG.active : STATUS_CONFIG.active;

  const studentName = useMemo(() => {
    if (!log?.student_id) return 'Alumno';
    const s = log.student_id;
    if (s.first_name || s.last_name) {
      return `${s.last_name || ''} ${s.first_name || ''}`.trim() || 'Alumno';
    }
    return s.name || 'Alumno';
  }, [log]);

  const studentGroup = useMemo(() => {
    if (!log?.student_id?.current_group_id) return '';
    const g = log.student_id.current_group_id;
    return `${g.grade}°${g.section}`;
  }, [log]);

  const reporterName = useMemo(() => {
    if (!log?.reported_by) return '';
    const r = log.reported_by;
    return `${r.name || ''} ${r.last_name || ''}`.trim() || '';
  }, [log]);

  const formattedDate = useMemo(() => {
    if (!log?.createdAt) return '';
    return new Date(log.createdAt).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [log]);

  // -----------------------------------------------------------------
  // RENDER: loading
  // -----------------------------------------------------------------
  if (isLoading) {
    return (
      <View className="flex-1 bg-[#F8FAFC]">
        <DashboardHeader />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E11D48" />
          <Text className="text-sm text-[#64748B] mt-3 font-medium">
            Cargando reporte...
          </Text>
        </View>
      </View>
    );
  }

  // -----------------------------------------------------------------
  // RENDER: error
  // -----------------------------------------------------------------
  if (error || !log) {
    return (
      <View className="flex-1 bg-[#F8FAFC]">
        <DashboardHeader />
        <View className="flex-1 items-center justify-center px-6">
          <AlertCircle size={40} color="#F59E0B" strokeWidth={1.5} />
          <Text className="text-[14px] font-semibold text-[#0F172A] mt-3 text-center">
            {error || 'Reporte no encontrado'}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-4 px-5 py-2 rounded-full bg-[#E11D48]"
          >
            <Text className="text-white font-semibold text-[13px]">Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // -----------------------------------------------------------------
  // RENDER: detalle
  // -----------------------------------------------------------------
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 bg-[#F8FAFC]">
        {/* ============================================================
            CHROME COMPARTIDO
            ============================================================ */}
        <DashboardHeader />
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-4"
        teacher={dashboardData?.director}
        date={currentDate}
        user={user}
      />

      {/* ============================================================
          CONTENIDO SCROLLEABLE
          ============================================================ */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
      >
        {/* BACK BUTTON */}
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver al listado de reportes"
          className="flex-row items-center px-4 mt-4"
        >
          <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
          <Text className="text-sm font-semibold text-sky-600 ml-1">
            Volver
          </Text>
        </Pressable>

        {/* Título */}
        <View className="px-4 mt-2 mb-1">
          <Text className="text-xl font-bold text-slate-900">Detalle del Reporte</Text>
        </View>

        {/* ============================================================
            HERO: EVENT TYPE badge + STATUS badge
            ============================================================ */}
        <View
          className="bg-white rounded-2xl p-4 mx-4 mt-2 border border-slate-100"
          style={{
            borderLeftWidth: 4,
            borderLeftColor: event.color,
            shadowColor: '#0F172A',
            shadowOpacity: 0.04,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        >
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {/* Event type pill. */}
            <View
              className="flex-row items-center px-2.5 py-1 rounded-full"
              style={{ backgroundColor: event.bg }}
            >
              <EventIcon size={12} color={event.color} strokeWidth={2.5} />
              <Text
                className="ml-1"
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: event.color,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                {event.label}
              </Text>
            </View>

            {/* Status pill. */}
            <View
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: status.bg }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: status.fg,
                  letterSpacing: 0.3,
                }}
              >
                {status.label}
              </Text>
            </View>
          </View>

          {/* Nombre del alumno. */}
          <Text
            className="mt-3 text-slate-900"
            style={{ fontSize: 18, fontWeight: '800' }}
            numberOfLines={2}
          >
            {studentName}{studentGroup ? ` — ${studentGroup}` : ''}
          </Text>

          {/* Reporter. */}
          {reporterName ? (
            <View className="flex-row items-center mt-2">
              <Users size={13} color="#64748B" strokeWidth={2} />
              <Text
                className="ml-1.5 text-slate-500"
                style={{ fontSize: 12, fontWeight: '500' }}
              >
                {`Creado por: ${reporterName}`}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ============================================================
            DETAILS CARD (tipo, gravedad, puntos, fecha)
            ============================================================ */}
        <View
          className="bg-white rounded-2xl p-4 mx-4 mt-3 border border-slate-100"
          style={{
            shadowColor: '#0F172A',
            shadowOpacity: 0.04,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        >
          <Text
            className="text-slate-500 mb-2"
            style={{
              fontSize: 11,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Detalles del Reporte
          </Text>

          {/* Event type row. */}
          <View className="flex-row items-center mt-2">
            <View
              className="w-8 h-8 rounded-lg items-center justify-center"
              style={{ backgroundColor: event.bg }}
            >
              <EventIcon size={16} color={event.color} strokeWidth={2} />
            </View>
            <View className="ml-3">
              <Text className="text-slate-900" style={{ fontSize: 14, fontWeight: '700' }}>
                {event.label}
              </Text>
              {log.severity && (
                <Text className="text-slate-500" style={{ fontSize: 12, fontWeight: '500' }}>
                  Gravedad: {SEVERITY_LABELS[log.severity] || log.severity}
                </Text>
              )}
            </View>
          </View>

          {/* Points impact. */}
          {log.points_impact != null && (
            <View className="flex-row items-center mt-3">
              <View
                className="px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: log.eventType === 'demerit' ? '#FEF2F2' : '#ECFDF5',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '800',
                    color: log.eventType === 'demerit' ? '#E11D48' : '#047857',
                  }}
                >
                  {log.eventType === 'merit' ? '+' : '-'}{log.points_impact} puntos
                </Text>
              </View>
            </View>
          )}

          {/* Date. */}
          {formattedDate && (
            <Text className="text-[10px] text-slate-400 mt-3">{formattedDate}</Text>
          )}
        </View>

        {/* ============================================================
            DESCRIPTION CARD (con soporte de edición)
            ============================================================ */}
        <View
          className="bg-white rounded-2xl p-4 mx-4 mt-3 border border-slate-100"
          style={{
            shadowColor: '#0F172A',
            shadowOpacity: 0.04,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <FileText size={14} color="#E11D48" strokeWidth={2.25} />
              <Text
                className="ml-1.5 text-slate-500"
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Descripción
              </Text>
            </View>
            {canEdit && !isEditingDescription && (
              <Pressable
                onPress={handleStartEdit}
                hitSlop={8}
                className="flex-row items-center"
                accessibilityRole="button"
                accessibilityLabel="Editar descripción"
              >
                <Pencil size={12} color="#0284C7" strokeWidth={2} />
                <Text className="ml-1 text-sky-600" style={{ fontSize: 11, fontWeight: '600' }}>
                  Editar
                </Text>
              </Pressable>
            )}
          </View>

          {isEditingDescription ? (
            /* Modo edición */
            <View>
              <TextInput
                value={editedDescription}
                onChangeText={setEditedDescription}
                placeholder="Describe la incidencia..."
                placeholderTextColor="#94A3B8"
                multiline
                style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1.5,
                  borderColor: '#E2E8F0',
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 13,
                  height: 100,
                  textAlignVertical: 'top',
                  color: '#0F172A',
                  lineHeight: 19,
                }}
                maxLength={1000}
              />
              {actionError && (
                <Text className="text-rose-600 mt-1" style={{ fontSize: 11 }}>
                  {actionError}
                </Text>
              )}
              <View className="flex-row mt-3" style={{ gap: 8 }}>
                <Pressable
                  onPress={handleCancelEdit}
                  disabled={actionLoading}
                  className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: '#E2E8F0',
                  }}
                  accessibilityRole="button"
                >
                  <X size={14} color="#64748B" strokeWidth={2} />
                  <Text className="ml-1 text-slate-600" style={{ fontSize: 12, fontWeight: '600' }}>
                    Cancelar
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveEdit}
                  disabled={actionLoading}
                  className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl"
                  style={{
                    backgroundColor: actionLoading ? '#94A3B8' : '#0284C7',
                  }}
                  accessibilityRole="button"
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Check size={14} color="#ffffff" strokeWidth={2.5} />
                      <Text className="ml-1 text-white" style={{ fontSize: 12, fontWeight: '600' }}>
                        Guardar
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            /* Modo lectura */
            <Text
              className="text-slate-900"
              style={{ fontSize: 13, fontWeight: '500', lineHeight: 19 }}
            >
              {log.description || 'Sin descripción'}
            </Text>
          )}
        </View>

        {/* ============================================================
            ACTIONS (solo si el rol lo permite y el reporte está activo)
            ============================================================ */}
        {(canCancel || canDelete) && log.status === 'active' && (
          <View className="mx-4 mt-4">
            <Text
              className="text-slate-500 mb-2"
              style={{
                fontSize: 11,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Acciones
            </Text>

            {actionError && (
              <Text
                className="text-rose-600 text-center mb-2"
                style={{ fontSize: 12 }}
              >
                {actionError}
              </Text>
            )}

            <View style={{ gap: 8 }}>
              {/* Cancel button. */}
              {canCancel && (
                <Pressable
                  onPress={handleCancel}
                  disabled={actionLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar reporte"
                  className="flex-row items-center justify-center py-3 rounded-xl"
                  style={{
                    backgroundColor: actionLoading ? '#94A3B8' : '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: '#E11D48',
                    opacity: actionLoading ? 0.7 : 1,
                  }}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#E11D48" />
                  ) : (
                    <>
                      <X size={16} color="#E11D48" strokeWidth={2.25} />
                      <Text
                        className="ml-1.5"
                        style={{ fontSize: 13, fontWeight: '700', color: '#E11D48' }}
                      >
                        Cancelar Reporte
                      </Text>
                    </>
                  )}
                </Pressable>
              )}

              {/* Delete button. */}
              {canDelete && (
                <Pressable
                  onPress={handleDelete}
                  disabled={actionLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Eliminar reporte"
                  className="flex-row items-center justify-center py-3 rounded-xl"
                  style={{
                    backgroundColor: actionLoading ? '#94A3B8' : '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: '#DC2626',
                    opacity: actionLoading ? 0.7 : 1,
                  }}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#DC2626" />
                  ) : (
                    <>
                      <Trash2 size={16} color="#DC2626" strokeWidth={2.25} />
                      <Text
                        className="ml-1.5"
                        style={{ fontSize: 13, fontWeight: '700', color: '#DC2626' }}
                      >
                        Eliminar Reporte
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          </View>
        )}
      </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
