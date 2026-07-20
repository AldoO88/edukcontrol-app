// =====================================================================
// jwt.js
// ---------------------------------------------------------------------
// Utilidades para decodificar JSON Web Tokens (JWT) en el cliente.
// El backend firma el token con el id, email, name y role del usuario.
// Como solo necesitamos LEER el payload (no verificar la firma, eso
// lo hace el backend), basta con decodificar la segunda parte del
// token (base64-url) a JSON. Es seguro en el cliente: el payload es
// legible por diseño, lo que NO debe confiarse en él sin re-validar
// contra el backend para datos sensibles.
// =====================================================================

// decodeJwtPayload: dado un token JWT (e.g. "xxx.yyy.zzz"), devuelve
// el payload (la parte central) como objeto JS. Devuelve null si el
// token es inválido o no tiene el formato esperado.
export const decodeJwtPayload = (token) => {
  // Validación defensiva: si no hay token, devolvemos null.
  if (!token || typeof token !== 'string') return null;

  // Un JWT tiene tres partes separadas por puntos: header.payload.signature
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  // Tomamos la parte central (índice 1).
  const payload = parts[1];
  if (!payload) return null;

  try {
    // base64-url → base64 estándar. Reemplazamos caracteres URL-safe
    // por los estándar y añadimos padding si falta.
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    // En React Native, "atob" NO está disponible globalmente. Usamos
    // un fallback manual con un mapa de bytes. La forma estándar en
    // RN es usar un polyfill (Buffer) o implementar la decodificación
    // a mano. Aquí usamos el truco de URIComponent + decodeURIComponent
    // que funciona con caracteres ASCII comunes del JWT.
    const decoded = base64Decode(padded);
    if (!decoded) return null;
    // Parseamos el JSON resultante.
    return JSON.parse(decoded);
  } catch (err) {
    // Si algo falla (token corrupto, JSON inválido), devolvemos null.
    // No lanzamos la excepción para que el caller pueda manejar
    // tokens corruptos como "no logueado".
    console.warn('[jwt] No se pudo decodificar el token:', err);
    return null;
  }
};

// base64Decode: decodifica base64 a string. Implementación manual
// para React Native (no usa Buffer ni atob del navegador).
const base64Decode = (base64) => {
  // Mapa de caracteres base64 → su valor numérico (0..63).
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  // Quitamos el padding para calcular la longitud real.
  const cleaned = base64.replace(/=+$/, '');
  const length = cleaned.length;
  if (length % 4 === 1) return null; // Longitud inválida.

  // Decodificamos en grupos de 4 caracteres → 3 bytes.
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < length; i++) {
    const value = lookup[cleaned.charCodeAt(i)];
    if (value === undefined) return null; // Carácter inválido.
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
};

// isJwtExpired: dado un payload JWT, devuelve true si ya expiró.
// Consideramos un margen de 5 segundos para evitar problemas de
// reloj entre cliente y servidor.
export const isJwtExpired = (payload, skewSeconds = 5) => {
  if (!payload || typeof payload.exp !== 'number') return true;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds + skewSeconds;
};
