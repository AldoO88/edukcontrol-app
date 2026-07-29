// =====================================================================
// app/(app)/_components/HorarioList.jsx
// ---------------------------------------------------------------------
// Horario de clases del alumno para UN día (el seleccionado vía el
// selector de días de la pantalla "Calificaciones"). Renderiza una
// tabla con dos columnas:
//
//   ┌──────────────┬──────────────────────────────┐
//   │ HORA         │ LUN                          │  ← header slate-50
//   ├──────────────┼──────────────────────────────┤
//   │ 🕐 07:30-08:20 │ [Mat] Matemáticas           │
//   │                  Prof. García                │
//   │ 🕐 08:20-09:10 │ [Mat] Matemáticas           │
//   │                  Prof. García                │
//   │ ...                                          │
//   ├──────────────┴──────────────────────────────┤
//   │   RECESO (10:50 - 11:10)                    │  ← full-width
//   ├──────────────┬──────────────────────────────┤
//   │ 🕐 11:10-12:00 │ [His] Historia              │
//   │                  Prof. López                 │
//   └──────────────┴──────────────────────────────┘
//
// Cada clase muestra:
//   - Hora (con icono Clock)
//   - Pill de código de materia (Mat, Esp, etc.) coloreado
//   - Nombre completo de la materia (Matemáticas, etc.)
//   - Nombre del maestro que la imparte
//
// Props:
//   - day:     string con la etiqueta del día ("LUN", "MAR", ...).
//   - schedule: array de slots del día. Cada slot es O:
//                 { time, subject (código), subjectFull, teacher, color }
//                 { type: "receso", time }
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text.
import { View, Text } from 'react-native';

// Iconos Lucide.
import { Clock, User } from 'lucide-react-native';

// clsx.
import { clsx } from 'clsx';

// ---------------------------------------------------------------------
// SUBJECT_COLORS
// ---------------------------------------------------------------------
// Mapa estático de colores por materia (mismas reglas que antes:
// no se pueden usar clases dinámicas con Tailwind, así que
// extraemos las clases a un objeto indexado por clave).
// Cada color tiene un par bg (fondo del pill) + text (texto del código).
// ---------------------------------------------------------------------
const SUBJECT_COLORS = {
  sky:     { bg: 'bg-sky-100',     text: 'text-sky-700' },
  rose:    { bg: 'bg-rose-100',    text: 'text-rose-700' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  amber:   { bg: 'bg-amber-100',   text: 'text-amber-700' },
  purple:  { bg: 'bg-purple-100',  text: 'text-purple-700' },
  cyan:    { bg: 'bg-cyan-100',    text: 'text-cyan-700' },
};

// ---------------------------------------------------------------------
// HorarioList
// ---------------------------------------------------------------------
const HorarioList = ({ day = 'LUN', schedule = [] }) => {
  // Estado vacío: si no hay slots para este día, mensaje neutro.
  if (schedule.length === 0) {
    return (
      <View className="bg-white rounded-2xl p-6 items-center">
        <Text className="text-sm text-slate-500 text-center">
          No hay clases programadas para este día.
        </Text>
      </View>
    );
  }

  return (
    // Contenedor de la tabla del horario.
    // - bg-white rounded-2xl: card blanca.
    // - border-t-[5px] border-t-sky-500: cinta sky (identidad).
    // - border border-slate-200: contorno sutil.
    // - shadow-md + elevation 3: sombra prominente.
    // - overflow-hidden: el borderRadius se respeta en hijos.
    <View
      className="bg-white rounded-2xl border border-slate-200 border-t-[5px] border-t-sky-500 shadow-md overflow-hidden"
      style={{ elevation: 3 }}
    >
      {/* ------------------------------------------------------
          HEADER DE COLUMNAS
          ------------------------------------------------------
          HORA a la izquierda (flex-1) + etiqueta del día a la
          derecha (w-20 fija, centrada). bg-slate-50 + border-b
          para separar del cuerpo.
          ------------------------------------------------------ */}
      <View className="flex-row items-center px-5 py-3 bg-slate-50 border-b border-slate-100">
        <Text className="flex-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Hora
        </Text>
        <Text className="w-32 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {day}
        </Text>
      </View>

      {/* ------------------------------------------------------
          CUERPO: clases + recesos
          ------------------------------------------------------ */}
      {schedule.map((slot, index) => {
        // RECESO: fila especial full-width con bg-sky-50.
        if (slot.type === 'receso') {
          return (
            <View
              key={`receso-${index}`}
              className="bg-sky-50 py-3 items-center"
            >
              <Text className="text-sm font-bold uppercase tracking-wider text-sky-700">
                Receso ({slot.time})
              </Text>
            </View>
          );
        }

        // Clase regular: Hora | card con código + nombre + maestro.
        const colorClasses = SUBJECT_COLORS[slot.color] || SUBJECT_COLORS.sky;
        return (
          <View
            key={`class-${index}`}
            className={clsx(
              'flex-row items-center px-5 py-3',
              // border-t entre filas de clase (no aplica al
              // receso, que ya tiene su propio separador
              // implícito por el bg-sky-50).
              index > 0 && !schedule[index - 1]?.type && 'border-t border-slate-100',
            )}
          >
            {/* Columna HORA: time range con icono Clock.
                w-24 fija (96px) para alinear las horas. */}
            <View className="w-24 flex-row items-center">
              <Clock size={14} color="#64748b" strokeWidth={2} />
              <Text className="text-xs font-semibold text-slate-700 ml-1.5">
                {slot.time}
              </Text>
            </View>

            {/* Columna del día: card con código + nombre + maestro.
                w-32 (128px) fija para que la celda case con el
                header. Dentro de la card:
                  - Pill de código (w-9 h-9) a la izquierda
                  - Nombre completo + maestro a la derecha */}
            <View
              className={clsx(
                'flex-1 flex-row items-center px-3 py-2 rounded-xl ml-10',
                colorClasses.bg,
              )}
            >
              {/* Pill del código de materia. w-9 h-9 (36px) para
                  que el código (2-3 chars) se vea cómodo. */}
              <View
                className={clsx(
                  'w-9 h-9 rounded-lg items-center justify-center mr-3',
                  'bg-white',
                )}
              >
                <Text
                  className={clsx(
                    'text-[11px] font-bold',
                    colorClasses.text,
                  )}
                >
                  {slot.subject}
                </Text>
              </View>

              {/* Textos: nombre completo + maestro. flex-1 para
                  que el nombre ocupe el resto del ancho. */}
              <View className="flex-1 min-w-0">
                <Text
                  className="text-sm font-bold text-slate-900"
                  numberOfLines={1}
                >
                  {slot.subjectFull}
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <User size={11} color="#64748b" strokeWidth={2} />
                  <Text
                    className="text-xs text-slate-600 ml-1 flex-1"
                    numberOfLines={1}
                  >
                    {slot.teacher}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default HorarioList;
