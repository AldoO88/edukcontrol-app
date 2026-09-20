// =====================================================================
// app/(auth)/forgot-password/verify.jsx
// ---------------------------------------------------------------------
// Pantalla 2/3 del flujo de recuperación de contraseña: verificación
// del código OTP.
// URL: /forgot-password/verify
//
// El usuario ingresa el código de 6 dígitos que recibió por SMS y
// presiona "Verificar código". Llama a:
//   POST /auth/forgot-password/verify  { phone, otpCode }
// Si OK, navega a la pantalla 3 pasando phone + code como params.
//
// Estilo: misma card blanca "ActivationCard" que el resto del flow
// pre-login.
// =====================================================================

// React + hooks.
import React, { useState } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';

// useRouter + useLocalSearchParams de expo-router.
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

// Card del flow (mismo look que el LoginForm).
import ActivationCard from '../_components/ActivationCard';

// Color del icono KeyRound: sky-500 (mismo que activación).
const CODE_ICON_COLOR = '#0ea5e9'; // sky-500

// Servicio de recuperación: verifyResetOtp + requestReset (para reenviar).
import {
  verifyResetOtp,
  requestReset,
} from '../../../src/services/passwordResetService';

export default function ForgotPasswordVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const phone = typeof params.phone === 'string' ? params.phone : '';

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const isValid = code.length === 6;

  // Si no hay phone (deep link directo), redirigimos al inicio del flow.
  if (!phone) {
    router.replace('/forgot-password');
  }

  // Handler de "Verificar código".
  const handleVerify = async () => {
    if (!isValid || isVerifying) return;
    setIsVerifying(true);
    try {
      const result = await verifyResetOtp(phone, code);

      if (!result.success) {
        Alert.alert('No se pudo verificar', result.message);
        setIsVerifying(false);
        return;
      }

      // Éxito: navegamos a la pantalla 3 pasando phone + code.
      // El code es necesario porque resetPassword lo re-valida
      // (defense-in-depth).
      router.push({
        pathname: '/forgot-password/reset',
        params: { phone, code },
      });
    } catch (error) {
      console.error('[ForgotPassword verify] Error inesperado:', error);
      Alert.alert(
        'Error',
        'Ocurrió un problema inesperado. Inténtalo de nuevo.',
      );
      setIsVerifying(false);
    }
  };

  // Handler de "Reenviar código". Llama al mismo endpoint que la
  // pantalla 1 — el backend genera un código nuevo e invalida el viejo.
  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      const result = await requestReset(phone);
      if (!result.success) {
        Alert.alert('No se pudo reenviar', result.message);
      } else {
        setCode('');
        Alert.alert(
          'Código reenviado',
          'Revisa tu celular. Te enviamos un nuevo código.',
        );
      }
    } catch (error) {
      console.error('[ForgotPassword verify] Error inesperado reenvío:', error);
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
            {/* Input OTP. */}
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

            {/* Botón "Verificar código". */}
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

            {/* Divisor. */}
            <View className="border-t border-slate-200 my-4" />

            {/* Link "Reenviar código". */}
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

            {/* Link "Volver". */}
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
