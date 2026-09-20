// =====================================================================
// app/(social-worker)/_components/CitationsModal.jsx
// ---------------------------------------------------------------------
// Modal bottom-sheet que muestra todos los citatorios del alumno.
// Estilo inspirado en InclusionModal del teacher.
// =====================================================================

import React, { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import {
  X,
  FileText,
  AlertTriangle,
  Calendar,
} from 'lucide-react-native';

const CITATION_TYPE_STYLES = {
  behavioral:     { bg: '#FEF2F2', fg: '#DC2626', label: 'Conductual' },
  academic:       { bg: '#EFF6FF', fg: '#2563EB', label: 'Académico' },
  administrative: { bg: '#FEF3C7', fg: '#D97706', label: 'Administrativo' },
};

const CITATION_STATUS_STYLES = {
  pending:   { bg: '#FEF3C7', fg: '#92400E', label: 'Pendiente' },
  confirmed: { bg: '#DBEAFE', fg: '#1E40AF', label: 'Confirmado' },
  completed: { bg: '#D1FAE5', fg: '#065F46', label: 'Atendido' },
  no_show:   { bg: '#FEE2E2', fg: '#991B1B', label: 'Inasistió' },
  cancelled: { bg: '#F1F5F9', fg: '#64748B', label: 'Cancelado' },
};

const CitationsModal = ({ isVisible, onClose, citations }) => {
  const activeCitations = useMemo(
    () => citations.filter(c => c.status !== 'cancelled'),
    [citations]
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Cerrar modal de citatorios" />

        <View className="bg-white rounded-t-3xl" style={{ maxHeight: '85%' }}>
          <View className="items-center pt-3 pb-1">
            <View style={{ width: 40, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2 }} />
          </View>

          <ScrollView className="px-5 pb-6" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="flex-row items-center justify-between mt-2 mb-4">
              <View className="flex-row items-center flex-1">
                <View className="items-center justify-center" style={{ backgroundColor: '#FEF3C7', padding: 8, borderRadius: 12 }}>
                  <FileText size={20} color="#D97706" strokeWidth={2.25} />
                </View>
                <Text className="ml-3 text-slate-900 flex-1" style={{ fontSize: 17, fontWeight: '700' }}>
                  Citatorios
                </Text>
                {activeCitations.length > 0 && (
                  <View className="px-2.5 py-1 rounded-full ml-2" style={{ backgroundColor: '#FED7AA' }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#C2410C' }}>
                      {activeCitations.length}
                    </Text>
                  </View>
                )}
              </View>
              <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cerrar" className="items-center justify-center" style={{ padding: 6 }}>
                <X size={22} color="#64748B" strokeWidth={2.25} />
              </Pressable>
            </View>

            {/* Lista de citatorios */}
            {activeCitations.length > 0 ? (
              <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
                {activeCitations.map((citation, idx) => {
                  const typeStyle = CITATION_TYPE_STYLES[citation.type] || CITATION_TYPE_STYLES.behavioral;
                  const statusStyle = CITATION_STATUS_STYLES[citation.status] || CITATION_STATUS_STYLES.pending;
                  const scheduledDate = citation.scheduledDate
                    ? new Date(citation.scheduledDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '';
                  return (
                    <View key={citation._id || idx} className="px-4 py-3" style={idx < activeCitations.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' } : undefined}>
                      <View className="flex-row items-center">
                        <View className="items-center justify-center" style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: typeStyle.bg }}>
                          <AlertTriangle size={14} color={typeStyle.fg} strokeWidth={2.5} />
                        </View>
                        <View className="px-2 py-0.5 rounded-full ml-2" style={{ backgroundColor: typeStyle.bg }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: typeStyle.fg, letterSpacing: 0.3 }}>{typeStyle.label}</Text>
                        </View>
                        <View className="px-2 py-0.5 rounded-full ml-auto" style={{ backgroundColor: statusStyle.bg }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: statusStyle.fg, letterSpacing: 0.3 }}>{statusStyle.label}</Text>
                        </View>
                      </View>
                      <Text className="text-slate-900 mt-2" style={{ fontSize: 13, fontWeight: '600' }} numberOfLines={2}>
                        {citation.reason || citation.subject?.name || 'Sin asunto'}
                      </Text>
                      <View className="flex-row items-center mt-1.5">
                        <Calendar size={11} color="#94A3B8" strokeWidth={2} />
                        <Text className="text-slate-400 ml-1" style={{ fontSize: 11, fontWeight: '500' }}>{scheduledDate}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View className="bg-white rounded-2xl p-6 items-center border border-slate-100" style={{ shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
                <FileText size={24} color="#CBD5E1" strokeWidth={1.5} />
                <Text className="text-slate-500 mt-2" style={{ fontSize: 13, fontWeight: '500' }}>Sin citatorios registrados</Text>
              </View>
            )}

            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" className="items-center justify-center rounded-xl mt-4" style={{ backgroundColor: '#0284C7', paddingVertical: 12 }}>
              <Text className="text-white" style={{ fontSize: 14, fontWeight: '700' }}>Cerrar</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default CitationsModal;
