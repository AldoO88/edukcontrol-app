// =====================================================================
// app/(teacher)/_components/CreateAnnouncementModal.jsx
// ---------------------------------------------------------------------
// Modal bottom-sheet "Crear Nuevo Aviso" del MAESTRO.
//
// Slide-up modal que reúne el formulario de creación de un aviso
// dirigido a tutores o alumnos individuales.
//
// FLUJOS:
//   1. Modo normal (student === null): targetType selector con
//      "A Grupo" / "A Alumno". En "A Grupo", chips multi-select.
//      En "A Alumno", chips de grupos → vista de alumnos.
//   2. Modo directo (student !== null): alumno pre-seleccionado,
//      targetType forzado a "student", sin selector de destinatarios.
//
// DATA SOURCE: los grupos vienen pre-cargados con students[] desde
// GET /api/teacher-subjects/me/groups (vía getMyGroups del service).
//
// CONTRATO (POST /api/announcements):
//   {
//     title, message, priority: "informative"|"urgent",
//     targetType: "group"|"student",
//     targetGroups?: string[],
//     targetStudents?: string[],
//   }
//
// Props:
//   - visible:   boolean — controla la visibilidad del Modal.
//   - onClose:    fn() — callback al cerrar.
//   - groups:     array — grupos asignados al maestro (con students[]).
//   - student:    Student | null — alumno pre-seleccionado (modo directo).
//   - onPublished: fn() — callback después de publicar exitosamente.
// =====================================================================

// React hooks.
import React, { useState, useCallback, useEffect, useMemo } from 'react';

// Primitivas RN.
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  FlatList,
} from 'react-native';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Iconos Lucide.
import { X, Check, Send, User } from 'lucide-react-native';

// Helpers: getInitials para avatar fallback.
import { getInitials } from '../../../src/utils/announcementHelpers';

// Servicio: crea el aviso.
import { createTeacherAnnouncement } from '../../../src/services/teacherService';

// ---------------------------------------------------------------------
// CONSTANTES
// ---------------------------------------------------------------------
const TARGET_TYPES = {
  GROUP: 'group',
  STUDENT: 'student',
};

const TARGET_TYPE_OPTIONS = [
  { value: TARGET_TYPES.GROUP, label: 'A Grupo' },
  { value: TARGET_TYPES.STUDENT, label: 'A Alumno' },
];

const PRIORITY_OPTIONS = [
  { value: 'informative', label: 'Informativo' },
  { value: 'urgent', label: 'Urgente' },
];

