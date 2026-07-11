// =====================================================================
// AuthContext.js
// ---------------------------------------------------------------------
// Proveedor de contexto de autenticación para "EdukControl".
// Se encarga de:
//   1) Crear y exportar el AuthContext (objeto de contexto de React).
//   2) Exponer el componente AuthProvider que envolverá toda la app
//      y proveerá los valores { user, login, logout, isLoading }.
//   3) Persistir la sesión del usuario en almacenamiento local
//      (AsyncStorage) para que la sesión sobreviva al cierre de la app.
//   4) Restaurar la sesión automáticamente al iniciar la aplicación.
// =====================================================================

// Importamos React y los hooks necesarios: createContext para crear
// el contexto, useState para manejar el estado interno, useEffect
// para ejecutar lógica al montar el componente y useCallback para
// memoizar funciones y evitar renders innecesarias en los consumidores.
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';

// Importamos AsyncStorage: API de almacenamiento asíncrono y
// persistente (clave-valor) que funciona idéntico en iOS y Android.
// Lo usaremos para guardar los datos del usuario logueado y que
// la sesión se mantenga entre reinicios de la app.
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importamos la instancia configurada de Axios desde el archivo
// de servicios. Toda llamada HTTP debe pasar por "api" para tener
// URL base, interceptores y headers centralizados.
import api from '../services/api';

// Creamos el contexto de autenticación. El valor por defecto es
// "undefined" intencionalmente: nos permite detectar en el hook
// useAuth si un componente intenta consumir el contexto sin estar
// envuelto por el AuthProvider (lanzaremos un error descriptivo).
export const AuthContext = createContext(undefined);

// Claves constantes que usaremos para guardar/leer información en
// AsyncStorage. Definirlas aquí evita errores de tipeo y facilita
// el mantenimiento si más adelante cambia el namespace de claves.
const STORAGE_KEYS = {
  // Clave para persistir el objeto "user" serializado como JSON.
  USER: '@edukcontrol/user',
  // Clave para persistir el token de sesión (JWT) que enviaremos
  // en el header Authorization de cada petición al backend.
  TOKEN: '@edukcontrol/token',
};

// Definimos y exportamos el proveedor "AuthProvider". Recibe como
// prop "children" (todos los componentes hijos que envolverá).
export const AuthProvider = ({ children }) => {
  // Estado "user": almacena la información del usuario autenticado
  // (id, name, email, role, children, etc.) o "null" si nadie ha
  // iniciado sesión. Inicia en null porque aún no sabemos si hay
  // una sesión guardada hasta revisar AsyncStorage.
  const [user, setUser] = useState(null);

  // Estado "isLoading": controla la pantalla de carga inicial.
  // Mientras es "true", mostraremos un splash/ActivityIndicator
  // para no parpadear entre Login y la app principal. Inicia en
  // "true" precisamente porque aún estamos verificando la sesión.
  const [isLoading, setIsLoading] = useState(true);

  // -----------------------------------------------------------------
  // useEffect: se ejecuta UNA sola vez al montar el AuthProvider.
  // Su objetivo es revisar si existe una sesión persistida en
  // AsyncStorage y, de ser así, restaurar al usuario y el token.
  // -----------------------------------------------------------------
  useEffect(() => {
    // Definimos una función auto-ejecutable asíncrona (IIFE) porque
    // useEffect no permite directamente funciones async en su callback.
    (async () => {
      try {
        // Leemos en paralelo (Promise.all) tanto el usuario como
        // el token guardados. Promise.all evita esperar dos ciclos.
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        ]);

        // Si encontramos ambos valores, los restauramos. Validamos
        // que NO sean null/undefined y que el JSON sea parseable.
        if (storedUser && storedToken) {
          // Reconstruimos el objeto "user" desde el string JSON.
          const parsedUser = JSON.parse(storedUser);

          // Actualizamos el estado con el usuario restaurado.
          setUser(parsedUser);

          // Inyectamos el token en los headers por defecto de Axios
          // para que TODAS las peticiones siguientes viajen autenticadas.
          api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
        }
      } catch (error) {
        // Si algo falla (JSON corrupto, error de I/O), lo registramos
        // en consola y limpiamos los restos para evitar estados
        // fantasma en próximas ejecuciones.
        console.error('[AuthContext] Error restaurando sesión:', error);
        await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.TOKEN]);
      } finally {
        // Independientemente del resultado, dejamos de cargar.
        // Esto permite que la navegación decida qué pantalla mostrar.
        setIsLoading(false);
      }
    })();
  }, []); // Array de dependencias vacío => solo se ejecuta al montar.

  // -----------------------------------------------------------------
  // Función "login": realiza la autenticación contra el backend.
  // Recibe email y password, llama al endpoint, guarda la sesión
  // y actualiza el estado global. Retorna un objeto con "success"
  // para que la pantalla (LoginScreen) sepa si mostrar errores.
  // -----------------------------------------------------------------
  const login = useCallback(async (email, password) => {
    try {
      // Limpiamos espacios y validamos que los campos no estén vacíos
      // antes de gastar una petición HTTP. Es una validación rápida
      // del lado del cliente para mejorar la experiencia de usuario.
      const cleanEmail = (email || '').trim();
      const cleanPassword = (password || '').trim();

      if (!cleanEmail || !cleanPassword) {
        return { success: false, message: 'Por favor ingresa correo y contraseña.' };
      }

      // Realizamos la petición POST al endpoint de login. La ruta
      // "/auth/login" debe estar definida en el backend de EdukControl.
      const response = await api.post('/auth/login', {
        email: cleanEmail,
        password: cleanPassword,
      });

      // Extraemos los datos relevantes de la respuesta. La estructura
      // esperada es: { user: {...}, token: 'jwt...' }
      const { user: userData, token } = response.data || {};

      // Si el backend no devuelve usuario o token, es un error de
      // contrato. Lanzamos un error para caer en el catch y mostrar
      // un mensaje genérico y seguro al usuario.
      if (!userData || !token) {
        return { success: false, message: 'Respuesta inválida del servidor.' };
      }

      // Persistimos en AsyncStorage en paralelo: el usuario como
      // JSON y el token como string. Si esto falla, no podríamos
      // restaurar la sesión en el siguiente inicio, así que es
      // importante que ambas escrituras se completen.
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData)),
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token),
      ]);

      // Configuramos Axios para que TODAS las peticiones siguientes
      // lleven el token en el header Authorization. Esta es la forma
      // idiomática de manejar JWT en Axios (vía defaults.headers).
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      // Actualizamos el estado global con el usuario recién logueado.
      // Esto provocará un re-render de los consumidores del contexto
      // y, gracias al AppNavigator, se navegará automáticamente
      // hacia las pantallas internas (Guardian o Teacher).
      setUser(userData);

      // Devolvemos un resultado exitoso para que LoginScreen pueda,
      // por ejemplo, mostrar un Toast de bienvenida.
      return { success: true, user: userData };
    } catch (error) {
      // Si el backend devolvió un 401/403, mostramos mensaje del
      // servidor si existe; de lo contrario, un mensaje genérico.
      const message =
        error?.response?.data?.message ||
        'No fue posible iniciar sesión. Verifica tus credenciales.';

      // Log del error para debugging durante el desarrollo.
      console.error('[AuthContext] Error en login:', error);

      // Retornamos el fallo con el mensaje adecuado.
      return { success: false, message };
    }
  }, []); // useCallback sin dependencias: la función nunca cambia.

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
  }, []); // useCallback sin dependencias.

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
      userRole: user?.role || null, // 'guardian' | 'teacher' | null.
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
