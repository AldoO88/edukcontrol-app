// =====================================================================
// app/(auth)/activation/index.jsx
// ---------------------------------------------------------------------
// Pantalla 1/3 del flujo de activación: input del número de celular.
// URL: /activation
//
// El usuario ingresa el número de 10 dígitos que registró en la
// institución y presiona "Enviar código por SMS". Llama a:
//   POST /auth/request-activation  { phone }
// Response 200: { message, expiresAt }  ← el expiresAt se usa para
//   mostrar un countdown de 10 minutos.
//
// Estilo: card blanca "ActivationCard" (mismo look que el login
// con "Bienvenido"): título centrado, subtítulo centrado, label
// TELÉFONO en mayúsculas, icono de teléfono sky, botón sky con
// icono "Send", link "Cancelar" debajo del divisor.
// =====================================================================

// React + hook de estado local.
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

// Card del flow de activación (mismo look que el LoginForm).
import ActivationCard from '../_components/ActivationCard';

// Servicio de activación: requestActivationOtp.
import { requestActivationOtp } from '../../../src/services/activationService';

// Color del icono de Teléfono: sky-500 (acento azul del sistema
// de diseño). Mismo color usado en el login para mantener la
// coherencia visual entre el entry point y el flow de activación.
const PHONE_ICON_COLOR = '#0ea5e9'; // sky-500

// ---------------------------------------------------------------------
// formatCountdown(remainingSeconds)
// ---------------------------------------------------------------------
// Formatea un número de segundos restantes como "MM:SS". Si el
// tiempo es > 60min (caso raro: el server podría usar otro TTL),
// lo formatea como "HH:MM:SS". Lo extraemos a una función pura
// para poder testearlo aislado si hace falta.
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

export default function PhoneInputScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // expiresAt: timestamp (ms) hasta el cual el código es válido.
  // null hasta que el backend responda con uno.
  const [expiresAt, setExpiresAt] = useState(null);
  // remainingSeconds: estado derivado del countdown. Se actualiza
  // cada segundo con un setInterval (limpia en el cleanup del useEffect).
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Ref para evitar memory leaks con el setInterval si el componente
  // se desmonta mientras corre.
  const intervalRef = useRef(null);

  // Validación: 10 dígitos exactos.
  const isValid = phone.length === 10;

  // useEffect: cuenta atrás en tiempo real. Se monta cuando hay
  // expiresAt y se limpia cuando el componente se desmonta o el
  // expiresAt cambia (ej: el usuario pidió un código nuevo).
  useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    // Función que recalcula los segundos restantes.
    const tick = () => {
      const now = Date.now();
      const remainingMs = Math.max(0, expiresAt - now);
      const remainingSec = Math.floor(remainingMs / 1000);
      setRemainingSeconds(remainingSec);

      // Si llega a 0, limpiamos el interval explícitamente.
      if (remainingMs <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Ejecutamos inmediatamente (sin esperar 1s) para que el
    // contador se vea bien desde el primer render, y luego cada
    // segundo.
    tick();
    intervalRef.current = setInterval(tick, 1000);

    // Cleanup: limpiar el interval cuando el componente se desmonte
    // o cuando expiresAt cambie (nuevo código).
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
      const result = await requestActivationOtp(phone);

      if (!result.success) {
        Alert.alert('No se pudo enviar el código', result.message);
        setIsLoading(false);
        return;
      }

      // Guardamos el expiresAt del backend para el countdown.
      // Si el backend no lo manda, usamos 10 min como fallback
      // (es lo que dice el contrato).
      const expiresAtMs = result.expiresAt
        ? new Date(result.expiresAt).getTime()
        : Date.now() + 10 * 60 * 1000;
      setExpiresAt(expiresAtMs);

      // Éxito: navegamos a la pantalla 2 pasando el phone.
      // router.push (no replace) para que el back gesture pueda
      // devolver al usuario a esta pantalla si necesita cambiar
      // el número o reenviar el código.
      router.push({
        pathname: '/activation/verify',
        params: { phone },
      });
      // No reseteamos isLoading: la pantalla 2 se monta y esta
      // se desmonta. Resetear aquí causaría un flash de UI.
    } catch (error) {
      // Catch defensivo: el service ya captura todos los errores
      // y los mapea. Este catch solo se dispara por bugs reales.
      console.error('[Activation index] Error inesperado:', error);
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
            title="Activa tu cuenta"
            subtitle="Ingresa el número de celular a 10 dígitos que registraste en la institución."
          >
            {/* ----------------------------------------------------
                CAMPO: TELÉFONO
                - label UPPERCASE con labelClassName.
                - icono Phone (auricular) en sky-500.
                - placeholder "+52 55 1234 5678" con prefijo de país
                  (mismo patrón que el login).
                ---------------------------------------------------- */}
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

            {/* Countdown timer: solo se muestra cuando hay un código
                pendiente (expiresAt !== null). Mismo estilo que el
                original (badge sky suave con icono de reloj). */}
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

            {/* Botón "Enviar código por SMS" con icono Send (avión
                de papel) a la derecha del label — refuerza la idea
                de "mandar algo". */}
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

            {/* Divisor sutil para separar el bloque "acción" del
                bloque "cancelar" — mismo patrón que el LoginForm. */}
            <View className="border-t border-slate-200 my-4" />

            {/* Link "Cancelar y volver al inicio de sesión". Centrado
                con icono ChevronLeft y texto en slate-500. Es la
                salida de emergencia del flow. */}
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center justify-center py-2"
              accessibilityRole="button"
              accessibilityLabel="Cancelar y volver al inicio de sesión"
            >
              <ChevronLeft size={16} color="#64748b" strokeWidth={2.25} />
              <Text className="text-sm text-slate-500 ml-1 font-medium">
                Cancelar y volver al inicio de sesión
              </Text>
            </Pressable>
          </ActivationCard>
        </View>
      </View>
    </Screen>
  );
}
