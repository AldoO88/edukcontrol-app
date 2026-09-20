// =====================================================================
// app/(teacher)/.../students/[studentId]/_components/AnnouncementsModal.jsx
// ---------------------------------------------------------------------
// Modal bottom-sheet que muestra los avisos específicos del alumno en
// el expediente de tutoría. Mismo patrón bottom-sheet que
// CitationsModal / ConductModal del mismo route group.
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
  Megaphone,
  Bell,
  Calendar,
} from 'lucide-react-native';

// ---------------------------------------------------------------------
// PRIORITY_STYLES
// ---------------------------------------------------------------------
// Los avisos tienen un campo `priority` que define si es informativo
// (azul) o urgente (rojo).
// ---------------------------------------------------------------------
const PRIORITY_STYLES = {
  urgent:    { bg: '#FEF2F2', fg: '#DC2626', label: 'Urgente' },
  normal:    { bg: '#EFF6FF', fg: '#2563EB', label: 'Informativo' },
  info:      { bg: '#EFF6FF', fg: '#2563EB', label: 'Informativo' },
  default:   { bg: '#EFF6FF', fg: '#2563EB', label: 'Informativo' },
};

const AnnouncementsModal = ({ isVisible, onClose, announcements }) => {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Pressable
          className="flex-1"
          onPress={onClose}
          accessibilityLabel="Cerrar modal de avisos"
        />

        <View className="bg-white rounded-t-3xl" style={{ maxHeight: '85%' }}>
          {/* Drag handle. */}
          <View className="items-center pt-3 pb-1">
            <View
              style={{ width: 40, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2 }}
            />
          </View>

          <ScrollView
            className="px-5 pb-6"
            showsVerticalScrollIndicator={false}
          >
            {/* Header. */}
            <View className="flex-row items-center justify-between mt-2 mb-4">
              <View className="flex-row items-center flex-1">
                <View
                  className="items-center justify-center"
                  style={{ backgroundColor: '#EFF6FF', padding: 8, borderRadius: 12 }}
                >
                  <Megaphone size={20} color="#0284C7" strokeWidth={2.25} />
                </View>
                <Text
                  className="ml-3 text-slate-900 flex-1"
                  style={{ fontSize: 17, fontWeight: '700' }}
                >
                  Avisos
                </Text>
                {announcements.length > 0 && (
                  <View
                    className="px-2.5 py-1 rounded-full ml-2"
                    style={{ backgroundColor: '#BAE6FD' }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '800',
                        color: '#0369A1',
                      }}
                    >
                      {announcements.length}
                    </Text>
                  </View>
                )}
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                className="items-center justify-center"
                style={{ padding: 6 }}
              >
                <X size={22} color="#64748B" strokeWidth={2.25} />
              </Pressable>
            </View>

            {/* Lista de avisos. */}
            {announcements.length > 0 ? (
              <View
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
                style={{
                  shadowColor: '#0F172A',
                  shadowOpacity: 0.04,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 1,
                }}
              >
                {announcements.map((aviso, idx) => {
                  const style = PRIORITY_STYLES[aviso.priority] || PRIORITY_STYLES.normal;
                  const isUrgent = aviso.priority === 'urgent';
                  const createdDate = aviso.createdAt
                    ? new Date(aviso.createdAt).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '';
                  return (
                    <View
                      key={aviso._id || idx}
                      className="px-4 py-3"
                      style={
                        idx < announcements.length - 1
                          ? { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }
                          : undefined
                      }
                    >
                      {/* Fila superior: icono + prioridad. */}
                      <View className="flex-row items-center">
                        <View
                          className="items-center justify-center"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: style.bg,
                          }}
                        >
                          {isUrgent ? (
                            <Bell size={14} color={style.fg} strokeWidth={2.5} />
                          ) : (
                            <Megaphone size={14} color={style.fg} strokeWidth={2.5} />
                          )}
                        </View>
                        <View
                          className="px-2 py-0.5 rounded-full ml-2"
                          style={{ backgroundColor: style.bg }}
                        >
                          <Text
                            style={{
                              fontSize: 9,
                              fontWeight: '700',
                              color: style.fg,
                              letterSpacing: 0.3,
                            }}
                          >
                            {style.label}
                          </Text>
                        </View>
                      </View>

                      {/* Título del aviso. */}
                      <Text
                        className="text-slate-900 mt-2"
                        style={{ fontSize: 13, fontWeight: '600' }}
                        numberOfLines={1}
                      >
                        {aviso.title}
                      </Text>

                      {/* Mensaje truncado. */}
                      <Text
                        className="text-slate-500 mt-0.5"
                        style={{ fontSize: 12, fontWeight: '400' }}
                        numberOfLines={2}
                      >
                        {aviso.message}
                      </Text>

                      {/* Fecha + remitente. */}
                      <View className="flex-row items-center mt-1.5">
                        <View className="flex-row items-center">
                          <Calendar size={11} color="#94A3B8" strokeWidth={2} />
                          <Text
                            className="text-slate-400 ml-1"
                            style={{ fontSize: 11, fontWeight: '500' }}
                          >
                            {createdDate}
                          </Text>
                        </View>
                        {aviso.sender && (
                          <Text
                            className="text-slate-400 ml-auto"
                            style={{ fontSize: 10, fontWeight: '500' }}
                          >
                            {aviso.sender.name}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View
                className="bg-white rounded-2xl p-6 items-center border border-slate-100"
                style={{
                  shadowColor: '#0F172A',
                  shadowOpacity: 0.04,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 1,
                }}
              >
                <Megaphone size={24} color="#CBD5E1" strokeWidth={1.5} />
                <Text
                  className="text-slate-500 mt-2"
                  style={{ fontSize: 13, fontWeight: '500' }}
                >
                  Sin avisos registrados
                </Text>
              </View>
            )}

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              className="items-center justify-center rounded-xl mt-4"
              style={{ backgroundColor: '#0284C7', paddingVertical: 12 }}
            >
              <Text
                className="text-white"
                style={{ fontSize: 14, fontWeight: '700' }}
              >
                Cerrar
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default AnnouncementsModal;
