// Wrapper de expo-secure-store para tokens sensibles (JWT y refresh).
//
// Por qué SecureStore y no AsyncStorage:
//   - Los JWT permiten impersonar al usuario hasta `exp`. Guardarlos
//     en AsyncStorage (disco plano) los expone a cualquier app con
//     permisos de almacenamiento compartido o a un `adb` con acceso
//     root al dispositivo.
//   - SecureStore usa el Keystore de Android y el Keychain de iOS —
//     cifrado con la llave del SO y, en iOS, marcado como
//     `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`.
//
// Esta capa es la ÚNICA autorizada a leer/escribir tokens en disco.
// Los interceptores (api.js) y el Provider (AuthContext.js) la usan
// indirectamente; nadie más debe tocar expo-secure-store directamente.
//
// AsyncStorage se mantiene para el payload de User (no sensible) —
// el esquema de flags no requiere cifrado y sigue siendo compatible
// con la restauración previa del usuario persistido.

import * as SecureStore from "expo-secure-store";

// Claves separadas del storage (privadas a esta capa).
const KEY_ACCESS = "edukcontrol.access_token";
const KEY_REFRESH = "edukcontrol.refresh_token";

// API mínima: set/get/delete por par (access, refresh), y dos
// accesos individuales para los interceptores que solo necesitan uno.
export const secureTokens = {
  async set(access, refresh) {
    // `refresh` puede ser null (sesión "sin recordar") → no lo guardamos.
    const writes = [SecureStore.setItemAsync(KEY_ACCESS, access)];
    if (refresh) {
      writes.push(SecureStore.setItemAsync(KEY_REFRESH, refresh));
    } else {
      writes.push(SecureStore.deleteItemAsync(KEY_REFRESH));
    }
    await Promise.all(writes);
  },

  async getAccess() {
    try {
      return await SecureStore.getItemAsync(KEY_ACCESS);
    } catch {
      return null;
    }
  },

  async getRefresh() {
    try {
      return await SecureStore.getItemAsync(KEY_REFRESH);
    } catch {
      return null;
    }
  },

  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync(KEY_ACCESS).catch(() => {}),
      SecureStore.deleteItemAsync(KEY_REFRESH).catch(() => {}),
    ]);
  },
};
