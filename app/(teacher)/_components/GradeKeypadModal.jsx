// =====================================================================
// app/(teacher)/_components/GradeKeypadModal.jsx
// ---------------------------------------------------------------------
// Modal bottom-sheet con un teclado numérico 3x4 para editar la nota
// de un alumno en una columna concreta de la matriz de calificaciones.
// Permite navegar entre alumnos (Anterior / Siguiente) sin cerrar el
// modal y guarda el valor localmente en cada paso (sin API).
//
// Estructura:
//   - Header: badge de la evaluación + botón cerrar.
//   - Perfil del alumno (avatar + nombre + N.L.).
//   - Display grande con la nota actual y label "Escala: 0.0 - X".
//   - Atajos en pills (10.0, 9.0, 8.0, 7.0, 6.0).
//   - Keypad 3x4 (7-8-9 / 4-5-6 / 1-2-3 / .-0-⌫).
//   - Barra de acciones: ◀ Anterior | Guardar y Siguiente ▶ | Listo.
//
// Props:
//   - visible: bool.
//   - student:    objeto alumno (_id, name, photoUrl).
//   - column:     objeto columna (id, type, name, abbr, maxExtra?).
//   - currentGrade: string con la nota actual (sin parsear).
//   - studentIndex: índice del alumno en la lista (0-based).
//   - totalStudents: total de alumnos (opcional, solo display).
//   - hasPrev / hasNext: bool — controlan la navegación.
//   - onPrev() / onNext() — callbacks de navegación.
//   - onSave(studentId, columnId, text) — guarda la nota actual.
//   - onClose().
// =====================================================================

// React + hooks.
import React, { useState, useEffect } from 'react';

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

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Iconos Lucide.
import {
  X,
  Star,
  Delete as BackspaceIcon,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react-native';

// Helpers.
import { getInitials } from '../../../src/utils/textHelpers';

// Constantes del teclado.
const KEYPAD = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['.', '0', 'BACK'],
];

const SHORTCUTS = ['10.0', '9.0', '8.0', '7.0', '6.0'];

