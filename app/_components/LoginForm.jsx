// =====================================================================
// app/_components/LoginForm.jsx
// ---------------------------------------------------------------------
// Formulario de login. Componente privado del route "index.jsx":
// vive en app/_components/ (prefijo "_") para que Expo Router NO
// lo exponga como ruta. Solo se usa dentro de la pantalla de login.
//
// Responsabilidades:
//   - Renderizar los campos email + password + botón "Iniciar sesión".
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
import React from 'react';

// Primitivas RN: View (card), Text (título/subtítulo).
import { View, Text } from 'react-native';

// Icono del sobre (email) — Lucide.
import { Mail } from 'lucide-react-native';

// Hook específico del login: encapsula estado + validación + submit.
// Devuelve la forma completa de useForm más { handleSubmit, isSubmitting }.
import { useLoginForm } from '../../src/hooks/useLoginForm';

// Primitives de input reusables (viven en src/components, son
// independientes de la pantalla que los consume).
import TextField from '../../src/components/TextField';
import PasswordField from '../../src/components/PasswordField';
import Button from '../../src/components/Button';

export default function LoginForm() {
  // El hook ya viene con trim de email, validación de formato,
  // longitud mínima de password, submit contra useAuth().login y
  // manejo de errores del backend via Alert. Aquí solo consumimos
  // lo que expone.
  const form = useLoginForm();

  return (
    // ------------------------------------------------------------
    // CARD DEL FORMULARIO
    // ------------------------------------------------------------
    // bg-white: fondo blanco sobre el slate-50 de la pantalla.
    // rounded-2xl: bordes generosos (sistema de diseño).
    // p-8: padding generoso para que los inputs respiren (mockup
    //   muestra bastante aire interno).
    // SIN border: el mockup no muestra borde, solo sombra.
    // elevation: 4 vía style: sombra multiplataforma. En Android
    //   shadow-* de NativeWind no siempre se traduce bien; por eso
    //   forzamos elevation explícito.
    // ------------------------------------------------------------
    <View
      className="bg-white rounded-2xl p-8"
      style={{ elevation: 4 }}
    >
      {/* Título de la card. text-2xl (24px) bold, slate-900. Tamaño
          prominente según el mockup (más grande que el "Hola,
          Familia González" del dashboard). */}
      <Text className="text-2xl font-bold text-slate-900">
        Iniciar sesión
      </Text>
      <Text className="text-slate-500 text-sm mt-1 mb-6">
        Ingresa tus credenciales para continuar.
      </Text>

      {/* ----------------------------------------------------
          CAMPO: CORREO ELECTRÓNICO
          ----------------------------------------------------
          - label: "Correo electrónico" (visible arriba del input).
          - icon: sobre a la izquierda.
          - keyboardType="email-address": muestra @ y . en iOS/Android.
          - autoCapitalize="none" + autoCorrect={false}: típico para
            emails (sin capitalización automática ni corrección).
          - textContentType + autoComplete: integración con el
            llavero del sistema (iOS) y los saved passwords (Android).
          - error: si useLoginForm detectó formato inválido o
            campo vacío, lo pinta en rojo bajo el input.
          ---------------------------------------------------- */}
      <TextField
        label="Correo electrónico"
        value={form.values.email}
        onChangeText={(text) => form.handleChange('email', text)}
        placeholder="tu@correo.com"
        placeholderTextColor="#94a3b8"
        icon={Mail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        textContentType="emailAddress"
        autoComplete="email"
        error={form.errors.email}
        accessibilityLabel="Campo de correo electrónico"
      />

      {/* ----------------------------------------------------
          CAMPO: CONTRASEÑA
          ----------------------------------------------------
          PasswordField ya encapsula:
          - Icono de candado a la izquierda.
          - secureTextEntry que se alterna con el botón Eye/EyeOff.
          - Atributos de autocompletado correctos.
          Le pasamos solo value, onChange y error. El resto lo
          resuelve internamente.
          ---------------------------------------------------- */}
      <PasswordField
        value={form.values.password}
        onChangeText={(text) => form.handleChange('password', text)}
        error={form.errors.password}
      />

      {/* ----------------------------------------------------
          BOTÓN: INICIAR SESIÓN
          ----------------------------------------------------
          - variant="primary": slate-900 (color institucional).
          - title: texto que se muestra.
          - loading={form.isSubmitting}: muestra spinner y deshabilita
            el botón mientras useLoginForm está ejecutando el submit.
          - onPress={form.handleSubmit}: dispara la validación
            + login del hook. NO navega manualmente: el AuthGate del
            layout raíz detecta user y redirige al dashboard.
          - className="mt-2": pequeño margen sobre el campo de pass.
          ---------------------------------------------------- */}
      <Button
        title="Iniciar sesión"
        onPress={form.handleSubmit}
        loading={form.isSubmitting} // muestra spinner y deshabilita el botón
        disabled={form.isSubmitting}
        // variant="sky": bg-sky-600 activo / bg-sky-700 pressed.
        //   Es el azul institucional del mockup (más "amigable"
        //   que el slate-900 del variant primary).
        variant="sky"
        className="mt-2"
        accessibilityLabel="Botón de inicio de sesión"
      />
    </View>
  );
}
