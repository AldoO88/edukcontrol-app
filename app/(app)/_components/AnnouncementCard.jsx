// =====================================================================
// app/(app)/_components/AnnouncementCard.jsx
// ---------------------------------------------------------------------
// Card de anuncio para la pantalla "Avisos" (avisos.jsx).
// Encapsula la UI de UN anuncio:
//   - Borde izquierdo grueso coloreado por prioridad (urgente = red,
//     informativo = blue).
//   - Header: pill de tipo + fecha alineada a la derecha.
//   - Body: título + descripción truncada a 2 líneas.
//   - Footer: avatar circular + contexto + acción alineada a la
//     derecha.
//
// Vive en app/(app)/_components/ (prefijo "_") → carpeta privada
// del route group (app), Expo Router la ignora para routing.
//
// NOTA: existe otro AnnouncementCard en src/components/AnnouncementCard.jsx
// con un patrón expandible/colapsable. Son componentes DISTINTOS para
// pantallas DISTINTAS (esta es la versión "feed" de Avisos; la otra
// es la versión "lista expandible" que se usaba antes). No los
// fusionamos porque la UX de cada uno es diferente.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text, Pressable, Image.
import { View, Text, Pressable, Image } from 'react-native';

// clsx para componer classNames condicionales.
import { clsx } from 'clsx';

// ---------------------------------------------------------------------
// PRIORITY_CONFIG
// ---------------------------------------------------------------------
// Configuración visual por prioridad. Centralizarlo aquí evita un
// if/else gigante en el render y hace trivial añadir nuevas
// prioridades (mantenimiento, académico, etc.) en el futuro.
//
// Cada entrada tiene:
//   - borderClass: color del borde izquierdo (clase NativeWind).
//   - badge: { bg, text, label } — estilos del pill de tipo y su
//     texto. La label se muestra en MAYÚSCULAS (formateamos con
//     .toUpperCase() para soportar tanto 'urgente' como 'URGENTE'
//     desde el backend).
//   - actionLabel: texto del CTA en el footer ("Leer más" para
//     urgentes, "Detalles" para informativos).
//
// URGENTE (rojo): badge soft (rose-100) con texto rojo oscuro
//   (rose-700) — "pide atención" sin saturar.
// INFORMATIVO (azul): badge sólido (sky-600) con texto blanco —
//   "esto es info" sin urgencia.
// ---------------------------------------------------------------------
const PRIORITY_CONFIG = {
  urgent: {
    borderClass: 'border-rose-500',
    badge: {
      bg: 'bg-rose-100',
      text: 'text-rose-700',
      label: 'URGENTE',
    },
    actionLabel: 'Leer más',
  },
  informative: {
    borderClass: 'border-sky-500',
    badge: {
      bg: 'bg-sky-600',
      text: 'text-white',
      label: 'INFORMATIVO',
    },
    actionLabel: 'Detalles',
  },
};

