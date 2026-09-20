// =====================================================================
// app/(guardian)/_components/AttendanceHistoryTable.jsx
// ---------------------------------------------------------------------
// Tabla de entradas y salidas recientes del alumno para la pantalla
// "Asistencia". Similar a CalificacionesTable: header + filas.
//
// Shape:
//
//   ┌──────────┬────────┬────────┐
//   │ FECHA    │ENTRADA │ SALIDA │  ← header slate-50
//   ├──────────┼────────┼────────┤
//   │ Oct 24, 2026 │07:45 AM│02:15 PM│
//   │ Oct 23   │07:50 AM│02:19 PM│
//   │ ...                          │
//   └──────────┴────────┴────────┘
//
// Props:
//   - history: array de {
//       id,
//       date: string (formato corto: "Oct 24"),
//       entry: string (hora: "07:45 AM"),
//       exit:  string (hora: "02:15 PM"),
//     }
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text.
import { View, Text } from 'react-native';

// clsx.
import { clsx } from 'clsx';

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
          3 columnas: FECHA (flex-1) + ENTRADA (w-20) +
          SALIDA (w-20). Las 2 últimas son de ancho fijo
          para que las horas calcen en columnas consistentes.
          ------------------------------------------------------ */}
      <View className="flex-row items-center px-5 py-3 bg-slate-50">
        <Text className="flex-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Fecha
        </Text>
        <Text className="w-24 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Entrada
        </Text>
        <Text className="w-24 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Salida
        </Text>
      </View>

      {/* ------------------------------------------------------
          FILAS DE REGISTROS
          ------------------------------------------------------ */}
      {history.map((record, index) => (
        <View
          key={record.id}
          className={clsx(
            'flex-row items-center px-5 py-3',
            index > 0 && 'border-t border-slate-100',
          )}
        >
          <Text
            className="flex-1 text-sm font-semibold text-slate-900"
            numberOfLines={1}
          >
            {record.date}
          </Text>
          <Text className="w-24 text-center text-sm text-slate-700">
            {record.entry}
          </Text>
          <Text className="w-24 text-center text-sm text-slate-700">
            {record.exit}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default AttendanceHistoryTable;
