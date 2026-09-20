// =====================================================================
// src/components/ReferralModal.jsx
// ---------------------------------------------------------------------
// Modal para crear o editar una Referencia a Institución.
// =====================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Check, Calendar } from 'lucide-react-native';

const INSTITUTION_TYPES = [
  { value: 'hospital', label: 'Hospital' },
  { value: 'clinica', label: 'Clínica' },
  { value: 'psicologia', label: 'Psicología' },
  { value: 'terapia', label: 'Terapia' },
  { value: 'trabajo_social', label: 'Trabajo Social' },
  { value: 'educacion_especial', label: 'Educación Especial' },
  { value: 'otro', label: 'Otro' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'sent', label: 'Enviada' },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
];

export default function ReferralModal({
  visible,
  onClose,
  onSave,
  referral,
  isLoading = false,
}) {
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('hospital');
  const [contactInfo, setContactInfo] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('pending');
  const [responseNotes, setResponseNotes] = useState('');
  const [responseDate, setResponseDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (referral) {
      setInstitutionName(referral.institution_name || '');
      setInstitutionType(referral.institution_type || 'hospital');
      setContactInfo(referral.contact_info || '');
      setReason(referral.reason || '');
      setStatus(referral.status || 'pending');
      setResponseNotes(referral.response_notes || '');
      setResponseDate(referral.response_date ? new Date(referral.response_date) : null);
    } else {
      setInstitutionName('');
      setInstitutionType('hospital');
      setContactInfo('');
      setReason('');
      setStatus('pending');
      setResponseNotes('');
      setResponseDate(null);
    }
    setShowDatePicker(false);
  }, [referral, visible]);

  const handleSave = () => {
    if (!institutionName.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre de la institución.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el motivo de la canalización.');
      return;
    }
    onSave({
      institution_name: institutionName.trim(),
      institution_type: institutionType,
      contact_info: contactInfo.trim() || undefined,
      reason: reason.trim(),
      status,
      response_notes: responseNotes.trim() || undefined,
      response_date: responseDate ? responseDate.toISOString() : undefined,
    });
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setResponseDate(selectedDate);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className="flex-1 bg-white">
          {/* HEADER */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-200">
            <Text className="text-lg font-bold text-slate-900">
              {referral ? 'Editar Referencia' : 'Nueva Referencia'}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color="#64748B" strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
            {/* INSTITUTION NAME */}
            <Text className="text-xs font-bold text-slate-600 mb-1">Nombre de la Institución *</Text>
            <TextInput
              value={institutionName}
              onChangeText={setInstitutionName}
              placeholder="Ej: Hospital General..."
              placeholderTextColor="#94A3B8"
              className="bg-slate-50 rounded-xl px-3 py-2.5 text-sm text-slate-900 border border-slate-200 mb-4"
            />

            {/* INSTITUTION TYPE */}
            <Text className="text-xs font-bold text-slate-600 mb-2">Tipo de Institución</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {INSTITUTION_TYPES.map((t) => (
                <Pressable
                  key={t.value}
                  onPress={() => setInstitutionType(t.value)}
                  className={`px-3 py-1.5 rounded-full border ${
                    institutionType === t.value
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      institutionType === t.value ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* CONTACT INFO */}
            <Text className="text-xs font-bold text-slate-600 mb-1">Información de Contacto</Text>
            <TextInput
              value={contactInfo}
              onChangeText={setContactInfo}
              placeholder="Teléfono, email, dirección..."
              placeholderTextColor="#94A3B8"
              className="bg-slate-50 rounded-xl px-3 py-2.5 text-sm text-slate-900 border border-slate-200 mb-4"
            />

            {/* REASON */}
            <Text className="text-xs font-bold text-slate-600 mb-1">Motivo de la Referencia *</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Describe el motivo..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              className="bg-slate-50 rounded-xl px-3 py-2.5 text-sm text-slate-900 border border-slate-200 mb-4"
              style={{ textAlignVertical: 'top', minHeight: 80 }}
            />

            {/* STATUS (only when editing) */}
            {referral && (
              <>
                <Text className="text-xs font-bold text-slate-600 mb-2">Estado</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {STATUS_OPTIONS.map((s) => {
                    const colorMap = {
                      pending: 'bg-amber-500 border-amber-500',
                      sent: 'bg-blue-500 border-blue-500',
                      in_progress: 'bg-indigo-600 border-indigo-600',
                      completed: 'bg-emerald-600 border-emerald-600',
                      cancelled: 'bg-red-600 border-red-600',
                    };
                    return (
                      <Pressable
                        key={s.value}
                        onPress={() => setStatus(s.value)}
                        className={`px-3 py-1.5 rounded-full border ${
                          status === s.value ? colorMap[s.value] : 'bg-white border-slate-200'
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            status === s.value ? 'text-white' : 'text-slate-600'
                          }`}
                        >
                          {s.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* RESPONSE NOTES */}
                <Text className="text-xs font-bold text-slate-600 mb-1">Notas de Respuesta</Text>
                <TextInput
                  value={responseNotes}
                  onChangeText={setResponseNotes}
                  placeholder="Respuesta de la institución..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={2}
                  className="bg-slate-50 rounded-xl px-3 py-2.5 text-sm text-slate-900 border border-slate-200 mb-4"
                  style={{ textAlignVertical: 'top', minHeight: 60 }}
                />

                {/* RESPONSE DATE */}
                <Text className="text-xs font-bold text-slate-600 mb-1">Fecha de Respuesta</Text>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 mb-4 flex-row items-center"
                >
                  <Calendar size={16} color="#64748B" strokeWidth={2} style={{ marginRight: 8 }} />
                  <Text
                    className={`text-sm flex-1 ${responseDate ? 'text-slate-900' : 'text-slate-400'}`}
                  >
                    {responseDate ? formatDate(responseDate) : 'Seleccionar fecha...'}
                  </Text>
                  {responseDate && (
                    <Pressable onPress={() => setResponseDate(null)} hitSlop={8}>
                      <X size={14} color="#94A3B8" strokeWidth={2} />
                    </Pressable>
                  )}
                </Pressable>

                {showDatePicker && (
                  <DateTimePicker
                    value={responseDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    locale="es-MX"
                  />
                )}
              </>
            )}
          </ScrollView>

          {/* FOOTER */}
          <View className="px-4 py-3 border-t border-slate-200 flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 bg-slate-100 rounded-xl py-3 items-center"
            >
              <Text className="text-sm font-semibold text-slate-600">Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={isLoading}
              className={`flex-1 rounded-xl py-3 items-center flex-row justify-center ${
                isLoading ? 'bg-indigo-300' : 'bg-indigo-600'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Check size={16} color="#FFF" strokeWidth={2.5} />
                  <Text className="text-sm font-semibold text-white ml-1.5">
                    {referral ? 'Guardar' : 'Crear'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
