// =====================================================================
// app/(teacher)/conduct/[id].jsx
// ---------------------------------------------------------------------
// Ruta "/conduct/:id" del route group (teacher). Pantalla de
// DETALLE de un reporte de conducta específico.
//
// Estructura visual:
//
//   ┌────────────────────────────────────────┐
//   │ DashboardHeader + SchoolInfoCard       │
//   ├────────────────────────────────────────┤
//   │ < Volver  Detalle del Reporte         │
//   ├────────────────────────────────────────┤
//   │ Hero: TYPE badge + SEVERITY badge      │
//   ├────────────────────────────────────────┤
//   │ Description card (description)         │
//   ├────────────────────────────────────────┤
//   │ Details card (details, si existe)      │
//   ├────────────────────────────────────────┤
//   │ Metadata card (fecha, registrado por)  │
//   ├────────────────────────────────────────┤
//   │ Student card (alumno + ciclo escolar)  │
//   └────────────────────────────────────────┘
//
// Recibe `id` por URL params. Carga el reporte vía
// getStudentConductDetail(id) del service (conectado al backend).
// =====================================================================

// React + hooks.
import React, { useState, useEffect, useMemo } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  ScrollView,
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
  Calendar,
  User,
  Clock,
  FileText,
  Shield,
  CircleAlert,
} from 'lucide-react-native';

// Hook del dashboard docente (escuela + maestro).
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';

// Helper para componer el nombre completo del maestro.
import { getTeacherFullName } from '@/src/utils/teacherName';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Servicio del dominio de conducta.
import { getStudentConductDetail } from '@/src/services/teacherService';

// ---------------------------------------------------------------------
// EVENT_TYPE_STYLES
// ---------------------------------------------------------------------
// Estilos visuales por tipo de evento (eventType).
// ---------------------------------------------------------------------
const EVENT_TYPE_STYLES = {
  demerit: {
    label: 'Demérito',
    bg: '#FEF2F2',
    fg: '#DC2626',
    Icon: TriangleAlert,
    borderColor: '#DC2626',
  },
  merit: {
    label: 'Mérito',
    bg: '#F0F9FF',
    fg: '#0284C7',
    Icon: Star,
    borderColor: '#0284C7',
  },
};

// ---------------------------------------------------------------------
// SEVERITY_STYLES
// ---------------------------------------------------------------------
// Estilos visuales por severidad (severity).
// ---------------------------------------------------------------------
const SEVERITY_STYLES = {
  minor: { label: 'Leve', bg: '#FEF3C7', fg: '#D97706', borderColor: '#D97706' },
  moderate: { label: 'Moderada', bg: '#FFEDD5', fg: '#EA580C', borderColor: '#EA580C' },
  severe: { label: 'Grave', bg: '#FEE2E2', fg: '#DC2626', borderColor: '#DC2626' },
};

// ---------------------------------------------------------------------
// SEVERITY_ICONS
// ---------------------------------------------------------------------
// Iconos por severidad (para la metadata card).
// ---------------------------------------------------------------------
const SEVERITY_ICONS = {
  minor: CircleAlert,
  moderate: Shield,
  severe: TriangleAlert,
};

