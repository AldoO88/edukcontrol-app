// =====================================================================
// LoginHeader.jsx
// ---------------------------------------------------------------------
// Encabezado institucional de la pantalla de Login: logo con icono
// de gorro de graduación + nombre de la app + subtítulo.
// Es un componente "presentational" puro: solo props de entrada
// y render. No tiene estado ni lógica.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN.
import { View, Text } from 'react-native';

// Icono: gorro de graduación (identidad educativa).
import { GraduationCap } from 'lucide-react-native';

// Props:
//   - appName: string con el nombre de la app (default 'EdukControl').
//   - subtitle: string con el subtítulo (default 'Sistema Escolar Integral').
const LoginHeader = ({
  appName = 'EdukControl',
  subtitle = 'Sistema Escolar Integral',
}) => {
  return (
    // Contenedor con fondo slate-900 (autoridad institucional) y
    // bordes inferiores redondeados para una transición suave.
    <View className="bg-slate-900 px-6 pt-12 pb-16 rounded-b-[40px]">
      {/* Logo: contenedor sky-500 con icono blanco. */}
      <View className="items-center mb-6">
        <View
          className="bg-sky-500 p-5 rounded-3xl"
          // Sombra multiplataforma (iOS: shadow*; Android: elevation).
          style={{
            elevation: 6,
            shadowColor: '#0ea5e9',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
          }}
        >
          <GraduationCap size={40} color="#ffffff" strokeWidth={2.25} />
        </View>
      </View>

      {/* Nombre + subtítulo. */}
      <Text className="text-white text-4xl font-bold text-center tracking-tight">
        {appName}
      </Text>
      <Text className="text-slate-300 text-sm text-center mt-2 font-medium">
        {subtitle}
      </Text>
    </View>
  );
};

export default LoginHeader;
