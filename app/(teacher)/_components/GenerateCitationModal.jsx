// =====================================================================
// app/(teacher)/_components/GenerateCitationModal.jsx
// ---------------------------------------------------------------------
// Bottom sheet modal para generar un Citatorio Oficial de un alumno.
//
// FLUJOS:
//   1) Si se pasa `student` como prop (desde Student Directory):
//      Muestra el form directamente con el alumno pre-seleccionado.
//   2) Si `student` es null (desde Citations):
//      Muestra selector de Grupo → Alumno → Form.
//
// El botón "Emitir Citatorio" envía POST al backend vía createTeacherCitation.
// Muestra errores del backend (400, 403, 404, 409) y loading spinner.
//
// Props:
//   - isVisible:   boolean — controla la visibilidad del Modal.
//   - onClose:     fn() — callback al cerrar.
//   - student:     Student | null — alumno pre-seleccionado (opcional).
//   - groupName:   string — nombre del grupo (fallback para card).
//   - subjectId:   string | null — ID de la materia pre-seleccionada (opcional).
//   - onCreated:   fn() — callback después de crear exitosamente (opcional).
// =====================================================================

// React + hooks.
import React, { useState, useEffect, useReducer, useRef } from 'react';

// Primitivas RN.
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

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Iconos Lucide.
import {
  FileText,
  X,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  User,
  Users,
  BookOpen,
} from 'lucide-react-native';

// Calendario visual.
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Labels de tipos de citatorio.
import { CITATION_TYPE_LABELS } from '../../../src/utils/announcementHelpers';

// Servicio para cargar grupos del maestro.
import { getMyGroups, createTeacherCitation } from '../../../src/services/teacherService';

// ---------------------------------------------------------------------
// LOCALE: Español para el calendario
// ---------------------------------------------------------------------
LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ],
  monthNamesShort: [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ],
  dayNames: [
    'Domingo', 'Lunes', 'Martes', 'Miércoles',
    'Jueves', 'Viernes', 'Sábado',
  ],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  amDesignator: 'AM',
  pmDesignator: 'PM',
};
LocaleConfig.defaultLocale = 'es';

// ---------------------------------------------------------------------
// CONSTANTES
// ---------------------------------------------------------------------
const CITATION_TYPES = ['academic', 'behavioral', 'administrative'];
const LOCATIONS = ['Trabajo Social', 'Prefectura', 'Dirección'];

// ---------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------
const combineDateTime = (dateStr, timeStr) => {
  let year = new Date().getFullYear();
  let month = 0;
  let day = 1;
  let hours = 0;
  let minutes = 0;

  const isoMatch = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    year = +isoMatch[1];
    month = +isoMatch[2] - 1;
    day = +isoMatch[3];
  }

  const timeMatch = String(timeStr || '').match(
    /(\d{1,2}):(\d{2})\s*(am|pm)?/i,
  );
  if (timeMatch) {
    hours = +timeMatch[1];
    minutes = +timeMatch[2];
    const ampm = timeMatch[3]?.toLowerCase();
    if (ampm === 'pm' && hours !== 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
  }

  const result = new Date(Date.UTC(year, month, day, hours, minutes));
  if (Number.isNaN(result.getTime())) {
    return new Date();
  }
  return result;
};

const buildCitationPayload = (data) => {
  const payload = {
    student: data.studentId,
    scheduledDate: combineDateTime(data.date, data.time),
    type: data.type,
    location: data.location,
    reason: data.reasonText,
  };
  // Subject solo se envía para tipo "academic"
  if (data.subjectId) {
    payload.subject = data.subjectId;
  }
  return payload;
};

