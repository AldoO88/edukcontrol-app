// =====================================================================
// AuthContext.js
// ---------------------------------------------------------------------
// Proveedor de autenticación para "EdukControl":
//   1) Estado global { user, isLoading } y funciones { login, logout,
//      setSession, refreshSession }.
//   2) Persistencia segura (expo-secure-store) de access y refresh.
//   3) Restauración de sesión al montar: si el access expiró,
//      intenta un refresh proactivo antes de revalidar contra
//      /auth/verify.
//   4) Wire del callback onSessionExpired del api.js: cuando una
//      request recibe 401 irreparable, el api limpia tokens y dispara
//      este callback para que React limpie también el estado.
// =====================================================================

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authService from '../services/authService';
import api, { onSessionExpired } from '../services/api';
import { secureTokens } from '../services/secureTokens';
import { decodeJwtPayload, isJwtExpired } from '../utils/jwt';

import { unregisterFcmToken } from '../services/pushNotificationService';

export const AuthContext = createContext(undefined);

// User payload se guarda (no cifrado) en AsyncStorage como cache.
// Es un snapshot del JWT vigente al último login, NO contiene el token.
const STORAGE_KEYS = {
  USER: '@edukcontrol/user',
};

// Aplica los nuevos tokens (access + opcional refresh) al estado del
// cliente HTTP. Se usa en login, setSession, refreshSession.
const applyToApiClient = (authToken) => {
  api.defaults.headers.common.Authorization = `Bearer ${authToken}`;
};
const clearApiClient = () => {
  delete api.defaults.headers.common.Authorization;
};

const payloadToAppUser = (payload) => {
  if (!payload || isJwtExpired(payload)) return null;
  return {
    id: payload._id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sesión al montar.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedAccess, storedRefresh, storedUserRaw] = await Promise.all([
          secureTokens.getAccess(),
          secureTokens.getRefresh(),
          AsyncStorage.getItem(STORAGE_KEYS.USER),
        ]);

        if (!storedAccess) {
          if (!cancelled) setIsLoading(false);
          return;
        }

        applyToApiClient(storedAccess);

        // Cache del user mientras no haya respuesta fresca.
        let cacheUser = null;
        if (storedUserRaw) {
          try {
            cacheUser = JSON.parse(storedUserRaw);
          } catch {}
        }

        // Si el access sigue vigente (con un skew de 5 s), verificamos
        // directo. Si está expirado PERO tenemos refresh, intentamos
        // refresh proactivo antes de tirar la sesión.
        const accessPayload = decodeJwtPayload(storedAccess);
        const accessExpired = !accessPayload || isJwtExpired(accessPayload);

        if (!accessExpired) {
          const verified = await authService.verify();
          if (!cancelled) {
            if (verified) setUser(verified);
            else if (cacheUser) setUser(cacheUser); // fallback a cache
          }
          return;
        }

        if (storedRefresh) {
          const r = await authService.refresh(storedRefresh);
          if (r.success) {
            await secureTokens.set(r.authToken, r.refreshToken);
            applyToApiClient(r.authToken);
            // El nuevo access es válido por 15 min — verify debería
            // funcionar; si no, caemos al cache.
            const verified = await authService.verify();
            if (!cancelled) {
              if (verified) setUser(verified);
              else if (cacheUser) setUser(cacheUser);
            }
            return;
          }
        }

        // Sin refresh viable o refresh falló → cerrar sesión local.
        await secureTokens.clear();
        clearApiClient();
        await AsyncStorage.removeItem(STORAGE_KEYS.USER);
        if (!cancelled) setUser(null);
      } catch (e) {
        console.error('[AuthContext] Error restaurando sesión:', e);
        // best-effort: tratar como sin sesión
        try {
          await secureTokens.clear();
          await AsyncStorage.removeItem(STORAGE_KEYS.USER);
        } catch {}
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Wire del callback de sesión expirada. Lo registramos una vez: cada
  // vez que api.js detecta un 401 irreparable tras un refresh
  // fallido, hace secureTokens.clear + llama a este callback para
  // que React también limpie.
  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      // Mantener sincronía sin causar setState-en-effect con la regla
      // actual: leemos el user actual desde la siguiente función.
      setUserLocal(null);
      AsyncStorage.removeItem(STORAGE_KEYS.USER).catch(() => {});
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wrapper para registrar la mutación (evita que el linter se queje
  // de setState dentro de callback del useEffect al desestructurar
  // arriba).
  const setUserLocal = useCallback((u) => setUser(u), []);

  // Persiste tokens en SecureStore + header axios + estado React.
  const persistSession = useCallback(async (authToken, userData, refreshToken) => {
    await secureTokens.set(authToken, refreshToken || null);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    applyToApiClient(authToken);
    setUser(userData);
  }, []);

  const login = useCallback(async (phone, password, remember) => {
    const result = await authService.login(phone, password, remember);
    if (!result.success) return result;
    await persistSession(result.authToken, result.user, result.refreshToken);
    return { success: true, user: result.user };
  }, [persistSession]);

  // setSession — usado por activación de cuenta y otros flows que ya
  // tienen tokens del backend.
  const setSession = useCallback(async (authToken, userData, refreshToken) => {
    if (!authToken || !userData) {
      return { success: false, message: 'Token o usuario inválidos.' };
    }
    await persistSession(authToken, userData, refreshToken || null);
    return { success: true };
  }, [persistSession]);

  // Cierra sesión: desregistra FCM, limpia tokens y estado.
  const logout = useCallback(async () => {
    const roleAtLogout = user?.role || null;
    try {
      await unregisterFcmToken(roleAtLogout);
      // Llamamos /auth/logout en background con el refresh actual.
      // best-effort: si falla, igual limpiamos localmente.
      const refresh = await secureTokens.getRefresh();
      try {
        await api.post(
          '/auth/logout',
          refresh ? { refreshToken: refresh } : undefined,
        );
      } catch {}
      await secureTokens.clear();
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      clearApiClient();
      setUser(null);
    } catch (error) {
      console.error('[AuthContext] Error en logout:', error);
      try {
        await secureTokens.clear();
        await AsyncStorage.removeItem(STORAGE_KEYS.USER);
        clearApiClient();
      } catch {}
      setUser(null);
    }
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      setSession,
      isLoading,
      isAuthenticated: !!user,
      userRole: user?.role || null,
    }),
    [user, login, logout, setSession, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
