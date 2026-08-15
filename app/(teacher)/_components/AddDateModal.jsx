// =====================================================================
// app/(teacher)/_components/AddDateModal.jsx
// ---------------------------------------------------------------------
// Modal bottom-sheet para agregar una nueva columna de fecha a la
// matriz de asistencias.
//
// Comportamiento:
//   - Calendario visual (react-native-calendars) inline en el sheet.
//   - Fecha inicial = hoy.
//   - Restricción: solo fechas anteriores o iguales a hoy (el maestro
//     no puede pasar lista de días futuros). El calendario deshabilita
//     `maxDate={today}`.
//   - Bloquea las fechas ya existentes en la matriz (las tacha en gris
//     y deshabilita el tap).
//   - Estado seleccionado: círculo sólido cyan.
//   - Hoy (si no está seleccionado): anillo cyan.
//
// Props:
//   - visible: bool.
//   - existingDates: array de ISO strings ya presentes en la matriz.
//   - onAdd(iso) — callback al confirmar.
//   - onClose() — al cancelar o tap fuera.
// =====================================================================

// React + hooks.
import React, { useState, useEffect } from 'react';

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
import { X, Plus } from 'lucide-react-native';

// Calendario visual.
import { Calendar, LocaleConfig } from 'react-native-calendars';

// ---------------------------------------------------------------------
// Configuración regional: español.
// ---------------------------------------------------------------------
// La librería trae solo el locale inglés por defecto. Mutamos
// LocaleConfig (que es el namespace de xdate) ANTES de renderizar
// cualquier <Calendar>. Se ejecuta una sola vez al cargar el módulo.
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

// Helpers puros.
import {
  todayIso,
  formatShort,
  formatFull,
} from '../../../src/utils/attendanceHelpers';

const AddDateModal = ({ visible, existingDates, onAdd, onClose }) => {
  const insets = useSafeAreaInsets();
  const [selectedIso, setSelectedIso] = useState(todayIso());
  const [error, setError] = useState('');

  // Reset al abrir.
  useEffect(() => {
    if (visible) {
      setSelectedIso(todayIso());
      setError('');
    }
  }, [visible]);

  if (!visible) return null;

  const today = todayIso();

  // Marcado del calendario:
  //   - Existentes: tachadas, fondo gris, deshabilitadas.
  //   - Seleccionada: círculo sólido cyan.
  //   - Hoy (si no es la seleccionada): anillo cyan.
  const markedDates = {};
  existingDates.forEach((iso) => {
    markedDates[iso] = {
      disabled: true,
      disableTouchEvent: true,
      customStyles: {
        container: {
          backgroundColor: '#F1F5F9',
          borderRadius: 999,
        },
        text: {
          color: '#94A3B8',
          textDecorationLine: 'line-through',
        },
      },
    };
  });
  if (selectedIso && !existingDates.includes(selectedIso)) {
    markedDates[selectedIso] = {
      selected: true,
      customStyles: {
        container: {
          backgroundColor: '#0284C7',
          borderRadius: 999,
        },
        text: {
          color: '#ffffff',
          fontWeight: '700',
        },
      },
    };
  }
  if (today && selectedIso !== today && !existingDates.includes(today)) {
    markedDates[today] = {
      customStyles: {
        container: {
          borderWidth: 1.5,
          borderColor: '#0284C7',
          borderRadius: 999,
        },
        text: {
          color: '#0284C7',
          fontWeight: '700',
        },
      },
    };
  }

  const handleAdd = () => {
    if (!selectedIso) {
      setError('Selecciona una fecha.');
      return;
    }
    if (selectedIso > today) {
      setError('No puedes agregar fechas futuras.');
      return;
    }
    if (existingDates.includes(selectedIso)) {
      setError('Esta fecha ya existe en la matriz.');
      return;
    }
    onAdd(selectedIso);
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
        accessibilityLabel="Cerrar"
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
              Agregar Nueva Fecha
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

          <Text className="text-xs text-slate-500 mb-3">
            Selecciona la fecha en la que vas a pasar lista. Por defecto,
            se usará el día de hoy. No puedes agregar fechas futuras.
          </Text>

          {/* CALENDARIO VISUAL. */}
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              overflow: 'hidden',
              paddingBottom: 8,
            }}
          >
            <Calendar
              initialDate={today}
              // Locale español: meses y días de la semana en español.
              locale="es"
              // Restricción clave: no se pueden agregar fechas futuras.
              minDate={'2020-01-01'}
              maxDate={today}
              onDayPress={(day) => {
                setError('');
                setSelectedIso(day.dateString);
              }}
              markedDates={markedDates}
              theme={{
                backgroundColor: '#FFFFFF',
                calendarBackground: '#FFFFFF',
                textSectionTitleColor: '#64748B',
                selectedDayBackgroundColor: '#0284C7',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#0284C7',
                dayTextColor: '#0F172A',
                textDisabledColor: '#CBD5E1',
                arrowColor: '#0284C7',
                monthTextColor: '#0F172A',
                textDayFontWeight: '600',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '700',
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 11,
              }}
            />
          </View>

          {/* Preview de la fecha seleccionada. */}
          <View
            className="flex-row items-center mt-3 rounded-xl px-3 py-2.5"
            style={{ backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0369A1' }}>
              Seleccionado:
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: '#0F172A',
                marginLeft: 6,
              }}
              numberOfLines={1}
            >
              {selectedIso ? formatFull(selectedIso) : '—'}
            </Text>
          </View>
          {error ? (
            <Text className="text-xs text-rose-600 mt-2">{error}</Text>
          ) : null}

          <Text className="text-xs text-slate-500 mt-3">
            Las celdas se inicializarán como "Presente" (P). Luego puedes
            tocar cada celda para cambiar el estado.
          </Text>

          {/* Footer de acciones. */}
          <View className="flex-row mt-6" style={{ gap: 10 }}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
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
                Cancelar
              </Text>
            </Pressable>
            <Pressable
              onPress={handleAdd}
              accessibilityRole="button"
              accessibilityLabel="Agregar columna"
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#0284C7',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
              }}
            >
              <Plus size={16} color="#ffffff" strokeWidth={2.5} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#ffffff' }}>
                Agregar Columna
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AddDateModal;
