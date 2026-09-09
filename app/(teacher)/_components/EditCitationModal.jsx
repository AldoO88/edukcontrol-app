// =====================================================================
// app/(teacher)/_components/EditCitationModal.jsx
// ---------------------------------------------------------------------
// Modal para editar campos de un citatorio existente (reason, location,
// type, subject). No cambia la fecha. Usa PUT /api/citations/:id.
//
// Props:
//   - isVisible:   boolean — controla la visibilidad del Modal.
//   - onClose:     fn() — callback al cerrar.
//   - onUpdated:   fn() — callback después de actualizar exitosamente.
//   - citation:    object — datos actuales del citatorio (reason, location, type, subject).
//   - groupSubjects: array — materias del grupo del alumno [{_id, name}].
// =====================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { updateCitation, getMyGroups } from '../../../src/services/teacherService';

// Tipos de citatorio (mismos que GenerateCitationModal).
const CITATION_TYPES = ['academic', 'behavioral', 'administrative'];
const CITATION_TYPE_LABELS = {
  academic: 'Aprovechamiento',
  behavioral: 'Conductual',
  administrative: 'Administrativo',
};

// Locaciones predefinidas (mismo listado que GenerateCitationModal).
const LOCATIONS = ['Trabajo Social', 'Prefectura', 'Dirección'];

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
const EditCitationModal = ({
  isVisible,
  onClose,
  onUpdated,
  citation,
}) => {
  const insets = useSafeAreaInsets();

  const [reason, setReason] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Trabajo Social');
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  const [selectedType, setSelectedType] = useState('academic');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [groupSubjects, setGroupSubjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const scrollViewRef = useRef(null);

  // Fetch grupos al abrir para obtener las materias del grupo del alumno.
  useEffect(() => {
    if (!isVisible || !citation?.groupName) return;

    let cancelled = false;
    const fetchGroups = async () => {
      const result = await getMyGroups();
      if (cancelled) return;
      if (result.success) {
        const groups = result.data?.groups || [];
        // Buscar el grupo que coincida con el groupName del citatorio.
        const matchedGroup = groups.find(
          (g) => g.label === citation.groupName || g._id === citation.groupId
        );
        if (matchedGroup?.subjects) {
          setGroupSubjects(matchedGroup.subjects);
        }
      }
    };
    fetchGroups();
    return () => { cancelled = true; };
  }, [isVisible, citation?.groupName, citation?.groupId]);

  // Reset al abrir con los valores actuales del citatorio.
  useEffect(() => {
    if (isVisible && citation) {
      setReason(citation.reason || '');
      setSelectedType(citation.type || 'academic');

      // Detectar si la ubicación actual es una de las predefinidas
      const currentLoc = citation.location || '';
      const isPredefined = LOCATIONS.includes(currentLoc);
      setSelectedLocation(isPredefined ? currentLoc : 'Trabajo Social');
      setIsCustomLocation(!isPredefined);
      setCustomLocation(!isPredefined ? currentLoc : '');

      // Buscar la materia actual del citatorio en las materias del grupo
      if (citation.subject?._id && groupSubjects.length > 0) {
        const currentSubject = groupSubjects.find(
          (s) => s._id === citation.subject._id
        );
        setSelectedSubject(currentSubject || null);
      } else {
        setSelectedSubject(null);
      }
      setIsSubmitting(false);
      setSubmitError(null);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
    }
  }, [isVisible, citation, groupSubjects]);

  // Auto-seleccionar materia si solo hay una.
  useEffect(() => {
    if (selectedType === 'academic' && groupSubjects.length === 1) {
      setSelectedSubject(groupSubjects[0]);
    } else if (selectedType !== 'academic') {
      setSelectedSubject(null);
    }
  }, [selectedType, groupSubjects]);

  // -----------------------------------------------------------------
  // HANDLE SUBMIT
  // -----------------------------------------------------------------
  const handleUpdate = async () => {
    // Validación: si es academic y no hay materia.
    if (selectedType === 'academic' && !selectedSubject) {
      setSubmitError('Selecciona una materia para citatorios de aprovechamiento.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {};
    if (reason.trim()) payload.reason = reason.trim();
    const locationValue = isCustomLocation ? customLocation : selectedLocation;
    if (locationValue.trim()) payload.location = locationValue.trim();
    if (selectedType !== citation.type) payload.type = selectedType;
    if (selectedType === 'academic' && selectedSubject?._id) {
      payload.subject = selectedSubject._id;
    } else if (selectedType !== 'academic') {
      payload.subject = null;
    }

    const result = await updateCitation(citation.id, payload);

    if (result.success) {
      if (onUpdated) onUpdated();
      onClose();
    } else {
      setSubmitError(result.message);
    }
    setIsSubmitting(false);
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: insets.bottom + 12,
              maxHeight: '85%',
            }}
          >
            {/* HEADER */}
            <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
              <Text
                className="text-slate-900"
                style={{ fontSize: 16, fontWeight: '700' }}
              >
                Editar Citatorio
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <X size={20} color="#64748B" strokeWidth={2.25} />
              </Pressable>
            </View>

            <ScrollView
              ref={scrollViewRef}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
            >
              {/* TIPO DE CITATORIO */}
              <Text
                className="text-slate-500 mb-2"
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Tipo
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {CITATION_TYPES.map((typeId) => {
                  const isActive = selectedType === typeId;
                  const label = CITATION_TYPE_LABELS[typeId] || typeId;
                  return (
                    <Pressable
                      key={typeId}
                      onPress={() => setSelectedType(typeId)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      className="px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: isActive ? '#DC2626' : '#FFFFFF',
                        borderWidth: 1.5,
                        borderColor: isActive ? '#DC2626' : '#E2E8F0',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: isActive ? '#FFFFFF' : '#334155',
                        }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* MATERIA — solo para tipo academic */}
              {selectedType === 'academic' && groupSubjects.length > 0 && (
                <>
                  <Text
                    className="text-slate-500 mt-4 mb-2"
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Materia
                  </Text>
                  {groupSubjects.length === 1 ? (
                    <View
                      className="px-3 py-2 rounded-lg self-start"
                      style={{
                        backgroundColor: '#0284C7',
                        borderWidth: 1.5,
                        borderColor: '#0284C7',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                        {groupSubjects[0].name}
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                      {groupSubjects.map((subject) => {
                        const isActive = selectedSubject?._id === subject._id;
                        return (
                          <Pressable
                            key={subject._id}
                            onPress={() => setSelectedSubject(subject)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isActive }}
                            className="px-3 py-2 rounded-lg"
                            style={{
                              backgroundColor: isActive ? '#0284C7' : '#FFFFFF',
                              borderWidth: 1.5,
                              borderColor: isActive ? '#0284C7' : '#E2E8F0',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: '700',
                                color: isActive ? '#FFFFFF' : '#334155',
                              }}
                            >
                              {subject.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </>
              )}

              {/* LUGAR */}
              <Text
                className="text-slate-500 mt-4 mb-2"
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Lugar
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {LOCATIONS.map((loc) => {
                  const isActive = selectedLocation === loc && !isCustomLocation;
                  return (
                    <Pressable
                      key={loc}
                      onPress={() => {
                        setSelectedLocation(loc);
                        setIsCustomLocation(false);
                        setCustomLocation('');
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      className="px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: isActive ? '#0284C7' : '#F1F5F9',
                        borderWidth: 1.5,
                        borderColor: isActive ? '#0284C7' : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: isActive ? '#FFFFFF' : '#334155',
                        }}
                      >
                        {loc}
                      </Text>
                    </Pressable>
                  );
                })}
                {/* Chip "Otro lugar" — activa input de texto libre */}
                <Pressable
                  onPress={() => {
                    setIsCustomLocation(true);
                    setSelectedLocation(customLocation || '');
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isCustomLocation }}
                  className="px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: isCustomLocation ? '#0284C7' : '#F1F5F9',
                    borderWidth: 1.5,
                    borderColor: isCustomLocation ? '#0284C7' : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: isCustomLocation ? '#FFFFFF' : '#334155',
                    }}
                  >
                    Otro lugar
                  </Text>
                </Pressable>
              </View>

              {/* Input de lugar personalizado — solo visible cuando "Otro lugar" está activo */}
              {isCustomLocation && (
                <TextInput
                  value={customLocation}
                  onChangeText={(text) => {
                    setCustomLocation(text);
                    setSelectedLocation(text);
                  }}
                  placeholder="Ej. Salón de Inglés, Sala de Dirección..."
                  placeholderTextColor="#94A3B8"
                  className="rounded-lg px-3 py-3 mt-2"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    fontSize: 13,
                    color: '#0F172A',
                  }}
                />
              )}

              {/* RAZÓN / MOTIVO */}
              <Text
                className="text-slate-500 mt-4 mb-2"
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Motivo
              </Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Describe el motivo del citatorio..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="rounded-lg px-3 py-3"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  fontSize: 13,
                  color: '#0F172A',
                  minHeight: 100,
                }}
              />

              {/* ERROR */}
              {submitError && (
                <Text
                  className="text-rose-600 text-center mt-3"
                  style={{ fontSize: 12 }}
                >
                  {submitError}
                </Text>
              )}

              {/* BOTÓN GUARDAR */}
              <Pressable
                onPress={handleUpdate}
                disabled={isSubmitting}
                className="mt-4 mb-2 flex-row items-center justify-center rounded-xl"
                style={{
                  backgroundColor: isSubmitting ? '#94A3B8' : '#0284C7',
                  paddingVertical: 14,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text
                    className="text-white"
                    style={{ fontSize: 14, fontWeight: '700' }}
                  >
                    Guardar Cambios
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default EditCitationModal;
