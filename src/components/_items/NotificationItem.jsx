// =====================================================================
// src/components/_items/NotificationItem.jsx
// =====================================================================
// Item individual de notificación para el dropdown de la campanita.
// Renderiza una fila con:
//   - Ícono según kind (Megaphone para avisos, FileText para citatorios, etc.)
//   - Título + cuerpo (truncados)
//   - Tiempo relativo ("hace 2 horas")
//   - Fondo diferente si no está leída
//   - onPress → callback del padre (marcar como leída + navegar)
// =====================================================================

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  Megaphone,
  Bell,
  FileText,
  AlertTriangle,
  CheckCircle,
  Calendar,
  XCircle,
} from 'lucide-react-native';

// ---------------------------------------------------------------------
// KIND_CONFIG: ícono + color por cada `kind` del backend.
// Centralizado aquí para que un cambio de look se haga en un solo lugar.
// ---------------------------------------------------------------------
const KIND_CONFIG = {
  attendance: { Icon: CheckCircle, color: '#10B981', label: 'Asistencia' },
  absence: { Icon: AlertTriangle, color: '#F59E0B', label: 'Ausencia' },
  citation: { Icon: FileText, color: '#0284C7', label: 'Citatorio' },
  citation_rescheduled: { Icon: Calendar, color: '#0284C7', label: 'Citatorio' },
  citation_cancelled: { Icon: XCircle, color: '#94A3B8', label: 'Citatorio' },
  citation_confirmed: { Icon: CheckCircle, color: '#10B981', label: 'Citatorio' },
  citation_reschedule_request: { Icon: Calendar, color: '#F59E0B', label: 'Citatorio' },
  announcement: { Icon: Megaphone, color: '#6366F1', label: 'Aviso' },
};

const DEFAULT_KIND_CONFIG = { Icon: Bell, color: '#64748B', label: 'Notificación' };

// ---------------------------------------------------------------------
// formatRelativeTime(date)
// ---------------------------------------------------------------------
// Devuelve un string relativo corto: "hace 5m", "hace 2h", "ayer", "hace 3d".
// ---------------------------------------------------------------------
const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin}m`;
  if (diffHour < 24) return `hace ${diffHour}h`;
  if (diffDay === 1) return 'ayer';
  if (diffDay < 7) return `hace ${diffDay}d`;
  // Más de una semana: fecha corta.
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};

// ---------------------------------------------------------------------
// NotificationItem
// ---------------------------------------------------------------------
const NotificationItem = ({ notification, onPress }) => {
  const kindConfig = KIND_CONFIG[notification.kind] || DEFAULT_KIND_CONFIG;
  const { Icon, color } = kindConfig;
  const isUnread = !notification.read_at;

  const handlePress = () => {
    if (onPress) onPress(notification);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}. ${notification.title}`}
      className={`flex-row items-start px-4 py-3 ${isUnread ? 'bg-sky-50' : 'bg-white'}`}
      style={{
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
      }}
    >
      {/* Ícono del kind */}
      <View
        className="items-center justify-center mr-3"
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: `${color}1A`, // 10% alpha
        }}
      >
        <Icon size={18} color={color} strokeWidth={2.25} />
      </View>

      {/* Contenido */}
      <View className="flex-1 min-w-0">
        <View className="flex-row items-start justify-between">
          <Text
            className="text-slate-900 flex-1"
            style={{
              fontSize: 13,
              fontWeight: isUnread ? '700' : '600',
            }}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          {isUnread && (
            <View
              className="ml-2 rounded-full"
              style={{
                width: 8,
                height: 8,
                backgroundColor: '#0EA5E9',
              }}
            />
          )}
        </View>
        <Text
          className="text-slate-500 mt-0.5"
          style={{ fontSize: 12, fontWeight: '400' }}
          numberOfLines={2}
        >
          {notification.body}
        </Text>
        <Text
          className="text-slate-400 mt-1"
          style={{ fontSize: 10, fontWeight: '500' }}
        >
          {formatRelativeTime(notification.sent_at || notification.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
};

export default NotificationItem;
