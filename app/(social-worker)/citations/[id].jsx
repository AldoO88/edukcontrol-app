// =====================================================================
// app/(social-worker)/citations/[id].jsx
// ---------------------------------------------------------------------
// Pantalla de DETALLE de un citatorio del trabajador social.
//
// Ruta: /citations/:id
//
// El trabajador social toca una card del feed → se navega acá con el id.
// Esta pantalla carga el citatorio completo con getCitationById(id)
// y muestra:
//   - DashboardHeader (brand + Bell)
//   - SchoolInfoCard (escuela + fecha)
//   - Back button ("Volver")
//   - Hero: TYPE badge + STATUS badge
//   - Nombre del alumno + grupo + materia + creador
//   - Card: Detalles de la Cita (fecha, hora, lugar)
//   - Card: Motivo / Notas (si existe)
//   - Card: Historial del Citatorio (timeline)
//   - Botones Editar/Reagendar/Eliminar (solo si canEdit)
//
// Permisos (canEdit):
//   - Solo el creador del citatorio puede editar/reagendar/eliminar.
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
  Alert,
} from 'react-native';

// useRouter y useLocalSearchParams de expo-router.
import { useRouter, useLocalSearchParams } from 'expo-router';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Iconos Lucide.
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Activity,
  RefreshCw,
  XCircle,
  FileText,
  Pencil,
  Trash2,
  AlertCircle,
} from 'lucide-react-native';

// Componentes compartidos.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Hooks.
import { useAuth } from '@/src/hooks/useAuth';
import { useSocialWorkerDashboard } from '@/src/hooks/useSocialWorkerDashboard';

// Service del trabajador social.
import {
  getCitationById,
  updateCitation,
  rescheduleCitation,
  cancelCitation,
} from '@/src/services/socialWorkerService';

// Modales reutilizados del teacher (con services inyectados).
import EditCitationModal from '@/app/(teacher)/_components/EditCitationModal';
import RescheduleModal from '@/app/(teacher)/_components/RescheduleModal';

// Helpers.
import {
  STATUS_STYLES,
  TYPE_STYLES,
  formatDate,
  formatTime12,
  normalizeCitation,
  HISTORY_EVENT_LABELS,
} from '@/src/utils/citationHelpers';

// =====================================================================
// ACTION_MAP — acciones del trabajador social por status del citatorio.
// =====================================================================
// El trabajador social solo puede: Editar, Reagendar (desde confirmed),
// Cancelar (solo desde pending).
// NO puede Confirmar Asistencia ni Marcar como Atendido (eso es del teacher).
// NO puede Eliminar (solo super_admin).
// =====================================================================
const ACTION_MAP = {
  pending: [
    { id: 'edit', label: 'Editar Citatorio', Icon: Pencil, variant: 'outline' },
    { id: 'reschedule', label: 'Reagendar', Icon: RefreshCw, variant: 'outline' },
    { id: 'cancel', label: 'Cancelar Citatorio', Icon: Trash2, variant: 'danger' },
  ],
  confirmed: [
    { id: 'edit', label: 'Editar Citatorio', Icon: Pencil, variant: 'outline' },
    { id: 'reschedule', label: 'Reagendar', Icon: RefreshCw, variant: 'outline' },
  ],
  completed: [],
  no_show: [
    { id: 'reschedule', label: 'Reagendar', Icon: RefreshCw, variant: 'primary' },
  ],
  expired: [
    { id: 'reschedule', label: 'Reagendar', Icon: RefreshCw, variant: 'primary' },
  ],
  cancelled: [],
};

