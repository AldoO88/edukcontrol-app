// =====================================================================
// api.js
// ---------------------------------------------------------------------
// Instancia única de Axios configurada para toda la aplicación.
// Centraliza:
//   - URL base del backend (leída de config.js).
//   - Timeout por defecto para todas las peticiones.
//   - Headers por defecto (Content-Type JSON, Accept JSON).
//   - Interceptores de request/response para inyectar JWT y manejar
//     errores 401 de forma global.
// Es la ÚNICA dependencia de red que deben consumir los hooks y
// servicios; nunca instanciar axios directamente en otra parte.
// =====================================================================

// Importamos axios, la librería HTTP que usaremos en toda la app.
// A diferencia de fetch, axios permite interceptores, baseURL,
// cancelación de peticiones y transformación automática de JSON.
import axios from 'axios';

// Importamos AsyncStorage para leer/escribir el token JWT de forma
// síncrona dentro de los interceptores. Lo usamos aquí y no en
// useAuth para que peticiones disparadas desde servicios (no desde
// componentes) también tengan acceso al token.
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importamos la URL base desde config.js. Este archivo resuelve la
// IP según la plataforma (iOS/Android) y el puerto del backend.
import { API_URL } from '../../config';

// Constante con la clave de almacenamiento del token. Debe coincidir
// con la definida en AuthContext.js. La centralizamos aquí para que
// cualquier servicio pueda leerla sin importar el contexto de Auth.
export const TOKEN_STORAGE_KEY = '@edukcontrol/token';

// Creamos la instancia de axios con configuración por defecto.
// baseURL apunta al backend Node.js. SIN prefijo "/api" porque:
//   - /auth/login está en la RAÍZ del backend (no bajo /api).
//   - Los demás endpoints (students, groups, etc.) están bajo /api
//     y se prefijarán en sus respectivos servicios.
// "API_URL" ya incluye host:port (e.g. "http://192.168.100.52:5050").
const api = axios.create({
  baseURL: API_URL,
  // Timeout de 15 segundos: balance entre UX y tolerancia a redes
  // lentas. Las llamadas que tarden más se cancelarán automáticamente.
  timeout: 15000,
  // Headers por defecto: indicamos que siempre enviamos y esperamos
  // JSON, lo que evita tener que setearlos manualmente en cada .post().
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ---------------------------------------------------------------------
// INTERCEPTOR DE REQUEST
// ---------------------------------------------------------------------
// Se ejecuta ANTES de que cada petición salga hacia el backend.
// Aquí leemos el token de AsyncStorage y lo inyectamos en el header
// Authorization si existe. Usar un interceptor (en lugar de setear
// el header en cada llamada) garantiza que TODO el código que use
// "api" viaje autenticado automáticamente.
api.interceptors.request.use(
  // onFulfilled: se ejecuta con la config de la petición.
  async (config) => {
    // Leemos el token persistido. No usamos getItem dentro de
    // try/catch propio: si falla, devolvemos la config sin token
    // para no romper peticiones públicas (login, recuperar pass).
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

    // Si hay token, lo agregamos al header "Authorization" con el
    // esquema "Bearer", que es el estándar para JWT (RFC 6750).
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // DEBUG: log de lo que SALE por la red. Si aquí el body
    // tiene phone vacío pero authService lo logueó bien, el bug
    // está en axios (improbable pero posible). Lo más útil es
    // comparar este body con lo que recibe el backend en sus logs.
    console.log('[DEBUG api] request outgoing:', {
      method: config.method,
      url: config.url,
      data: config.data,
      contentType: config.headers['Content-Type'],
    });

    // Retornamos la config (modificada o no) para que axios continúe.
    return config;
  },
  // onRejected: se ejecuta si algo falla al construir la petición.
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------------------
// INTERCEPTOR DE RESPONSE
// ---------------------------------------------------------------------
// Se ejecuta cuando el backend responde (o cuando la petición falla
// por timeout/red). Aquí centralizamos el manejo de errores 401
// (token inválido o expirado): si ocurre, limpiamos la sesión y
// dejamos que el AuthContext (que observa el cambio) redirija al
// login. No recargamos la app ni mostramos alertas desde aquí: solo
// limpiamos el estado y dejamos que las capas superiores reaccionen.
api.interceptors.response.use(
  // onFulfilled: la petición salió bien. Devolvemos la respuesta tal cual.
  (response) => response,

  // onRejected: hubo error. Lo analizamos para tomar acciones globales.
  async (error) => {
    // Extraemos la respuesta del backend (puede no existir si el
    // error fue de red/timeout). El operador "?." evita崩溃 si
    // "error.response" es undefined.
    const status = error?.response?.status;

    // Si el backend respondió 401 (no autorizado) o 403 (prohibido),
    // asumimos que el token expiró o fue revocado. Limpiamos el
    // token y la sesión persistida para forzar un re-login.
    if (status === 401 || status === 403) {
      try {
        // Removemos el token. AuthContext detecta el siguiente render
        // sin usuario (porque ya hicimos logout) y muestra el login.
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch (storageError) {
        // Si falla la limpieza, al menos lo dejamos en consola
        // para debugging. No lanzamos la excepción para no enmascar
        // el error original de la petición.
        console.warn('[api] No se pudo limpiar el token tras 401:', storageError);
      }
    }

    // Devolvemos el rechazo para que el código que llamó a la API
    // (por ejemplo el hook useAuth) pueda mostrar su propio mensaje.
    return Promise.reject(error);
  },
);

// Exportamos la instancia por defecto. Todo el código debe hacer
// "import api from '...'" y nunca crear su propia instancia.
export default api;
