// =====================================================================
// src/components/SchoolInfoCard.jsx (chrome compartido)
// ---------------------------------------------------------------------
// Card con la información de la escuela activa (tenant). Se muestra
// debajo del DashboardHeader en todas las pantallas de los route
// groups por rol ((guardian) y (teacher)) que necesiten identificar
// la escuela del usuario.
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
//   - teacherName: string opcional. Si se pasa, la card se vuelve
//     "compuesta": añade un divisor horizontal y una fila inferior con
//     "Prof. {teacherName}" + pill de rol + fecha (ver `date`). Es el
//     card compuesto que usa la pantalla "Mis Grupos" del maestro.
//   - date: string opcional. Fecha que se muestra en la fila inferior
//     cuando `teacherName` está presente (p. ej. "Lunes, 10 de agosto").
//     Sin `teacherName` no tiene efecto.
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
  teacherName,
  date,
}) => {
  // Modo compuesto: activo solo cuando el padre pasa el nombre del
  // maestro. En ese modo se añade el divisor + la fila inferior con
  // el nombre, el pill de rol y la fecha.
  const isComposite = !!teacherName;
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
        // Contenedor raíz en COLUMNA (flex-col): la fila de la escuela
        // y (en modo compuesto) el divisor + la fila del maestro se
        // apilan verticalmente. En el modo simple (sin maestro) solo se
        // ve la primera fila, por lo que el layout se ve idéntico a
        // como era antes.
        'bg-white px-4 py-2 rounded-3xl',
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
      {/* Fila superior (escuela): logo + nombre + ciclo en línea. */}
      <View className="flex-row items-center">
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

      {/* ============================================================
          MODO COMPUESTO (solo si teacherName está presente)
          ============================================================
          Cuando la card es compuesta se añade:
            - Divisor horizontal #F1F5F9 que separa la escuela.
            - Fila inferior: "Prof. {teacherName}" + pill de rol +
              fecha a la derecha.
          Este es el mismo card que implementé en la pantalla "Mis
          Grupos" del maestro (groups.jsx), ahora como parte del
          chrome compartido para reutilizarlo también en los avisos.
          ============================================================ */}
      {isComposite && (
        <>
          <View className="h-px bg-[#F1F5F9] my-2" />

          {/* ------------------------------------------------------------------
              FILA INFERIOR (modo compuesto): COLUMNA derecha? No — izquierda.
              - Left (stack vertical): nombre del maestro ARRIBA + pill "Docente"
                justo DEBAJO (alignSelf flex-start, pill azul claro #E0F2FE).
              - Right: fecha alineada a flex-end (#64748B, fontSize 12).
              ------------------------------------------------------------------ */}
          <View className="flex-row items-center justify-between">
            {/* Stack vertical izquierda: nombre + pill debajo. */}
            <View className="flex-1 mr-3">
              <Text
                className="font-bold"
                style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}
                numberOfLines={1}
              >
                Prof. {teacherName}
              </Text>

              {/* Pill de rol "Docente" debajo del nombre. */}
              <View
                style={{
                  alignSelf: 'flex-start',
                  marginTop: 4,
                  backgroundColor: '#E0F2FE',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#0284C7', fontSize: 11, fontWeight: '700' }}>
                  Docente
                </Text>
              </View>
            </View>

            {/* Fecha a la derecha. */}
            {date ? (
              <Text style={{ color: '#64748B', fontSize: 12, alignSelf: 'flex-end' }}>
                {date}
              </Text>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
};

export default SchoolInfoCard;