// Style variants para los botones de acción.
const ACTION_STYLES = {
  primary: { bg: '#0284C7', fg: '#FFFFFF' },
  outline: { bg: '#FFFFFF', fg: '#0F172A', border: '#E2E8F0' },
  danger: { bg: '#FFFFFF', fg: '#DC2626', border: '#DC2626' },
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function SocialWorkerCitationDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // -----------------------------------------------------------------
  // USUARIO ACTUAL (para permisos canEdit)
  // -----------------------------------------------------------------
  const { user } = useAuth();

  // -----------------------------------------------------------------
  // DATA DE LA ESCUELA (para el SchoolInfoCard)
  // -----------------------------------------------------------------
  const { data: dashboardData } = useSocialWorkerDashboard();

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
  const [rawCitation, setRawCitation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Action state.
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Modal states.
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  // -----------------------------------------------------------------
  // FETCH DEL DETALLE
  // -----------------------------------------------------------------
  const fetchDetail = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      setError('Falta el identificador del citatorio.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getCitationById(id);
      if (result.success) {
        setRawCitation(result.data);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('[SocialWorkerCitationDetail] unexpected error:', err);
      setError('Error inesperado al cargar el citatorio.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Fetch al montar y cuando cambia el id.
  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // -----------------------------------------------------------------
  // PERMISOS — solo el creador puede editar/eliminar
  // -----------------------------------------------------------------
  const canEdit = useMemo(() => {
    if (!rawCitation || !user) return false;
    return rawCitation.creator?._id === user.id;
  }, [rawCitation, user]);

  // -----------------------------------------------------------------
  // NORMALIZAR para UI
  // -----------------------------------------------------------------
  const citatorio = useMemo(
    () => (rawCitation ? normalizeCitation(rawCitation) : null),
    [rawCitation],
  );

  // -----------------------------------------------------------------
  // DERIVADOS
  // -----------------------------------------------------------------
  const statusStyle = citatorio
    ? STATUS_STYLES[citatorio.status] || STATUS_STYLES.pending
    : STATUS_STYLES.pending;
  const typeStyle = citatorio
    ? TYPE_STYLES[citatorio.type] || {
        bg: '#F1F5F9',
        fg: '#475569',
        border: '#94A3B8',
        label: citatorio.type || '—',
      }
    : { bg: '#F1F5F9', fg: '#475569', border: '#94A3B8', label: '—' };
  const StatusIcon = statusStyle.Icon;
  const actions = canEdit ? (ACTION_MAP[citatorio?.status] || []) : [];

  // -----------------------------------------------------------------
  // HANDLER: Acciones del citatorio
  // -----------------------------------------------------------------
  const handleAction = useCallback(async (actionId) => {
    if (!citatorio?.id) return;

    // Edit y Reagendar abren modales.
    if (actionId === 'edit') {
      setIsEditModalOpen(true);
      return;
    }
    if (actionId === 'reschedule') {
      setIsRescheduleModalOpen(true);
      return;
    }

    // Cancel pide confirmación.
    if (actionId === 'cancel') {
      Alert.alert(
        'Cancelar Citatorio',
        '¿Estás seguro de que deseas cancelar este citatorio?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Sí, cancelar',
            style: 'destructive',
            onPress: async () => {
              setActionLoading(true);
              setActionError(null);
              const result = await cancelCitation(citatorio.id);
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
      return;
    }
  }, [citatorio, router]);

  // -----------------------------------------------------------------
  // RENDER: loading
  // -----------------------------------------------------------------
  if (isLoading) {
    return (
      <View className="flex-1 bg-[#F8FAFC]">
        <DashboardHeader />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0284C7" />
          <Text className="text-sm text-[#64748B] mt-3 font-medium">
            Cargando citatorio...
          </Text>
        </View>
      </View>
    );
  }

  // -----------------------------------------------------------------
  // RENDER: error
  // -----------------------------------------------------------------
  if (error || !citatorio) {
    return (
      <View className="flex-1 bg-[#F8FAFC]">
        <DashboardHeader />
        <View className="flex-1 items-center justify-center px-6">
          <AlertCircle size={40} color="#F59E0B" strokeWidth={1.5} />
          <Text className="text-[14px] font-semibold text-[#0F172A] mt-3 text-center">
            {error || 'Citatorio no encontrado'}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-4 px-5 py-2 rounded-full bg-[#0284C7]"
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
    <View className="flex-1 bg-[#F8FAFC]">
      {/* ============================================================
          CHROME COMPARTIDO
          ============================================================ */}
      <DashboardHeader />
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-4"
        teacher={dashboardData?.socialWorker}
        date={currentDate}
        user={user}
      />

      {/* ============================================================
          CONTENIDO SCROLLEABLE
          ============================================================ */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
      >
        {/* BACK BUTTON */}
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver al listado de citatorios"
          className="flex-row items-center px-4 mt-4"
        >
          <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
          <Text className="text-sm font-semibold text-sky-600 ml-1">
            Volver
          </Text>
        </Pressable>

        {/* Título */}
        <View className="px-4 mt-2 mb-1">
          <Text className="text-xl font-bold text-slate-900">Detalle del Citatorio</Text>
        </View>

        {/* ============================================================
            HERO: TYPE badge + STATUS badge
            ============================================================ */}
        <View
          className="bg-white rounded-2xl p-4 mx-4 mt-2 border border-slate-100"
          style={{
            borderLeftWidth: 4,
            borderLeftColor: typeStyle.border,
            shadowColor: '#0F172A',
            shadowOpacity: 0.04,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        >
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {/* Type pill. */}
            <View
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: typeStyle.bg }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: typeStyle.fg,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                {typeStyle.label}
              </Text>
            </View>

            {/* Status pill. */}
            <View
              className="flex-row items-center px-2.5 py-1 rounded-full"
              style={{ backgroundColor: statusStyle.bg }}
            >
              <StatusIcon size={12} color={statusStyle.fg} strokeWidth={2.5} />
              <Text
                className="ml-1"
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: statusStyle.fg,
                  letterSpacing: 0.3,
                }}
              >
                {statusStyle.label}
              </Text>
            </View>
          </View>

          {/* Nombre del alumno. */}
          <Text
            className="mt-3 text-slate-900"
            style={{ fontSize: 18, fontWeight: '800' }}
            numberOfLines={2}
          >
            {citatorio.studentName}
          </Text>

          {/* Group + subject. */}
          <Text
            className="mt-1 text-slate-500"
            style={{ fontSize: 13, fontWeight: '500' }}
            numberOfLines={1}
          >
            {citatorio.subject
              ? `${citatorio.groupName}  •  ${citatorio.subject}`
              : citatorio.groupName || ''}
          </Text>

          {/* Creator. */}
          {citatorio.creatorName ? (
            <View className="flex-row items-center mt-2">
              <Users size={13} color="#64748B" strokeWidth={2} />
              <Text
                className="ml-1.5 text-slate-500"
                style={{ fontSize: 12, fontWeight: '500' }}
              >
                {`Creado por: ${citatorio.creatorName}`}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ============================================================
            APPOINTMENT CARD (fecha + hora + lugar).
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
            Detalles de la Cita
          </Text>

          {/* Date. */}
          <View className="flex-row items-center mt-2">
            <Calendar size={15} color="#64748B" strokeWidth={2} />
            <Text
              className="ml-2 text-slate-900"
              style={{ fontSize: 14, fontWeight: '700' }}
            >
              {formatDate(citatorio.date)}
            </Text>
          </View>

          {/* Time. */}
          <View className="flex-row items-center mt-1.5">
            <Clock size={15} color="#64748B" strokeWidth={2} />
            <Text
              className="ml-2 text-slate-900"
              style={{ fontSize: 14, fontWeight: '700' }}
            >
              {formatTime12(citatorio.time)}
            </Text>
          </View>

          {/* Location. */}
          {citatorio.location ? (
            <View className="flex-row items-center mt-1.5">
              <MapPin size={15} color="#64748B" strokeWidth={2} />
              <Text
                className="ml-2 text-slate-900"
                style={{ fontSize: 14, fontWeight: '700' }}
                numberOfLines={1}
              >
                {citatorio.location}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ============================================================
            RESCHEDULE BANNER
            ============================================================ */}
        {citatorio.rescheduleRequested ? (
          <View
            className="mx-4 mt-3 rounded-2xl p-4 border"
            style={{
              backgroundColor: '#FEF3C7',
              borderColor: '#F59E0B',
              borderWidth: 1,
            }}
          >
            <View className="flex-row items-center mb-2">
              <RefreshCw size={14} color="#92400E" strokeWidth={2.25} />
              <Text
                className="ml-1.5"
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: '#92400E',
                  textTransform: 'uppercase',
                  letterSpacing: 0.3,
                }}
              >
                Solicitud de Reagendación Pendiente
              </Text>
            </View>
            {citatorio.rescheduleReason ? (
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '500',
                  color: '#78350F',
                  lineHeight: 18,
                }}
              >
                {`Motivo del tutor: "${citatorio.rescheduleReason}"`}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* ============================================================
            REASON CARD
            ============================================================ */}
        {citatorio.reason ? (
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
            <View className="flex-row items-center mb-2">
              <FileText size={14} color="#0284C7" strokeWidth={2.25} />
              <Text
                className="ml-1.5 text-slate-500"
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Motivo / Notas
              </Text>
            </View>
            <Text
              className="text-slate-900"
              style={{ fontSize: 13, fontWeight: '500', lineHeight: 19 }}
            >
              {citatorio.reason}
            </Text>
          </View>
        ) : null}

        {/* ============================================================
            WORKFLOW TIMELINE
            ============================================================ */}
        {Array.isArray(citatorio.history) && citatorio.history.length > 0 ? (
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
            <View className="flex-row items-center mb-3">
              <Activity size={14} color="#0284C7" strokeWidth={2.25} />
              <Text
                className="ml-1.5 text-slate-500"
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Historial del Citatorio
              </Text>
            </View>

            {citatorio.history.map((event, index) => {
              const isLast = index === citatorio.history.length - 1;
              const eventLabel =
                HISTORY_EVENT_LABELS[event.event] || event.event;
              return (
                <View key={index} className="flex-row">
                  {/* Columna timeline: bullet + vertical line. */}
                  <View className="items-center" style={{ width: 14 }}>
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#0284C7',
                        marginTop: 4,
                      }}
                    />
                    {!isLast ? (
                      <View
                        style={{
                          flex: 1,
                          width: 2,
                          backgroundColor: '#E2E8F0',
                          marginTop: 4,
                        }}
                      />
                    ) : null}
                  </View>

                  {/* Contenido: timestamp + actor + event + note. */}
                  <View className="flex-1 pb-3">
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: '#0284C7',
                      }}
                    >
                      {event.ts}
                    </Text>
                    <Text
                      className="mt-0.5 text-slate-900"
                      style={{ fontSize: 13, fontWeight: '600' }}
                    >
                      {eventLabel}
                    </Text>
                    <Text
                      className="mt-0.5 text-slate-500"
                      style={{ fontSize: 11, fontWeight: '500' }}
                    >
                      {event.actor}
                    </Text>
                    {event.note ? (
                      <Text
                        className="mt-1 text-slate-600 italic"
                        style={{ fontSize: 12, lineHeight: 17 }}
                      >
                        {`"${event.note}"`}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* ============================================================
            ACTIONS (solo si canEdit)
            ============================================================ */}
        {canEdit && (
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
              Acciones del Trabajador Social
            </Text>

            {actions.length === 0 ? (
              <View
                className="bg-white rounded-2xl p-6 items-center border border-slate-100"
                style={{
                  shadowColor: '#0F172A',
                  shadowOpacity: 0.04,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 1,
                }}
              >
                <Text
                  className="text-slate-500"
                  style={{ fontSize: 13, fontWeight: '600' }}
                >
                  Sin acciones disponibles
                </Text>
                <Text
                  className="text-slate-400 mt-1 text-center"
                  style={{ fontSize: 11 }}
                >
                  Este citatorio está en un estado terminal.
                </Text>
              </View>
            ) : (
              <>
                {actionError && (
                  <Text
                    className="text-rose-600 text-center mb-2"
                    style={{ fontSize: 12 }}
                  >
                    {actionError}
                  </Text>
                )}
                <View style={{ gap: 8 }}>
                  {actions.map((action) => {
                    const style = ACTION_STYLES[action.variant] || ACTION_STYLES.primary;
                    const isOutline = action.variant === 'outline';
                    const isDanger = action.variant === 'danger';
                    return (
                      <Pressable
                        key={action.id}
                        onPress={() => handleAction(action.id)}
                        disabled={actionLoading}
                        accessibilityRole="button"
                        accessibilityLabel={action.label}
                        className="flex-row items-center justify-center py-3 rounded-xl"
                        style={{
                          backgroundColor: actionLoading ? '#94A3B8' : style.bg,
                          borderWidth: isOutline || isDanger ? 1.5 : 0,
                          borderColor: style.border,
                          opacity: actionLoading ? 0.7 : 1,
                        }}
                      >
                        {actionLoading ? (
                          <ActivityIndicator size="small" color={style.fg} />
                        ) : (
                          <>
                            <action.Icon
                              size={16}
                              color={style.fg}
                              strokeWidth={2.25}
                            />
                            <Text
                              className="ml-1.5"
                              style={{
                                fontSize: 13,
                                fontWeight: '700',
                                color: style.fg,
                              }}
                            >
                              {action.label}
                            </Text>
                          </>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* ============================================================
          MODAL: Editar Citatorio
          ============================================================ */}
      <EditCitationModal
        isVisible={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={fetchDetail}
        citation={{
          id: citatorio?.id,
          reason: citatorio?.reason || '',
          location: citatorio?.location || '',
          type: citatorio?.type || 'academic',
          subject: rawCitation?.subject,
          groupName: citatorio?.groupName || '',
        }}
        updateCitationFn={updateCitation}
        fetchGroupsFn={async () => {
          const { getGroups } = await import('@/src/services/socialWorkerService');
          const result = await getGroups();
          if (result.success) {
            const groups = (result.data || []).map((g) => ({
              ...g,
              label: g.type === 'taller' ? g.section : `${g.grade}°${g.section}`,
              subjects: g.subjects || [],
            }));
            return { success: true, data: { groups } };
          }
          return { success: false, data: { groups: [] } };
        }}
        allowedTypes={['behavioral', 'administrative']}
      />

      {/* ============================================================
          MODAL: Reagendar Citatorio
          ============================================================ */}
      <RescheduleModal
        isVisible={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        onRescheduled={fetchDetail}
        citationId={citatorio?.id}
        currentDate={citatorio?.date || ''}
        currentTime={citatorio?.time || ''}
        currentLocation={citatorio?.location || ''}
        rescheduleCitationFn={rescheduleCitation}
      />
    </View>
  );
}