// Colores para avatares de fallback (por índice de alumno).
const AVATAR_COLORS = [
  '#0284C7', '#7C3AED', '#D97706', '#059669',
  '#DC2626', '#2563EB', '#9333EA', '#CA8A04',
];

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function CreateAnnouncementModal({
  visible,
  onClose,
  groups = [],
  student = null,
  onPublished = null,
}) {
  const insets = useSafeAreaInsets();

  // -------------------------------------------------------------------
  // MODO DIRECTO: student pre-seleccionado desde el directorio
  // -------------------------------------------------------------------
  const isDirectMode = !!student;

  // -------------------------------------------------------------------
  // ESTADO LOCAL DEL FORMULARIO
  // -------------------------------------------------------------------
  const [targetType, setTargetType] = useState(
    isDirectMode ? TARGET_TYPES.STUDENT : TARGET_TYPES.GROUP,
  );
  const [groupIds, setGroupIds] = useState([]);
  const [studentIds, setStudentIds] = useState(
    isDirectMode && student ? [student._id || student.id] : [],
  );
  const [priority, setPriority] = useState('informative');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isMessageFocused, setIsMessageFocused] = useState(false);

  // -------------------------------------------------------------------
  // ESTADO DE VISTA: formulario vs lista de alumnos
  // -------------------------------------------------------------------
  // studentModalGroupId: id del grupo cuyos alumnos se muestran.
  //   null = vista de formulario; no-null = vista de selección de alumnos.
  const [studentModalGroupId, setStudentModalGroupId] = useState(null);

  // Grupo actualmente mostrado en la vista de alumnos (derivado del id).
  const studentModalGroup = useMemo(
    () => groups.find((g) => g.id === studentModalGroupId) || null,
    [groups, studentModalGroupId],
  );

  // -------------------------------------------------------------------
  // TOGGLE DE GRUPO (multi-select)
  // -------------------------------------------------------------------
  const toggleGroup = useCallback((groupId) => {
    setGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  }, []);

  // -------------------------------------------------------------------
  // TOGGLE DE ALUMNO (multi-select)
  // -------------------------------------------------------------------
  const toggleStudent = useCallback((studentId) => {
    setStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  }, []);

  // -------------------------------------------------------------------
  // RESET DEL FORMULARIO
  // -------------------------------------------------------------------
  const resetForm = useCallback(() => {
    if (isDirectMode && student) {
      // En modo directo: mantener targetType y studentIds
      setTargetType(TARGET_TYPES.STUDENT);
      setStudentIds([student._id || student.id]);
    } else {
      setTargetType(TARGET_TYPES.GROUP);
      setGroupIds([]);
      setStudentIds([]);
    }
    setPriority('informative');
    setTitle('');
    setMessage('');
    setIsSubmitting(false);
    setStudentModalGroupId(null);
  }, [isDirectMode, student]);

  useEffect(() => {
    if (visible) {
      if (isDirectMode && student) {
        // En modo directo: inicializar con el alumno pre-seleccionado
        setTargetType(TARGET_TYPES.STUDENT);
        setStudentIds([student._id || student.id]);
      } else {
        resetForm();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // -------------------------------------------------------------------
  // VALIDACIÓN
  // -------------------------------------------------------------------
  const hasRecipients =
    targetType === TARGET_TYPES.GROUP
      ? groupIds.length > 0
      : studentIds.length > 0;

  const isFormValid =
    hasRecipients &&
    title.trim().length > 0 &&
    message.trim().length > 0;

  // -------------------------------------------------------------------
  // SUBMIT
  // -------------------------------------------------------------------
  const handlePublish = useCallback(async () => {
    if (isSubmitting) return;

    // Validación de campos requeridos con alerts específicos.
    if (!title.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el título del aviso.', [{ text: 'Entendido' }]);
      return;
    }
    if (!message.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el mensaje del aviso.', [{ text: 'Entendido' }]);
      return;
    }
    if (targetType === TARGET_TYPES.GROUP && groupIds.length === 0) {
      Alert.alert('Campo requerido', 'Selecciona al menos un grupo destino.', [{ text: 'Entendido' }]);
      return;
    }
    if (targetType === TARGET_TYPES.STUDENT && studentIds.length === 0) {
      Alert.alert('Campo requerido', 'Selecciona al menos un alumno destino.', [{ text: 'Entendido' }]);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        priority,
        targetType,
        ...(targetType === TARGET_TYPES.GROUP
          ? { targetGroups: groupIds }
          : { targetStudents: studentIds }),
      };
      const result = await createTeacherAnnouncement(payload);

      if (!result.success) {
        Alert.alert('No se pudo publicar el aviso', result.message);
        return;
      }

      onPublished?.(result.data);
      onClose();
    } catch (err) {
      console.error('[CreateAnnouncementModal] error inesperado:', err);
      Alert.alert('Error inesperado', 'Ocurrió un error al publicar el aviso.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, isSubmitting, targetType, groupIds, studentIds, priority, title, message, onPublished, onClose]);

  const handleSaveDraft = useCallback(() => {
    Alert.alert(
      'Guardar como borrador',
      'Esta función estará disponible cuando el backend soporte borradores de avisos.',
    );
  }, []);

  // -------------------------------------------------------------------
  // AVATAR: foto circular o fallback a iniciales
  // -------------------------------------------------------------------
  const renderAvatar = (studentData, size = 40) => {
    const bgColor = AVATAR_COLORS[studentData._id?.charCodeAt(0) % AVATAR_COLORS.length || 0];
    const studentName = studentData.fullName || studentData.name;

    if (studentData.photoUrl) {
      return (
        <Image
          source={{ uri: studentData.photoUrl }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
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
          {getInitials(studentName)}
        </Text>
      </View>
    );
  };

  // -------------------------------------------------------------------
  // ESTÁ EN MODO SELECCIÓN DE ALUMNOS
  // -------------------------------------------------------------------
  const isStudentPickerOpen = studentModalGroup !== null;

  // -------------------------------------------------------------------
  // HEADER: título + botón cerrar/volver
  // -------------------------------------------------------------------
  const renderHeader = () => {
    if (isStudentPickerOpen) {
      return (
        <View className="flex-row items-center justify-between mb-5">
          <Pressable
            onPress={() => setStudentModalGroupId(null)}
            disabled={studentIds.length === 0}
            className="flex-row items-center"
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Confirmar selección"
            style={{ opacity: studentIds.length === 0 ? 0.4 : 1 }}
          >
            <Check size={22} color="#02C79E" strokeWidth={2.5} />
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#02C79E', marginLeft: 4 }}>
              Listo
            </Text>
          </Pressable>
          <Pressable
            onPress={() => { resetForm(); setStudentModalGroupId(null); }}
            className="items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9' }}
            accessibilityRole="button"
            accessibilityLabel="Cerrar y limpiar selección"
            hitSlop={8}
          >
            <X size={18} color="#64748B" strokeWidth={2.25} />
          </Pressable>
        </View>
      );
    }

    return (
      <View className="flex-row items-center justify-between mb-5">
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A' }}>
          {isDirectMode ? 'Enviar Aviso' : 'Crear Nuevo Aviso'}
        </Text>
        <Pressable
          onPress={onClose}
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
  };

  // -------------------------------------------------------------------
  // CONTENIDO: formulario principal
  // -------------------------------------------------------------------
  const renderFormContent = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* A) TARGET TYPE SELECTOR — solo en modo normal */}
      {!isDirectMode && (
        <>
          <Text
            className="uppercase mb-2"
            style={{ fontSize: 12, fontWeight: '700', color: '#275972', letterSpacing: 0.5 }}
          >
            Tipo de envío
          </Text>
          <View
            className="flex-row"
            style={{ backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4 }}
          >
            {TARGET_TYPE_OPTIONS.map((option) => {
              const isActive = targetType === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setTargetType(option.value);
                    setGroupIds([]);
                    setStudentIds([]);
                    setStudentModalGroupId(null);
                  }}
                  className="flex-1 items-center justify-center py-2.5"
                  style={{
                    backgroundColor: isActive ? '#275972' : 'transparent',
                    borderRadius: 8,
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={option.label}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isActive ? '700' : '400',
                      color: isActive ? '#ffffff' : '#64748B',
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {/* B) DESTINATARIOS — en modo directo mostrar card del alumno */}
      {isDirectMode ? (
        <>
          <Text
            className="uppercase mt-5 mb-2"
            style={{ fontSize: 12, fontWeight: '700', color: '#275972', letterSpacing: 0.5 }}
          >
            Alumno destino
          </Text>
          <View
            className="flex-row items-center px-4 py-3 rounded-xl"
            style={{ backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD' }}
          >
            {/* Avatar */}
            {renderAvatar(student, 40)}
            {/* Nombre + control number */}
            <View className="flex-1 ml-3">
              <Text
                style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}
                numberOfLines={1}
              >
                {student.fullName || student.name}
              </Text>
              {student.controlNumber && (
                <Text
                  style={{ fontSize: 12, fontWeight: '400', color: '#64748B', marginTop: 2 }}
                >
                  No. Control: {student.controlNumber}
                </Text>
              )}
            </View>
          </View>
        </>
      ) : (
        <>
          <Text
            className="uppercase mt-5 mb-2"
            style={{ fontSize: 12, fontWeight: '700', color: '#275972', letterSpacing: 0.5 }}
          >
            {targetType === TARGET_TYPES.GROUP ? 'Grupos destino' : 'Seleccionar alumnos'}
          </Text>
          {renderRecipientSection()}
        </>
      )}

      {/* C) PRIORIDAD */}
      <Text
        className="uppercase mt-5 mb-2"
        style={{ fontSize: 12, fontWeight: '700', color: '#275972', letterSpacing: 0.5 }}
      >
        Nivel de Prioridad
      </Text>
      <View
        className="flex-row"
        style={{ backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4 }}
      >
        {PRIORITY_OPTIONS.map((option) => {
          const isActive = priority === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setPriority(option.value)}
              className="flex-1 items-center justify-center py-2.5"
              style={{
                  backgroundColor: isActive
                    ? option.value === 'urgent' ? '#FDF2E6' : '#FEF9E7'
                    : 'transparent',
                borderRadius: 8,
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={option.label}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: isActive ? '700' : '400',
                  color: isActive
                    ? option.value === 'urgent' ? '#C76F02' : '#C79902'
                    : '#64748B',
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* D) TÍTULO */}
      <Text
        className="uppercase mt-5 mb-2"
        style={{ fontSize: 12, fontWeight: '700', color: '#275972', letterSpacing: 0.5 }}
      >
        Título del aviso
      </Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Ej. Material para la siguiente clase de Ofimática"
        placeholderTextColor="#94A3B8"
        onFocus={() => setIsTitleFocused(true)}
        onBlur={() => setIsTitleFocused(false)}
        style={{
          backgroundColor: '#F8FAFC',
          borderWidth: 1.5,
          borderColor: isTitleFocused ? '#0284C7' : '#E2E8F0',
          borderRadius: 12,
          padding: 14,
          fontSize: 14,
          color: '#0F172A',
        }}
        maxLength={200}
      />

      {/* E) MENSAJE */}
      <Text
        className="uppercase mt-5 mb-2"
        style={{ fontSize: 12, fontWeight: '700', color: '#275972', letterSpacing: 0.5 }}
      >
        {isDirectMode
          ? 'Mensaje para el alumno / tutor'
          : targetType === TARGET_TYPES.GROUP
            ? 'Mensaje para los tutores'
            : 'Mensaje para el alumno / tutor'}
      </Text>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Escribe los detalles de la tarea, aviso o indicación..."
        placeholderTextColor="#94A3B8"
        multiline
        onFocus={() => setIsMessageFocused(true)}
        onBlur={() => setIsMessageFocused(false)}
        style={{
          backgroundColor: '#F8FAFC',
          borderWidth: 1.5,
          borderColor: isMessageFocused ? '#0284C7' : '#E2E8F0',
          borderRadius: 12,
          padding: 14,
          fontSize: 14,
          height: 110,
          textAlignVertical: 'top',
          color: '#0F172A',
        }}
        maxLength={5000}
      />

      {/* F) BOTONES */}
      <Pressable
        onPress={handlePublish}
        disabled={isSubmitting}
        className="flex-row items-center justify-center"
        style={{
          backgroundColor: isSubmitting ? '#7DD3FC' : '#0284C7',
          height: 52,
          borderRadius: 16,
          marginTop: 20,
        }}
        accessibilityRole="button"
        accessibilityLabel="Publicar aviso"
      >
        <Send
          size={18}
          color="#ffffff"
          strokeWidth={2.25}
          style={{ transform: [{ rotate: '-15deg' }], marginRight: 8 }}
        />
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#ffffff' }}>
          {isSubmitting ? 'Enviando...' : isDirectMode ? 'Enviar Aviso' : 'Publicar Aviso'}
        </Text>
      </Pressable>

      {/* Guardar como borrador — solo en modo normal */}
      {!isDirectMode && (
        <Pressable
          onPress={handleSaveDraft}
          className="items-center py-3"
          style={{ marginTop: 14, marginBottom: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Guardar como borrador"
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748B' }}>
            Guardar como borrador
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );

  // -------------------------------------------------------------------
  // CONTENIDO: vista de selección de alumnos (reemplaza el formulario)
  // -------------------------------------------------------------------
  const renderStudentPickerContent = () => {
    if (!studentModalGroup) return null;

    const students = studentModalGroup.students || [];

    return (
      <View>
        {/* Header de la vista de alumnos. */}
        <View className="items-center px-5 pb-3 border-b border-[#E2E8F0]">
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
            {studentModalGroup.label}
          </Text>
          <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
            {students.length} alumno{students.length !== 1 ? 's' : ''}
            {studentIds.length > 0 && (
              <> — {studentIds.length} seleccionado{studentIds.length !== 1 ? 's' : ''}</>
            )}
          </Text>
        </View>

        {/* Lista de alumnos. */}
        {students.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <User size={40} color="#CBD5E1" strokeWidth={1.5} />
            <Text className="text-[14px] text-[#64748B] mt-3 text-center">
              No hay alumnos registrados en este grupo.
            </Text>
          </View>
        ) : (
          <FlatList
            data={students}
            keyExtractor={(s) => s._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
            renderItem={({ item: student }) => {
              const isSelected = studentIds.includes(student._id);
              return (
                <Pressable
                  onPress={() => toggleStudent(student._id)}
                  className="flex-row items-center px-5 py-3"
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Alumno ${student.fullName || student.name}`}
                >
                  {/* Avatar: foto o iniciales. */}
                  {renderAvatar(student, 42)}

                  {/* Nombre. */}
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
                    {student.fullName || student.name}
                  </Text>

                  {/* Check de selección. */}
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: isSelected ? '#0284C7' : '#CBD5E1',
                      backgroundColor: isSelected ? '#0284C7' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && (
                      <Check size={14} color="#ffffff" strokeWidth={3} />
                    )}
                  </View>
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 20 }} />
            )}
          />
        )}
      </View>
    );
  };

  // -------------------------------------------------------------------
  // SECCIÓN DE DESTINATARIOS (solo se muestra en el formulario)
  // -------------------------------------------------------------------
  const renderRecipientSection = () => {
    if (targetType === TARGET_TYPES.GROUP) {
      return (
        <View className="flex-row flex-wrap gap-2">
          {groups.map((group) => {
            const isSelected = groupIds.includes(group.id);
            return (
              <Pressable
                key={group.id}
                onPress={() => toggleGroup(group.id)}
                className="flex-row items-center"
                style={{
                  backgroundColor: isSelected ? '#275972' : '#F1F5F9',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Grupo ${group.label}`}
              >
                {isSelected && (
                  <Check size={16} color="#ffffff" strokeWidth={2.75} style={{ marginRight: 6 }} />
                )}
                <Text
                  style={{
                    color: isSelected ? '#ffffff' : '#334155',
                    fontWeight: isSelected ? '600' : '500',
                    fontSize: 13,
                  }}
                >
                  {group.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    // Flujo "A Alumno": chips de grupos. Tap cambia a vista de alumnos.
    return (
      <View>
        <View className="flex-row flex-wrap gap-2">
          {groups.map((group) => {
            const students = group.students || [];
            const selectedCount = students.filter((s) => studentIds.includes(s._id)).length;
            const hasSelected = selectedCount > 0;

            return (
              <Pressable
                key={group.id}
                onPress={() => setStudentModalGroupId(group.id)}
                className="flex-row items-center"
                style={{
                  backgroundColor: hasSelected ? '#E6F9F5' : '#F1F5F9',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
                accessibilityRole="button"
                accessibilityLabel={`Grupo ${group.label}, ${students.length} alumnos`}
              >
                {hasSelected && (
                  <Check size={16} color="#02C79E" strokeWidth={2.75} style={{ marginRight: 6 }} />
                )}
                <Text
                  style={{
                    color: hasSelected ? '#02C79E' : '#334155',
                    fontWeight: hasSelected ? '600' : '500',
                    fontSize: 13,
                  }}
                >
                  {group.label}
                </Text>
                {hasSelected && (
                  <Text style={{ color: '#C76F02', fontSize: 12, marginLeft: 6, fontWeight: '500' }}>
                    ({selectedCount})
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Resumen global de selección. */}
        {studentIds.length > 0 && (
          <View className="flex-row items-center mt-3 px-1">
            <User size={14} color="#C76F02" strokeWidth={2} />
            <Text style={{ fontSize: 12, color: '#C76F02', fontWeight: '600', marginLeft: 4 }}>
              {studentIds.length} alumno{studentIds.length > 1 ? 's' : ''} seleccionado{studentIds.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // -------------------------------------------------------------------
  // RENDER PRINCIPAL — UN SOLO MODAL con view switching
  // -------------------------------------------------------------------
  return (
    <Modal
      visible={visible}
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
          accessibilityLabel={isStudentPickerOpen ? 'Volver al formulario' : 'Cerrar creación de aviso'}
        >
          <Pressable
            onPress={() => {}}
            className="bg-white w-full px-5"
            style={{
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingTop: 12,
              paddingBottom: insets.bottom + 8,
              // En ambos modos: bottom-sheet con maxHeight.
              // No flex:1 para no cubrir el header de la app.
              maxHeight: isStudentPickerOpen ? '88%' : '90%',
            }}
          >
            {/* Handle. */}
            <View style={{
              width: 40, height: 4, backgroundColor: '#02C79E',
              borderRadius: 2, marginBottom: 16, alignSelf: 'center',
            }} />

            {/* Header (cambia según la vista). */}
            {renderHeader()}

            {/* Contenido: formulario o vista de alumnos. */}
            {isStudentPickerOpen ? renderStudentPickerContent() : renderFormContent()}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
