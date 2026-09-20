// =====================================================================
// app/(guardian)/conduct/[id].jsx
// ---------------------------------------------------------------------
// Ruta "/conduct/:id" del route group (guardian). Pantalla de
// DETALLE de un reporte de conducta específico (solo lectura).
//
// Estilo alineado con la pantalla del prefecto:
//   - DashboardHeader + SchoolInfoCard
//   - Back link inline (sky-600)
//   - Hero: TYPE badge + STATUS badge + alumno + grupo + reporter
//   - Detalles del Reporte (tipo, gravedad, puntos, fecha)
//   - Descripción (read-only)
//   - Creado el (metadata)
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
} from 'react-native';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Navegación.
import { useRouter, useLocalSearchParams } from 'expo-router';

// Iconos Lucide.
import {
  ChevronLeft,
  TriangleAlert,
  Star,
  TrendingUp,
  XCircle,
  Users,
  FileText,
  Clock,
} from 'lucide-react-native';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Hooks.
import { useAuth } from '@/src/hooks/useAuth';
import { useGuardianDashboard } from '@/src/hooks/useGuardianDashboard';

// Servicio del guardian.
import { getConductDetail } from '@/src/services/guardianService';

// ---------------------------------------------------------------------
// EVENT_TYPES
// ---------------------------------------------------------------------
const EVENT_TYPES = {
  demerit: { label: 'Demérito', icon: XCircle, color: '#E11D48', bg: '#FEE2E2' },
  merit: { label: 'Mérito', icon: TrendingUp, color: '#047857', bg: '#D1FAE5' },
};

// ---------------------------------------------------------------------
// SEVERITY_LABELS
// ---------------------------------------------------------------------
const SEVERITY_LABELS = {
  minor: 'Menor',
  moderate: 'Moderado',
  severe: 'Grave',
};

// ---------------------------------------------------------------------
// STATUS_CONFIG
// ---------------------------------------------------------------------
const STATUS_CONFIG = {
  active: { bg: '#D1FAE5', fg: '#047857', label: 'Activo' },
  cancelled: { bg: '#F1F5F9', fg: '#64748B', label: 'Cancelado' },
};

