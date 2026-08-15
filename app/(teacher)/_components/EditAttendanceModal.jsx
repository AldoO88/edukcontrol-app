// =====================================================================
// app/(teacher)/_components/EditAttendanceModal.jsx
// ---------------------------------------------------------------------
// Modal bottom-sheet "Editar Asistencia" de la matriz matricial.
//
// Se abre cuando el maestro toca CUALQUIER celda (P/F/R/J/-) de la
// matriz de asistencias del "Pase de Lista Matricial" (matrix.jsx).
//
// Sigue el mismo patrón visual que CreateAnnouncementModal:
//   - Overlay oscuro rgba(15,23,42,0.4); tap fuera cierra.
//   - Bottom sheet blanco con esquinas superiores redondeadas (28).
//   - Handle (pill) superior + botón X.
//
// CONTENIDO:
//   - Header: avatar del alumno + "Editar Asistencia".
//   - Subheader: nombre + fecha seleccionada.
//   - 4 opciones grandes (Presente / Falta / Retardo / Justificado).
//   - Campo opcional "Motivo o aclaración".
//   - Botón "Guardar Estado" (azul #0284C7).
//
// PROPS:
//   - visible: boolean.
//   - student / date / currentStatus: los datos de la celda tocada.
//   - groupId: id del grupo (para el PATCH).
//   - onClose: cierra el modal.
//   - onSaved: (student, status, note) => void. La pantalla actualiza
//     la matriz local de forma optimista.
// =====================================================================

// React hooks.
import React, { useState, useEffect, useCallback } from 'react';

// Primitivas RN.
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
} from 'react-native';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Iconos Lucide.
import { X } from 'lucide-react-native';

// Servicio: actualiza el registro de asistencia (PATCH).
import { updateAttendanceRecord } from '../../../src/services/teacherService';

// ---------------------------------------------------------------------
// ESTADOS DE ASISTENCIA
// ---------------------------------------------------------------------
// Cada estado tiene: codigo (letra), label corto, label largo y la
// paleta suave/icono que usa la matriz. Se comparte con el grid.
// ---------------------------------------------------------------------
export const ATTENDANCE_STATUS = {
  P: 'present',   // Presente.
  F: 'absent',    // Falta.
  R: 'late',      // Retardo.
  J: 'justified', // Justificado.
};

