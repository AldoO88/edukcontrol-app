// =====================================================================
// app/(teacher)/(tabs)/grades/[groupId].jsx
// ---------------------------------------------------------------------
// Ruta "/grades/:groupId" del route group (teacher). Drill-down del
// tab "Calificaciones" — revisión de calificaciones de un grupo.
//
// Pantalla de REVISIÓN DE CALIFICACIONES. Muestra la lista de alumnos
// del grupo con sus calificaciones por componente (evaluaciones del
// período), promedio del trimestre actual y estado (Aprobado / Reprobado).
//
// UI de acordeón: al tocar un alumno se expande para ver las
// calificaciones por tipo de evaluación. Solo un alumno expandido a la
// vez. Las celdas son editables vía GradeKeypadModal.
//
// Recibe por query params:
//   - groupId:    ObjectId del grupo
//   - subjectId:  ObjectId de la materia
//   - periodId:   ObjectId del período de calificación
//   - groupLabel: etiqueta del grupo (ej: "3°OFIMÁTICA")
//   - subjectName: nombre de la materia (ej: "Tecnología I")
//   - periodName:  nombre del período (ej: "Primer Trimestre")
// =====================================================================

// React + hooks.
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Navegación.
import { useRouter, useLocalSearchParams } from 'expo-router';

// Iconos Lucide.
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Lock,
  AlertTriangle,
  XCircle,
  ClipboardList,
} from 'lucide-react-native';

// Hook del dashboard docente (escuela + maestro).
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Servicios de calificaciones.
import { getGrades, saveGrade, closeGrades } from '@/src/services/teacherService';

// Helpers de color/icono por materia.
import { getSubjectIcon, getSubjectColor, tintWithAlpha } from '@/src/utils/subjectIcons';

// Modal reutilizable de teclado de calificaciones.
import GradeKeypadModal from '@/app/(teacher)/_components/GradeKeypadModal';

