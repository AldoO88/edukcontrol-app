// =====================================================================
// app/(app)/_components/AttendanceHistoryTable.jsx
// ---------------------------------------------------------------------
// Tabla de entradas y salidas recientes del alumno para la pantalla
// "Asistencia". Similar a CalificacionesTable: header + filas con
// status pill al final.
//
// Shape:
//
//   ┌──────────┬────────┬────────┬──────────┐
//   │ FECHA    │ENTRADA │ SALIDA │ ESTADO   │  ← header slate-50
//   ├──────────┼────────┼────────┼──────────┤
//   │ Oct 24   │07:45 AM│02:15 PM│ A TIEMPO │
//   │ Oct 23   │07:50 AM│02:19 PM│ A TIEMPO │
//   │ Oct 22   │08:05 AM│02:15 PM│ RETARDO  │
//   │ ...                                              │
//   └──────────┴────────┴────────┴──────────┘
//
// Props:
//   - history: array de {
//       id,
//       date: string (formato corto: "Oct 24"),
//       entry: string (hora: "07:45 AM"),
//       exit:  string (hora: "02:15 PM"),
//       status: 'a_tiempo' | 'tarde' | 'falta',
//     }
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text.
import { View, Text } from 'react-native';

// clsx.
import { clsx } from 'clsx';

// ---------------------------------------------------------------------
// STATUS_CONFIG
// ---------------------------------------------------------------------
// Configuración visual del pill de estado. Misma convención que
// el resto del proyecto (keys estáticas para que NativeWind
// detecte las clases en build-time).
// ---------------------------------------------------------------------
const STATUS_CONFIG = {
  a_tiempo: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'A TIEMPO' },
  tarde:    { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'RETARDO'  },
  falta:    { bg: 'bg-rose-100',    text: 'text-rose-700',    label: 'FALTA'    },
};

// ---------------------------------------------------------------------
// AttendanceHistoryTable
// ---------------------------------------------------------------------
const AttendanceHistoryTable = ({ history = [] }) => {
  // Estado vacío: si no hay historial, mensaje neutro.
  if (history.length === 0) {
    return (
      <View className="bg-white rounded-2xl p-6 items-center">
        <Text className="text-sm text-slate-500 text-center">
          No hay registros de asistencia para este estudiante.
        </Text>
      </View>
    );
  }

  return (
    // Contenedor de la tabla. Mismo lenguaje que CalificacionesTable:
    // cinta sky en el top, border slate-200, shadow-md, rounded-2xl.
    <View
      className="bg-white rounded-2xl border border-slate-200 border-t-[5px] border-t-rose-500 shadow-md overflow-hidden"
      style={{ elevation: 3 }}
    >
      {/* ------------------------------------------------------
          HEADER DE COLUMNAS
          ------------------------------------------------------
          4 columnas: FECHA (flex-1) + ENTRADA (w-20) +
          SALIDA (w-20) + ESTADO (w-24). Las 3 últimas son
          de ancho fijo para que las horas y los pills
          calcen en columnas consistentes.
          ------------------------------------------------------ */}
      <View className="flex-row items-center px-5 py-3 bg-slate-50">
        <Text className="flex-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Fecha
        </Text>
        <Text className="w-20 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Entrada
        </Text>
        <Text className="w-20 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Salida
        </Text>
        <Text className="w-24 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Estado
        </Text>
      </View>

      {/* ------------------------------------------------------
          FILAS DE REGISTROS
          ------------------------------------------------------ */}
      {history.map((record, index) => {
        // statusConfig con fallback a 'a_tiempo' (el más común).
        const statusConfig = STATUS_CONFIG[record.status] || STATUS_CONFIG.a_tiempo;

        return (
          <View
            key={record.id}
            className={clsx(
              'flex-row items-center px-5 py-3',
              index > 0 && 'border-t border-slate-100',
            )}
          >
            {/* Fecha (flex-1). text-sm font-semibold slate-900. */}
            <Text
              className="flex-1 text-sm font-semibold text-slate-900"
              numberOfLines={1}
            >
              {record.date}
            </Text>

            {/* Entrada y Salida (w-20 cada una, centradas).
                text-sm slate-700. */}
            <Text className="w-20 text-center text-sm text-slate-700">
              {record.entry}
            </Text>
            <Text className="w-20 text-center text-sm text-slate-700">
              {record.exit}
            </Text>

            {/* Estado: pill (w-24). px-2 py-1 + rounded-full +
                colores según status. */}
            <View className="w-24 items-center">
              <View
                className={clsx(
                  'px-2.5 py-1 rounded-full',
                  statusConfig.bg,
                )}
              >
                <Text
                  className={clsx(
                    'text-[10px] font-bold uppercase tracking-wider',
                    statusConfig.text,
                  )}
                >
                  {statusConfig.label}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default AttendanceHistoryTable;
