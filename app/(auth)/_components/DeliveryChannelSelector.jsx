// =====================================================================
// app/(auth)/_components/DeliveryChannelSelector.jsx
// ---------------------------------------------------------------------
// Selector de canal de entrega del OTP: radio exclusivo "SMS" /
// "WhatsApp" (píldoras tipo segmented control) para los flujos de
// activación y recuperación de contraseña.
//
// Contexto (App Store Guideline 4.2.3(i), 2026-10-27): SMS es el canal
// PRINCIPAL y garantizado (nativo, no exige instalar apps); WhatsApp es
// una ALTERNATIVA que el usuario elige de forma explícita — elegirlo
// equivale a dar consentimiento para recibir mensajes por ese canal
// (el backend lo persiste con source = activation_request /
// password_reset_request).
//
// Uso:
//   const [channel, setChannel] = useState('sms');
//   <DeliveryChannelSelector value={channel} onChange={setChannel} />
//
// El valor ('sms' | 'whatsapp') viaja como param de navegación a la
// pantalla verify (para el subtítulo y el reenvío) y como
// `delivery_channel` en el body del request al backend.
// =====================================================================

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MessageSquare, MessageCircle } from 'lucide-react-native';

// Opciones del radio: value + label + icono Lucide.
// (Sin icono "WhatsApp" de marca: lucide no incluye logos; se usa
// MessageCircle como representación genérica de chat.)
const OPTIONS = [
  { value: 'sms', label: 'SMS', Icon: MessageSquare },
  { value: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
];

export default function DeliveryChannelSelector({ value, onChange }) {
  return (
    <View className="mt-4">
      {/* Label estilo TextField ("¿DÓNDE RECIBES TU CÓDIGO?"). */}
      <Text className="uppercase tracking-wide text-xs text-slate-500 font-bold mb-2">
        ¿DÓNDE RECIBES TU CÓDIGO?
      </Text>

      <View className="flex-row gap-2">
        {OPTIONS.map(({ value: optValue, label, Icon }) => {
          const selected = value === optValue;
          return (
            <Pressable
              key={optValue}
              onPress={() => onChange?.(optValue)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`Recibir código por ${label}`}
              className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg border ${
                selected
                  ? 'bg-sky-600 border-sky-600'
                  : 'bg-white border-slate-200'
              }`}
            >
              <Icon
                size={16}
                color={selected ? '#ffffff' : '#64748b'}
                strokeWidth={2}
              />
              <Text
                maxFontSizeMultiplier={1.3}
                className={`text-sm font-semibold ml-1.5 ${
                  selected ? 'text-white' : 'text-slate-600'
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Nota sutil: refuerza que SMS no requiere nada extra. */}
      <Text
        maxFontSizeMultiplier={1.3}
        className="text-xs text-slate-400 mt-1.5"
      >
        {value === 'whatsapp'
          ? 'Se enviará a tu número con WhatsApp.'
          : 'Llega como mensaje de texto; no necesitas instalar nada.'}
      </Text>
    </View>
  );
}