const GradeKeypadModal = ({
  visible,
  student,
  column,
  currentGrade,
  studentIndex,
  totalStudents,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onSave,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  // Estado local del display; se resetea al cambiar de alumno/columna.
  const [display, setDisplay] = useState(currentGrade || '');

  useEffect(() => {
    if (visible) setDisplay(currentGrade || '');
  }, [visible, student?._id, column?.id, currentGrade]);

  if (!visible || !student || !column) return null;

  const isExtra = column.type === 'extra';
  // Rango permitido:
  //   - Evaluación estándar: 0.0 - 10.0.
  //   - Puntos extra: 0 - column.maxExtra (definido al crear la columna
  //     en AddEvaluationModal, limitado a 10 por el spec).
  const MIN_VAL = 0;
  const MAX_VAL = isExtra
    ? Math.min(10, Number(column.maxExtra) || 0)
    : 10;

  // Limita el texto al rango permitido y formatea con un solo decimal.
  const clampToRange = (text) => {
    if (text === '' || text === '.') return '0';
    let n = parseFloat(text.replace(',', '.'));
    if (isNaN(n)) return '0';
    if (n > MAX_VAL) n = MAX_VAL;
    if (n < MIN_VAL) n = MIN_VAL;
    // Redondear a 1 decimal para mantener el formato "X.X".
    return (Math.round(n * 10) / 10).toString();
  };

  // ---------------- Teclado ----------------
  const append = (k) => {
    setDisplay((prev) => {
      if (k === '.' && prev.includes('.')) return prev;
      if (prev.length >= 5) return prev;
      let next;
      if (prev === '' && k === '.') {
        next = '0.';
      } else {
        next = prev + k;
      }
      // Si ya tenemos un valor numérico formado (no parcial), aplicamos
      // el clamp para que nunca supere el máximo permitido.
      if (!next.endsWith('.')) {
        const asNumber = parseFloat(next.replace(',', '.'));
        if (!isNaN(asNumber) && asNumber > MAX_VAL) {
          // Permitir seguir tecleando si el usuario está en camino a un
          // valor menor (e.g. "1" antes de "10" no debe cortarse).
          // Solo clamp cuando el número ya formado es estrictamente > MAX.
          return clampToRange(next);
        }
      }
      return next;
    });
  };

  const backspace = () => setDisplay((p) => p.slice(0, -1));
  const setQuick = (val) => setDisplay(clampToRange(String(val)));

  const handleSaveAndNext = () => {
    onSave(student._id, column.id, display);
    if (hasNext) onNext();
  };

  const handlePrev = () => {
    onSave(student._id, column.id, display);
    onPrev();
  };

  // ---------------- Render ----------------
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        justifyContent: 'flex-end',
        zIndex: 60,
      }}
    >
      {/* Overlay clickeable. */}
      <Pressable
        onPress={onClose}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        accessibilityLabel="Cerrar modal"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ width: '100%' }}
      >
        <View
          className="bg-white rounded-t-[28px] px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          {/* Drag handle. */}
          <View className="self-center w-10 h-1 rounded-full bg-slate-200 mb-3" />

          {/* HEADER: badge de la evaluación + close. */}
          <View className="flex-row items-center justify-between mb-4">
            <View
              className="flex-row items-center"
              style={{
                backgroundColor: isExtra ? '#F3E8FF' : '#F1F5F9',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                gap: 6,
                flexShrink: 1,
              }}
            >
              {isExtra && (
                <Star size={12} color="#6B21A8" fill="#6B21A8" strokeWidth={2.25} />
              )}
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: isExtra ? '#6B21A8' : '#0F172A',
                }}
              >
                {column.name}
                {isExtra ? ' (Puntos Extra)' : ''}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              className="p-1"
            >
              <X size={22} color="#64748B" strokeWidth={2.25} />
            </Pressable>
          </View>

          {/* PERFIL DEL ALUMNO. */}
          <View className="flex-row items-center mb-4">
            {student.photoUrl ? (
              <Image
                source={{ uri: student.photoUrl }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
                accessibilityLabel={`Foto de ${student.name}`}
              />
            ) : (
              <View
                className="items-center justify-center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#E0F2FE',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#0284C7' }}>
                  {getInitials(student.name)}
                </Text>
              </View>
            )}
            <View className="flex-1 ml-3">
              <Text
                numberOfLines={1}
                style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}
              >
                {student.name}
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                N.L. {studentIndex + 1}
                {totalStudents ? ` de ${totalStudents}` : ''}
              </Text>
            </View>
          </View>

          {/* DISPLAY DE LA NOTA. */}
          <View
            className="items-center justify-center"
            style={{
              height: 60,
              backgroundColor: '#F8FAFC',
              borderRadius: 16,
              borderWidth: 2,
              borderColor: '#0284C7',
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: '800',
                color: display === '' ? '#94A3B8' : '#0F172A',
                letterSpacing: 1,
              }}
            >
              {display === '' ? '0.0' : display}
            </Text>
          </View>
          <Text className="text-xs text-slate-500 text-center mt-2">
            Escala: {MIN_VAL.toFixed(1)} - {MAX_VAL.toFixed(1)}
          </Text>

          {/* SHORTCUT PILLS. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 10, gap: 6 }}
          >
            {SHORTCUTS.map((v) => (
              <Pressable
                key={v}
                onPress={() => setQuick(v)}
                accessibilityRole="button"
                accessibilityLabel={`Atajo ${v}`}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: '#F0F9FF',
                  borderWidth: 1,
                  borderColor: '#BAE6FD',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0369A1' }}>
                  {v}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* KEYPAD 3x4. */}
          <View style={{ gap: 8 }}>
            {KEYPAD.map((row, i) => (
              <View key={i} className="flex-row" style={{ gap: 8 }}>
                {row.map((k) => (
                  <KeypadKey
                    key={k}
                    label={k}
                    onPress={() => (k === 'BACK' ? backspace() : append(k))}
                  />
                ))}
              </View>
            ))}
          </View>

          {/* BARRA DE ACCIONES. */}
          <View className="flex-row mt-5" style={{ gap: 8 }}>
            <PrevButton disabled={!hasPrev} onPress={handlePrev} />
            <SaveAndNextButton
              hasNext={hasNext}
              onPress={handleSaveAndNext}
            />
            <DoneButton
              onPress={() => {
                onSave(student._id, column.id, display);
                onClose();
              }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default GradeKeypadModal;

// =====================================================================
// Sub-componentes locales (privados al modal, no se exportan).
// =====================================================================

function KeypadKey({ label, onPress }) {
  const isBack = label === 'BACK';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={isBack ? 'Borrar último dígito' : `Tecla ${label}`}
      style={{
        flex: 1,
        height: 52,
        borderRadius: 12,
        backgroundColor: isBack ? '#FEE2E2' : '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isBack ? (
        <BackspaceIcon size={20} color="#DC2626" strokeWidth={2.25} />
      ) : (
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#0F172A' }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function PrevButton({ disabled, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Anterior alumno"
      style={{
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: disabled ? '#CBD5E1' : '#0284C7',
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <ChevronLeft
        size={16}
        color={disabled ? '#94A3B8' : '#0284C7'}
        strokeWidth={2.5}
      />
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: disabled ? '#94A3B8' : '#0284C7',
        }}
      >
        Anterior
      </Text>
    </Pressable>
  );
}

function SaveAndNextButton({ hasNext, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Guardar y siguiente alumno"
      style={{
        flex: 1.4,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#0284C7',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#ffffff' }}>
        Guardar y Siguiente
      </Text>
      {hasNext ? (
        <ChevronRight size={16} color="#ffffff" strokeWidth={2.5} />
      ) : (
        <Check size={16} color="#ffffff" strokeWidth={2.5} />
      )}
    </Pressable>
  );
}

function DoneButton({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Listo"
      style={{
        flex: 0.8,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>
        Listo
      </Text>
    </Pressable>
  );
}