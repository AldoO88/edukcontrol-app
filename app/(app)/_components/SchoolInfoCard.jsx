// =====================================================================
// app/(app)/_components/SchoolInfoCard.jsx
// ---------------------------------------------------------------------
// Card con la información de la escuela activa (tenant). Se muestra
// debajo del DashboardHeader en todas las pantallas del route group
// (app) que necesiten identificar la escuela del usuario.
//
// Props:
//   - school: objeto con los datos de la escuela (o undefined/null
//     mientras carga). Shape esperada:
//       { name: string, logo_url: string|null, current_school_year: string }
//   - isLoading: boolean. Si true y NO hay school, muestra un
//     skeleton gris en lugar del logo.
//   - className: clases extra para el contenedor externo (útil para
//     márgenes desde el padre, e.g. "mx-4 mt-4").
//   - style: style extra (útil para pasar margin/positioning).
//
// Self-contained: maneja internamente el estado de error de la
// imagen (logoError) y el reset cuando cambia la URL. No necesita
// que el padre gestione nada relacionado con el logo.
// =====================================================================

// React + hooks.
import React, { useState, useEffect } from 'react';

// Primitivas RN: View, Text, Image.
import { View, Text, Image } from 'react-native';

// Iconos Lucide.
import { GraduationCap } from 'lucide-react-native';

// clsx para componer classNames condicionales.
import { clsx } from 'clsx';

const SchoolInfoCard = ({
  school,
  isLoading = false,
  className = '',
  style,
}) => {
  // Estado local: si la URL del logo falla al cargar (404, red
  // caída, formato no soportado), el onError del <Image> setea
  // este flag y caemos al fallback del ícono GraduationCap.
  // Se resetea cada vez que cambia la URL para no quedarse con
  // el flag de error de un render anterior.
  const [logoError, setLogoError] = useState(false);
  useEffect(() => {
    setLogoError(false);
  }, [school?.logo_url]);

  // Derivados de los datos de la escuela.
  const schoolName = school?.name;
  const schoolCycle = school?.current_school_year || '2025-2026';
  const schoolLogo = school?.logo_url;
  // Skeleton solo mientras loading Y no hay datos (primer fetch).
  // Si ya hay data, mostramos algo (logo o fallback), nunca skeleton.
  const showSkeleton = isLoading && !school;

  return (
    // bg-white: fondo blanco sobre el slate-50 de la pantalla.
    // rounded-3xl: bordes muy generosos (mismo lenguaje que el login).
    // border border-slate-200: contorno sutil slate-200 (no es
    //   un "borde de color" — es solo la línea de separación
    //   neutra que ayuda a delimitar la card sobre el fondo
    //   slate-50). NO lleva cinta sky ni ningún otro acento de
    //   color: la SchoolInfoCard es la card "neutra" del route
    //   group, y la identidad de color la pone el brand del
    //   header.
    // shadow-md + elevation 3: sombra estándar (no tintada),
    //   mismo look que el resto de cards "data".
    // px-6 py-5 (24/20px) + flex-row items-center: layout horizontal
    // del logo + texto.
    <View
      className={clsx(
        'bg-white flex-row items-center px-6 py-5 rounded-3xl',
        'border border-slate-200',
        'shadow-md',
        className,
      )}
      style={[
        style,
        {
          // Sombra estándar slate-900 (en vez de sky-500 tintada).
          // shadowColor por defecto de NativeWind es negro, lo
          // forzamos a slate-900 para que matchee el sistema de
          // diseño y se sienta "neutra" como la card.
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.10,
          shadowRadius: 12,
          elevation: 3,
        },
      ]}
    >
      {/* Cuadrado de 56x56 para el logo/ícono. 20% más grande que
          el w-12 h-12 (48px) original. overflow-hidden recorta la
          imagen a las esquinas redondeadas. */}
      <View className="w-14 h-14 rounded-2xl bg-sky-600 items-center justify-center mr-4 overflow-hidden">
        {/* Loading inicial: skeleton gris. */}
        {showSkeleton && <View className="w-full h-full bg-slate-200" />}
        {/* Data OK con logo: imagen del backend. */}
        {schoolLogo && !logoError && (
          <Image
            source={{ uri: schoolLogo }}
            className="w-full h-full"
            resizeMode="cover"
            accessibilityLabel={`Logo de ${schoolName || 'la escuela'}`}
            onError={() => setLogoError(true)}
          />
        )}
        {/* Fallback: ícono GraduationCap. Solo se muestra cuando
            ya tenemos school (no durante el skeleton). size 28
            (antes 24) para mantener la proporción con el
            contenedor más grande. */}
        {!showSkeleton && (!schoolLogo || logoError) && (
          <GraduationCap size={28} color="#ffffff" strokeWidth={2.25} />
        )}
      </View>
      <View className="flex-1">
        {/* Nombre de la escuela. text-lg (18px) en vez de text-base
            (16px) → ~12.5% más grande. font-bold para jerarquía. */}
        <Text
          className="text-lg font-bold text-slate-900"
          numberOfLines={1}
        >
          {schoolName || (
            <Text className="text-slate-300">—</Text>
          )}
        </Text>
        {/* Ciclo escolar. text-sm (14px) en vez de text-xs (12px)
            → ~17% más grande. mt-1 separa del nombre. */}
        <Text className="text-sm text-slate-500 mt-1">
          {schoolCycle
            ? `Ciclo Escolar ${schoolCycle}`
            : 'Cargando…'}
        </Text>
      </View>
    </View>
  );
};

export default SchoolInfoCard;
