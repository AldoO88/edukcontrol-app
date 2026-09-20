// =====================================================================
// app/(director)/_components/GenerateExitPassModal.jsx
// ---------------------------------------------------------------------
// Bottom sheet modal para registrar un Pase de Salida.
//
// FLUJOS:
//   1) Si se pasa `student` como prop: Muestra el form directamente
//      con el alumno pre-seleccionado.
//   2) Si `student` es null: Muestra selector de Grupo → Alumno → Form.
//
// Props:
//   - isVisible:        boolean — controla la visibilidad del Modal.
//   - onClose:          fn() — callback al cerrar.
//   - student:          Student | null — alumno pre-seleccionado (opcional).
//   - onCreated:        fn() — callback después de crear exitosamente.
//   - fetchGroupsFn:    fn() => Promise<{success, data}> — carga de grupos.
//   - fetchStudentsForGroup: fn(groupId) => Promise<students[]> — carga lazy de alumnos.
// =====================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';

import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  LogOut,
  X,
  Check,
  ChevronRight,
  User,
  Users,
  Clock,
} from 'lucide-react-native';

import { createExitPass } from '@/src/services/directorService';

// ---------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------
const RELATIONSHIP_OPTIONS = [
  { value: 'father', label: 'Padre' },
  { value: 'mother', label: 'Madre' },
  { value: 'guardian', label: 'Tutor' },
  { value: 'family', label: 'Familiar' },
];

