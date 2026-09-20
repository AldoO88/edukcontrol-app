// =====================================================================
// src/components/NotificationBell.jsx
// =====================================================================
// Campanita de notificaciones con dropdown.
// Se integra en el DashboardHeader de todos los roles.
//
// Comportamiento:
//   - Tap en la campana → toggle del dropdown.
//   - Dropdown muestra últimas 20 notificaciones (NotificationItem).
//   - "Marcar todas como leídas" en el footer del dropdown.
//   - Tap en un item → marca como leída + navega al deep link.
//   - Badge rojo con count de no leídas (oculto si count === 0).
// =====================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Bell, X, CheckCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useNotifications } from '@/src/hooks/useNotifications';
import { useAuth } from '@/src/hooks/useAuth';
import notificationDataToRoute from '@/src/utils/notificationData';
import NotificationItem from './_items/NotificationItem';

// Helper: muestra "9+" si count > 9.
const formatBadgeCount = (count) => {
  if (!count || count <= 0) return null;
  if (count > 9) return '9+';
  return String(count);
};

const NotificationBell = () => {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role || null;
  const isAuthed = !!user;

  const {
    notifications,
    unreadCount,
    isLoading,
    refresh,
    markAsRead,
    markAllAsRead,
  } = useNotifications(isAuthed);

  const [isOpen, setIsOpen] = useState(false);

  // Cerrar el dropdown si el usuario hace logout mientras está abierto.
  useEffect(() => {
    if (!isAuthed) setIsOpen(false);
  }, [isAuthed]);

  // Tap en una notificación: marca como leída + navega al deep link + cierra.
  const handleItemPress = async (notification) => {
    // Marcar como leída (no await — la UI no necesita esperar).
    if (!notification.read_at) {
      markAsRead(notification._id);
    }

    // Cerrar dropdown.
    setIsOpen(false);

    // Navegar al deep link según el `data.kind`.
    const route = notificationDataToRoute(notification.data, role);
    if (route) {
      try {
        router.push(route);
      } catch (navErr) {
        console.error('[NotificationBell] Navigation failed:', navErr);
      }
    }
  };

  const badge = formatBadgeCount(unreadCount);

  return (
    <>
      {/* Botón de la campana */}
      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`Notificaciones. ${unreadCount} no leídas.`}
        className="items-center justify-center"
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#F1F5F9',
        }}
      >
        <Bell size={20} color="#475569" strokeWidth={2} />
        {badge && (
          <View
            className="absolute items-center justify-center"
            style={{
              top: 0,
              right: 0,
              minWidth: 18,
              height: 18,
              paddingHorizontal: 4,
              borderRadius: 9,
              backgroundColor: '#EF4444',
              borderWidth: 2,
              borderColor: '#F8FAFC',
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: '800',
                lineHeight: 12,
              }}
            >
              {badge}
            </Text>
          </View>
        )}
      </Pressable>

      {/* Dropdown modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
        statusBarTranslucent
      >
        <Pressable
          className="flex-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onPress={() => setIsOpen(false)}
          accessibilityLabel="Cerrar panel de notificaciones"
        >
          <View className="flex-1" />

          {/* Panel del dropdown — anclado arriba a la derecha */}
          <View
            className="absolute bg-white rounded-2xl overflow-hidden"
            style={{
              top: 60,
              right: 16,
              left: 16,
              maxHeight: '70%',
              shadowColor: '#0F172A',
              shadowOpacity: 0.15,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            }}
          >
            {/* Header del dropdown */}
            <View
              className="flex-row items-center justify-between px-4 py-3"
              style={{ borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#0F172A',
                }}
              >
                Notificaciones
              </Text>
              <Pressable
                onPress={() => setIsOpen(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                style={{ padding: 4 }}
              >
                <X size={20} color="#64748B" strokeWidth={2} />
              </Pressable>
            </View>

            {/* Lista */}
            {isLoading && notifications.length === 0 ? (
              <View className="items-center justify-center py-12">
                <ActivityIndicator size="large" color="#0EA5E9" />
                <Text className="text-slate-400 mt-2" style={{ fontSize: 13 }}>
                  Cargando notificaciones...
                </Text>
              </View>
            ) : notifications.length === 0 ? (
              <View className="items-center justify-center py-12 px-6">
                <Bell size={36} color="#CBD5E1" strokeWidth={1.5} />
                <Text
                  className="text-slate-500 mt-3 text-center"
                  style={{ fontSize: 13, fontWeight: '500' }}
                >
                  No tienes notificaciones aún.
                </Text>
                <Text
                  className="text-slate-400 mt-1 text-center"
                  style={{ fontSize: 11 }}
                >
                  Aquí verás avisos, citatorios y reportes de asistencia.
                </Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 400 }}
              >
                {notifications.map((n) => (
                  <NotificationItem
                    key={n._id || n.id}
                    notification={n}
                    onPress={handleItemPress}
                  />
                ))}
              </ScrollView>
            )}

            {/* Footer con "Marcar todas como leídas" */}
            {notifications.some((n) => !n.read_at) && (
              <Pressable
                onPress={() => markAllAsRead()}
                accessibilityRole="button"
                accessibilityLabel="Marcar todas las notificaciones como leídas"
                className="flex-row items-center justify-center py-3"
                style={{
                  borderTopWidth: 1,
                  borderTopColor: '#E2E8F0',
                  backgroundColor: '#F8FAFC',
                }}
              >
                <CheckCheck size={16} color="#0284C7" strokeWidth={2.25} />
                <Text
                  className="ml-2"
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: '#0284C7',
                  }}
                >
                  Marcar todas como leídas
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default NotificationBell;
