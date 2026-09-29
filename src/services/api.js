// =====================================================================
// api.js
// ---------------------------------------------------------------------
// Instancia única de Axios configurada para toda la aplicación.
//
// Centraliza:
//   - URL base del backend (leída de config.js).
//   - Timeout por defecto para todas las peticiones.
//   - Headers por defecto (Content-Type JSON, Accept JSON).
//   - Interceptor de REQUEST: inyecta el JWT de SecureStore.
//   - Interceptor de RESPONSE: en 401 (excepto /auth/refresh y
//     /auth/login), intenta un refresh-on-401 con single-flight y
//     reintenta la request original una vez. Si el refresh también
//     falla, borra tokens y dispara `onSessionExpired()` para que
//     AuthContext haga su limpieza en React.
//   - 403 NO borra tokens (era un bug: un 403 por permisos tumbaba
//     sesiones válidas).
// =====================================================================

import axios from "axios";
import { secureTokens } from "./secureTokens";
import { API_URL } from "../../config";

// Callback que AuthContext registra en mount. La razón de tener un
// setter (no un import directo) es evitar un ciclo api ↔ AuthContext.
// El callback debe:
//   - Llamar setUser(null) en React
//   - Limpiar `api.defaults.headers.common.Authorization`
const sessionExpiredSubs = new Set();
export const onSessionExpired = (cb) => {
  sessionExpiredSubs.add(cb);
  return () => sessionExpiredSubs.delete(cb);
};
const fireSessionExpired = () => {
  for (const cb of sessionExpiredSubs) {
    try { cb(); } catch {}
  }
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── Request: inyecta JWT de SecureStore ────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await secureTokens.getAccess();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Refresh single-flight ──────────────────────────────────────────
// Si varias requests chocan con 401 al mismo tiempo, todas se unen a
// la misma Promesa de refresh para no quemarlo dos veces seguidas.
let refreshInFlight = null;

async function performRefresh() {
  const refresh = await secureTokens.getRefresh();
  if (!refresh) return null;
  try {
    const res = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: refresh,
    }, { timeout: 10000 });
    const { authToken, refreshToken } = res.data || {};
    if (!authToken || !refreshToken) return null;
    await secureTokens.set(authToken, refreshToken);
    api.defaults.headers.common.Authorization = `Bearer ${authToken}`;
    return authToken;
  } catch {
    return null;
  }
}

async function refreshTokens() {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

// ─── Response: maneja 401 (refresh) / 403 (no, sin tocar) ──────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    // 401 en endpoints distintos a /auth/refresh y /auth/login → intentar refresh.
    if (
      status === 401 &&
      !url.endsWith("/auth/refresh") &&
      !url.endsWith("/auth/login")
    ) {
      const newAccess = await refreshTokens();
      if (newAccess) {
        // Reintentamos la request original con el token fresco.
        const orig = error.config || {};
        orig.headers = { ...orig.headers, Authorization: `Bearer ${newAccess}` };
        orig._retry = true;
        try {
          return await axios.request(orig);
        } catch (err2) {
          // El retry también falló (p. ej. otro 401): cascading.
          // Continuamos al cleanup de abajo.
          error = err2;
        }
      }
      // Refresh falló: limpieza total.
      await secureTokens.clear().catch(() => {});
      delete api.defaults.headers.common.Authorization;
      fireSessionExpired();
      return Promise.reject(error);
    }

    // 403 NO borra tokens (un 403 por permisos no debería matar la sesión).
    // Solo dejamos que el caller lo muestre.

    return Promise.reject(error);
  },
);

export default api;
