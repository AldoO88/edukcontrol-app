// =====================================================================
// app/(teacher)/grade-entry.jsx
// ---------------------------------------------------------------------
// Ruta "/grade-entry" del route group (teacher). Pantalla "Registro
// de Calificaciones" del MAESTRO: matriz alumno × evaluaciones
// (Estándar o Puntos Extra) con cálculo del promedio final en vivo.
// Cada celda abre un teclado numérico (GradeKeypadModal) que permite
// editar la nota del alumno y navegar al siguiente/anterior sin
// cerrar el modal.
//
// Se abre desde el botón "Calificar" de la card de grupo en "Mis
// Grupos" (groups.jsx), pasando { groupId, groupName }.
//
// NOTA DE ARQUITECTURA (mock visual):
//   PROTOTIPO VISUAL. Los alumnos y las evaluaciones son datos
//   estáticos. Cuando exista el endpoint real de calificaciones, se
//   reemplazan por la respuesta del backend manteniendo el shape:
//     alumnos:   { _id, name, photoUrl, controlNumber }
//     columnas:  { id, type, name, abbr, percentage?, maxExtra? }
//
//   Las actualizaciones de notas son LOCALES (useState) — sin
//   requests HTTP. Cada celda guarda inmediatamente al pulsar
//   "Guardar y Siguiente" o "OK".
//
//   Es una pantalla EMPUJADA: NO lleva bottom tab bar.
//
// MODALES REUTILIZABLES (en /_components/):
//   - AddEvaluationModal: crear / editar / eliminar columna.
//   - ConfigModal:         regla de cálculo del promedio.
//   - GradeKeypadModal:    teclado numérico con navegación.
//
// CÁLCULO:
//   - baseAvg = Σ(normal × %/100) (ponderado) | Σ(normal) / n (simple).
//   - extraPoints = Σ(extra).
//   - finalScore = min(10, baseAvg + extraPoints).
// =====================================================================

// React + hooks.
import React, { useMemo, useState } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// Navegación.
import { useLocalSearchParams, useRouter } from 'expo-router';

// Iconos Lucide.
import {
  GraduationCap,
  Settings,
  ChevronDown,
  ChevronLeft,
  Download,
  Plus,
  SlidersHorizontal,
  FilePlus,
  Trash2,
  Star,
  Users,
} from 'lucide-react-native';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Hook del dashboard docente (escuela + maestro).
import { useTeacherDashboard } from '../../src/hooks/useTeacherDashboard';

// Card compuesta de la escuela + maestro.
import SchoolInfoCard from '../../src/components/SchoolInfoCard';

// Helpers puros reutilizables.
import { getInitials } from '../../src/utils/textHelpers';

// Modales privados del route group (teacher).
import AddEvaluationModal from './_components/AddEvaluationModal';
import ConfigModal from './_components/ConfigModal';
import GradeKeypadModal from './_components/GradeKeypadModal';

// Chrome compartido: toast flotante.
import Toast from '../../src/components/Toast';
import DashboardHeader from '../../src/components/DashboardHeader';

// ---------------------------------------------------------------------
// MOCK_STUDENTS
// ---------------------------------------------------------------------
const MOCK_STUDENTS = [
  { _id: 's1', name: 'Acosta Rodríguez, Mateo',   controlNumber: '20241301', photoUrl: null },
  { _id: 's2', name: 'Delgado Ríos, Fernanda',    controlNumber: '20241302', photoUrl: null },
  { _id: 's3', name: 'Hernández Cruz, Luis',      controlNumber: '20241303', photoUrl: null },
  { _id: 's4', name: 'Sánchez Mora, Paula',       controlNumber: '20241304', photoUrl: null },
];

// ---------------------------------------------------------------------
// DIMENSIONES DE LA MATRIZ
// ---------------------------------------------------------------------
const STUDENT_COL_WIDTH = 220;
const COL_WIDTH         = 70;
const ROW_HEIGHT        = 52;
const PROMEDIO_WIDTH    = 80;

