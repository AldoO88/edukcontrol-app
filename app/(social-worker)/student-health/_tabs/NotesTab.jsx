// =====================================================================
// app/(social-worker)/student-health/_tabs/NotesTab.jsx
// ---------------------------------------------------------------------
// Ficha de Alertas y Notas del alumno.
// Alertas visibles para otros roles + notas generales del
// trabajador social + fecha de última evaluación.
// =====================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  AlertTriangle,
  Plus,
  X,
  FileText,
  Calendar,
  Save,
} from 'lucide-react-native';

// ---------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------
const ALERT_TYPES = [
  { key: 'medica', label: 'Médica', color: '#E11D48', bg: '#FEF2F2' },
  { key: 'comportamental', label: 'Comportamental', color: '#D97706', bg: '#FFFBEB' },
  { key: 'academica', label: 'Académica', color: '#4F46E5', bg: '#EEF2FF' },
  { key: 'otra', label: 'Otra', color: '#64748B', bg: '#F8FAFC' },
];

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function NotesTab({ formData, updateField, onSave, isSaving }) {
  const alerts = formData.alerts || [];

  // Estado para nueva alerta
  const [newAlertType, setNewAlertType] = useState('medica');
  const [newAlertLabel, setNewAlertLabel] = useState('');
  const [newAlertDescription, setNewAlertDescription] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- Handlers de alertas ---
  const handleAddAlert = () => {
    if (!newAlertLabel.trim()) {
      Alert.alert('Campo requerido', 'Ingresa un nombre para la alerta.');
      return;
    }
    const newAlert = {
      type: newAlertType,
      label: newAlertLabel.trim(),
      description: newAlertDescription.trim() || undefined,
    };
    updateField('alerts', [...alerts, newAlert]);
    setNewAlertLabel('');
    setNewAlertDescription('');
    setNewAlertType('medica');
  };

  const handleRemoveAlert = (index) => {
    updateField('alerts', alerts.filter((_, i) => i !== index));
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().slice(0, 10);
      updateField('last_evaluation_date', dateStr);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <View className="px-4 py-3">
      {/* ============================================= */}
      {/* Alertas                                       */}
      {/* ============================================= */}
      <View className="flex-row items-center mb-3">
        <View className="w-7 h-7 rounded-lg bg-red-100 items-center justify-center mr-2">
          <AlertTriangle size={14} color="#DC2626" strokeWidth={2} />
        </View>
        <Text className="text-sm font-bold text-slate-900">Alertas</Text>
        {alerts.length > 0 && (
          <View className="ml-2 px-2 py-0.5 rounded-full bg-red-50">
            <Text className="text-[10px] font-bold text-red-500">{alerts.length}</Text>
          </View>
        )}
      </View>

      {/* Lista de alertas existentes */}
      {alerts.length > 0 && (
        <View className="mb-4">
          {alerts.map((alert, idx) => {
            const alertType = ALERT_TYPES.find((t) => t.key === alert.type) || ALERT_TYPES[3];
            return (
              <View
                key={`alert-${idx}`}
                className="rounded-xl p-3 mb-2 flex-row items-start"
                style={{ backgroundColor: alertType.bg, borderWidth: 1, borderColor: alertType.color + '30' }}
              >
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <View
                      className="px-2 py-0.5 rounded-full mr-2"
                      style={{ backgroundColor: alertType.color + '20' }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: '700', color: alertType.color }}>
                        {alertType.label}
                      </Text>
                    </View>
                    <Text className="text-sm font-bold text-slate-900 flex-1">{alert.label}</Text>
                  </View>
                  {alert.description ? (
                    <Text className="text-xs text-slate-600 mt-1">{alert.description}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveAlert(idx)}
                  hitSlop={8}
                  className="ml-2"
                  accessibilityLabel={`Eliminar alerta ${alert.label}`}
                >
                  <X size={14} color="#94A3B8" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Formulario para nueva alerta */}
      <View className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-4">
        <Text className="text-xs font-semibold text-slate-500 mb-2">Nueva alerta</Text>

        {/* Selector de tipo */}
        <View className="flex-row flex-wrap mb-3">
          {ALERT_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setNewAlertType(t.key)}
              className="px-3 py-1.5 rounded-full mr-2 mb-1.5"
              style={{
                backgroundColor: newAlertType === t.key ? t.bg : '#F1F5F9',
                borderWidth: 1.5,
                borderColor: newAlertType === t.key ? t.color : '#E2E8F0',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: newAlertType === t.key ? '700' : '500',
                  color: newAlertType === t.key ? t.color : '#64748B',
                }}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nombre de la alerta */}
        <TextInput
          value={newAlertLabel}
          onChangeText={setNewAlertLabel}
          placeholder="Nombre de la alerta..."
          placeholderTextColor="#94A3B8"
          className="text-sm text-slate-900 bg-white rounded-lg border border-slate-200 px-3 mb-2"
          style={{ height: 38 }}
        />

        {/* Descripción */}
        <TextInput
          value={newAlertDescription}
          onChangeText={setNewAlertDescription}
          placeholder="Descripción (opcional)..."
          placeholderTextColor="#94A3B8"
          multiline
          textAlignVertical="top"
          className="text-sm text-slate-900 bg-white rounded-lg border border-slate-200 px-3 mb-3"
          style={{ minHeight: 50 }}
        />

        {/* Botón agregar */}
        <TouchableOpacity
          onPress={handleAddAlert}
          className="flex-row items-center justify-center bg-red-500 rounded-xl py-2.5"
        >
          <Plus size={14} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
          <Text className="text-white text-xs font-bold">Agregar Alerta</Text>
        </TouchableOpacity>
      </View>

      {/* ============================================= */}
      {/* Notas Generales                               */}
      {/* ============================================= */}
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          <View className="w-7 h-7 rounded-lg bg-slate-100 items-center justify-center mr-2">
            <FileText size={14} color="#64748B" strokeWidth={2} />
          </View>
          <Text className="text-sm font-bold text-slate-900">Notas Generales</Text>
        </View>

        <TextInput
          value={formData.notes || ''}
          onChangeText={(val) => updateField('notes', val)}
          placeholder="Observaciones generales sobre el alumno..."
          placeholderTextColor="#94A3B8"
          multiline
          textAlignVertical="top"
          className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900"
          style={{ minHeight: 100 }}
        />
      </View>

      {/* ============================================= */}
      {/* Última Evaluación                             */}
      {/* ============================================= */}
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          <View className="w-7 h-7 rounded-lg bg-purple-100 items-center justify-center mr-2">
            <Calendar size={14} color="#8B5CF6" strokeWidth={2} />
          </View>
          <Text className="text-sm font-bold text-slate-900">Última Evaluación</Text>
        </View>

        <Pressable
          onPress={() => setShowDatePicker(true)}
          className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 flex-row items-center"
        >
          <Calendar size={16} color="#8B5CF6" strokeWidth={2} style={{ marginRight: 8 }} />
          <Text
            className={`text-sm flex-1 ${formData.last_evaluation_date ? 'text-slate-900' : 'text-slate-400'}`}
          >
            {formData.last_evaluation_date ? formatDate(formData.last_evaluation_date) : 'Seleccionar fecha...'}
          </Text>
          {formData.last_evaluation_date && (
            <Pressable onPress={() => updateField('last_evaluation_date', '')} hitSlop={8}>
              <X size={14} color="#94A3B8" strokeWidth={2} />
            </Pressable>
          )}
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={formData.last_evaluation_date ? new Date(formData.last_evaluation_date) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
            locale="es-MX"
          />
        )}
      </View>

      {/* Botón Guardar — fijo al fondo */}
      <View className="px-4 py-4 mt-2">
        <TouchableOpacity
          onPress={onSave}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Guardar alertas y notas"
          className="flex-row items-center justify-center bg-emerald-500 rounded-xl py-3"
          style={{
            opacity: isSaving ? 0.6 : 1,
            shadowColor: '#059669',
            shadowOpacity: 0.3,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
          ) : (
            <Save size={16} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 8 }} />
          )}
          <Text className="text-white text-sm font-bold">
            {isSaving ? 'Guardando...' : 'Guardar Notas'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
