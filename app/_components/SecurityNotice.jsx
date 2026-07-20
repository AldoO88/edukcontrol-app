// =====================================================================
// app/_components/SecurityNotice.jsx
// ---------------------------------------------------------------------
// Aviso de seguridad/privacidad que aparece bajo el formulario de
// login. Es un componente puramente presentacional: no recibe props,
// no tiene estado. Solo refuerza la confianza del usuario
// mostrándole que sus credenciales viajan cifradas y que la
// plataforma es de uso institucional.
//
// Vive en app/_components/ (prefijo "_") → privado, no es ruta.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View (contenedor flex-row), Text (mensaje).
import { View, Text } from 'react-native';

// Icono de escudo con check (emerald) — refuerza la sensación
// de "esto es seguro".
import { ShieldCheck } from 'lucide-react-native';

export default function SecurityNotice() {
  return (
    // flex-row + items-start: el icono a la izquierda, el texto a
    //   la derecha. items-start alinea el inicio del texto con el
    //   inicio del icono (no el centro vertical), que es lo que se
    //   ve mejor cuando el texto es multi-línea.
    // mt-6: separación sobre el botón "Iniciar sesión".
    // px-2: padding lateral para alinear con los inputs.
    <View className="flex-row items-start mt-6 px-2">
      {/* Icono. size=16 para que no compita visualmente con el
          formulario — es un detalle, no la atracción principal. */}
      <ShieldCheck
        size={16}
        color="#10b981"
        strokeWidth={2.25}
      />

      {/* Texto. ml-2 para separación del icono. flex-1 para que
          el texto ocupe el resto del ancho y haga wrap. leading-
          relaxed mejora la legibilidad en multi-línea. */}
      <Text className="text-slate-500 text-xs ml-2 flex-1 leading-relaxed">
        Tus credenciales viajan cifradas y nunca las compartiremos.
        Esta plataforma es de uso exclusivo de la comunidad escolar.
      </Text>
    </View>
  );
}