// ---------------------------------------------------------------------
// HELPERS DE CÁLCULO / FORMATO
// ---------------------------------------------------------------------
const shortName = (name) => {
  const n = String(name || '').trim();
  if (!n) return '—';
  const [last, first] = n.split(',').map((s) => s.trim());
  if (last && first) {
    const firstInitial = first[0] ? `${first[0]}.` : '';
    return `${last}, ${firstInitial}`.trim().replace(/,\s*$/, '');
  }
  const parts = n.split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0]}, ${parts[1][0] || ''}.`;
  return n;
};

const getAverageStyle = (avg, hasAnyInput) => {
  if (!hasAnyInput) return { bg: '#F1F5F9', color: '#94A3B8' };
  if (avg >= 8.0) return { bg: '#DCFCE7', color: '#15803D' };
  if (avg >= 6.0) return { bg: '#FEF3C7', color: '#B45309' };
  return { bg: '#FEE2E2', color: '#B91C1C' };
};

const computeFinalScore = (studentGrades, columns, mode) => {
  let baseSum = 0;
  let baseCount = 0;
  let extraPoints = 0;
  let hasAny = false;

  columns.forEach((col) => {
    const raw = studentGrades[col.id];
    const text = String(raw ?? '').trim();
    if (text === '') return;
    hasAny = true;
    const note = parseFloat(text.replace(',', '.'));
    if (isNaN(note)) return;
    if (col.type === 'extra') {
      extraPoints += note;
    } else if (mode === 'weighted') {
      baseSum += note * (Number(col.percentage) || 0) / 100;
    } else {
      baseSum += note;
      baseCount += 1;
    }
  });

  let baseAvg = 0;
  if (mode === 'simple') {
    baseAvg = baseCount === 0 ? 0 : baseSum / baseCount;
  } else {
    baseAvg = baseSum;
  }

  const finalScore = hasAny ? Math.min(10, baseAvg + extraPoints) : 0;
  return { baseAvg, extraPoints, finalScore, hasAnyInput: hasAny };
};

const sumStandardPercentages = (columns) =>
  columns
    .filter((c) => c.type === 'standard')
    .reduce((acc, c) => acc + (Number(c.percentage) || 0), 0);

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function TeacherGradeEntryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const groupId = params.groupId;
  const groupName = params.groupName || '1° OFIMÁTICA';

  const { data } = useTeacherDashboard();
  const teacherName = data?.teacher?.last_name || data?.teacher?.fullName || 'Juárez';
  const currentDate = data?.currentDate || 'Lunes, 10 de agosto';
  const school = useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.currentSchoolYear?.name || null,
    };
  }, [data?.school, data?.currentSchoolYear]);

  // -----------------------------------------------------------------
  // ESTADO
  // -----------------------------------------------------------------
  const [students] = useState(MOCK_STUDENTS);
  const [columns, setColumns] = useState([]);
  const [gradingMode, setGradingMode] = useState('simple');
  const [grades, setGrades] = useState(() => {
    const init = {};
    MOCK_STUDENTS.forEach((s) => { init[s._id] = {}; });
    return init;
  });
  // Toast flotante: feedback "Calificación guardada" al actualizar.
  const [toastVisible, setToastVisible] = useState(false);

  const [addModal, setAddModal] = useState({ visible: false, mode: 'add', column: null });
  const [configVisible, setConfigVisible] = useState(false);

  // Keypad: celda actualmente seleccionada para editar.
  // { studentIndex, columnId }
  const [keypadTarget, setKeypadTarget] = useState(null);

  // -----------------------------------------------------------------
  // HANDLERS
  // -----------------------------------------------------------------
  const openCell = (studentIndex, columnId) =>
    setKeypadTarget({ studentIndex, columnId });

  const closeKeypad = () => setKeypadTarget(null);

  const moveKeypadStudent = (delta) => {
    setKeypadTarget((prev) => {
      if (!prev) return prev;
      const next = prev.studentIndex + delta;
      if (next < 0 || next >= students.length) return prev;
      return { ...prev, studentIndex: next };
    });
  };

  const saveCell = (studentId, columnId, text) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [columnId]: text },
    }));
    // Muestra el toast flotante como feedback.
    setToastVisible(true);
  };

  const openAddColumn = () => setAddModal({ visible: true, mode: 'add', column: null });
  const openEditColumn = (column) =>
    setAddModal({ visible: true, mode: 'edit', column });
  const closeAddModal = () => setAddModal((s) => ({ ...s, visible: false }));

  const handleSaveColumn = ({ id, type, name, abbr, percentage, maxExtra }) => {
    if (addModal.mode === 'edit' && id) {
      setColumns((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, type, name, abbr, percentage, maxExtra } : c,
        ),
      );
    } else {
      const newId = `c${Date.now()}`;
      setColumns((prev) => [
        ...prev,
        { id: newId, type, name, abbr, percentage, maxExtra },
      ]);
    }
    closeAddModal();
  };

  const handleDeleteColumn = () => {
    const colId = addModal.column?.id;
    if (!colId) return;
    setColumns((prev) => prev.filter((c) => c.id !== colId));
    setGrades((prev) => {
      const next = {};
      Object.keys(prev).forEach((sid) => {
        const { [colId]: _drop, ...rest } = prev[sid] || {};
        next[sid] = rest;
      });
      return next;
    });
    closeAddModal();
  };

  // -----------------------------------------------------------------
  // DERIVADOS
  // -----------------------------------------------------------------
  const sumPct = useMemo(() => sumStandardPercentages(columns), [columns]);
  const standardCount = columns.filter((c) => c.type === 'standard').length;
  const extraCount = columns.filter((c) => c.type === 'extra').length;

  // -----------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ backgroundColor: '#F8FAFC' }}
    >
      <View className="flex-1 bg-[#F8FAFC]">
        {/* ============================================================
            A) HEADER FIJO
            ============================================================ */}
        <DashboardHeader />

        {/* A.2) SchoolInfoCard compuesta. */}
        <SchoolInfoCard
          school={school}
          isLoading={!school}
          className="mx-4 mt-2"
          teacherName={teacherName}
          date={currentDate}
        />

        {/* Botón "Volver". */}
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center px-4 mt-4"
          accessibilityRole="button"
          accessibilityLabel="Volver a mis grupos"
        >
          <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
          <Text className="text-sm font-semibold text-sky-600 ml-1">
            Volver
          </Text>
        </Pressable>

        {/* B) Título + Trimestre + grupo. */}
        <View className="px-4 mt-2">
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#0F172A' }}>
            Registro de Calificaciones
          </Text>
          <View className="mt-2 flex-row items-center justify-between">
            <Pressable
              className="flex-row items-center bg-white border border-[#E2E8F0] rounded-full px-4 py-2"
              accessibilityRole="button"
              accessibilityLabel="Seleccionar periodo"
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>
                1er Trimestre
              </Text>
              <ChevronDown
                size={16}
                color="#0F172A"
                strokeWidth={2.25}
                style={{ marginLeft: 6 }}
              />
            </Pressable>
            <Text
              className="font-bold text-[#0F172A] ml-3"
              style={{ fontSize: 13 }}
              numberOfLines={1}
            >
              {groupName}
            </Text>
          </View>
        </View>

        {/* C) Acciones: + Agregar Evaluación + gear de configuración. */}
        <View className="px-4 mt-1 flex-row items-center" style={{ gap: 8 }}>
          <Pressable
            onPress={openAddColumn}
            accessibilityRole="button"
            accessibilityLabel="Agregar evaluación"
            className="flex-row items-center px-4 py-2.5 rounded-xl"
            style={{ backgroundColor: '#0284C7', gap: 6, flex: 1 }}
          >
            <Plus size={16} color="#ffffff" strokeWidth={2.5} />
            <Text
              style={{ fontSize: 14, fontWeight: '700', color: '#ffffff' }}
              numberOfLines={1}
            >
              Agregar Evaluación
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setConfigVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Configuración de promedio"
            className="items-center justify-center rounded-xl"
            style={{
              width: 44,
              height: 44,
              borderWidth: 1.5,
              borderColor: '#0284C7',
              backgroundColor: '#FFFFFF',
            }}
          >
            <SlidersHorizontal size={18} color="#0284C7" strokeWidth={2.25} />
          </Pressable>
        </View>

        {/* Conteo de alumnos (en una nueva fila debajo de los botones). */}
        <View className="px-4 mt-1 flex-row items-center">
          <Users size={15} color="#64748B" strokeWidth={2} />
          <Text className="text-[13px] text-[#475569] ml-2">
            {students.length} Alumnos
          </Text>
        </View>

        {columns.length > 0 && (
          <View className="px-4 mt-2 flex-row items-center">
            <Text className="text-xs text-slate-500">
              Modo:{' '}
              <Text className="font-bold text-slate-700">
                {gradingMode === 'weighted' ? 'Ponderado' : 'Simple'}
              </Text>
              {gradingMode === 'weighted' && standardCount > 0 && (
                <Text> · Suma de porcentajes: {sumPct}% / 100%</Text>
              )}
            </Text>
            {extraCount > 0 && (
              <View
                className="ml-2 px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#F3E8FF' }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#6B21A8' }}>
                  +{extraCount} {extraCount === 1 ? 'Extra' : 'Extras'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* D) MATRIZ / EMPTY STATE. */}
        <View className="mx-4 mt-1 flex-1">
          <View
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            style={{ elevation: 1, flex: 1 }}
          >
            <ScrollView
              vertical
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              <View className="flex-row">
                {/* Columna fija del alumno. */}
                <View style={{ width: STUDENT_COL_WIDTH }}>
                  <View
                    className="border-r border-b border-slate-100 bg-slate-50"
                    style={{ height: 35, justifyContent: 'center', paddingLeft: 12 }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: '#94A3B8',
                        textTransform: 'uppercase',
                      }}
                    >
                      Alumno
                    </Text>
                  </View>
                  {students.map((student, index) => (
                    <View
                      key={student._id}
                      className="flex-row items-center border-b border-slate-100 border-r"
                      style={{ height: ROW_HEIGHT, paddingHorizontal: 8 }}
                    >
                      {student.photoUrl ? (
                        <Image
                          source={{ uri: student.photoUrl }}
                          style={{ width: 38, height: 38, borderRadius: 84 }}
                          accessibilityLabel={`Foto de ${student.name}`}
                        />
                      ) : (
                        <View
                          className="items-center justify-center"
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 18,
                            backgroundColor: '#E0F2FE',
                          }}
                        >
                          <Text
                            style={{ fontSize: 11, fontWeight: '800', color: '#0284C7' }}
                          >
                            {getInitials(student.name)}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text 
                        numberOfLines={2} 
                        ellipsizeMode="tail" 
                        style={{ 
                          fontSize: 16, 
                          fontWeight: '500', 
                          color: '#64748B' 
                          }}>
                        
                          {`${String(index + 1)}. ${student.name}`}
        
                        
                      </Text>
                    </View>
                    </View>
                  ))}
                </View>

                {/* Grid horizontal + promedio. */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <View>
                    {/* Header de columnas + promedio. */}
                    <View
                      className="flex-row border-b border-slate-100 bg-slate-50"
                      style={{ height: 35 }}
                    >
                      {columns.length === 0 ? (
                        <View
                          style={{
                            width: 220,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: '#94A3B8',
                              textTransform: 'uppercase',
                            }}
                          >
                            Evaluaciones
                          </Text>
                        </View>
                      ) : (
                        columns.map((col) => {
                          const isExtra = col.type === 'extra';
                          const bg = isExtra ? '#F3E8FF' : '#F1F5F9';
                          const fg = isExtra ? '#6B21A8' : '#0F172A';
                          const badgeBg = isExtra ? '#E9D5FF' : '#E0F2FE';
                          const badgeFg = isExtra ? '#6B21A8' : '#0369A1';
                          return (
                            <Pressable
                              key={col.id}
                              onPress={() => openEditColumn(col)}
                              accessibilityRole="button"
                              accessibilityLabel={`Editar columna ${col.abbr}`}
                              style={{
                                width: COL_WIDTH,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRightWidth: 1,
                                borderRightColor: '#F1F5F9',
                                backgroundColor: bg,
                              }}
                            >
                              {isExtra ? (
                                <View className="flex-row items-center">
                                  <Star
                                    size={11}
                                    color={fg}
                                    fill={fg}
                                    strokeWidth={2.25}
                                    style={{ marginRight: 3 }}
                                  />
                                  <Text
                                    style={{ fontSize: 12, fontWeight: '800', color: fg }}
                                  >
                                    {col.abbr}
                                  </Text>
                                </View>
                              ) : (
                                <Text style={{ fontSize: 12, fontWeight: '800', color: fg }}>
                                  {col.abbr}
                                </Text>
                              )}
                              {!isExtra && gradingMode === 'weighted' && (
                                <View
                                  style={{
                                    marginTop: 3,
                                    paddingHorizontal: 6,
                                    paddingVertical: 1,
                                    borderRadius: 6,
                                    backgroundColor: badgeBg,
                                  }}
                                >
                                  <Text
                                    style={{ fontSize: 10, fontWeight: '800', color: badgeFg }}
                                  >
                                    {col.percentage}%
                                  </Text>
                                </View>
                              )}
                              {isExtra && col.maxExtra > 0 && (
                                <Text
                                  style={{
                                    fontSize: 9,
                                    fontWeight: '700',
                                    color: '#6B21A8',
                                    marginTop: 2,
                                  }}
                                >
                                  max {col.maxExtra}pt
                                </Text>
                              )}
                            </Pressable>
                          );
                        })
                      )}

                      {/* Columna "Promedio Final". */}
                      <View
                        style={{
                          width: PROMEDIO_WIDTH,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#F8FAFC',
                          borderRightWidth: 1,
                          borderRightColor: '#F1F5F9',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '800',
                            color: '#475569',
                            textTransform: 'uppercase',
                          }}
                        >
                          Promedio
                        </Text>
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color: '#94A3B8',
                            marginTop: 1,
                          }}
                        >
                          Final
                        </Text>
                      </View>
                    </View>

                    {/* Filas. */}
                    {students.map((student, index) => {
                      const { finalScore, hasAnyInput } = computeFinalScore(
                        grades[student._id] || {},
                        columns,
                        gradingMode,
                      );
                      const avgStyle = getAverageStyle(finalScore, hasAnyInput);
                      const avgDisplay = hasAnyInput ? finalScore.toFixed(1) : '—';
                      return (
                        <View
                          key={student._id}
                          className="flex-row border-b border-slate-100"
                          style={{ height: ROW_HEIGHT }}
                        >
                          {columns.length === 0 ? (
                            <View
                              style={{
                                width: 220,
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: 24,
                                paddingHorizontal: 12,
                              }}
                            >
                              <FilePlus size={28} color="#94A3B8" strokeWidth={2} />
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: '700',
                                  color: '#475569',
                                  textAlign: 'center',
                                  marginTop: 8,
                                }}
                              >
                                Aún no has agregado evaluaciones para este trimestre.
                              </Text>
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: '#94A3B8',
                                  textAlign: 'center',
                                  marginTop: 4,
                                  lineHeight: 15,
                                }}
                              >
                                Presiona "+ Agregar Evaluación" para crear tu primera columna (Tarea, Examen, Proyecto o Puntos Extra).
                              </Text>
                            </View>
                          ) : (
                            columns.map((col) => {
                              const value = grades[student._id]?.[col.id] ?? '';
                              return (
                                <Pressable
                                  key={col.id}
                                  onPress={() => openCell(index, col.id)}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Editar ${col.abbr} de ${student.name}`}
                                  style={{
                                    width: COL_WIDTH,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRightWidth: 1,
                                    borderRightColor: '#F1F5F9',
                                  }}
                                >
                                  <View
                                    className="items-center justify-center"
                                    style={{
                                      width: 58,
                                      height: 38,
                                      borderRadius: 8,
                                      backgroundColor: '#F8FAFC',
                                      borderWidth: 1,
                                      borderColor: '#E2E8F0',
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 14,
                                        fontWeight: '700',
                                        color: value ? '#0F172A' : '#94A3B8',
                                      }}
                                    >
                                      {value || '—'}
                                    </Text>
                                  </View>
                                </Pressable>
                              );
                            })
                          )}

                          {/* Celda de promedio final. */}
                          <View
                            className="items-center justify-center"
                            style={{
                              width: PROMEDIO_WIDTH,
                              backgroundColor: '#F8FAFC',
                            }}
                          >
                            <View
                              className="items-center justify-center"
                              style={{
                                width: 58,
                                height: 38,
                                borderRadius: 8,
                                backgroundColor: avgStyle.bg,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: '800',
                                  color: avgStyle.color,
                                }}
                              >
                                {avgDisplay}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </ScrollView>
          </View>
        </View>

        {/* E) FOOTER (solo Exportar). */}
        <View
          className="absolute left-0 right-0"
          style={{
            bottom: 0,
            width: '100%',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: insets.bottom + 10,
            backgroundColor: 'rgba(248, 250, 252, 0.95)',
          }}
        >
          <Pressable
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel="Exportar reporte"
            style={{
              width: '100%',
              height: 48,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: '#0284C7',
              backgroundColor: '#FFFFFF',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Download size={16} color="#0284C7" strokeWidth={2.25} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#0284C7' }}>
              Exportar Reporte
            </Text>
          </Pressable>
        </View>

        {/* F) MODALES REUTILIZABLES. */}
        <AddEvaluationModal
          visible={addModal.visible}
          mode={addModal.mode}
          column={addModal.column}
          gradingMode={gradingMode}
          onSave={handleSaveColumn}
          onDelete={handleDeleteColumn}
          onClose={closeAddModal}
        />

        <ConfigModal
          visible={configVisible}
          gradingMode={gradingMode}
          onSelect={setGradingMode}
          onClose={() => setConfigVisible(false)}
        />

        {/* Keypad: target actual. */}
        {keypadTarget && columns.length > 0 && (() => {
          const student = students[keypadTarget.studentIndex];
          const column = columns.find((c) => c.id === keypadTarget.columnId);
          if (!student || !column) return null;
          return (
            <GradeKeypadModal
              visible
              student={student}
              column={column}
              currentGrade={grades[student._id]?.[column.id] ?? ''}
              studentIndex={keypadTarget.studentIndex}
              totalStudents={students.length}
              hasPrev={keypadTarget.studentIndex > 0}
              hasNext={keypadTarget.studentIndex < students.length - 1}
              onPrev={() => moveKeypadStudent(-1)}
              onNext={() => moveKeypadStudent(1)}
              onSave={saveCell}
              onClose={closeKeypad}
            />
          );
        })()}

        {/* Toast flotante: feedback "Calificación guardada". */}
        <Toast
          visible={toastVisible}
          message="Calificación guardada"
          duration={1800}
          onHide={() => setToastVisible(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}