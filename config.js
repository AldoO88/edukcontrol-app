// =====================================================================
// config.js
// ---------------------------------------------------------------------
// Lee la URL del backend desde la variable de entorno
// `EXPO_PUBLIC_API_URL` (definida en `.env` o inyectada por EAS al
// momento de `eas build`), con un fallback razonable para que la app
// siga funcionando en una red local sin .env.
//
// Patrón estándar de Expo SDK 53+:
//   - EXPO_PUBLIC_* se expone al bundle del cliente y se puede leer
//     en runtime con `process.env.EXPO_PUBLIC_*`.
//   - Las variables de cada entorno se configuran en `.env`,
//     `.env.development`, `.env.preview`, `.env.production` según el
//     perfil de EAS (ver eas.json → build.<profile>.env).
//
// Fallback (cuando NO existe .env): usamos la IP LAN actual
// (192.168.100.52:5050) para que sigas probando en tu Wi-Fi sin
// tocar nada. Para producción, define EXPO_PUBLIC_API_URL=https://api.tu-dominio.com
// =====================================================================

import { Platform } from 'react-native';

// IP LAN por defecto — útil para dev sin .env, o cuando el device
// físico se conecta al Wi-Fi donde corre el backend.
const LOCAL_LAN_IP = '192.168.100.52';
const LOCAL_PORT = '5050';

const buildLocalFallback = () =>
  Platform.select({
    ios: `http://${LOCAL_LAN_IP}:${LOCAL_PORT}`,
    android: `http://${LOCAL_LAN_IP}:${LOCAL_PORT}`,
    default: `http://localhost:${LOCAL_PORT}`,
  });

// Prioridad:
//   1. process.env.EXPO_PUBLIC_API_URL  (inyectada por expo-cli / EAS)
//   2. fallback LAN (mantiene la compatibilidad con el dev anterior)
const envUrl = process.env.EXPO_PUBLIC_API_URL;

const pickApiUrl = () => {
  // Si está definida la env y no es vacía/nulo, la usamos. Hacemos
  // trim y validación mínima para evitar valores mal configurados.
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
    const url = envUrl.trim();
    // En desarrollo forzamos http solo si el caller lo pide explícito.
    // Expo SDK 53+ ignora cualquier regla de localhost que tuviera, no
    // es necesario agregar un dominio a `usesCleartextTraffic` acá.
    return url.replace(/\/+$/, ''); // sin slash final
  }
  return buildLocalFallback();
};

export const API_URL = pickApiUrl();

// Útil para debugging rápido desde Metro:
if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log('[config] API_URL =', API_URL);
}
