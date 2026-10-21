// =====================================================================
// app/(auth)/activation/set-password.jsx
// ---------------------------------------------------------------------
// Pantalla 3/3 del flujo de activación: crear la contraseña.
// URL: /activation/set-password
//
// El usuario establece una contraseña (mínimo 8 caracteres) y
// presiona "Guardar y entrar". Guardado REAL: POST
// /auth/activate-account (vía activationService). Después del éxito
// hace router.replace
// al dashboard (NO push) para que el back gesture no devuelva
// al usuario a la pantalla de password (flujo de activación
// terminado, no debe ser reversible). El destino rol-aware sale de
// roleHomeHref() (src/utils/roleRoutes.js) — ver el bug de bucle
// infinito documentado ahí.
//
// Estilo: card blanca "ActivationCard" (mismo look que el login y
// las pantallas anteriores del flow). Label CONTRASEÑA en
// mayúsculas, icono Lock en amber, botón sky con icono LogIn
// (entrada al sistema, mismo icono que el login principal).
// =====================================================================

// React + hooks (useEffect controla el indicador de lentitud del
// botón mientras el request está en vuelo).
import React, { useState, useEffect } from 'react';

// Primitivas RN: View, Text, Alert y Platform (para detectar
// Android y anclar el form arriba con el teclado).
import { View, Text, Alert, Platform } from 'react-native';

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
// devuelve el token directamente en el response de /auth/activate-account.
// setSession persiste el token en AsyncStorage, setea el header
// de Axios y actualiza el user global — exactamente lo que hace
// login(), pero sin pasar por /auth/login.
// login() se usa SOLO en el caso "already_active" (la cuenta ya
// existe): reintenta el login con los datos en pantalla.
import { useAuth } from '../../../src/hooks/useAuth';

// Fuente única de navegación por rol (role → href del dashboard de
// su grupo). Ver por qué NUNCA se debe usar un ternario
// `role === 'teacher' ? … : guardian` aquí: src/utils/roleRoutes.js.
import { roleHomeHref } from '../../../src/utils/roleRoutes';

// Servicio de activación: completeActivation hace el POST
// /auth/activate-account con { phone, otpCode, newPassword }.
import { completeActivation } from '../../../src/services/activationService';

// Hook de visibilidad del teclado: devuelve true mientras el
// teclado virtual está abierto.
import { useKeyboardVisible } from '../../../src/hooks/useKeyboardVisible';

// Mínimo de caracteres para considerar la contraseña segura.
// Coincide con el mínimo que valida el backend (>= 8 chars).
const MIN_PASSWORD_LENGTH = 8;

