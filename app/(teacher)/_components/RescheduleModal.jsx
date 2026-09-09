// =====================================================================
// app/(teacher)/_components/RescheduleModal.jsx
// ---------------------------------------------------------------------
// Modal para reagendar un citatorio. Permite seleccionar nueva fecha,
// hora y (opcional) nuevo lugar. Llama a PATCH /api/citations/:id/reschedule.
//
// Props:
//   - isVisible:   boolean — controla la visibilidad del Modal.
//   - onClose:     fn() — callback al cerrar.
//   - onRescheduled: fn() — callback después de reagendar exitosamente.
//   - citationId:  string — ID del citatorio a reagendar.
//   - currentDate: string — fecha actual en formato ISO (YYYY-MM-DD).
//   - currentTime: string — hora actual en formato HH:MM.
//   - currentLocation: string — lugar actual del citatorio.
// =====================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { X, ChevronUp, ChevronDown } from 'lucide-react-native';

import { rescheduleCitation } from '../../../src/services/teacherService';

// Locaciones predefinidas (mismo listado que GenerateCitationModal).
const LOCATIONS = ['Trabajo Social', 'Prefectura', 'Dirección'];

// ---------------------------------------------------------------------
// combineDateTime: convierte date ('YYYY-MM-DD') + time ('HH:MM AM/PM')
// a ISO 8601.
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

// ---------------------------------------------------------------------
// todayIso: retorna 'YYYY-MM-DD' de hoy.
// ---------------------------------------------------------------------
const todayIso = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// ---------------------------------------------------------------------
// TimeStepper: selector de hora con +/- 30 min.
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

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
const RescheduleModal = ({
  isVisible,
  onClose,
  onRescheduled,
  citationId,
  currentDate = '',
  currentTime = '',
  currentLocation = '',
}) => {
  const insets = useSafeAreaInsets();

  const [newDate, setNewDate] = useState(currentDate || todayIso());
  const [newTime, setNewTime] = useState(currentTime || '08:30 AM');
  const [selectedLocation, setSelectedLocation] = useState(currentLocation || 'Trabajo Social');
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const scrollViewRef = useRef(null);

  // Reset al abrir.
  useEffect(() => {
    if (isVisible) {
      setNewDate(currentDate || todayIso());
      setNewTime(currentTime || '08:30 AM');
      // Detectar si la ubicación actual es una de las predefinidas.
      const isPredefined = LOCATIONS.includes(currentLocation);
      setSelectedLocation(isPredefined ? currentLocation : 'Trabajo Social');
      setIsCustomLocation(!isPredefined);
      setCustomLocation(!isPredefined ? (currentLocation || '') : '');
      setIsSubmitting(false);
      setSubmitError(null);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
    }
  }, [isVisible, currentDate, currentTime, currentLocation]);

  // -----------------------------------------------------------------
  // HANDLE SUBMIT
  // -----------------------------------------------------------------
  const handleReschedule = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const scheduledDate = combineDateTime(newDate, newTime);
    const payload = { scheduledDate: scheduledDate.toISOString() };
    const location = isCustomLocation ? customLocation : selectedLocation;
    if (location.trim()) {
      payload.location = location.trim();
    }

    const result = await rescheduleCitation(citationId, payload);

    if (result.success) {
      if (onRescheduled) onRescheduled();
      onClose();
    } else {
      setSubmitError(result.message);
    }
    setIsSubmitting(false);
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: insets.bottom + 12,
              maxHeight: '85%',
            }}
          >
            {/* HEADER */}
            <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
              <Text
                className="text-slate-900"
                style={{ fontSize: 16, fontWeight: '700' }}
              >
                Reagendar Citatorio
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <X size={20} color="#64748B" strokeWidth={2.25} />
              </Pressable>
            </View>

            <ScrollView
              ref={scrollViewRef}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
            >
              {/* NUEVA FECHA */}
              <Text
                className="text-slate-500 mb-2"
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Nueva Fecha
              </Text>
              <View
                className="rounded-lg overflow-hidden"
                style={{
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Calendar
                  onDayPress={(day) => setNewDate(day.dateString)}
                  markedDates={{
                    [newDate]: {
                      selected: true,
                      selectedColor: '#0284C7',
                    },
                  }}
                  minDate={todayIso()}
                  theme={{
                    todayTextColor: '#0284C7',
                    selectedDayBackgroundColor: '#0284C7',
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

              {/* NUEVA HORA */}
              <Text
                className="text-slate-500 mt-4 mb-2"
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Nueva Hora
              </Text>
              <TimeStepper value={newTime} onChange={setNewTime} />

              {/* NUEVO LUGAR */}
              <Text
                className="text-slate-500 mt-4 mb-2"
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Lugar
              </Text>
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
                  className="rounded-lg px-3 py-3 mt-2"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    fontSize: 13,
                    color: '#0F172A',
                  }}
                />
              )}

              {/* ERROR */}
              {submitError && (
                <Text
                  className="text-rose-600 text-center mt-3"
                  style={{ fontSize: 12 }}
                >
                  {submitError}
                </Text>
              )}

              {/* BOTÓN REAGENDAR */}
              <Pressable
                onPress={handleReschedule}
                disabled={isSubmitting}
                className="mt-4 mb-2 flex-row items-center justify-center rounded-xl"
                style={{
                  backgroundColor: isSubmitting ? '#94A3B8' : '#0284C7',
                  paddingVertical: 14,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text
                    className="text-white"
                    style={{ fontSize: 14, fontWeight: '700' }}
                  >
                    Reagendar Cita
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default RescheduleModal;
