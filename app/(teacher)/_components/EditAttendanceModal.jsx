// =====================================================================
// app/(teacher)/_components/EditAttendanceModal.jsx
// ---------------------------------------------------------------------
// Modal bottom-sheet de selección de status de asistencia.
//
// FLUJO (refactor a "1-tap picker"):
//   1. El usuario toca una de las 4 opciones (P/F/R/FJ).
//   2. El modal dispara el PATCH al backend (best-effort, optimista).
//   3. El modal cierra automáticamente via `onClose()`.
//   4. La pantalla actualiza su state local via `onSaved`.
//
// La selección del status es la acción completa (1 tap total =
// aplicar + cerrar). Sin paso intermedio ni "Guardar".
//
// Sigue el mismo patrón visual que antes (bottom sheet con drag
// handle + header con avatar + grid 2x2 de opciones) para mantener
// coherencia con el resto de modales del proyecto (CreateAnnouncement,
// GenerateCitation, etc.).
//
// PROPS:
//   - visible: boolean.
//   - student: objeto del alumno (para header avatar + id al PATCH).
//   - date: { iso, full, label } — para el subheader y el PATCH.
//   - currentStatus: status code actual (highlight en la opción).
//   - groupId: id del grupo (para el PATCH).
//   - onClose: cierra el modal.
//   - onSaved: (student, status) => void. La pantalla actualiza
//     su state local optimísticamente.
// =====================================================================

// React.
import React, { useCallback } from 'react';

// Primitivas RN.
import {
  Modal,
  View,
  Text,
  Pressable,
} from 'react-native';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Iconos Lucide.
import { X } from 'lucide-react-native';

// Servicio: actualiza el registro de asistencia (PATCH).
import { updateAttendanceRecord } from '../../../src/services/teacherService';

// ---------------------------------------------------------------------
// ATTENDANCE_STATUS
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

// ---------------------------------------------------------------------
// Opciones grandes del modal: codigo + título + color de acento.
// 4 estados seleccionables en grid 2x2.
// ---------------------------------------------------------------------
const STATUS_OPTIONS = [
  { code: 'P',  title: 'Presente',          subtitle: 'Asistencia Completa',             color: '#16A34A', bg: '#DCFCE7' },
  { code: 'F',  title: 'Falta',             subtitle: 'Inasistencia',                    color: '#DC2626', bg: '#FEE2E2' },
  { code: 'R',  title: 'Retardo',           subtitle: 'Llegada Tardía',                  color: '#D97706', bg: '#FEF3C7' },
  { code: 'FJ', title: 'Falta Justificada', subtitle: 'Médica / Permiso',                color: '#0284C7', bg: '#E0F2FE' },
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

  // -----------------------------------------------------------------
  // SELECCIÓN DE OPCIÓN (auto-save on tap)
  // -----------------------------------------------------------------
  // El usuario toca una opción → el modal dispara el PATCH al backend
  // (best-effort) y notifica al padre vía `onSaved`. Después cierra
  // automáticamente con `onClose`. Sin paso intermedio, sin "Guardar".
  //
  // El `useCallback` evita recrear la función en cada render (estable
  // referencia para los handlers de los Pressable de las opciones).
  // -----------------------------------------------------------------
  const handleSelectOption = useCallback(
    async (code) => {
      if (!student) return;
      try {
        // Persistir contra el backend (best-effort).
        const result = await updateAttendanceRecord({
          groupId,
          studentId: student._id || student.controlNumber,
          date,
          status: code,
        });
        if (!result.success) {
          console.warn(
            '[EditAttendanceModal] PATCH no persistido:',
            result.message,
          );
        }
        // Notificar a la pantalla para que actualice la matriz /
        // la lista de today. Optimista: el state local se actualiza
        // INCLUSO si el PATCH falla (patrón del prototipo).
        onSaved?.(student, code, '');
      } catch (err) {
        console.error('[EditAttendanceModal] error inesperado:', err);
        onSaved?.(student, code, '');
      } finally {
        // El modal se cierra SIEMPRE — la acción se considera
        // completa. Si el PATCH falló, se verá en el siguiente refresh.
        onClose?.();
      }
    },
    [student, date, groupId, onSaved, onClose],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}
        onPress={onClose}
        accessibilityLabel="Cerrar selección de asistencia"
      >
        <Pressable
          onPress={() => {}}
          className="bg-white w-full px-5"
          style={{
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 12,
            maxHeight: '90%',
            paddingBottom: insets.bottom + 8,
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
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center flex-1">
              {/* Avatar 44x44 circular (iniciales si no hay foto). */}
              <View
                className="items-center justify-center"
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0F2FE' }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0284C7' }}>
                  {(student?.name || student?.fullName || '?')
                    .split(' ')
                    .map((w) => w[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </Text>
              </View>
              {/* Subheader: nombre + fecha. */}
              <View className="ml-4 flex-1">
                <Text
                  className="text-slate-900"
                  style={{ fontSize: 15, fontWeight: '600' }}
                  numberOfLines={1}
                >
                  {student?.name || student?.fullName || 'Alumno'}
                </Text>
                <Text
                  className="text-slate-500 mt-0.5"
                  style={{ fontSize: 12 }}
                  numberOfLines={1}
                >
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
              4 botones grandes con borde de color + ícono del estado.
              Tap en una opción = auto-save + close (sin paso
              intermedio). El `currentStatus` se marca con borde
              coloreado para feedback visual.
              ========================================================== */}
          <View className="flex-row flex-wrap justify-between">
            {STATUS_OPTIONS.map((opt) => {
              const isCurrent = opt.code === currentStatus;
              return (
                <Pressable
                  key={opt.code}
                  onPress={() => handleSelectOption(opt.code)}
                  className="items-center justify-center"
                  style={{
                    width: '48%',
                    borderWidth: 2,
                    borderColor: isCurrent ? opt.color : '#E2E8F0',
                    backgroundColor: isCurrent ? opt.bg : '#F8FAFC',
                    borderRadius: 16,
                    paddingVertical: 14,
                    paddingHorizontal: 10,
                    marginBottom: 12,
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isCurrent }}
                  accessibilityLabel={`Marcar como ${opt.title}`}
                >
                  {/* Círculo con la letra del estado. */}
                  <View
                    className="items-center justify-center"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: isCurrent ? opt.color : '#E2E8F0',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '800',
                        color: isCurrent ? '#ffffff' : '#64748B',
                      }}
                    >
                      {opt.code}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: isCurrent ? opt.color : '#334155',
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
              HINT: el modal cierra al tocar una opción.
              ========================================================== */}
          <Text
            className="text-slate-400 mt-1 mb-2 text-center"
            style={{ fontSize: 11 }}
          >
            Toca una opción para guardar y cerrar
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}