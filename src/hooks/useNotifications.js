// =====================================================================
// src/hooks/useNotifications.js
// =====================================================================
// Hook que orquesta la campanita in-app. Maneja:
//   1) Polling del unread count cada N segundos (para el badge).
//   2) Fetch de la lista de notificaciones (para el dropdown).
//   3) Marcar como leída (una o todas).
//
// No usa expo-notifications directamente — eso es responsabilidad de
// usePushNotifications. Este hook solo lee/escribe el historial
// persistido en el backend.
//
// =====================================================================
// POLLING vs WEB SOCKET / SSE
// =====================================================================
// Implementación simple: polling cada 60s cuando la pantalla está
// activa. Es suficiente para nuestro volumen esperado (decenas de
// notificaciones/hora por escuela). Si crece, considerar:
//   - Server-Sent Events para push del count en tiempo real
//   - WebSocket bidireccional
//   - Firebase Realtime Database como broker
// Por ahora polling es suficiente y no requiere infraestructura
// adicional.
// =====================================================================

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
} from '../services/notificationsService';

// Intervalo de polling en milisegundos (60 segundos).
// Más frecuente = más "real-time" pero más consumo de batería/datos.
const POLL_INTERVAL_MS = 60 * 1000;

/**
 * Hook principal.
 *
 * Retorna:
 *   - notifications: array de notificaciones del backend.
 *   - unreadCount: número de no leídas.
 *   - isLoading: true durante fetch inicial.
 *   - isRefreshing: true durante pull-to-refresh / re-fetch.
 *   - error: string con error o null.
 *   - refresh(): fuerza un re-fetch (lista + count).
 *   - markAsRead(id): marca una como leída (optimistic update).
 *   - markAllAsRead(): marca todas como leídas (optimistic update).
 *   - lastUpdated: timestamp del último fetch exitoso (para debug).
 *
 * @param {boolean} enabled - Si false, no hace polling ni fetch.
 *                          Útil para montar solo cuando hay user logueado.
 * @param {number} pollIntervalMs - Override del intervalo de polling.
 */
export const useNotifications = (enabled = true, pollIntervalMs = POLL_INTERVAL_MS) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Ref para evitar doble fetch en mount + re-render inmediato.
  const inFlightRef = useRef(false);

  // ---------------------------------------------------------------------
  // fetchAll(opts)
  // ---------------------------------------------------------------------
  // Hace fetch de lista + count en paralelo. Maneja loading vs refresh
  // según `opts.silent` (true = no mostrar loading state, para polling).
  // ---------------------------------------------------------------------
  const fetchAll = useCallback(async ({ silent = false } = {}) => {
    // Guard anti-concurrencia: si ya hay un fetch en vuelo, salir.
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (!silent) setIsLoading(true);
    setError(null);

    try {
      const [listRes, countRes] = await Promise.all([
        getMyNotifications({ limit: 50 }),
        getUnreadCount(),
      ]);

      if (listRes.success) {
        setNotifications(listRes.notifications || []);
      }
      if (countRes.success) {
        setUnreadCount(countRes.count || 0);
      }
      if (!listRes.success && !countRes.success) {
        setError(listRes.message || countRes.message || 'Error fetching notifications');
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[useNotifications] fetchAll error:', err);
      setError(err?.message || 'Unknown error');
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------
  // refresh() — para pull-to-refresh manual.
  // ---------------------------------------------------------------------
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchAll({ silent: false });
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAll]);

  // ---------------------------------------------------------------------
  // markAsRead(id) — optimistic update + API call.
  // ---------------------------------------------------------------------
  // Marcamos localmente como leído ANTES de la API call para que la
  // UI responda instantáneamente. Si la API falla, revertimos.
  // ---------------------------------------------------------------------
  const markAsRead = useCallback(async (id) => {
    if (!id) return;

    // Snapshot para rollback si la API falla.
    const prevNotifications = notifications;
    const prevCount = unreadCount;

    // Optimistic update.
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === id || n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
      ),
    );
    if (unreadCount > 0) setUnreadCount((c) => Math.max(0, c - 1));

    // API call.
    const result = await apiMarkAsRead(id);
    if (!result.success) {
      // Rollback.
      console.warn('[useNotifications] markAsRead failed, rolling back');
      setNotifications(prevNotifications);
      setUnreadCount(prevCount);
    }
  }, [notifications, unreadCount]);

  // ---------------------------------------------------------------------
  // markAllAsRead() — optimistic + API.
  // ---------------------------------------------------------------------
  const markAllAsRead = useCallback(async () => {
    const prevNotifications = notifications;
    const prevCount = unreadCount;
    const now = new Date().toISOString();

    // Optimistic update.
    setNotifications((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: now })),
    );
    setUnreadCount(0);

    const result = await apiMarkAllAsRead();
    if (!result.success) {
      console.warn('[useNotifications] markAllAsRead failed, rolling back');
      setNotifications(prevNotifications);
      setUnreadCount(prevCount);
    }
  }, [notifications, unreadCount]);

  // ---------------------------------------------------------------------
  // Effect: fetch inicial + polling.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!enabled) {
      setNotifications([]);
      setUnreadCount(0);
      setLastUpdated(null);
      return undefined;
    }

    // Fetch inicial.
    fetchAll({ silent: false });

    // Polling.
    const intervalId = setInterval(() => {
      // Polling usa silent: true para no parpadear el spinner.
      fetchAll({ silent: true });
    }, pollIntervalMs);

    return () => clearInterval(intervalId);
  }, [enabled, pollIntervalMs, fetchAll]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refresh,
    markAsRead,
    markAllAsRead,
  };
};
