// =====================================================================
// app/(auth)/activation/verify.jsx
// ---------------------------------------------------------------------
// Pantalla 2/3 del flujo de activación: verificación del código OTP.
// URL: /activation/verify
//
// El usuario ingresa el código de 6 dígitos que recibió por SMS y
// presiona "Verificar código". Mock: simula la validación y navega
// a la pantalla de creación de contraseña.
// =====================================================================

// React + hooks.
import React, { useState } from 'react';

// Primitivas RN: View, Text, Pressable, ActivityIndicator.
import { View, Text, Pressable, ActivityIndicator } from 'react-native';

// useRouter de expo-router.
import { useRouter } from 'expo-router';

// Iconos Lucide.
import { KeyRound, ChevronLeft, RefreshCw } from 'lucide-react-native';

// Componentes UI reutilizables.
import Screen from '../../../src/components/Screen';
import TextField from '../../../src/components/TextField';
import Button from '../../../src/components/Button';
import BrandHeader from '../../_components/BrandHeader';

export default function VerifyScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // 6 dígitos exactos.
  const isValid = code.length === 6;

  // Handler de "Verificar código". Mock con setTimeout; en producción
  // se reemplaza por authService.verifyActivationOtp(phone, code).
  const handleVerify = () => {
    if (!isValid || isVerifying) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      router.push('/activation/set-password');
    }, 1500);
  };

  // Handler de "Reenviar código". Muestra un spinner breve para
  // feedback visual. Mock; en producción llama al mismo endpoint
  // que pidió el OTP originalmente.
  const handleResend = () => {
    if (isResending) return;
    setIsResending(true);
    setTimeout(() => {
      setIsResending(false);
    }, 1500);
  };

  return (
    <Screen
      edges={['top']}
      background="bg-slate-50"
      keyboardAvoid
    >
      <BrandHeader />

      <View className="flex-1 items-center justify-center px-6 py-8 w-full">
        <View className="w-full max-w-sm">
          {/* Título + subtítulo. */}
          <Text className="text-2xl font-bold text-slate-900">
            Código de verificación
          </Text>
          <Text className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
            Hemos enviado un código de 6 dígitos por SMS a tu celular.
          </Text>

          {/* Input OTP.
              - keyboardType="number-pad": teclado numérico.
              - maxLength={6}.
              - autoComplete="one-time-code" + textContentType="oneTimeCode":
                iOS/Android sugieren automáticamente el código recibido
                por SMS. Es la mejor UX posible para OTP. */}
          <TextField
            label="Código de 6 dígitos"
            value={code}
            onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
            placeholder="123456"
            placeholderTextColor="#94a3b8"
            icon={KeyRound}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            accessibilityLabel="Campo de código de verificación"
          />

          {/* Botón primario. */}
          <Button
            title="Verificar código"
            onPress={handleVerify}
            loading={isVerifying}
            disabled={!isValid || isVerifying}
            variant="sky"
            className="mt-2"
            accessibilityLabel="Botón verificar código"
          />

          {/* Link de "Reenviar código". Muestra spinner mientras se
              procesa, luego el texto normal. Es un Pressable con
              hitSlop para área táctil cómoda en mobile. */}
          <Pressable
            onPress={handleResend}
            disabled={isResending}
            hitSlop={8}
            className="flex-row items-center justify-center mt-6 py-2"
            accessibilityRole="button"
            accessibilityLabel="Reenviar código de verificación"
            accessibilityState={{ disabled: isResending }}
          >
            {isResending ? (
              <ActivityIndicator size="small" color="#64748b" />
            ) : (
              <RefreshCw size={14} color="#64748b" strokeWidth={2} />
            )}
            <Text className="text-sm text-slate-500 ml-1.5 font-medium">
              {isResending ? 'Reenviando…' : '¿No recibiste el código? Reenviar'}
            </Text>
          </Pressable>

          {/* Link "Volver" sutil. router.back() → phone input. */}
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center justify-center mt-4 py-2"
            accessibilityRole="button"
          >
            <ChevronLeft size={14} color="#94a3b8" strokeWidth={2} />
            <Text className="text-sm text-slate-400 ml-1">
              Volver
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
