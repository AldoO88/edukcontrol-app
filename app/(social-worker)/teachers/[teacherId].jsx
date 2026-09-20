// =====================================================================
// app/(social-worker)/teachers/[teacherId].jsx
// ---------------------------------------------------------------------
// Detalle de un maestro. Muestra información de contacto y horario
// semanal. Los padres pueden solicitar citas con ellos.
// =====================================================================

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  Users,
  Clock,
} from 'lucide-react-native';

import { useAuth } from '@/src/hooks/useAuth';
import { useSocialWorkerDashboard } from '@/src/hooks/useSocialWorkerDashboard';
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import { getTeacherScheduleById, getTeacherById } from '@/src/services/socialWorkerService';
import { getSubjectIcon, tintWithAlpha } from '@/src/utils/subjectIcons';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const FALLBACK_COLOR = '#6366F1';

export default function SocialWorkerTeacherDetailScreen() {
  const router = useRouter();
  const { teacherId } = useLocalSearchParams();
  const { user } = useAuth();
  const { data: dashboardData } = useSocialWorkerDashboard();
  const school = dashboardData?.school
    ? { ...dashboardData.school, logo_url: dashboardData.school.logoUrl, current_school_year: dashboardData.currentSchoolYear?.name || null }
    : null;
  const currentDate = dashboardData?.currentDate || '';

  const [teacher, setTeacher] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [assignedGroups, setAssignedGroups] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!teacherId) return;
    try {
      const [teacherResult, scheduleResult] = await Promise.all([
        getTeacherById(teacherId),
        getTeacherScheduleById(teacherId),
      ]);

      if (teacherResult.success) {
        setTeacher(teacherResult.data?.teacher || teacherResult.data);
        setSubjects(teacherResult.data?.subjects || []);
        setAssignedGroups(teacherResult.data?.assignedGroups || []);
        setError(null);
      } else {
        setError(teacherResult.message);
      }

      if (scheduleResult.success) {
        setSchedule(scheduleResult.data);
        setStats(scheduleResult.data?.stats || null);
      }
    } catch (err) {
      setError('Error al cargar información del maestro.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Schedule from backend (already grouped by day)
  const scheduleByDay = React.useMemo(() => {
    if (!schedule) return {};
    // Backend returns { teacher, schedule: { 1: [...], 2: [...] }, dayNames, stats }
    const sched = schedule?.schedule || schedule;
    if (sched && typeof sched === 'object' && !Array.isArray(sched)) {
      return sched;
    }
    return {};
  }, [schedule]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="text-slate-400 text-sm mt-3">Cargando horario...</Text>
      </View>
    );
  }

  if (error || !teacher) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center px-6">
        <Text className="text-slate-900 text-lg font-bold mt-4">Error al cargar</Text>
        <Text className="text-slate-500 text-sm mt-2 text-center">{error || 'No se encontró el maestro'}</Text>
        <Pressable onPress={() => router.back()} className="mt-4 px-6 py-2.5 rounded-xl bg-slate-900">
          <Text className="text-white font-semibold">Volver</Text>
        </Pressable>
      </View>
    );
  }

  const teacherName = teacher.fullName || `${teacher.last_name || ''} ${teacher.name || ''}`.trim();

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
        accessibilityLabel="Volver a Maestros"
        className="flex-row items-center px-4 mt-4"
      >
        <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
        <Text className="text-sm font-semibold text-sky-600 ml-1">
          Volver
        </Text>
      </Pressable>

      {/* Título */}
      <View className="px-4 mt-2 mb-1">
        <Text className="text-xl font-bold text-slate-900">Horario del Maestro</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#7C3AED']} />
        }
      >
        {/* Teacher Info Card */}
        <View
          className="mx-4 mt-4 bg-white rounded-2xl p-4 border border-slate-100"
          style={{
            elevation: 2,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <View className="flex-row items-center">
            <View className="w-14 h-14 rounded-full bg-purple-100 items-center justify-center mr-4">
              <Text className="text-lg font-bold text-purple-600">
                {`${teacher.name?.[0] || ''}${teacher.last_name?.[0] || ''}`.toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-slate-900">{teacherName}</Text>
              {teacher.phoneNumber && (
                <View className="flex-row items-center mt-1">
                  <Phone size={12} color="#94A3B8" strokeWidth={2} />
                  <Text className="text-xs text-slate-500 ml-1">{teacher.phoneNumber}</Text>
                </View>
              )}
              {teacher.email && (
                <View className="flex-row items-center mt-0.5">
                  <Mail size={12} color="#94A3B8" strokeWidth={2} />
                  <Text className="text-xs text-slate-500 ml-1">{teacher.email}</Text>
                </View>
              )}
              {stats?.weeklyHours > 0 && (
                <View className="flex-row items-center mt-0.5">
                  <Clock size={12} color="#94A3B8" strokeWidth={2} />
                  <Text className="text-xs text-slate-500 ml-1">
                    {stats.weeklyHours} hora{stats.weeklyHours !== 1 ? 's' : ''}/semana • {stats.groupsCount} grupo{stats.groupsCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Subjects */}
        {subjects.length > 0 && (
          <View
            className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-slate-100"
            style={{
              elevation: 2,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <Text className="text-sm font-bold text-slate-900 mb-2">Materias</Text>
            <View className="flex-row flex-wrap gap-2">
              {subjects.map((sub) => {
                const Icon = getSubjectIcon(sub.icon);
                const hexColor = sub.color || FALLBACK_COLOR;
                const bgColor = tintWithAlpha(hexColor, 0.1);
                return (
                  <View
                    key={sub._id}
                    style={{ backgroundColor: bgColor }}
                    className="flex-row items-center px-3 py-1.5 rounded-full"
                  >
                    <Icon size={12} color={hexColor} strokeWidth={2} />
                    <Text style={{ color: hexColor }} className="text-xs font-semibold ml-1">{sub.name}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Assigned Groups */}
        {assignedGroups.length > 0 && (
          <View
            className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-slate-100"
            style={{
              elevation: 2,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <Text className="text-sm font-bold text-slate-900 mb-2">Grupos Asignados</Text>
            <View className="flex-row flex-wrap gap-2">
              {assignedGroups.map((group) => (
                <View key={group._id} className="flex-row items-center bg-indigo-50 px-3 py-1.5 rounded-full">
                  <Users size={12} color="#4F46E5" strokeWidth={2} />
                  <Text className="text-xs font-semibold text-indigo-700 ml-1">{group.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Weekly Schedule */}
        <View
          className="mx-4 mt-3 mb-4 bg-white rounded-2xl p-4 border border-slate-100"
          style={{
            elevation: 2,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <Text className="text-sm font-bold text-slate-900 mb-3">Horario Semanal</Text>
          {Object.entries(scheduleByDay).length > 0 ? (
            Object.entries(scheduleByDay).map(([day, slots]) => (
              <View key={day} className="mb-4">
                <Text className="text-xs font-bold text-slate-600 mb-2">
                  {DAY_NAMES_FULL[day] || `Día ${day}`}
                </Text>
                {slots.map((slot, idx) => {
                  const Icon = getSubjectIcon(slot.subject?.icon);
                  const hexColor = slot.subject?.color || FALLBACK_COLOR;
                  const bgColor = tintWithAlpha(hexColor, 0.1);
                  return (
                    <View
                      key={idx}
                      style={{ backgroundColor: bgColor }}
                      className="rounded-xl p-3 mb-2"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 flex-row items-center">
                          <Icon size={14} color={hexColor} strokeWidth={2} />
                          <View className="ml-2 flex-1">
                            <Text style={{ color: hexColor }} className="text-sm font-bold">
                              {slot.subject?.name || slot.subject_name || 'Materia'}
                            </Text>
                            <Text className="text-xs text-slate-500 mt-0.5">
                              Grupo {slot.group?.grade || ''}°{slot.group?.section || ''} • {slot.classroom || ''}
                            </Text>
                          </View>
                        </View>
                        {(slot.startTime || slot.timeBlocks) && (
                          <View className="flex-row items-center">
                            <Clock size={10} color="#94A3B8" strokeWidth={2} />
                            <Text className="text-[10px] text-slate-400 ml-1">
                              {slot.startTime && slot.endTime
                                ? `${slot.startTime} - ${slot.endTime}`
                                : slot.timeBlocks?.length > 0
                                  ? `${slot.timeBlocks[0]?.startTime} - ${slot.timeBlocks[slot.timeBlocks.length - 1]?.endTime}`
                                  : ''
                              }
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          ) : (
            <View className="items-center py-6">
              <Calendar size={24} color="#CBD5E1" strokeWidth={1.5} />
              <Text className="text-slate-400 text-sm mt-2">No hay horario disponible</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
