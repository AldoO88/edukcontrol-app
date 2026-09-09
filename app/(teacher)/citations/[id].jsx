// =====================================================================
// app/(teacher)/citations/[id].jsx
// ---------------------------------------------------------------------
// Ruta "/citations/:id" del route group (teacher). Pantalla de
// DETALLE de un citatorio específico.
//
// Estructura visual:
//
//   ┌────────────────────────────────────────┐
//   │ DashboardHeader + SchoolInfoCard       │
//   ├────────────────────────────────────────┤
//   │ < Volver  •  Detalle del Citatorio     │
//   ├────────────────────────────────────────┤
//   │ Hero: TYPE badge + STATUS badge        │
//   ├────────────────────────────────────────┤
//   │ Student card (nombre + grupo + creador)│
//   ├────────────────────────────────────────┤
//   │ Appointment card (fecha, hora, lugar) │
//   ├────────────────────────────────────────┤
//   │ Reason card (texto libre completo)    │
//   ├────────────────────────────────────────┤
//   │ Workflow timeline (history)            │
//   ├────────────────────────────────────────┤
//   │ Actions (dependientes del status)      │
//   └────────────────────────────────────────┘
//
// Recibe `id` por URL params. Carga el citatorio vía
// getTeacherCitationById(id) del service (conectado al backend).
//
// Acciones disponibles según status:
//   - pending   → [Reagendar] [Cancelar]
//   - confirmed → [Reagendar] [Cancelar]
//   - completed → sin acciones (estado terminal)
//   - no_show   → [Reagendar]
//   - expired   → [Reagendar]
//   - cancelled → sin acciones (estado terminal)
//
// Banner de reagendación: se muestra cuando rescheduleRequested === true.
// =====================================================================

// React + hooks.
import React, { useState, useEffect, useMemo } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Navegación.
import { useRouter, useLocalSearchParams } from 'expo-router';

// Iconos Lucide.
import {
  ChevronLeft,    // Back.
  Calendar,        // Fecha.
  Users,           // Grupo / location / creator.
  Clock,           // Hora.
  Activity,        // Workflow timeline.
  CheckCircle2,    // Confirmar / Marcar Atendido.
  AlertCircle,     // Pendiente / no_show.
  RefreshCw,       // Reagendar.
  XCircle,         // Cancelar.
  FileText,        // Reason / motivo.
  Pencil,          // Editar.
} from 'lucide-react-native';

// Hook del dashboard docente (escuela + maestro).
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Servicio + helpers del dominio de citaciones.
import {
  getTeacherCitationById,
  cancelCitation,
  updateCitationStatus,
} from '@/src/services/teacherService';

// Modal de reagendación.
import RescheduleModal from '@/app/(teacher)/_components/RescheduleModal';

// Modal de edición.
import EditCitationModal from '@/app/(teacher)/_components/EditCitationModal';
import {
  STATUS_STYLES,
  TYPE_STYLES,
  formatDate,
  formatTime12,
  normalizeCitation,
  HISTORY_EVENT_LABELS,
} from '@/src/utils/citationHelpers';
// ---------------------------------------------------------------------
// ACTION_MAP
// ---------------------------------------------------------------------
// Lista de acciones que el docente puede tomar según el `status` del
// citatorio. Cada acción tiene label + Icon + variant (primary | danger
// | outline). Cuando exista el endpoint, el onPress de cada Pressable
// disparará el PATCH/POST correspondiente.
// ---------------------------------------------------------------------
const ACTION_MAP = {
  pending: [
    {
      id: 'edit',
      label: 'Editar Citatorio',
      Icon: Pencil,
      variant: 'outline',
    },
    {
      id: 'confirm',
      label: 'Confirmar Asistencia',
      Icon: CheckCircle2,
      variant: 'primary',
    },
    {
      id: 'reschedule',
      label: 'Reagendar',
      Icon: RefreshCw,
      variant: 'outline',
    },
    {
      id: 'cancel',
      label: 'Cancelar Citatorio',
      Icon: XCircle,
      variant: 'danger',
    },
  ],
  confirmed: [
    {
      id: 'edit',
      label: 'Editar Citatorio',
      Icon: Pencil,
      variant: 'outline',
    },
    {
      id: 'mark_attended',
      label: 'Marcar como Atendido',
      Icon: CheckCircle2,
      variant: 'primary',
    },
    {
      id: 'mark_no_show',
      label: 'Tutor no se presentó',
      Icon: AlertCircle,
      variant: 'danger',
    },
    {
      id: 'reschedule',
      label: 'Reagendar',
      Icon: RefreshCw,
      variant: 'outline',
    },
  ],
  completed: [],
  no_show: [
    {
      id: 'reschedule',
      label: 'Reagendar',
      Icon: RefreshCw,
      variant: 'primary',
    },
  ],
  expired: [
    {
      id: 'reschedule',
      label: 'Reagendar',
      Icon: RefreshCw,
      variant: 'primary',
    },
  ],
  cancelled: [],
};