// ---------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------
const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  const dateStr = date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dateStr} ${timeStr}`;
};

// =====================================================================
// COMPONENTE PRINCIPAL: ConductDetailScreen
// =====================================================================
export default function ConductDetailScreen() {
  // Safe area insets.
  const insets = useSafeAreaInsets();

  // Router + params.
  const router = useRouter();
  const { id } = useLocalSearchParams();

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
        const result = await getStudentConductDetail(id);
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
  // DASHBOARD DATA (escuela + maestro + fecha).
  // -------------------------------------------------------------------
  const { data } = useTeacherDashboard();
  const school = useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.currentSchoolYear?.name || null,
    };
  }, [data?.school, data?.currentSchoolYear]);

  // -------------------------------------------------------------------
  // DERIVED DATA.
  // -------------------------------------------------------------------
  const eventStyle = EVENT_TYPE_STYLES[conduct?.eventType] || EVENT_TYPE_STYLES.demerit;
  const severityStyle = conduct?.severity
    ? SEVERITY_STYLES[conduct.severity]
    : null;
  const SeverityIcon = conduct?.severity
    ? SEVERITY_ICONS[conduct.severity] || CircleAlert
    : CircleAlert;

  // -------------------------------------------------------------------
  // LOADING STATE.
  // -------------------------------------------------------------------
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <ActivityIndicator size="large" color="#6366F1" />
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
          className="mt-4 px-5 py-2.5 rounded-xl bg-indigo-600"
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
          HEADER + SCHOOL INFO (solo si hay data).
          ============================================================ */}
      {school && (
        <View style={{ paddingTop: insets.top }}>
          <DashboardHeader
            teacherName={getTeacherFullName(data?.teacher)}
            currentDate={data?.currentDate || ''}
            schoolName={school.name}
          />
          <SchoolInfoCard
            schoolName={school.name}
            logoUri={school.logo_url}
            schoolYear={school.current_school_year}
          />
        </View>
      )}

      {/* ============================================================
          BARRA DE NAVEGACIÓN: < Volver + Título.
          ============================================================ */}
      <View
        className="flex-row items-center px-4 py-3 border-b border-slate-100 bg-white"
        style={{ marginTop: insets.top }}
      >
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center mr-3"
        >
          <ChevronLeft size={20} color="#6366F1" strokeWidth={2.5} />
          <Text
            className="text-indigo-600 ml-0.5"
            style={{ fontSize: 14, fontWeight: '600' }}
          >
            Volver
          </Text>
        </Pressable>
        <Text
          className="text-slate-900"
          style={{ fontSize: 15, fontWeight: '700' }}
        >
          Detalle del Reporte
        </Text>
      </View>

      {/* ============================================================
          CONTENIDO SCROLL.
          ============================================================ */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* ============================================================
            HERO: badges de tipo y severidad.
            ============================================================ */}
        <View className="px-4 mt-4">
          <View
            className="bg-white rounded-2xl p-4 border border-slate-100"
            style={{
              shadowColor: '#0F172A',
              shadowOpacity: 0.04,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1,
            }}
          >
            <View className="flex-row items-center flex-wrap gap-2">
              {/* Badge de tipo (demerit/merit). */}
              <View
                className="flex-row items-center px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: eventStyle.bg,
                  borderWidth: 1,
                  borderColor: eventStyle.fg + '30',
                }}
              >
                <eventStyle.Icon size={14} color={eventStyle.fg} strokeWidth={2.5} />
                <Text
                  className="ml-1.5"
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: eventStyle.fg,
                    letterSpacing: 0.3,
                  }}
                >
                  {eventStyle.label}
                </Text>
              </View>

              {/* Badge de severidad (si existe). */}
              {severityStyle && (
                <View
                  className="flex-row items-center px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: severityStyle.bg,
                    borderWidth: 1,
                    borderColor: severityStyle.fg + '30',
                  }}
                >
                  <SeverityIcon size={12} color={severityStyle.fg} strokeWidth={2.5} />
                  <Text
                    className="ml-1"
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: severityStyle.fg,
                      letterSpacing: 0.3,
                    }}
                  >
                    {severityStyle.label}
                  </Text>
                </View>
              )}

              {/* Puntos de impacto. */}
              <View
                className="flex-row items-center px-3 py-1.5 rounded-full ml-auto"
                style={{
                  backgroundColor: conduct?.eventType === 'merit' ? '#DCFCE7' : '#FEE2E2',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: conduct?.eventType === 'merit' ? '#16A34A' : '#DC2626',
                  }}
                >
                  {conduct?.eventType === 'merit' ? '+' : '-'}{conduct?.points_impact} pts
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================
            DESCRIPTION CARD: título del reporte.
            ============================================================ */}
        <View className="px-4 mt-3">
          <View
            className="bg-white rounded-2xl p-4 border border-slate-100"
            style={{
              shadowColor: '#0F172A',
              shadowOpacity: 0.04,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1,
            }}
          >
            <View className="flex-row items-center mb-2">
              <FileText size={16} color="#6366F1" strokeWidth={2} />
              <Text
                className="text-slate-900 ml-2"
                style={{ fontSize: 13, fontWeight: '700' }}
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
        </View>

        {/* ============================================================
            DETAILS CARD: descripción detallada (si existe).
            ============================================================ */}
        {conduct?.details && (
          <View className="px-4 mt-3">
            <View
              className="bg-white rounded-2xl p-4 border border-slate-100"
              style={{
                shadowColor: '#0F172A',
                shadowOpacity: 0.04,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 1 },
                elevation: 1,
              }}
            >
              <View className="flex-row items-center mb-2">
                <FileText size={16} color="#6366F1" strokeWidth={2} />
                <Text
                  className="text-slate-900 ml-2"
                  style={{ fontSize: 13, fontWeight: '700' }}
                >
                  Detalles
                </Text>
              </View>
              <Text
                className="text-slate-700"
                style={{ fontSize: 14, fontWeight: '400', lineHeight: 20 }}
              >
                {conduct.details}
              </Text>
            </View>
          </View>
        )}

        {/* ============================================================
            METADATA CARD: fecha del incidente + registrado por.
            ============================================================ */}
        <View className="px-4 mt-3">
          <View
            className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
            style={{
              shadowColor: '#0F172A',
              shadowOpacity: 0.04,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1,
            }}
          >
            {/* Fecha del incidente. */}
            <View
              className="flex-row items-center px-4 py-3"
              style={{ borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
            >
              <View
                className="items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#FEF3C7',
                }}
              >
                <Calendar size={16} color="#D97706" strokeWidth={2} />
              </View>
              <View className="flex-1 ml-3">
                <Text
                  className="text-slate-500"
                  style={{ fontSize: 11, fontWeight: '500' }}
                >
                  Fecha del incidente
                </Text>
                <Text
                  className="text-slate-900 mt-0.5"
                  style={{ fontSize: 13, fontWeight: '600' }}
                >
                  {formatDate(conduct?.incident_date)}
                </Text>
              </View>
            </View>

            {/* Registrado por. */}
            <View
              className="flex-row items-center px-4 py-3"
              style={{ borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
            >
              <View
                className="items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#EFF6FF',
                }}
              >
                <User size={16} color="#2563EB" strokeWidth={2} />
              </View>
              <View className="flex-1 ml-3">
                <Text
                  className="text-slate-500"
                  style={{ fontSize: 11, fontWeight: '500' }}
                >
                  Registrado por
                </Text>
                <Text
                  className="text-slate-900 mt-0.5"
                  style={{ fontSize: 13, fontWeight: '600' }}
                >
                  {conduct?.reported_by?.name || '—'}
                  {conduct?.reported_by?.role && (
                    <Text className="text-slate-400">
                      {' '}({conduct.reported_by.role})
                    </Text>
                  )}
                </Text>
              </View>
            </View>

            {/* Creado el. */}
            <View className="flex-row items-center px-4 py-3">
              <View
                className="items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#F0FDF4',
                }}
              >
                <Clock size={16} color="#16A34A" strokeWidth={2} />
              </View>
              <View className="flex-1 ml-3">
                <Text
                  className="text-slate-500"
                  style={{ fontSize: 11, fontWeight: '500' }}
                >
                  Creado el
                </Text>
                <Text
                  className="text-slate-900 mt-0.5"
                  style={{ fontSize: 13, fontWeight: '600' }}
                >
                  {formatDateTime(conduct?.createdAt)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================
            STUDENT CARD: alumno + ciclo escolar.
            ============================================================ */}
        <View className="px-4 mt-3">
          <View
            className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
            style={{
              shadowColor: '#0F172A',
              shadowOpacity: 0.04,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1,
            }}
          >
            {/* Alumno. */}
            <View
              className="flex-row items-center px-4 py-3"
              style={{ borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
            >
              <View
                className="items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#FEF2F2',
                }}
              >
                <User size={16} color="#DC2626" strokeWidth={2} />
              </View>
              <View className="flex-1 ml-3">
                <Text
                  className="text-slate-500"
                  style={{ fontSize: 11, fontWeight: '500' }}
                >
                  Alumno
                </Text>
                <Text
                  className="text-slate-900 mt-0.5"
                  style={{ fontSize: 13, fontWeight: '600' }}
                >
                  {conduct?.student_id?.first_name} {conduct?.student_id?.last_name}
                </Text>
                <Text
                  className="text-slate-400 mt-0.5"
                  style={{ fontSize: 11, fontWeight: '500' }}
                >
                  No. {conduct?.student_id?.controlNumber}
                </Text>
              </View>
            </View>

            {/* Ciclo escolar. */}
            <View className="flex-row items-center px-4 py-3">
              <View
                className="items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#F5F3FF',
                }}
              >
                <Calendar size={16} color="#7C3AED" strokeWidth={2} />
              </View>
              <View className="flex-1 ml-3">
                <Text
                  className="text-slate-500"
                  style={{ fontSize: 11, fontWeight: '500' }}
                >
                  Ciclo Escolar
                </Text>
                <Text
                  className="text-slate-900 mt-0.5"
                  style={{ fontSize: 13, fontWeight: '600' }}
                >
                  {conduct?.school_year_id?.name || '—'}
                </Text>
                {conduct?.school_year_id?.isActive && (
                  <View
                    className="self-start px-2 py-0.5 rounded-full mt-1"
                    style={{ backgroundColor: '#DCFCE7' }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: '#16A34A',
                        letterSpacing: 0.3,
                      }}
                    >
                      Activo
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
