// =====================================================================
// app/(director)/student-health/_tabs/HealthTab.jsx
// ---------------------------------------------------------------------
// Ficha de Salud del alumno. Estilo de aprendizaje, diagnóstico,
// discapacidad, condiciones médicas, medicamentos, alergias,
// derechohabiencia y autorizaciones.
// =====================================================================

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Heart,
  Plus,
  X,
  Shield,
  AlertTriangle,
  FileText,
  Stethoscope,
  BadgeCheck,
  Save,
} from 'lucide-react-native';

// ---------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------
const LEARNING_STYLES = [
  { key: 'visual', label: 'Visual' },
  { key: 'auditivo', label: 'Auditivo' },
  { key: 'kinestesico', label: 'Kinestésico' },
  { key: 'mixto', label: 'Mixto' },
];

const DISABILITY_TYPES = [
  { key: 'ninguna', label: 'Ninguna' },
  { key: 'cognitiva', label: 'Cognitiva' },
  { key: 'fisica', label: 'Física' },
  { key: 'sensorial', label: 'Sensorial' },
  { key: 'multiple', label: 'Múltiple' },
];

const SEVERITY_LEVELS = [
  { key: 'leve', label: 'Leve' },
  { key: 'moderada', label: 'Moderada' },
  { key: 'severa', label: 'Severa' },
];

const HEALTH_INSURANCE_OPTIONS = [
  'IMSS', 'ISSSTE', 'Popular', 'Privado', 'Ninguno', 'Otro',
];

