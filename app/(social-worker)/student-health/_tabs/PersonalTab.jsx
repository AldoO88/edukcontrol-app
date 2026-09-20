// =====================================================================
// app/(social-worker)/student-health/_tabs/PersonalTab.jsx
// ---------------------------------------------------------------------
// Ficha de Datos Personales e Identificación del alumno.
// Muestra nombre, CURP, fecha de nacimiento, edad calculada,
// tipo de sangre, dirección, grupo actual y tutor de referencia.
// Solo la dirección es editable.
// =====================================================================

import React, { useMemo } from 'react';
import { View, Text, TextInput } from 'react-native';
import {
  User,
  CreditCard,
  Calendar,
  Droplets,
  MapPin,
  GraduationCap,
  Phone,
} from 'lucide-react-native';

// ---------------------------------------------------------------------
// calcularEdad
// ---------------------------------------------------------------------
const calcularEdad = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// ---------------------------------------------------------------------
// FormField — Campo de solo lectura o editable
// ---------------------------------------------------------------------
const FormField = ({ label, icon: Icon, value, editable, onChangeText, placeholder, multiline, keyboardType }) => (
  <View className="mb-3">
    <Text className="text-xs font-semibold text-slate-500 mb-1">{label}</Text>
    {editable ? (
      <View
        className="flex-row items-start bg-slate-50 rounded-xl border border-slate-200 px-3"
        style={{ minHeight: multiline ? 80 : 44, paddingVertical: multiline ? 10 : 0 }}
      >
        {Icon && (
          <Icon size={14} color="#94A3B8" strokeWidth={2} style={{ marginTop: multiline ? 4 : 12, marginRight: 8 }} />
        )}
        <TextInput
          value={value || ''}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          keyboardType={keyboardType || 'default'}
          className="flex-1 text-sm text-slate-900"
          style={{ paddingVertical: multiline ? 2 : 10 }}
        />
      </View>
    ) : (
      <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-100 px-3 py-2.5">
        {Icon && (
          <Icon size={14} color="#94A3B8" strokeWidth={2} style={{ marginRight: 8 }} />
        )}
        <Text className="text-sm text-slate-700 flex-1">
          {value || '—'}
        </Text>
      </View>
    )}
  </View>
);

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function PersonalTab({ student, formData, updateField }) {
  const edad = useMemo(() => calcularEdad(student?.date_of_birth), [student?.date_of_birth]);

  const fechaNacimiento = useMemo(() => {
    if (!student?.date_of_birth) return null;
    const d = new Date(student.date_of_birth);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  }, [student?.date_of_birth]);

  const grupo = student?.current_group_id;
  const grupoLabel = grupo ? `${grupo.grade}°${grupo.section}` : '—';

  return (
    <View className="px-4 py-3">
      {/* Avatar + Nombre */}
      <View className="flex-row items-center mb-4">
        <View className="w-14 h-14 rounded-full bg-indigo-100 items-center justify-center mr-3">
          {student?.photoUrl ? (
            <Text className="text-lg font-bold text-indigo-700">
              {`${student?.first_name?.[0] || ''}${student?.last_name?.[0] || ''}`.toUpperCase()}
            </Text>
          ) : (
            <User size={24} color="#4F46E5" strokeWidth={2} />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-900">
            {student?.first_name} {student?.last_name}
          </Text>
          <Text className="text-sm text-slate-500">
            {grupoLabel !== '—' ? `Grupo: ${grupoLabel}` : 'Sin grupo asignado'}
          </Text>
        </View>
      </View>

      {/* CURP */}
      <FormField
        label="CURP"
        icon={CreditCard}
        value={student?.curp}
        editable={false}
      />

      {/* Fecha de nacimiento + Edad */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="Fecha de Nacimiento"
            icon={Calendar}
            value={fechaNacimiento}
            editable={false}
          />
        </View>
        <View style={{ width: 80 }}>
          <FormField
            label="Edad"
            value={edad !== null ? `${edad} años` : '—'}
            editable={false}
          />
        </View>
      </View>

      {/* Sexo + Tipo de sangre */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="Sexo"
            icon={User}
            value={student?.sex === 'male' ? 'Masculino' : student?.sex === 'female' ? 'Femenino' : '—'}
            editable={false}
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Tipo de Sangre"
            icon={Droplets}
            value={student?.blood_type}
            editable={false}
          />
        </View>
      </View>

      {/* Número de Control */}
      <FormField
        label="Número de Control"
        icon={CreditCard}
        value={student?.controlNumber}
        editable={false}
      />

      {/* Dirección (editable) */}
      <FormField
        label="Dirección"
        icon={MapPin}
        value={formData.address || student?.address}
        editable={true}
        onChangeText={(val) => updateField('address', val)}
        placeholder="Dirección completa del alumno..."
        multiline
      />

      {/* Teléfono */}
      <FormField
        label="Teléfono"
        icon={Phone}
        value={student?.phone}
        editable={false}
      />
    </View>
  );
}
