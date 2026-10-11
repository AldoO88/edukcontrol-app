// =====================================================================
// useKeyboardVisible.js
// ---------------------------------------------------------------------
// Hook que devuelve true mientras el teclado virtual está abierto.
//
// Se usa en las pantallas de auth (login, activación, recuperación)
// para anclar el formulario arriba cuando el teclado aparece en
// Android: con softwareKeyboardLayoutMode: "pan" (necesario desde
// SDK 57 por edge-to-edge) el sistema solo sube la ventana lo
// mínimo y el contenido centrado queda a medio tapar por el
// teclado. En iOS NO se usa este estado: el KeyboardAvoidingView
// con behavior "padding" de Screen.jsx ya resuelve el caso.
//
// Eventos: iOS tiene willShow/willHide (animación); Android solo
// didShow/didHide. Escuchamos el par que corresponda a cada SO.
// =====================================================================

// React hooks: estado + efecto de suscripción.
import { useEffect, useState } from 'react';

// Keyboard de RN: addListener emite objetos de evento (endCoordinates)
// e isVisible() da el estado actual al montar (por si la pantalla
// entra con el teclado ya abierto, p.ej. al navegar entre pantallas
// del flujo de activación sin cerrar el teclado).
import { Keyboard, Platform } from 'react-native';

// Devuelve boolean: true si el teclado virtual está visible.
export const useKeyboardVisible = () => {
  // Estado inicial: consultamos el estado real del teclado por si
  // esta pantalla se monta con el teclado ya abierto (los listeners
  // solo disparan en transiciones posteriores). Si isVisible() no
  // reflejara nada, queda false y el siguiente didShow lo corrige.
  const [visible, setVisible] = useState(() => Keyboard.isVisible());

  useEffect(() => {
    // Eventos según plataforma: iOS anima con will*, Android solo
    // confirma con did*.
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    // Suscripciones. addListener devuelve una subscription con
    // .remove() (API vigente; removeKeyboardEventListener está
    // deprecado en SDK 57).
    const showSubscription = Keyboard.addListener(showEvent, () =>
      setVisible(true)
    );
    const hideSubscription = Keyboard.addListener(hideEvent, () =>
      setVisible(false)
    );

    // Cleanup al desmontar: sin esto, cada pantalla que entra y
    // sale del stack de auth acumularía listeners vivos.
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return visible;
};