// ---------------------------------------------------------------------
// OptionButton — Pills selector
// ---------------------------------------------------------------------
const OptionButton = ({ label, isActive, onPress, activeColor, activeBg }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className="px-3 py-1.5 rounded-full mr-2 mb-2"
    style={{
      backgroundColor: isActive ? activeBg : '#F1F5F9',
      borderWidth: 1.5,
      borderColor: isActive ? activeColor : '#E2E8F0',
    }}
  >
    <Text
      style={{
        fontSize: 12,
        fontWeight: isActive ? '700' : '500',
        color: isActive ? activeColor : '#64748B',
      }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// ---------------------------------------------------------------------
// Chip — Etiqueta removible
// ---------------------------------------------------------------------
const Chip = ({ label, onRemove, color }) => (
  <View
    className="flex-row items-center rounded-full px-3 py-1.5 mr-2 mb-2"
    style={{ backgroundColor: (color || '#4F46E5') + '15' }}
  >
    <Text style={{ fontSize: 12, color: color || '#4F46E5', fontWeight: '500', marginRight: 6 }}>
      {label}
    </Text>
    <TouchableOpacity onPress={onRemove} hitSlop={8}>
      <X size={12} color={color || '#4F46E5'} strokeWidth={2.5} />
    </TouchableOpacity>
  </View>
);

// ---------------------------------------------------------------------
// SectionHeader — Encabezado de sección
// ---------------------------------------------------------------------
const SectionHeader = ({ icon: Icon, color, title }) => (
  <View className="flex-row items-center mb-2 mt-3">
    <View className="w-7 h-7 rounded-lg items-center justify-center mr-2" style={{ backgroundColor: color + '15' }}>
      <Icon size={14} color={color} strokeWidth={2} />
    </View>
    <Text className="text-sm font-bold text-slate-900">{title}</Text>
  </View>
);

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function HealthTab({ formData, updateField, onSave, isSaving }) {
  // --- Handlers de chips ---
  const addChip = (field, value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    updateField(field, [...(formData[field] || []), trimmed]);
  };

  const removeChip = (field, index) => {
    updateField(field, (formData[field] || []).filter((_, i) => i !== index));
  };

  return (
    <View className="px-4 py-3">
      {/* ============================================= */}
      {/* Estilo de Aprendizaje                        */}
      {/* ============================================= */}
      <SectionHeader icon={FileText} color="#4F46E5" title="Estilo de Aprendizaje" />

      <View className="flex-row flex-wrap mb-2">
        {LEARNING_STYLES.map((s) => (
          <OptionButton
            key={s.key}
            label={s.label}
            isActive={formData.learning_style === s.key}
            onPress={() => updateField('learning_style', s.key)}
            activeColor="#4F46E5"
            activeBg="#EEF2FF"
          />
        ))}
      </View>

      <TextInput
        value={formData.style_hint || ''}
        onChangeText={(val) => updateField('style_hint', val)}
        placeholder="Indicaciones adicionales del estilo..."
        placeholderTextColor="#94A3B8"
        multiline
        textAlignVertical="top"
        className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 mb-3"
        style={{ minHeight: 60 }}
      />

      {/* ============================================= */}
      {/* Diagnóstico                                   */}
      {/* ============================================= */}
      <SectionHeader icon={Stethoscope} color="#7C3AED" title="Diagnóstico" />

      <TextInput
        value={formData.diagnosis || ''}
        onChangeText={(val) => updateField('diagnosis', val)}
        placeholder="Ej: TDAH, Tea, discalculia..."
        placeholderTextColor="#94A3B8"
        multiline
        textAlignVertical="top"
        className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 mb-3"
        style={{ minHeight: 60 }}
      />

      {/* ============================================= */}
      {/* Discapacidad                                  */}
      {/* ============================================= */}
      <SectionHeader icon={Shield} color="#0EA5E9" title="Discapacidad" />

      <Text className="text-[10px] font-semibold text-slate-500 mb-1">Tipo</Text>
      <View className="flex-row flex-wrap mb-2">
        {DISABILITY_TYPES.map((d) => (
          <OptionButton
            key={d.key}
            label={d.label}
            isActive={formData.disability_type === d.key}
            onPress={() => updateField('disability_type', d.key)}
            activeColor="#0EA5E9"
            activeBg="#F0F9FF"
          />
        ))}
      </View>

      {formData.disability_type && formData.disability_type !== 'ninguna' && (
        <>
          <Text className="text-[10px] font-semibold text-slate-500 mb-1">Severidad</Text>
          <View className="flex-row flex-wrap mb-3">
            {SEVERITY_LEVELS.map((s) => (
              <OptionButton
                key={s.key}
                label={s.label}
                isActive={formData.disability_severity === s.key}
                onPress={() => updateField('disability_severity', s.key)}
                activeColor="#0EA5E9"
                activeBg="#F0F9FF"
              />
            ))}
          </View>
        </>
      )}

      {/* ============================================= */}
      {/* Condiciones Médicas                           */}
      {/* ============================================= */}
      <SectionHeader icon={Heart} color="#E11D48" title="Condiciones Médicas" />

      <View className="flex-row flex-wrap mb-2">
        {(formData.medical_conditions || []).map((cond, idx) => (
          <Chip
            key={`cond-${idx}`}
            label={cond}
            onRemove={() => removeChip('medical_conditions', idx)}
            color="#E11D48"
          />
        ))}
      </View>

      <View className="flex-row items-center mb-3">
        <View className="flex-1 flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-3" style={{ height: 40 }}>
          <TextInput
            value={formData._newCondition || ''}
            onChangeText={(val) => updateField('_newCondition', val)}
            placeholder="Agregar condición..."
            placeholderTextColor="#94A3B8"
            className="flex-1 text-sm text-slate-900"
            onSubmitEditing={() => {
              addChip('medical_conditions', formData._newCondition || '');
              updateField('_newCondition', '');
            }}
            returnKeyType="done"
          />
        </View>
        <TouchableOpacity
          onPress={() => {
            addChip('medical_conditions', formData._newCondition || '');
            updateField('_newCondition', '');
          }}
          className="ml-2 w-10 h-10 rounded-xl bg-rose-500 items-center justify-center"
          accessibilityLabel="Agregar condición"
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* ============================================= */}
      {/* Medicamentos                                  */}
      {/* ============================================= */}
      <SectionHeader icon={FileText} color="#D97706" title="Medicamentos" />

      <View className="flex-row flex-wrap mb-2">
        {(formData.medications || []).map((med, idx) => (
          <Chip
            key={`med-${idx}`}
            label={med}
            onRemove={() => removeChip('medications', idx)}
            color="#D97706"
          />
        ))}
      </View>

      <View className="flex-row items-center mb-3">
        <View className="flex-1 flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-3" style={{ height: 40 }}>
          <TextInput
            value={formData._newMedication || ''}
            onChangeText={(val) => updateField('_newMedication', val)}
            placeholder="Agregar medicamento..."
            placeholderTextColor="#94A3B8"
            className="flex-1 text-sm text-slate-900"
            onSubmitEditing={() => {
              addChip('medications', formData._newMedication || '');
              updateField('_newMedication', '');
            }}
            returnKeyType="done"
          />
        </View>
        <TouchableOpacity
          onPress={() => {
            addChip('medications', formData._newMedication || '');
            updateField('_newMedication', '');
          }}
          className="ml-2 w-10 h-10 rounded-xl bg-amber-500 items-center justify-center"
          accessibilityLabel="Agregar medicamento"
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* ============================================= */}
      {/* Alergias                                      */}
      {/* ============================================= */}
      <SectionHeader icon={AlertTriangle} color="#F59E0B" title="Alergias" />

      <TextInput
        value={formData.allergies || ''}
        onChangeText={(val) => updateField('allergies', val)}
        placeholder="Ej: Penicilina, mariscos, polen..."
        placeholderTextColor="#94A3B8"
        multiline
        textAlignVertical="top"
        className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 mb-3"
        style={{ minHeight: 60 }}
      />

      {/* ============================================= */}
      {/* Derechohabiencia                              */}
      {/* ============================================= */}
      <SectionHeader icon={BadgeCheck} color="#059669" title="Derechohabiencia" />

      <TextInput
        value={formData.health_insurance || ''}
        onChangeText={(val) => updateField('health_insurance', val)}
        placeholder="IMSS, ISSSTE, Popular, Privado, Ninguno..."
        placeholderTextColor="#94A3B8"
        className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 mb-3"
        style={{ height: 40 }}
      />

      {/* ============================================= */}
      {/* Autorizaciones                                */}
      {/* ============================================= */}
      <SectionHeader icon={BadgeCheck} color="#8B5CF6" title="Autorizaciones" />

      <View className="flex-row gap-3 mb-3">
        <TouchableOpacity
          onPress={() => updateField('vaccination_authorization', !formData.vaccination_authorization)}
          className="flex-1 flex-row items-center bg-slate-50 rounded-xl border px-3 py-2.5"
          style={{
            borderColor: formData.vaccination_authorization ? '#059669' : '#E2E8F0',
            backgroundColor: formData.vaccination_authorization ? '#D1FAE5' : '#F8FAFC',
          }}
        >
          <View
            className="w-5 h-5 rounded border-2 mr-2 items-center justify-center"
            style={{
              borderColor: formData.vaccination_authorization ? '#059669' : '#CBD5E1',
              backgroundColor: formData.vaccination_authorization ? '#059669' : 'transparent',
            }}
          >
            {formData.vaccination_authorization && (
              <Text className="text-white text-[10px] font-bold">✓</Text>
            )}
          </View>
          <Text className="text-xs font-semibold text-slate-700">Vacunación</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => updateField('protection_civil_authorization', !formData.protection_civil_authorization)}
          className="flex-1 flex-row items-center bg-slate-50 rounded-xl border px-3 py-2.5"
          style={{
            borderColor: formData.protection_civil_authorization ? '#059669' : '#E2E8F0',
            backgroundColor: formData.protection_civil_authorization ? '#D1FAE5' : '#F8FAFC',
          }}
        >
          <View
            className="w-5 h-5 rounded border-2 mr-2 items-center justify-center"
            style={{
              borderColor: formData.protection_civil_authorization ? '#059669' : '#CBD5E1',
              backgroundColor: formData.protection_civil_authorization ? '#059669' : 'transparent',
            }}
          >
            {formData.protection_civil_authorization && (
              <Text className="text-white text-[10px] font-bold">✓</Text>
            )}
          </View>
          <Text className="text-xs font-semibold text-slate-700">Prot. Civil</Text>
        </TouchableOpacity>
      </View>

      {/* Botón Guardar — fijo al fondo */}
      <View className="px-4 py-4 mt-2">
        <TouchableOpacity
          onPress={onSave}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Guardar ficha de salud"
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
            {isSaving ? 'Guardando...' : 'Guardar Salud'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
