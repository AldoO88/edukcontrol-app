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
  // Función "login": realiza la autenticación contra el backend.
  // Recibe email y password, llama al endpoint a través del servicio,
  // guarda la sesión y actualiza el estado global.
  // -----------------------------------------------------------------
  const login = useCallback(async (email, password) => {
    // Llamamos al servicio. El servicio ya devuelve un objeto
    // { success, user, authToken, message } con los errores mapeados
    // a mensajes amigables. Si success es false, no tocamos el
    // estado global: el caller (useLoginForm) mostrará el error.
    const result = await authService.login(email, password);

    if (!result.success) {
      return result;
    }

    // Login OK: persistimos el token y el user en paralelo. Si esto
    // falla, la sesión no se restaura en el siguiente inicio.
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, result.authToken),
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user)),
    ]);

    // Configuramos Axios para que las próximas peticiones lleven
    // el token en el header Authorization.
    api.defaults.headers.common.Authorization = `Bearer ${result.authToken}`;

    // Actualizamos el estado global. AppNavigator reaccionará al
    // cambio de user y redirigirá a Guardian o Teacher.
    setUser(result.user);

    console.log('[AuthContext] login exitoso. user.role =', result.user.role, '| user.name =', result.user.name);
    return { success: true, user: result.user };
  }, []);

  // -----------------------------------------------------------------
  // Función "logout": cierra la sesión del usuario actual.
  // Limpia AsyncStorage, los headers de Axios y el estado global.
  // -----------------------------------------------------------------
  const logout = useCallback(async () => {
    try {
      // Eliminamos AMBAS claves de almacenamiento en una sola
      // operación atómica (multiRemove) para mayor eficiencia.
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.TOKEN]);

      // Removemos el header de Authorization de Axios para que
      // cualquier petición accidental no viaje con un token muerto.
      delete api.defaults.headers.common.Authorization;

      // Limpiamos el estado global. AppNavigator reaccionará a
      // este cambio y redirigirá a la pantalla de Login.
      setUser(null);
    } catch (error) {
      // Si algo falla al limpiar la sesión, lo registramos pero
      // no impedimos que el usuario salga de la app a nivel UI.
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
      // Función para iniciar sesión (definida arriba).
      login,
      // Función para cerrar la sesión actual.
      logout,
      // Bandera de carga: true mientras restauramos la sesión.
      isLoading,
      // Helpers convenientes derivados del estado:
      isAuthenticated: !!user, // true si hay usuario logueado.
      userRole: user?.role || null, // 'parent' | 'teacher' | null.
    }),
    [user, login, logout, isLoading], // Dependencias del memo.
  );

  // Renderizamos el Provider con el "value" memoizado. Cualquier
  // componente hijo podrá consumir este contexto vía useAuth().
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Exportamos por defecto el proveedor. Lo montaremos en la raíz
// de la aplicación (App.js) para que esté disponible en toda ella.
export default AuthProvider;
