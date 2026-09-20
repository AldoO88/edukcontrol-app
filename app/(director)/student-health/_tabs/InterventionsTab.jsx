// =====================================================================
// app/(director)/student-health/_tabs/InterventionsTab.jsx
// ---------------------------------------------------------------------
// Ficha de Intervenciones y Seguimiento del alumno.
// Acuerdos con padres (ParentAgreement), canalizaciones externas
// (InstitutionReferral) y visitas domiciliarias.
// =====================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Handshake,
  Building2,
  MapPin,
  Plus,
  Calendar,
  FileText,
  X,
  Check,
} from 'lucide-react-native';

import AgreementModal from '@/src/components/AgreementModal';
import ReferralModal from '@/src/components/ReferralModal';
import {
  createAgreement,
  updateAgreement,
  createReferral,
  updateReferral,
} from '@/src/services/directorService';

// ---------------------------------------------------------------------
// Sub-sección genérica con header
// ---------------------------------------------------------------------
const SubSection = ({ icon: Icon, color, title, count, children }) => (
  <View className="mb-4">
    <View className="flex-row items-center mb-2">
      <View className="w-7 h-7 rounded-lg items-center justify-center mr-2" style={{ backgroundColor: color + '15' }}>
        <Icon size={14} color={color} strokeWidth={2} />
      </View>
      <Text className="text-sm font-bold text-slate-900 flex-1">{title}</Text>
      {count !== undefined && (
        <View className="px-2 py-0.5 rounded-full bg-slate-100">
          <Text className="text-[10px] font-bold text-slate-500">{count}</Text>
        </View>
      )}
    </View>
    {children}
  </View>
);

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function InterventionsTab({
  studentId,
  agreements,
  referrals,
  formData,
  updateField,
  onRefreshAgreements,
  onRefreshReferrals,
  saveHomeVisits,
}) {
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [selectedReferral, setSelectedReferral] = useState(null);

  // Modal de visitas domiciliarias
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedVisitIndex, setSelectedVisitIndex] = useState(null);
  const [visitDate, setVisitDate] = useState(new Date());
  const [visitObservations, setVisitObservations] = useState('');
  const [showVisitDatePicker, setShowVisitDatePicker] = useState(false);

  // Visitas domiciliarias del formulario
  const homeVisits = formData.home_visits || [];

  // --- Handlers de visitas domiciliarias ---
  const handleOpenVisitModal = (index = null) => {
    if (index !== null) {
      // Editar visita existente
      const visit = homeVisits[index];
      setSelectedVisitIndex(index);
      setVisitDate(visit.date ? new Date(visit.date) : new Date());
      setVisitObservations(visit.observations || '');
    } else {
      // Nueva visita
      setSelectedVisitIndex(null);
      setVisitDate(new Date());
      setVisitObservations('');
    }
    setShowVisitModal(true);
  };

  const handleSaveVisit = async () => {
    const dateStr = visitDate.toISOString().slice(0, 10);
    let newVisits;
    if (selectedVisitIndex !== null) {
      // Editar existente
      const updated = [...homeVisits];
      updated[selectedVisitIndex] = {
        ...updated[selectedVisitIndex],
        date: dateStr,
        observations: visitObservations.trim() || undefined,
      };
      newVisits = updated;
    } else {
      // Crear nueva
      const newVisit = {
        date: dateStr,
        observations: visitObservations.trim() || undefined,
        conducted_by: null,
      };
      newVisits = [...homeVisits, newVisit];
    }
    updateField('home_visits', newVisits);
    // Guardar directo en backend
    if (saveHomeVisits) {
      const result = await saveHomeVisits(newVisits);
      if (!result?.success) {
        Alert.alert('Error', 'No se pudo guardar la visita.');
        return;
      }
    }
    setShowVisitModal(false);
    setSelectedVisitIndex(null);
  };

  const onVisitDateChange = (event, selectedDate) => {
    setShowVisitDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setVisitDate(selectedDate);
    }
  };

  const formatVisitDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleRemoveVisit = (index) => {
    Alert.alert(
      'Eliminar visita',
      '¿Eliminar este registro de visita domiciliaria?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const newVisits = homeVisits.filter((_, i) => i !== index);
            updateField('home_visits', newVisits);
            if (saveHomeVisits) {
              await saveHomeVisits(newVisits);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="px-4 py-3">
      {/* ============================================= */}
      {/* Acuerdos con Padres                           */}
      {/* ============================================= */}
      <SubSection
        icon={Handshake}
        color="#7C3AED"
        title="Acuerdos con Padres"
        count={agreements?.length || 0}
      >
        <TouchableOpacity
          onPress={() => { setSelectedAgreement(null); setShowAgreementModal(true); }}
          className="flex-row items-center justify-center bg-purple-500 rounded-xl py-2.5 mb-3"
        >
          <Plus size={14} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
          <Text className="text-white text-xs font-bold">Nuevo Acuerdo</Text>
        </TouchableOpacity>

        {(!agreements || agreements.length === 0) ? (
          <View className="bg-slate-50 rounded-xl p-4 items-center border border-slate-100">
            <Handshake size={20} color="#CBD5E1" strokeWidth={1.5} />
            <Text className="text-xs text-slate-400 mt-2">Sin acuerdos registrados</Text>
          </View>
        ) : (
          agreements.map((ag) => {
            const typeColors = {
              conducta: { bg: '#FEF3C7', fg: '#D97706' },
              academico: { bg: '#DBEAFE', fg: '#2563EB' },
              salud: { bg: '#FEE2E2', fg: '#DC2626' },
              inclusion: { bg: '#E0E7FF', fg: '#4F46E5' },
              otro: { bg: '#F1F5F9', fg: '#64748B' },
            };
            const statusColors = {
              active: { bg: '#D1FAE5', fg: '#047857' },
              completed: { bg: '#DBEAFE', fg: '#2563EB' },
              cancelled: { bg: '#FEE2E2', fg: '#DC2626' },
            };
            const tc = typeColors[ag.agreement_type] || typeColors.otro;
            const sc = statusColors[ag.status] || statusColors.active;

            return (
              <TouchableOpacity
                key={ag._id}
                onPress={() => { setSelectedAgreement(ag); setShowAgreementModal(true); }}
                className="bg-slate-50 rounded-xl p-3 mb-2 border border-slate-100"
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sm font-bold text-slate-900 flex-1" numberOfLines={1}>
                    {ag.title}
                  </Text>
                  <View className="flex-row items-center ml-2">
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: tc.bg }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: tc.fg }}>
                        {ag.agreement_type}
                      </Text>
                    </View>
                    <View className="px-2 py-0.5 rounded-full ml-1" style={{ backgroundColor: sc.bg }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: sc.fg }}>
                        {ag.status}
                      </Text>
                    </View>
                  </View>
                </View>
                {ag.description ? (
                  <Text className="text-xs text-slate-500 mt-1" numberOfLines={2}>
                    {ag.description}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })
        )}
      </SubSection>

      {/* ============================================= */}
      {/* Canalizaciones Externas                       */}
      {/* ============================================= */}
      <SubSection
        icon={Building2}
        color="#0369A1"
        title="Canalizaciones Externas"
        count={referrals?.length || 0}
      >
        <TouchableOpacity
          onPress={() => { setSelectedReferral(null); setShowReferralModal(true); }}
          className="flex-row items-center justify-center bg-sky-600 rounded-xl py-2.5 mb-3"
        >
          <Plus size={14} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
          <Text className="text-white text-xs font-bold">Nueva Canalización</Text>
        </TouchableOpacity>

        {(!referrals || referrals.length === 0) ? (
          <View className="bg-slate-50 rounded-xl p-4 items-center border border-slate-100">
            <Building2 size={20} color="#CBD5E1" strokeWidth={1.5} />
            <Text className="text-xs text-slate-400 mt-2">Sin canalizaciones registradas</Text>
          </View>
        ) : (
          referrals.map((ref) => {
            const statusColors = {
              pending: { bg: '#FEF3C7', fg: '#D97706' },
              sent: { bg: '#DBEAFE', fg: '#2563EB' },
              in_progress: { bg: '#E0E7FF', fg: '#4F46E5' },
              completed: { bg: '#D1FAE5', fg: '#047857' },
              cancelled: { bg: '#FEE2E2', fg: '#DC2626' },
            };
            const sc = statusColors[ref.status] || statusColors.pending;

            return (
              <TouchableOpacity
                key={ref._id}
                onPress={() => { setSelectedReferral(ref); setShowReferralModal(true); }}
                className="bg-slate-50 rounded-xl p-3 mb-2 border border-slate-100"
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sm font-bold text-slate-900 flex-1" numberOfLines={1}>
                    {ref.institution_name}
                  </Text>
                  <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.bg }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: sc.fg }}>
                      {ref.status}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-slate-500 mt-1" numberOfLines={2}>
                  {ref.reason}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </SubSection>

      {/* ============================================= */}
      {/* Visitas Domiciliarias                         */}
      {/* ============================================= */}
      <SubSection
        icon={MapPin}
        color="#059669"
        title="Visitas Domiciliarias"
        count={homeVisits.length}
      >
        <TouchableOpacity
          onPress={() => handleOpenVisitModal()}
          className="flex-row items-center justify-center bg-emerald-500 rounded-xl py-2.5 mb-3"
        >
          <Plus size={14} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
          <Text className="text-white text-xs font-bold">Registrar Visita</Text>
        </TouchableOpacity>

        {homeVisits.length === 0 ? (
          <View className="bg-slate-50 rounded-xl p-4 items-center border border-slate-100">
            <MapPin size={20} color="#CBD5E1" strokeWidth={1.5} />
            <Text className="text-xs text-slate-400 mt-2">Sin visitas registradas</Text>
          </View>
        ) : (
          homeVisits.map((visit, idx) => (
            <TouchableOpacity
              key={`visit-${idx}`}
              onPress={() => handleOpenVisitModal(idx)}
              className="bg-slate-50 rounded-xl p-3 mb-2 border border-slate-100"
            >
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center">
                  <Calendar size={12} color="#059669" strokeWidth={2} />
                  <Text className="text-xs font-bold text-slate-700 ml-1">
                    {visit.date ? formatVisitDate(visit.date) : 'Sin fecha'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveVisit(idx)}
                  hitSlop={8}
                >
                  <Text className="text-[10px] font-semibold text-red-500">Eliminar</Text>
                </TouchableOpacity>
              </View>
              {visit.observations ? (
                <Text className="text-xs text-slate-500 mt-1" numberOfLines={2}>
                  {visit.observations}
                </Text>
              ) : (
                <Text className="text-xs text-slate-400 italic mt-1">Sin observaciones</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </SubSection>

      {/* ============================================= */}
      {/* MODALES                                       */}
      {/* ============================================= */}
      <AgreementModal
        visible={showAgreementModal}
        onClose={() => { setShowAgreementModal(false); setSelectedAgreement(null); }}
        onSave={async (data) => {
          try {
            if (selectedAgreement) {
              await updateAgreement(selectedAgreement._id, data);
            } else {
              await createAgreement(studentId, data);
            }
          } catch (err) {
            Alert.alert('Error', 'No se pudo guardar el acuerdo.');
            return;
          }
          setShowAgreementModal(false);
          setSelectedAgreement(null);
          if (onRefreshAgreements) await onRefreshAgreements();
        }}
        agreement={selectedAgreement}
      />
      <ReferralModal
        visible={showReferralModal}
        onClose={() => { setShowReferralModal(false); setSelectedReferral(null); }}
        onSave={async (data) => {
          try {
            if (selectedReferral) {
              await updateReferral(selectedReferral._id, data);
            } else {
              await createReferral(studentId, data);
            }
          } catch (err) {
            Alert.alert('Error', 'No se pudo guardar la canalización.');
            return;
          }
          setShowReferralModal(false);
          setSelectedReferral(null);
          if (onRefreshReferrals) await onRefreshReferrals();
        }}
        referral={selectedReferral}
      />

      {/* ============================================= */}
      {/* MODAL DE VISITA DOMICILIARIA                  */}
      {/* ============================================= */}
      <Modal visible={showVisitModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View className="flex-1 bg-white">
            {/* HEADER */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-200">
              <Text className="text-lg font-bold text-slate-900">
                {selectedVisitIndex !== null ? 'Editar Visita' : 'Nueva Visita'}
              </Text>
              <Pressable onPress={() => setShowVisitModal(false)} hitSlop={8}>
                <X size={22} color="#64748B" strokeWidth={2} />
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
              {/* FECHA */}
              <Text className="text-xs font-bold text-slate-600 mb-1">Fecha de la Visita *</Text>
              <Pressable
                onPress={() => setShowVisitDatePicker(true)}
                className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 mb-4 flex-row items-center"
              >
                <Calendar size={16} color="#059669" strokeWidth={2} style={{ marginRight: 8 }} />
                <Text className="text-sm text-slate-900 flex-1">
                  {formatVisitDate(visitDate)}
                </Text>
              </Pressable>

              {showVisitDatePicker && (
                <DateTimePicker
                  value={visitDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onVisitDateChange}
                  maximumDate={new Date()}
                  locale="es-MX"
                />
              )}

              {/* OBSERVACIONES */}
              <Text className="text-xs font-bold text-slate-600 mb-1">Observaciones</Text>
              <TextInput
                value={visitObservations}
                onChangeText={setVisitObservations}
                placeholder="Describe las observaciones de la visita..."
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
                className="bg-slate-50 rounded-xl px-3 py-2.5 text-sm text-slate-900 border border-slate-200"
                style={{ minHeight: 100 }}
              />
            </ScrollView>

            {/* FOOTER */}
            <View className="px-4 py-3 border-t border-slate-200 flex-row gap-3">
              <Pressable
                onPress={() => setShowVisitModal(false)}
                className="flex-1 bg-slate-100 rounded-xl py-3 items-center"
              >
                <Text className="text-sm font-semibold text-slate-600">Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveVisit}
                className="flex-1 bg-emerald-500 rounded-xl py-3 items-center flex-row justify-center"
              >
                <Check size={16} color="#FFF" strokeWidth={2.5} />
                <Text className="text-sm font-semibold text-white ml-1.5">
                  {selectedVisitIndex !== null ? 'Guardar' : 'Registrar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
