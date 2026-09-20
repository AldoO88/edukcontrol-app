// =====================================================================
// src/services/notificationsService.js
// =====================================================================
// Capa de servicio HTTP para la campanita in-app. Complementa a
// pushNotificationService.js (que maneja registro de token) — este
// archivo SOLO habla con el backend sobre el historial de
// notificaciones.
//
// Endpoints consumidos:
//   GET    /api/me/notifications              → lista (con filtro unread)
//   GET    /api/me/notifications/unread-count → contador para badge
//   PATCH  /api/me/notifications/:id/read     → marcar una como leída
//   PATCH  /api/me/notifications/read-all     → marcar todas como leídas
// =====================================================================

import api from './api';

// ---------------------------------------------------------------------
// getMyNotifications({ unreadOnly, limit })
// ---------------------------------------------------------------------
// Devuelve un array de notificaciones ordenadas por sent_at desc.
// Si `unreadOnly=true`, solo trae las no leídas.
// El default de limit es 50, max 100.
// ---------------------------------------------------------------------
export const getMyNotifications = async ({ unreadOnly = false, limit = 50 } = {}) => {
  try {
    const params = new URLSearchParams();
    if (unreadOnly) params.append('unread', 'true');
    if (limit) params.append('limit', String(limit));
    const queryString = params.toString();
    const url = `/api/me/notifications${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url);
    return { success: true, notifications: response.data?.notifications || [] };
  } catch (error) {
    console.error('[notificationsService] getMyNotifications failed:', error);
    return { success: false, notifications: [], message: error?.message };
  }
};

// ---------------------------------------------------------------------
// getUnreadCount()
// ---------------------------------------------------------------------
// Devuelve el número de notificaciones no leídas.
// Más eficiente que getMyNotifications({unreadOnly: true}) porque
// solo cuenta, no trae documentos completos.
// ---------------------------------------------------------------------
export const getUnreadCount = async () => {
  try {
    const response = await api.get('/api/me/notifications/unread-count');
    return { success: true, count: response.data?.count || 0 };
  } catch (error) {
    console.error('[notificationsService] getUnreadCount failed:', error);
    return { success: false, count: 0, message: error?.message };
  }
};

// ---------------------------------------------------------------------
// markAsRead(notificationId)
// ---------------------------------------------------------------------
// Marca UNA notificación como leída.
// Devuelve { success: true } si se marcó, { success: false } si
// no existía o ya estaba leída.
// ---------------------------------------------------------------------
export const markAsRead = async (notificationId) => {
  if (!notificationId) {
    return { success: false, message: 'notificationId required' };
  }
  try {
    await api.patch(`/api/me/notifications/${notificationId}/read`);
    return { success: true };
  } catch (error) {
    console.error('[notificationsService] markAsRead failed:', error);
    return { success: false, message: error?.message };
  }
};

// ---------------------------------------------------------------------
// markAllAsRead()
// ---------------------------------------------------------------------
// Marca TODAS las notificaciones no leídas del usuario como leídas.
// Devuelve { success: true, marked: N }.
// ---------------------------------------------------------------------
export const markAllAsRead = async () => {
  try {
    const response = await api.patch('/api/me/notifications/read-all');
    return { success: true, marked: response.data?.marked || 0 };
  } catch (error) {
    console.error('[notificationsService] markAllAsRead failed:', error);
    return { success: false, message: error?.message };
  }
};
