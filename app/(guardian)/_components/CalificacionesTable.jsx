// =====================================================================
// app/(guardian)/_components/CalificacionesTable.jsx
// ---------------------------------------------------------------------
// Tabla de calificaciones del alumno para la pantalla
// "Calificaciones". Lista vertical de materias con sus notas por
// trimestre (T1, T2, T3) + fila destacada de promedio.
//
// Mismo lenguaje visual que el resto del proyecto:
//   - bg-white rounded-2xl + border-t sky-500 (cinta de marca)
//   - shadow-md + elevation 3: sombra prominente
//   - Filas separadas con border-t border-slate-100
//   - Iconos en cuadrado con color por materia (cíclico)
//   - Fila "Promedio" con bg-sky-50 + texto sky-600
//
// Props:
//   - subjects: array de { id, name, icon?, t1, t2, t3 } donde
//               t1/t2/t3 son number|null. null se renderiza como "—".
//   - averageByPeriod: { t1, t2, t3 } con el promedio del
//                      alumno por periodo. Misma convención.
//   - periods: array de { period, name } para headers dinámicos.
//              Ej: [{ period: 1, name: "Trimestre 1" }].
//              Si no se provee, se usan T1/T2/T3 por defecto.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text.
import { View, Text } from 'react-native';

// clsx.
import { clsx } from 'clsx';

// ---------------------------------------------------------------------
// SUBJECT_COLOR_PALETTE
// ---------------------------------------------------------------------
// Paleta de colores para las materias. Cada materia recibe un color
// distinto según su posición en la lista (cíclico). El color se
// aplica al fondo del ícono y al color del ícono Lucide.
// ---------------------------------------------------------------------
const SUBJECT_COLOR_PALETTE = [
  { bg: 'bg-sky-100',    iconColor: '#0369a1' },
  { bg: 'bg-rose-100',   iconColor: '#be123c' },
  { bg: 'bg-emerald-100', iconColor: '#047857' },
  { bg: 'bg-amber-100',  iconColor: '#b45309' },
  { bg: 'bg-purple-100', iconColor: '#7c3aed' },
  { bg: 'bg-cyan-100',   iconColor: '#0e7490' },
  { bg: 'bg-indigo-100', iconColor: '#4338ca' },
  { bg: 'bg-teal-100',   iconColor: '#0f766e' },
];

// ---------------------------------------------------------------------
// DEFAULT_PERIOD_LABELS
// ---------------------------------------------------------------------
// Labels por defecto para los periodos (T1, T2, T3). Se usan
// cuando NO se provee el prop `periods` (backward compatibility).
// ---------------------------------------------------------------------
const DEFAULT_PERIOD_LABELS = ['T1', 'T2', 'T3'];

// ---------------------------------------------------------------------
// PERIOD_KEYS
// ---------------------------------------------------------------------
// Keys de las notas en el objeto de subject. Orden consistente
// con los labels por defecto.
// ---------------------------------------------------------------------
const PERIOD_KEYS = ['t1', 't2', 't3'];

// ---------------------------------------------------------------------
// renderGrade(value)
// ---------------------------------------------------------------------
// Helper: dado un valor numérico (o null), devuelve el string a
// mostrar. Entero sin decimal (10, 9), decimal con 1 (8.8, 9.5).
// null → "—".
const renderGrade = (value) => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
  return '—';
};

// ---------------------------------------------------------------------
// GradesRow
// ---------------------------------------------------------------------
// Sub-componente interno: renderiza la fila con las notas de un
// subject. Acepta un array de grades (longitud dinámica según
// periodos). La prop `accent` cambia el color del texto
// (slate-900 para notas individuales, sky-600 para el promedio).
const GradesRow = ({ grades, accent = false }) => {
  return (
    <View className="flex-row">
      {grades.map((grade, i) => (
        <Text
          key={i}
          className={clsx(
            'w-12 text-center text-sm font-bold',
            typeof grade === 'number' && !Number.isNaN(grade)
              ? accent
                ? 'text-sky-600'
                : 'text-slate-900'
              : 'text-slate-300 font-normal',
          )}
        >
          {renderGrade(grade)}
        </Text>
      ))}
    </View>
  );
};

// ---------------------------------------------------------------------
// CalificacionesTable
// ---------------------------------------------------------------------
const CalificacionesTable = ({
  subjects = [],
  averageByPeriod = {},
  periods = [],
}) => {
  // Determinar los labels de las columnas. Si `periods` tiene
  // datos, usamos sus names; si no, fallback a T1/T2/T3.
  const columnLabels = periods.length > 0
    ? periods.map((p) => {
        // Extraer "T1", "T2", etc. del name ("Trimestre 1" → "T1").
        // Si el name ya es corto (<=3 chars), usarlo directamente.
        if (p.name && p.name.length <= 3) return p.name;
        const match = p.name?.match(/(\d+)/);
        return match ? `T${match[1]}` : `P${p.period}`;
      })
    : DEFAULT_PERIOD_LABELS;

  // Determinar las keys de las notas según la cantidad de periodos.
  const periodKeys = periods.length > 0
    ? periods.map((_, i) => PERIOD_KEYS[i] || `t${i + 1}`)
    : PERIOD_KEYS;

  return (
    // Contenedor de la tabla.
    <View
      className="bg-white rounded-2xl border border-slate-200 border-t-[5px] border-t-sky-500 shadow-md overflow-hidden"
      style={{ elevation: 3 }}
    >
      {/* ------------------------------------------------------
          HEADER DE COLUMNAS
          ------------------------------------------------------ */}
      <View className="flex-row items-center px-5 py-3 bg-slate-50">
        <Text className="flex-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Materia
        </Text>
        <View className="flex-row">
          {columnLabels.map((label, i) => (
            <Text
              key={i}
              className="w-12 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              {label}
            </Text>
          ))}
        </View>
      </View>

      {/* ------------------------------------------------------
          FILAS DE MATERIAS
          ------------------------------------------------------ */}
      {subjects.map((subject, index) => {
        const Icon = subject.icon;
        const color = SUBJECT_COLOR_PALETTE[index % SUBJECT_COLOR_PALETTE.length];
        return (
          <View
            key={subject.id}
            className={clsx(
              'flex-row items-center px-5 py-3.5',
              index > 0 && 'border-t border-slate-100',
            )}
          >
            <View className="flex-1 flex-row items-center">
              <View className={clsx('w-9 h-9 rounded-xl items-center justify-center mr-3', color.bg)}>
                {Icon && <Icon size={18} color={color.iconColor} strokeWidth={2.25} />}
              </View>
              <Text
                className="text-sm font-semibold text-slate-900 flex-1"
                numberOfLines={1}
              >
                {subject.name}
              </Text>
            </View>
            <GradesRow
              grades={periodKeys.map((k) => subject[k] ?? null)}
            />
          </View>
        );
      })}

      {/* ------------------------------------------------------
          FILA DE PROMEDIO (destacada)
          ------------------------------------------------------ */}
      <View className="flex-row items-center px-5 py-4 bg-sky-50 border-t border-slate-200">
        <View className="flex-1 flex-row items-center">
          <View className="w-9 h-9 rounded-xl bg-white items-center justify-center mr-3">
            <Text className="text-base font-bold text-sky-700">Σ</Text>
          </View>
          <Text className="text-sm font-bold text-slate-900 flex-1">
            Promedio
          </Text>
        </View>
        <GradesRow
          grades={periodKeys.map((k) => averageByPeriod[k] ?? null)}
          accent
        />
      </View>
    </View>
  );
};

export default CalificacionesTable;
