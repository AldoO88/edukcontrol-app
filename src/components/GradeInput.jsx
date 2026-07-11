// =====================================================================
// GradeInput.jsx
// ---------------------------------------------------------------------
// Input de calificación con indicador de tendencia (flecha arriba/
// abajo según el rango). Encapsula el patrón TextInput + icono
// + color dinámico según la nota.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, TextInput, Text.
import { View, TextInput, Text } from 'react-native';

// Iconos.
import { TrendingUp, TrendingDown } from 'lucide-react-native';

// clsx.
import { clsx } from 'clsx';

// Helpers.
import { gradeUi, GRADE_THRESHOLDS } from '../constants/statusUi';

// Props:
//   - value: number o null.
//   - onChange: callback(value) cuando cambia el input.
//   - accessibilityLabel: label a11y.
const GradeInput = ({ value, onChange, accessibilityLabel }) => {
  // Obtenemos la UI (colores, label) según el valor actual.
  const ui = gradeUi(value);

  return (
    <View
      className={clsx(
        'border rounded-xl px-3 py-2 flex-row items-center',
        ui.bgClass,
        // Borde transparente si hay valor, slate-200 si está vacío.
        value !== null ? 'border-transparent' : 'border-slate-200',
      )}
      style={{ minWidth: 80 }}
    >
      <TextInput
        className="text-slate-900 text-base font-bold text-center"
        placeholder="0-10"
        placeholderTextColor="#94a3b8"
        value={value !== null && value !== undefined ? String(value) : ''}
        onChangeText={onChange}
        keyboardType="numeric"
        maxLength={4}
        accessibilityLabel={accessibilityLabel}
        // Importante para que iOS no meta padding extra.
        paddingVertical={0}
      />
      {/* Icono de tendencia. TrendingUp si >= GOOD, TrendingDown
          si < FAILING. Sin icono si está en el rango medio o vacío. */}
      {value !== null && value >= GRADE_THRESHOLDS.GOOD && (
        <TrendingUp size={14} color="#059669" style={{ marginLeft: 4 }} />
      )}
      {value !== null && value < GRADE_THRESHOLDS.FAILING && (
        <TrendingDown size={14} color="#dc2626" style={{ marginLeft: 4 }} />
      )}
    </View>
  );
};

export default GradeInput;
