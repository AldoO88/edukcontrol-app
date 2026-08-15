// =====================================================================
// app/(guardian)/_components/AnnouncementCard.jsx
// ---------------------------------------------------------------------
// Card de aviso / citatorio para la pantalla "Avisos" (announcements.jsx).
// Renderiza ambos kinds del feed unificado (announcement | citation)
// con la misma estructura visual:
//
//   ┌──────────────────────────────────────────────┐
//   │ [PILL: URGENTE/INFORMATIVO/CITATORIO]  FECHA │  ← header
//   │                                              │
//   │ Título en negrita                            │  ← body
//   │ Descripción en gris (2 líneas max)           │
//   │                                              │
//   │ ─────────────────────────────────────────    │
//   │ TargetType / Nombre alumno (citatorio)        │  ← footer-1
//   │                                              │
//   │ [STATUS PILL]            Leer más / Detalles │  ← footer-2
//   └──────────────────────────────────────────────┘
//
// Qué va en el título según el kind:
//   - announcement → item.title (el título que escribió la escuela).
//   - citation     → el TIPO de citatorio ("Conductual",
//     "Aprovechamiento", "Administrativo"). El motivo redactado
//     (`reason`) va en la descripción, así que el título NO lo
//     repite.
//
// El color del borde izquierdo distingue el kind/tipo de un vistazo:
//   - announcement + urgent     → rose-500  (rojo)
//   - announcement + informative → sky-500  (azul)
//   - citation                  → amber-500 (ámbar)
//
// Vive en app/(guardian)/_components/ (prefijo "_") → carpeta privada
// del route group (app), Expo Router la ignora para routing.
//
// =====================================================================
// CONTEXTO DEL REDISEÑO (julio 2026)
// ---------------------------------------------------------------------
// Versión anterior: el footer mostraba el avatar + nombre del
// remitente (sender / creator). Ahora el footer muestra:
//
//   - targetType (anuncios): "General" / "Grupo 2°A" / "Personal: X"
//   - citatorioStudentName (citatorios): "Pedro González". Antes
//     mostraba "Motivo: Conductual · Pedro González", pero el motivo
//     se movió al título (como TIPO de citatorio), así que el footer
//     quedó solo con el alumno.
//
// Y una SEGUNDA fila con el status derivado del citatorio
// (VENCIDO / HOY / PRÓXIMO / FUTURO / CONFIRMADO) y el link
// de acción ("Leer más" para anuncios, "Detalles" para citatorios).
// Para anuncios no hay status, solo el link a la derecha.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text, Pressable.
import { View, Text, Pressable } from 'react-native';

// clsx para componer classNames condicionales.
import { clsx } from 'clsx';

// ---------------------------------------------------------------------
// CONFIG POR TIPO DE FEED ITEM
// ---------------------------------------------------------------------
// El feed unificado del backend (GET /api/guardians/me/announcements)
// mezcla dos tipos de items: `announcement` (con prioridad
// informative/urgent) y `citation` (citatorios). El card renderiza
// ambos con la misma estructura visual, pero con distintos colores
// de borde, pill de tipo y CTA. Centralizar el config evita un
// if/else gigante en el render y hace trivial añadir nuevos tipos
// (mantenimiento, reconocimiento, etc.) en el futuro.
//
// Cada entrada tiene:
//   - borderClass: color del borde izquierdo (clase NativeWind).
//   - badge: { bg, text, label } — estilos del pill de tipo y su
//     texto. La label se muestra en MAYÚSCULAS.
//   - actionLabel: texto del CTA en el footer. El spec dice:
//     * announcement → "Leer más" (lleva al detalle del aviso).
//     * citation     → "Detalles" (lleva al detalle del citatorio).
//
// URGENTE (rojo): badge soft (rose-100) con texto rojo oscuro
//   (rose-700) — "pide atención" sin saturar.
// INFORMATIVO (azul): badge sólido (sky-600) con texto blanco —
//   "esto es info" sin urgencia.
// CITATORIO (ámbar): badge soft (amber-100) con texto amber-700.
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
    actionLabel: 'Leer más',
  },
};

const CITATION_CONFIG = {
  borderClass: 'border-amber-500',
  badge: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    label: 'CITATORIO',
  },
  actionLabel: 'Detalles',
};

