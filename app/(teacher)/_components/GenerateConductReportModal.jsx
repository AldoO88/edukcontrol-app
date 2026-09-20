// =====================================================================
// app/(teacher)/_components/GenerateConductReportModal.jsx
// ---------------------------------------------------------------------
// Bottom sheet modal para generar un Reporte de Conducta.
//
// FLUJOS:
//   1) Si se pasa `student` como prop: form directo con alumno pre-seleccionado.
//   2) Si `student` es null: selector de Grupo → Alumno → Form.
//
// Props:
//   - isVisible:            boolean — controla la visibilidad del Modal.
//   - onClose:              fn() — callback al cerrar.
//   - student:              Student | null — alumno pre-seleccionado (opcional).
//   - onCreated:            fn() — callback después de crear exitosamente.
//   - fetchGroupsFn:        fn() => Promise<{success, data}> — carga de grupos.
//   - createConductLogFn:   fn(payload) => Promise<{success, data}> — creación.
//   - fetchStudentsForGroup: fn(groupId) => Promise<students[]> — carga lazy.
// =====================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';

import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Shield,
  X,
  Check,
  TrendingUp,
  XCircle,
  User,
  Minus,
  Plus,
} from 'lucide-react-native';

import { getInitials } from '../../../src/utils/announcementHelpers';

// ---------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------
const EVENT_TYPES = [
  { value: 'demerit', label: 'Demérito', icon: XCircle, color: '#E11D48', bg: '#FEE2E2' },
  { value: 'merit', label: 'Mérito', icon: TrendingUp, color: '#047857', bg: '#D1FAE5' },
];

const SEVERITY_OPTIONS = [
  { value: 'minor', label: 'Menor' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'severe', label: 'Grave' },
];

const AVATAR_COLORS = [
  '#0284C7', '#7C3AED', '#D97706', '#059669',
  '#DC2626', '#2563EB', '#9333EA', '#CA8A04',
];

const POINTS_RANGES = {
  minor: { min: 1, max: 5, default: 5 },
  moderate: { min: 5, max: 9, default: 9 },
  severe: { min: 10, max: 18, default: 18 },
  merit: { min: 1, max: 5, default: 5 },
};

