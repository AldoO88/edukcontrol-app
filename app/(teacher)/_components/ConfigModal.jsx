// =====================================================================
// app/(teacher)/_components/ConfigModal.jsx
// ---------------------------------------------------------------------
// Modal bottom-sheet con la regla de cálculo del promedio (simple /
// ponderado). Pensado para abrirse desde el botón de engranaje en la
// cabecera de "Registro de Calificaciones".
//
// Opciones:
//   - 'simple':   Promedio Simple (Equitativo).
//   - 'weighted': Promedio Ponderado por Porcentajes (%).
//
// Muestra una nota informativa ámbar recordando que los "Puntos Extra"
// se suman directamente al promedio calculado y que el promedio final
// se limita a 10.0.
//
// Props:
//   - visible: bool.
//   - gradingMode: 'simple' | 'weighted' — opción actualmente activa.
//   - onSelect(mode) — al tocar una opción.
//   - onClose().
// =====================================================================

// React.
import React from 'react';

// Primitivas RN.
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Iconos Lucide.
import { X, Star, Circle, CheckCircle2 } from 'lucide-react-native';

const OPTIONS = [
  {
    id: 'simple',
    title: 'Promedio Simple (Equitativo)',
    description:
      'Todas las evaluaciones normales valen lo mismo. (Suma de notas ÷ Cantidad de evaluaciones)',
  },
  {
    id: 'weighted',
    title: 'Promedio Ponderado por Porcentajes (%)',
    description:
      'Cada evaluación normal tiene un porcentaje específico asignado (La suma de porcentajes debe dar 100%)',
  },
];

const ConfigModal = ({ visible, gradingMode, onSelect, onClose }) => {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

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
        style={{ width: '100%' }}
      >
        <View
          className="bg-white rounded-t-[28px] px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          {/* Drag handle. */}
          <View className="self-center w-10 h-1 rounded-full bg-slate-200 mb-3" />

          {/* Header. */}
          <View className="flex-row items-center justify-between mb-2">
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>
              Regla de Cálculo del Promedio
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

          <Text className="text-xs text-slate-500 mb-4">
            Selecciona cómo se calcula el promedio base de las evaluaciones normales.
          </Text>

          {/* Opciones de radio. */}
          <View>
            {OPTIONS.map((opt) => {
              const selected = gradingMode === opt.id;
              const Radio = selected ? CheckCircle2 : Circle;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => onSelect(opt.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  className="flex-row items-start mb-3 p-3 rounded-xl border"
                  style={{
                    borderColor: selected ? '#0284C7' : '#E2E8F0',
                    backgroundColor: selected ? '#F0F9FF' : '#FFFFFF',
                  }}
                >
                  <Radio
                    size={20}
                    color={selected ? '#0284C7' : '#94A3B8'}
                    strokeWidth={2}
                    style={{ marginTop: 2, marginRight: 10 }}
                  />
                  <View className="flex-1">
                    <Text
                      style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}
                    >
                      {opt.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#64748B',
                        marginTop: 4,
                        lineHeight: 17,
                      }}
                    >
                      {opt.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Nota informativa. */}
          <View
            className="flex-row items-start rounded-xl p-3 mt-2"
            style={{ backgroundColor: '#FEF3C7' }}
          >
            <Star
              size={16}
              color="#92400E"
              strokeWidth={2.25}
              style={{ marginTop: 2, marginRight: 8 }}
            />
            <Text
              style={{
                fontSize: 12,
                color: '#92400E',
                lineHeight: 17,
                flex: 1,
              }}
            >
              <Text style={{ fontWeight: '700' }}>Nota:</Text>{' '}
              Los "Puntos Extra" siempre se suman directamente al promedio
              calculado, sin dividirse ni promediarse. El promedio final se
              limita a 10.0 como máximo.
            </Text>
          </View>

          {/* Botón cerrar. */}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Listo"
            style={{
              height: 48,
              borderRadius: 12,
              backgroundColor: '#0284C7',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 16,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#ffffff' }}>
              Listo
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ConfigModal;