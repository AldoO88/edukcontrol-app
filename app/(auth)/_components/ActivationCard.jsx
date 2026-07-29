// =====================================================================
// app/(auth)/_components/ActivationCard.jsx
// ---------------------------------------------------------------------
// Card blanca reutilizable para las 3 pantallas del flow de activación
// (phone / verify / set-password). Centraliza el look "Bienvenido"
// que aplicamos al login: rounded-3xl, shadow-xl fuerte, padding
// generoso, título centrado, subtítulo centrado.
//
// Vive en app/(auth)/_components/ (prefijo "_") → carpeta privada
// del route group, expo-router NO la expone como ruta. Solo la
// consumen las 3 pantallas de activación.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View (card), Text (título/subtítulo).
import { View, Text } from 'react-native';

// clsx por si en el futuro queremos combinar condicionales (no
// imprescindible hoy, pero lo dejo para no romper imports si lo
// añadimos luego).
import { clsx } from 'clsx';

// Props:
//   - title: string con el título principal de la card (centrado).
//   - subtitle: string con el subtítulo debajo. Soporta \n para
//     saltos de línea forzados (mismo patrón que el LoginForm).
//   - children: contenido del form (inputs, botón, links…).
//   - className: clases extra del contenedor externo.
const ActivationCard = ({
  title,
  subtitle,
  children,
  className = '',
}) => {
  return (
    // Mismo contenedor que LoginForm.jsx para que la transición
    // visual entre el login y el flow de activación sea coherente.
    // shadow-xl de NativeWind da la sombra en iOS; elevation vía
    // style cubre Android.
    <View
      className={clsx('bg-white rounded-3xl p-8 shadow-xl', className)}
      style={{ elevation: 8 }}
    >
      {/* Título: text-3xl (30px) bold, slate-900, centrado.
          Mismo tamaño que el "Bienvenido" del login → coherencia
          visual entre el entry point y el flow de activación. */}
      <Text className="text-3xl font-bold text-slate-900 text-center">
        {title}
      </Text>

      {/* Subtítulo: text-sm slate-500, centrado, leading-relaxed
          para que respire en multi-línea. mb-8 separa del primer
          input (mismo spacing que LoginForm). */}
      <Text className="text-slate-500 text-sm mt-2 mb-8 text-center leading-relaxed">
        {subtitle}
      </Text>

      {/* Contenido: inputs, botón, links, etc. */}
      {children}
    </View>
  );
};

export default ActivationCard;
