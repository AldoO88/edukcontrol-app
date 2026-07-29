// =====================================================================
// app/_components/LoginForm.jsx
// ---------------------------------------------------------------------
// Formulario de login. Componente privado del route "index.jsx":
// vive en app/_components/ (prefijo "_") para que Expo Router NO
// lo exponga como ruta. Solo se usa dentro de la pantalla de login.
//
// Responsabilidades:
//   - Renderizar la card blanca con el formulario completo:
//     título "Bienvenido", inputs, "Recordar mi sesión", botón
//     submit, link "¿Olvidaste tu contraseña?", divisor y link
//     "¿Es tu primera vez?".
//   - Delegar TODO el estado y la lógica al hook useLoginForm
//     (validación, submit, errores inline).
//   - Mostrar el spinner durante el submit (loading prop del Button).
//   - NO navega tras éxito: el AuthGate del layout raíz detecta el
//     cambio de user y hace Redirect a /dashboard automáticamente.
//     Esto es el "Auth Flow declarativo" de Expo Router.
//
// Validación inline (errores de campos): los pinta TextField /
// PasswordField vía la prop "error", que viene de form.errors.
// Errores del backend (credenciales inválidas, sin red, etc.):
//   los gestiona useLoginForm internamente con Alert.alert — no
//   hace falta lógica de UI adicional aquí.
// =====================================================================

// React.
import React, { useState } from 'react';

// Primitivas RN: View (card + checkbox), Text, Pressable.
import { View, Text, Pressable } from 'react-native';

// Iconos Lucide usados en el form.
//   - Phone: icono "old-school" de teléfono (auricular) — encaja
//     mejor con el placeholder "+52 ..." que el Smartphone genérico.
//   - LogIn: flecha apuntando a una puerta, ideal para el CTA
//     "Iniciar Sesión".
//   - Lock: candado del PasswordField (color amber para destacar).
//   - Check: tick del checkbox cuando está marcado.
import {
  Phone,
  LogIn,
  Lock,
  Check,
} from 'lucide-react-native';

// useRouter para navegar al flow de activación cuando el usuario
// pulsa "Activa tu cuenta aquí".
import { useRouter } from 'expo-router';

// Hook específico del login: encapsula estado + validación + submit.
// Devuelve la forma completa de useForm más { handleSubmit, isSubmitting }.
import { useLoginForm } from '../../src/hooks/useLoginForm';

// Primitives de input reusables (viven en src/components, son
// independientes de la pantalla que los consume).
import TextField from '../../src/components/TextField';
import PasswordField from '../../src/components/PasswordField';
import Button from '../../src/components/Button';

// Constantes de color para los iconos de los inputs. Sacarlas a
// constantes locales evita magic numbers repetidos y deja claro
// que son parte del sistema visual del login (no del sistema global).
const PHONE_ICON_COLOR = '#0ea5e9'; // sky-500
const LOCK_ICON_COLOR = '#f59e0b'; // amber-500