// ---------------------------------------------------------------------
// AnnouncementCard
// ---------------------------------------------------------------------
// Props:
//   - announcement: {
//       id: string|number,
//       kind: 'announcement' | 'citation',
//       priority: 'urgent' | 'informative' | null,
//       title: string,                 // citatorio: el TIPO ("Conductual")
//       description: string,           // citatorio: el motivo redactado
//       date: string (formato corto, ej: "24 oct"),
//
//       // Solo para kind === 'announcement':
//       targetType: string,            // "General" | "Grupo 2°A" | "Personal: X"
//
//       // Solo para kind === 'citation':
//       citatorioStudentName: string,  // "Pedro González" (sin foto)
//       citatorioStatus: {              // o null si no se pudo derivar
//         label: string,                // "VENCIDO" | "HOY" | "PRÓXIMO" | "FUTURO" | "CONFIRMADO"
//         bgClass: string,
//         textClass: string,
//       },
//     }
//   - onPress: callback al tocar la card (navegar al detalle).
// ---------------------------------------------------------------------
const AnnouncementCard = ({ announcement, onPress }) => {
  // Destructuring con defaults seguros.
  const {
    kind,
    priority = 'informative',
    title = '',
    description = '',
    date = '',
    targetType = null,
    citatorioStudentName = null,
    citatorioStatus = null,
  } = announcement || {};

  // Config visual: el kind 'citation' gana sobre la priority
  // (los citatorios NO tienen priority, pero defensivamente
  // protegemos el orden). Si llega una priority desconocida,
  // fallback a 'informative' (el más común entre los avisos).
  const config = kind === 'citation'
    ? CITATION_CONFIG
    : (PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.informative);

  // Texto del footer-1 según el kind:
  //   - announcement: targetType (ej: "General", "Grupo 2°A", "Personal: Pedro").
  //   - citation:     el nombre del alumno citado (ej: "Pedro González").
  //     Si el backend no manda el alumno, caemos a un placeholder
  //     antes que dejar el footer vacío.
  const footerPrimaryText = kind === 'citation'
    ? (citatorioStudentName || 'Alumno no especificado')
    : (targetType || 'General');

  return (
    // Contenedor de la card.
    // - bg-white: fondo blanco sobre el slate-50 de la pantalla.
    // - rounded-2xl: bordes redondeados consistentes con el resto
    //   de la app.
    // - shadow-sm + elevation 2: sombra sutil multiplataforma.
    // - border-l-4 border-{color}: borde izquierdo de 4px con el
    //   color del tipo/priority. borderLeftWidth respeta el
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
            HEADER: pill de tipo (izq) + fecha (der).
            flex-row + justify-between para alinear extremos.
            ---------------------------------------------------- */}
        <View className="flex-row items-center justify-between">
          {/* Pill de tipo. UPPERCASE tracking-wide font-bold
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
            FOOTER 1: targetType (avisos) / nombre del alumno
            (citatorios).
            ----------------------------------------------------
            border-t + pt-3 mt-4 separa del body sin divider
            explícito. Una sola línea semibold en ambos kinds:
              - announcement: el targetType.
              - citation:     el nombre del alumno citado.
            ---------------------------------------------------- */}
        <View className="border-t border-slate-100 mt-4 pt-3">
          <Text
            className="text-sm font-semibold text-slate-700"
            numberOfLines={1}
          >
            {footerPrimaryText}
          </Text>
        </View>

        {/* ----------------------------------------------------
            FOOTER 2: status pill (izq) + link de acción (der).
            ----------------------------------------------------
            - Para citatorios: pill con el status derivado
              (VENCIDO / HOY / PRÓXIMO / FUTURO / CONFIRMADO /
              PENDIENTE). Mismo lenguaje visual que el pill del
              header pero más chico (text-[10px], py-0.5).
            - Para avisos: NO hay status, solo el link a la derecha.
            El link de acción es el CTA ("Leer más" / "Detalles").
            Toda la card ya es Pressable; el texto es solo
            indicativo de qué pasa al tocarla.
            ---------------------------------------------------- */}
        <View className="mt-2 flex-row items-center justify-between">
          {/* Bloque izquierdo: status pill (citatorios) o vacío. */}
          <View className="flex-1">
            {citatorioStatus && (
              <View
                className={clsx(
                  'self-start px-2.5 py-0.5 rounded-full',
                  citatorioStatus.bgClass,
                )}
              >
                <Text
                  className={clsx(
                    'text-[10px] font-bold uppercase tracking-wider',
                    citatorioStatus.textClass,
                  )}
                >
                  {citatorioStatus.label}
                </Text>
              </View>
            )}
          </View>

          {/* Link de acción a la derecha. text-sm font-bold
              sky-600. numberOfLines={1} por si el texto es largo. */}
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
