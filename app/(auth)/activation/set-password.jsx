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
// =====================================================================

// React + hooks.
import React, { useState } from 'react';

// Primitivas RN.
import { View, Text } from 'react-native';

// useRouter de expo-router.
import { useRouter } from 'expo-router';

// Componentes UI reutilizables.
import Screen from '../../../src/components/Screen';

// PasswordField ya encapsula el patrón de "input con candado a la
// izquierda + botón toggle de visibilidad a la derecha" (es el
// mismo componente que usa LoginForm).
import PasswordField from '../../../src/components/PasswordField';
import Button from '../../../src/components/Button';
import BrandHeader from '../../_components/BrandHeader';

// Mínimo de caracteres para considerar la contraseña segura.
// No revelamos la regla exacta por seguridad (sería info útil
// para un atacante); el placeholder da una pista suficiente.
const MIN_PASSWORD_LENGTH = 8;

export default function SetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValid = password.length >= MIN_PASSWORD_LENGTH;

  // Handler de "Guardar y entrar". Mock con setTimeout; en
  // producción se reemplaza por authService.completeActivation({ ... })
  // que devuelve el JWT + user, los persiste en AsyncStorage y setea
  // el AuthContext. Una vez que el contexto tiene user, el root
  // layout NO redirige (ya no estamos en el flujo de activación),
  // pero el (app)/_layout.jsx sí renderiza el Stack con el dashboard.
  const handleSave = () => {
    if (!isValid || isLoading) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // router.replace (NO push): la pantalla de set-password NO
      // debe estar en el history. Si el usuario presiona back
      // tras activar, debe ir al dashboard, no a esta pantalla.
      //
      // La ruta "/" + "/dashboard" del proyecto actual es
      // "app/(app)/dashboard.jsx" (route group "(app)" oculto
      // en la URL). El user sugirió "/(guardian)/dashboard"
      // pero en este repo el dispatcher vive en (app) y
      // renderiza el GuardianDashboard cuando userRole === 'parent'.
      router.replace('/(app)/dashboard');
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
          <Text className="text-2xl font-bold text-slate-900">
            Crea tu contraseña
          </Text>
          <Text className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
            Establece una contraseña segura. La usarás junto con tu celular para iniciar sesión en el futuro.
          </Text>

          {/* Input de contraseña. PasswordField ya trae:
              - icono de candado (Lock) a la izquierda
              - secureTextEntry con toggle de visibilidad (Eye/EyeOff)
              - autoComplete="password" (gestor de contraseñas del SO)
              El error aparece solo si el usuario empezó a escribir
              pero no llega al mínimo (feedback inline, no molesta
              al inicio). */}
          <PasswordField
            value={password}
            onChangeText={setPassword}
            error={
              password.length > 0 && !isValid
                ? `Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`
                : null
            }
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            textContentType="newPassword"
            accessibilityLabel="Campo de nueva contraseña"
          />

          {/* Botón primario. Deshabilitado hasta que se cumpla el
              mínimo. El loading muestra spinner + texto "Guardando…"
              gracias al variant sky + loading prop. */}
          <Button
            title="Guardar y entrar"
            onPress={handleSave}
            loading={isLoading}
            disabled={!isValid || isLoading}
            variant="sky"
            className="mt-2"
            accessibilityLabel="Botón guardar contraseña y entrar"
          />
        </View>
      </View>
    </Screen>
  );
}
