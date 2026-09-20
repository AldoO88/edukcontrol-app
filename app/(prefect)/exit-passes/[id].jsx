// =====================================================================
// app/(prefect)/exit-passes/[id].jsx
// ---------------------------------------------------------------------
// Pantalla de DETALLE de un pase de salida.
//
// Ruta: /exit-passes/:id
//
// El prefecto toca una card del feed → se navega acá con el id.
// Esta pantalla carga el pase completo con getExitPassById(id)
// y muestra:
//   - DashboardHeader (brand + Bell)
//   - SchoolInfoCard (escuela + fecha)
//   - Back button ("Volver")
//   - Nombre del alumno + grupo + No. Control
//   - Card: Persona que retira (nombre + parentesco)
//   - Card: Motivo + observaciones
//   - Card: Registro (fecha/hora + quien registró)
// =====================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';

import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';

import { useRouter, useLocalSearchParams } from 'expo-router';

import {
  ChevronLeft,
  LogOut,
  User,
  Users,
  FileText,
  Clock,
  Hash,
} from 'lucide-react-native';

import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import { usePrefectDashboard } from '@/src/hooks/usePrefectDashboard';
import { useAuth } from '@/src/hooks/useAuth';
import { getExitPassById } from '@/src/services/prefectService';

// ---------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------
const RELATIONSHIP_LABELS = {
  father: 'Padre',
  mother: 'Madre',
  guardian: 'Tutor',
  family: 'Familiar',
};

const REASON_LABELS = {
  illness: 'Enfermedad',
  medical: 'Cita médica',
  family: 'Asunto familiar',
  personal: 'Personal',
  other: 'Otro',
};

// ---------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------
const formatFullDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
  const displayHours = hours % 12 || 12;
  const time = `${displayHours}:${minutes} ${ampm}`;

  const day = d.getDate();
  const month = d.toLocaleString('es', { month: 'long' });
  const year = d.getFullYear();
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const isYesterday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate() - 1;

  let dateLabel = `${day} de ${month} ${year}`;
  if (isToday) dateLabel = 'Hoy';
  else if (isYesterday) dateLabel = 'Ayer';

  return `${dateLabel}, ${time}`;
};

