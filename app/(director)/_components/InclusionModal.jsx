// =====================================================================
// app/(director)/_components/InclusionModal.jsx
// ---------------------------------------------------------------------
// Modal bottom-sheet que muestra la Ficha de Inclusión y Salud del
// alumno. Copia del prefect adaptada para el trabajador social.
// =====================================================================

import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import {
  X,
  Eye,
  Brain,
  Stethoscope,
  Puzzle,
  AlertCircle,
} from 'lucide-react-native';

const ALERT_CONFIG = {
  visual:  { Icon: Eye,         color: '#0EA5E9' },
  aud:     { Icon: AlertCircle, color: '#D97706' },
  medical: { Icon: Stethoscope, color: '#DC2626' },
  usaer:   { Icon: Puzzle,      color: '#7C3AED' },
};

const InclusionModal = ({ isVisible, onClose, pedagogical }) => {
  const physicalSensoryAlerts = (pedagogical?.alerts || []).filter(
    (a) => a.type === 'visual' || a.type === 'aud',
  );
  const specialAttentionAlerts = (pedagogical?.alerts || []).filter(
    (a) => a.type === 'medical' || a.type === 'usaer',
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
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Cerrar modal de inclusión" />

        <View className="bg-white rounded-t-3xl" style={{ maxHeight: '85%' }}>
          <View className="items-center pt-3 pb-1">
            <View style={{ width: 40, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2 }} />
          </View>

          <ScrollView className="px-5 pb-6" showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center justify-between mt-2 mb-4">
              <View className="flex-row items-center flex-1">
                <View className="items-center justify-center" style={{ backgroundColor: '#D1FAE5', padding: 8, borderRadius: 12 }}>
                  <Eye size={20} color="#059669" strokeWidth={2.25} />
                </View>
                <Text className="ml-3 text-slate-900 flex-1" style={{ fontSize: 17, fontWeight: '700' }} numberOfLines={2}>
                  Ficha de Inclusión y Salud
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cerrar" className="items-center justify-center" style={{ padding: 6 }}>
                <X size={22} color="#64748B" strokeWidth={2.25} />
              </Pressable>
            </View>

            <SectionTitle>Estilo de Aprendizaje</SectionTitle>
            <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-100" style={{ shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              {pedagogical?.learningStyle ? (
                <>
                  <View className="self-start px-3 py-1 rounded-full" style={{ backgroundColor: '#0284C7' }}>
                    <Text className="text-white" style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
                      {pedagogical.learningStyle}
                    </Text>
                  </View>
                  <Text className="mt-2 text-slate-700" style={{ fontSize: 13, fontWeight: '500' }}>
                    {pedagogical.styleHint}
                  </Text>
                </>
              ) : (
                <Text className="text-slate-400" style={{ fontSize: 13, fontWeight: '500' }}>Sin datos registrados</Text>
              )}
            </View>

            <SectionTitle>Consideración Físico/Sensorial</SectionTitle>
            <AlertList alerts={physicalSensoryAlerts} emptyText="Sin alertas registradas" />

            <SectionTitle>Atención Especial / USAER</SectionTitle>
            <AlertList alerts={specialAttentionAlerts} emptyText="Sin alertas registradas" />

            {pedagogical?.allergies ? (
              <>
                <SectionTitle>Alergias o Cuidados Especiales</SectionTitle>
                <View className="rounded-xl p-3 mb-4 flex-row items-center" style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' }}>
                  <AlertCircle size={18} color="#DC2626" strokeWidth={2.25} />
                  <Text className="flex-1 ml-3 text-rose-900" style={{ fontSize: 13, fontWeight: '600' }}>
                    {pedagogical.allergies}
                  </Text>
                </View>
              </>
            ) : null}

            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" className="items-center justify-center rounded-xl mt-2" style={{ backgroundColor: '#0284C7', paddingVertical: 12 }}>
              <Text className="text-white" style={{ fontSize: 14, fontWeight: '700' }}>Cerrar</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const SectionTitle = ({ children }) => (
  <Text className="text-slate-500 mt-4 mb-2" style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
    {children}
  </Text>
);

const AlertList = ({ alerts, emptyText }) => {
  if (alerts.length === 0) {
    return (
      <View className="bg-white rounded-2xl p-6 items-center mb-4 border border-slate-100" style={{ shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
        <Text className="text-slate-500" style={{ fontSize: 13, fontWeight: '600' }}>{emptyText}</Text>
      </View>
    );
  }
  return (
    <View className="bg-white rounded-2xl p-2 mb-4 border border-slate-100" style={{ shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
      {alerts.map((alert, index) => {
        const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.aud;
        const { Icon, color } = config;
        return (
          <View key={alert.id} className="flex-row items-center p-2" style={index < alerts.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' } : undefined}>
            <View className="items-center justify-center" style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${color}15` }}>
              <Icon size={20} color={color} strokeWidth={2.25} />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-slate-900" style={{ fontSize: 13, fontWeight: '700' }}>{alert.title}</Text>
              <Text className="text-slate-500 mt-0.5" style={{ fontSize: 12, fontWeight: '500' }}>{alert.subtitle}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default InclusionModal;
