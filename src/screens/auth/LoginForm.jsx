// =====================================================================
// LoginForm.jsx
// ---------------------------------------------------------------------
// Formulario de inicio de sesión. Encapsula el input de email,
// el input de password, el enlace "¿Olvidaste tu contraseña?" y
// el botón principal. Recibe el form (useLoginForm) por props,
// siguiendo el principio de "dumb components": la lógica vive en
// el hook, la UI en este componente.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text, TouchableOpacity, Alert.
import { View, Text, TouchableOpacity, Alert } from 'react-native';

// Iconos.
import { Mail, LogIn } from 'lucide-react-native';

// Componentes reutilizables.
import TextField from '../../components/TextField';
import PasswordField from '../../components/PasswordField';
import Button from '../../components/Button';

// Props:
//   - form: objeto devuelto por useLoginForm.
//   - onForgotPassword: callback al pulsar "¿Olvidaste tu contraseña?".
//     Default: muestra un Alert informativo (placeholder hasta tener
//     pantalla de recovery).
const LoginForm = ({ form, onForgotPassword = null }) => {
  // Destructuramos del form lo que vamos a usar.
  const { values, errors, handleChange, isSubmitting, handleSubmit } = form;

  // Handler del enlace "¿Olvidaste tu contraseña?".
  const handleForgotPassword = () => {
    if (typeof onForgotPassword === 'function') {
      onForgotPassword();
      return;
    }
    // Default: alerta informativa.
    Alert.alert(
      'Recuperar contraseña',
      'Te enviaremos un enlace de recuperación a tu correo.',
    );
  };

  return (
    // Card blanca con sombra multiplataforma.
    <View
      className="bg-white rounded-2xl p-6"
      style={{
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {/* Encabezado del formulario. */}
      <Text className="text-slate-900 text-2xl font-bold mb-1">
        Bienvenido
      </Text>
      <Text className="text-slate-500 text-sm mb-6">
        Ingresa tus credenciales para continuar
      </Text>

      {/* Input: correo. Usamos TextField reutilizable. */}
      <TextField
        label="Correo Electrónico"
        icon={Mail}
        value={values.email}
        onChangeText={(v) => handleChange('email', v)}
        placeholder="correo@escuela.edu"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        textContentType="emailAddress"
        autoComplete="email"
        accessibilityLabel="Campo de correo electrónico"
        // El error se muestra bajo el input automáticamente.
        error={errors.email}
      />

      {/* Input: contraseña. Usamos PasswordField reutilizable. */}
      <PasswordField
        value={values.password}
        onChangeText={(v) => handleChange('password', v)}
        error={errors.password}
      />

      {/* Enlace "¿Olvidaste tu contraseña?". */}
      <TouchableOpacity
        onPress={handleForgotPassword}
        className="self-end mb-6"
        accessibilityRole="link"
      >
        <Text className="text-sky-600 text-sm font-semibold">
          ¿Olvidaste tu contraseña?
        </Text>
      </TouchableOpacity>

      {/* Botón principal: usa Button reutilizable con loading state. */}
      <Button
        title={isSubmitting ? 'Ingresando...' : 'Iniciar Sesión'}
        // El loading state interno del Button se activa con isSubmitting.
        loading={isSubmitting}
        onPress={handleSubmit}
        icon={LogIn}
        accessibilityLabel="Iniciar sesión"
      />
    </View>
  );
};

export default LoginForm;
