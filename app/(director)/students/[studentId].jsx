// =====================================================================
// app/(director)/students/[studentId].jsx
// ---------------------------------------------------------------------
// Ficha completa del alumno (trabajador social). Muestra datos
// personales, contacto, tutor legal, salud, e historial de citatorios
// y reportes. Incluye acceso directo a la ficha de salud/inclusión.
// =====================================================================

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  User,
  Phone,
  MapPin,
  Heart,
  Shield,
  FileText,
  Mail,
  Calendar,
  AlertTriangle,
  TrendingUp,
  XCircle,
  ChevronRight,
  Eye,
} from 'lucide-react-native';

import { useAuth } from '@/src/hooks/useAuth';
import { useDirectorDashboard } from '@/src/hooks/useDirectorDashboard';
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import {
  getStudentById,
  getConductLogs,
  getCitations,
} from '@/src/services/directorService';
import { getConductConfig } from '@/src/services/directorService';
import CitationsModal from '@/app/(director)/_components/CitationsModal';
import ConductModal from '@/app/(director)/_components/ConductModal';
import TrabajoSocialModal from '@/src/components/TrabajoSocialModal';

const SEX_LABELS = { male: 'Masculino', female: 'Femenino' };
const STATUS_LABELS = { active: 'Activo', withdrawn_temp: 'Baja temporal', withdrawn_permanent: 'Baja definitiva' };
const RELATIONSHIP_LABELS = { parent: 'Padre/Madre', father: 'Padre', mother: 'Madre', guardian: 'Tutor' };

