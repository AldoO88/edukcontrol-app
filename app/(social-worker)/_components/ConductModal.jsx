// =====================================================================
// app/(social-worker)/_components/ConductModal.jsx
// ---------------------------------------------------------------------
// Modal bottom-sheet que muestra el score de conducta del alumno
// (barra de progreso 0-100) y el historial de reportes.
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
  TrendingUp,
  XCircle,
  AlertTriangle,
} from 'lucide-react-native';

const ConductModal = ({ isVisible, onClose, conductLogs, conductConfig }) => {
  const baseline = conductConfig?.baseline || 100;

  // Calcular score actual (points_impact siempre positivo, eventType define signo)
  const signedTotal = (conductLogs || []).reduce((acc, log) => {
    if (log.status === 'cancelled') return acc;
    const impact = log.points_impact || 0;
    return acc + (log.eventType === 'merit' ? impact : -impact);
  }, 0);
  const currentScore = Math.max(0, Math.min(baseline, baseline + signedTotal));

  // Porcentaje para la barra
  const percentage = baseline > 0 ? (currentScore / baseline) * 100 : 0;

  // Color del score según porcentaje
  const getScoreColor = (pct) => {
    if (pct >= 80) return '#059669';
    if (pct >= 60) return '#D97706';
    return '#DC2626';
  };
  const scoreColor = getScoreColor(percentage);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Cerrar modal de conducta" />

        <View className="bg-white rounded-t-3xl" style={{ maxHeight: '85%' }}>
          <View className="items-center pt-3 pb-1">
            <View style={{ width: 40, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2 }} />
          </View>

          <ScrollView className="px-5 pb-6" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="flex-row items-center justify-between mt-2 mb-4">
              <View className="flex-row items-center flex-1">
                <View className="items-center justify-center" style={{ backgroundColor: '#FEF2F2', padding: 8, borderRadius: 12 }}>
                  <TrendingUp size={20} color="#DC2626" strokeWidth={2.25} />
                </View>
                <Text className="ml-3 text-slate-900 flex-1" style={{ fontSize: 17, fontWeight: '700' }}>
                  Conducta
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cerrar" className="items-center justify-center" style={{ padding: 6 }}>
                <X size={22} color="#64748B" strokeWidth={2.25} />
              </Pressable>
            </View>

            {/* Score Card */}
            <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-100 items-center" style={{ shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
              <Text className="text-slate-500 mb-2" style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Score de Conducta
              </Text>
              <Text style={{ fontSize: 40, fontWeight: '800', color: scoreColor }}>
                {currentScore}
              </Text>
              <Text className="text-slate-400 mt-0.5" style={{ fontSize: 12, fontWeight: '500' }}>
                de {baseline} puntos
              </Text>

              {/* Barra de progreso */}
              <View className="w-full mt-3" style={{ height: 8, backgroundColor: '#F1F5F9', borderRadius: 4 }}>
                <View style={{ width: `${percentage}%`, height: 8, backgroundColor: scoreColor, borderRadius: 4 }} />
              </View>

              {/* Leyenda */}
              <View className="flex-row justify-between w-full mt-2">
                <Text className="text-slate-400" style={{ fontSize: 10 }}>0</Text>
                <Text className="text-slate-400" style={{ fontSize: 10 }}>{baseline}</Text>
              </View>
            </View>

            {/* Estadísticas */}
            {(() => {
              const demerits = conductLogs.filter(l => l.eventType === 'demerit' && l.status !== 'cancelled');
              const merits = conductLogs.filter(l => l.eventType === 'merit' && l.status !== 'cancelled');
              const demeritsCount = demerits.length;
              const meritsCount = merits.length;
              const demeritsPoints = demerits.reduce((acc, l) => acc + (l.points_impact || 0), 0);
              const meritsPoints = merits.reduce((acc, l) => acc + (l.points_impact || 0), 0);
              const netPoints = meritsPoints - demeritsPoints;

              if (demeritsCount === 0 && meritsCount === 0) return null;

              return (
                <View className="mb-4">
                  <Text className="text-slate-500 mb-2" style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Resumen
                  </Text>
                  <View className="flex-row" style={{ gap: 8 }}>
                    <View className="flex-1 bg-white rounded-2xl p-3 border border-slate-100 items-center" style={{ elevation: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#DC2626', textTransform: 'uppercase' }}>Deméritos</Text>
                      <Text style={{ fontSize: 28, fontWeight: '800', color: '#DC2626' }}>{demeritsCount}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '500', color: '#94A3B8' }}>-{demeritsPoints} pts</Text>
                    </View>
                    <View className="flex-1 bg-white rounded-2xl p-3 border border-slate-100 items-center" style={{ elevation: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#059669', textTransform: 'uppercase' }}>Méritos</Text>
                      <Text style={{ fontSize: 28, fontWeight: '800', color: '#059669' }}>{meritsCount}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '500', color: '#94A3B8' }}>+{meritsPoints} pts</Text>
                    </View>
                  </View>
                  <View className="items-center mt-2">
                    <Text style={{ fontSize: 11, fontWeight: '600', color: netPoints >= 0 ? '#059669' : '#DC2626' }}>
                      Neto: {netPoints >= 0 ? '+' : ''}{netPoints} puntos
                    </Text>
                  </View>
                </View>
              );
            })()}

            {/* Historial de reportes */}
            <Text className="text-slate-500 mt-2 mb-2" style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Historial de Reportes
            </Text>

            {conductLogs.length > 0 ? (
              <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
                {conductLogs.map((log, idx) => {
                  const isMerit = log.eventType === 'merit';
                  return (
                    <View key={log._id || idx} className="flex-row items-start px-4 py-3" style={idx < conductLogs.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' } : undefined}>
                      <View className="items-center justify-center mt-0.5" style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isMerit ? '#D1FAE5' : '#FEF2F2' }}>
                        {isMerit ? (
                          <TrendingUp size={14} color="#059669" strokeWidth={2.5} />
                        ) : (
                          <XCircle size={14} color="#DC2626" strokeWidth={2.5} />
                        )}
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="text-slate-900" style={{ fontSize: 13, fontWeight: '600' }} numberOfLines={2}>
                          {log.description || 'Sin descripción'}
                        </Text>
                        <Text className="text-slate-400 mt-0.5" style={{ fontSize: 11, fontWeight: '500' }}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        </Text>
                      </View>
                      {log.points_impact != null && (
                        <Text className={`text-xs font-bold ml-2 ${log.eventType === 'demerit' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {log.eventType === 'merit' ? '+' : '-'}{log.points_impact}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View className="bg-white rounded-2xl p-6 items-center border border-slate-100" style={{ shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}>
                <AlertTriangle size={24} color="#10B981" strokeWidth={1.5} />
                <Text className="text-slate-500 mt-2" style={{ fontSize: 13, fontWeight: '500' }}>Sin reportes de conducta</Text>
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

export default ConductModal;