// Opciones grandes del modal: codigo + label largo + color de acento.
const STATUS_OPTIONS = [
  { code: 'P', title: 'Presente',                      subtitle: 'Asistencia Completa',             color: '#16A34A', bg: '#DCFCE7' },
  { code: 'F', title: 'Falta',                         subtitle: 'Inasistencia',                    color: '#DC2626', bg: '#FEE2E2' },
  { code: 'R', title: 'Retardo',                       subtitle: 'Llegada Tardía',                  color: '#D97706', bg: '#FEF3C7' },
  { code: 'FJ', title: 'Falta Justificada',            subtitle: 'Inasistencia Justificada (Médica/Tutor)', color: '#0284C7', bg: '#E0F2FE' },
];

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function EditAttendanceModal({
  visible,
  student = null,
  date = null,
  currentStatus = '-',
  groupId = null,
  onClose,
  onSaved,
}) {
  const insets = useSafeAreaInsets();

  // Estado seleccionado en el modal. Init con el estado actual de la
  // celda tocada (o "-" si no hay).
  const [selectedStatus, setSelectedStatus] = useState('-');
  // Nota opcional (motivo o aclaración).
  const [note, setNote] = useState('');
  // isSaving: true mientras el PATCH está en vuelo.
  const [isSaving, setIsSaving] = useState(false);
  // Altura del teclado en Android (para empujar el sheet por encima).
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Al abrir el modal, reseteamos el estado al de la celda y limpiamos
  // la nota (para no heredar de una edición anterior).
  useEffect(() => {
    if (visible) {
      setSelectedStatus(currentStatus || '-');
      setNote('');
      setIsSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Suscribe a los eventos del teclado en Android para que el sheet
  // suba y no quede tapado por el teclado al escribir el motivo.
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

  // -----------------------------------------------------------------
  // GUARDAR ESTADO
  // -----------------------------------------------------------------
  // Actualiza el estado local (optimista) e intenta persistir con el
  // PATCH. Si el backend falla, informamos pero mantengo la matriz
  // actualizada localmente (patrón optimista del prototipo).
  const handleSave = useCallback(async () => {
    if (!student || isSaving) return;

    setIsSaving(true);
    try {
      // Persistir contra el backend.
      const result = await updateAttendanceRecord({
        groupId,
        studentId: student._id || student.controlNumber,
        date,
        status: selectedStatus,
        note: note.trim() || null,
      });

      // Aunque el PATCH falle (endpoint aun no listo en prototipo),
      // la matriz se actualiza localmente de forma optimista.
      if (!result.success) {
        console.warn('[EditAttendanceModal] PATCH no persistido:', result.message);
      }

      // Notificar a la pantalla para que actualice la matriz local.
      onSaved?.(student, selectedStatus, note.trim());
      onClose();
    } catch (err) {
      console.error('[EditAttendanceModal] error inesperado:', err);
      // Aun en error, reflejamos el cambio localmente.
      onSaved?.(student, selectedStatus, note.trim());
      onClose();
    } finally {
      setIsSaving(false);
    }
  }, [student, date, selectedStatus, note, groupId, isSaving, onSaved, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}
          onPress={onClose}
          accessibilityLabel="Cerrar edición de asistencia"
        >
          <Pressable
            onPress={() => {}}
            className="bg-white w-full px-5"
            style={{
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingTop: 12,
              maxHeight: '90%',
              // En Android sumamos la altura del teclado para que el
              // sheet quede por encima de él. En iOS lo gestiona KAV.
              paddingBottom:
                (Platform.OS === 'android' ? keyboardHeight : 0) +
                insets.bottom +
                8,
            }}
          >
            {/* HANDLE (pill de arrastre). */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: '#CBD5E1',
                borderRadius: 2,
                marginBottom: 16,
                alignSelf: 'center',
              }}
            />

            {/* ==========================================================
                HEADER: avatar + "Editar Asistencia" + botón X
                ========================================================== */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center justify-center">
                {/* Avatar 44x44 circular (iniciales si no hay foto). */}
                <View
                  className="items-center justify-center"
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0F2FE' }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#0284C7' }}>
                    {(student?.name || student?.fullName || '?').split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                  </Text>
                </View>
                 {/* Subheader: nombre + fecha seleccionada. */}
            <View className="ml-4 mb-5">
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#0F172A' }}>
                {student?.name || student?.fullName || 'Alumno'}
              </Text>
              <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                {date ? `${date.label || date.full || date.iso}` : ''}
              </Text>
            </View>

              </View>
              <Pressable
                onPress={onClose}
                className="items-center justify-center"
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9' }}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                hitSlop={8}
              >
                <X size={18} color="#64748B" strokeWidth={2.25} />
              </Pressable>
            </View>

           
            {/* ==========================================================
                OPCIONES DE ESTADO (2x2 grid)
                ==========================================================
                4 botones grandes con borde de color e icono del estado.
                ========================================================== */}
            <View className="flex-row flex-wrap justify-between">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = selectedStatus === opt.code;
                return (
                  <Pressable
                    key={opt.code}
                    onPress={() => setSelectedStatus(opt.code)}
                    className="items-center justify-center"
                    style={{
                      width: '48%',
                      borderWidth: 2,
                      borderColor: isSelected ? opt.color : '#E2E8F0',
                      backgroundColor: isSelected ? opt.bg : '#F8FAFC',
                      borderRadius: 16,
                      paddingVertical: 14,
                      paddingHorizontal: 10,
                      marginBottom: 12,
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={opt.title}
                  >
                    {/* Círculo con la letra del estado. */}
                    <View
                      className="items-center justify-center"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: isSelected ? opt.color : '#E2E8F0',
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: '800', color: isSelected ? '#ffffff' : '#64748B' }}>
                        {opt.code}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: isSelected ? opt.color : '#334155',
                        marginTop: 8,
                      }}
                    >
                      {opt.title}
                    </Text>
                    <Text
                      style={{ fontSize: 11, color: '#64748B', marginTop: 2, textAlign: 'center' }}
                    >
                      {opt.subtitle}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ==========================================================
                CAMPO OPCIONAL: MOTIVO O ACLARACIÓN
                ========================================================== */}
            <Text
              style={{ fontSize: 12, fontWeight: '700', color: '#475569', letterSpacing: 0.5, marginTop: 4, marginBottom: 6 }}
            >
              MOTIVO O ACLARACIÓN (OPCIONAL)
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Añade una nota (médica, permiso, etc.)..."
              placeholderTextColor="#94A3B8"
              style={{
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 12,
                padding: 14,
                fontSize: 14,
                color: '#0F172A',
                minHeight: 44,
              }}
              maxLength={300}
            />

            {/* ==========================================================
                BOTÓN "GUARDAR ESTADO"
                ========================================================== */}
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              className="flex-row items-center justify-center"
              style={{
                backgroundColor: isSaving ? '#7DD3FC' : '#0284C7',
                height: 52,
                borderRadius: 16,
                marginTop: 20,
                marginBottom: 8,
              }}
              accessibilityRole="button"
              accessibilityLabel="Guardar estado de asistencia"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#ffffff' }}>
                  Guardar Estado
                </Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