export default function DirectorStudentDetail() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams();
  const { user } = useAuth();
  const { data: dashboardData } = useDirectorDashboard();

  const school = useMemo(() => {
    if (!dashboardData?.school) return null;
    return {
      ...dashboardData.school,
      logo_url: dashboardData.school.logoUrl,
      current_school_year: dashboardData.school.cycle || null,
    };
  }, [dashboardData?.school, dashboardData?.currentSchoolYear]);

  const currentDate = dashboardData?.currentDate || '';

  const [student, setStudent] = useState(null);
  const [conductLogs, setConductLogs] = useState([]);
  const [citations, setCitations] = useState([]);
  const [conductConfig, setConductConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Estados de modales
  const [isTrabajoSocialOpen, setIsTrabajoSocialOpen] = useState(false);
  const [isCitationsOpen, setIsCitationsOpen] = useState(false);
  const [isConductOpen, setIsConductOpen] = useState(false);

  const activeCitationsCount = useMemo(
    () => citations.filter(c => c.status !== 'cancelled').length,
    [citations]
  );

  const fetchStudentData = useCallback(async () => {
    if (!studentId) return;
    try {
      const [studentResult, conductResult, citationsResult, configResult] = await Promise.all([
        getStudentById(studentId),
        getConductLogs({ student_id: studentId }),
        getCitations({ student: studentId }),
        getConductConfig(),
      ]);

      if (studentResult.success) {
        setStudent(studentResult.data);
        setError(null);
      } else {
        setError(studentResult.message);
      }

      if (conductResult.success) {
        setConductLogs(conductResult.data?.items || []);
      }

      if (citationsResult.success) {
        setCitations(citationsResult.data?.items || []);
      }

      if (configResult.success) {
        setConductConfig(configResult.data);
      }
    } catch (err) {
      setError('Error al cargar información del alumno.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchStudentData();
  }, [fetchStudentData]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="text-slate-400 text-sm mt-3">Cargando ficha del alumno...</Text>
      </View>
    );
  }

  if (error || !student) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center px-6">
        <AlertTriangle size={40} color="#e11d48" strokeWidth={1.5} />
        <Text className="text-slate-900 text-lg font-bold mt-4">Error al cargar</Text>
        <Text className="text-slate-500 text-sm mt-2 text-center">{error || 'No se encontró el alumno'}</Text>
        <Pressable onPress={() => router.back()} className="mt-4 px-6 py-2.5 rounded-xl bg-slate-900">
          <Text className="text-white font-semibold">Volver</Text>
        </Pressable>
      </View>
    );
  }

  const guardians = student.guardians || [];
  const fullName = `${student.last_name || ''} ${student.first_name || ''}`.trim();

  return (
    <View className="flex-1 bg-slate-50">
      {/* Encabezado compartido */}
      <DashboardHeader />
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-2"
        teacher={dashboardData?.director}
        date={currentDate}
        user={user}
      />

      {/* Botón "Volver" */}
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Volver a Alumnos"
        className="flex-row items-center px-4 mt-4"
      >
        <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
        <Text className="text-sm font-semibold text-sky-600 ml-1">
          Volver
        </Text>
      </Pressable>

      {/* Título */}
      <View className="px-4 mt-2 mb-1">
        <Text className="text-xl font-bold text-slate-900">Ficha del Alumno</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#4F46E5']} />
        }
      >
        {/* Tarjeta de perfil */}
        <View
          className="mx-4 mt-4 bg-white rounded-2xl p-5 border border-indigo-200 items-center"
          style={{
            borderLeftWidth: 4,
            borderLeftColor: '#4F46E5',
            shadowColor: '#0F172A',
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
        >
          {/* Avatar */}
          {student.photoUrl ? (
            <Image
              source={{ uri: student.photoUrl }}
              style={{ width: 96, height: 96, borderRadius: 48 }}
              accessibilityLabel={`Foto de ${fullName}`}
            />
          ) : (
            <View
              className="items-center justify-center"
              style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#E0E7FF' }}
            >
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#4F46E5' }}>
                {`${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase()}
              </Text>
            </View>
          )}

          {/* Nombre */}
          <Text className="text-xl font-bold text-slate-900 mt-3">{fullName}</Text>

          {/* Grupo + No. Control en la misma línea */}
          <View className="flex-row items-center mt-1">
            <Text className="text-base text-slate-600">
              {student.current_group_id?.grade || ''}°{student.current_group_id?.section || ''}
            </Text>
            {student.controlNumber && (
              <>
                <Text className="text-slate-300 mx-2">•</Text>
                <Text className="text-base text-slate-500">
                  No. {student.controlNumber}
                </Text>
              </>
            )}
          </View>

          {/* Badge de estado */}
          <View className={`px-2.5 py-1 rounded-full mt-2 ${student.status === 'active' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
            <Text className={`text-[11px] font-bold ${student.status === 'active' ? 'text-emerald-700' : 'text-amber-700'}`}>
              {STATUS_LABELS[student.status] || student.status}
            </Text>
          </View>
        </View>

        {/* Tutor Legal */}
        <View
          className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-sky-200"
          style={{
            borderLeftWidth: 4,
            borderLeftColor: '#0EA5E9',
            shadowColor: '#0F172A',
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <Text className="text-base font-bold text-slate-900 mb-3">Tutor Legal</Text>
          {guardians.length > 0 ? (
            guardians.map((guardian, idx) => (
              <View key={guardian._id || idx} className={idx > 0 ? 'mt-3 pt-3 border-t border-slate-100' : ''}>
                <InfoRow icon={Shield} label="Nombre" value={guardian.name} />
                {guardian.phone && <InfoRow icon={Phone} label="Teléfono" value={guardian.phone} />}
                {guardian.relationship && <InfoRow icon={User} label="Parentesco" value={RELATIONSHIP_LABELS[guardian.relationship] || guardian.relationship} />}
              </View>
            ))
          ) : (
            <Text className="text-base text-slate-400 italic">Sin tutor registrado</Text>
          )}
        </View>

        {/* Datos personales */}
        {(() => {
          const hasData = student.curp || student.sex || student.blood_type || student.address || student.date_of_birth;
          return (
            <View
              className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-violet-200"
              style={{
                borderLeftWidth: 4,
                borderLeftColor: '#7C3AED',
                shadowColor: '#0F172A',
                shadowOpacity: 0.06,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              <Text className="text-base font-bold text-slate-900 mb-3">Datos Personales</Text>
              {hasData ? (
                <>
                  <InfoRow icon={FileText} label="CURP" value={student.curp} />
                  {student.sex && <InfoRow icon={User} label="Sexo" value={SEX_LABELS[student.sex] || student.sex} />}
                  {student.blood_type && <InfoRow icon={Heart} label="Tipo de sangre" value={student.blood_type} />}
                  {student.address && <InfoRow icon={MapPin} label="Dirección" value={student.address} />}
                  {student.date_of_birth && (
                    <InfoRow
                      icon={Calendar}
                      label="Fecha de nacimiento"
                      value={new Date(student.date_of_birth).toLocaleDateString('es-MX')}
                    />
                  )}
                </>
              ) : (
                <Text className="text-base text-slate-400 italic">Sin datos registrados</Text>
              )}
            </View>
          );
        })()}

        {/* Salud */}
        {student.medical_notes && (
          <View
            className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-rose-200"
            style={{
              borderLeftWidth: 4,
              borderLeftColor: '#E11D48',
              shadowColor: '#0F172A',
              shadowOpacity: 0.06,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text className="text-base font-bold text-slate-900 mb-3">Salud</Text>
            <InfoRow icon={AlertTriangle} label="Notas médicas" value={student.medical_notes} />
          </View>
        )}

        {/* ============================================================
            TRIGGER: Trabajo Social
            ============================================================ */}
        <Pressable
          onPress={() => setIsTrabajoSocialOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Ver trabajo social"
          className="bg-white rounded-2xl mx-4 mt-3 px-4 py-4 border border-emerald-200 flex-row items-center"
          style={{
            borderLeftWidth: 4,
            borderLeftColor: '#059669',
            shadowColor: '#0F172A',
            shadowOpacity: 0.04,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        >
          <View className="items-center justify-center" style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#D1FAE5' }}>
            <Eye size={20} color="#059669" strokeWidth={2.25} />
          </View>
          <Text className="flex-1 ml-3 text-slate-900" style={{ fontSize: 14, fontWeight: '700' }}>
            Trabajo Social
          </Text>
          <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
        </Pressable>

        {/* ============================================================
            TRIGGER: Citatorios
            ============================================================ */}
        <Pressable
          onPress={() => setIsCitationsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Ver citatorios"
          className="bg-white rounded-2xl mx-4 mt-3 px-4 py-4 border border-amber-200 flex-row items-center"
          style={{
            borderLeftWidth: 4,
            borderLeftColor: '#D97706',
            shadowColor: '#0F172A',
            shadowOpacity: 0.04,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        >
          <View className="items-center justify-center" style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#FEF3C7' }}>
            <FileText size={20} color="#D97706" strokeWidth={2.25} />
          </View>
          <Text className="flex-1 ml-3 text-slate-900" style={{ fontSize: 14, fontWeight: '700' }}>
            Citatorios
          </Text>
          {activeCitationsCount > 0 && (
            <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FED7AA' }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#C2410C', letterSpacing: 0.3 }}>
                {activeCitationsCount}
              </Text>
            </View>
          )}
          <ChevronRight size={18} color="#94A3B8" strokeWidth={2} className="ml-2" />
        </Pressable>

        {/* ============================================================
            TRIGGER: Conducta
            ============================================================ */}
        <Pressable
          onPress={() => setIsConductOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Ver conducta"
          className="bg-white rounded-2xl mx-4 mt-3 px-4 py-4 border border-rose-200 flex-row items-center"
          style={{
            borderLeftWidth: 4,
            borderLeftColor: '#E11D48',
            shadowColor: '#0F172A',
            shadowOpacity: 0.04,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        >
          <View className="items-center justify-center" style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#FEF2F2' }}>
            <TrendingUp size={20} color="#E11D48" strokeWidth={2.25} />
          </View>
          <Text className="flex-1 ml-3 text-slate-900" style={{ fontSize: 14, fontWeight: '700' }}>
            Conducta
          </Text>
          {conductLogs.length > 0 && (
            <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FECDD3' }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#9F1239', letterSpacing: 0.3 }}>
                {conductLogs.length}
              </Text>
            </View>
          )}
          <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
        </Pressable>

      </ScrollView>

      {/* Modales */}
      <TrabajoSocialModal
        isVisible={isTrabajoSocialOpen}
        onClose={() => setIsTrabajoSocialOpen(false)}
        healthInclusion={student?.health_inclusion}
      />
      <CitationsModal
        isVisible={isCitationsOpen}
        onClose={() => setIsCitationsOpen(false)}
        citations={citations}
      />
      <ConductModal
        isVisible={isConductOpen}
        onClose={() => setIsConductOpen(false)}
        conductLogs={conductLogs}
        conductConfig={conductConfig}
      />
    </View>
  );
}

// Componente helper para filas de información
function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <View className="flex-row items-start mb-2.5">
      <Icon size={16} color="#94A3B8" strokeWidth={2} style={{ marginTop: 2, marginRight: 10 }} />
      <View className="flex-1">
        <Text className="text-sm text-slate-400">{label}</Text>
        <Text className="text-base text-slate-900" style={{ fontWeight: '500' }}>{value}</Text>
      </View>
    </View>
  );
}
