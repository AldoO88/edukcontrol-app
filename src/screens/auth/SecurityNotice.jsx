// =====================================================================
// SecurityNotice.jsx
// ---------------------------------------------------------------------
// Aviso de seguridad institucional que aparece bajo el formulario
// de Login. Componente presentational puro: solo props de entrada.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN.
import { View, Text } from 'react-native';

// Icono.
import { ShieldCheck } from 'lucide-react-native';

// Props:
//   - title: string con el título (default 'Acceso seguro y cifrado').
//   - message: string con la descripción.
const SecurityNotice = ({
  title = 'Acceso seguro y cifrado',
  message = 'Tus datos están protegidos con encriptación de extremo a extremo.',
}) => {
  return (
    <View
      // bg-sky-50 con borde sky-100 = caja de aviso informativa.
      // elevation 0 = sin sombra, solo borde. Mantiene la jerarquía:
      // la tarjeta blanca del formulario es la protagonista.
      className="bg-sky-50 border border-sky-100 rounded-2xl p-4 mt-6 flex-row items-center"
      style={{ elevation: 0 }}
    >
      {/* Icono de escudo en sky-600 dentro de un bg-sky-100. */}
      <View className="bg-sky-100 p-2 rounded-lg mr-3">
        <ShieldCheck size={20} color="#0284c7" strokeWidth={2.25} />
      </View>

      {/* Textos. */}
      <View className="flex-1">
        <Text className="text-slate-900 text-sm font-bold">{title}</Text>
        <Text className="text-slate-500 text-xs mt-0.5">{message}</Text>
      </View>
    </View>
  );
};

export default SecurityNotice;
