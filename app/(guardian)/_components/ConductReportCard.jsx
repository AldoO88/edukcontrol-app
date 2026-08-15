// =====================================================================
// app/(guardian)/_components/ConductReportCard.jsx
// ---------------------------------------------------------------------
// Card de un reporte individual de conducta para la pantalla
// "Conducta" (conduct.jsx). Mismo lenguaje visual que
// AnnouncementCard.jsx: borde izquierdo grueso coloreado, header
// con tipo + meta, body con título + descripción, footer con fecha.
//
// Tipos soportados:
//   - falta_leve:  rose (incidencia menor, -5 a -3 pts).
//   - falta_grave: red (incidencia mayor, -10 a -20 pts).
//   - merito:      sky (conducta ejemplar, +2 a +10 pts).
//
// Props:
//   - report: {
//       id,
//       type: 'falta_leve' | 'falta_grave' | 'merito',
//       title,
//       description,
//       date: string ISO 8601 (ej: "2023-10-14T10:45:00"),
//       points: number (negativo para faltas, positivo para meritos),
//     }
//   - onPress: callback al tocar la card.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text, Pressable.
import { View, Text, Pressable } from 'react-native';

// Iconos Lucide.
import {
  TriangleAlert, // warning triangle (falta_leve).
  CircleAlert,   // círculo de alerta (falta_moderada).
  Flag,          // bandera (falta_grave, más "fuerte" que el triángulo).
  Star,          // estrella (mérito).
  Calendar,      // icono de fecha en el footer.
} from 'lucide-react-native';

// clsx para componer classNames condicionales.
import { clsx } from 'clsx';

// ---------------------------------------------------------------------
// TYPE_CONFIG
// ---------------------------------------------------------------------
// Configuración visual por tipo de reporte. Centralizarlo aquí evita
// un if/else gigante en el render y hace trivial añadir nuevos
// tipos (reconocimiento, observación positiva, etc.) en el futuro.
//
// Cada entrada tiene:
//   - borderClass: color del borde inferior (clase NativeWind).
//   - iconBg / iconColor: estilos del círculo del icono.
//   - badge: { bg, text, label } — estilos del pill de tipo.
//
// Tipos soportados (alineados con el spec del backend):
//   - falta_leve:     rose (incidencia menor, -5 a -3 pts).
//   - falta_moderada: orange (incidencia moderada, -10 a -7 pts).
//   - falta_grave:    red (incidencia mayor, -20 a -10 pts).
//   - merito:         sky (conducta ejemplar, +2 a +10 pts).
// ---------------------------------------------------------------------
const TYPE_CONFIG = {
  falta_leve: {
    borderClass: 'border-rose-500',
    iconBg: 'bg-rose-100',
    iconColor: '#e11d48', // rose-600
    badge: {
      bg: 'bg-rose-100',
      text: 'text-rose-700',
      label: 'FALTA LEVE',
    },
    icon: TriangleAlert,
  },
  falta_moderada: {
    borderClass: 'border-orange-500',
    iconBg: 'bg-orange-100',
    iconColor: '#ea580c', // orange-600
    badge: {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      label: 'FALTA MODERADA',
    },
    icon: CircleAlert,
  },
  falta_grave: {
    borderClass: 'border-red-600',
    iconBg: 'bg-red-100',
    iconColor: '#dc2626', // red-600
    badge: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      label: 'FALTA GRAVE',
    },
    icon: Flag,
  },
  merito: {
    borderClass: 'border-sky-500',
    iconBg: 'bg-sky-100',
    iconColor: '#0284c7', // sky-600
    badge: {
      bg: 'bg-sky-100',
      text: 'text-sky-700',
      label: 'MÉRITO',
    },
    icon: Star,
  },
};