// ---------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------
const formatIncidentDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatCreatedDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const dateStr = d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dateStr}, ${timeStr}`;
};

// =====================================================================
// COMPONENTE PRINCIPAL: ConductDetailScreen
// =====================================================================
export default function ConductDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // Usuario actual.
  const { user } = useAuth();

  // Data de la escuela (para SchoolInfoCard).
  const { data: dashboardData } = useGuardianDashboard();

  const school = useMemo(() => {
    if (!dashboardData?.school) return null;
    return {
      ...dashboardData.school,
      logo_url: dashboardData.school.logoUrl || dashboardData.school.logo_url,
    };
  }, [dashboardData?.school]);

  // Estado del reporte.
  const [conduct, setConduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -------------------------------------------------------------------
  // FETCH: carga del reporte de conducta.
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchConduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getConductDetail(id);
        if (cancelled) return;
        if (result.success) {
          setConduct(result.data);
        } else {
          setError(result.message || 'No se pudo cargar el reporte.');
        }
      } catch (err) {
        if (!cancelled) {
          setError('Error inesperado al cargar el reporte.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchConduct();
    return () => { cancelled = true; };
  }, [id]);

  // -------------------------------------------------------------------
  // DERIVED DATA.
  // -------------------------------------------------------------------
  const event = EVENT_TYPES[conduct?.eventType] || EVENT_TYPES.demerit;
  const EventIcon = event.icon;
  const status = STATUS_CONFIG[conduct?.status] || STATUS_CONFIG.active;

  const studentName = conduct?.student_id
    ? `${conduct.student_id.first_name || ''} ${conduct.student_id.last_name || ''}`.trim()
    : null;

  const studentGroup = conduct?.student_id?.current_group_id
    ? `${conduct.student_id.current_group_id.grade}°${conduct.student_id.current_group_id.section}`
    : null;

  const reporterName = conduct?.reported_by
    ? [conduct.reported_by.name, conduct.reported_by.last_name].filter(Boolean).join(' ').trim()
    : null;

  const formattedIncidentDate = formatIncidentDate(conduct?.incident_date);
  const formattedCreatedDate = formatCreatedDate(conduct?.createdAt);

  // -------------------------------------------------------------------
  // LOADING STATE.
  // -------------------------------------------------------------------
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="text-slate-500 mt-3" style={{ fontSize: 14 }}>
          Cargando reporte...
        </Text>
      </View>
    );
  }

  // -------------------------------------------------------------------
  // ERROR STATE.
  // -------------------------------------------------------------------
  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8FAFC] px-6">
        <TriangleAlert size={32} color="#EF4444" strokeWidth={2} />
        <Text
          className="text-slate-900 mt-3 text-center"
          style={{ fontSize: 16, fontWeight: '600' }}
        >
          {error}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-5 py-2.5 rounded-xl bg-sky-600"
        >
          <Text className="text-white" style={{ fontSize: 14, fontWeight: '600' }}>
            Volver
          </Text>
        </Pressable>
      </View>
    );
  }

  // -------------------------------------------------------------------
  // RENDER PRINCIPAL.
  // -------------------------------------------------------------------
  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* ============================================================
          CHROME COMPARTIDO
          ============================================================ */}
      <DashboardHeader />
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-3"
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
            HERO: EVENT TYPE badge + STATUS badge + alumno + reporter
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

          {/* Nombre del alumno + grupo. */}
          {studentName && (
            <Text
              className="mt-3 text-slate-900"
              style={{ fontSize: 18, fontWeight: '800' }}
              numberOfLines={2}
            >
              {studentName}{studentGroup ? ` — ${studentGroup}` : ''}
            </Text>
          )}

          {/* Reporter. */}
          {reporterName && (
            <View className="flex-row items-center mt-2">
              <Users size={13} color="#64748B" strokeWidth={2} />
              <Text
                className="ml-1.5 text-slate-500"
                style={{ fontSize: 12, fontWeight: '500' }}
              >
                {`Creado por: ${reporterName}`}
              </Text>
            </View>
          )}
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
              {conduct?.severity && (
                <Text className="text-slate-500" style={{ fontSize: 12, fontWeight: '500' }}>
                  Gravedad: {SEVERITY_LABELS[conduct.severity] || conduct.severity}
                </Text>
              )}
            </View>
          </View>

          {/* Points impact. */}
          {conduct?.points_impact != null && (
            <View className="flex-row items-center mt-3">
              <View
                className="px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: conduct.eventType === 'demerit' ? '#FEF2F2' : '#ECFDF5',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '800',
                    color: conduct.eventType === 'demerit' ? '#E11D48' : '#047857',
                  }}
                >
                  {conduct.eventType === 'merit' ? '+' : '-'}{conduct.points_impact} puntos
                </Text>
              </View>
            </View>
          )}

          {/* Fecha del incidente. */}
          {formattedIncidentDate && (
            <Text className="text-[10px] text-slate-400 mt-3">
              Fecha del incidente: {formattedIncidentDate}
            </Text>
          )}
        </View>

        {/* ============================================================
            DESCRIPTION CARD (read-only)
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
          <View className="flex-row items-center mb-2">
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
          <Text
            className="text-slate-700"
            style={{ fontSize: 14, fontWeight: '400', lineHeight: 20 }}
          >
            {conduct?.description || 'Sin descripción'}
          </Text>
        </View>

        {/* ============================================================
            DETAILS TEXT CARD (si existe el campo `details`)
            ============================================================ */}
        {conduct?.details && (
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
              <FileText size={14} color="#6366F1" strokeWidth={2.25} />
              <Text
                className="ml-1.5 text-slate-500"
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Detalles Adicionales
              </Text>
            </View>
            <Text
              className="text-slate-700"
              style={{ fontSize: 14, fontWeight: '400', lineHeight: 20 }}
            >
              {conduct.details}
            </Text>
          </View>
        )}

        {/* ============================================================
            CREATED AT (metadata)
            ============================================================ */}
        {formattedCreatedDate && (
          <View className="mx-4 mt-3 mb-2">
            <View className="flex-row items-center">
              <Clock size={12} color="#94a3b8" strokeWidth={2} />
              <Text className="text-xs text-slate-400 ml-1.5">
                Creado el {formattedCreatedDate}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
