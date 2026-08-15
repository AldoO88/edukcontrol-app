// =====================================================================
// app/(teacher)/_components/AddEvaluationModal.jsx
// ---------------------------------------------------------------------
// Modal bottom-sheet para crear / editar / eliminar una columna de
// evaluación en la pantalla "Registro de Calificaciones".
//
// Tipos soportados:
//   - 'standard': evaluación normal (examen, tarea, proyecto, etc.).
//   - 'extra':    puntos extra (conducta, participación, taller…).
//
// El input de porcentaje solo aparece si la columna es estándar Y
// el modo de cálculo es ponderado. El input de valor máximo solo
// aparece para columnas de puntos extra.
//
// Props:
//   - visible: bool — si se muestra.
//   - mode:    'add' | 'edit' — controla el título y el botón de eliminar.
//   - column:  columna a editar (en 'edit') o null (en 'add').
//   - gradingMode: 'simple' | 'weighted' — decide si se muestra el %.
//   - onSave({ id, type, name, abbr, percentage, maxExtra }).
//   - onDelete() (solo en modo 'edit').
//   - onClose().
// =====================================================================

// React + hooks.
import React, { useState, useEffect } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Iconos Lucide.
import { X, Trash2 } from 'lucide-react-native';

// Helpers.
import { toNumber } from '../../../src/utils/textHelpers';

// ---------------------------------------------------------------------
// generateAbbr(fullName)
// ---------------------------------------------------------------------
// Genera una abreviatura de hasta 4 caracteres a partir del nombre:
//   - Toma la primera letra de cada palabra significativa (omite
//     stop-words como "de", "por", "la"…).
//   - Si una palabra es solo dígitos, la incluye completa.
//   - Si solo hay una palabra, toma sus primeras 4 letras.
//
//   "Examen Parcial 1"          → "EP1"
//   "Puntos por Limpieza Taller" → "PLT"
//   "Examen"                    → "EX"
// ---------------------------------------------------------------------
const STOP_WORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'y', 'por', 'para', 'a', 'en',
]);

const generateAbbr = (fullName) => {
  const cleaned = String(fullName || '').trim();
  if (!cleaned) return '';
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].substring(0, 4).toUpperCase();

  let abbr = '';
  for (const w of words) {
    if (/^\d+$/.test(w)) {
      abbr += w;
    } else if (!STOP_WORDS.has(w.toLowerCase()) && w.length > 0) {
      abbr += w[0].toUpperCase();
    }
    if (abbr.length >= 4) break;
  }
  if (!abbr) abbr = words[0][0].toUpperCase();
  return abbr.toUpperCase().slice(0, 4);
};