// ---------------------------------------------------------------------
// getInitials(name)
// ---------------------------------------------------------------------
// Helper: dado un nombre completo, devuelve 1-2 chars para usar
// como fallback del avatar. Si el nombre está vacío, devuelve "?".
// Mismo patrón que el del GuardianDashboard — no lo extraemos a
// utils porque solo se usa en 2 sitios y son 5 líneas.
const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ---------------------------------------------------------------------
// AnnouncementCard
// ---------------------------------------------------------------------
// Props:
//   - announcement: {
//       id: string|number,
//       priority: 'urgent' | 'informative',
//       title: string,
//       description: string,
//       date: string (formato corto, ej: "Oct 24"),
//       author: {
//         name: string (ej: "General" o "Carlos"),
//         subtitle: string (opcional, ej: "2ºB" para mostrar tras "·"),
//         avatarUrl: string (opcional, URL absoluta),
//         avatarLetter: string (opcional, forzar una letra; si no,
//                              se calcula desde author.name),
//       },
//     }
//   - onPress: callback al tocar la card (navegar al detalle).
// ---------------------------------------------------------------------
const AnnouncementCard = ({ announcement, onPress }) => {
  // Destructuring con defaults seguros.
  const {
    priority = 'informative',
    title = '',
    description = '',
    date = '',
    author = {},
  } = announcement || {};

  // Config visual según prioridad. Si llega una prioridad
  // desconocida, fallback a 'informative' (el más común).
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.informative;

  // Avatar: preferimos avatarUrl (foto real). Si falla o no
  // existe, mostramos iniciales (o avatarLetter si viene forzado).
  const [avatarError, setAvatarError] = React.useState(false);
  React.useEffect(() => {
    // Si cambia la URL, reseteamos el flag de error.
    setAvatarError(false);
  }, [author?.avatarUrl]);

  const showAvatarImage = author?.avatarUrl && !avatarError;
  // Si hay avatarLetter forzado (ej: "G" para "General"), lo
  // usamos; si no, calculamos desde author.name.
  const avatarText = author?.avatarLetter || getInitials(author?.name);

  return (
    // Contenedor de la card.
    // - bg-white: fondo blanco sobre el slate-50 de la pantalla.
    // - rounded-2xl: bordes redondeados consistentes con el resto
    //   de la app.
    // - shadow-sm + elevation 2: sombra sutil multiplataforma.
    // - border-l-4 border-{color}: borde izquierdo de 4px con el
    //   color de la prioridad. borderLeftWidth respeta el
    //   borderRadius, por lo que el borde se ve "limpio" arriba
    //   y abajo.
    <Pressable
      onPress={onPress}
      className={clsx(
        'bg-white rounded-2xl shadow-sm mb-4 border-l-4',
        config.borderClass,
      )}
      style={{ elevation: 2 }}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${config.actionLabel}.`}
    >
      {/* Padding interior. p-5 (20px) en todos los lados. */}
      <View className="p-5">
        {/* ----------------------------------------------------
            HEADER: pill de prioridad (izq) + fecha (der).
            flex-row + justify-between para alinear extremos.
            ---------------------------------------------------- */}
        <View className="flex-row items-center justify-between">
          {/* Pill de prioridad. UPPERCASE tracking-wide font-bold
              para el look "system badge". */}
          <View
            className={clsx(
              'px-3 py-1 rounded-full',
              config.badge.bg,
            )}
          >
            <Text
              className={clsx(
                'text-[11px] font-bold uppercase tracking-wider',
                config.badge.text,
              )}
            >
              {config.badge.label}
            </Text>
          </View>

          {/* Fecha. text-xs slate-400, alineada a la derecha por
              el justify-between del padre. */}
          <Text className="text-xs font-medium text-slate-400">
            {date}
          </Text>
        </View>

        {/* ----------------------------------------------------
            BODY: título + descripción.
            mt-3 separa del header (pill + fecha).
            numberOfLines={2} en la descripción para truncar a
            2 líneas con "..." (consistente en TODA la pantalla,
            clave cuando hay descripciones largas).
            ---------------------------------------------------- */}
        <Text
          className="text-lg font-bold text-slate-900 mt-3 leading-snug"
          numberOfLines={2}
        >
          {title}
        </Text>

        <Text
          className="text-sm text-slate-500 mt-2 leading-relaxed"
          numberOfLines={2}
        >
          {description}
        </Text>

        {/* ----------------------------------------------------
            FOOTER: avatar + contexto (izq) + acción (der).
            border-t border-slate-100 + pt-3 mt-4 separa este
            bloque del body sin necesidad de un divider explícito.
            ---------------------------------------------------- */}
        <View className="border-t border-slate-100 mt-4 pt-3 flex-row items-center justify-between">
          {/* Bloque izquierdo: avatar + textos. */}
          <View className="flex-row items-center flex-1">
            {/* Avatar circular. w-9 h-9 (36px) para que la inicial
                se vea cómoda sin robar demasiado espacio.
                overflow-hidden recorta la imagen al círculo. */}
            <View className="w-9 h-9 rounded-full bg-sky-100 items-center justify-center overflow-hidden">
              {showAvatarImage ? (
                <Image
                  source={{ uri: author.avatarUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                  accessibilityLabel={`Avatar de ${author.name || 'autor'}`}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                // Fallback: inicial sobre fondo sky-100.
                // text-xs (12px) bold sky-700.
                <Text className="text-xs font-bold text-sky-700">
                  {avatarText}
                </Text>
              )}
            </View>

            {/* Textos: nombre + subtitle (opcional) separados por "·".
                ml-2.5 separa del avatar. flex-1 permite truncar si
                el nombre es largo. */}
            <View className="ml-2.5 flex-1">
              <Text
                className="text-sm font-semibold text-slate-700"
                numberOfLines={1}
              >
                {author?.name || 'Sin autor'}
                {author?.subtitle ? (
                  <Text className="text-slate-400 font-normal">
                    {' · '}{author.subtitle}
                  </Text>
                ) : null}
              </Text>
            </View>
          </View>

          {/* Acción a la derecha. text-sm font-semibold sky-600.
              hitSlop para área táctil cómoda en mobile. */}
          <Text
            className="text-sm font-bold text-sky-600 ml-2"
            numberOfLines={1}
          >
            {config.actionLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default AnnouncementCard;