const todayIso = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// ---------------------------------------------------------------------
// SUBCOMPONENTE: TimeStepper
// ---------------------------------------------------------------------
const TimeStepper = ({ value, onChange }) => {
  const adjust = (delta) => {
    const match = String(value || '').match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
    let hours = 8;
    let minutes = 0;
    if (match) {
      hours = +match[1];
      minutes = +match[2];
      const ampm = match[3]?.toLowerCase();
      if (ampm === 'pm' && hours !== 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
    }
    let totalMinutes = hours * 60 + minutes + delta;
    totalMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);

    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    const ampm = newHours >= 12 ? 'PM' : 'AM';
    const displayHours = newHours % 12 || 12;
    const formatted =
      `${String(displayHours).padStart(2, '0')}:` +
      `${String(newMinutes).padStart(2, '0')} ${ampm}`;
    onChange(formatted);
  };

  return (
    <View
      className="flex-row items-center rounded-lg"
      style={{
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        height: 44,
      }}
    >
      <Pressable
        onPress={() => adjust(-30)}
        className="items-center justify-center"
        style={{ width: 44, height: 44 }}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel="Restar 30 minutos"
      >
        <ChevronDown size={20} color="#64748B" strokeWidth={2.25} />
      </Pressable>
      <Text
        className="flex-1 text-center text-slate-900"
        style={{ fontSize: 14, fontWeight: '700' }}
      >
        {value}
      </Text>
      <Pressable
        onPress={() => adjust(30)}
        className="items-center justify-center"
        style={{ width: 44, height: 44 }}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel="Sumar 30 minutos"
      >
        <ChevronUp size={20} color="#64748B" strokeWidth={2.25} />
      </Pressable>
    </View>
  );
};