const REASON_OPTIONS = [
  { value: 'illness', label: 'Enfermedad' },
  { value: 'medical', label: 'Cita médica' },
  { value: 'family', label: 'Asunto familiar' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Otro' },
];

// ---------------------------------------------------------------------
// SUBCOMPONENTE: SectionLabel
// ---------------------------------------------------------------------
const SectionLabel = ({ children, mt = 0 }) => (
  <Text
    className="text-slate-500"
    style={{
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: mt,
      marginBottom: 10,
    }}
  >
    {children}
  </Text>
);

// ---------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------
const GenerateExitPassModal = ({
  isVisible,
  onClose,
  student = null,
  onCreated,
  fetchGroupsFn,
  fetchStudentsForGroup,
}) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  // --- Mode ---
  const isDirectMode = !!student;

  // --- State ---
  const [groups, setGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [guardianName, setGuardianName] = useState('');
  const [relationship, setRelationship] = useState(null);
  const [reason, setReason] = useState(null);
  const [reasonDetail, setReasonDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Validation ---
  const isFormValid =
    guardianName.trim() &&
    relationship &&
    reason;

  // --- Reset on open/close ---
  useEffect(() => {
    if (isVisible) {
      setGuardianName('');
      setRelationship(null);
      setReason(null);
      setReasonDetail('');
      setIsSubmitting(false);
      setSelectedGroup(null);
      setSelectedStudent(null);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
    }
  }, [isVisible]);

  // --- Load groups on open (selection mode only) ---
  useEffect(() => {
    if (!isVisible || isDirectMode) return;
    let cancelled = false;
    const fetchGroups = async () => {
      setIsLoadingGroups(true);
      try {
        const result = await fetchGroupsFn();
        if (cancelled) return;
        if (result.success) {
          const groupsData = result.data?.groups || result.data || [];
          setGroups(groupsData);
        }
      } catch {
        // silent
      }
      setIsLoadingGroups(false);
    };
    fetchGroups();
    return () => { cancelled = true; };
  }, [isVisible, isDirectMode, fetchGroupsFn]);

  // --- Handlers ---
  const handleSelectGroup = useCallback(async (group) => {
    if (fetchStudentsForGroup && (!group.students || group.students.length === 0)) {
      setIsLoadingStudents(true);
      try {
        const loaded = await fetchStudentsForGroup(group._id);
        group.students = loaded;
      } catch {
        // silent
      }
      setIsLoadingStudents(false);
    }
    setSelectedGroup(group);
    setSelectedStudent(null);
  }, [fetchStudentsForGroup]);

  const handleSelectStudent = useCallback((stu) => {
    setSelectedStudent(stu);
  }, []);

  const handleBackToGroups = useCallback(() => {
    setSelectedGroup(null);
    setSelectedStudent(null);
  }, []);

  const handleBackToStudents = useCallback(() => {
    setSelectedStudent(null);
  }, []);

  const handleSelectRelationship = useCallback((value) => {
    setRelationship(value);
  }, []);

  const handleSelectReason = useCallback((value) => {
    setReason(value);
  }, []);

  const handleEmit = useCallback(async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const targetStudent = isDirectMode ? student : selectedStudent;
      const result = await createExitPass({
        student_id: targetStudent._id,
        guardian_name: guardianName.trim(),
        relationship,
        reason,
        reason_detail: reasonDetail.trim() || undefined,
      });

      if (result.success) {
        onCreated?.();
        onClose();
        Alert.alert(
          'Pase de salida registrado',
          'El pase de salida se ha creado correctamente.',
        );
      } else {
        Alert.alert('Error', result.message || 'No se pudo crear el pase de salida.');
      }
    } catch {
      Alert.alert('Error', 'No se pudo crear el pase de salida.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isFormValid, isSubmitting, isDirectMode, student, selectedStudent,
    guardianName, relationship, reason, reasonDetail, onCreated, onClose,
  ]);

  const showForm = isDirectMode || !!selectedStudent;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        className="flex-1 pt-36"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        {/* BACKDROP */}
        <Pressable
          className="flex-1"
          onPress={onClose}
          accessibilityLabel="Cerrar modal"
          accessibilityRole="button"
        />

        {/* BOTTOM SHEET */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ width: '100%' }}
        >
          <View
            className="bg-white"
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: insets.bottom,
            }}
          >
            {/* DRAG HANDLE */}
            <View className="items-center pt-3 pb-2">
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: '#CBD5E1',
                  borderRadius: 2,
                }}
              />
            </View>

            {/* HEADER */}
            <View className="flex-row items-center justify-between px-5 pb-3">
              <View className="flex-row items-center flex-1">
                <View
                  className="items-center justify-center"
                  style={{
                    backgroundColor: '#FFF7ED',
                    padding: 8,
                    borderRadius: 12,
                  }}
                >
                  <LogOut size={20} color="#ea580c" strokeWidth={2.25} />
                </View>
                <Text
                  className="ml-3 text-slate-900"
                  style={{ fontSize: 18, fontWeight: '700' }}
                  numberOfLines={1}
                >
                  Registrar Pase de Salida
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="items-center justify-center"
                style={{ padding: 6 }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <X size={22} color="#64748B" strokeWidth={2.25} />
              </Pressable>
            </View>

            {/* SCROLLABLE CONTENT */}
            <ScrollView
              className="px-5"
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
              ref={scrollViewRef}
            >
              {/* ===========================================================
                  PASO 1: SELECCIONAR GRUPO (solo modo selección)
                  =========================================================== */}
              {!isDirectMode && !selectedGroup && (
                <>
                  <SectionLabel mt={1}>
                    Paso 1: Seleccionar Grupo
                  </SectionLabel>

                  {isLoadingGroups ? (
                    <View className="py-8 items-center">
                      <ActivityIndicator size="small" color="#ea580c" />
                      <Text className="text-slate-400 mt-2" style={{ fontSize: 12 }}>
                        Cargando grupos...
                      </Text>
                    </View>
                  ) : groups.length === 0 ? (
                    <View className="bg-white rounded-2xl p-6 items-center border border-slate-100">
                      <Users size={24} color="#94A3B8" strokeWidth={2} />
                      <Text className="text-slate-500 mt-2" style={{ fontSize: 13, fontWeight: '600' }}>
                        No hay grupos disponibles
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: 8 }}>
                      {groups.map((group) => {
                        const totalAlumnos = group.totalStudents
                          || group.students?.length
                          || 0;

                        return (
                          <Pressable
                            key={group._id}
                            onPress={() => handleSelectGroup(group)}
                            className="rounded-2xl p-3"
                            style={{
                              backgroundColor: '#F8FAFC',
                              borderWidth: 1.5,
                              borderColor: '#E2E8F0',
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`Seleccionar grupo ${group.label}`}
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="flex-1">
                                <View className="flex-row items-center">
                                  <View
                                    className="items-center justify-center rounded-lg"
                                    style={{
                                      backgroundColor: '#FFF7ED',
                                      width: 32,
                                      height: 32,
                                    }}
                                  >
                                    <Users size={16} color="#ea580c" strokeWidth={2.25} />
                                  </View>
                                  <Text
                                    className="ml-2 text-slate-900"
                                    style={{ fontSize: 15, fontWeight: '700' }}
                                  >
                                    {group.label}
                                  </Text>
                                </View>
                                <Text
                                  className="ml-10 text-slate-400 mt-0.5"
                                  style={{ fontSize: 11 }}
                                >
                                  {`${totalAlumnos} alumnos`}
                                </Text>
                              </View>
                              <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </>
              )}

              {/* ===========================================================
                  PASO 2: SELECCIONAR ALUMNO (solo modo selección)
                  =========================================================== */}
              {!isDirectMode && selectedGroup && !selectedStudent && (
                <>
                  <Pressable
                    onPress={handleBackToGroups}
                    className="flex-row items-center self-start mb-3"
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Volver a seleccionar grupo"
                  >
                    <Text
                      className="text-sky-600"
                      style={{ fontSize: 12, fontWeight: '600' }}
                    >
                      {'← Cambiar grupo'}
                    </Text>
                  </Pressable>

                  <SectionLabel mt={0}>
                    {`Paso 2: Seleccionar Alumno — ${selectedGroup.label}`}
                  </SectionLabel>

                  {isLoadingStudents ? (
                    <View className="bg-white rounded-2xl p-6 items-center border border-slate-100">
                      <ActivityIndicator size="small" color="#ea580c" />
                      <Text className="text-slate-500 mt-2" style={{ fontSize: 13, fontWeight: '600' }}>
                        Cargando alumnos...
                      </Text>
                    </View>
                  ) : selectedGroup.students?.length === 0 ? (
                    <View className="bg-white rounded-2xl p-6 items-center border border-slate-100">
                      <User size={24} color="#94A3B8" strokeWidth={2} />
                      <Text className="text-slate-500 mt-2" style={{ fontSize: 13, fontWeight: '600' }}>
                        No hay alumnos en este grupo
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: 6 }}>
                      {(selectedGroup.students || [])
                        .slice()
                        .sort((a, b) => {
                          const la = (a.last_name || '').toLowerCase();
                          const lb = (b.last_name || '').toLowerCase();
                          if (la !== lb) return la.localeCompare(lb);
                          return (a.first_name || '').toLowerCase().localeCompare((b.first_name || '').toLowerCase());
                        })
                        .map((stu) => {
                          const initials = `${(stu.last_name || '?')[0]}${(stu.first_name || '?')[0]}`.toUpperCase();
                          return (
                            <Pressable
                              key={stu._id}
                              onPress={() => handleSelectStudent(stu)}
                              className="flex-row items-center rounded-xl p-3"
                              style={{
                                backgroundColor: '#F8FAFC',
                                borderWidth: 1,
                                borderColor: '#E2E8F0',
                              }}
                              accessibilityRole="button"
                              accessibilityLabel={`Seleccionar alumno ${stu.fullName || `${stu.last_name} ${stu.first_name}`}`}
                            >
                              <View
                                className="items-center justify-center rounded-full"
                                style={{
                                  width: 36,
                                  height: 36,
                                  backgroundColor: '#FFF7ED',
                                }}
                              >
                                <Text
                                  className="text-orange-700"
                                  style={{ fontSize: 13, fontWeight: '700' }}
                                >
                                  {initials}
                                </Text>
                              </View>
                              <View className="ml-3 flex-1">
                                <Text
                                  className="text-slate-900"
                                  style={{ fontSize: 14, fontWeight: '600' }}
                                  numberOfLines={1}
                                >
                                  {stu.fullName || `${stu.last_name}, ${stu.first_name}`}
                                </Text>
                                {stu.controlNumber ? (
                                  <Text className="text-slate-400" style={{ fontSize: 11 }}>
                                    {`No. Control: ${stu.controlNumber}`}
                                  </Text>
                                ) : null}
                              </View>
                              <ChevronRight size={16} color="#94A3B8" strokeWidth={2} />
                            </Pressable>
                          );
                        })}
                    </View>
                  )}
                </>
              )}

              {/* ===========================================================
                  FORMULARIO: Datos del retiro
                  =========================================================== */}
              {showForm && (
                <>
                  {/* Botón volver (modo selección) */}
                  {!isDirectMode && selectedGroup && selectedStudent && (
                    <Pressable
                      onPress={handleBackToStudents}
                      className="flex-row items-center self-start mb-3"
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Volver a seleccionar alumno"
                    >
                      <Text
                        className="text-sky-600"
                        style={{ fontSize: 12, fontWeight: '600' }}
                      >
                        {'← Cambiar alumno'}
                      </Text>
                    </Pressable>
                  )}

                  {/* Student chip */}
                  <View
                    className="flex-row items-center rounded-xl p-3 mb-5"
                    style={{
                      backgroundColor: '#FFF7ED',
                      borderWidth: 1,
                      borderColor: '#FED7AA',
                    }}
                  >
                    <View
                      className="items-center justify-center rounded-full"
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: '#FFEDD5',
                      }}
                    >
                      <User size={18} color="#ea580c" strokeWidth={2.25} />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text
                        className="text-slate-900"
                        style={{ fontSize: 14, fontWeight: '700' }}
                        numberOfLines={1}
                      >
                        {isDirectMode
                          ? `${student.last_name || ''}, ${student.first_name || ''}`
                          : `${selectedStudent.last_name || ''}, ${selectedStudent.first_name || ''}`
                        }
                      </Text>
                      <Text className="text-orange-600" style={{ fontSize: 11, fontWeight: '600' }}>
                        {isDirectMode
                          ? student.groupName || ''
                          : selectedGroup.label
                        }
                      </Text>
                    </View>
                  </View>

                  {/* Nombre de quien retira */}
                  <SectionLabel mt={0}>Nombre de quien retira</SectionLabel>
                  <TextInput
                    value={guardianName}
                    onChangeText={setGuardianName}
                    placeholder="Nombre completo"
                    placeholderTextColor="#94A3B8"
                    className="rounded-lg text-slate-900"
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 13,
                      marginBottom: 16,
                    }}
                    accessibilityLabel="Nombre de quien retira al alumno"
                  />

                  {/* Parentesco */}
                  <SectionLabel mt={0}>Parentesco</SectionLabel>
                  <View className="flex-row flex-wrap" style={{ gap: 8, marginBottom: 16 }}>
                    {RELATIONSHIP_OPTIONS.map((opt) => {
                      const isSelected = relationship === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => handleSelectRelationship(opt.value)}
                          className="rounded-full px-4 py-2"
                          style={{
                            backgroundColor: isSelected ? '#ea580c' : '#F8FAFC',
                            borderWidth: 1.5,
                            borderColor: isSelected ? '#ea580c' : '#E2E8F0',
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Parentesco: ${opt.label}`}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '700',
                              color: isSelected ? '#FFFFFF' : '#334155',
                            }}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Motivo */}
                  <SectionLabel mt={0}>Motivo</SectionLabel>
                  <View className="flex-row flex-wrap" style={{ gap: 8, marginBottom: 16 }}>
                    {REASON_OPTIONS.map((opt) => {
                      const isSelected = reason === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => handleSelectReason(opt.value)}
                          className="rounded-full px-4 py-2"
                          style={{
                            backgroundColor: isSelected ? '#ea580c' : '#F8FAFC',
                            borderWidth: 1.5,
                            borderColor: isSelected ? '#ea580c' : '#E2E8F0',
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Motivo: ${opt.label}`}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '700',
                              color: isSelected ? '#FFFFFF' : '#334155',
                            }}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Observaciones */}
                  <View className="flex-row items-center justify-between mb-2">
                    <Text
                      className="text-slate-500"
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      Observaciones (opcional)
                    </Text>
                    <Text
                      className="text-slate-400"
                      style={{ fontSize: 10, fontWeight: '600' }}
                    >
                      {`${reasonDetail.length} / 500`}
                    </Text>
                  </View>
                  <TextInput
                    value={reasonDetail}
                    onChangeText={setReasonDetail}
                    placeholder="Detalles adicionales..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                    textAlignVertical="top"
                    className="rounded-lg text-slate-900"
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      minHeight: 80,
                      fontSize: 13,
                    }}
                    accessibilityLabel="Observaciones del pase de salida"
                  />
                </>
              )}
            </ScrollView>

            {/* ============================================================
                STICKY FOOTER: Cancelar + Registrar
                ============================================================ */}
            {showForm && (
              <View
                className="flex-row px-4 py-3 border-t border-slate-100"
                style={{ gap: 8 }}
              >
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar"
                  className="flex-1 items-center justify-center rounded-xl"
                  style={{
                    borderWidth: 1.5,
                    borderColor: '#E2E8F0',
                    paddingVertical: 12,
                  }}
                >
                  <Text
                    className="text-slate-700"
                    style={{ fontSize: 13, fontWeight: '700' }}
                  >
                    Cancelar
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleEmit}
                  disabled={!isFormValid || isSubmitting}
                  accessibilityRole="button"
                  accessibilityLabel="Registrar pase de salida"
                  className="flex-1 flex-row items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: isFormValid && !isSubmitting ? '#ea580c' : '#CBD5E1',
                    paddingVertical: 12,
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <LogOut size={16} color="#ffffff" strokeWidth={2.25} />
                      <Text
                        className="text-white ml-2"
                        style={{ fontSize: 13, fontWeight: '700' }}
                      >
                        Registrar Pase
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default GenerateExitPassModal;
