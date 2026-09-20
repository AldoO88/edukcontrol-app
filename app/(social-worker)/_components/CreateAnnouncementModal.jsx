// =====================================================================
// app/(social-worker)/_components/CreateAnnouncementModal.jsx
// ---------------------------------------------------------------------
// Modal bottom-sheet "Crear Nuevo Aviso" — adaptado del teacher para
// el trabajador social. Soporta targetType "general", "group" y "student".
//
// FLUJOS:
//   1. Modo normal (student === null): targetType selector dinámico
//      según prop targetTypes. Chips multi-select para group/student.
//   2. Modo directo (student !== null): alumno pre-seleccionado,
//      targetType forzado a "student", sin selector de destinatarios.
//
// DATA SOURCE: los grupos vienen pre-cargados con students[]
// o vacíos (carga lazy vía fetchStudentsForGroup).
//
// Props:
//   - visible:              boolean — controla la visibilidad del Modal.
//   - onClose:              fn() — callback al cerrar.
//   - groups:               array — grupos (con students[] o vacío).
//   - student:              Student | null — alumno pre-seleccionado.
//   - onPublished:          fn() — callback después de publicar.
//   - targetTypes:          string[] — tipos disponibles (default: ['group','student']).
//   - fetchStudentsForGroup: fn(groupId) => Promise<students[]> — carga lazy.
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
import { createAnnouncement } from '../../../src/services/socialWorkerService';

// ---------------------------------------------------------------------
// CONSTANTES
// ---------------------------------------------------------------------
const TARGET_TYPES = {
  GENERAL: 'general',
  GROUP: 'group',
  STUDENT: 'student',
};

const PRIORITY_OPTIONS = [
  { value: 'informative', label: 'Informativo' },
  { value: 'urgent', label: 'Urgente' },
];

const GRADE_FILTERS = [
  { id: '1', label: '1°' },
  { id: '2', label: '2°' },
  { id: '3', label: '3°' },
];

// Grid constants para simetría.
const NUM_COLUMNS = 4;
const CELL_GAP = 16;

// Colores para avatares de fallback (por índice de alumno).
const AVATAR_COLORS = [
  '#0284C7', '#7C3AED', '#D97706', '#059669',
  '#DC2626', '#2563EB', '#9333EA', '#CA8A04',
];