// Style variants para los botones de acción.
const ACTION_STYLES = {
  primary: { bg: '#0284C7', fg: '#FFFFFF' },
  outline: { bg: '#FFFFFF', fg: '#0F172A', border: '#E2E8F0' },
  danger:  { bg: '#FFFFFF', fg: '#DC2626', border: '#DC2626' },
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function CitatorioDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  // ID del citatorio viene como path param ([id].jsx).
  const citatorioId = params.id;

  // Indica si se accede desde el expediente de tutoría (modo solo lectura).
  const isFromTutoria = params.fromTutoria === 'true';

  // ============================================================
  // FETCH del citatorio desde el backend
  // ============================================================
  const [rawCitation, setRawCitation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!citatorioId) return;

    let cancelled = false;
    const fetchCitation = async () => {
      setIsLoading(true);
      setError(null);
      const result = await getTeacherCitationById(citatorioId);
      if (cancelled) return;
      if (result.success) {
        setRawCitation(result.data);
      } else {
        setError(result.message);
      }
      setIsLoading(false);
    };
    fetchCitation();
    return () => { cancelled = true; };
  }, [citatorioId]);

  // Normalizar el item del API al shape de UI.
  const citatorio = useMemo(
    () => (rawCitation ? normalizeCitation(rawCitation) : null),
    [rawCitation],
  );

  // ============================================================
  // ACTION STATE: loading + error para acciones del docente
  // ============================================================
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // ============================================================
  // RESCHEDULE MODAL STATE
  // ============================================================
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  // ============================================================
  // EDIT MODAL STATE
  // ============================================================
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // ============================================================
  // ACTION HANDLERS
  // ============================================================
  const handleAction = async (actionId) => {
    if (!citatorio?.id) return;
    setActionLoading(true);
    setActionError(null);

    let result;
    if (actionId === 'cancel') {
      // Mostrar confirmación antes de cancelar.
      setActionLoading(false);
      Alert.alert(
        'Cancelar Citatorio',
        '¿Estás seguro de que deseas cancelar este citatorio? Esta acción no se puede deshacer.',
        [
          { text: 'No, mantener', style: 'cancel' },
          {
            text: 'Sí, cancelar',
            style: 'destructive',
            onPress: async () => {
              setActionLoading(true);
              const cancelResult = await cancelCitation(citatorio.id);
              if (cancelResult.success) {
                const refreshed = await getTeacherCitationById(citatorio.id);
                if (refreshed.success) setRawCitation(refreshed.data);
              } else {
                setActionError(cancelResult.message);
              }
              setActionLoading(false);
            },
          },
        ],
      );
      return;
    } else if (actionId === 'edit') {
      // Abrir modal de edición.
      setActionLoading(false);
      setIsEditModalOpen(true);
      return;
    } else if (actionId === 'reschedule') {
      // Abrir modal de reagendación en lugar de llamar al service directamente.
      setActionLoading(false);
      setIsRescheduleModalOpen(true);
      return;
    } else if (actionId === 'confirm') {
      result = await updateCitationStatus(citatorio.id, 'completed');
    } else if (actionId === 'mark_attended') {
      result = await updateCitationStatus(citatorio.id, 'completed');
    } else if (actionId === 'mark_no_show') {
      result = await updateCitationStatus(citatorio.id, 'no_show');
    }

    if (result?.success) {
      // Recargar el citatorio para reflejar el cambio de status.
      const refreshed = await getTeacherCitationById(citatorio.id);
      if (refreshed.success) {
        setRawCitation(refreshed.data);
      }
    } else {
      setActionError(result?.message || 'No se pudo realizar la acción.');
    }
    setActionLoading(false);
  };

  // ============================================================
  // DASHBOARD DATA
  // ============================================================
  const { data } = useTeacherDashboard();
  const currentDate = data?.currentDate || 'Viernes, 14 de agosto';
  const school = useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.currentSchoolYear?.name || null,
    };
  }, [data?.school, data?.currentSchoolYear]);

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <ActivityIndicator size="large" color="#0284C7" />
        <Text className="text-slate-400 mt-2" style={{ fontSize: 12 }}>
          Cargando citatorio...
        </Text>
      </View>
    );
  }

  // ============================================================
  // ERROR / NOT FOUND STATE
  // ============================================================
  if (error || !citatorio) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <Text
          className="text-slate-900"
          style={{ fontSize: 16, fontWeight: '700' }}
        >
          {error || 'Citatorio no encontrado'}
        </Text>
        <Text
          className="text-slate-500 mt-1"
          style={{ fontSize: 12 }}
        >
          {`ID: ${citatorioId}`}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-4 py-2 rounded-xl"
          style={{ backgroundColor: '#0284C7' }}
        >
          <Text className="text-white font-bold">Volver</Text>
        </Pressable>
      </View>
    );
  }

  // Derivar estilos del status / type.
  const statusStyle =
    STATUS_STYLES[citatorio.status] || STATUS_STYLES.pending;
  const typeStyle = TYPE_STYLES[citatorio.type] || {
    bg: '#F1F5F9',
    fg: '#475569',
    label: citatorio.type || '—',
  };
  const StatusIcon = statusStyle.Icon;
  const actions = ACTION_MAP[citatorio.status] || [];

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* ============================================================
          CHROME COMPARTIDO (brand + school card)
          ============================================================ */}
      <DashboardHeader />
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-2"
        teacher={data?.teacher}
        date={currentDate}
      />

      {/* ============================================================
          HEADER: back + título
          ============================================================ */}
      <View className="flex-row items-center px-4 mt-4">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver al listado de citaciones"
          className="items-center justify-center -ml-2"
          style={{ padding: 8 }}
          hitSlop={8}
        >
          <ChevronLeft size={22} color="#0F172A" strokeWidth={2.25} />
        </Pressable>

        <Text
          className="flex-1 ml-1 text-slate-900"
          style={{ fontSize: 17, fontWeight: '700' }}
          numberOfLines={1}
        >
          Detalle del Citatorio
        </Text>
      </View>

      {/* ============================================================
          SCROLL CONTENT
          ============================================================ */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* ============================================================
            HERO: TYPE badge + STATUS badge (acento vertical del tipo).
            ============================================================ */}
        <View
          className="bg-white rounded-2xl p-4 mx-4 mt-3 border border-slate-100"
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
              <StatusIcon
                size={12}
                color={statusStyle.fg}
                strokeWidth={2.5}
              />
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
            {`${citatorio.groupName}  •  ${citatorio.subject}`}
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
              <Users size={15} color="#64748B" strokeWidth={2} />
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
            RESCHEDULE BANNER: se muestra cuando el tutor pidió reagendar.
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
            REASON CARD (texto libre del schema, completo).
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
            WORKFLOW TIMELINE (history del citatorio).
            ============================================================
            Cada entry del array `citatorio.history` se renderiza como un
            bullet cyan + línea vertical + timestamp + actor + label del
            evento (vía HISTORY_EVENT_LABELS).
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
                  <View
                    className="items-center"
                    style={{ width: 14 }}
                  >
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
            ACTIONS (dependientes del status).
            ============================================================
            Si no hay acciones para el status actual (p. ej. completed),
            se muestra un empty state indicándolo.
            Si se accede desde expediente de tutoría, se ocultan las
            acciones (modo solo lectura).
            ============================================================ */}
        {!isFromTutoria && (
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
            Acciones del Docente
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

      {/* MODAL: Reagendar Citatorio */}
      <RescheduleModal
        isVisible={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        onRescheduled={async () => {
          // Recargar el citatorio después de reagendar.
          const refreshed = await getTeacherCitationById(citatorioId);
          if (refreshed.success) {
            setRawCitation(refreshed.data);
          }
        }}
        citationId={citatorioId}
        currentDate={citatorio?.date || ''}
        currentTime={citatorio?.time || ''}
        currentLocation={citatorio?.location || ''}
      />

      {/* MODAL: Editar Citatorio */}
      <EditCitationModal
        isVisible={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={async () => {
          // Recargar el citatorio después de editar.
          const refreshed = await getTeacherCitationById(citatorioId);
          if (refreshed.success) {
            setRawCitation(refreshed.data);
          }
        }}
        citation={{
          id: citatorioId,
          reason: citatorio?.reason || '',
          location: citatorio?.location || '',
          type: citatorio?.type || 'academic',
          subject: rawCitation?.subject,
          groupName: citatorio?.groupName || '',
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------
// clsxHelper (local helper para evitar importar clsx solo por una línea)
// ---------------------------------------------------------------------
const clsxHelper = (...args) => args.filter(Boolean).join(' ');
