// =====================================================================
// app/(auth)/activation/verify.jsx
// ---------------------------------------------------------------------
// Pantalla 2/3 del flujo de activación: verificación del código OTP.
// URL: /activation/verify
//
// El usuario ingresa el código de 6 dígitos que recibió por SMS y
// presiona "Verificar código". Mock: simula la validación y navega
// a la pantalla de creación de contraseña.
//
// Estilo: card blanca "ActivationCard" (mismo look que el login con
// "Bienvenido" y que la pantalla 1 de activación). Label CÓDIGO en
// mayúsculas, icono KeyRound sky, botón sky con icono Check, links
// de reenvío y volver bajo el divisor.
// =====================================================================

// React + hooks.
import React, { useState } from 'react';

// Primitivas RN: View, Text, Pressable, ActivityIndicator, Alert.
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';

// useRouter + useLocalSearchParams de expo-router. El segundo nos
// da acceso a los params que pasó la pantalla anterior (phone) via
// router.push({ pathname, params }). Los params vienen como string
// en la URL, por eso validamos el formato.
import { useRouter, useLocalSearchParams } from 'expo-router';

// Iconos Lucide.
import {
  KeyRound,
  ChevronLeft,
  RefreshCw,
  Check,
} from 'lucide-react-native';

// Componentes UI reutilizables.
import Screen from '../../../src/components/Screen';
import TextField from '../../../src/components/TextField';
import Button from '../../../src/components/Button';
import BrandHeader from '../../_components/BrandHeader';

// Card del flow de activación (mismo look que el LoginForm).
import ActivationCard from '../_components/ActivationCard';

// Color del icono KeyRound: sky-500 (mismo acento que el campo
// TELÉFONO en login y activación-paso-1).
const CODE_ICON_COLOR = '#0ea5e9'; // sky-500

// Servicio de activación: verifyActivationOtp (valida el código)
// y requestActivationOtp (para reenviar).
import {
  verifyActivationOtp,
  requestActivationOtp,
} from '../../../src/services/activationService';

