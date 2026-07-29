// =====================================================================
// app/(auth)/activation/set-password.jsx
// ---------------------------------------------------------------------
// Pantalla 3/3 del flujo de activación: crear la contraseña.
// URL: /activation/set-password
//
// El usuario establece una contraseña (mínimo 8 caracteres) y
// presiona "Guardar y entrar". Mock: simula el guardado final, hace
// router.replace al dashboard para que el back gesture no devuelva
// al usuario a la pantalla de password (flujo de activación
// terminado, no debe ser reversible).
//
// Estilo: card blanca "ActivationCard" (mismo look que el login y
// las pantallas anteriores del flow). Label CONTRASEÑA en
// mayúsculas, icono Lock en amber, botón sky con icono LogIn
// (entrada al sistema, mismo icono que el login principal).
// =====================================================================

// React + hooks.
import React, { useState } from 'react';

// Primitivas RN: View, Text, Alert.
import { View, Text, Alert } from 'react-native';

// useRouter + useLocalSearchParams de expo-router. Esta pantalla
// recibe phone y code como params de la pantalla anterior.
import { useRouter, useLocalSearchParams } from 'expo-router';

// Iconos Lucide.
import { LogIn } from 'lucide-react-native';

// Componentes UI reutilizables.
import Screen from '../../../src/components/Screen';

// PasswordField ya encapsula el patrón de "input con candado a la
// izquierda + botón toggle de visibilidad a la derecha" (es el
// mismo componente que usa LoginForm).
import PasswordField from '../../../src/components/PasswordField';
import Button from '../../../src/components/Button';
import BrandHeader from '../../_components/BrandHeader';

// Card del flow de activación (mismo look que el LoginForm).
import ActivationCard from '../_components/ActivationCard';

// Color del icono Lock: amber-500 (mismo que el campo CONTRASEÑA
// del login). Diferenciar el color del icono entre campos
// (sky para teléfono/código, amber para password) refuerza la
// jerarquía visual.
const LOCK_ICON_COLOR = '#f59e0b'; // amber-500

// Hook de auth: usamos setSession (NO login) porque el backend
// devuelve el token directamente en el response de /activate-account.
// setSession persiste el token en AsyncStorage, setea el header
// de Axios y actualiza el user global — exactamente lo que hace
// login(), pero sin pasar por /auth/login.
import { useAuth } from '../../../src/hooks/useAuth';

// Servicio de activación: completeActivation hace el POST
// /auth/activate-account con { phone, otpCode, newPassword }.
import { completeActivation } from '../../../src/services/activationService';

// Mínimo de caracteres para considerar la contraseña segura.
// Coincide con el mínimo que valida el backend (>= 8 chars).
const MIN_PASSWORD_LENGTH = 8;

export default function SetPasswordScreen() {
  const router = useRouter();
  const { setSession } = useAuth();

  // Leemos los params de la pantalla anterior. Si llegamos aquí
  // por deep link sin haber pasado por las pantallas previas,
  // redirigimos al inicio del flow.
  const params = useLocalSearchParams();
  const phone = typeof params.phone === 'string' ? params.phone : '';
  const code = typeof params.code === 'string' ? params.code : '';

  if (!phone || !code) {
    router.replace('/activation');
  }

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValid = password.length >= MIN_PASSWORD_LENGTH;

  // Handler de "Guardar y entrar". Llama al backend para crear la
  // cuenta, luego establece la sesión y navega al dashboard.
  const handleSave = async () => {
    if (!isValid || isLoading) return;
    setIsLoading(true);
    try {
      // 1. POST /auth/activate-account con { phone, otpCode,
      // newPassword }. IMPORTANTE: el backend espera "newPassword",
      // NO "password" — esto es parte del contrato.
      // El backend re-valida el código (defense-in-depth), hashea
      // la password con bcrypt, marca la cuenta como isActive y
      // devuelve { authToken, user }.
      const result = await completeActivation({
        phone,
        otpCode: code,
        newPassword: password,
      });

      if (!result.success) {
        Alert.alert('No se pudo completar la activación', result.message);
        setIsLoading(false);
        return;
      }

      // 2. Establecer la sesión: persistir token en AsyncStorage,
      // setear header de Axios, actualizar user global. setSession
      // es la misma función que usa login() internamente — solo
      // cambia el "trigger" (login tradicional vs activation flow).
      // IMPORTANTE: el user devuelto por el backend viene con
      // _id (MongoDB convention), pero activationService ya lo
      // normalizó a "id" antes de devolverlo. Eso es lo que espera
      // el resto de la app.
      const sessionResult = await setSession(result.authToken, result.user);

      if (!sessionResult.success) {
        // Si falla la persistencia local (ej. AsyncStorage lleno),
        // igualmente navegamos al dashboard: el user ya está creado
        // en el backend, y si el user re-entra a la app, el flujo
        // de restore-from-storage lo recuperará.
        Alert.alert(
          'Activación completada',
          'Cuenta creada. Si la app se cierra, vuelve a iniciar sesión.',
        );
        setIsLoading(false);
      }

      // 3. router.replace (NO push): la pantalla de set-password NO
      // debe estar en el history. Si el usuario presiona back tras
      // activar, debe ir al dashboard, no a esta pantalla.
      //
      // El dispatcher de app/(app)/dashboard.jsx lee userRole del
      // AuthContext y renderiza el GuardianDashboard cuando es
      // 'tutor' (rol que envía el backend para padres). Con
      // setSession() ya seteó el user, el dispatcher va a ver
      // userRole === 'tutor' y montar el dashboard correcto.
      router.replace('/(app)/dashboard');
    } catch (error) {
      console.error('[Activation set-password] Error inesperado:', error);
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
            title="Crea tu contraseña"
            subtitle="Establece una contraseña segura. La usarás junto con tu celular para iniciar sesión en el futuro."
          >
            {/* Input de contraseña. PasswordField ya trae:
                - icono de candado (Lock) a la izquierda
                - secureTextEntry con toggle de visibilidad (Eye/EyeOff)
                - autoComplete="password" (gestor de contraseñas del SO)
                El error aparece solo si el usuario empezó a escribir
                pero no llega al mínimo (feedback inline, no molesta
                al inicio).
                Pasamos iconColor amber para mantener el color del
                candado coherente con el campo CONTRASEÑA del login. */}
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

            {/* Botón "Guardar y entrar" con icono LogIn a la derecha
                (mismo icono que el botón principal del login —
                refuerza que esta acción "entra" a la app). */}
            <Button
              title="Guardar y entrar"
              onPress={handleSave}
              loading={isLoading}
              disabled={!isValid || isLoading}
              variant="sky"
              icon={LogIn}
              iconSize={20}
              iconColor="#ffffff"
              className="mt-2"
              accessibilityLabel="Botón guardar contraseña y entrar"
            />
          </ActivationCard>
        </View>
      </View>
    </Screen>
  );
}