// Nombre legible del taller a partir de la sección (ej: "OFIMÁTICA" → "Ofimática").
const getTallerDisplayName = (section) => {
  if (!section) return '';
  return section.charAt(0) + section.slice(1).toLowerCase();
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function CreateAnnouncementModal({
  visible,
  onClose,
  groups = [],
  student = null,
  onPublished = null,
  targetTypes = ['group', 'student'],
  fetchStudentsForGroup = null,
}) {
  const insets = useSafeAreaInsets();

  // -------------------------------------------------------------------
  // MODO DIRECTO: student pre-seleccionado desde el directorio
  // -------------------------------------------------------------------
  const isDirectMode = !!student;

  // -------------------------------------------------------------------
  // TARGET TYPE OPTIONS — derivado de la prop targetTypes
  // -------------------------------------------------------------------
  const targetTypeOptions = useMemo(() => {
    const opts = [];
    if (targetTypes.includes('general')) opts.push({ value: TARGET_TYPES.GENERAL, label: 'General' });
    if (targetTypes.includes('group'))   opts.push({ value: TARGET_TYPES.GROUP, label: 'A Grupo' });
    if (targetTypes.includes('student')) opts.push({ value: TARGET_TYPES.STUDENT, label: 'A Alumno' });
    return opts;
  }, [targetTypes]);

  // -------------------------------------------------------------------
  // ESTADO LOCAL DEL FORMULARIO
  // -------------------------------------------------------------------
  const [targetType, setTargetType] = useState(
    isDirectMode ? TARGET_TYPES.STUDENT : (targetTypes[0] || TARGET_TYPES.GROUP),
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
  const [selectedGrade, setSelectedGrade] = useState(null);

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
  // GRUPOS FILTRADOS POR GRADO / TALLER
  // -------------------------------------------------------------------
  const filteredGroups = useMemo(() => {
    if (selectedGrade === null) return [];
    const gradeNum = Number(selectedGrade);
    const regularGroups = groups.filter((g) => g.grade === gradeNum && g.type !== 'taller');
    const tallerGroups = groups.filter((g) => g.type === 'taller' && g.grade === gradeNum);
    return [...regularGroups, ...tallerGroups];
  }, [groups, selectedGrade]);

  // -------------------------------------------------------------------
  // GRUPOS SEPARADOS: regulares por grado + talleres (sobre filteredGroups)
  // -------------------------------------------------------------------
  const { regularByGrade, tallerGroups } = useMemo(() => {
    const regular = {};
    const taller = [];
    filteredGroups.forEach((g) => {
      if (g.type === 'taller') {
        taller.push(g);
      } else {
        const grade = g.grade || 0;
        if (!regular[grade]) regular[grade] = [];
        regular[grade].push(g);
      }
    });
    return {
      regularByGrade: Object.entries(regular).sort(([a], [b]) => Number(a) - Number(b)),
      tallerGroups: taller,
    };
  }, [filteredGroups]);

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
      setTargetType(TARGET_TYPES.STUDENT);
      setStudentIds([student._id || student.id]);
    } else {
      setTargetType(targetTypes[0] || TARGET_TYPES.GROUP);
      setGroupIds([]);
      setStudentIds([]);
    }
    setSelectedGrade(null);
    setPriority('informative');
    setTitle('');
    setMessage('');
    setIsSubmitting(false);
    setStudentModalGroupId(null);
  }, [isDirectMode, student, targetTypes]);

  useEffect(() => {
    if (visible) {
      if (isDirectMode && student) {
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
    targetType === TARGET_TYPES.GENERAL ? true :
    targetType === TARGET_TYPES.GROUP ? groupIds.length > 0 :
    studentIds.length > 0;

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
    if (targetType === TARGET_TYPES.GENERAL) {
      // Sin destinatarios — aviso para toda la escuela
    } else if (targetType === TARGET_TYPES.GROUP && groupIds.length === 0) {
      Alert.alert('Campo requerido', 'Selecciona al menos un grupo destino.', [{ text: 'Entendido' }]);
      return;
    } else if (targetType === TARGET_TYPES.STUDENT && studentIds.length === 0) {
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
          : targetType === TARGET_TYPES.STUDENT
            ? { targetStudents: studentIds }
            : {}),
      };
      const result = await createAnnouncement(payload);

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
            {targetTypeOptions.map((option) => {
              const isActive = targetType === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setTargetType(option.value);
                    setGroupIds([]);
                    setStudentIds([]);
                    setStudentModalGroupId(null);
                    setSelectedGrade(null);
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
            {targetType === TARGET_TYPES.GENERAL
              ? 'Destinatarios'
              : targetType === TARGET_TYPES.GROUP ? 'Grupos destino' : 'Seleccionar alumnos'}
          </Text>
          {renderRecipientSection()}
        </>
      )}

      {/* Botón limpiar selección */}
      {!isDirectMode && targetType !== TARGET_TYPES.GENERAL && (groupIds.length > 0 || studentIds.length > 0) && (
        <Pressable
          onPress={() => { setGroupIds([]); setStudentIds([]); }}
          style={{ alignSelf: 'flex-end', marginTop: 8 }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#0284C7' }}>
            Limpiar selección
          </Text>
        </Pressable>
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
          : targetType === TARGET_TYPES.GENERAL
            ? 'Mensaje para toda la escuela'
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

      {/* Guardar como borrador — solo en modo normal y si el caller lo permite */}
      {!isDirectMode && targetTypes.includes('group') && (
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

    const students = (studentModalGroup.students || [])
      .slice()
      .sort((a, b) => {
        const la = (a.last_name || '').toLowerCase();
        const lb = (b.last_name || '').toLowerCase();
        if (la !== lb) return la.localeCompare(lb);
        return (a.first_name || '').toLowerCase().localeCompare((b.first_name || '').toLowerCase());
      });

    return (
      <View>
        {/* Header de la vista de alumnos. */}
        <View className="items-center px-5 pb-3 border-b border-[#E2E8F0]">
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
            {studentModalGroup.type === 'taller'
              ? getTallerDisplayName(studentModalGroup.section)
              : studentModalGroup.label}
          </Text>
          {studentModalGroup.tallerGrade != null && (
            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              {studentModalGroup.tallerGrade}° Grado
            </Text>
          )}
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
            renderItem={({ item: student, index }) => {
              const isSelected = studentIds.includes(student._id);
              const initials = `${(student.last_name || '?')[0]}${(student.first_name || '?')[0]}`.toUpperCase();
              return (
                <Pressable
                  onPress={() => toggleStudent(student._id)}
                  className="flex-row items-center px-5 py-3"
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Alumno ${student.fullName || student.name}`}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: '#E0F2FE',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#0369A1', fontSize: 15, fontWeight: '700' }}>
                      {initials}
                    </Text>
                  </View>

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
                    {`${index + 1}. ${student.last_name || ''} ${student.first_name || ''}`}
                  </Text>

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
  // CELDA DE GRUPO (reutilizable para grid)
  // -------------------------------------------------------------------
  const renderGroupCell = (group, selectedIds, toggleFn, options = {}) => {
    const isSelected = selectedIds.includes(group.id);
    const { onPress, badge, selectedColor } = options;

    // Fondo gris para todos sin seleccionar; color diferente al seleccionar
    const cellBg = isSelected ? (selectedColor || '#0EA5E9') : '#F1F5F9';
    const textColor = isSelected ? '#ffffff' : '#334155';

    return (
      <Pressable
        key={group.id}
        onPress={onPress || (() => toggleFn(group.id))}
        className="rounded-[10px] py-3 items-center"
        style={{
          width: `${100 / NUM_COLUMNS}%`,
          paddingHorizontal: CELL_GAP / 2,
          marginBottom: CELL_GAP,
          backgroundColor: cellBg,
        }}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`Grupo ${group.label}`}
      >
        {isSelected && (
          <Check size={14} color="#ffffff" strokeWidth={2.75} style={{ marginBottom: 2 }} />
        )}
        <Text style={{
          color: textColor,
          fontWeight: isSelected ? '600' : '500',
          fontSize: 14,
        }} numberOfLines={1}>
          {group.label}
        </Text>
        {badge != null && badge > 0 && (
          <Text style={{ color: '#C76F02', fontSize: 11, marginTop: 2, fontWeight: '500' }}>
            ({badge})
          </Text>
        )}
      </Pressable>
    );
  };

  // -------------------------------------------------------------------
  // CELDA DE TALLER (independiente, 2 columnas)
  // -------------------------------------------------------------------
  const renderTallerCell = (group, selectedIds, toggleFn, options = {}) => {
    const isSelected = selectedIds.includes(group.id);
    const { onPress, badge } = options;
    const displayName = getTallerDisplayName(group.section);

    // Fondo gris sin seleccionar; naranja al seleccionar
    const cellBg = isSelected ? '#EA580C' : '#F1F5F9';
    const textColor = isSelected ? '#ffffff' : '#334155';

    return (
      <Pressable
        key={group.id}
        onPress={onPress || (() => toggleFn(group.id))}
        className="rounded-[10px] py-3 items-center"
        style={{
          width: '50%',
          paddingHorizontal: 10,
          marginBottom: CELL_GAP,
          backgroundColor: cellBg,
        }}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`Taller ${displayName}`}
      >
        {isSelected && (
          <Check size={14} color="#ffffff" strokeWidth={2.75} style={{ marginBottom: 2 }} />
        )}
        <Text style={{
          color: textColor,
          fontWeight: isSelected ? '600' : '500',
          fontSize: 12,
        }} numberOfLines={1}>
          {displayName}
        </Text>
        {group.tallerGrade != null && (
          <Text style={{ fontSize: 10, color: isSelected ? '#ffffff' : '#94A3B8', marginTop: 1 }}>
            {group.tallerGrade}° Grado
          </Text>
        )}
        {badge != null && badge > 0 && (
          <Text style={{ color: '#C76F02', fontSize: 11, marginTop: 2, fontWeight: '500' }}>
            ({badge})
          </Text>
        )}
      </Pressable>
    );
  };

  // -------------------------------------------------------------------
  // SECCIÓN DE DESTINATARIOS (solo se muestra en el formulario)
  // -------------------------------------------------------------------
  const renderRecipientSection = () => {
    if (targetType === TARGET_TYPES.GENERAL) {
      return (
        <View style={{ backgroundColor: '#F0F9FF', borderRadius: 12, padding: 14, marginTop: 4 }}>
          <Text style={{ fontSize: 13, color: '#0284C7', fontWeight: '600', lineHeight: 20 }}>
            Este aviso se enviará a toda la escuela.
          </Text>
        </View>
      );
    }

    if (targetType === TARGET_TYPES.GROUP) {
      return (
        <View>
          {/* Filtro por grado */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
            {GRADE_FILTERS.map((f) => {
              const isActive = selectedGrade === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setSelectedGrade(isActive ? null : f.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: isActive ? '#275972' : '#F1F5F9',
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? '#ffffff' : '#64748B',
                  }}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Placeholder cuando no hay filtro seleccionado */}
          {selectedGrade === null && (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>
                Selecciona un grado para ver los grupos
              </Text>
            </View>
          )}

          {/* Grid de grupos */}
          {selectedGrade !== null && regularByGrade.map(([grade, gradeGroups]) => (
            <View key={`grade-${grade}`}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {grade}° Grado
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {gradeGroups.map((group) => renderGroupCell(group, groupIds, toggleGroup))}
              </View>
            </View>
          ))}
          {selectedGrade !== null && tallerGroups.length > 0 && (
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Tecnología
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {tallerGroups.map((group) => renderTallerCell(group, groupIds, toggleGroup))}
              </View>
            </View>
          )}
        </View>
      );
    }

    // Flujo "A Alumno": grid de grupos. Tap abre vista de alumnos.
    return (
      <View>
        {/* Filtro por grado */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
          {GRADE_FILTERS.map((f) => {
            const isActive = selectedGrade === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setSelectedGrade(isActive ? null : f.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: isActive ? '#275972' : '#F1F5F9',
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? '#ffffff' : '#64748B',
                }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Placeholder cuando no hay filtro seleccionado */}
        {selectedGrade === null && (
          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>
              Selecciona un grado para ver los grupos
            </Text>
          </View>
        )}

        {/* Grid de grupos */}
        {selectedGrade !== null && regularByGrade.map(([grade, gradeGroups]) => (
          <View key={`student-grade-${grade}`}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {grade}° Grado
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {gradeGroups.map((group) => {
                const students = group.students || [];
                const selectedCount = students.filter((s) => studentIds.includes(s._id)).length;
                return renderGroupCell(group, [], () => {}, {
                  onPress: async () => {
                    if ((!group.students || group.students.length === 0) && fetchStudentsForGroup) {
                      const loaded = await fetchStudentsForGroup(group.id);
                      group.students = loaded;
                    }
                    setStudentModalGroupId(group.id);
                  },
                  badge: selectedCount > 0 ? selectedCount : null,
                  selectedColor: selectedCount > 0 ? '#02C79E' : null,
                });
              })}
            </View>
          </View>
        ))}
        {selectedGrade !== null && tallerGroups.length > 0 && (
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: 14, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Tecnología
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {tallerGroups.map((group) => {
                const students = group.students || [];
                const selectedCount = students.filter((s) => studentIds.includes(s._id)).length;
                return renderTallerCell(group, [], () => {}, {
                  onPress: async () => {
                    if ((!group.students || group.students.length === 0) && fetchStudentsForGroup) {
                      const loaded = await fetchStudentsForGroup(group.id);
                      group.students = loaded;
                    }
                    setStudentModalGroupId(group.id);
                  },
                  badge: selectedCount > 0 ? selectedCount : null,
                });
              })}
            </View>
          </View>
        )}

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
