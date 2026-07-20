// =====================================================================
// app/_components/BrandHeader.jsx
// ---------------------------------------------------------------------
// Header de marca de la pantalla de Login. Muestra el brand del
// PRODUCTO (EdukControl) en la ruta "/", no la escuela activa del
// tenant — la escuela aparece en la school info card del dashboard
// post-login. Cada screen/layout file es responsable de su propio
// header (no hay un SchoolHeader global en el Stack raíz).
//
// Componente privado del route index.jsx: vive en _components/ para
// que Expo Router no lo exponga como ruta.
//
// Visualmente:
//   - Fondo gris claro (bg-slate-100), un poco más oscuro que el
//     body (bg-slate-50) para crear la sensación de "barra superior".
//   - Borde inferior sutil (border-slate-200) que separa el header
//     del contenido sin necesidad de una sombra.
//   - Contenido centrado horizontalmente: icono + texto "EdukControl".
//   - Padding vertical cómodo (py-4) sin tocar los costados: el
//     header ocupa todo el ancho de la pantalla.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View (contenedor), Text (texto de marca).
import { View, Text } from 'react-native';

// Icono de birrete / graduación. Es el símbolo universal de
// "educación" y casa bien con el dominio de la app. Color navy
// (blue-900) para destacar contra el fondo gris claro y diferenciarlo
// del texto slate-900 de la marca.
import { GraduationCap } from 'lucide-react-native';

export default function BrandHeader() {
  return (
    // bg-slate-100: gris un punto más oscuro que el body slate-50.
    // border-b border-slate-200: línea de 1px que cierra la barra.
    // py-4: 16px de padding vertical (espacio cómodo arriba/abajo).
    // items-center: centra horizontalmente el bloque interior.
    <View className="bg-slate-100 border-b border-slate-200 py-4 items-center">
      {/* Bloque icono + texto. flex-row + items-center los alinea
          en una sola línea centrados verticalmente. */}
      <View className="flex-row items-center">
        {/* Icono. size=24 (24px) para que case con el cuerpo del
            texto (text-xl ≈ 20px de altura de cap). strokeWidth=2.25
            para que el trazo se vea sólido al tamaño elegido. */}
        <GraduationCap
          size={24}
          color="#1e3a8a"
          strokeWidth={2.25}
        />

        {/* Texto. text-xl (20px) bold, slate-900 (casi negro) para
            máxima legibilidad. ml-2 separa del icono. */}
        <Text className="text-xl font-bold text-slate-900 ml-2">
          EdukControl
        </Text>
      </View>
    </View>
  );
}