// ---------------------------------------------------------------------
// COLORES PARA BORDE DERECHO DEL ACORDEÓN (según promedio del alumno).
// ---------------------------------------------------------------------
const getBorderColor = (avg) => {
  if (avg == null) return '#CBD5E1';   // gris — sin nota
  if (avg >= 8) return '#22C55E';      // verde — buen promedio
  if (avg >= 6) return '#F59E0B';      // ámbar — promedio regular
  return '#EF4444';                     // rojo — reprobado
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function GradeReviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ============================================================
  // QUERY PARAMS (de la navegación desde index.jsx)
  // ============================================================
  const {
    groupId,
    subjectId,
    periodId,
    groupLabel = 'Grupo',
    subjectName = 'Materia',
    periodName = 'Trimestre',
    subjectColor: rawSubjectColor,
    subjectIcon: rawSubjectIcon,
  } = useLocalSearchParams();

  // Resolver color/icono de la materia (con fallback).
  const subjectColor = getSubjectColor(rawSubjectColor);
  const SubjectIcon = getSubjectIcon(rawSubjectIcon);

  // ============================================================
  // DASHBOARD DATA
  // ============================================================
  const { data } = useTeacherDashboard();
  const currentDate = data?.currentDate || 'Viernes, 14 de agosto';
  const school = useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.currentSchoolYear?.name || null,
    };
  }, [data?.school, data?.currentSchoolYear]);

  // ============================================================
  // ESTADO: datos del backend
  // ============================================================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [evaluationTypes, setEvaluationTypes] = useState([]);
  const [grades, setGrades] = useState({});
  const [averages, setAverages] = useState({});

  // ============================================================
  // ESTADO: acordeón + keypad
  // ============================================================
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [keypadTarget, setKeypadTarget] = useState(null);

  // ============================================================
  // FETCH: calificaciones del grupo/__*/período
  // ============================================================
  const fetchGrades = useCallback(async () => {
    if (!groupId || !subjectId || !periodId) return;
    setLoading(true);
    setError(null);
    const result = await getGrades({ groupId, subjectId, periodId });
    if (result.success) {
      setStudents(result.data.students || []);
      setEvaluationTypes(result.data.evaluationTypes || []);
      setGrades(result.data.grades || {});
      setAverages(result.data.averages || {});
    } else {
      setError(result.message || 'No se pudieron cargar las calificaciones.');
    }
    setLoading(false);
  }, [groupId, subjectId, periodId]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  // ============================================================
  // DERIVADOS para render
  // ============================================================
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
  }, [students]);

  // Conteo de alumnos con calificación (promedio no null).
  const gradedCount = useMemo(() => {
    return sortedStudents.filter((s) => averages[s._id] != null).length;
  }, [sortedStudents, averages]);

  // Estadísticas del grupo: en riesgo, reprobados, sin nota, promedio general.
  const groupStats = useMemo(() => {
    let atRisk = 0;
    let failed = 0;
    let ungraded = 0;
    let sumGraded = 0;
    let countGraded = 0;
    for (const s of sortedStudents) {
      const avg = averages[s._id];
      if (avg == null) { ungraded++; continue; }
      countGraded++;
      sumGraded += avg;
      if (avg < 6) failed++;
      else if (avg < 7) atRisk++;
    }
    return {
      atRiskCount: atRisk,
      failedCount: failed,
      ungradedCount: ungraded,
      groupAverage: countGraded > 0 ? Math.round((sumGraded / countGraded) * 10) / 10 : null,
      gradedCount: countGraded,
    };
  }, [sortedStudents, averages]);

  // ============================================================
  // HANDLERS: acordeón
  // ============================================================
  const toggleAccordion = useCallback((studentId) => {
    setExpandedStudentId((prev) => (prev === studentId ? null : studentId));
  }, []);

  // ============================================================
  // HANDLERS: keypad
  // ============================================================
  const openKeypad = useCallback((studentIndex, evalTypeId) => {
    setKeypadTarget({ studentIndex, evalTypeId });
  }, []);

  const closeKeypad = useCallback(() => {
    setKeypadTarget(null);
  }, []);

  const moveKeypadStudent = useCallback((delta) => {
    setKeypadTarget((prev) => {
      if (!prev) return prev;
      const next = prev.studentIndex + delta;
      if (next < 0 || next >= sortedStudents.length) return prev;
      return { ...prev, studentIndex: next };
    });
  }, [sortedStudents.length]);

  const handleSaveCell = useCallback(async (studentId, evalTypeId, text) => {
    // Actualizar estado local optimistamente.
    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [evalTypeId]: text,
      },
    }));

    // Guardar en backend.
    const enrollmentId = sortedStudents.find((s) => s._id === studentId)?.enrollment_id;
    if (!enrollmentId) return;

    const numericValue = parseFloat(text);
    const value = isNaN(numericValue) ? null : numericValue;

    const result = await saveGrade({
      enrollmentId,
      evaluationTypeId: evalTypeId,
      value,
      groupId,
      subjectId,
      periodId,
    });

    if (result.success && result.data?.average != null) {
      // Actualizar promedio del alumno desde la respuesta del backend.
      setAverages((prev) => ({
        ...prev,
        [studentId]: result.data.average,
      }));
    }
  }, [sortedStudents, groupId, subjectId, periodId]);

  // ============================================================
  // HANDLER: cerrar trimestre
  // ============================================================
  const [closing, setClosing] = useState(false);

  const handleCloseTrimester = useCallback(() => {
    // Validación local: si hay alumnos sin calificación, bloquear el cierre.
    if (groupStats.ungradedCount > 0) {
      Alert.alert(
        'No se puede cerrar',
        `Hay ${groupStats.ungradedCount} alumno(s) sin calificación completa. Captura todas las calificaciones antes de cerrar el trimestre.`,
      );
      return;
    }
    confirmClose();
  }, [groupStats.ungradedCount, groupLabel, subjectName, groupId, subjectId, periodId, router]);

  const confirmClose = useCallback(async () => {
    // Pedir confirmación final.
    Alert.alert(
      'Cerrar Trimestre',
      `¿Estás seguro de cerrar el trimestre para ${groupLabel} • ${subjectName}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Trimestre',
          style: 'destructive',
          onPress: async () => {
            setClosing(true);
            const result = await closeGrades({ groupId, subjectId, periodId });
            setClosing(false);

            if (result.success) {
              Alert.alert('Éxito', result.message || 'Trimestre cerrado exitosamente.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } else {
              Alert.alert('Error', result.message || 'No se pudo cerrar el trimestre.');
            }
          },
        },
      ],
    );
  }, [groupLabel, subjectName, groupId, subjectId, periodId, router]);

  // ============================================================
  // RENDER: loading
  // ============================================================
  if (loading) {
    return (
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
        <SchoolInfoCard
          school={school}
          isLoading={!school}
          className="mx-4 mt-2"
          teacher={data?.teacher}
          date={currentDate}
        />
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator size="large" color="#0284C7" />
          <Text className="text-slate-400 text-sm mt-3">
            Cargando calificaciones...
          </Text>
        </View>
      </View>
    );
  }

  // ============================================================
  // RENDER: error
  // ============================================================
  if (error) {
    return (
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
        <SchoolInfoCard
          school={school}
          isLoading={!school}
          className="mx-4 mt-2"
          teacher={data?.teacher}
          date={currentDate}
        />
        <View
          className="mx-4 mt-6 rounded-2xl p-4"
          style={{
            backgroundColor: '#FEF2F2',
            borderWidth: 1,
            borderColor: '#FECACA',
          }}
        >
          <Text
            style={{ fontSize: 13, fontWeight: '700', color: '#DC2626' }}
          >
            Error al cargar
          </Text>
          <Text
            className="mt-1"
            style={{ fontSize: 12, color: '#991B1B' }}
          >
            {error}
          </Text>
          <Pressable
            onPress={fetchGrades}
            className="self-start mt-2 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: '#DC2626' }}
          >
            <Text className="text-white font-bold text-xs">Reintentar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ============================================================
  // RENDER: contenido principal
  // ============================================================
  return (
    <View className="flex-1 bg-slate-50">
      {/* ============================================================
          CHROME COMPARTIDO
          ============================================================ */}
      <DashboardHeader />
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-2"
        teacher={data?.teacher}
        date={currentDate}
      />

      <Pressable
        onPress={() => router.back()}
        className="flex-row items-center px-4 mt-4"
        accessibilityRole="button"
        accessibilityLabel="Volver al detalle del grupo"
      >
        <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
        <Text className="text-sm font-semibold text-sky-600 ml-1">
          Volver
        </Text>
      </Pressable>

      {/* ============================================================
          HEADER: back + título
          ============================================================ */}
      <View className="px-4 mt-4">
        <View className="flex-row items-center">
          <View className="flex-1 ml-1">
            <Text
              style={{ fontSize: 17, fontWeight: '700', color: '#0F172A' }}
              numberOfLines={1}
            >
              Revisión de Calificaciones
            </Text>
          </View>
        </View>
      </View>

      {/* ============================================================
          GROUP INFO CARD: grupo + materia + período + stats
          ============================================================ */}
      <View
        className="mx-4 mt-3 rounded-2xl p-4"
        style={{
          backgroundColor: '#FFFFFF',
          shadowColor: '#0F172A',
          shadowOpacity: 0.06,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
          borderBottomColor: subjectColor,
          borderBottomWidth: 4,
        }}
      >
        {/* Fila 1: ícono + grupo + materia. */}
        <View className="flex-row items-center">
          <View
            className="items-center justify-center rounded-lg mr-2"
            style={{
              width: 32,
              height: 32,
              backgroundColor: tintWithAlpha(subjectColor, 0.12),
            }}
          >
            <SubjectIcon size={14} color={subjectColor} strokeWidth={2.25} />
          </View>
          <Text
            style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}
            numberOfLines={1}
          >
            {groupLabel} • {subjectName}
          </Text>
        </View>

        {/* Fila 2: badge de estado. */}
        <View
          className="self-start flex-row items-center mt-2 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#F59E0B',
              marginRight: 6,
            }}
          />
          <Text
            style={{ fontSize: 12, fontWeight: '700', color: '#92400E' }}
          >
            Validando: {periodName}
          </Text>
        </View>

        {/* Fila 3: promedio general + total alumnos. */}
        <View className="flex-row items-center justify-between mt-3">
          <View className="flex-row items-center">
            <Text
              style={{ fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.4 }}
            >
              PROM GRUPO:{' '}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: groupStats.groupAverage != null
                  ? (groupStats.groupAverage >= 8 ? '#059669' : groupStats.groupAverage >= 6 ? '#D97706' : '#DC2626')
                  : '#94A3B8',
              }}
            >
              {groupStats.groupAverage != null ? groupStats.groupAverage : '—'}
            </Text>
          </View>

          <Text
            style={{ fontSize: 12, fontWeight: '600', color: '#64748B' }}
          >
            {groupStats.gradedCount}/{sortedStudents.length} Alumnos
          </Text>
        </View>

        {/* Fila 4: chips de stats (solo si hay alguno > 0). */}
        {(groupStats.atRiskCount > 0 || groupStats.failedCount > 0 || groupStats.ungradedCount > 0) && (
          <View className="flex-row mt-2.5" style={{ gap: 6, flexWrap: 'wrap' }}>
            {groupStats.atRiskCount > 0 && (
              <StatChip
                icon={AlertTriangle}
                color="#D97706"
                bg="#FEF3C7"
                count={groupStats.atRiskCount}
                label="En riesgo"
              />
            )}
            {groupStats.failedCount > 0 && (
              <StatChip
                icon={XCircle}
                color="#DC2626"
                bg="#FEE2E2"
                count={groupStats.failedCount}
                label="Reprobados"
              />
            )}
            {groupStats.ungradedCount > 0 && (
              <StatChip
                icon={ClipboardList}
                color="#64748B"
                bg="#F1F5F9"
                count={groupStats.ungradedCount}
                label="Sin nota"
              />
            )}
          </View>
        )}
      </View>

      {/* ============================================================
          STUDENT LIST (acordeón)
          ============================================================ */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 16,
        }}
      >
        {sortedStudents.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center border border-slate-100">
            <Text className="text-sm text-slate-500 text-center">
              No hay alumnos registrados en este grupo.
            </Text>
          </View>
        ) : (
          sortedStudents.map((student, index) => {
            const isExpanded = expandedStudentId === student._id;
            const studentGrades = grades[student._id] || {};
            const studentAvg = averages[student._id];

            return (
              <StudentAccordion
                key={student._id}
                student={student}
                index={index}
                isExpanded={isExpanded}
                onToggle={() => toggleAccordion(student._id)}
                evaluationTypes={evaluationTypes}
                studentGrades={studentGrades}
                studentAvg={studentAvg}
                onCellPress={(evalTypeId) => openKeypad(index, evalTypeId)}
              />
            );
          })
        )}
      </ScrollView>

      {/* ============================================================
          BOTTOM STICKY: count + confirm button
          ============================================================ */}
      <View
        className="px-4 pt-3 pb-4"
        style={{
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          shadowColor: '#0F172A',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          elevation: 8,
        }}
      >
        {/* Graded count. */}
        <View className="flex-row items-center justify-center mb-3">
          <Text
            style={{ fontSize: 13, fontWeight: '600', color: '#64748B' }}
          >
            Alumnos con calificación:{' '}
          </Text>
          <Text
            style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}
          >
            {gradedCount}
          </Text>
          <Text
            style={{ fontSize: 14, fontWeight: '600', color: '#64748B' }}
          >
            {' '}/ {sortedStudents.length}
          </Text>
        </View>

        {/* Confirm button. */}
        <Pressable
        onPress={handleCloseTrimester}
          disabled={closing}
          className="rounded-2xl overflow-hidden"
          style={{
            shadowColor: '#0284C7',
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
            backgroundColor: closing ? '#94A3B8' : '#0284C7',
            shadowOpacity: closing ? 0 : 0.3,
          }}
        >
          <View className="flex-row items-center justify-center py-4 px-6">
            {closing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Lock size={18} color="#FFFFFF" strokeWidth={2.25} />
            )}
            <Text
              className="ml-2"
              style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}
            >
              {closing ? 'Cerrando...' : 'Confirmar y Cerrar Trimestre'}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* ============================================================
          GRADE KEYPAD MODAL
          ============================================================ */}
      {keypadTarget && (() => {
        const student = sortedStudents[keypadTarget.studentIndex];
        const evalType = evaluationTypes.find((e) => e._id === keypadTarget.evalTypeId);
        if (!student || !evalType) return null;

        // Construir objeto column compatible con GradeKeypadModal.
        const column = {
          id: evalType._id,
          key: evalType._id,
          label: evalType.abbreviation || evalType.name,
          name: evalType.name,
          type: evalType.type === 'extra' ? 'extra' : 'standard',
          maxExtra: evalType.maxPoints || 10,
        };

        return (
          <GradeKeypadModal
            visible
            singleStudentMode
            student={{
              _id: student._id,
              name: student.fullName,
              photoUrl: null,
            }}
            column={column}
            currentGrade={grades[student._id]?.[evalType._id] ?? ''}
            studentIndex={keypadTarget.studentIndex}
            totalStudents={sortedStudents.length}
            hasPrev={keypadTarget.studentIndex > 0}
            hasNext={keypadTarget.studentIndex < sortedStudents.length - 1}
            onPrev={() => moveKeypadStudent(-1)}
            onNext={() => moveKeypadStudent(1)}
            onSave={(studentId, _colKey, text) => handleSaveCell(studentId, evalType._id, text)}
            onClose={closeKeypad}
          />
        );
      })()}
    </View>
  );
}

// =====================================================================
// SUBCOMPONENTE: StudentAccordion
// =====================================================================
// Acordeón de alumno con estado colapsado/expandido.
//
// Colapsado: avatar + nombre + promedio del trimestre + chevron.
// Expandido: columnas de evaluaciones editables + promedio + estado.
//
// Props:
//   - student:          objeto del backend { _id, fullName, enrollment_id }
//   - index:            posición en la lista (para color pastel)
//   - isExpanded:       si el acordeón está abierto
//   - onToggle:         callback al tocar el header del acordeón
//   - evaluationTypes:  array de tipos de evaluación del período
//   - studentGrades:    mapa { evalTypeId: value } del alumno
//   - studentAvg:       promedio del alumno (number | null)
//   - onCellPress(evalTypeId): callback al tocar una celda de calificación
// ---------------------------------------------------------------------
const StudentAccordion = ({
  student,
  index,
  isExpanded,
  onToggle,
  evaluationTypes,
  studentGrades,
  studentAvg,
  onCellPress,
}) => {
  const borderColor = getBorderColor(studentAvg);

  // Calcular si está aprobado (promedio >= 6).
  const isApproved = studentAvg != null && studentAvg >= 6;
  const finalColor = studentAvg == null ? '#94A3B8' : (isApproved ? '#059669' : '#DC2626');
  const statusBg = studentAvg == null ? '#F1F5F9' : (isApproved ? '#ECFDF5' : '#FEF2F2');
  const statusColor = studentAvg == null ? '#64748B' : (isApproved ? '#059669' : '#DC2626');
  const statusLabel = studentAvg == null ? 'Sin nota' : (isApproved ? 'Aprobado' : 'Reprobado');

  // Iniciales del alumno.
  const initials = useMemo(() => {
    const parts = (student.fullName || '').split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (student.fullName || '??').substring(0, 2).toUpperCase();
  }, [student.fullName]);

  return (
    <View
      className="rounded-2xl mb-3 overflow-hidden"
      style={{
        backgroundColor: '#FFFFFF',
        borderRightWidth: 4,
        borderRightColor: borderColor,
        shadowColor: '#0F172A',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      }}
    >
      {/* ============================================================
          HEADER DEL ACORDEÓN (siempre visible)
          ============================================================ */}
      <Pressable
        onPress={onToggle}
        className="p-4"
        accessibilityRole="button"
        accessibilityLabel={`${isExpanded ? 'Colapsar' : 'Expandir'} calificaciones de ${student.fullName}`}
        accessibilityState={{ expanded: isExpanded }}
      >
        <View className="flex-row items-center">
          {/* Avatar circle with initials. */}
          <View
            className="items-center justify-center mr-3"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: `${borderColor}33`,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '800',
                color: borderColor,
              }}
            >
              {initials}
            </Text>
          </View>

          {/* Name + average. */}
          <View className="flex-1">
            <Text
              style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}
              numberOfLines={1}
            >
              {index + 1}. {student.fullName}
            </Text>
            <Text
              className="mt-0.5"
              style={{ fontSize: 12, fontWeight: '600', color: '#94A3B8' }}
            >
              Promedio: {studentAvg != null ? studentAvg.toFixed(1) : '—'}
            </Text>
          </View>

          {/* Chevron indicator. */}
          <View className="ml-2">
            {isExpanded ? (
              <ChevronUp size={20} color="#64748B" strokeWidth={2} />
            ) : (
              <ChevronDown size={20} color="#64748B" strokeWidth={2} />
            )}
          </View>
        </View>
      </Pressable>

      {/* ============================================================
          CONTENIDO EXPANDIDO (solo si isExpanded)
          ============================================================ */}
      {isExpanded && (
        <View
          className="px-4 pb-4"
          style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9' }}
        >
          {/* Columnas de evaluación (grid dinámico). */}
          <View
            className="flex-row flex-wrap mt-3"
            style={{ gap: 8 }}
          >
            {evaluationTypes.map((evalType) => {
              const value = studentGrades[evalType._id];
              const display = value != null ? String(value) : '—';

              return (
                <Pressable
                  key={evalType._id}
                  onPress={() => onCellPress(evalType._id)}
                  className="items-center rounded-xl px-3 py-2.5"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    minWidth: 72,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${evalType.name}: ${display}. Tocar para editar.`}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '700',
                      color: '#64748B',
                    }}
                    numberOfLines={1}
                  >
                    {evalType.abbreviation || evalType.name}
                  </Text>
                  <Text
                    className="mt-1"
                    style={{
                      fontSize: 18,
                      fontWeight: '800',
                      color: value != null ? '#0F172A' : '#CBD5E1',
                    }}
                  >
                    {display}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Divider. */}
          <View
            className="mt-3"
            style={{ height: 1, backgroundColor: '#F1F5F9' }}
          />

          {/* Footer: Promedio + estado. */}
          <View className="flex-row items-center justify-between mt-3">
            {/* Promedio chip. */}
            <View
              className="px-2.5 py-1 rounded-lg"
              style={{
                backgroundColor: isApproved ? '#ECFDF5' : (studentAvg == null ? '#F1F5F9' : '#FEF2F2'),
                borderWidth: 1,
                borderColor: isApproved ? '#A7F3D0' : (studentAvg == null ? '#E2E8F0' : '#FECACA'),
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>
                Promedio:{' '}
                <Text style={{ fontWeight: '900', color: finalColor }}>
                  {studentAvg != null ? studentAvg.toFixed(1) : '—'}
                </Text>
              </Text>
            </View>

            {/* Status badge. */}
            <View
              className="flex-row items-center px-2.5 py-1 rounded-full"
              style={{ backgroundColor: statusBg }}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: statusColor,
                  marginRight: 5,
                }}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: statusColor,
                }}
              >
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// =====================================================================
// SUBCOMPONENTE: StatChip
// =====================================================================
// Pill pequeño para mostrar una métrica de salud del grupo:
//   ⚠️ 5 en riesgo
//   ❌ 2 reprobados
//   📋 1 sin nota
//
// Props:
//   - icon:    componente Lucide (AlertTriangle, XCircle, ClipboardList).
//   - color:   color del ícono + texto (hex).
//   - bg:      color de fondo del pill (hex).
//   - count:   número a mostrar.
//   - label:   texto descriptivo ("En riesgo", "Reprobados", "Sin nota").
//
// Si count es 0, NO se debe renderizar este chip (lo controla el padre
// con la condición `count > 0` antes de instanciarlo).
// ---------------------------------------------------------------------
const StatChip = ({ icon: Icon, color, bg, count, label }) => (
  <View
    className="flex-row items-center px-2 py-1 rounded-full"
    style={{ backgroundColor: bg }}
    accessibilityRole="text"
    accessibilityLabel={`${count} ${label}`}
  >
    <Icon size={11} color={color} strokeWidth={2.5} />
    <Text
      className="ml-1"
      style={{ fontSize: 11, fontWeight: '700', color }}
    >
      {`${count} ${label}`}
    </Text>
  </View>
);
