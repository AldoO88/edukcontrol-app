// =====================================================================
// app/(teacher)/(tabs)/groups/[groupId]/schedule/index.jsx
// ---------------------------------------------------------------------
// Pantalla de horario semanal de un GRUPO específico (filtrado del
// horario completo del maestro). Muestra tabs por día (Lun-Vie) y
// las clases del grupo seleccionado.
//
// Se abre desde el botón "Ver Horario" en la pantalla de directorio
// de alumnos (students/index.jsx) o desde el detalle del grupo.
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

// Iconos Lucide (los que se usan fuera del sistema color/icon dinámico).
import {
  ChevronLeft,
  Clock,
  MapPin,
} from 'lucide-react-native';

// Hook del dashboard docente.
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Servicio de horario del grupo.
import { getGroupSchedule } from '@/src/services/teacherService';

// Helper para resolver el ícono/color dinámico de cada materia.
import {
  getSubjectIcon,
  getSubjectColor,
  tintWithAlpha,
} from '@/src/utils/subjectIcons';
// ---------------------------------------------------------------------
// DÍAS DE LA SEMANA
// ---------------------------------------------------------------------
const DAY_NAMES = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
};

const DAY_KEYS = ['1', '2', '3', '4', '5'];

// ---------------------------------------------------------------------
// TAB PILL
// ---------------------------------------------------------------------
const TabPill = ({ active, label, onPress, isToday }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="tab"
    accessibilityState={{ selected: active }}
    className="items-center py-2 rounded-lg flex-1"
    style={{
      backgroundColor: active ? '#0284C7' : 'transparent',
    }}
  >
    <Text
      style={{
        fontSize: 12,
        fontWeight: '700',
        color: active ? '#FFFFFF' : '#64748B',
      }}
    >
      {label}
    </Text>
    {isToday && !active && (
      <View
        style={{
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: '#0284C7',
          marginTop: 2,
        }}
      />
    )}
  </Pressable>
);