// ---------------------------------------------------------------------
// formatReportDate(iso)
// ---------------------------------------------------------------------
// Helper: formatea un ISO 8601 como "14 Oct, 2023 · 10:45 AM".
// Se usa en el footer de cada card. Lo extraemos aquí porque es
// específico de esta pantalla (formato corto + hora 12h) y no
// matchea con formatRelativeDateTime de utils/dateHelpers (que
// devuelve "Hoy, 7:25 a.m." / "Ayer, 2:15 p.m.").
const MONTHS_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const formatReportDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  const day = d.getDate();
  const month = MONTHS_ES[d.getMonth()];
  const year = d.getFullYear();

  // Hora en formato 12h con AM/PM.
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${day} ${month}, ${year} · ${hours}:${minutes} ${ampm}`;
};

// ---------------------------------------------------------------------
// ConductReportCard
// ---------------------------------------------------------------------
const ConductReportCard = ({ report, onPress }) => {
  // Destructuring con defaults seguros.
  const {
    type = 'falta_leve',
    title = '',
    description = '',
    date = '',
    points = 0,
  } = report || {};

  // Config visual según tipo. Si llega un tipo desconocido,
  // fallback a 'falta_leve' (el más común).
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.falta_leve;
  const Icon = config.icon;

  // Color del puntaje: verde si es positivo (mérito), rojo si
  // es negativo (falta). El text-sm font-bold refuerza la
  // jerarquía visual en el header de la card.
  const isPositive = points > 0;
  const pointsLabel = `${isPositive ? '+' : ''}${points} pts`;
  const pointsClass = isPositive ? 'text-emerald-600' : 'text-rose-600';

  return (
    // Contenedor de la card.
    // - bg-white: fondo blanco sobre el slate-50 de la pantalla.
    // - rounded-2xl: bordes redondeados consistentes con
    //   AnnouncementCard.
    // - shadow-sm + elevation 2: sombra sutil multiplataforma.
    // - border-b-4 border-{color}: borde INFERIOR de 4px con el
    //   color del tipo de reporte. borderBottomWidth respeta el
    //   borderRadius, por lo que el borde se ve "limpio" en las
    //   esquinas. (Decisión de diseño julio 2026: se cambió del
    //   lateral al inferior para distinguir visualmente las cards
    //   de conducta de las de avisos.)
    <Pressable
      onPress={onPress}
      className={clsx(
        'bg-white rounded-2xl shadow-sm mb-4 border-b-4',
        config.borderClass,
      )}
      style={{ elevation: 2 }}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${pointsLabel}.`}
    >
      <View className="p-5">
        {/* ----------------------------------------------------
            HEADER: icono (círculo) + tipo pill (centro) + puntos (der).
            flex-row + items-center para alinear el bloque izq, y
            ml-auto en el puntaje para empujarlo a la derecha.
            ---------------------------------------------------- */}
        <View className="flex-row items-center justify-between">
          {/* Bloque izquierdo: icono + tipo pill. */}
          <View className="flex-row items-center flex-1">
            {/* Círculo del icono. w-9 h-9 (36px) para que case con
                el avatar del AnnouncementCard (consistencia visual
                entre pantallas). */}
            <View
              className={clsx(
                'w-9 h-9 rounded-full items-center justify-center',
                config.iconBg,
              )}
            >
              <Icon size={18} color={config.iconColor} strokeWidth={2.25} />
            </View>

            {/* Pill de tipo. UPPERCASE tracking-wide font-bold
                para el look "system badge" del sistema de diseño. */}
            <View
              className={clsx(
                'ml-3 px-3 py-1 rounded-full',
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
          </View>

          {/* Puntaje a la derecha. text-sm font-bold. El color
              depende del signo (verde = mérito, rojo = falta). */}
          <Text className={clsx('text-sm font-bold ml-2', pointsClass)}>
            {pointsLabel}
          </Text>
        </View>

        {/* ----------------------------------------------------
            BODY: título + descripción.
            mt-3 separa del header (icono + pill + puntos).
            numberOfLines={2} en la descripción para truncar a
            2 líneas con "..." (consistente con AnnouncementCard).
            ---------------------------------------------------- */}
        <Text
          className="text-base font-bold text-slate-900 mt-3 leading-snug"
          numberOfLines={2}
        >
          {title}
        </Text>

        <Text
          className="text-sm text-slate-500 mt-1.5 leading-relaxed"
          numberOfLines={3}
        >
          {description}
        </Text>

        {/* ----------------------------------------------------
            FOOTER: fecha con icono Calendar.
            border-t border-slate-100 + pt-3 mt-3 separa este
            bloque del body sin necesidad de un divider explícito.
            ---------------------------------------------------- */}
        <View className="border-t border-slate-100 mt-3 pt-3 flex-row items-center">
          <Calendar size={13} color="#94a3b8" strokeWidth={2} />
          <Text className="text-xs text-slate-500 ml-1.5">
            {formatReportDate(date)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default ConductReportCard;
