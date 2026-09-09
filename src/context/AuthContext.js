// =====================================================================
// AuthContext.js
// ---------------------------------------------------------------------
// Proveedor de contexto de autenticación para "EdukControl".
// Se encarga de:
//   1) Crear y exportar el AuthContext (objeto de contexto de React).
//   2) Exponer el componente AuthProvider que envolverá toda la app
//      y proveerá los valores { user, login, logout, isLoading }.
//   3) Persistir la sesión del usuario en almacenamiento local
//      (AsyncStorage + SecureStore para el token JWT).
//   4) Restaurar la sesión automáticamente al iniciar la aplicación.
// La lógica HTTP vive en services/authService.js; este archivo solo
// orquesta el estado y la persistencia.
// =====================================================================

// Importamos React y los hooks necesarios.
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';

// Importamos AsyncStorage para datos no sensibles.
import AsyncStorage from '@react-native-async-storage/async-storage';

// Servicio de autenticación (capa HTTP). Toda la lógica de red
// vive en authService; este Provider solo orquesta.
import authService from '../services/authService';

// Instancia de axios (necesaria para setear el header Authorization
// al restaurar la sesión y para limpiarlo al hacer logout).
import api, { TOKEN_STORAGE_KEY } from '../services/api';

// Servicio de push notifications: lo usamos en logout() para
// desregistrar el FCM token del backend ANTES de limpiar el state
// local. El módulo expone unregisterFcmToken() que lee el token
// actual del state interno del servicio y hace DELETE al backend.
// No importa quién seteo el token (el hook o una restauración
// de sesión): el servicio lo sabe.
import { unregisterFcmToken } from '../services/pushNotificationService';

// Creamos el contexto de autenticación. El valor por defecto es
// "undefined" intencionalmente: nos permite detectar en el hook
// useAuth si un componente intenta consumir el contexto sin estar
// envuelto por el AuthProvider (lanzaremos un error descriptivo).
export const AuthContext = createContext(undefined);

// Claves constantes que usaremos para guardar/leer información en
// AsyncStorage. Definirlas aquí evita errores de tipeo y facilita
// el mantenimiento si más adelante cambia el namespace de claves.
const STORAGE_KEYS = {
  // Token JWT (importado desde api.js para mantener una sola fuente).
  TOKEN: TOKEN_STORAGE_KEY,
  // Usuario persistido (cache del payload decodificado).
  USER: '@edukcontrol/user',
};