// ---------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------
export default function GenerateConductReportModal({
  isVisible,
  onClose,
  student = null,
  onCreated,
  fetchGroupsFn,
  createConductLogFn,
  fetchStudentsForGroup,
  fetchConfigFn,
}) {
  const insets = useSafeAreaInsets();

  const isDirectMode = !!student;

  // -------------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------------
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(isDirectMode ? student : null);
  const [eventType, setEventType] = useState('demerit');
  const [severity, setSeverity] = useState('minor');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Groups state
  const [groups, setGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Conduct config state
  const [conductConfig, setConductConfig] = useState(null);

  // Editable points state
  const [customPoints, setCustomPoints] = useState(null);

  // Student picker view
  const [studentModalGroupId, setStudentModalGroupId] = useState(null);
  const studentModalGroup = useMemo(
    () => groups.find((g) => (g._id || g.id) === studentModalGroupId) || null,
    [groups, studentModalGroupId],
  );

  // -------------------------------------------------------------------
  // POINTS RANGE & CURRENT POINTS
  // -------------------------------------------------------------------
  const currentRange = useMemo(() => {
    const key = eventType === 'merit' ? 'merit' : severity;
    return POINTS_RANGES[key] || POINTS_RANGES.minor;
  }, [eventType, severity]);

  const currentPoints = useMemo(() => {
    if (customPoints !== null) return customPoints;
    return currentRange.default;
  }, [customPoints, currentRange]);

  const isAtMin = currentPoints <= currentRange.min;
  const isAtMax = currentPoints >= currentRange.max;

  // -------------------------------------------------------------------
  // HANDLERS: Points editing
  // -------------------------------------------------------------------
  const handleDecrementPoints = useCallback(() => {
    setCustomPoints((prev) => {
      const current = prev !== null ? prev : currentRange.default;
      const next = Math.max(currentRange.min, current - 1);
      return next;
    });
  }, [currentRange]);

  const handleIncrementPoints = useCallback(() => {
    setCustomPoints((prev) => {
      const current = prev !== null ? prev : currentRange.default;
      const next = Math.min(currentRange.max, current + 1);
      return next;
    });
  }, [currentRange]);

  // -------------------------------------------------------------------
  // FETCH GROUPS on open
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!isVisible || isDirectMode) return;
    let cancelled = false;
    const load = async () => {
      setIsLoadingGroups(true);
      try {
        const result = await fetchGroupsFn();
        if (cancelled) return;
        if (result.success) {
          setGroups(result.data?.groups || result.data || []);
        }
      } catch (err) {
        console.error('[GenerateConductReportModal] error loading groups:', err);
      } finally {
        if (!cancelled) setIsLoadingGroups(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isVisible, isDirectMode, fetchGroupsFn]);

  // -------------------------------------------------------------------
  // FETCH CONDUCT CONFIG on open
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!isVisible || !fetchConfigFn) return;
    let cancelled = false;
    const load = async () => {
      try {
        const result = await fetchConfigFn();
        if (cancelled) return;
        if (result.success && result.data) {
          setConductConfig(result.data);
        }
      } catch (err) {
        console.error('[GenerateConductReportModal] error loading conduct config:', err);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isVisible, fetchConfigFn]);

  // -------------------------------------------------------------------
  // RESET on open/close
  // -------------------------------------------------------------------
  useEffect(() => {
    if (isVisible) {
      if (isDirectMode && student) {
        setSelectedStudent(student);
      } else {
        setSelectedGroup(null);
        setSelectedStudent(null);
        setStudentModalGroupId(null);
      }
      setEventType('demerit');
      setSeverity('minor');
      setDescription('');
      setIsSubmitting(false);
      setConductConfig(null);
      setCustomPoints(null);
    }
  }, [isVisible, isDirectMode, student]);

  // -------------------------------------------------------------------
  // RESET customPoints when severity or eventType changes
  // -------------------------------------------------------------------
  useEffect(() => {
    setCustomPoints(null);
  }, [severity, eventType]);

  // -------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------
  const handleSelectGroup = useCallback(async (group) => {
    if (fetchStudentsForGroup && (!group.students || group.students.length === 0)) {
      setIsLoadingStudents(true);
      try {
        const loaded = await fetchStudentsForGroup(group._id || group.id);
        group.students = loaded;
      } catch (err) {
        console.error('[GenerateConductReportModal] error loading students:', err);
      } finally {
        setIsLoadingStudents(false);
      }
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

  const handlePublish = useCallback(async () => {
    if (isSubmitting) return;

    const studentId = selectedStudent?._id || selectedStudent?.id;
    if (!studentId) {
      Alert.alert('Campo requerido', 'Selecciona un alumno.', [{ text: 'Entendido' }]);
      return;
    }
    if (!description.trim()) {
      Alert.alert('Campo requerido', 'Escribe una descripción de la incidencia.', [{ text: 'Entendido' }]);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        student_id: studentId,
        eventType,
        severity,
        description: description.trim(),
        points_impact_override: currentPoints,
      };

      const result = await createConductLogFn(payload);

      if (result.success) {
        Alert.alert('Reporte creado', 'El reporte de conducta se registró correctamente.');
        onCreated?.();
        onClose();
      } else {
        Alert.alert('Error', result.message || 'No se pudo crear el reporte.');
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo crear el reporte.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedStudent, eventType, severity, description, customPoints, currentRange.default, isSubmitting, createConductLogFn, onCreated, onClose]);

  // -------------------------------------------------------------------
  // RENDER HELPERS
  // -------------------------------------------------------------------
  const renderAvatar = (stu, size = 40) => {
    const bgColor = AVATAR_COLORS[stu._id?.charCodeAt(0) % AVATAR_COLORS.length || 0];
    const name = stu.fullName || stu.name || `${stu.last_name || ''} ${stu.first_name || ''}`.trim();

    if (stu.photoUrl) {
      return (
        <Image
          source={{ uri: stu.photoUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      );
    }

    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#ffffff', fontSize: size * 0.38, fontWeight: '700' }}>
          {getInitials(name)}
        </Text>
      </View>
    );
  };

  const isStudentPickerOpen = studentModalGroup !== null;
  const showForm = isDirectMode || !!selectedStudent;

  // -------------------------------------------------------------------
  // HEADER
  // -------------------------------------------------------------------
  const renderHeader = () => {
    if (isStudentPickerOpen) {
      return (
        <View className="flex-row items-center justify-between mb-5">
          <Pressable
            onPress={() => setStudentModalGroupId(null)}
            disabled={selectedStudent === null}
            className="flex-row items-center"
            hitSlop={8}
            accessibilityRole="button"
            style={{ opacity: selectedStudent === null ? 0.4 : 1 }}
          >
            <Check size={22} color="#02C79E" strokeWidth={2.5} />
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#02C79E', marginLeft: 4 }}>
              Listo
            </Text>
          </Pressable>
          <Pressable
            onPress={() => { setStudentModalGroupId(null); }}
            className="items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9' }}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            hitSlop={8}
          >
            <X size={18} color="#64748B" strokeWidth={2.25} />
          </Pressable>
        </View>
      );
    }

    return (
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center flex-1">
          <View
            className="items-center justify-center"
            style={{ backgroundColor: '#FEE2E2', padding: 8, borderRadius: 12 }}
          >
            <Shield size={20} color="#E11D48" strokeWidth={2.25} />
          </View>
          <Text className="ml-3 text-slate-900" style={{ fontSize: 18, fontWeight: '700' }}>
            Nuevo Reporte
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
    );
  };

  // -------------------------------------------------------------------
  // STUDENT PICKER CONTENT
  // -------------------------------------------------------------------
  const renderStudentPickerContent = () => {
    if (!studentModalGroup) return null;
    const students = studentModalGroup.students || [];

    return (
      <View>
        <View className="items-center px-5 pb-3 border-b border-[#E2E8F0]">
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
            {studentModalGroup.label}
          </Text>
          <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
            {students.length} alumno{students.length !== 1 ? 's' : ''}
            {selectedStudent && <> — 1 seleccionado</>}
          </Text>
        </View>

        {students.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6 py-8">
            <User size={40} color="#CBD5E1" strokeWidth={1.5} />
            <Text className="text-[14px] text-[#64748B] mt-3 text-center">
              No hay alumnos registrados en este grupo.
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
            {students
              .slice()
              .sort((a, b) => {
                const la = (a.last_name || '').toLowerCase();
                const lb = (b.last_name || '').toLowerCase();
                if (la !== lb) return la.localeCompare(lb);
                return (a.first_name || '').toLowerCase().localeCompare((b.first_name || '').toLowerCase());
              })
              .map((stu, index) => {
                const isSelected = selectedStudent?._id === stu._id;
                const initials = `${(stu.last_name || '?')[0]}${(stu.first_name || '?')[0]}`.toUpperCase();
                return (
                  <Pressable
                    key={stu._id}
                    onPress={() => handleSelectStudent(stu)}
                    className="flex-row items-center px-5 py-3"
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    {renderAvatar(stu, 42)}
                    <Text
                      style={{
                        flex: 1,
                        marginLeft: 12,
                        fontSize: 15,
                        fontWeight: isSelected ? '600' : '400',
                        color: '#0F172A',
                      }}
                      numberOfLines={1}
                    >
                      {`${initials} ${index + 1}. ${stu.last_name || ''} ${stu.first_name || ''}`}
                    </Text>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isSelected ? '#E11D48' : '#CBD5E1',
                        backgroundColor: isSelected ? '#E11D48' : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
                    </View>
                  </Pressable>
                );
              })}
          </ScrollView>
        )}
      </View>
    );
  };

  // -------------------------------------------------------------------
  // FORM CONTENT
  // -------------------------------------------------------------------
  const renderFormContent = () => {
    const resolvedStudent = isDirectMode ? student : selectedStudent;

    return (
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Student card */}
        {!isDirectMode && selectedStudent && (
          <>
            <Text className="uppercase mb-2" style={{ fontSize: 12, fontWeight: '700', color: '#275972', letterSpacing: 0.5 }}>
              Alumno seleccionado
            </Text>
            <View className="flex-row items-center px-4 py-3 rounded-xl mb-1" style={{ backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECDD3' }}>
              {renderAvatar(selectedStudent, 40)}
              <View className="flex-1 ml-3">
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }} numberOfLines={1}>
                  {selectedStudent.fullName || `${selectedStudent.last_name || ''} ${selectedStudent.first_name || ''}`.trim()}
                </Text>
              </View>
              <Pressable onPress={handleBackToGroups} hitSlop={8}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#E11D48' }}>Cambiar</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Event type */}
        <Text className="uppercase mt-4 mb-2" style={{ fontSize: 12, fontWeight: '700', color: '#275972', letterSpacing: 0.5 }}>
          Tipo de reporte
        </Text>
        <View className="flex-row" style={{ backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4 }}>
          {EVENT_TYPES.map((opt) => {
            const isActive = eventType === opt.value;
            const EventIcon = opt.icon;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setEventType(opt.value)}
                className="flex-1 flex-row items-center justify-center py-2.5"
                style={{ backgroundColor: isActive ? opt.color : 'transparent', borderRadius: 8 }}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <EventIcon size={16} color={isActive ? '#ffffff' : '#64748B'} strokeWidth={2} />
                <Text style={{ fontSize: 14, fontWeight: isActive ? '700' : '400', color: isActive ? '#ffffff' : '#64748B', marginLeft: 6 }}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Severity (only for demerit) */}
        {eventType === 'demerit' && (
          <>
            <Text className="uppercase mt-4 mb-2" style={{ fontSize: 12, fontWeight: '700', color: '#275972', letterSpacing: 0.5 }}>
              Gravedad
            </Text>
            <View className="flex-row" style={{ backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4 }}>
              {SEVERITY_OPTIONS.map((opt) => {
                const isActive = severity === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setSeverity(opt.value)}
                    className="flex-1 items-center justify-center py-2.5"
                    style={{ backgroundColor: isActive ? '#E11D48' : 'transparent', borderRadius: 8 }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: isActive ? '700' : '400', color: isActive ? '#ffffff' : '#64748B' }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* Points editor */}
        <View className="mt-4 mb-2">
          <Text className="uppercase mb-2" style={{ fontSize: 12, fontWeight: '700', color: '#275972', letterSpacing: 0.5 }}>
            Puntos a asignar
          </Text>
          <View
            className="flex-row items-center justify-between px-4 py-3 rounded-xl"
            style={{
              backgroundColor: eventType === 'demerit' ? '#FEF2F2' : '#ECFDF5',
              borderWidth: 1,
              borderColor: eventType === 'demerit' ? '#FECDD3' : '#A7F3D0',
            }}
          >
            {/* Decrement button */}
            <Pressable
              onPress={handleDecrementPoints}
              disabled={isAtMin}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isAtMin ? '#E2E8F0' : (eventType === 'demerit' ? '#FEE2E2' : '#D1FAE5'),
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isAtMin ? 0.5 : 1,
              }}
              accessibilityRole="button"
              accessibilityLabel="Reducir puntos"
            >
              <Minus size={18} color={isAtMin ? '#94A3B8' : (eventType === 'demerit' ? '#E11D48' : '#047857')} strokeWidth={2.5} />
            </Pressable>

            {/* Points value */}
            <View className="items-center mx-4">
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '800',
                  color: eventType === 'demerit' ? '#E11D48' : '#047857',
                }}
              >
                {eventType === 'demerit' ? '-' : '+'}{currentPoints}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '500',
                  color: '#64748B',
                  marginTop: 2,
                }}
              >
                {currentRange.min}-{currentRange.max} permitidos
              </Text>
            </View>

            {/* Increment button */}
            <Pressable
              onPress={handleIncrementPoints}
              disabled={isAtMax}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isAtMax ? '#E2E8F0' : (eventType === 'demerit' ? '#FEE2E2' : '#D1FAE5'),
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isAtMax ? 0.5 : 1,
              }}
              accessibilityRole="button"
              accessibilityLabel="Aumentar puntos"
            >
              <Plus size={18} color={isAtMax ? '#94A3B8' : (eventType === 'demerit' ? '#E11D48' : '#047857')} strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* Impact description */}
          <Text
            className="text-center mt-2"
            style={{
              fontSize: 12,
              fontWeight: '500',
              color: eventType === 'demerit' ? '#9F1239' : '#065F46',
            }}
          >
            {eventType === 'demerit'
              ? `Se restarán ${currentPoints} punto${currentPoints !== 1 ? 's' : ''} del balance del alumno`
              : `Se sumarán ${currentPoints} punto${currentPoints !== 1 ? 's' : ''} al balance del alumno`
            }
          </Text>
        </View>

        {/* Description */}
        <Text className="uppercase mt-4 mb-2" style={{ fontSize: 12, fontWeight: '700', color: '#275972', letterSpacing: 0.5 }}>
          Descripción
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe la incidencia..."
          placeholderTextColor="#94A3B8"
          multiline
          style={{
            backgroundColor: '#F8FAFC',
            borderWidth: 1.5,
            borderColor: '#E2E8F0',
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            height: 110,
            textAlignVertical: 'top',
            color: '#0F172A',
          }}
          maxLength={5000}
        />

        {/* Submit */}
        <Pressable
          onPress={handlePublish}
          disabled={isSubmitting}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: isSubmitting ? '#FDA4AF' : '#E11D48',
            height: 52,
            borderRadius: 16,
            marginTop: 20,
          }}
          accessibilityRole="button"
          accessibilityLabel="Crear reporte"
        >
          <Shield size={18} color="#ffffff" strokeWidth={2.25} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#ffffff' }}>
            {isSubmitting ? 'Enviando...' : 'Crear Reporte'}
          </Text>
        </Pressable>

        <View style={{ height: 20 }} />
      </ScrollView>
    );
  };

  // -------------------------------------------------------------------
  // RENDER PRINCIPAL
  // -------------------------------------------------------------------
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={isStudentPickerOpen ? () => setStudentModalGroupId(null) : onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
          }}
          onPress={isStudentPickerOpen ? () => setStudentModalGroupId(null) : onClose}
          accessibilityLabel={isStudentPickerOpen ? 'Volver al formulario' : 'Cerrar'}
        >
          <Pressable
            onPress={() => {}}
            className="bg-white w-full px-5"
            style={{
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingTop: 12,
              paddingBottom: insets.bottom + 8,
              maxHeight: isStudentPickerOpen ? '88%' : '90%',
            }}
          >
            {/* Handle */}
            <View style={{ width: 40, height: 4, backgroundColor: '#E11D48', borderRadius: 2, marginBottom: 16, alignSelf: 'center' }} />

            {renderHeader()}

            {isLoadingGroups && !isDirectMode ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="large" color="#E11D48" />
                <Text className="text-slate-400 text-sm mt-3">Cargando grupos...</Text>
              </View>
            ) : isStudentPickerOpen ? (
              renderStudentPickerContent()
            ) : showForm ? (
              renderFormContent()
            ) : (
              /* GROUP GRID */
              <View>
                <Text className="uppercase mb-3" style={{ fontSize: 12, fontWeight: '700', color: '#275972', letterSpacing: 0.5 }}>
                  Seleccionar grupo
                </Text>
                {groups.length === 0 ? (
                  <View className="py-8 items-center">
                    <Text className="text-slate-400 text-sm">No hay grupos disponibles.</Text>
                  </View>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                    {groups.map((group) => (
                      <Pressable
                        key={group._id || group.id}
                        onPress={async () => {
                          await handleSelectGroup(group);
                          setStudentModalGroupId(group._id || group.id);
                        }}
                        className="flex-row items-center px-4 py-3 mb-2 rounded-xl"
                        style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}
                        accessibilityRole="button"
                        accessibilityLabel={`Grupo ${group.label}`}
                      >
                        <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: '#FEE2E2' }}>
                          <Text style={{ color: '#E11D48', fontSize: 14, fontWeight: '700' }}>
                            {group.label}
                          </Text>
                        </View>
                        <View className="flex-1 ml-3">
                          <Text className="text-sm font-semibold text-slate-900">{group.label}</Text>
                          <Text className="text-xs text-slate-400">
                            {group.students?.length || 0} alumno{(group.students?.length || 0) !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
