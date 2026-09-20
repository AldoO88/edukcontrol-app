// =====================================================================
// src/components/TrabajoSocialModal.jsx
// ---------------------------------------------------------------------
// Modal bottom-sheet compartido (trabajador social, prefecto, teacher)
// que muestra un resumen de los datos relevantes de salud e inclusión
// del alumno: estilo de aprendizaje, diagnóstico, discapacidad,
// medicamentos y alertas.
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
  Brain,
  Pill,
  AlertTriangle,
} from 'lucide-react-native';

const ALERT_TYPE_CONFIG = {
  medica:        { color: '#DC2626', label: 'Médica' },
  comportamental: { color: '#D97706', label: 'Comportamental' },
  academica:     { color: '#0284C7', label: 'Académica' },
  otra:          { color: '#64748B', label: 'Otra' },
};

const DISABILITY_LABELS = {
  cognitiva: 'Cognitiva',
  fisica: 'Física',
  sensorial: 'Sensorial',
  multiple: 'Múltiple',
  ninguna: 'Ninguna',
};

const SEVERITY_LABELS = {
  leve: 'Leve',
  moderada: 'Moderada',
  severa: 'Severa',
};

const LEARNING_STYLE_LABELS = {
  visual: 'Visual',
  auditivo: 'Auditivo',
  kinestesico: 'Kinestésico',
  mixto: 'Mixto',
};

const TrabajoSocialModal = ({ isVisible, onClose, healthInclusion }) => {
  const hi = healthInclusion || {};

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Cerrar modal de trabajo social" />

        <View className="bg-white rounded-t-3xl" style={{ maxHeight: '85%' }}>
          <View className="items-center pt-3 pb-1">
            <View style={{ width: 40, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2 }} />
          </View>

          <ScrollView className="px-5 pb-6" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="flex-row items-center justify-between mt-2 mb-4">
              <View className="flex-row items-center flex-1">
                <View className="items-center justify-center" style={{ backgroundColor: '#D1FAE5', padding: 8, borderRadius: 12 }}>
                  <Brain size={20} color="#059669" strokeWidth={2.25} />
                </View>
                <Text className="ml-3 text-slate-900 flex-1" style={{ fontSize: 17, fontWeight: '700' }} numberOfLines={2}>
                  Trabajo Social
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cerrar" className="items-center justify-center" style={{ padding: 6 }}>
                <X size={22} color="#64748B" strokeWidth={2.25} />
              </Pressable>
            </View>

            {/* Estilo de Aprendizaje */}
            <SectionTitle>Estilo de Aprendizaje</SectionTitle>
            <InfoCard isEmpty={!hi.learning_style}>
              {hi.learning_style ? (
                <>
                  <View className="self-start px-3 py-1 rounded-full" style={{ backgroundColor: '#0284C7' }}>
                    <Text className="text-white" style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
                      {LEARNING_STYLE_LABELS[hi.learning_style] || hi.learning_style}
                    </Text>
                  </View>
                  {hi.style_hint ? (
                    <Text className="mt-2 text-slate-700" style={{ fontSize: 13, fontWeight: '500' }}>
                      {hi.style_hint}
                    </Text>
                  ) : null}
                </>
              ) : null}
            </InfoCard>

            {/* Diagnóstico */}
            <SectionTitle>Diagnóstico</SectionTitle>
            <InfoCard isEmpty={!hi.diagnosis}>
              {hi.diagnosis ? (
                <Text className="text-slate-700" style={{ fontSize: 13, fontWeight: '600' }}>
                  {hi.diagnosis}
                </Text>
              ) : null}
            </InfoCard>

            {/* Discapacidad */}
            <SectionTitle>Discapacidad</SectionTitle>
            <InfoCard isEmpty={!hi.disability_type || hi.disability_type === 'ninguna'}>
              {hi.disability_type && hi.disability_type !== 'ninguna' ? (
                <View className="flex-row items-center flex-wrap">
                  <View className="px-3 py-1 rounded-full mr-2" style={{ backgroundColor: '#E0E7FF' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#4338CA', letterSpacing: 0.5 }}>
                      {DISABILITY_LABELS[hi.disability_type] || hi.disability_type}
                    </Text>
                  </View>
                  {hi.disability_severity ? (
                    <View className="px-3 py-1 rounded-full" style={{ backgroundColor: '#FEF3C7' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#92400E', letterSpacing: 0.5 }}>
                        {SEVERITY_LABELS[hi.disability_severity] || hi.disability_severity}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </InfoCard>

            {/* Medicamentos */}
            <SectionTitle>Medicamentos</SectionTitle>
            <InfoCard isEmpty={!hi.medications || hi.medications.length === 0}>
              {hi.medications && hi.medications.length > 0 ? (
                <View className="flex-row flex-wrap">
                  {hi.medications.map((med, idx) => (
                    <View key={idx} className="flex-row items-center mr-3 mb-1">
                      <Pill size={12} color="#059669" strokeWidth={2} style={{ marginRight: 4 }} />
                      <Text className="text-slate-700" style={{ fontSize: 13, fontWeight: '500' }}>
                        {med}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </InfoCard>

            {/* Alertas */}
            <SectionTitle>Alertas</SectionTitle>
            {(!hi.alerts || hi.alerts.length === 0) ? (
              <InfoCard isEmpty>{null}</InfoCard>
            ) : (
              <View className="bg-white rounded-2xl p-2 mb-4 border border-slate-100" style={{ shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
                {hi.alerts.map((alert, index) => {
                  const config = ALERT_TYPE_CONFIG[alert.type] || ALERT_TYPE_CONFIG.otra;
                  return (
                    <View
                      key={alert._id || index}
                      className="flex-row items-center p-2"
                      style={index < hi.alerts.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' } : undefined}
                    >
                      <View
                        className="items-center justify-center"
                        style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${config.color}15` }}
                      >
                        <AlertTriangle size={16} color={config.color} strokeWidth={2.25} />
                      </View>
                      <View className="flex-1 ml-3">
                        <View className="flex-row items-center">
                          <Text className="text-slate-900" style={{ fontSize: 13, fontWeight: '700' }}>
                            {alert.label || config.label}
                          </Text>
                          <View className="ml-2 px-1.5 py-0.5 rounded" style={{ backgroundColor: `${config.color}15` }}>
                            <Text style={{ fontSize: 9, fontWeight: '700', color: config.color, textTransform: 'uppercase' }}>
                              {config.label}
                            </Text>
                          </View>
                        </View>
                        {alert.description ? (
                          <Text className="text-slate-500 mt-0.5" style={{ fontSize: 12, fontWeight: '500' }}>
                            {alert.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Boton cerrar */}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              className="items-center justify-center rounded-xl mt-2"
              style={{ backgroundColor: '#0284C7', paddingVertical: 12 }}
            >
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

const InfoCard = ({ isEmpty, children }) => (
  <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-100" style={{ shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
    {isEmpty ? (
      <Text className="text-slate-400" style={{ fontSize: 13, fontWeight: '500' }}>Sin datos registrados</Text>
    ) : children}
  </View>
);

export default TrabajoSocialModal;
