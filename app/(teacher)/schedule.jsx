// =====================================================================
// app/(teacher)/schedule.jsx
// ---------------------------------------------------------------------
// Ruta "/schedule" del route group (teacher). Pantalla de horario
// semanal del docente.
//
// Estructura visual:
//
//   ┌────────────────────────────────────────┐
//   │ DashboardHeader (brand + 🔔)          │
//   ├────────────────────────────────────────┤
//   │ SchoolInfoCard compuesta                │
//   ├────────────────────────────────────────┤
//   │ < Volver  •  Mi Horario Semanal        │
//   ├────────────────────────────────────────┤
//   │ Stats row: 3 cards (Horas/Grupos/Libres│
//   ├────────────────────────────────────────┤
//   │ Tabs: Lun | Mar | Mié | Jue | Vie     │
//   ├────────────────────────────────────────┤
//   │ Lista de clases del día (cards)        │
//   └────────────────────────────────────────┘
//
// Estado: conectado al backend vía getTeacherSchedule().
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
import { useRouter } from 'expo-router';

// Iconos Lucide (los que se usan fuera del sistema color/icon dinámico).
import {
  ChevronLeft,
  Clock,
  Users,
  Coffee,
  MapPin,
} from 'lucide-react-native';

// Hook del dashboard docente.
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Servicio.
import { getTeacherSchedule } from '@/src/services/teacherService';

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
// STAT CARD
// ---------------------------------------------------------------------
const StatCard = ({ label, value, icon: Icon, iconBg, iconColor }) => (
  <View
    className="flex-1 bg-white rounded-2xl p-3 items-center border border-slate-100"
    style={{
      shadowColor: '#0F172A',
      shadowOpacity: 0.04,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    }}
  >
    <View
      className={`items-center justify-center rounded-xl ${iconBg}`}
      style={{ width: 36, height: 36 }}
    >
      <Icon size={18} color={iconColor} strokeWidth={2.25} />
    </View>
    <Text
      className="mt-2 text-slate-900"
      style={{ fontSize: 18, fontWeight: '800' }}
    >
      {value}
    </Text>
    <Text
      className="text-slate-500"
      style={{ fontSize: 10, fontWeight: '600', textAlign: 'center' }}
    >
      {label}
    </Text>
  </View>
);

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
  // Módulo libre: "Sin clase"
  if (clase.isFree) {
    return (
      <View
        className="flex-row items-center rounded-xl p-3 mx-4"
        style={{
          backgroundColor: '#F8FAFC',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          borderStyle: 'dashed',
        }}
      >
        <View
          className="items-center justify-center rounded-lg"
          style={{ backgroundColor: '#F1F5F9', width: 36, height: 36 }}
        >
          <Clock size={16} color="#94A3B8" strokeWidth={2.25} />
        </View>
        <View className="ml-3 flex-1">
          <Text
            className="text-slate-400"
            style={{ fontSize: 13, fontWeight: '600' }}
          >
            Sin clase
          </Text>
          <Text
            className="text-slate-400"
            style={{ fontSize: 11 }}
          >
            {`${clase.startTime} – ${clase.endTime}`}
          </Text>
        </View>
      </View>
    );
  }

  // Receso
  if (clase.isBreak) {
    return (
      <View
        className="flex-row items-center rounded-xl p-3 mx-4"
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
          <Coffee size={16} color="#94A3B8" strokeWidth={2.25} />
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
            {`${clase.startTime} – ${clase.endTime}`}
          </Text>
        </View>
      </View>
    );
  }

  // Clase normal: color e ícono vienen del backend
  // (clase.subject.color / clase.subject.icon). Si faltan, caen
  // al fallback definido en subjectIcons.js.
  const isTaller = clase.is_taller || clase.group?.type === 'taller';
  const subjectColor = getSubjectColor(clase.subject?.color);
  const SubjectIcon = getSubjectIcon(clase.subject?.icon);

  return (
    <View
      className="flex-row items-center rounded-xl p-3 mx-4"
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
            {clase.subject?.name || 'Sin materia'}
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
        {clase.group && (
          <View className="flex-row items-center mt-0.5">
            <Users size={11} color="#64748B" strokeWidth={2} />
            <Text
              className="ml-1 text-slate-500"
              style={{ fontSize: 11, fontWeight: '500' }}
            >
              {clase.group.label || `${clase.group.grade}°${clase.group.section}`}
            </Text>
          </View>
        )}
        <View className="flex-row items-center mt-0.5">
          <Clock size={11} color="#64748B" strokeWidth={2} />
          <Text
            className="ml-1 text-slate-500"
            style={{ fontSize: 11 }}
          >
            {`${clase.startTime} – ${clase.endTime}`}
            {clase.blockCount > 1 ? ` (${clase.blockCount} módulos)` : ''}
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
export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ============================================================
  // FETCH: cargar horario
  // ============================================================
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchSchedule = async () => {
      setIsLoading(true);
      setError(null);
      const result = await getTeacherSchedule();
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
  }, []);

  // ============================================================
  // TAB DEL DÍA ACTUAL
  // ============================================================
  const todayKey = scheduleData?.today?.toString() || '1';
  const [activeDay, setActiveDay] = useState(todayKey);

  // Sincronizar tab con today cuando llegan los datos.
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

  const stats = scheduleData?.stats || {};

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
          accessibilityLabel="Volver al dashboard"
          className="items-center justify-center -ml-2"
          style={{ padding: 8 }}
          hitSlop={8}
        >
          <ChevronLeft size={22} color="#0F172A" strokeWidth={2.25} />
        </Pressable>
        <Text
          className="flex-1 ml-1 text-slate-900"
          style={{ fontSize: 17, fontWeight: '700' }}
        >
          Mi Horario Semanal
        </Text>
      </View>

      {/* STATS ROW */}
      <View className="flex-row px-4 mt-3" style={{ gap: 8 }}>
        <StatCard
          label="Horas/Semana"
          value={stats.weeklyHours || 0}
          icon={Clock}
          iconBg="bg-blue-100"
          iconColor="#0284C7"
        />
        <StatCard
          label="Grupos"
          value={stats.groupsCount || 0}
          icon={Users}
          iconBg="bg-emerald-100"
          iconColor="#059669"
        />
        <StatCard
          label="Libres/Semana"
          value={stats.freeHoursWeekly || 0}
          icon={Coffee}
          iconBg="bg-amber-100"
          iconColor="#D97706"
        />
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

      {/* CONTENIDO: Lista de clases */}
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
              style={{ fontSize: 11 }}
            >
              {activeDay === todayKey
                ? 'Hoy no tienes clases programadas'
                : `No hay clases el ${DAY_NAMES[activeDay]}`}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {dayClasses.map((clase, index) => (
              <ClaseCard
                key={`${clase.startTime}-${clase.endTime}-${index}`}
                clase={clase}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
