// =====================================================================
// app/(teacher)/_components/GenerarCitatorioModal.jsx
// ---------------------------------------------------------------------
// Bottom sheet modal para generar un Citatorio Oficial de un alumno.
// Solo frontend (no hace POST al backend) — emite el citatorio vía
// WhatsApp del tutor usando Linking.openURL con un mensaje
// pre-formateado.
//
// Estructura (de arriba a abajo):
//
//   ┌────────────────────────────────────────┐
//   │ Modal (transparent, slide from bottom)│
//   ├────────────────────────────────────────┤
//   │ Backdrop rgba(0,0,0,0.5) (tap = close)│
//   ├────────────────────────────────────────┤
//   │ ┌────────────────────────────────┐     │
//   │ │ ─  (drag handle)              │     │
//   │ │ 📄 Generar Citatorio  [X]     │     │  ← header
//   │ ├────────────────────────────────┤     │
//   │ │ [Student + Tutor card]        │     │
//   │ │ Motivo (chips rojos)          │     │
//   │ │ Fecha y Hora (side-by-side)   │     │  ← ScrollView
//   │ │ Lugar (chips cyan)            │     │
//   │ │ Observaciones (multiline)     │     │
//   │ ├────────────────────────────────┤     │
//   │ │ [Cancelar] [Emitir y Enviar]  │     │  ← sticky footer
//   │ └────────────────────────────────┘     │
//   └────────────────────────────────────────┘
//
// Props:
//   - isVisible:   boolean — controla la visibilidad del Modal.
//   - onClose:     fn() — callback al cerrar (tap backdrop, X,
//                            Cancelar, back de Android).
//   - student:     Student (shape de src/types/student.js) — el
//                  alumno al que se le genera el citatorio.
//   - groupName:   string opcional — nombre del grupo (e.g.
//                  "1° OFIMÁTICA"). Se muestra en el subtítulo del
//                  card del alumno y se incluye en el mensaje de
//                  WhatsApp. Si no se pasa, default '1° OFIMÁTICA'.
// =====================================================================

// React + hooks.
import React, { useState, useEffect } from 'react';

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
  Linking,
} from 'react-native';

// Iconos Lucide.
import {
  FileText,  // Icono del header (documento).
  X,         // Botón cerrar.
  Send,      // Botón emitir (papel avión).
  Calendar,  // Icono del input de fecha.
  Clock,     // Icono del input de hora.
  User,      // Icono del tutor en el card.
} from 'lucide-react-native';

// ---------------------------------------------------------------------
// OPCIONES DE LOS SELECTS (constantes locales)
// ---------------------------------------------------------------------
// Motivos posibles del citatorio. El chip activo es rojo (spec).
const REASONS = [
  'Bajo Rendimiento Académico',
  'Faltas',
  'Incidencia',
  'Socioemocional',
];

