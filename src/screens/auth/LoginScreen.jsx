// =====================================================================
// LoginScreen.jsx
// ---------------------------------------------------------------------
// Pantalla de inicio de sesión. Ahora es un componente "orquestador"
// delgado que solo compone sub-componentes. La lógica vive en
// useLoginForm (hook) y la UI se reparte entre LoginHeader,
// LoginForm y SecurityNotice. Esto facilita el testing, la lectura
// y el mantenimiento.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: SafeAreaView, View, Text, ScrollView, KeyboardAvoidingView, Platform.
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// Hook específico: encapsula estado, validación y submit del login.
import { useLoginForm } from '../../hooks/useLoginForm';

// Sub-componentes.
import LoginHeader from './LoginHeader';
import LoginForm from './LoginForm';
import SecurityNotice from './SecurityNotice';

// Componente principal. Recibe navigation y route por convención de
// React Navigation (no los usamos aquí aún, pero los dejamos en la
// firma por si en el futuro se necesita navegación condicional).
const LoginScreen = ({ navigation: _navigation, route: _route }) => {
  // Toda la lógica del formulario viene del hook.
  const form = useLoginForm();

  return (
    // SafeAreaView raíz: protege el contenido del notch y status bar.
    // Fondo slate-50 (paleta institucional).
    <View className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      {/* KeyboardAvoidingView: adapta el layout cuando aparece el
          teclado. iOS = padding, Android = height. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Encabezado institucional (logo + nombre + subtítulo). */}
          <LoginHeader />

          {/* Contenedor del formulario, con marginTop negativo para
              superponer ligeramente sobre el header (profundidad). */}
          <View className="px-6 -mt-10">
            {/* Formulario (card blanca con inputs y botón). */}
            <LoginForm form={form} />

            {/* Aviso de seguridad bajo el formulario. */}
            <SecurityNotice />

            {/* Pie de pantalla: copyright. */}
            <View className="items-center mt-8 mb-6">
              <Text className="text-slate-400 text-xs">
                © {new Date().getFullYear()} EdukControl · Todos los derechos reservados
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;
