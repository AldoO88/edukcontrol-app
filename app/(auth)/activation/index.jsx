// =====================================================================
// app/(auth)/activation/index.jsx
// ---------------------------------------------------------------------
// Pantalla 1/3 del flujo de activación: input del número de celular.
// URL: /activation
//
// El usuario ingresa el número de 10 dígitos que registró en la
// institución y presiona "Enviar código por SMS". Mock: simula una
// llamada al backend (POST /auth/activation/request-otp) y navega
// a la pantalla de verificación del código.
//
// =====================================================================
// MOCK vs REAL
// ---------------------------------------------------------------------
// Esta pantalla NO toca la API real todavía. Cuando el backend
// exponga el endpoint de activation, se reemplaza el setTimeout
// por un authService.requestActivationOtp(phone) que:
//   - haga POST al endpoint
//   - devuelva { success, message }
//   - mapee errores (400 formato inválido, 404 número no registrado,
//     429 rate limit) a mensajes amigables
// El resto del flujo (loading, disabled, navegación) ya queda.
// =====================================================================

// React + hook de estado local para el input.
import React, { useState } from 'react';

// Primitivas RN: View, Text, Pressable (link "Volver").
import { View, Text, Pressable } from 'react-native';

// useRouter de expo-router: navegación programática.
import { useRouter } from 'expo-router';

// Iconos Lucide.
import { Smartphone, ChevronLeft } from 'lucide-react-native';

// Wrapper de pantalla institucional (SafeAreaView + KeyboardAvoidingView).
import Screen from '../../../src/components/Screen';

// Input de texto reutilizable. Acepta keyboardType, maxLength, icon,
// autoComplete y textContentType via ...rest.
import TextField from '../../../src/components/TextField';

// Botón reutilizable. variant="sky" usa el azul institucional
// (bg-sky-600) con texto blanco.
import Button from '../../../src/components/Button';

// Header de marca EdukControl (mismo que en el login). Private
// component del route (vive en _components/).
import BrandHeader from '../../_components/BrandHeader';

export default function PhoneInputScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validación simple: 10 dígitos exactos. Cuando integremos el
  // backend, esta validación se mantiene en el cliente (UX) pero
  // el server hará la definitiva.
  const isValid = phone.length === 10;

  // Handler de "Enviar código". Mock con setTimeout; en producción
  // se reemplaza por await authService.requestActivationOtp(phone).
  const handleSendCode = () => {
    if (!isValid || isLoading) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // router.push: añade al history → el back gesture del sistema
      // puede devolver al usuario a esta pantalla. La pantalla
      // siguiente también usa push, y la última usa replace (no
      // se puede volver a la pantalla de password tras activar).
      router.push('/activation/verify');
    }, 1500);
  };

  return (
    // Screen wrapper: edges={['top']} reserva el espacio del
    // status bar / notch para que el BrandHeader NO quede debajo.
    // keyboardAvoid: el teclado no tapa el input al enfocarlo.
    <Screen
      edges={['top']}
      background="bg-slate-50"
      keyboardAvoid
    >
      {/* BrandHeader: barra superior con el logo "EdukControl" +
          birrete. Mismo que en el login para coherencia de marca. */}
      <BrandHeader />

      {/* Contenedor principal. flex-1 ocupa el espacio restante
          después del BrandHeader. Centra la card vertical y
          horizontalmente. max-w-sm limita el ancho en tablet. */}
      <View className="flex-1 items-center justify-center px-6 py-8 w-full">
        <View className="w-full max-w-sm">
          {/* Título + subtítulo. text-2xl font-bold para el título
              (jerarquía alta); text-sm text-slate-500 para el
              subtítulo (jerarquía media). */}
          <Text className="text-2xl font-bold text-slate-900">
            Activa tu cuenta
          </Text>
          <Text className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
            Ingresa el número de celular a 10 dígitos que registraste en la institución.
          </Text>

          {/* Input de teléfono.
              - keyboardType="phone-pad": teclado numérico en iOS/Android.
              - maxLength={10}: limita a 10 dígitos (México).
              - onChangeText: filtra no-numéricos con regex antes de
                setear el state. Doble defensa (cliente + maxLength).
              - autoComplete="tel" + textContentType="telephoneNumber":
                integración con auto-fill del SO (iOS sugiere
                contactos, Android sugiere números guardados). */}
          <TextField
            label="Número de celular"
            value={phone}
            onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
            placeholder="5512345678"
            placeholderTextColor="#94a3b8"
            icon={Smartphone}
            keyboardType="phone-pad"
            maxLength={10}
            autoComplete="tel"
            textContentType="telephoneNumber"
            accessibilityLabel="Campo de número de celular"
          />

          {/* Botón primario. variant="sky" (bg-sky-600). Deshabilitado
              mientras no haya 10 dígitos o esté cargando. El loading
              muestra un spinner en lugar del texto. */}
          <Button
            title="Enviar código por SMS"
            onPress={handleSendCode}
            loading={isLoading}
            disabled={!isValid || isLoading}
            variant="sky"
            className="mt-2"
            accessibilityLabel="Botón enviar código por SMS"
          />

          {/* Link ghost: cancelar y volver. router.back() envía al
              usuario a la pantalla anterior en el history (típicamente
              el login, desde donde se habría llegado aquí). */}
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center justify-center mt-6 py-2"
            accessibilityRole="button"
            accessibilityLabel="Cancelar y volver al inicio de sesión"
          >
            <ChevronLeft size={16} color="#64748b" strokeWidth={2} />
            <Text className="text-sm text-slate-500 ml-1 font-medium">
              Cancelar y volver al inicio de sesión
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
