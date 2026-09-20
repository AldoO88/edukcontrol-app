// =====================================================================
// app/(auth)/forgot-password/reset.jsx
// ---------------------------------------------------------------------
// Pantalla 3/3 del flujo de recuperación de contraseña: crear la nueva
// contraseña.
// URL: /forgot-password/reset
//
// El usuario establece una contraseña (mínimo 8 caracteres) y
// presiona "Guardar contraseña". Llama a:
//   POST /auth/forgot-password/reset  { phone, otpCode, newPassword }
// Si OK, muestra Alert de éxito y hace router.replace a "/" para que
// el usuario haga login manual con su nueva contraseña.
//
// Estilo: misma card blanca "ActivationCard" que el resto del flow.
// =====================================================================

// React + hooks.
import React, { useState } from 'react';

// Primitivas RN: View, Text, Alert.
import { View, Text, Alert } from 'react-native';

// useRouter + useLocalSearchParams de expo-router.
import { useRouter, useLocalSearchParams } from 'expo-router';

// Iconos Lucide.
import { Check } from 'lucide-react-native';

// Componentes UI reutilizables.
import Screen from '../../../src/components/Screen';
import PasswordField from '../../../src/components/PasswordField';
import Button from '../../../src/components/Button';
import BrandHeader from '../../_components/BrandHeader';

// Card del flow (mismo look que el LoginForm).
import ActivationCard from '../_components/ActivationCard';

// Color del icono Lock (interno de PasswordField): amber-500.
const LOCK_ICON_COLOR = '#f59e0b'; // amber-500

// Servicio de recuperación: completeReset.
import { completeReset } from '../../../src/services/passwordResetService';

// Mínimo de caracteres (coincide con el backend: >= 8).
const MIN_PASSWORD_LENGTH = 8;

export default function ForgotPasswordResetScreen() {
  const router = useRouter();

  // Leemos los params de la pantalla anterior.
  const params = useLocalSearchParams();
  const phone = typeof params.phone === 'string' ? params.phone : '';
  const code = typeof params.code === 'string' ? params.code : '';

  // Deep link sin params → volver al inicio del flow.
  if (!phone || !code) {
    router.replace('/forgot-password');
  }

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValid = password.length >= MIN_PASSWORD_LENGTH;

  // Handler de "Guardar contraseña".
  const handleSave = async () => {
    if (!isValid || isLoading) return;
    setIsLoading(true);
    try {
      const result = await completeReset({
        phone,
        otpCode: code,
        newPassword: password,
      });

      if (!result.success) {
        Alert.alert('No se pudo restablecer la contraseña', result.message);
        setIsLoading(false);
        return;
      }

      // Éxito: mostramos Alert y luego router.replace a "/" para
      // que el usuario haga login con la nueva contraseña.
      Alert.alert(
        'Contraseña restablecida',
        'Tu contraseña fue actualizada correctamente. Inicia sesión con tu nueva contraseña.',
        [
          {
            text: 'Iniciar sesión',
            onPress: () => router.replace('/'),
          },
        ],
      );
    } catch (error) {
      console.error('[ForgotPassword reset] Error inesperado:', error);
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
            title="Crea tu nueva contraseña"
            subtitle="Establece una contraseña segura de al menos 8 caracteres."
          >
            {/* Input de contraseña. */}
            <PasswordField
              value={password}
              onChangeText={setPassword}
              iconColor={LOCK_ICON_COLOR}
              error={
                password.length > 0 && !isValid
                  ? `Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`
                  : null
              }
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              textContentType="newPassword"
              labelClassName="uppercase tracking-wide text-xs text-slate-500 font-bold mb-2"
              accessibilityLabel="Campo de nueva contraseña"
            />

            {/* Botón "Guardar contraseña". */}
            <Button
              title="Guardar contraseña"
              onPress={handleSave}
              loading={isLoading}
              disabled={!isValid || isLoading}
              variant="sky"
              icon={Check}
              iconSize={20}
              iconColor="#ffffff"
              className="mt-2"
              accessibilityLabel="Botón guardar contraseña"
            />
          </ActivationCard>
        </View>
      </View>
    </Screen>
  );
}
