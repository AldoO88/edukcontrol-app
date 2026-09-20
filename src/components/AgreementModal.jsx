// =====================================================================
// src/components/AgreementModal.jsx
// ---------------------------------------------------------------------
// Modal para crear o editar un Acuerdo con Padres.
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

const AGREEMENT_TYPES = [
  { value: 'conducta', label: 'Conducta' },
  { value: 'academico', label: 'Académico' },
  { value: 'salud', label: 'Salud' },
  { value: 'inclusion', label: 'Inclusión' },
  { value: 'otro', label: 'Otro' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
];

export default function AgreementModal({
  visible,
  onClose,
  onSave,
  agreement,
  isLoading = false,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [agreementType, setAgreementType] = useState('conducta');
  const [status, setStatus] = useState('active');
  const [reviewDate, setReviewDate] = useState(null);
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (agreement) {
      setTitle(agreement.title || '');
      setDescription(agreement.description || '');
      setAgreementType(agreement.agreement_type || 'conducta');
      setStatus(agreement.status || 'active');
      setReviewDate(agreement.review_date ? new Date(agreement.review_date) : null);
      setNotes(agreement.notes || '');
    } else {
      setTitle('');
      setDescription('');
      setAgreementType('conducta');
      setStatus('active');
      setReviewDate(null);
      setNotes('');
    }
    setShowDatePicker(false);
  }, [agreement, visible]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Campo requerido', 'Ingresa un título para el acuerdo.');
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      agreement_type: agreementType,
      status,
      review_date: reviewDate ? reviewDate.toISOString() : undefined,
      notes: notes.trim() || undefined,
    });
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setReviewDate(selectedDate);
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
              {agreement ? 'Editar Acuerdo' : 'Nuevo Acuerdo'}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color="#64748B" strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
            {/* TITLE */}
            <Text className="text-xs font-bold text-slate-600 mb-1">Título *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Acuerdo de conducta..."
              placeholderTextColor="#94A3B8"
              className="bg-slate-50 rounded-xl px-3 py-2.5 text-sm text-slate-900 border border-slate-200 mb-4"
            />

            {/* DESCRIPTION */}
            <Text className="text-xs font-bold text-slate-600 mb-1">Descripción</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe el acuerdo..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              className="bg-slate-50 rounded-xl px-3 py-2.5 text-sm text-slate-900 border border-slate-200 mb-4"
              style={{ textAlignVertical: 'top', minHeight: 80 }}
            />

            {/* TYPE */}
            <Text className="text-xs font-bold text-slate-600 mb-2">Tipo de Acuerdo</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {AGREEMENT_TYPES.map((t) => (
                <Pressable
                  key={t.value}
                  onPress={() => setAgreementType(t.value)}
                  className={`px-3 py-1.5 rounded-full border ${
                    agreementType === t.value
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      agreementType === t.value ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* STATUS (only when editing) */}
            {agreement && (
              <>
                <Text className="text-xs font-bold text-slate-600 mb-2">Estado</Text>
                <View className="flex-row gap-2 mb-4">
                  {STATUS_OPTIONS.map((s) => (
                    <Pressable
                      key={s.value}
                      onPress={() => setStatus(s.value)}
                      className={`px-3 py-1.5 rounded-full border ${
                        status === s.value
                          ? s.value === 'active'
                            ? 'bg-emerald-600 border-emerald-600'
                            : s.value === 'completed'
                            ? 'bg-blue-600 border-blue-600'
                            : 'bg-red-600 border-red-600'
                          : 'bg-white border-slate-200'
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
                  ))}
                </View>
              </>
            )}

            {/* REVIEW DATE */}
            <Text className="text-xs font-bold text-slate-600 mb-1">Fecha Compromiso</Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 mb-4 flex-row items-center"
            >
              <Calendar size={16} color="#64748B" strokeWidth={2} style={{ marginRight: 8 }} />
              <Text
                className={`text-sm flex-1 ${reviewDate ? 'text-slate-900' : 'text-slate-400'}`}
              >
                {reviewDate ? formatDate(reviewDate) : 'Seleccionar fecha...'}
              </Text>
              {reviewDate && (
                <Pressable onPress={() => setReviewDate(null)} hitSlop={8}>
                  <X size={14} color="#94A3B8" strokeWidth={2} />
                </Pressable>
              )}
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={reviewDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
                locale="es-MX"
              />
            )}

            {/* NOTES */}
            <Text className="text-xs font-bold text-slate-600 mb-1">Notas</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Notas adicionales..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={2}
              className="bg-slate-50 rounded-xl px-3 py-2.5 text-sm text-slate-900 border border-slate-200 mb-6"
              style={{ textAlignVertical: 'top', minHeight: 60 }}
            />
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
                    {agreement ? 'Guardar' : 'Crear'}
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
