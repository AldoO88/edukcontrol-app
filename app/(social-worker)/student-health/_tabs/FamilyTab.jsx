// =====================================================================
// app/(social-worker)/student-health/_tabs/FamilyTab.jsx
// ---------------------------------------------------------------------
// Ficha de Datos Familiares y Socioeconómicos del alumno.
// Tabla editable de miembros del hogar, dinámica familiar,
// situación económica y características de la vivienda.
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
  Users,
  Plus,
  Trash2,
  Home,
  DollarSign,
  FileText,
  Save,
} from 'lucide-react-native';

// ---------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------
const RELATIONSHIP_OPTIONS = [
  'Padre', 'Madre', 'Hermano/a', 'Abuelo/a', 'Tío/a',
  'Tutor', 'Otro',
];

const EDUCATION_LEVELS = [
  'Ninguno', 'Primaria', 'Secundaria', 'Preparatoria', 'Universidad', 'Posgrado',
];

const INCOME_RANGES = [
  'Menos de $3,000', '$3,000 - $5,000', '$5,000 - $10,000',
  '$10,000 - $20,000', '$20,000 - $50,000', 'Más de $50,000', 'No especificado',
];

const HOUSING_TYPES = [
  'Propia', 'Rentada', 'Prestada', 'Otra',
];

