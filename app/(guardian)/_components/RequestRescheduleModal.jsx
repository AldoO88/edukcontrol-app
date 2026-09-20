// =====================================================================
// RequestRescheduleModal.jsx
// ---------------------------------------------------------------------
// Modal para que el tutor solicite la reagendación de un citatorio.
//
// Props:
//   visible    — controla la visibilidad del modal
//   onClose    — callback al cerrar el modal
//   onSubmit   — callback con el motivo (reason: string)
//   isLoading  — true durante el envío
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
} from 'react-native';

import { X, RefreshCw, CheckCircle } from 'lucide-react-native';

export default function RequestRescheduleModal({ visible, onClose, onSubmit, isLoading }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleClose = useCallback(() => {
    setReason('');
    setError(null);
    setIsSuccess(false);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!reason.trim()) {
      setError('Por favor ingresa el motivo de la reagendación.');
      return;
    }

    setError(null);
    const result = await onSubmit(reason.trim());
    if (result?.success) {
      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else {
      setError(result?.message || 'No se pudo enviar la solicitud.');
    }
  }, [reason, onSubmit, handleClose]);

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
                  style={{ backgroundColor: '#FEF3C7' }}
                >
                  <RefreshCw size={20} color="#92400E" strokeWidth={2} />
                </View>
                <Text className="text-lg font-bold text-slate-900">
                  Solicitar Reagendación
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
              {isSuccess ? (
                <View className="items-center py-6">
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: '#FEF3C7' }}
                  >
                    <CheckCircle size={32} color="#F59E0B" strokeWidth={2} />
                  </View>
                  <Text className="text-amber-700 font-bold text-base">
                    Solicitud enviada
                  </Text>
                  <Text className="text-slate-500 text-sm mt-1 text-center">
                    El docente收到 tu solicitud y decidirá la nueva fecha.
                  </Text>
                </View>
              ) : (
                <>
                  <Text className="text-sm text-slate-600 mb-4">
                    Explica por qué no puedes asistir a la fecha actual. El docente decidirá la nueva fecha de la cita.
                  </Text>

                  {/* INPUT DE MOTIVO */}
                  <View className="mb-4">
                    <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
                      Motivo de la reagendación
                    </Text>
                    <TextInput
                      value={reason}
                      onChangeText={setReason}
                      placeholder="Ej: No puedo asistir a esa hora, tengo otra cita médica..."
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
                      onPress={handleSubmit}
                      disabled={isLoading}
                      className="flex-1 bg-amber-500 py-3 rounded-xl items-center flex-row justify-center"
                      style={{
                        shadowColor: '#F59E0B',
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
                          <RefreshCw size={16} color="#ffffff" strokeWidth={2} />
                          <Text className="text-white font-semibold text-sm ml-1.5">
                            Enviar solicitud
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
