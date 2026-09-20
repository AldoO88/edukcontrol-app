// =====================================================================
// app/(social-worker)/student-health/[studentId].jsx
// ---------------------------------------------------------------------
// Expediente del alumno. Ficha de Salud e Inclusión reestructurada
// con navegación por pestañas: Personales, Familia, Salud,
// Emergencia, Intervenciones y Notas.
// =====================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  User,
  Users,
  Heart,
  Phone,
  Handshake,
  AlertTriangle,
} from 'lucide-react-native';

import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import TabSelector from '@/src/components/TabSelector';
import { useAuth } from '@/src/hooks/useAuth';
import { useSocialWorkerDashboard } from '@/src/hooks/useSocialWorkerDashboard';
import {
  getStudentById,
  getStudentHealth,
  updateStudentHealth,
  getAgreementsByStudent,
  getReferralsByStudent,
} from '@/src/services/socialWorkerService';

// Importar pestañas
import PersonalTab from './_tabs/PersonalTab';
import FamilyTab from './_tabs/FamilyTab';
import HealthTab from './_tabs/HealthTab';
import EmergencyContactsTab from './_tabs/EmergencyContactsTab';
import InterventionsTab from './_tabs/InterventionsTab';
import NotesTab from './_tabs/NotesTab';

// ---------------------------------------------------------------------
// Definición de pestañas
// ---------------------------------------------------------------------
const TABS = [
  { id: 'personal', label: 'Personales', icon: User },
  { id: 'family', label: 'Familia', icon: Users },
  { id: 'health', label: 'Salud', icon: Heart },
  { id: 'emergency', label: 'Emergencia', icon: Phone },
  { id: 'interventions', label: 'Intervenciones', icon: Handshake },
  { id: 'notes', label: 'Notas', icon: AlertTriangle },
];

// ---------------------------------------------------------------------
// Campos guardables por cada pestaña
// ---------------------------------------------------------------------
const TAB_FIELDS = {
  family: ['family_socioeconomic'],
  health: [
    'learning_style', 'style_hint', 'diagnosis', 'disability_type',
    'disability_severity', 'medical_conditions', 'medications',
    'allergies', 'health_insurance', 'vaccination_authorization',
    'protection_civil_authorization',
  ],
  emergency: ['emergency_contacts'],
  notes: ['alerts', 'notes', 'last_evaluation_date'],
};