// ---------------------------------------------------------------------
// FamilyMemberRow — Fila de la tabla de miembros del hogar
// ---------------------------------------------------------------------
const FamilyMemberRow = ({ member, index, onUpdate, onRemove }) => (
  <View
    className="bg-slate-50 rounded-xl p-3 mb-2 border border-slate-100"
    style={{
      shadowColor: '#000',
      shadowOpacity: 0.03,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    }}
  >
    {/* Fila 1: Nombre + Parentesco */}
    <View className="flex-row gap-2 mb-2">
      <View className="flex-1">
        <Text className="text-[10px] font-semibold text-slate-500 mb-0.5">Nombre</Text>
        <TextInput
          value={member.name || ''}
          onChangeText={(val) => onUpdate(index, 'name', val)}
          placeholder="Nombre"
          placeholderTextColor="#94A3B8"
          className="bg-white rounded-lg px-2.5 py-2 text-sm text-slate-900 border border-slate-200"
          style={{ height: 36 }}
        />
      </View>
      <View className="flex-1">
        <Text className="text-[10px] font-semibold text-slate-500 mb-0.5">Parentesco</Text>
        <TextInput
          value={member.relationship || ''}
          onChangeText={(val) => onUpdate(index, 'relationship', val)}
          placeholder="Ej: Padre"
          placeholderTextColor="#94A3B8"
          className="bg-white rounded-lg px-2.5 py-2 text-sm text-slate-900 border border-slate-200"
          style={{ height: 36 }}
        />
      </View>
    </View>

    {/* Fila 2: Edad + Ocupación + Escolaridad */}
    <View className="flex-row gap-2 mb-2">
      <View style={{ width: 60 }}>
        <Text className="text-[10px] font-semibold text-slate-500 mb-0.5">Edad</Text>
        <TextInput
          value={member.age ? String(member.age) : ''}
          onChangeText={(val) => onUpdate(index, 'age', val ? parseInt(val, 10) || '' : '')}
          placeholder="—"
          placeholderTextColor="#94A3B8"
          keyboardType="number-pad"
          className="bg-white rounded-lg px-2.5 py-2 text-sm text-slate-900 border border-slate-200"
          style={{ height: 36 }}
        />
      </View>
      <View className="flex-1">
        <Text className="text-[10px] font-semibold text-slate-500 mb-0.5">Ocupación</Text>
        <TextInput
          value={member.occupation || ''}
          onChangeText={(val) => onUpdate(index, 'occupation', val)}
          placeholder="Ocupación"
          placeholderTextColor="#94A3B8"
          className="bg-white rounded-lg px-2.5 py-2 text-sm text-slate-900 border border-slate-200"
          style={{ height: 36 }}
        />
      </View>
    </View>

    {/* Fila 3: Nivel de escolaridad + Botón eliminar */}
    <View className="flex-row items-end gap-2">
      <View className="flex-1">
        <Text className="text-[10px] font-semibold text-slate-500 mb-0.5">Escolaridad</Text>
        <TextInput
          value={member.education_level || ''}
          onChangeText={(val) => onUpdate(index, 'education_level', val)}
          placeholder="Ej: Secundaria"
          placeholderTextColor="#94A3B8"
          className="bg-white rounded-lg px-2.5 py-2 text-sm text-slate-900 border border-slate-200"
          style={{ height: 36 }}
        />
      </View>
      <TouchableOpacity
        onPress={() => onRemove(index)}
        className="w-9 h-9 rounded-lg bg-red-50 items-center justify-center mb-0.5"
        accessibilityLabel={`Eliminar miembro ${index + 1}`}
      >
        <Trash2 size={14} color="#DC2626" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  </View>
);

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function FamilyTab({ formData, updateField, onSave, isSaving }) {
  const familyData = formData.family_socioeconomic || {};
  const members = familyData.family_members || [];

  // Actualizar un miembro del array
  const handleUpdateMember = (index, field, value) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    updateField('family_socioeconomic', { ...familyData, family_members: updated });
  };

  // Eliminar un miembro
  const handleRemoveMember = (index) => {
    const updated = members.filter((_, i) => i !== index);
    updateField('family_socioeconomic', { ...familyData, family_members: updated });
  };

  // Agregar un miembro nuevo
  const handleAddMember = () => {
    const updated = [...members, { name: '', relationship: '', age: '', occupation: '', education_level: '' }];
    updateField('family_socioeconomic', { ...familyData, family_members: updated });
  };

  // Actualizar un campo del sub-schema
  const updateFamilyField = (field, value) => {
    updateField('family_socioeconomic', { ...familyData, [field]: value });
  };

  return (
    <View className="px-4 py-3">
      {/* ============================================= */}
      {/* Estructura Familiar — Tabla editable          */}
      {/* ============================================= */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Users size={16} color="#4F46E5" strokeWidth={2} />
          <Text className="text-sm font-bold text-slate-900 ml-2">Estructura Familiar</Text>
        </View>
        <TouchableOpacity
          onPress={handleAddMember}
          className="flex-row items-center bg-indigo-500 rounded-lg px-2.5 py-1.5"
        >
          <Plus size={12} color="#FFFFFF" strokeWidth={2.5} />
          <Text className="text-white text-xs font-semibold ml-1">Agregar</Text>
        </TouchableOpacity>
      </View>

      {members.length === 0 ? (
        <View className="bg-slate-50 rounded-xl p-6 items-center border border-slate-100 mb-4">
          <Users size={24} color="#CBD5E1" strokeWidth={1.5} />
          <Text className="text-xs text-slate-400 mt-2 text-center">
            No hay miembros registrados.{'\n'}Toca "Agregar" para comenzar.
          </Text>
        </View>
      ) : (
        <View className="mb-4">
          {members.map((member, idx) => (
            <FamilyMemberRow
              key={`member-${idx}`}
              member={member}
              index={idx}
              onUpdate={handleUpdateMember}
              onRemove={handleRemoveMember}
            />
          ))}
        </View>
      )}

      {/* ============================================= */}
      {/* Dinámica Familiar                            */}
      {/* ============================================= */}
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          <FileText size={14} color="#64748B" strokeWidth={2} />
          <Text className="text-xs font-semibold text-slate-600 ml-1.5">Dinámica Familiar</Text>
        </View>
        <TextInput
          value={familyData.family_dynamics || ''}
          onChangeText={(val) => updateFamilyField('family_dynamics', val)}
          placeholder="Describe la dinámica del hogar: relación entre miembros, roles, ambiente familiar..."
          placeholderTextColor="#94A3B8"
          multiline
          textAlignVertical="top"
          className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900"
          style={{ minHeight: 80 }}
        />
      </View>

      {/* ============================================= */}
      {/* Situación Económica                           */}
      {/* ============================================= */}
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          <DollarSign size={14} color="#059669" strokeWidth={2} />
          <Text className="text-xs font-semibold text-slate-600 ml-1.5">Situación Económica</Text>
        </View>

        <Text className="text-[10px] font-semibold text-slate-500 mb-1">Ingreso mensual aproximado</Text>
        <TextInput
          value={familyData.monthly_income || ''}
          onChangeText={(val) => updateFamilyField('monthly_income', val)}
          placeholder="Ej: $5,000 - $10,000"
          placeholderTextColor="#94A3B8"
          className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 mb-3"
          style={{ height: 40 }}
        />

        <Text className="text-[10px] font-semibold text-slate-500 mb-1">Fuentes de ingreso</Text>
        <TextInput
          value={familyData.income_sources || ''}
          onChangeText={(val) => updateFamilyField('income_sources', val)}
          placeholder="Ej: Salario fijo, comercio, apoyo gubernamental..."
          placeholderTextColor="#94A3B8"
          multiline
          textAlignVertical="top"
          className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900"
          style={{ minHeight: 60 }}
        />
      </View>

      {/* ============================================= */}
      {/* Características de la Vivienda                */}
      {/* ============================================= */}
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          <Home size={14} color="#D97706" strokeWidth={2} />
          <Text className="text-xs font-semibold text-slate-600 ml-1.5">Vivienda</Text>
        </View>

        <Text className="text-[10px] font-semibold text-slate-500 mb-1">Tipo de tenencia</Text>
        <TextInput
          value={familyData.housing_type || ''}
          onChangeText={(val) => updateFamilyField('housing_type', val)}
          placeholder="Ej: Propia, rentada, prestada..."
          placeholderTextColor="#94A3B8"
          className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 mb-3"
          style={{ height: 40 }}
        />

        <Text className="text-[10px] font-semibold text-slate-500 mb-1">Materiales de construcción</Text>
        <TextInput
          value={familyData.housing_materials || ''}
          onChangeText={(val) => updateFamilyField('housing_materials', val)}
          placeholder="Ej: Block, lámina, concreto..."
          placeholderTextColor="#94A3B8"
          className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 mb-3"
          style={{ height: 40 }}
        />

        <Text className="text-[10px] font-semibold text-slate-500 mb-1">Servicios básicos</Text>
        <TextInput
          value={familyData.basic_services || ''}
          onChangeText={(val) => updateFamilyField('basic_services', val)}
          placeholder="Ej: Agua potable, electricidad, drenaje, internet..."
          placeholderTextColor="#94A3B8"
          multiline
          textAlignVertical="top"
          className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900"
          style={{ minHeight: 60 }}
        />
      </View>

      {/* Botón Guardar — fijo al fondo */}
      <View className="px-4 py-4 mt-2">
        <TouchableOpacity
          onPress={onSave}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Guardar ficha de familia"
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
            {isSaving ? 'Guardando...' : 'Guardar Familia'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
