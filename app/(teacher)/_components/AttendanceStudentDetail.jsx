// =====================================================================
// app/(teacher)/_components/AttendanceStudentDetail.jsx
// ---------------------------------------------------------------------
// Modal de detalle de inasistencias de un alumno.
//
// Se abre al tocar un alumno en la lista "Top absent students"
// de la pantalla de Resumen de Asistencia.
//
// Props:
//   - isVisible: boolean
//   - onClose: () => void
//   - student: { studentId, name, group, absences, groupId }
//   - onCreateCitation: (student) => void
//
// Flujo:
//   1. Al abrir, fetch historial del alumno (mock).
//   2. Muestra lista de inasistencias con fecha/status/materia.
//   3. Botón "Crear Citatorio" → llama onCreateCitation
//      (el padre abre GenerateCitationModal en modo directo).
// =====================================================================

import React, { useEffect, useState } from 'react';

import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { X, User, AlertTriangle } from 'lucide-react-native';

import { getAttendanceStudentHistory } from '@/src/services/teacherService';

// ---------------------------------------------------------------------
// STATUS_STYLES — colores por tipo de inasistencia
// ---------------------------------------------------------------------
const STATUS_STYLES = {
  falta: { label: 'Falta', color: '#B91C1C', bg: '#FEE2E2', icon: '✕' },
  retardo: { label: 'Retardo', color: '#B45309', bg: '#FEF3C7', icon: '⏰' },
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
const AttendanceStudentDetail = ({
  isVisible,
  onClose,
  student,
  onCreateCitation,
}) => {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);

  // ============================================================
  // FETCH: historial del alumno al abrir
  // ============================================================
  useEffect(() => {
    if (!isVisible || !student?._id) {
      setHistory(null);
      return;
    }

    let cancelled = false;
    const fetchHistory = async () => {
      setLoading(true);
      const result = await getAttendanceStudentHistory(student._id);
      if (cancelled) return;
      if (result.success) {
        setHistory(result.data);
      }
      setLoading(false);
    };
    fetchHistory();
    return () => { cancelled = true; };
  }, [isVisible, student?._id]);

  // ============================================================
  // HANDLER: crear citatorio
  // ============================================================
  const handleCreateCitation = () => {
    if (student) {
      onCreateCitation(student);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}
      >
        <Pressable className="flex-1" onPress={onClose} />

        <View
          className="bg-white rounded-t-3xl"
          style={{
            maxHeight: '80%',
            paddingBottom: insets.bottom + 16,
          }}
        >
          {/* ================================================
              HEADER
              ================================================ */}
          <View
            className="flex-row items-center px-5 pt-5 pb-3"
            style={{ borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
          >
            <View
              className="items-center justify-center"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#FEE2E2',
              }}
            >
              <User size={18} color="#B91C1C" strokeWidth={2.25} />
            </View>
            <View className="flex-1 ml-3">
              <Text
                className="text-slate-900"
                style={{ fontSize: 16, fontWeight: '700' }}
                numberOfLines={1}
              >
                {student?.fullName || 'Alumno'}
              </Text>
              <Text
                className="text-slate-500 mt-0.5"
                style={{ fontSize: 12, fontWeight: '500' }}
                numberOfLines={1}
              >
                {student?.originGroup || '—'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="items-center justify-center"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#F1F5F9',
              }}
              accessibilityLabel="Cerrar"
            >
              <X size={16} color="#475569" strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* ================================================
              SUMMARY PILL
              ================================================ */}
          <View className="flex-row items-center px-5 py-3">
            <View
              className="px-3 py-1.5 rounded-full"
              style={{ backgroundColor: '#FEE2E2' }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: '#B91C1C',
                }}
              >
                {`${student?.absenceCount || 0} inasistencias en el período`}
              </Text>
            </View>
          </View>

          {/* ================================================
              CONTENT
              ================================================ */}
          <ScrollView
            className="px-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {/* Loading. */}
            {loading && (
              <View className="items-center py-10">
                <ActivityIndicator size="large" color="#0284C7" />
                <Text className="text-slate-400 text-sm mt-3">
                  Cargando historial...
                </Text>
              </View>
            )}

            {/* Lista de historial. */}
            {!loading && history && (
              <>
                <Text
                  className="text-slate-500 mb-2"
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Historial de inasistencias
                </Text>
                <View
                  className="bg-white rounded-2xl border border-slate-100"
                  style={{
                    shadowColor: '#0F172A',
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 1,
                  }}
                >
                  {history.history.length === 0 && (
                    <Text className="text-slate-400 text-center text-sm py-6">
                      No hay inasistencias registradas.
                    </Text>
                  )}
                  {history.history.map((item, index) => {
                    const isLast = index === history.history.length - 1;
                    const style = STATUS_STYLES[item.status] || STATUS_STYLES.falta;
                    return (
                      <View
                        key={`${item.date}-${index}`}
                        className="flex-row items-center px-4 py-3"
                        style={
                          !isLast
                            ? {
                                borderBottomWidth: 1,
                                borderBottomColor: '#F1F5F9',
                              }
                            : undefined
                        }
                      >
                        {/* Status icon. */}
                        <View
                          className="items-center justify-center"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: style.bg,
                          }}
                        >
                          <Text style={{ fontSize: 11 }}>{style.icon}</Text>
                        </View>

                        {/* Date + subject. */}
                        <View className="flex-1 ml-3">
                          <Text
                            className="text-slate-900"
                            style={{ fontSize: 13, fontWeight: '600' }}
                          >
                            {item.date}
                          </Text>
                          <Text
                            className="text-slate-500 mt-0.5"
                            style={{ fontSize: 11, fontWeight: '500' }}
                          >
                            {item.subject}
                          </Text>
                        </View>

                        {/* Status pill. */}
                        <View
                          className="px-2 py-1 rounded-full"
                          style={{ backgroundColor: style.bg }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '700',
                              color: style.color,
                            }}
                          >
                            {style.label}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </ScrollView>

          {/* ================================================
              FOOTER: Crear Citatorio
              ================================================ */}
          <View
            className="px-5 pt-3"
            style={{
              borderTopWidth: 1,
              borderTopColor: '#F1F5F9',
            }}
          >
            <Pressable
              onPress={handleCreateCitation}
              className="flex-row items-center justify-center py-3 rounded-xl"
              style={{ backgroundColor: '#0284C7' }}
              accessibilityRole="button"
              accessibilityLabel={`Crear citatorio para ${student?.fullName}`}
            >
              <AlertTriangle size={16} color="#FFFFFF" strokeWidth={2.25} />
              <Text
                className="ml-2"
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: '#FFFFFF',
                }}
              >
                Crear Citatorio
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AttendanceStudentDetail;