// ---------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------
export default function ExitPassDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { data: dashboardData } = usePrefectDashboard();

  const [exitPass, setExitPass] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const school = useMemo(() => {
    if (!dashboardData?.school) return null;
    return {
      ...dashboardData.school,
      logo_url: dashboardData.school.logoUrl,
      current_school_year: dashboardData.school.cycle || null,
    };
  }, [dashboardData?.school]);

  // --- Fetch exit pass detail ---
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getExitPassById(id);
        if (cancelled) return;
        if (result.success) {
          setExitPass(result.data);
        } else {
          setError(result.message);
        }
      } catch {
        if (!cancelled) setError('No se pudo cargar el pase de salida.');
      }
      if (!cancelled) setIsLoading(false);
    };
    fetchDetail();
    return () => { cancelled = true; };
  }, [id]);

  // --- Loading state ---
  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
        <SchoolInfoCard school={school} isLoading={!school} className="mx-4 mt-4" teacher={dashboardData?.prefect} date={new Date().toISOString()} user={user} />
        <Pressable onPress={() => router.back()} className="flex-row items-center px-4 mt-4">
          <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
          <Text className="text-sm font-semibold text-sky-600 ml-1">Volver</Text>
        </Pressable>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ea580c" />
          <Text className="text-slate-400 text-sm mt-3">Cargando detalle...</Text>
        </View>
      </View>
    );
  }

  // --- Error state ---
  if (error || !exitPass) {
    return (
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
        <SchoolInfoCard school={school} isLoading={!school} className="mx-4 mt-4" teacher={dashboardData?.prefect} date={new Date().toISOString()} user={user} />
        <Pressable onPress={() => router.back()} className="flex-row items-center px-4 mt-4">
          <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
          <Text className="text-sm font-semibold text-sky-600 ml-1">Volver</Text>
        </Pressable>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-slate-900 text-lg font-bold">Error</Text>
          <Text className="text-slate-500 text-sm text-center mt-2">{error || 'No se encontró el pase de salida.'}</Text>
          <Pressable onPress={() => router.back()} className="mt-4 bg-orange-500 px-6 py-2.5 rounded-xl">
            <Text className="text-white font-semibold">Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // --- Data ---
  const student = exitPass.student_id || {};
  const group = exitPass.group_id || {};
  const creator = exitPass.created_by || {};
  const studentName = `${student.last_name || ''}, ${student.first_name || ''}`.trim();
  const groupLabel = group.grade && group.section ? `${group.grade}° ${group.section}` : '';
  const relationshipLabel = RELATIONSHIP_LABELS[exitPass.relationship] || exitPass.relationship;
  const reasonLabel = REASON_LABELS[exitPass.reason] || exitPass.reason;
  const exitTimeStr = formatFullDateTime(exitPass.exit_time);
  const createdAtStr = formatFullDateTime(exitPass.createdAt);

  return (
    <View className="flex-1 bg-slate-50">
      <DashboardHeader />
      <SchoolInfoCard school={school} isLoading={!school} className="mx-4 mt-4" teacher={dashboardData?.prefect} date={new Date().toISOString()} user={user} />

      <Pressable onPress={() => router.back()} className="flex-row items-center px-4 mt-4">
        <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
        <Text className="text-sm font-semibold text-sky-600 ml-1">Volver</Text>
      </Pressable>

      <ScrollView
        className="flex-1 px-4 mt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* TITLE */}
        <View className="flex-row items-center mb-5">
          <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: '#FFF7ED' }}>
            <LogOut size={20} color="#ea580c" strokeWidth={2} />
          </View>
          <Text className="text-xl font-bold text-slate-900 ml-3">Detalle del Pase</Text>
        </View>

        {/* STUDENT CARD */}
        <View
          className="bg-white rounded-2xl p-4 mb-3 border border-slate-100"
          style={{
            elevation: 1,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            borderLeftWidth: 3,
            borderLeftColor: '#ea580c',
          }}
        >
          <View className="flex-row items-center">
            <View className="items-center justify-center rounded-full" style={{ width: 48, height: 48, backgroundColor: '#FFF7ED' }}>
              <Text className="text-orange-700" style={{ fontSize: 17, fontWeight: '700' }}>
                {`${(student.last_name || '?')[0]}${(student.first_name || '?')[0]}`.toUpperCase()}
              </Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-slate-900" style={{ fontSize: 16, fontWeight: '700' }} numberOfLines={1}>
                {studentName || '—'}
              </Text>
              <View className="flex-row items-center mt-1">
                {groupLabel ? (
                  <View className="flex-row items-center mr-3">
                    <Users size={12} color="#64748B" strokeWidth={2} />
                    <Text className="text-slate-600 ml-1" style={{ fontSize: 12 }}>{groupLabel}</Text>
                  </View>
                ) : null}
                {student.controlNumber ? (
                  <View className="flex-row items-center">
                    <Hash size={12} color="#64748B" strokeWidth={2} />
                    <Text className="text-slate-600 ml-1" style={{ fontSize: 12 }}>{student.controlNumber}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {/* GUARDIAN CARD */}
        <View
          className="bg-white rounded-2xl p-4 mb-3 border border-slate-100"
          style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: '#FFF7ED' }}>
              <User size={16} color="#ea580c" strokeWidth={2} />
            </View>
            <Text className="text-slate-500 ml-2" style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Persona que retira
            </Text>
          </View>
          <Text className="text-slate-900" style={{ fontSize: 15, fontWeight: '600' }}>
            {exitPass.guardian_name || '—'}
          </Text>
          <View className="flex-row items-center mt-2">
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFF7ED' }}>
              <Text className="text-orange-700" style={{ fontSize: 11, fontWeight: '700' }}>
                {relationshipLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* REASON CARD */}
        <View
          className="bg-white rounded-2xl p-4 mb-3 border border-slate-100"
          style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: '#FFF7ED' }}>
              <FileText size={16} color="#ea580c" strokeWidth={2} />
            </View>
            <Text className="text-slate-500 ml-2" style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Motivo
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FFF7ED' }}>
              <Text className="text-orange-700" style={{ fontSize: 12, fontWeight: '700' }}>
                {reasonLabel}
              </Text>
            </View>
          </View>
          {exitPass.reason_detail ? (
            <Text className="text-slate-600 mt-3" style={{ fontSize: 13, lineHeight: 20 }}>
              {exitPass.reason_detail}
            </Text>
          ) : null}
        </View>

        {/* REGISTRATION CARD */}
        <View
          className="bg-white rounded-2xl p-4 mb-3 border border-slate-100"
          style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: '#FFF7ED' }}>
              <Clock size={16} color="#ea580c" strokeWidth={2} />
            </View>
            <Text className="text-slate-500 ml-2" style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Registro
            </Text>
          </View>
          <View className="mb-2">
            <Text className="text-slate-400" style={{ fontSize: 11 }}>Hora de salida</Text>
            <Text className="text-slate-900" style={{ fontSize: 14, fontWeight: '600' }}>{exitTimeStr}</Text>
          </View>
          {exitPass.createdAt && exitPass.createdAt !== exitPass.exit_time ? (
            <View className="mb-2" style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8, marginTop: 4 }}>
              <Text className="text-slate-400" style={{ fontSize: 11 }}>Registrado el</Text>
              <Text className="text-slate-900" style={{ fontSize: 14, fontWeight: '600' }}>{createdAtStr}</Text>
            </View>
          ) : null}
          {creator.name ? (
            <View style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8, marginTop: 4 }}>
              <Text className="text-slate-400" style={{ fontSize: 11 }}>Registrado por</Text>
              <Text className="text-slate-900" style={{ fontSize: 14, fontWeight: '600' }}>
                {creator.name} {creator.last_name || ''}
              </Text>
              {creator.role ? (
                <Text className="text-slate-500" style={{ fontSize: 11, textTransform: 'capitalize' }}>
                  {creator.role === 'prefect' ? 'Prefecto' : creator.role}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