// Definimos y exportamos el proveedor "AuthProvider". Recibe como
// prop "children" (todos los componentes hijos que envolverá).
export const AuthProvider = ({ children }) => {
  // Estado "user": almacena la información del usuario autenticado
  // (id, name, email, role) o "null" si nadie ha iniciado sesión.
  const [user, setUser] = useState(null);

  // Estado "isLoading": controla la pantalla de carga inicial.
  // Mientras es "true", mostraremos un splash/ActivityIndicator
  // para no parpadear entre Login y la app principal.
  const [isLoading, setIsLoading] = useState(true);

  // -----------------------------------------------------------------
  // useEffect: se ejecuta UNA sola vez al montar el AuthProvider.
  // Su objetivo es revisar si existe una sesión persistida en
  // AsyncStorage y, de ser así, restaurar al usuario y el token.
  // -----------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        // Leemos en paralelo tanto el usuario cacheado como el token.
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        ]);

        // Si NO hay token guardado, no hay sesión.
        if (!storedToken) return;

        // Inyectamos el token en Axios para que las próximas
        // peticiones (incluyendo /auth/verify) viajen autenticadas.
        api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;

        // Verificamos el token contra el backend. Si el backend
        // lo rechaza (401), sabremos que está expirado o revocado.
        const verifiedUser = await authService.verify();

        if (verifiedUser) {
          // Token válido: actualizamos el estado con el user fresco
          // del backend (por si cambió el nombre, etc.).
          setUser(verifiedUser);
          // Re-persistimos el user por si el backend devolvió datos
          // actualizados.
          await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(verifiedUser));
        } else {
          // Token inválido: limpiamos todo.
          await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.TOKEN]);
          delete api.defaults.headers.common.Authorization;
        }
      } catch (error) {
        // Si algo falla (JSON corrupto, error de red, etc.), lo
        // registramos en consola y limpiamos los restos.
        console.error('[AuthContext] Error restaurando sesión:', error);
        await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.TOKEN]);
        delete api.defaults.headers.common.Authorization;
      } finally {
        // Independientemente del resultado, dejamos de cargar.
        setIsLoading(false);
      }
    })();
  }, []); // Array de dependencias vacío => solo se ejecuta al montar.

  // -----------------------------------------------------------------
  // Función interna: persiste el token + user y actualiza el state.
  // La extraemos de login() para que setSession() (usada por el
  // flow de activación) pueda reusar exactamente la misma lógica
  // sin duplicar código. Si en el futuro hay otro flow que también
  // establezca sesión (magic link, OAuth, etc.), todos usan esto.
  // -----------------------------------------------------------------
  const persistSession = useCallback(async (authToken, user) => {
    // Persistir token y user en paralelo. Si esto falla, la sesión
    // no se restaura en el siguiente inicio.
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, authToken),
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
    ]);

    // Configurar Axios para que las próximas peticiones lleven
    // el token en el header Authorization.
    api.defaults.headers.common.Authorization = `Bearer ${authToken}`;

    // Actualizar el estado global. Esto dispara re-render de todos
    // los consumers de useAuth() y la redirección automática al
    // dashboard en el _layout.jsx del route group correspondiente.
    setUser(user);
  }, []);

  // -----------------------------------------------------------------
  // Función "login": realiza la autenticación contra el backend.
  // Recibe phone y password, llama al endpoint a través del servicio,
  // guarda la sesión y actualiza el estado global.
  //
  // Cambio de contrato: antes era login(email, password). Ahora es
  // login(phone, password). El backend debe estar actualizado para
  // aceptar "phone" en el body del POST /auth/login (ver authService).
  // -----------------------------------------------------------------
  const login = useCallback(async (phone, password) => {
    // Llamamos al servicio. El servicio ya devuelve un objeto
    // { success, user, authToken, message } con los errores mapeados
    // a mensajes amigables. Si success es false, no tocamos el
    // estado global: el caller (useLoginForm) mostrará el error.
    const result = await authService.login(phone, password);

    if (!result.success) {
      return result;
    }

    // Login OK: persistir sesión (token + user) y actualizar state.
    // Reutilizamos persistSession() para no duplicar la lógica de
    // setItem / header Authorization / setUser.
    await persistSession(result.authToken, result.user);

    console.log('[AuthContext] login exitoso. user.role =', result.user.role, '| user.name =', result.user.name);
    return { success: true, user: result.user };
  }, [persistSession]);

  // -----------------------------------------------------------------
  // Función "setSession": establece una sesión a partir de un par
  // (authToken, user) ya obtenidos de un flow externo al login
  // tradicional. El caso de uso principal es el flow de ACTIVACIÓN
  // (app/(auth)/activation/set-password.jsx), donde el backend
  // devuelve el token directamente en el response del POST
  // /auth/activation/complete, sin un round-trip adicional al
  // /auth/login.
  //
  // Cualquier flow futuro que termine con un par (token, user)
  // puede llamar a setSession() para reusar el manejo de AsyncStorage,
  // header de Axios y state global — sin duplicar código.
  //
  // Devuelve { success: true } si todo OK, o { success: false,
  // message } si la persistencia falla. NO lanza excepciones.
  // -----------------------------------------------------------------
  const setSession = useCallback(async (authToken, user) => {
    try {
      if (!authToken || !user) {
        return { success: false, message: 'Token o usuario inválidos.' };
      }
      await persistSession(authToken, user);
      console.log('[AuthContext] setSession exitoso. user.role =', user.role, '| user.name =', user.name);
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Error en setSession:', error);
      return { success: false, message: 'No se pudo establecer la sesión.' };
    }
  }, [persistSession]);

  // -----------------------------------------------------------------
  // Función "logout": cierra la sesión del usuario actual.
  // Limpia AsyncStorage, los headers de Axios y el estado global.
  //
  // ORDEN IMPORTANTE: desregistramos el FCM token del backend
  // ANTES de limpiar el state local. Si el backend sigue teniendo
  // el token después del logout, va a seguir enviando push
  // notifications a un device que ya no está autenticado.
  // unregisterFcmToken() es best-effort: si falla (red caída,
  // server down), NO relanza — el logout local debe proceder
  // de todas formas para no dejar al usuario "atrapado" logueado
  // por un problema de red.
  // -----------------------------------------------------------------
  const logout = useCallback(async () => {
    try {
      // 1. Desregistrar FCM token del backend.
      await unregisterFcmToken();

      // 2. Eliminar AMBAS claves de almacenamiento en una sola
      // operación atómica (multiRemove) para mayor eficiencia.
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.TOKEN]);

      // 3. Remover el header de Authorization de Axios para que
      // cualquier petición accidental no viaje con un token muerto.
      delete api.defaults.headers.common.Authorization;

      // 4. Limpiar el estado global. El _layout.jsx de cada route
      // group verá user=null y redirigirá al login. El hook
      // usePushNotifications se quedará con enabled=false, su effect
      // cleanup se ejecuta y remueve el listener de rotación (sin
      // tocar el backend, eso ya lo hicimos en el paso 1).
      setUser(null);
    } catch (error) {
      // Si algo falla al limpiar la sesión, lo registramos pero
      // no impedimos que el usuario salga de la app a nivel UI.
      // NOTA: unregisterFcmToken NO lanza (best-effort), así que
      // este catch solo se dispara por errores en AsyncStorage o
      // setUser. En el peor caso, el user queda en state
      // inconsistente — pero al menos no se queda logueado.
      console.error('[AuthContext] Error en logout:', error);
    }
  }, []);

  // -----------------------------------------------------------------
  // useMemo: memoizamos el objeto "value" que se entrega a los
  // consumidores del contexto. Si lo creáramos nuevo en cada
  // render, provocaría re-renders innecesarios en TODOS los
  // componentes que dependen de useAuth. Con useMemo, solo
  // cambiará cuando cambien "user" o "isLoading".
  // -----------------------------------------------------------------
  const value = useMemo(
    () => ({
      // Usuario actual autenticado o null si no hay sesión.
      user,
      // Función para iniciar sesión (login tradicional).
      login,
      // Función para cerrar la sesión actual.
      logout,
      // Función para establecer una sesión desde un par (token, user)
      // ya obtenido. Usada por el flow de activación (y futuros
      // flows como magic link, OAuth, etc.) que terminan con un
      // token sin pasar por el endpoint /auth/login.
      setSession,
      // Bandera de carga: true mientras restauramos la sesión.
      isLoading,
      // Helpers convenientes derivados del estado:
      isAuthenticated: !!user, // true si hay usuario logueado.
      userRole: user?.role || null, // 'tutor' (padre) | 'teacher' (maestro) | 'prefect' (prefecto) | null.
    }),
    [user, login, logout, setSession, isLoading], // Dependencias del memo.
  );

  // Renderizamos el Provider con el "value" memoizado. Cualquier
  // componente hijo podrá consumir este contexto vía useAuth().
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Exportamos por defecto el proveedor. Lo montaremos en la raíz
// de la aplicación (App.js) para que esté disponible en toda ella.
export default AuthProvider;