// ---------------------------------------------------------------------
// Estado inicial del formulario
// ---------------------------------------------------------------------
const EMPTY_FORM = {
  address: '',
  learning_style: '',
  style_hint: '',
  diagnosis: '',
  disability_type: 'ninguna',
  disability_severity: '',
  medical_conditions: [],
  medications: [],
  allergies: '',
  health_insurance: '',
  vaccination_authorization: false,
  protection_civil_authorization: false,
  family_socioeconomic: {
    family_members: [],
    family_dynamics: '',
    monthly_income: '',
    income_sources: '',
    housing_type: '',
    housing_materials: '',
    basic_services: '',
  },
  emergency_contacts: [],
  home_visits: [],
  alerts: [],
  notes: '',
  last_evaluation_date: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relationship: '',
  _newCondition: '',
  _newMedication: '',
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function HealthFormScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams();
  const { user } = useAuth();
  const { data: dashboardData } = useSocialWorkerDashboard();

  const school = React.useMemo(() => {
    if (!dashboardData?.school) return null;
    return {
      ...dashboardData.school,
      logo_url: dashboardData.school.logoUrl,
    };
  }, [dashboardData?.school]);

  const currentDate = dashboardData?.currentDate || '';

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [agreements, setAgreements] = useState([]);
  const [referrals, setReferrals] = useState([]);

  // ------------------------------------------------------------------
  // Cargar datos
  // ------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    if (!studentId) return;
    try {
      const [studentResult, healthResult, agreementsResult, referralsResult] = await Promise.all([
        getStudentById(studentId),
        getStudentHealth(studentId),
        getAgreementsByStudent(studentId),
        getReferralsByStudent(studentId),
      ]);

      if (studentResult.success) {
        setStudent(studentResult.data);
      }

      if (healthResult.success && healthResult.data) {
        const h = healthResult.data.healthInclusion || healthResult.data;
        setFormData({
          address: studentResult.data?.address || '',
          learning_style: h.learning_style || '',
          style_hint: h.style_hint || '',
          diagnosis: h.diagnosis || '',
          disability_type: h.disability_type || 'ninguna',
          disability_severity: h.disability_severity || '',
          medical_conditions: Array.isArray(h.medical_conditions) ? h.medical_conditions : [],
          medications: Array.isArray(h.medications) ? h.medications : [],
          allergies: h.allergies || '',
          health_insurance: h.health_insurance || '',
          vaccination_authorization: h.vaccination_authorization || false,
          protection_civil_authorization: h.protection_civil_authorization || false,
          family_socioeconomic: h.family_socioeconomic || {
            family_members: [],
            family_dynamics: '',
            monthly_income: '',
            income_sources: '',
            housing_type: '',
            housing_materials: '',
            basic_services: '',
          },
          emergency_contacts: Array.isArray(h.emergency_contacts) ? h.emergency_contacts : [],
          home_visits: Array.isArray(h.home_visits) ? h.home_visits : [],
          alerts: Array.isArray(h.alerts) ? h.alerts : [],
          notes: h.notes || '',
          last_evaluation_date: h.last_evaluation_date
            ? new Date(h.last_evaluation_date).toISOString().slice(0, 10)
            : '',
          emergency_contact_name: h.emergency_contact_name || '',
          emergency_contact_phone: h.emergency_contact_phone || '',
          emergency_contact_relationship: h.emergency_contact_relationship || '',
          _newCondition: '',
          _newMedication: '',
        });
      }

      if (agreementsResult.success) {
        setAgreements(agreementsResult.data?.items || agreementsResult.data || []);
      }

      if (referralsResult.success) {
        setReferrals(referralsResult.data?.items || referralsResult.data || []);
      }
    } catch (err) {
      setError('Error al cargar datos.');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ------------------------------------------------------------------
  // Actualizar campo
  // ------------------------------------------------------------------
  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // ------------------------------------------------------------------
  // Guardar solo los campos de una ficha específica
  // ------------------------------------------------------------------
  const handleSaveTab = useCallback(
    async (tabId) => {
      const fields = TAB_FIELDS[tabId];
      if (!fields) return;

      setIsSaving(true);
      try {
        const dataToSend = {};
        fields.forEach((field) => {
          dataToSend[field] = formData[field];
        });

        // Si no hay discapacidad, limpiar severidad
        if (dataToSend.disability_type === 'ninguna') {
          dataToSend.disability_severity = null;
        }

        const result = await updateStudentHealth(studentId, dataToSend);
        if (result.success) {
          Alert.alert(
            'Ficha guardada',
            `La información de ${TABS.find((t) => t.id === tabId)?.label || 'la ficha'} se guardó correctamente.`,
            [{ text: 'Aceptar' }],
          );
        } else {
          Alert.alert('Error', result.message || 'No se pudo guardar la ficha.');
        }
      } catch (err) {
        Alert.alert('Error', 'Ocurrió un error inesperado al guardar.');
      } finally {
        setIsSaving(false);
      }
    },
    [studentId, formData],
  );

  // ------------------------------------------------------------------
  // Recargar acuerdos y referencias
  // ------------------------------------------------------------------
  const refreshAgreements = useCallback(async () => {
    const result = await getAgreementsByStudent(studentId);
    if (result.success) setAgreements(result.data?.items || result.data || []);
  }, [studentId]);

  const refreshReferrals = useCallback(async () => {
    const result = await getReferralsByStudent(studentId);
    if (result.success) setReferrals(result.data?.items || result.data || []);
  }, [studentId]);

  // ------------------------------------------------------------------
  // Guardar visitas domiciliarias directamente
  // ------------------------------------------------------------------
  const saveHomeVisits = useCallback(async (visits) => {
    const result = await updateStudentHealth(studentId, { home_visits: visits });
    return result;
  }, [studentId]);

  // ------------------------------------------------------------------
  // Renderizar pestaña activa
  // ------------------------------------------------------------------
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'personal':
        return <PersonalTab student={student} formData={formData} updateField={updateField} />;
      case 'family':
        return (
          <FamilyTab
            formData={formData}
            updateField={updateField}
            onSave={() => handleSaveTab('family')}
            isSaving={isSaving}
          />
        );
      case 'health':
        return (
          <HealthTab
            formData={formData}
            updateField={updateField}
            onSave={() => handleSaveTab('health')}
            isSaving={isSaving}
          />
        );
      case 'emergency':
        return (
          <EmergencyContactsTab
            student={student}
            formData={formData}
            updateField={updateField}
            onSave={() => handleSaveTab('emergency')}
            isSaving={isSaving}
          />
        );
      case 'interventions':
        return (
          <InterventionsTab
            studentId={studentId}
            agreements={agreements}
            referrals={referrals}
            formData={formData}
            updateField={updateField}
            onRefreshAgreements={refreshAgreements}
            onRefreshReferrals={refreshReferrals}
            saveHomeVisits={saveHomeVisits}
          />
        );
      case 'notes':
        return (
          <NotesTab
            formData={formData}
            updateField={updateField}
            onSave={() => handleSaveTab('notes')}
            isSaving={isSaving}
          />
        );
      default:
        return null;
    }
  };

  // ------------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------------
  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="text-slate-400 text-sm mt-3">Cargando expediente...</Text>
      </View>
    );
  }

  if (error && !student) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center px-6">
        <AlertTriangle size={40} color="#e11d48" strokeWidth={1.5} />
        <Text className="text-slate-900 text-lg font-bold mt-4">Error al cargar</Text>
        <Text className="text-slate-500 text-sm mt-2 text-center">{error}</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-6 py-2.5 rounded-xl bg-slate-900">
          <Text className="text-white font-semibold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullName = `${student?.last_name || ''} ${student?.first_name || ''}`.trim();

  return (
    <View className="flex-1 bg-slate-50">
      <DashboardHeader />
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-2"
        teacher={dashboardData?.socialWorker}
        date={currentDate}
        user={user}
      />

      {/* Botón Volver + Título */}
      <View className="px-4 mt-3 mb-1">
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver a la lista"
          className="flex-row items-center"
        >
          <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
          <Text className="text-sm font-semibold text-sky-600 ml-1">Volver</Text>
        </TouchableOpacity>

        <View className="mt-2">
          <Text className="text-xl font-bold text-slate-900">Expediente del Alumno</Text>
          {fullName ? (
            <Text className="text-sm text-slate-500 mt-0.5">{fullName}</Text>
          ) : null}
        </View>
      </View>

      {/* Selector de pestañas */}
      <TabSelector tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Contenido de la pestaña activa */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          className="flex-1"
        >
          {renderActiveTab()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