const AddEvaluationModal = ({
  visible,
  mode,
  column,
  gradingMode,
  onSave,
  onDelete,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState('standard');
  const [name, setName] = useState('');
  const [abbr, setAbbr] = useState('');
  // true cuando el usuario edita manualmente la abreviatura → deja
  // de autogenerarse desde el nombre.
  const [abbrTouched, setAbbrTouched] = useState(false);
  const [percentage, setPercentage] = useState('');
  const [maxExtra, setMaxExtra] = useState('1');

  // Altura del teclado (Android no la aplica automáticamente al modal).
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Reset del formulario cuando cambia la columna a editar o el modal se
  // vuelve visible.
  useEffect(() => {
    if (visible) {
      setType(column?.type || 'standard');
      setName(column?.name || '');
      setAbbr(column?.abbr || '');
      setAbbrTouched(false);
      setPercentage(
        column?.percentage !== undefined && column?.percentage !== null
          ? String(column.percentage)
          : '',
      );
      setMaxExtra(
        column?.maxExtra !== undefined && column?.maxExtra !== null
          ? String(column.maxExtra)
          : '1',
      );
    }
  }, [visible, column]);

  // Auto-genera la abreviatura a partir del nombre, hasta que el
  // usuario edite manualmente el campo abreviatura.
  useEffect(() => {
    if (!abbrTouched) setAbbr(generateAbbr(name));
  }, [name, abbrTouched]);

  // Suscribe a los eventos del teclado para empujar el sheet por encima
  // del teclado en Android (iOS ya lo gestiona KeyboardAvoidingView).
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (!visible) return null;

  const isEdit = mode === 'edit';
  const title = isEdit ? 'Editar Columna' : 'Nueva Columna de Evaluación';
  const canSave = name.trim() !== '' && abbr.trim() !== '';

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: column?.id,
      type,
      name: name.trim(),
      abbr: abbr.trim().toUpperCase().slice(0, 4),
      percentage:
        type === 'standard' && gradingMode === 'weighted'
          ? Math.max(0, Math.min(100, toNumber(percentage)))
          : 0,
      // Puntos extra: máximo 10 (rango permitido por el spec).
      maxExtra:
        type === 'extra' ? Math.max(0, Math.min(10, toNumber(maxExtra))) : 0,
    });
  };

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
        zIndex: 50,
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        style={{ width: '100%' }}
      >
        <View
          className="bg-white rounded-t-[28px] px-5 pt-3"
          style={{
            // En Android sumamos la altura del teclado para que el sheet
            // quede por encima de él. En iOS lo gestiona KAV.
            paddingBottom:
              (Platform.OS === 'android' ? keyboardHeight : 0) +
              insets.bottom +
              24,
          }}
        >
          {/* Drag handle. */}
          <View className="self-center w-10 h-1 rounded-full bg-slate-200 mb-3" />

          {/* Header. */}
          <View className="flex-row items-center justify-between mb-4">
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              className="p-1"
            >
              <X size={22} color="#64748B" strokeWidth={2.25} />
            </Pressable>
          </View>

          {/* Selector de tipo (segmented). */}
          <View className="flex-row bg-slate-100 rounded-xl p-1 mb-4">
            <SegmentedOption
              label="Evaluación Normal"
              selected={type === 'standard'}
              onPress={() => setType('standard')}
              activeColor="#0F172A"
            />
            <SegmentedOption
              label="Puntos Extra ★"
              selected={type === 'extra'}
              onPress={() => setType('extra')}
              activeColor="#6B21A8"
            />
          </View>

          <Text className="text-xs text-slate-500 mb-3">
            {type === 'standard'
              ? 'Exámenes, Tareas, Proyectos, Prácticas.'
              : 'Conducta, Participación, Taller, Puntos adicionales.'}
          </Text>

          {/* Nombre. */}
          <FieldLabel>Nombre de la Evaluación</FieldLabel>
          <FieldInput
            value={name}
            onChangeText={setName}
            placeholder={
              type === 'standard' ? 'Examen Parcial 1' : 'Puntos por Limpieza de Taller'
            }
            accessibilityLabel="Nombre de la evaluación"
          />

          {/* Abreviatura (auto-generada desde el nombre, editable). */}
          <FieldLabel>Abreviatura para la Tabla (máx. 4 caracteres)</FieldLabel>
          <FieldInput
            value={abbr}
            onChangeText={(t) => {
              setAbbrTouched(true);
              setAbbr(t.toUpperCase().slice(0, 4));
            }}
            placeholder={type === 'standard' ? 'EX1' : 'P.EX'}
            accessibilityLabel="Abreviatura"
            bold
            maxLength={4}
            autoCapitalize="characters"
          />

          {/* Porcentaje (solo standard + ponderado). */}
          {type === 'standard' && gradingMode === 'weighted' && (
            <FieldWithSuffix suffix="%" label="Porcentaje (%)">
              <FieldInput
                value={percentage}
                onChangeText={(t) => setPercentage(t.replace(/[^0-9.,]/g, ''))}
                placeholder="30"
                accessibilityLabel="Porcentaje de la evaluación"
                bold
                keyboardType="decimal-pad"
                maxLength={6}
                containerStyle={{ flex: 1 }}
              />
            </FieldWithSuffix>
          )}

          {/* Valor máximo (solo extra, rango 0.0 - 10.0). */}
          {type === 'extra' && (
            <FieldWithSuffix suffix="pt" label="Valor Máximo de Puntos Extra (0.0 - 10.0)">
              <FieldInput
                value={maxExtra}
                onChangeText={(t) => setMaxExtra(t.replace(/[^0-9.,]/g, ''))}
                placeholder="1"
                accessibilityLabel="Valor máximo de puntos extra"
                bold
                keyboardType="decimal-pad"
                maxLength={5}
                containerStyle={{ flex: 1 }}
              />
            </FieldWithSuffix>
          )}

          {/* Footer de acciones. */}
          <View className="flex-row mt-6" style={{ gap: 10 }}>
            {isEdit && (
              <Pressable
                onPress={onDelete}
                accessibilityRole="button"
                accessibilityLabel="Eliminar columna"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#FEE2E2',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={20} color="#DC2626" strokeWidth={2.25} />
              </Pressable>
            )}

            <OutlineButton label="Cancelar" onPress={onClose} />
            <PrimaryButton
              label={isEdit ? 'Guardar Cambios' : 'Crear Columna'}
              onPress={handleSave}
              disabled={!canSave}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AddEvaluationModal;

// =====================================================================
// Sub-componentes locales (privados al modal, no se exportan).
// =====================================================================

function SegmentedOption({ label, selected, onPress, activeColor }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className="flex-1 items-center justify-center py-2 rounded-lg"
      style={{
        backgroundColor: selected ? '#FFFFFF' : 'transparent',
        shadowColor: '#000',
        shadowOpacity: selected ? 0.06 : 0,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
        elevation: selected ? 1 : 0,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: selected ? activeColor : '#64748B',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FieldLabel({ children }) {
  return (
    <Text className="text-xs font-bold text-slate-500 mt-4 mb-1">{children}</Text>
  );
}

function FieldInput({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  bold = false,
  keyboardType,
  maxLength,
  autoCapitalize,
  containerStyle,
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#CBD5E1"
      accessibilityLabel={accessibilityLabel}
      keyboardType={keyboardType}
      maxLength={maxLength}
      autoCapitalize={autoCapitalize}
      className={`rounded-xl px-3 py-2.5 text-[15px] bg-slate-50 border border-slate-200 ${
        bold ? 'font-bold text-slate-900' : 'text-slate-900'
      }`}
      style={containerStyle}
    />
  );
}

function FieldWithSuffix({ label, suffix, children }) {
  return (
    <>
      <FieldLabel>{label}</FieldLabel>
      <View className="flex-row items-center">{children}<Text className="ml-2 text-base font-bold text-slate-500">{suffix}</Text></View>
    </>
  );
}

function OutlineButton({ label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569' }}>
        {label}
      </Text>
    </Pressable>
  );
}

function PrimaryButton({ label, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: disabled ? '#94A3B8' : '#0284C7',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#ffffff' }}>
        {label}
      </Text>
    </Pressable>
  );
}