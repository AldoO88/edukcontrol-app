// =====================================================================
// app/(social-worker)/student-health/_tabs/EmergencyContactsTab.jsx
// ---------------------------------------------------------------------
// Ficha de Contactos de Emergencia del alumno.
// Lista editable de contactos con opción de agregar múltiples.
// El contacto primario es el tutor/guardian del sistema (readonly).
// =====================================================================

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Phone,
  Plus,
  Trash2,
  User,
  Star,
  Save,
} from 'lucide-react-native';

// ---------------------------------------------------------------------
// EmergencyContactRow — Fila de un contacto de emergencia
// ---------------------------------------------------------------------
const EmergencyContactRow = ({ contact, index, onUpdate, onRemove, isPrimary }) => (
  <View
    className="rounded-xl p-3 mb-2 border"
    style={{
      backgroundColor: isPrimary ? '#EFF6FF' : '#F8FAFC',
      borderColor: isPrimary ? '#BFDBFE' : '#E2E8F0',
    }}
  >
    {/* Badge de primario */}
    {isPrimary && (
      <View className="flex-row items-center mb-2">
        <Star size={12} color="#3B82F6" strokeWidth={2.5} fill="#3B82F6" />
        <Text className="text-[10px] font-bold text-blue-600 ml-1">TUTOR / GUARDIAN</Text>
      </View>
    )}

    {/* Fila 1: Nombre */}
    <View className="mb-2">
      <Text className="text-[10px] font-semibold text-slate-500 mb-0.5">Nombre completo</Text>
      <TextInput
        value={contact.name || ''}
        onChangeText={(val) => onUpdate(index, 'name', val)}
        placeholder="Nombre del contacto"
        placeholderTextColor="#94A3B8"
        editable={!isPrimary}
        className="bg-white rounded-lg px-3 py-2 text-sm text-slate-900 border border-slate-200"
        style={{ height: 38, opacity: isPrimary ? 0.7 : 1 }}
      />
    </View>

    {/* Fila 2: Teléfono + Parentesco */}
    <View className="flex-row gap-2">
      <View className="flex-1">
        <Text className="text-[10px] font-semibold text-slate-500 mb-0.5">Teléfono</Text>
        <TextInput
          value={contact.phone || ''}
          onChangeText={(val) => onUpdate(index, 'phone', val)}
          placeholder="55 1234 5678"
          placeholderTextColor="#94A3B8"
          keyboardType="phone-pad"
          editable={!isPrimary}
          className="bg-white rounded-lg px-3 py-2 text-sm text-slate-900 border border-slate-200"
          style={{ height: 38, opacity: isPrimary ? 0.7 : 1 }}
        />
      </View>
      <View className="flex-1">
        <Text className="text-[10px] font-semibold text-slate-500 mb-0.5">Parentesco</Text>
        <TextInput
          value={contact.relationship || ''}
          onChangeText={(val) => onUpdate(index, 'relationship', val)}
          placeholder="Ej: Madre"
          placeholderTextColor="#94A3B8"
          editable={!isPrimary}
          className="bg-white rounded-lg px-3 py-2 text-sm text-slate-900 border border-slate-200"
          style={{ height: 38, opacity: isPrimary ? 0.7 : 1 }}
        />
      </View>
    </View>

    {/* Botón eliminar (solo contactos secundarios) */}
    {!isPrimary && (
      <TouchableOpacity
        onPress={() => {
          Alert.alert(
            'Eliminar contacto',
            `¿Eliminar a ${contact.name || 'este contacto'} de emergencia?`,
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive', onPress: () => onRemove(index) },
            ]
          );
        }}
        className="flex-row items-center mt-2 self-end"
      >
        <Trash2 size={12} color="#DC2626" strokeWidth={2} />
        <Text className="text-[10px] font-semibold text-red-600 ml-1">Eliminar</Text>
      </TouchableOpacity>
    )}
  </View>
);

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function EmergencyContactsTab({ student, formData, updateField, onSave, isSaving }) {
  const contacts = formData.emergency_contacts || [];

  // Contacto primario del guardian/tutor del sistema
  const primaryGuardian = student?.guardians?.[0];
  const primaryContact = primaryGuardian
    ? {
        name: primaryGuardian.name || `${primaryGuardian.first_name || ''} ${primaryGuardian.last_name || ''}`.trim(),
        phone: primaryGuardian.phone || '',
        relationship: primaryGuardian.relationship || 'Tutor',
        is_primary: true,
      }
    : null;

  // Contactos secundarios (excluyendo el primario si existe en el array)
  const secondaryContacts = contacts.filter((c) => !c.is_primary);

  // Actualizar un contacto secundario
  const handleUpdate = (index, field, value) => {
    const updated = [...secondaryContacts];
    updated[index] = { ...updated[index], [field]: value };
    // Reconstruir el array completo: primario primero, luego secundarios actualizados
    const fullArray = primaryContact ? [primaryContact, ...updated] : updated;
    updateField('emergency_contacts', fullArray);
  };

  // Eliminar un contacto secundario
  const handleRemove = (index) => {
    const updated = secondaryContacts.filter((_, i) => i !== index);
    const fullArray = primaryContact ? [primaryContact, ...updated] : updated;
    updateField('emergency_contacts', fullArray);
  };

  // Agregar un contacto secundario nuevo
  const handleAdd = () => {
    const newContact = { name: '', phone: '', relationship: '', is_primary: false };
    const fullArray = primaryContact
      ? [...contacts.filter((c) => c.is_primary), ...secondaryContacts, newContact]
      : [...secondaryContacts, newContact];
    updateField('emergency_contacts', fullArray);
  };

  return (
    <View className="px-4 py-3">
      {/* ============================================= */}
      {/* Contacto Primario (Guardian del sistema)      */}
      {/* ============================================= */}
      <View className="flex-row items-center mb-2">
        <Phone size={16} color="#3B82F6" strokeWidth={2} />
        <Text className="text-sm font-bold text-slate-900 ml-2">Contacto Primario</Text>
      </View>

      {primaryContact ? (
        <EmergencyContactRow
          contact={primaryContact}
          index={-1}
          onUpdate={() => {}}
          onRemove={() => {}}
          isPrimary={true}
        />
      ) : (
        <View className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-100">
          <Text className="text-xs text-blue-600 text-center">
            No hay tutor/guardian registrado en el sistema para este alumno.
          </Text>
        </View>
      )}

      {/* ============================================= */}
      {/* Contactos Secundarios                         */}
      {/* ============================================= */}
      <View className="flex-row items-center justify-between mt-4 mb-2">
        <View className="flex-row items-center">
          <Phone size={16} color="#059669" strokeWidth={2} />
          <Text className="text-sm font-bold text-slate-900 ml-2">Contactos Adicionales</Text>
        </View>
        <TouchableOpacity
          onPress={handleAdd}
          className="flex-row items-center bg-emerald-500 rounded-lg px-2.5 py-1.5"
        >
          <Plus size={12} color="#FFFFFF" strokeWidth={2.5} />
          <Text className="text-white text-xs font-semibold ml-1">Agregar</Text>
        </TouchableOpacity>
      </View>

      {secondaryContacts.length === 0 ? (
        <View className="bg-slate-50 rounded-xl p-6 items-center border border-slate-100">
          <Phone size={24} color="#CBD5E1" strokeWidth={1.5} />
          <Text className="text-xs text-slate-400 mt-2 text-center">
            No hay contactos adicionales registrados.{'\n'}Puedes agregar números de emergencia extra.
          </Text>
        </View>
      ) : (
        secondaryContacts.map((contact, idx) => (
          <EmergencyContactRow
            key={`secondary-${idx}`}
            contact={contact}
            index={idx}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
            isPrimary={false}
          />
        ))
      )}

      {/* Botón Guardar — fijo al fondo */}
      <View className="px-4 py-4 mt-4">
        <TouchableOpacity
          onPress={onSave}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Guardar contactos de emergencia"
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
            {isSaving ? 'Guardando...' : 'Guardar Emergencia'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
