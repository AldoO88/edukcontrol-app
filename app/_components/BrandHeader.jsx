// =====================================================================
// app/_components/BrandHeader.jsx
// ---------------------------------------------------------------------
// Header de marca de la pantalla de Login (y de los flows públicos
// de activation, que reutilizan este mismo componente). Muestra el
// brand del PRODUCTO (EdukControl) en la ruta "/", no la escuela
// activa del tenant — la escuela aparece en la school info card del
// dashboard post-login. Cada screen/layout file es responsable de su
// propio header (no hay un SchoolHeader global en el Stack raíz).
//
// Componente privado del route index.jsx: vive en _components/ para
// que Expo Router no lo exponga como ruta.
//
// Visualmente:
//   - Fondo claro (bg-slate-50) que se funde con el body y deja la
//     card blanca como protagonista visual.
//   - Logo: cuadrado redondeado azul (sky-500) con el birrete blanco
//     en su interior — el "isotipo" institucional.
//   - Wordmark "EdukControl" en sky-500 (vibrante, reconocible).
//   - Padding vertical generoso (py-8) para que el header respire
//     sin necesidad de una sombra/border.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View (contenedor), Text (texto de marca).
import { View, Text } from 'react-native';

// Icono de birrete / graduación. Es el símbolo universal de
// "educación" y casa bien con el dominio de la app. Se renderiza
// en blanco dentro del cuadrado azul del isotipo.
import { GraduationCap } from 'lucide-react-native';

export default function BrandHeader() {
  return (
    // bg-slate-50: mismo gris del body, sin borde inferior. El
    // header no compite con la card: la atención va al formulario.
    // py-8: padding vertical generoso (32px) para que el bloque
    // del logo no quede pegado ni al status bar ni a la card.
    // items-center: centra horizontalmente el bloque interior.
    <View className="bg-slate-50 py-8 items-center">
      {/* Bloque isotipo + wordmark. flex-row + items-center los
          alinea en una sola línea centrados verticalmente. */}
      <View className="flex-row items-center">
        {/* Isotipo: cuadrado azul con el birrete blanco.
            - bg-sky-500: azul vibrante del sistema de diseño.
            - rounded-2xl: bordes generosos (16px) para look "app".
            - p-2.5: padding interno para que el icono no toque los
              bordes del cuadrado.
            - shadow-sm + elevation 3: sombra sutil para que el
              isotipo "flote" sobre el fondo claro. */}
        <View
          className="bg-sky-500 rounded-2xl p-2.5 shadow-sm"
          style={{ elevation: 3 }}
        >
          {/* Birrete blanco dentro del cuadrado. size=28 (28px) para
              que el icono se vea prominente pero respete el padding
              del contenedor. strokeWidth=2.25 para trazo sólido. */}
          <GraduationCap
            size={28}
            color="#ffffff"
            strokeWidth={2.25}
          />
        </View>

        {/* Wordmark. text-3xl (30px) bold, sky-500 (mismo azul
            que el isotipo) para máxima coherencia de marca.
            ml-3 separa del cuadrado. tracking-tight reduce un
            pelín el interletraje para que se vea más "marca". */}
        <Text className="text-3xl font-bold text-sky-500 ml-3 tracking-tight">
          EdukControl
        </Text>
      </View>
    </View>
  );
}
