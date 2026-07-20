// =====================================================================
// useAuth.js
// ---------------------------------------------------------------------
// Hook personalizado que expone el contexto de autenticación a los
// componentes funcionales. Su única responsabilidad es:
//   1) Consumir el AuthContext creado en context/AuthContext.js.
//   2) Validar que el consumidor esté envuelto por un AuthProvider,
//      lanzando un error descriptivo si no lo está (fail-fast).
//   3) Devolver el objeto { user, login, logout, isLoading } que
//      cualquier pantalla puede destructurar y usar directamente.
// Regla: este hook NO contiene lógica de negocio; solo delega en
// el Provider. Mantenerlo delgado facilita el testing y la lectura.
// =====================================================================

// Importamos useContext de React, el hook que permite a un componente
// funcional suscribirse al valor de un Context creado con createContext.
import { useContext } from 'react';

// Importamos el AuthContext desde su archivo. Lo nombramos con
// "llaves" porque la exportación es nombrada (export const AuthContext).
// Verificá que NO se exporta por default; el Provider sí se exporta
// por default en AuthContext.js.
import { AuthContext } from '../context/AuthContext';

// Definimos y exportamos el hook "useAuth". Es una convención del
// ecosistema React que los hooks empiecen con "use" para que ESLint
// y otros linters detecten violaciones de las reglas de hooks.
export const useAuth = () => {
  // Consumimos el contexto: useContext devuelve el "value" que el
  // AuthProvider pasó a su <AuthContext.Provider value={...} />.
  // Si no hay Provider por encima, useContext devuelve el valor por
  // defecto del createContext (en nuestro caso, "undefined").
  const context = useContext(AuthContext);

  // Verificación de seguridad: si el contexto es undefined, significa
  // que el componente que llamó a useAuth no está envuelto por un
  // <AuthProvider>. En lugar de dejar que la app falle silenciosa-
  // mente con un "Cannot read property 'user' of undefined", lanza-
  // mos un error claro y útil para el desarrollador. Esto se llama
  // "fail-fast" y es una práctica recomendada de DX.
  if (context === undefined) {
    throw new Error(
      // El mensaje identifica exactamente el problema y la solución.
      'useAuth debe ser utilizado dentro de un <AuthProvider>. '
        + 'Asegúrate de envolver tu árbol de componentes con <AuthProvider> en App.js.',
    );
  }

  // Si todo está bien, devolvemos el objeto del contexto. Los
  // consumidores destructurarán lo que necesiten, por ejemplo:
  // const { user, login, logout } = useAuth();
  console.log('[useAuth] user:', context.user, 'isLoading:', context.isLoading);
  return context;
};
