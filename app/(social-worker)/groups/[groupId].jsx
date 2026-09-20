// =====================================================================
// app/(social-worker)/groups/[groupId].jsx
// ---------------------------------------------------------------------
// Detalle de un grupo del trabajador social. Muestra 3 sub-secciones:
//   1. Alumnos — lista de alumnos del grupo
//   2. Asistencia — asistencia biométrica del día con override
//   3. Horario — horario semanal del grupo
// =====================================================================

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Users,
  ClipboardCheck,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  MapPin,
} from 'lucide-react-native';

import { useAuth } from '@/src/hooks/useAuth';
import { useSocialWorkerDashboard } from '@/src/hooks/useSocialWorkerDashboard';
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import { getSubjectColor, getSubjectIcon, tintWithAlpha } from '@/src/utils/subjectIcons';
import {
  getGroupStudents,
  getAttendanceLogs,
  manualOverrideAttendance,
  getGroupSchedule,
} from '@/src/services/socialWorkerService';

const SEGMENTS = [
  { id: 'attendance', label: 'Asistencia', icon: ClipboardCheck },
  { id: 'schedule', label: 'Horario', icon: Calendar },
  { id: 'students', label: 'Alumnos', icon: Users },
];

const STATUS_COLORS = {
  on_time: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Presente' },
  absent: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Falta' },
};

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function SocialWorkerGroupDetailScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams();
  const { user } = useAuth();
  const { data: dashboardData } = useSocialWorkerDashboard();

  const school = React.useMemo(() => {
    if (!dashboardData?.school) return null;
    return {
      ...dashboardData.school,
      logo_url: dashboardData.school.logoUrl,
      current_school_year: dashboardData.school.cycle || null,
    };
  }, [dashboardData?.school, dashboardData?.currentSchoolYear]);

  const currentDate = dashboardData?.currentDate || '';

  const [activeSegment, setActiveSegment] = useState('attendance');
  const [students, setStudents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [overridingId, setOverridingId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(() => {
    const day = new Date().getDay();
    return day >= 1 && day <= 5 ? day : 1;
  });

  // Fetch students
  const fetchStudents = useCallback(async () => {
    if (!groupId) return;
    try {
      const result = await getGroupStudents(groupId);
      if (result.success) {
        const items = result.data?.items || [];
        // Sort by last_name
        items.sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));
        setStudents(items);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  }, [groupId]);

  // Fetch attendance for selected date
  const fetchAttendance = useCallback(async () => {
    if (!groupId) return;
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const dayStart = new Date(dateStr);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(dateStr);
      dayEnd.setUTCHours(23, 59, 59, 999);

      const result = await getAttendanceLogs({
        group_id: groupId,
        from: dayStart.toISOString(),
        to: dayEnd.toISOString(),
        limit: 200,
      });
      if (result.success) {
        setAttendanceLogs(result.data?.items || []);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  }, [groupId, selectedDate]);

  // Fetch schedule
  const fetchSchedule = useCallback(async () => {
    if (!groupId) return;
    try {
      const result = await getGroupSchedule(groupId);
      if (result.success) {
        setSchedule(result.data);
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
    }
  }, [groupId]);

  // Initial fetch
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([fetchStudents(), fetchAttendance(), fetchSchedule()]);
      setIsLoading(false);
    };
    loadAll();
  }, [fetchStudents, fetchAttendance, fetchSchedule]);

  // Refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStudents(), fetchAttendance(), fetchSchedule()]);
    setIsRefreshing(false);
  }, [fetchStudents, fetchAttendance, fetchSchedule]);

  // Refetch attendance when date changes
  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, fetchAttendance]);

  // Manual override: mark student present
  const handleOverride = useCallback(
    async (studentId, studentName) => {
      setOverridingId(studentId);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const result = await manualOverrideAttendance({
          student_id: studentId,
          date: dateStr,
          status: 'present',
        });
        if (result.success) {
          await fetchAttendance();
          Alert.alert(
            'Asistencia registrada',
            `${studentName} fue marcado(a) como presente. Se notificó al tutor.`,
            [{ text: 'OK' }]
          );
        }
      } catch (err) {
        console.error('Error overriding attendance:', err);
      } finally {
        setOverridingId(null);
      }
    },
    [selectedDate, fetchAttendance],
  );

  // Compute attendance stats
  const attendanceStats = useMemo(() => {
    const present = attendanceLogs.filter((l) => l.status === 'on_time').length;
    const absent = students.length - present;
    return { present, absent, total: students.length };
  }, [attendanceLogs, students.length]);

  // Students with attendance status
  const studentsWithIssues = useMemo(() => {
    const issueMap = new Map();
    for (const log of attendanceLogs) {
      if (log.status) {
        const studentId = log.student_id?._id || log.student_id;
        issueMap.set(studentId, log.status);
      }
    }
    return students.map((s) => ({
      ...s,
      attendanceStatus: issueMap.get(s._id) || null,
    }));
  }, [students, attendanceLogs]);

  // Group schedule by day (backend returns {schedule: {1:[], 2:[]}})
  const scheduleByDay = useMemo(() => {
    if (!schedule?.schedule) return {};
    const byDay = {};
    Object.entries(schedule.schedule).forEach(([day, slots]) => {
      byDay[Number(day)] = Array.isArray(slots) ? slots : [];
    });
    return byDay;
  }, [schedule]);

  // Navigate to student detail
  const goToStudent = useCallback(
    (studentId) => {
      router.push(`/(social-worker)/students/${studentId}`);
    },
    [router],
  );

  // Render segment tabs
  const renderSegments = () => (
    <View className="flex-row px-4 mt-3 mb-3 bg-slate-100 rounded-xl p-1">
      {SEGMENTS.map((seg) => {
        const isActive = activeSegment === seg.id;
        const Icon = seg.icon;
        return (
          <Pressable
            key={seg.id}
            onPress={() => setActiveSegment(seg.id)}
            className="flex-1 flex-row items-center justify-center py-2.5"
            style={{
              backgroundColor: isActive ? '#ffffff' : 'transparent',
              borderRadius: 10,
              elevation: isActive ? 2 : 0,
            }}
          >
            <Icon
              size={14}
              color={isActive ? '#4F46E5' : '#64748B'}
              strokeWidth={2}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: isActive ? '700' : '500',
                color: isActive ? '#4F46E5' : '#64748B',
                marginLeft: 4,
              }}
            >
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  // Render student item (estilo card consistente con la pantalla global de alumnos)
  const renderStudent = useCallback(
    ({ item, index }) => {
      const groupLabel = item.current_group_id
        ? `${item.current_group_id.grade || ''}°${item.current_group_id.section || ''}`
        : '';
      return (
        <Pressable
          onPress={() => goToStudent(item._id)}
          accessibilityRole="button"
          accessibilityLabel={`Ver ficha de ${item.last_name} ${item.first_name}`}
        >
          <View
            className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 flex-row items-center"
            style={{
              elevation: 2,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
              <Text className="text-xs font-bold text-blue-700">
                {`${item.first_name?.[0] || ''}${item.last_name?.[0] || ''}`.toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-900">
                {index + 1}. {item.last_name}, {item.first_name}
              </Text>
              <Text className="text-xs text-slate-500 mt-0.5">
                {groupLabel}{groupLabel && item.controlNumber ? ' • ' : ''}{item.controlNumber || ''}
              </Text>
            </View>
            <ChevronRight size={16} color="#CBD5E1" strokeWidth={2} />
          </View>
        </Pressable>
      );
    },
    [goToStudent],
  );

  // Render attendance item (estilo card consistente con la pantalla global de alumnos)
  const renderAttendanceItem = useCallback(
    ({ item, index }) => {
      const statusInfo = item.attendanceStatus
        ? STATUS_COLORS[item.attendanceStatus]
        : null;
      const isPresent = item.attendanceStatus === 'on_time';
      const isOverriding = overridingId === item._id;
      const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim();

      return (
        <View
          className="bg-white rounded-2xl p-4 mb-3 border border-slate-100"
          style={{
            elevation: 2,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
              <Text className="text-xs font-bold text-blue-700">
                {`${item.first_name?.[0] || ''}${item.last_name?.[0] || ''}`.toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-900">
                {index + 1}. {item.last_name}, {item.first_name}
              </Text>
              <Text className="text-xs text-slate-500 mt-0.5">
                No. Control {item.controlNumber || '—'}
              </Text>
            </View>
            {statusInfo ? (
              <View className={`px-2 py-1 rounded-full ${statusInfo.bg}`}>
                <Text className={`text-[10px] font-bold ${statusInfo.text}`}>
                  {statusInfo.label}
                </Text>
              </View>
            ) : (
              <View className="px-2 py-1 rounded-full bg-slate-100">
                <Text className="text-[10px] font-bold text-slate-400">Sin registro</Text>
              </View>
            )}
          </View>
          {!isPresent && (
            <View className="flex-row justify-end mt-2">
              <Pressable
                onPress={() => handleOverride(item._id, fullName)}
                disabled={isOverriding}
                className="px-3 py-1.5 rounded-lg bg-emerald-500"
                style={{ opacity: isOverriding ? 0.6 : 1 }}
              >
                {isOverriding ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-white text-[10px] font-bold">Marcar</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      );
    },
    [overridingId, handleOverride],
  );

  // Render schedule slot (backend flat format: clase.color, clase.icon, clase.subject)
  const renderScheduleSlot = useCallback((clase, index) => {
    // Receso
    if (clase.type === 'receso') {
      return (
        <View
          key={index}
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
            <Text className="text-slate-400" style={{ fontSize: 13, fontWeight: '600' }}>
              Receso
            </Text>
            <Text className="text-slate-400" style={{ fontSize: 11 }}>
              {`${clase.start} – ${clase.end}`}
            </Text>
          </View>
        </View>
      );
    }

    const isTaller = clase.classificationType === 'TALLER' || clase.is_taller;
    const subjectColor = getSubjectColor(clase.color);
    const SubjectIcon = getSubjectIcon(clase.icon);

    return (
      <View
        key={index}
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
            <Text className="text-slate-900" style={{ fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
              {clase.subject || 'Sin materia'}
            </Text>
            {isTaller && (
              <View className="ml-2 px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: tintWithAlpha(subjectColor, 0.15) }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: subjectColor, textTransform: 'uppercase' }}>
                  Taller
                </Text>
              </View>
            )}
          </View>
          {clase.teacher && !isTaller && (
            <View className="flex-row items-center mt-0.5">
              <Text className="text-slate-500" style={{ fontSize: 11, fontWeight: '500' }}>
                {clase.teacher}
              </Text>
            </View>
          )}
          <View className="flex-row items-center mt-0.5">
            <Clock size={11} color="#64748B" strokeWidth={2} />
            <Text className="ml-1 text-slate-500" style={{ fontSize: 11 }}>
              {`${clase.start} – ${clase.end}`}
              {clase.block_count > 1 ? ` (${clase.block_count} módulos)` : ''}
            </Text>
          </View>
          {clase.classroom && (
            <View className="flex-row items-center mt-0.5">
              <MapPin size={11} color="#64748B" strokeWidth={2} />
              <Text className="ml-1 text-slate-500" style={{ fontSize: 11 }} numberOfLines={1}>
                {clase.classroom}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }, []);

  // Render content based on active segment
  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-slate-400 text-sm mt-3">Cargando...</Text>
        </View>
      );
    }

    switch (activeSegment) {
      case 'students':
        return (
          <FlatList
            data={students}
            renderItem={renderStudent}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100 }}
            ListEmptyComponent={
              <View className="items-center py-12">
                <Users size={40} color="#CBD5E1" strokeWidth={1.5} />
                <Text className="text-slate-400 text-sm mt-3">No hay alumnos en este grupo</Text>
              </View>
            }
          />
        );

      case 'attendance':
        return (
          <View className="px-4 flex-1">
            {/* Date selector */}
            <View className="flex-row items-center justify-between mt-2 mb-3">
              <Pressable
                onPress={() => {
                  const prev = new Date(selectedDate);
                  prev.setDate(prev.getDate() - 1);
                  setSelectedDate(prev);
                }}
                className="px-3 py-2 rounded-lg bg-slate-100"
              >
                <Text className="text-sm font-semibold text-slate-600">← Anterior</Text>
              </Pressable>
              <Text className="text-sm font-bold text-slate-900">
                {selectedDate.toLocaleDateString('es-MX', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
              <Pressable
                onPress={() => {
                  const next = new Date(selectedDate);
                  next.setDate(next.getDate() + 1);
                  setSelectedDate(next);
                }}
                className="px-3 py-2 rounded-lg bg-slate-100"
              >
                <Text className="text-sm font-semibold text-slate-600">Siguiente →</Text>
              </Pressable>
            </View>

            {/* Stats */}
            <View className="flex-row mb-3 gap-2">
              <View className="flex-1 bg-emerald-50 rounded-xl p-3 items-center">
                <Text className="text-lg font-bold text-emerald-700">{attendanceStats.present}</Text>
                <Text className="text-[10px] text-emerald-600">Presentes</Text>
              </View>
              <View className="flex-1 bg-rose-50 rounded-xl p-3 items-center">
                <Text className="text-lg font-bold text-rose-700">{attendanceStats.absent}</Text>
                <Text className="text-[10px] text-rose-600">Faltas</Text>
              </View>
            </View>

            {/* Student list with attendance */}
            <FlatList
              data={studentsWithIssues}
              renderItem={renderAttendanceItem}
              keyExtractor={(item) => item._id}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingTop: 4, paddingBottom: 100 }}
              ListEmptyComponent={
                <View className="items-center py-12">
                  <ClipboardCheck size={40} color="#CBD5E1" strokeWidth={1.5} />
                  <Text className="text-slate-400 text-sm mt-3">No hay alumnos</Text>
                </View>
              }
            />
          </View>
        );

      case 'schedule':
        return (
          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Shift info */}
            {schedule?.shift_info && (
              <View className="mx-4 mt-3 bg-indigo-50 rounded-xl p-3 flex-row items-center">
                <Calendar size={16} color="#4F46E5" strokeWidth={2} />
                <Text className="ml-2 text-sm font-semibold text-indigo-700">
                  {schedule.shift_info.name} • {schedule.shift_info.start} – {schedule.shift_info.end}
                </Text>
              </View>
            )}

            {/* Day pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-4 mt-3"
              contentContainerStyle={{ gap: 6 }}
            >
              {[1, 2, 3, 4, 5].map((day) => {
                const isSelected = selectedDay === day;
                return (
                  <Pressable
                    key={day}
                    onPress={() => setSelectedDay(day)}
                    className="px-4 py-2 rounded-full"
                    style={{
                      backgroundColor: isSelected ? '#4F46E5' : '#F1F5F9',
                      borderWidth: 1,
                      borderColor: isSelected ? '#4F46E5' : '#E2E8F0',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: isSelected ? '700' : '500',
                        color: isSelected ? '#FFFFFF' : '#64748B',
                      }}
                    >
                      {DAY_NAMES_FULL[day] || `Día ${day}`}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Slots for selected day */}
            <View className="mt-3">
              {scheduleByDay[selectedDay]?.length > 0 ? (
                scheduleByDay[selectedDay].map((slot, idx) => renderScheduleSlot(slot, idx))
              ) : (
                <View className="items-center py-12">
                  <Calendar size={40} color="#CBD5E1" strokeWidth={1.5} />
                  <Text className="text-slate-400 text-sm mt-3">Sin clases este día</Text>
                </View>
              )}
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Shared Header */}
      <DashboardHeader />
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-2"
        teacher={dashboardData?.socialWorker}
        date={currentDate}
        user={user}
      />

      {/* Botón "Volver" */}
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Volver a Grupos"
        className="flex-row items-center px-4 mt-4"
      >
        <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
        <Text className="text-sm font-semibold text-sky-600 ml-1">
          Volver
        </Text>
      </Pressable>

      {/* Título */}
      <View className="px-4 mt-2 mb-1">
        <Text className="text-xl font-bold text-slate-900">
          Grupo {students[0]?.current_group_id?.grade || ''}°{students[0]?.current_group_id?.section || ''}
        </Text>
        <Text className="text-sm text-slate-500">
          {students.length} alumno{students.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Segments */}
      {renderSegments()}

      {/* Content */}
      {renderContent()}
    </View>
  );
}
