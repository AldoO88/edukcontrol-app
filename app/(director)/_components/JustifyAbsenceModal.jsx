// =====================================================================
// app/(director)/_components/JustifyAbsenceModal.jsx
// ---------------------------------------------------------------------
// Modal para justificar una inasistencia desde la pantalla de
// justificantes del trabajador social.
//
// Props:
//   visible    — controla la visibilidad del modal
//   onClose    — callback al cerrar el modal
//   absence    — objeto con la inasistencia (student_id, group_id, date, etc.)
//   onJustified — callback después de justificar exitosamente
// =====================================================================

import React, { useState, useCallback } from 'react';

import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { X, FileCheck, CheckCircle } from 'lucide-react-native';

import { justifyAttendanceLog } from '@/src/services/directorService';

// ---------------------------------------------------------------------
// COMPONENTE
// ---------------------------------------------------------------------
export default function JustifyAbsenceModal({ visible, onClose, absence, onJustified }) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // --- Datos del alumno ---
  const student = absence?.student_id || {};
  const group = absence?.group_id || {};
  const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
  const groupLabel = group.grade && group.section ? `${group.grade}° ${group.section}` : '';

  // --- Formatear fecha ---
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('es', { month: 'long' });
    const year = d.getFullYear();
    return `${day} de ${month} ${year}`;
  };

  const dateStr = formatDate(absence?.date || absence?.createdAt);

  // --- Reset al abrir/cerrar ---
  const handleClose = useCallback(() => {
    setReason('');
    setError(null);
    setIsSuccess(false);
    onClose();
  }, [onClose]);

  // --- Justificar ---
  const handleJustify = useCallback(async () => {
    if (!reason.trim()) {
      setError('Por favor ingresa un motivo.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await justifyAttendanceLog(absence._id, reason.trim());
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onJustified();
          handleClose();
        }, 1200);
      } else {
        setError(result.message || 'No se pudo justificar la inasistencia.');
      }
    } catch {
      setError('Error inesperado al justificar.');
    } finally {
      setIsLoading(false);
    }
  }, [absence, reason, onJustified, handleClose]);

  if (!absence) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
        >
          <Pressable
            onPress={handleClose}
            className="absolute inset-0"
            accessibilityLabel="Cerrar modal"
          />

          <View
            className="bg-white rounded-2xl mx-6 w-full max-w-md"
            style={{
              elevation: 10,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 10 },
            }}
          >
            {/* HEADER */}
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: '#FFF1F2' }}
                >
                  <FileCheck size={20} color="#e11d48" strokeWidth={2} />
                </View>
                <Text className="text-lg font-bold text-slate-900">
                  Justificar inasistencia
                </Text>
              </View>
              <Pressable
                onPress={handleClose}
                hitSlop={8}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: '#F1F5F9' }}
              >
                <X size={16} color="#64748b" strokeWidth={2} />
              </Pressable>
            </View>

            {/* CONTENIDO */}
            <View className="px-5 pb-5">
              {/* Info del alumno */}
              <View
                className="bg-slate-50 rounded-xl p-4 mb-4"
                style={{ borderWidth: 1, borderColor: '#E2E8F0' }}
              >
                <Text className="text-xs font-bold text-slate-500 uppercase mb-1">
                  Alumno
                </Text>
                <Text className="text-sm font-bold text-slate-900">
                  {studentName || 'Desconocido'}
                </Text>
                {groupLabel ? (
                  <Text className="text-xs text-slate-500 mt-0.5">
                    Grupo: {groupLabel}
                  </Text>
                ) : null}
                {dateStr ? (
                  <Text className="text-xs text-slate-500 mt-0.5">
                    Fecha: {dateStr}
                  </Text>
                ) : null}
              </View>

              {/* Estado de éxito */}
              {isSuccess ? (
                <View className="items-center py-6">
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: '#F0FDF4' }}
                  >
                    <CheckCircle size={32} color="#22c55e" strokeWidth={2} />
                  </View>
                  <Text className="text-emerald-700 font-bold text-base">
                    Justificada correctamente
                  </Text>
                  <Text className="text-slate-500 text-sm mt-1">
                    La inasistencia fue justificada.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Input de motivo */}
                  <View className="mb-4">
                    <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
                      Motivo del justificante
                    </Text>
                    <TextInput
                      value={reason}
                      onChangeText={setReason}
                      placeholder="Motivo del justificante..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900"
                      style={{
                        borderWidth: 1,
                        borderColor: error ? '#FECACA' : '#E2E8F0',
                        minHeight: 100,
                      }}
                      editable={!isLoading}
                    />
                    {error ? (
                      <Text className="text-rose-600 text-xs mt-1">{error}</Text>
                    ) : null}
                  </View>

                  {/* BOTONES */}
                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={handleClose}
                      disabled={isLoading}
                      className="flex-1 bg-slate-100 py-3 rounded-xl items-center"
                    >
                      <Text className="text-slate-700 font-semibold text-sm">
                        Cancelar
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleJustify}
                      disabled={isLoading}
                      className="flex-1 bg-rose-500 py-3 rounded-xl items-center flex-row justify-center"
                      style={{
                        shadowColor: '#e11d48',
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 3,
                        opacity: isLoading ? 0.7 : 1,
                      }}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <FileCheck size={16} color="#ffffff" strokeWidth={2} />
                          <Text className="text-white font-semibold text-sm ml-1.5">
                            Justificar
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