// ---------------------------------------------------------------------
// CLASE CARD
// ---------------------------------------------------------------------
const ClaseCard = ({ clase }) => {
  // Receso
  if (clase.type === 'receso') {
    return (
      <View
        className="flex-row items-center rounded-xl p-3 mx-4 mb-2"
        style={{
          backgroundColor: '#F1F5F9',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          borderStyle: 'dashed',
        }}
      >
        <View
          className="items-center justify-center rounded-lg"
          style={{ backgroundColor: '#E2E8F0', width: 36, height: 36 }}
        >
          <Clock size={16} color="#94A3B8" strokeWidth={2.25} />
        </View>
        <View className="ml-3 flex-1">
          <Text
            className="text-slate-400"
            style={{ fontSize: 13, fontWeight: '600' }}
          >
            Receso
          </Text>
          <Text
            className="text-slate-400"
            style={{ fontSize: 11 }}
          >
            {`${clase.start} – ${clase.end}`}
          </Text>
        </View>
      </View>
    );
  }

  const isTaller = clase.classificationType === 'TALLER' || clase.is_taller;

  // Color e ícono vienen del backend a nivel de clase
  // (clase.color / clase.icon). Si faltan, caen al fallback.
  const subjectColor = getSubjectColor(clase.color);
  const SubjectIcon = getSubjectIcon(clase.icon);

  return (
    <View
      className="flex-row items-center rounded-xl p-3 mx-4 mb-2"
      style={{
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderLeftWidth: 4,
        borderLeftColor: subjectColor,
        shadowColor: '#0F172A',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}
    >
      <View
        className="items-center justify-center rounded-lg"
        style={{
          backgroundColor: tintWithAlpha(subjectColor, 0.12),
          width: 36,
          height: 36,
        }}
      >
        <SubjectIcon size={16} color={subjectColor} strokeWidth={2.25} />
      </View>
      <View className="ml-3 flex-1">
        <View className="flex-row items-center">
          <Text
            className="text-slate-900"
            style={{ fontSize: 14, fontWeight: '700' }}
            numberOfLines={1}
          >
            {clase.subject || 'Sin materia'}
          </Text>
          {isTaller && (
            <View
              className="ml-2 px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: tintWithAlpha(subjectColor, 0.15) }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '700',
                  color: subjectColor,
                  textTransform: 'uppercase',
                }}
              >
                Taller
              </Text>
            </View>
          )}
        </View>
        {clase.teacher && !isTaller && (
          <View className="flex-row items-center mt-0.5">
            <Text
              className="text-slate-500"
              style={{ fontSize: 11, fontWeight: '500' }}
            >
              {clase.teacher}
            </Text>
          </View>
        )}
        <View className="flex-row items-center mt-0.5">
          <Clock size={11} color="#64748B" strokeWidth={2} />
          <Text
            className="ml-1 text-slate-500"
            style={{ fontSize: 11 }}
          >
            {`${clase.start} – ${clase.end}`}
            {clase.block_count > 1 ? ` (${clase.block_count} módulos)` : ''}
          </Text>
        </View>
        {clase.classroom && (
          <View className="flex-row items-center mt-0.5">
            <MapPin size={11} color="#64748B" strokeWidth={2} />
            <Text
              className="ml-1 text-slate-500"
              style={{ fontSize: 11 }}
              numberOfLines={1}
            >
              {clase.classroom}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function GroupScheduleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const groupId = params.groupId;
  const groupName = params.groupName || 'Grupo';

  // ============================================================
  // FETCH: cargar horario completo del grupo
  // ============================================================
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchSchedule = async () => {
      setIsLoading(true);
      setError(null);
      const result = await getGroupSchedule(groupId);
      if (cancelled) return;
      if (result.success) {
        setScheduleData(result.data);
      } else {
        setError(result.message);
      }
      setIsLoading(false);
    };
    fetchSchedule();
    return () => { cancelled = true; };
  }, [groupId]);

  // ============================================================
  // TAB DEL DÍA ACTUAL
  // ============================================================
  // La respuesta del endpoint trae `today` como número (1-5).
  // ============================================================
  const todayKey = scheduleData?.today?.toString() || '1';
  const [activeDay, setActiveDay] = useState(todayKey);

  useEffect(() => {
    if (todayKey) setActiveDay(todayKey);
  }, [todayKey]);

  // ============================================================
  // CLASES DEL DÍA ACTIVO
  // ============================================================
  const dayClasses = useMemo(() => {
    if (!scheduleData?.schedule) return [];
    return scheduleData.schedule[activeDay] || [];
  }, [scheduleData, activeDay]);

  const daysWithClasses = useMemo(() => {
    if (!scheduleData?.schedule) return DAY_KEYS;
    return DAY_KEYS.filter((k) => scheduleData.schedule[k]?.length > 0);
  }, [scheduleData]);

  // ============================================================
  // DASHBOARD DATA
  // ============================================================
  const { data } = useTeacherDashboard();
  const currentDate = data?.currentDate || '';
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
          Cargando horario...
        </Text>
      </View>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================
  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <Text
          className="text-slate-900"
          style={{ fontSize: 16, fontWeight: '700' }}
        >
          {error}
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

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* CHROME COMPARTIDO */}
      <DashboardHeader />
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-2"
        teacher={data?.teacher}
        date={currentDate}
      />

      {/* HEADER: back + título */}
      <View className="flex-row items-center px-4 mt-4">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver al directorio"
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
          Horario — {groupName}
        </Text>
      </View>

      {/* TABS: Días de la semana */}
      <View
        className="mx-4 mt-3 flex-row rounded-xl p-1"
        style={{ backgroundColor: '#F1F5F9' }}
      >
        {DAY_KEYS.map((key) => (
          <TabPill
            key={key}
            active={activeDay === key}
            label={DAY_NAMES[key].slice(0, 3)}
            isToday={key === todayKey}
            onPress={() => setActiveDay(key)}
          />
        ))}
      </View>

      {/* CONTENIDO: Lista de clases del día */}
      <ScrollView
        className="flex-1 mt-3"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
      >
        {dayClasses.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 mx-4 items-center border border-slate-100">
            <Text
              className="text-slate-500"
              style={{ fontSize: 13, fontWeight: '600' }}
            >
              No hay clases este día
            </Text>
            <Text
              className="text-slate-400 mt-1 text-center"
              style={{ fontSize: 12 }}
            >
              {scheduleData?.schedule && Object.keys(scheduleData.schedule).length === 0
                ? 'El grupo no tiene horario registrado en el sistema.'
                : `El grupo no tiene clases programadas para ${DAY_NAMES[activeDay]}.`}
            </Text>
          </View>
        ) : (
          dayClasses.map((clase, index) => (
            <ClaseCard key={index} clase={clase} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