// Lugares de atención. El chip activo es cyan (spec).
const LOCATIONS = [
  'Taller de Ofimática',
  'Trabajo Social',
  'Dirección',
];

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
const GenerarCitatorioModal = ({
  isVisible,
  onClose,
  student,
  groupName,
}) => {
  // ============================================================
  // FORM STATE (useState, pre-filled)
  // ============================================================
  const [selectedReason, setSelectedReason] = useState(
    'Bajo Rendimiento Académico',
  );
  const [citationDate, setCitationDate] = useState('Lunes, 18 de agosto');
  const [citationTime, setCitationTime] = useState('08:30 AM');
  const [selectedLocation, setSelectedLocation] = useState('Taller de Ofimática');
  const [notes, setNotes] = useState('');

  // ============================================================
  // RESET ON OPEN
  // ============================================================
  // Cuando el modal se abre, reseteamos el form para que no quede
  // texto residual de una invocación anterior.
  // ============================================================
  useEffect(() => {
    if (isVisible) {
      setSelectedReason('Bajo Rendimiento Académico');
      setCitationDate('Lunes, 18 de agosto');
      setCitationTime('08:30 AM');
      setSelectedLocation('Taller de Ofimática');
      setNotes('');
    }
  }, [isVisible]);

  // ============================================================
  // DERIVADOS
  // ============================================================
  const average = Number(student?.metrics?.average || 0);
  const resolvedGroupName = groupName || '1° OFIMÁTICA';

  // ============================================================
  // HANDLER: Emitir y abrir WhatsApp
  // ============================================================
  // Construye el mensaje oficial con los datos del form + datos del
  // alumno y tutor, limpia el teléfono (solo dígitos) y abre
  // wa.me/[phone]?text=... Si falla (sin WhatsApp instalado, etc),
  // logueamos y cerramos el modal de todos modos.
  // ============================================================
  const handleEmit = async () => {
    const tutorName = student?.tutor?.name || 'Tutor';
    const studentName = student?.name || 'Alumno';
    const phoneDigits = (student?.tutor?.phone || '').replace(/\D/g, '');

    const message =
      `ESTIMADO(A) TUTOR(A) ${tutorName}: Por medio de la presente se le cita en la Escuela Secundaria Técnica No. 47 para tratar asuntos relacionados con el alumno ${studentName} (${resolvedGroupName}).\n\n` +
      `📌 Motivo: ${selectedReason}\n` +
      `📅 Fecha: ${citationDate}\n` +
      `⏰ Hora: ${citationTime}\n` +
      `📍 Lugar: ${selectedLocation}\n` +
      `📝 Notas: ${notes || 'Sin notas adicionales'}\n\n` +
      `Prof. González Juárez - EdukControl`;

    const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;

    try {
      await Linking.openURL(url);
    } catch (err) {
      console.warn(
        '[GenerarCitatorioModal] no se pudo abrir WhatsApp:',
        err,
      );
    }
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        className="flex-1"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        {/* ============================================================
            TOP: BACKDROP (tap to close)
            ============================================================
            Empty flex-1 area que actúa como backdrop. Tap = close.
            ============================================================ */}
        <Pressable
          className="flex-1"
          onPress={onClose}
          accessibilityLabel="Cerrar modal"
          accessibilityRole="button"
        />

        {/* ============================================================
            BOTTOM: SHEET
            ============================================================
            KeyboardAvoidingView envuelve todo el sheet (incluyendo
            el footer sticky) para que el contenido suba junto con
            el teclado. El sheet tiene maxHeight: 90% para que
            siempre se vea el backdrop arriba.
            ============================================================ */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ width: '100%' }}
        >
          <View
            className="bg-white"
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '90%',
            }}
          >
            {/* DRAG HANDLE (centered gray bar). */}
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

            {/* HEADER: document icon + title + close X. */}
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
                  <FileText
                    size={20}
                    color="#DC2626"
                    strokeWidth={2.25}
                  />
                </View>
                <Text
                  className="ml-3 text-slate-900"
                  style={{ fontSize: 18, fontWeight: '700' }}
                  numberOfLines={1}
                >
                  Generar Citatorio Oficial
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
                SCROLLABLE FORM
                ============================================================
                keyboardShouldPersistTaps="handled" → los taps sobre
                chips/inputs NO son cancelados por el scroll.
                ============================================================ */}
            <ScrollView
              className="px-5"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* ============================================================
                  STUDENT + TUTOR CARD
                  ============================================================ */}
              <View
                className="rounded-2xl p-3"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              >
                {/* Row 1: name + grade badge. */}
                <View className="flex-row items-center">
                  <Text
                    className="flex-1 text-slate-900"
                    style={{ fontSize: 14, fontWeight: '700' }}
                    numberOfLines={1}
                  >
                    {student?.name || 'Alumno'}
                  </Text>
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
                      {average.toFixed(1)}
                    </Text>
                  </View>
                </View>

                {/* Row 2: group + control number. */}
                <Text
                  className="text-slate-500 mt-1"
                  style={{ fontSize: 11 }}
                  numberOfLines={1}
                >
                  {`${resolvedGroupName} • No. ${student?.controlNumber || '—'}`}
                </Text>

                {/* Divider. */}
                <View className="h-px bg-slate-200 my-2" />

                {/* Row 3: tutor + phone. */}
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

              {/* ============================================================
                  MOTIVO (chips rojos)
                  ============================================================ */}
              <Text
                className="text-slate-500 mt-5 mb-2"
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Motivo
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {REASONS.map((reason) => {
                  const isActive = selectedReason === reason;
                  return (
                    <Pressable
                      key={reason}
                      onPress={() => setSelectedReason(reason)}
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
                        {reason}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* ============================================================
                  FECHA Y HORA (side-by-side)
                  ============================================================ */}
              <Text
                className="text-slate-500 mt-5 mb-2"
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Fecha y Hora
              </Text>
              <View className="flex-row" style={{ gap: 8 }}>
                <View
                  className="flex-1 flex-row items-center px-3 rounded-lg"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    height: 44,
                  }}
                >
                  <Calendar size={16} color="#64748B" strokeWidth={2} />
                  <TextInput
                    value={citationDate}
                    onChangeText={setCitationDate}
                    placeholder="Fecha"
                    placeholderTextColor="#94A3B8"
                    className="flex-1 ml-2 text-slate-900"
                    style={{ fontSize: 13 }}
                    accessibilityLabel="Fecha del citatorio"
                  />
                </View>
                <View
                  className="flex-1 flex-row items-center px-3 rounded-lg"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    height: 44,
                  }}
                >
                  <Clock size={16} color="#64748B" strokeWidth={2} />
                  <TextInput
                    value={citationTime}
                    onChangeText={setCitationTime}
                    placeholder="Hora"
                    placeholderTextColor="#94A3B8"
                    className="flex-1 ml-2 text-slate-900"
                    style={{ fontSize: 13 }}
                    accessibilityLabel="Hora del citatorio"
                  />
                </View>
              </View>

              {/* ============================================================
                  LUGAR (chips cyan)
                  ============================================================ */}
              <Text
                className="text-slate-500 mt-5 mb-2"
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
                  const isActive = selectedLocation === location;
                  return (
                    <Pressable
                      key={location}
                      onPress={() => setSelectedLocation(location)}
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
              </View>

              {/* ============================================================
                  OBSERVACIONES (multiline)
                  ============================================================ */}
              <Text
                className="text-slate-500 mt-5 mb-2"
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Observaciones
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Añade notas adicionales para el tutor..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
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
            </ScrollView>

            {/* ============================================================
                STICKY FOOTER: Cancelar + Emitir
                ============================================================ */}
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
                accessibilityRole="button"
                accessibilityLabel="Emitir y enviar citatorio"
                className="flex-1 flex-row items-center justify-center rounded-xl"
                style={{
                  backgroundColor: '#DC2626',
                  paddingVertical: 12,
                }}
              >
                <Send size={16} color="#ffffff" strokeWidth={2.25} />
                <Text
                  className="text-white ml-2"
                  style={{ fontSize: 13, fontWeight: '700' }}
                >
                  Emitir y Enviar Citatorio
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default GenerarCitatorioModal;
