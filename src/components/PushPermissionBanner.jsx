// =====================================================================
// PushPermissionBanner.jsx
// ---------------------------------------------------------------------
// Banner de permiso de notificaciones DENEGADO (Fase 4 — release 2026-11).
//
// Problema que resuelve: si el usuario rechaza el prompt del sistema
// ("EdukControl quiere enviarte notificaciones"), el hook
// usePushNotifications queda en status='denied' y la app no decía nada:
// ese usuario nunca registraba token y nunca recibía pushes, en silencio
// total. Peor: en iOS una vez denegado el sistema NO vuelve a mostrar
// el prompt (y en Android 13+ tampoco tras "no permitir y no volver a
// preguntar"), así que la ÚNICA salida es la pantalla de Ajustes del
// sistema — de ahí el botón con openSettings() de expo-linking.
//
// Uso (lo montan los 5 layouts de rol: (guardian), (teacher),
// (director), (prefect), (social-worker)):
//   const { status: pushStatus } = usePushNotifications(!!user);
//   ...
//   <PushPermissionBanner status={pushStatus} />
//
// Comportamiento:
//   - Solo pinta cuando status === 'denied'. El resto de estados no
//     ameritan banner: 'registered' está OK, 'requesting' es el prompt
//     del sistema en curso, 'unsupported' es simulador/sin projectId
//     (no tiene qué guiar el usuario), 'error' es de red (transitorio).
//   - Descartable con la X; el estado vive en el componente, así que si
//     el usuario cierra la app y vuelve a entrar al grupo, reaparece
//     (decisión de UX: preferimos repetir el aviso a que quede sin
//     notificar permanentemente).
//   - Tras volver de Ajustes con el permiso YA activado, el listener de
//     AppState del hook re-evalúa el setup, el status sale de 'denied'
//     y el banner desaparece solo (y — lo importante — se registra el
//     token que faltaba).
//
// Nota de arquitectura: src/components/ es UI primitiva — no toca
// contextos de negocio ni navega dentro de la app. openSettings() abre
// la pantalla de Ajustes del SISTEMA (salto al SO, no navegación
// interna), por eso cabe aquí.
// =====================================================================

// React + primitivas RN. useSafeAreaInsets viene de
// react-native-safe-area-context (NUNCA de react-native — regla del
// proyecto); hace falta porque este banner es el primer hijo del layout
// y debe respetar el notch/barra de estado en iOS/edge-to-edge Android.
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// openSettings() de expo-linking (la librería de linking del proyecto;
// SDK 57 la expone igual que RN core pero mantiene una sola fuente).
import { openSettings } from 'expo-linking';

// Iconos Lucide (set ya instalado — regla del proyecto).
import { BellOff, X } from 'lucide-react-native';

/**
 * Banner superior de permiso de notificaciones denegado.
 *
 * @param {string} status — status del usePushNotifications. Pinta solo
 *   cuando es exactamente 'denied'.
 */
export default function PushPermissionBanner({ status }) {
  // Descarte manual (X). Vive aquí: cada mount del layout lo resetea.
  const [dismissed, setDismissed] = useState(false);

  // Insets de safe area para no meter el texto bajo el notch iOS ni
  // bajo la barra de estado en Android edge-to-edge.
  const insets = useSafeAreaInsets();

  // Fuera del caso de uso → nada que renderizar.
  if (status !== 'denied' || dismissed) {
    return null;
  }

  return (
    // accessibilityRole="alert": los lectores de pantalla anuncian el
    // aviso de inmediato al montar (es una condición que bloquea una
    // feature, no decoración).
    <View
      accessibilityRole="alert"
      className="flex-row items-start bg-amber-50 border-b border-amber-200 px-4"
      style={{ paddingTop: insets.top + 10, paddingBottom: 12 }}
    >
      {/* Icono de campana tachada — refuerza visual del mensaje. */}
      <BellOff size={18} color="#d97706" style={{ marginTop: 2 }} />

      <View className="flex-1 ml-3">
        <Text
          maxFontSizeMultiplier={1.3}
          className="text-amber-600 text-sm font-bold"
        >
          Notificaciones desactivadas
        </Text>
        <Text maxFontSizeMultiplier={1.3} className="text-slate-500 text-xs mt-0.5">
          Sin permiso no recibirás en tu celular los avisos de asistencia,
          citatorios y comunicados de la escuela.
        </Text>

        {/* Acción principal: saltar a Ajustes del sistema. En iOS no hay
            forma de re-mostrar el prompt (la API lo permite solo en
            estado "undetermined"), así que openSettings es el único
            camino para que el usuario conceda el permiso. */}
        <Pressable
          onPress={() => {
            openSettings().catch((err) => {
              // Fallo rarísimo (emulador sin Settings); no romper la app.
              console.warn(
                '[PushPermissionBanner] openSettings() falló:',
                err?.message
              );
            });
          }}
          accessibilityRole="button"
          accessibilityLabel="Abrir los ajustes de la aplicación"
          className="mt-2 self-start bg-amber-500 px-3.5 py-2 rounded-lg"
        >
          <Text maxFontSizeMultiplier={1.3} className="text-white text-xs font-bold">
            Abrir Ajustes
          </Text>
        </Pressable>
      </View>

      {/* Cierre manual: si el usuario prefiere ignorarlo, que pueda
          quitárselo de encima (vuelve al próximo mount del layout). */}
      <Pressable
        onPress={() => setDismissed(true)}
        accessibilityRole="button"
        accessibilityLabel="Descartar aviso de notificaciones"
        hitSlop={8}
        className="ml-2 py-1"
      >
        <X size={16} color="#d97706" />
      </Pressable>
    </View>
  );
}