export default function SetPasswordScreen() {
  const router = useRouter();
  const { setSession, login } = useAuth();

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

  // Indicador de lentitud: si el request sigue en vuelo pasados 8 s,
  // mostramos una nota bajo el botón. Motivo real: Render (free) hace
  // cold start de 30-90 s cuando lleva >15 min inactivo — sin la nota
  // el usuario solo ve un spinner eterno y asume que la app se colgó
  // (cierra y reintenta). Con ella sabe que debe esperar.
  const [slowHint, setSlowHint] = useState(false);
  useEffect(() => {
    // Sin carga → nunca mostramos la nota (y limpiamos un hint
    // huérfano de un intento anterior).
    if (!isLoading) {
      setSlowHint(false);
      return undefined;
    }
    // En vuelo → a los 8 s levantamos la nota; el timer se limpia
    // si el request termina antes (o si el componente se desmonta).
    const timer = setTimeout(() => setSlowHint(true), 8000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Visibilidad del teclado (siempre en el mismo orden, sin
  // early-returns debajo). Solo se usa en Android: con el teclado
  // abierto anclamos el form arriba para que el teclado no tape el
  // input de contraseña (con pan el contenido centrado queda a
  // medio tapar).
  const keyboardVisible = useKeyboardVisible();
  const anclarArriba = Platform.OS === 'android' && keyboardVisible;

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
        // "already_active": la cuenta YA fue creada en un intento
        // anterior — el caso típico es un cold start de Render donde el
        // primer POST llegó al backend y completó la activación, pero
        // el celular abortó por timeout y no vio la respuesta (el
        // service reintenta y el backend responde "already active").
        // Login silencioso con el celular+contraseña que ya están en
        // pantalla: si entra, vamos directo al dashboard sin que el
        // usuario reescriba nada.
        if (result.reason === 'already_active') {
          try {
            const loginResult = await login(phone, password, false);
            if (loginResult.success) {
              // Destino vía fuente única (roleRoutes). Un rol sin
              // home (admin/registrar/super_admin) va a "/": allí
              // index.jsx muestra el aviso de "sin acceso" — JAMÁS
              // a un grupo ajeno, que era lo que formaba el bucle
              // infinito de Redirect (guardian ⇄ teacher) y dejaba
              // la app colgada con el spinner girando.
              router.replace(roleHomeHref(loginResult.user?.role) || '/');
              return;
            }
          } catch {
            // login silencioso falló (p. ej. red caída): caemos al
            // alert de abajo que lleva al usuario al login manual.
          }
          Alert.alert(
            'Cuenta creada',
            'Tu cuenta ya fue creada. Ve a la pantalla de inicio para iniciar sesión.',
          );
          router.replace('/');
          setIsLoading(false);
          return;
        }

        // "network": tras el reintento del service seguimos sin respuesta
        // del servidor. El backend PUDO haber completado la activación
        // aunque el celular no lo supiera — lo explicamos para que el
        // usuario no reescriba la contraseña en vano.
        if (result.reason === 'network') {
          Alert.alert('No se pudo confirmar con el servidor', result.message);
          setIsLoading(false);
          return;
        }

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
      // el resto de la app. Pasamos además el refreshToken que el
      // backend emitió (sin él la sesión se cae al expirar el
      // access token).
      const sessionResult = await setSession(
        result.authToken,
        result.user,
        result.refreshToken,
      );

      if (!sessionResult.success) {
        // Si falla la persistencia local (ej. AsyncStorage lleno),
        // la cuenta YA quedó creada en el backend: le decimos al
        // usuario que puede iniciar sesión normal. Importante:
        // retornamos aquí — sin este return el código caería en
        // sessionResult.user.role (undefined) y mostraría el
        // alert genérico de "problema inesperado".
        Alert.alert(
          'Activación completada',
          'Cuenta creada. Si la app se cierra, vuelve a iniciar sesión.',
        );
        setIsLoading(false);
        return;
      }

      // 3. router.replace (NO push): la pantalla de set-password NO
      // debe estar en el history. Si el usuario presiona back tras
      // activar, debe ir al dashboard, no a esta pantalla.
      //
      // Con route groups por rol ya NO hay dispatcher: cada rol tiene
      // su propio grupo ((guardian), (teacher), (prefect),
      // (social-worker), (director)). setSession() ya seteó el user
      // global con su role, así que el destino sale de roleHomeHref()
      // — la fuente única role → dashboard (src/utils/roleRoutes.js).
      //
      // IMPORTANTE (bug corregido): antes había un ternario de 2 vías
      // `role === 'teacher' ? (teacher) : (guardian)`. Un principal/
      // prefect/social_worker entraba a (guardian), su gate lo
      // pateaba a (teacher), el gate de (teacher) lo pateaba de
      // vuelta… BUCLE INFINITO de <Redirect>: la app se colgaba con
      // el spinner girando (reportado como "se queda dando vueltas
      // al guardar y entrar"). Con el mapa el ciclo es imposible.
      // Rol sin home (admin/registrar/super_admin) → "/" (vista de
      // "sin acceso" en index, sin redirect).
      router.replace(roleHomeHref(result.user.role) || '/');
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

      {/* Wrapper principal: centrado por defecto; con el teclado
          abierto en Android (anclarArriba) se ancla arriba para que
          el input de contraseña quede en la zona que el teclado no
          tapa. */}
      <View
        className={`flex-1 items-center px-6 py-4 w-full ${
          anclarArriba ? 'justify-start' : 'justify-center'
        }`}
      >
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

            {/* Nota de lentitud: aparece solo si el request lleva >8 s
                en vuelo (típico: cold start de Render, 30-90 s). Le
                dice al usuario que NO es un freeze y que no cierre la
                app. Se oculta sola en cuanto el request termina. */}
            {isLoading && slowHint && (
              <Text maxFontSizeMultiplier={1.3} className="text-slate-400 text-xs text-center mt-3 leading-4">
                Está tardando más de lo normal (el servidor puede tardar
                hasta 1 minuto la primera vez). Espera un momento y no
                cierres la app.
              </Text>
            )}
          </ActivationCard>
        </View>
      </View>
    </Screen>
  );
}
