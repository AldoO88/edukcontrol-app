// =====================================================================
// app/(auth)/forgot-password/index.jsx
// ---------------------------------------------------------------------
// Pantalla 1/3 del flujo de recuperación de contraseña: input del
// número de celular.
// URL: /forgot-password
//
// El usuario ingresa el número de 10 dígitos asociado a su cuenta y
// presiona "Enviar código por SMS". Llama a:
//   POST /auth/forgot-password/request  { phone }
// Response 200: { message, expiresAt }  ← el expiresAt se usa para
//   mostrar un countdown de 10 minutos.
//
// Estilo: misma card blanca "ActivationCard" que el login y el flujo
// de activación (look consistente entre los entry points pre-login).
// =====================================================================

// React + hooks de estado local.
import React, { useEffect, useRef, useState } from 'react';

// Primitivas RN: View, Text, Pressable, Alert.
import { View, Text, Pressable, Alert } from 'react-native';

// useRouter de expo-router.
import { useRouter } from 'expo-router';

// Iconos Lucide.
import { Phone, ChevronLeft, Clock, Send } from 'lucide-react-native';

// Wrapper de pantalla institucional.
import Screen from '../../../src/components/Screen';

// Input de texto reutilizable.
import TextField from '../../../src/components/TextField';

// Botón reutilizable.
import Button from '../../../src/components/Button';

// Header de marca EdukControl.
import BrandHeader from '../../_components/BrandHeader';

// Card del flow (mismo look que el LoginForm).
import ActivationCard from '../_components/ActivationCard';

// Servicio de recuperación de contraseña.
import { requestReset } from '../../../src/services/passwordResetService';

// Color del icono de Teléfono: sky-500 (mismo que login y activación).
const PHONE_ICON_COLOR = '#0ea5e9'; // sky-500

// ---------------------------------------------------------------------
// formatCountdown(remainingSeconds)
// ---------------------------------------------------------------------
// Formatea un número de segundos restantes como "MM:SS". Si el
// tiempo es > 60min (caso raro: el server podría usar otro TTL),
// lo formatea como "HH:MM:SS".
const formatCountdown = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}:${String(m).padStart(2, '0')}:00`;
  }
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

export default function ForgotPasswordIndexScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Ref para el interval del countdown (cleanup en unmount).
  const intervalRef = useRef(null);

  // Validación: 10 dígitos exactos.
  const isValid = phone.length === 10;

  // Countdown en tiempo real.
  useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const tick = () => {
      const now = Date.now();
      const remainingMs = Math.max(0, expiresAt - now);
      const remainingSec = Math.floor(remainingMs / 1000);
      setRemainingSeconds(remainingSec);

      if (remainingMs <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [expiresAt]);

  // Handler de "Enviar código". Llama al backend para pedir el OTP.
  // Si todo va bien, guarda el expiresAt para el countdown y
  // navega a la pantalla 2 pasando el phone como param.
  const handleSendCode = async () => {
    if (!isValid || isLoading) return;
    setIsLoading(true);
    try {
      const result = await requestReset(phone);

      if (!result.success) {
        Alert.alert('No se pudo enviar el código', result.message);
        setIsLoading(false);
        return;
      }

      // Guardamos el expiresAt del backend para el countdown.
      const expiresAtMs = result.expiresAt
        ? new Date(result.expiresAt).getTime()
        : Date.now() + 10 * 60 * 1000;
      setExpiresAt(expiresAtMs);

      // Éxito: navegamos a la pantalla 2 pasando el phone.
      router.push({
        pathname: '/forgot-password/verify',
        params: { phone },
      });
    } catch (error) {
      console.error('[ForgotPassword index] Error inesperado:', error);
      Alert.alert(
        'Error',
        'Ocurrió un problema inesperado. Inténtalo de nuevo.',
      );
      setIsLoading(false);
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
            title="Recuperar contraseña"
            subtitle="Ingresa el número de celular asociado a tu cuenta. Te enviaremos un código por SMS."
          >
            {/* CAMPO: TELÉFONO */}
            <TextField
              label="TELÉFONO"
              labelClassName="uppercase tracking-wide text-xs text-slate-500 font-bold mb-2"
              value={phone}
              onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
              placeholder="+52 55 1234 5678"
              placeholderTextColor="#cbd5e1"
              icon={Phone}
              iconColor={PHONE_ICON_COLOR}
              iconSize={20}
              keyboardType="phone-pad"
              maxLength={10}
              autoComplete="tel"
              textContentType="telephoneNumber"
              accessibilityLabel="Campo de teléfono"
            />

            {/* Countdown timer: solo cuando hay un código pendiente. */}
            {expiresAt && remainingSeconds > 0 && (
              <View className="flex-row items-center mt-2 py-2 px-3 bg-sky-50 rounded-lg self-start">
                <Clock size={14} color="#0369a1" strokeWidth={2} />
                <Text className="text-xs font-medium text-sky-700 ml-1.5">
                  El código expira en {formatCountdown(remainingSeconds)}
                </Text>
              </View>
            )}

            {expiresAt && remainingSeconds === 0 && (
              <View className="mt-2 py-2 px-3 bg-amber-50 rounded-lg self-start">
                <Text className="text-xs font-medium text-amber-700">
                  El código expiró. Vuelve a solicitar uno.
                </Text>
              </View>
            )}

            {/* Botón "Enviar código por SMS" */}
            <Button
              title="Enviar código por SMS"
              onPress={handleSendCode}
              loading={isLoading}
              disabled={!isValid || isLoading}
              variant="sky"
              icon={Send}
              iconSize={20}
              iconColor="#ffffff"
              className="mt-4"
              accessibilityLabel="Botón enviar código por SMS"
            />

            {/* Divisor + link Cancelar. */}
            <View className="border-t border-slate-200 my-4" />

            <Pressable
              onPress={() => router.replace('/')}
              className="flex-row items-center justify-center py-2"
              accessibilityRole="button"
              accessibilityLabel="Cancelar y volver al inicio de sesión"
            >
              <ChevronLeft size={16} color="#64748b" strokeWidth={2.25} />
              <Text className="text-sm text-slate-500 ml-1 font-medium">
                Volver al inicio de sesión
              </Text>
            </Pressable>
          </ActivationCard>
        </View>
      </View>
    </Screen>
  );
}