export default function VerifyScreen() {
  const router = useRouter();
  // Leemos el phone que la pantalla 1 pasó por params. Si el
  // usuario llegó aquí por deep link (sin pasar por la pantalla 1),
  // el param no existirá y caemos al login.
  const params = useLocalSearchParams();
  const phone = typeof params.phone === 'string' ? params.phone : '';

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // 6 dígitos exactos.
  const isValid = code.length === 6;

  // Si no hay phone (deep link directo), no tiene sentido estar
  // aquí. Redirigimos al inicio del flow.
  if (!phone) {
    // No usamos useEffect para no causar un re-render warning;
    // la redirección se hace en el primer render.
    router.replace('/activation');
  }

  // Handler de "Verificar código". Llama al backend para validar
  // el OTP. Si OK, navega a la pantalla 3 pasando phone + code.
  const handleVerify = async () => {
    if (!isValid || isVerifying) return;
    setIsVerifying(true);
    try {
      // IMPORTANTE: el backend espera el campo "otpCode", NO "code".
      // Esta es la convención del contrato: cualquier otro nombre
      // (code, otp, etc.) resultaría en 400.
      const result = await verifyActivationOtp(phone, code);

      if (!result.success) {
        // El service ya mapea el mensaje del server a español.
        // Si la razón es 'expired' o 'already_active', el mensaje
        // ya es específico; si no, es el genérico.
        Alert.alert('No se pudo verificar', result.message);
        setIsVerifying(false);
        return;
      }

      // Éxito: navegamos a la pantalla 3 pasando phone + code.
      // El code es necesario para que la pantalla 3 (set-password)
      // lo re-envíe al backend en el endpoint /activate-account
      // (el server hace defense-in-depth: re-valida el código aunque
      // el cliente ya lo haya validado).
      router.push({
        pathname: '/activation/set-password',
        params: { phone, code },
      });
    } catch (error) {
      console.error('[Activation verify] Error inesperado:', error);
      Alert.alert(
        'Error',
        'Ocurrió un problema inesperado. Inténtalo de nuevo.',
      );
      setIsVerifying(false);
    }
  };

  // Handler de "Reenviar código". Llama al mismo endpoint que la
  // pantalla 1 (requestActivationOtp) — el backend genera un código
  // nuevo y envía otro SMS. El código anterior queda invalidado.
  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      const result = await requestActivationOtp(phone);
      if (!result.success) {
        Alert.alert('No se pudo reenviar', result.message);
      } else {
        // Limpiamos el código actual: el nuevo SMS trae un código
        // distinto, el viejo ya no sirve. Buena UX: evitamos que el
        // usuario intente con el código anterior.
        setCode('');
        Alert.alert(
          'Código reenviado',
          'Revisa tu celular. Te enviamos un nuevo código.',
        );
      }
    } catch (error) {
      console.error('[Activation verify] Error inesperado reenvío:', error);
      Alert.alert('Error', 'No se pudo reenviar el código.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Screen
      edges={['top']}
      background="bg-slate-50"
      keyboardAvoid
    >
      <BrandHeader />

      <View className="flex-1 items-center justify-center px-6 py-4 w-full">
        <View className="w-full max-w-sm">
          <ActivationCard
            title="Código de verificación"
            subtitle="Hemos enviado un código de 6 dígitos por SMS a tu celular."
          >
            {/* Input OTP.
                - label "CÓDIGO" UPPERCASE con labelClassName.
                - icon KeyRound en sky-500 (acento azul institucional).
                - keyboardType="number-pad": teclado numérico.
                - maxLength={6}.
                - autoComplete="one-time-code" + textContentType=
                  "oneTimeCode": iOS/Android sugieren automáticamente
                  el código recibido por SMS. Es la mejor UX posible
                  para OTP. */}
            <TextField
              label="CÓDIGO"
              labelClassName="uppercase tracking-wide text-xs text-slate-500 font-bold mb-2"
              value={code}
              onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
              placeholder="123456"
              placeholderTextColor="#cbd5e1"
              icon={KeyRound}
              iconColor={CODE_ICON_COLOR}
              iconSize={20}
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              accessibilityLabel="Campo de código de verificación"
            />

            {/* Botón "Verificar código" con icono Check a la derecha
                del label — refuerza la idea de "confirmar/validar". */}
            <Button
              title="Verificar código"
              onPress={handleVerify}
              loading={isVerifying}
              disabled={!isValid || isVerifying}
              variant="sky"
              icon={Check}
              iconSize={20}
              iconColor="#ffffff"
              className="mt-2"
              accessibilityLabel="Botón verificar código"
            />

            {/* Divisor sutil: separa el bloque "verificar" del
                bloque "reenviar / volver" — mismo patrón que la
                pantalla 1. */}
            <View className="border-t border-slate-200 my-4" />

            {/* Link "Reenviar código" con spinner mientras procesa.
                hitSlop para área táctil cómoda en mobile. */}
            <Pressable
              onPress={handleResend}
              disabled={isResending}
              hitSlop={8}
              className="flex-row items-center justify-center py-2"
              accessibilityRole="button"
              accessibilityLabel="Reenviar código de verificación"
              accessibilityState={{ disabled: isResending }}
            >
              {isResending ? (
                <ActivityIndicator size="small" color="#64748b" />
              ) : (
                <RefreshCw size={14} color="#64748b" strokeWidth={2.25} />
              )}
              <Text className="text-sm text-slate-500 ml-1.5 font-medium">
                {isResending
                  ? 'Reenviando…'
                  : '¿No recibiste el código? Reenviar'}
              </Text>
            </Pressable>

            {/* Link "Volver" sutil. router.back() → phone input. */}
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="flex-row items-center justify-center mt-3 py-2"
              accessibilityRole="button"
              accessibilityLabel="Volver a la pantalla anterior"
            >
              <ChevronLeft size={14} color="#94a3b8" strokeWidth={2.25} />
              <Text className="text-sm text-slate-400 ml-1">
                Volver
              </Text>
            </Pressable>
          </ActivationCard>
        </View>
      </View>
    </Screen>
  );
}