export default function LoginForm() {
  // Hook de formulario: estado, validación, submit.
  const form = useLoginForm();

  // Router para el link de activación.
  const router = useRouter();

  // Estado local del checkbox "Recordar mi sesión". Es puramente
  // visual en esta fase (no se persiste todavía). Mantenerlo local
  // evita ensuciar useLoginForm con un campo que no participa del
  // submit.
  const [rememberMe, setRememberMe] = useState(false);

  return (
    // ------------------------------------------------------------
    // CARD DEL FORMULARIO
    // ------------------------------------------------------------
    // bg-white: fondo blanco sobre el slate-50 de la pantalla.
    // rounded-3xl: bordes muy generosos (24px) — look "app card"
    //   más suave que el rounded-2xl anterior.
    // p-8: padding interno generoso para que los inputs respiren.
    // SIN border: solo sombra (separación visual por elevación).
    // elevation: 8 vía style: sombra fuerte multiplataforma para
    //   que la card destaque claramente sobre el fondo claro.
    // shadow-xl de NativeWind da el render en iOS; elevation cubre
    //   Android (NativeWind no siempre propaga shadow a elevation).
    // ------------------------------------------------------------
    <View
      className="bg-white rounded-3xl p-8 shadow-xl"
      style={{ elevation: 8 }}
    >
      {/* ----------------------------------------------------
          TÍTULO + SUBTÍTULO
          ----------------------------------------------------
          "Bienvenido" en grande + subtítulo gris suave. Van
          centrados porque la card es angosta y el contenido
          interior también lo es — un look más "marketing".
          ---------------------------------------------------- */}
      <Text className="text-3xl font-bold text-slate-900 text-center">
        Bienvenido
      </Text>
      <Text className="text-slate-500 text-sm mt-2 mb-8 text-center leading-relaxed">
        Ingresa tus credenciales para acceder{'\n'}al portal académico
      </Text>

      {/* ----------------------------------------------------
          CAMPO: TELÉFONO
          ----------------------------------------------------
          - label="TELÉFONO" en mayúsculas con tracking-wide y
            color gris suave (text-slate-500) — estilo "form
            label" típico de SaaS modernos.
          - icon: Phone (auricular), color sky-500 para
            destacar y dar personalidad al campo.
          - placeholder: "+52 55 1234 5678" con prefijo de país
            ya visible (mejor UX que un placeholder genérico).
          - keyboardType="phone-pad": teclado numérico.
          - maxLength={10}: limita a 10 dígitos (México).
          ---------------------------------------------------- */}
      <TextField
        label="TELÉFONO"
        labelClassName="uppercase tracking-wide text-xs text-slate-500 font-bold mb-2"
        value={form.values.phone}
        onChangeText={(text) => {
          // Filtro de no-dígitos + maxLength=10 (doble defensa).
          const filtered = text.replace(/[^0-9]/g, '');
          form.handleChange('phone', filtered);
        }}
        placeholder="+52 55 1234 5678"
        placeholderTextColor="#cbd5e1"
        icon={Phone}
        iconColor={PHONE_ICON_COLOR}
        iconSize={20}
        keyboardType="phone-pad"
        maxLength={10}
        autoComplete="tel"
        textContentType="telephoneNumber"
        error={form.errors.phone}
        accessibilityLabel="Campo de teléfono"
      />

      {/* ----------------------------------------------------
          CAMPO: CONTRASEÑA
          ----------------------------------------------------
          PasswordField ya encapsula el candado + botón Eye.
          Le pasamos iconColor amber para mantener la
          diferenciación visual con el campo de teléfono (cada
          campo con su "color de acento" sutil).
          ---------------------------------------------------- */}
      <PasswordField
        value={form.values.password}
        onChangeText={(text) => form.handleChange('password', text)}
        iconColor={LOCK_ICON_COLOR}
        error={form.errors.password}
        labelClassName="uppercase tracking-wide text-xs text-slate-500 font-bold mb-2"
      />

      {/* ----------------------------------------------------
          CHECKBOX: RECORDAR MI SESIÓN
          ----------------------------------------------------
          Implementación inline (no hay componente Checkbox
          global todavía). Es un Pressable que renderiza un
          cuadrado: borde gris si está vacío, fondo sky + tick
          blanco si está marcado. hitSlop para área táctil
          cómoda en mobile.
          ---------------------------------------------------- */}
      <Pressable
        onPress={() => setRememberMe((prev) => !prev)}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: rememberMe }}
        accessibilityLabel="Recordar mi sesión"
        className="flex-row items-center mb-6"
      >
        {/* Cuadrado del checkbox. flex-row items-center
            justify-center para centrar el tick cuando está
            marcado. */}
        <View
          className={
            rememberMe
              ? 'w-5 h-5 rounded-md bg-sky-500 items-center justify-center'
              : 'w-5 h-5 rounded-md border-2 border-slate-300 bg-white'
          }
        >
          {/* Tick blanco cuando está marcado. */}
          {rememberMe && <Check size={14} color="#ffffff" strokeWidth={3} />}
        </View>
        <Text className="text-slate-700 text-sm ml-2.5 font-medium">
          Recordar mi sesión
        </Text>
      </Pressable>

      {/* ----------------------------------------------------
          BOTÓN: INICIAR SESIÓN
          ----------------------------------------------------
          - variant="sky": bg-sky-500 (azul vibrante del mockup).
          - icon: LogIn (flecha hacia la puerta) a la derecha
            del texto. iconPosition-style "después" del label
            refuerza la dirección de la acción.
          ---------------------------------------------------- */}
      <Button
        title="Iniciar Sesión"
        onPress={form.handleSubmit}
        loading={form.isSubmitting}
        disabled={form.isSubmitting}
        variant="sky"
        icon={LogIn}
        iconSize={20}
        iconColor="#ffffff"
        className="mt-2"
        accessibilityLabel="Botón de inicio de sesión"
      />

      {/* ----------------------------------------------------
          LINK: ¿OLVIDASTE TU CONTRASEÑA?
          ----------------------------------------------------
          Centrado bajo el botón. Color sky-600 para mantener
          la familia de azules del form. En esta fase es
          puramente visual (no hay flow de recuperación todavía).
          ---------------------------------------------------- */}
      <Pressable
        hitSlop={8}
        className="mt-4 py-2"
        accessibilityRole="link"
        accessibilityLabel="Recuperar contraseña"
      >
        <Text className="text-center text-sm font-semibold text-sky-600">
          ¿Olvidaste tu contraseña?
        </Text>
      </Pressable>

      {/* ----------------------------------------------------
          DIVISOR
          ----------------------------------------------------
          Línea horizontal sutil (1px, slate-200) para separar
          el bloque "login" del bloque "activación" dentro de
          la misma card.
          ---------------------------------------------------- */}
      <View className="border-t border-slate-200 my-4" />

      {/* ----------------------------------------------------
          LINK: ¿ES TU PRIMERA VEZ? ACTIVA TU CUENTA
          ----------------------------------------------------
          Entry point al flow de activación. Texto gris suave
          con la CTA destacada en sky-600 + semibold.
          ---------------------------------------------------- */}
      <Pressable
        onPress={() => router.push('/activation')}
        hitSlop={8}
        className="py-2"
        accessibilityRole="link"
        accessibilityLabel="Activar tu cuenta por primera vez"
      >
        <Text className="text-center text-sm text-slate-500">
          ¿Es tu primera vez?{' '}
          <Text className="text-sky-600 font-bold">
            Activa tu cuenta aquí
          </Text>
        </Text>
      </Pressable>
    </View>
  );
}
