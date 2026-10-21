// =====================================================================
// app/(teacher)/_components/EditAttendanceModal.jsx
// ---------------------------------------------------------------------
// Modal bottom-sheet de selección de status de asistencia.
//
// FLUJO (refactor a "1-tap picker"):
//   1. El usuario toca una de las 4 opciones (P/F/R/FJ).
//   2. El modal notifica la elección vía `onSaved(student, code)`.
//   3. El modal cierra automáticamente via `onClose()`.
//   4. La PANTALLA que lo abrió persiste el cambio (PATCH con su
//      sessionId) y actualiza su state local. La matriz (attendance/
//      index.jsx) y la vista today hacen esa persistencia — el modal
//      no llama a services (antes lo intentaba con params incorrectos
//      y el PATCH fallaba silenciosamente).
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
//   - date: { iso, full, label } — solo para el subheader.
//   - currentStatus: status code actual (highlight en la opción).
//   - onClose: cierra el modal.
//   - onSaved: (student, status) => void. La pantalla actualiza su
//     state local y persiste (PATCH con su sessionId).
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

// Avatar circular de alumno (foto → iniciales).
import StudentAvatar from '@/src/components/StudentAvatar';

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
    (code) => {
      if (!student) return;
      // Solo notifica: la pantalla que nos abrió hace el PATCH (con su
      // sessionId) y actualiza su state local en `onSaved`.
      onSaved?.(student, code, '');
      // El modal se cierra SIEMPRE — la acción es 1 tap.
      onClose?.();
    },
    [student, onSaved, onClose],
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
              {/* Avatar 44x44 circular (foto de Cloudinary o iniciales). */}
              <StudentAvatar
                uri={student?.photoUrl}
                name={student?.name || student?.fullName || ''}
                size={44}
                fallbackColor="#E0F2FE"
                textColor="#0284C7"
              />
              {/* Subheader: nombre + fecha. */}
              <View className="ml-4 flex-1">
                <Text maxFontSizeMultiplier={1.3}
                  className="text-slate-900"
                  style={{ fontSize: 15, fontWeight: '600' }}
                  numberOfLines={1}
                >
                  {student?.name || student?.fullName || 'Alumno'}
                </Text>
                <Text maxFontSizeMultiplier={1.3}
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
                    <Text maxFontSizeMultiplier={1.3}
                      style={{
                        fontSize: 15,
                        fontWeight: '800',
                        color: isCurrent ? '#ffffff' : '#64748B',
                      }}
                    >
                      {opt.code}
                    </Text>
                  </View>
                  <Text maxFontSizeMultiplier={1.3}
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: isCurrent ? opt.color : '#334155',
                      marginTop: 8,
                    }}
                  >
                    {opt.title}
                  </Text>
                  <Text maxFontSizeMultiplier={1.3}
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
          <Text maxFontSizeMultiplier={1.3}
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