// ---------------------------------------------------------------------
// SUBCOMPONENTE: SectionLabel
// ---------------------------------------------------------------------
// Label de sección reutilizable (PASO 1, PASO 2, MOTIVO, etc.).
// ---------------------------------------------------------------------
const SectionLabel = ({ children, mt = 5 }) => (
  <Text
    className="text-slate-500 mb-2"
    style={{
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: mt * 4,
    }}
  >
    {children}
  </Text>
);

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
const GenerateCitationModal = ({
  isVisible,
  onClose,
  student,
  groupName,
  subjectId,
  onCreated,
}) => {
  // ============================================================
  // SAFE AREA
  // ============================================================
  const insets = useSafeAreaInsets();

  // ============================================================
  // MODO: directo (student prop) vs selección (student null)
  // ============================================================
  const isDirectMode = !!student;

  const scrollViewRef = useRef(null);

  // ============================================================
  // STATE: selección de grupo / alumno (solo modo selección)
  // ============================================================
  const [groups, setGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // ============================================================
  // STATE: form del citatorio
  // ============================================================
  const [selectedType, setSelectedType] = useState('academic');
  const [citationDate, setCitationDate] = useState(todayIso());
  const [citationTime, setCitationTime] = useState('08:30 AM');
  const [selectedLocation, setSelectedLocation] = useState('Trabajo Social');
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState('');

  // ============================================================
  // FETCH: cargar grupos al abrir (solo modo selección)
  // ============================================================
  useEffect(() => {
    if (!isVisible || isDirectMode) return;

    let cancelled = false;
    const fetchGroups = async () => {
      setIsLoadingGroups(true);
      const result = await getMyGroups();
      if (cancelled) return;
      if (result.success) {
        const groupsData = result.data?.groups || [];
        // Debug: ver estructura de cada grupo del API
        groupsData.forEach((g) => {
          console.log('[GenerateCitationModal] group:', g.label, {
            type: g.type,
            totalStudents: g.totalStudents,
            studentsLength: g.students?.length,
            students: g.students?.slice(0, 2),
          });
        });
        setGroups(groupsData);
      }
      setIsLoadingGroups(false);
    };
    fetchGroups();
    return () => { cancelled = true; };
  }, [isVisible, isDirectMode]);

  // ============================================================
  // RESET: al abrir/cerrar el modal
  // ============================================================
  useEffect(() => {
    if (isVisible) {
      setSelectedType('academic');
      setCitationDate(todayIso());
      setCitationTime('08:30 AM');
      setSelectedLocation('Trabajo Social');
      setIsCustomLocation(false);
      setCustomLocation('');
      setSelectedSubject(null);
      setIsSubmitting(false);
      setReason('');
      setSelectedGroup(null);
      setSelectedStudent(null);
      if(scrollViewRef.current){
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
    }
  }, [isVisible]);

  // ============================================================
  // STUDENT RESUELTO: el que viene de props o el seleccionado
  // ============================================================
  const resolvedStudent = isDirectMode ? student : selectedStudent;
  const resolvedGroupName = isDirectMode
    ? (groupName || '')
    : (selectedGroup?.label || '');

  // ============================================================
  // HANDLER: Emitir citatorio (PLACEHOLDER)
  // ============================================================
  const handleEmit = async () => {
    // Validación local: si es academic y no hay materia
    if (selectedType === 'academic' && !selectedSubject) {
      Alert.alert(
        'Campo requerido',
        'Selecciona una materia para citatorios de aprovechamiento.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    setIsSubmitting(true);

    const payload = buildCitationPayload({
      studentId: resolvedStudent?._id || resolvedStudent?.id,
      date: citationDate,
      time: citationTime,
      type: selectedType,
      location: isCustomLocation ? customLocation : selectedLocation,
      reasonText: reason,
      subjectId: selectedSubject?._id || null,
    });

    const result = await createTeacherCitation(payload);

    if (result.success) {
      if (onCreated) onCreated();
      onClose();
    } else {
      Alert.alert(
        'Error al crear citatorio',
        result.message || 'No se pudo crear el citatorio. Inténtalo de nuevo.',
        [{ text: 'Entendido' }]
      );
    }
    setIsSubmitting(false);
  };

  // ============================================================
  // AUTO-SELECCIÓN DE MATERIA: si el grupo tiene solo 1 materia,
  // se selecciona automáticamente al cambiar de grupo o de tipo.
  // En modo directo, si se proporciona subjectId, se usa directamente.
  // ============================================================
  useEffect(() => {
    if (isDirectMode && subjectId && selectedType === 'academic') {
      // En modo directo con subjectId, crear un objeto subject mínimo
      setSelectedSubject({ _id: subjectId, name: '' });
    } else if (selectedType === 'academic' && selectedGroup?.subjects?.length === 1) {
      setSelectedSubject(selectedGroup.subjects[0]);
    } else if (selectedType !== 'academic') {
      setSelectedSubject(null);
    }
  }, [selectedGroup, selectedType, subjectId, isDirectMode]);

  // ============================================================
  // HANDLER: seleccionar grupo
  // ============================================================
  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setSelectedStudent(null);
    setSelectedSubject(null);
  };

  // ============================================================
  // HANDLER: seleccionar alumno
  // ============================================================
  const handleSelectStudent = (stu) => {
    setSelectedStudent(stu);
    if(scrollViewRef.current){
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
  };

  // ============================================================
  // HANDLER: volver al selector de grupos (desde alumno)
  // ============================================================
  const handleBackToGroups = () => {
    setSelectedGroup(null);
    setSelectedStudent(null);
  };

  // ============================================================
  // DETERMINAR SI MOSTRAR EL FORM
  // ============================================================
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
        {/* BACKDROP — tap para cerrar, empuja el sheet hacia abajo */}
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
                    backgroundColor: '#FEE2E2',
                    padding: 8,
                    borderRadius: 12,
                  }}
                >
                  <FileText size={20} color="#DC2626" strokeWidth={2.25} />
                </View>
                <Text
                  className="ml-3 text-slate-900"
                  style={{ fontSize: 18, fontWeight: '700' }}
                  numberOfLines={1}
                >
                  Generar Citatorio
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

            {/* ============================================================
                SCROLLABLE CONTENT
                ============================================================ */}
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
                      <ActivityIndicator size="small" color="#0284C7" />
                      <Text className="text-slate-400 mt-2" style={{ fontSize: 12 }}>
                        Cargando grupos...
                      </Text>
                    </View>
                  ) : groups.length === 0 ? (
                    <View className="bg-white rounded-2xl p-6 items-center border border-slate-100">
                      <Users size={24} color="#94A3B8" strokeWidth={2} />
                      <Text className="text-slate-500 mt-2" style={{ fontSize: 13, fontWeight: '600' }}>
                        No hay grupos asignados
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: 8 }}>
                      {groups.map((group) => {
                        const subjectNames = (group.subjects || [])
                          .map((s) => s.name)
                          .join(', ');

                        // Detectar si es taller: por campo type o por label
                        const isTaller = group.type === 'taller'
                          || /taller|ofim[aá]tica|formaci[oó]n\s*para\s*el\s*trabajo/i.test(group.label || '');

                        // Total de alumnos: priorizar totalStudents, fallback a students.length
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
                                      backgroundColor: '#DBEAFE',
                                      width: 32,
                                      height: 32,
                                    }}
                                  >
                                    <Users size={16} color="#0284C7" strokeWidth={2.25} />
                                  </View>
                                  <Text
                                    className="ml-2 text-slate-900"
                                    style={{ fontSize: 15, fontWeight: '700' }}
                                  >
                                    {group.label}
                                  </Text>
                                  {/* Badge: tipo de grupo */}
                                  <View
                                    className="ml-2 px-2 py-0.5 rounded-full"
                                    style={{
                                      backgroundColor: isTaller ? '#FEF3C7' : '#F1F5F9',
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 10,
                                        fontWeight: '700',
                                        color: isTaller ? '#92400E' : '#64748B',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.3,
                                      }}
                                    >
                                      {isTaller ? 'Taller' : 'Regular'}
                                    </Text>
                                  </View>
                                </View>
                                {subjectNames ? (
                                  <View className="flex-row items-center mt-1.5 ml-10">
                                    <BookOpen size={12} color="#64748B" strokeWidth={2} />
                                    <Text
                                      className="ml-1 text-slate-500"
                                      style={{ fontSize: 11, fontWeight: '500' }}
                                      numberOfLines={1}
                                    >
                                      {subjectNames}
                                    </Text>
                                  </View>
                                ) : null}
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
                  {/* Botón volver a grupos */}
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

                  {selectedGroup.students?.length === 0 ? (
                    <View className="bg-white rounded-2xl p-6 items-center border border-slate-100">
                      <User size={24} color="#94A3B8" strokeWidth={2} />
                      <Text className="text-slate-500 mt-2" style={{ fontSize: 13, fontWeight: '600' }}>
                        No hay alumnos en este grupo
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: 6 }}>
                      {(selectedGroup.students || []).map((stu) => {
                        // Detectar si el grupo seleccionado es taller
                        const isTaller = selectedGroup.type === 'taller'
                          || /taller|ofim[aá]tica|formaci[oó]n\s*para\s*el\s*trabajo/i.test(selectedGroup.label || '');
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
                          accessibilityLabel={`Seleccionar alumno ${stu.fullName}`}
                        >
                          {/* Avatar placeholder */}
                          <View
                            className="items-center justify-center rounded-full"
                            style={{
                              width: 36,
                              height: 36,
                              backgroundColor: '#E0F2FE',
                            }}
                          >
                            <Text
                              className="text-sky-700"
                              style={{ fontSize: 13, fontWeight: '700' }}
                            >
                              {`${(stu.first_name || '?')[0]}${(stu.last_name || '?')[0]}`}
                            </Text>
                          </View>
                          <View className="ml-3 flex-1">
                            <Text
                              className="text-slate-900"
                              style={{ fontSize: 14, fontWeight: '600' }}
                              numberOfLines={1}
                            >
                              {stu.fullName || `${stu.last_name || ''} ${stu.first_name || ''}`}
                            </Text>
                            {/* Subtítulo: sección del alumno solo se muestra en talleres */}
                            {isTaller && stu.originGroup && (
                              <Text
                                className="text-slate-400"
                                style={{ fontSize: 11 }}
                              >
                                {stu.originGroup}
                              </Text>
                            )}
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
                  FORM: solo se muestra cuando hay alumno resuelto
                  =========================================================== */}
              {showForm && (
                <>
                  {/* En modo selección, mostrar chip de navegación */}
                  {!isDirectMode && selectedStudent && (
                    <View
                      className="rounded-xl mb-1"
                      style={{
                        backgroundColor: '#F0F9FF',
                        borderWidth: 1,
                        borderColor: '#BAE6FD',
                      }}
                    >
                      <View className="flex-row items-center p-3">
                        <View
                          className="items-center justify-center rounded-full"
                          style={{
                            width: 32,
                            height: 32,
                            backgroundColor: '#E0F2FE',
                          }}
                        >
                          <User size={14} color="#0284C7" strokeWidth={2.25} />
                        </View>
                        <View className="flex-1 ml-2">
                          <Text
                            className="text-slate-900"
                            style={{ fontSize: 13, fontWeight: '700' }}
                            numberOfLines={1}
                          >
                            {resolvedStudent?.fullName || `${resolvedStudent?.last_name || ''} ${resolvedStudent?.first_name || ''}`}
                          </Text>
                          <Text
                            className="text-slate-500"
                            style={{ fontSize: 11 }}
                          >
                            {resolvedGroupName ? `${resolvedGroupName} • Alumno seleccionado` : 'Alumno seleccionado'}
                          </Text>
                        </View>
                        <Pressable
                          onPress={isDirectMode ? undefined : handleBackToGroups}
                          hitSlop={6}
                          accessibilityRole="button"
                          accessibilityLabel="Cambiar alumno"
                        >
                          <Text className="text-sky-600" style={{ fontSize: 11, fontWeight: '600' }}>
                            Cambiar
                          </Text>
                        </Pressable>
                      </View>

                      {/* Info del tutor/padre (si viene del backend) */}
                      {resolvedStudent?.guardian && (
                        <>
                          <View className="h-px bg-sky-200 mx-3" />
                          <View className="flex-row items-center px-3 py-2">
                            <View
                              className="items-center justify-center rounded-full"
                              style={{
                                width: 26,
                                height: 26,
                                backgroundColor: '#FFFFFF',
                              }}
                            >
                              <User size={13} color="#64748B" strokeWidth={2.25} />
                            </View>
                            <Text
                              className="flex-1 ml-2 text-slate-700"
                              style={{ fontSize: 12 }}
                              numberOfLines={1}
                            >
                              <Text
                                className="text-slate-900"
                                style={{ fontWeight: '700' }}
                              >
                                {resolvedStudent.guardian.fullName || 'Tutor'}
                              </Text>
                              {` (${resolvedStudent.guardian.relationship || 'Tutor'})`}
                            </Text>
                            <Text
                              className="text-slate-500 ml-2"
                              style={{ fontSize: 11 }}
                            >
                              {resolvedStudent.guardian.phone || ''}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  )}

                  {/* STUDENT + TUTOR CARD (modo directo) */}
                  {isDirectMode && (
                    <View
                      className="rounded-2xl p-3"
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                      }}
                    >
                      <View className="flex-row items-center">
                        <Text
                          className="flex-1 text-slate-900"
                          style={{ fontSize: 14, fontWeight: '700' }}
                          numberOfLines={1}
                        >
                          {student?.name || 'Alumno'}
                        </Text>
                        {student?.metrics?.average ? (
                          <View
                            className="px-2 py-1 rounded-full ml-2"
                            style={{ backgroundColor: '#FEE2E2' }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: '800',
                                color: '#DC2626',
                              }}
                            >
                              {Number(student.metrics.average).toFixed(1)}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Text
                        className="text-slate-500 mt-1"
                        style={{ fontSize: 11 }}
                        numberOfLines={1}
                      >
                        {`${resolvedGroupName || groupName || ''} • No. ${student?.controlNumber || '—'}`}
                      </Text>

                      <View className="h-px bg-slate-200 my-2" />

                      <View className="flex-row items-center">
                        <View
                          className="items-center justify-center"
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 13,
                            backgroundColor: '#FFFFFF',
                          }}
                        >
                          <User size={13} color="#64748B" strokeWidth={2.25} />
                        </View>
                        <Text
                          className="flex-1 ml-2 text-slate-700"
                          style={{ fontSize: 12 }}
                          numberOfLines={1}
                        >
                          <Text
                            className="text-slate-900"
                            style={{ fontWeight: '700' }}
                          >
                            {student?.tutor?.name || 'Tutor'}
                          </Text>
                          {` (${student?.tutor?.relationship || 'Tutor'})`}
                        </Text>
                        <Text
                          className="text-slate-500 ml-2"
                          style={{ fontSize: 11 }}
                        >
                          {student?.tutor?.phone || '771-XXX-XXXX'}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* MOTIVO */}
                  <SectionLabel mt={isDirectMode ? 5 : 3}>
                    Motivo
                  </SectionLabel>
                  <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                    {CITATION_TYPES.map((typeId) => {
                      const isActive = selectedType === typeId;
                      const label = CITATION_TYPE_LABELS[typeId] || typeId;
                      return (
                        <Pressable
                          key={typeId}
                          onPress={() => {
                            setSelectedType(typeId);
                            // Si cambia a tipo no-académico, limpiar materia seleccionada
                            if (typeId !== 'academic') {
                              setSelectedSubject(null);
                            }
                          }}
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
                  {selectedType === 'academic' && selectedGroup?.subjects?.length > 0 && (
                    <>
                      <SectionLabel mt={3}>Materia</SectionLabel>
                      {selectedGroup.subjects.length === 1 ? (
                        // Si solo hay una materia, se muestra como seleccionada automáticamente
                        <View
                          className="px-3 py-2 rounded-lg self-start"
                          style={{
                            backgroundColor: '#0284C7',
                            borderWidth: 1.5,
                            borderColor: '#0284C7',
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                            {selectedGroup.subjects[0].name}
                          </Text>
                        </View>
                      ) : (
                        // Si hay varias, se muestran chips para seleccionar
                        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                          {selectedGroup.subjects.map((subject) => {
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

                  {/* FECHA */}
                  <SectionLabel mt={5}>Fecha</SectionLabel>
                  <View
                    className="rounded-lg overflow-hidden"
                    style={{
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <Calendar
                      onDayPress={(day) => setCitationDate(day.dateString)}
                      markedDates={{
                        [citationDate]: {
                          selected: true,
                          selectedColor: '#DC2626',
                        },
                      }}
                      minDate={todayIso()}
                      theme={{
                        todayTextColor: '#0284C7',
                        selectedDayBackgroundColor: '#DC2626',
                        selectedDayTextColor: '#FFFFFF',
                        arrowColor: '#0284C7',
                        textMonthFontWeight: '700',
                        textDayFontWeight: '500',
                        textDayHeaderFontWeight: '700',
                        textDayHeaderFontSize: 11,
                        textMonthFontSize: 14,
                        textDayFontSize: 14,
                        calendarBackground: '#FFFFFF',
                      }}
                    />
                  </View>

                  {/* HORA */}
                  <SectionLabel mt={4}>Hora</SectionLabel>
                  <TimeStepper value={citationTime} onChange={setCitationTime} />

                  {/* LUGAR */}
                  <SectionLabel mt={5}>Lugar</SectionLabel>
                  <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                    {LOCATIONS.map((location) => {
                      const isActive = selectedLocation === location && !isCustomLocation;
                      return (
                        <Pressable
                          key={location}
                          onPress={() => {
                            setSelectedLocation(location);
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
                            {location}
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
                      className="px-3 py-2.5 rounded-lg text-slate-900 mt-2"
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        fontSize: 13,
                      }}
                      autoFocus
                      accessibilityLabel="Nombre del lugar personalizado"
                    />
                  )}

                  {/* OBSERVACIONES */}
                  <View className="flex-row items-center justify-between mt-5 mb-2">
                    <Text
                      className="text-slate-500"
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      Observaciones
                    </Text>
                    <Text
                      className="text-slate-400"
                      style={{ fontSize: 10, fontWeight: '600' }}
                    >
                      {`${reason.length} / 1000`}
                    </Text>
                  </View>
                  <TextInput
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Añade notas adicionales para el tutor..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    maxLength={1000}
                    textAlignVertical="top"
                    className="px-3 py-2.5 rounded-lg text-slate-900"
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      minHeight: 80,
                      fontSize: 13,
                      marginBottom: 24,
                    }}
                    accessibilityLabel="Observaciones del citatorio"
                  />
                </>
              )}

            {/* ============================================================
                STICKY FOOTER: Cancelar + Emitir
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
                  disabled={isSubmitting}
                  accessibilityRole="button"
                  accessibilityLabel="Emitir citatorio"
                  className="flex-1 flex-row items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: isSubmitting ? '#94A3B8' : '#DC2626',
                    paddingVertical: 12,
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <CheckCircle size={16} color="#ffffff" strokeWidth={2.25} />
                      <Text
                        className="text-white ml-2"
                        style={{ fontSize: 13, fontWeight: '700' }}
                      >
                        Emitir Citatorio
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
              
            )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>    
      </View>
    </Modal>
  );
};

export default GenerateCitationModal;
