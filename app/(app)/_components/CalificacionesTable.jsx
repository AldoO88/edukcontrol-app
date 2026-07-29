// =====================================================================
// app/(app)/_components/CalificacionesTable.jsx
// ---------------------------------------------------------------------
// Tabla de calificaciones del alumno para la pantalla
// "Calificaciones". Lista vertical de materias con sus notas por
// trimestre (T1, T2, T3) + fila destacada de promedio.
//
// Mismo lenguaje visual que el resto del proyecto:
//   - bg-white rounded-2xl + border-t sky-500 (cinta de marca)
//   - shadow-md + elevation 3: sombra prominente
//   - Filas separadas con border-t border-slate-100
//   - Iconos en cuadrado sky-100 (28px)
//   - Fila "Promedio" con bg-sky-50 + texto sky-600
//
// Props:
//   - subjects: array de { id, name, icon, t1, t2, t3 } donde
//               t1/t2/t3 son number|null. null se renderiza como "—".
//   - averageByTrimester: { t1, t2, t3 } con el promedio del
//                         alumno por trimestre. Misma convención.
//
// Cambia respecto a la versión anterior (que mostraba solo 1
// columna): ahora se renderizan 3 columnas (T1, T2, T3) con
// ancho fijo (w-12) para que las notas calcen en columnas
// consistentes entre filas.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text.
import { View, Text } from 'react-native';

// clsx.
import { clsx } from 'clsx';

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
// Sub-componente interno: renderiza la fila con las 3 notas
// (T1, T2, T3) de un subject. Se usa tanto en las filas de
// materia como en la fila de promedio. La prop `accent` cambia
// el color del texto (slate-900 para notas individuales,
// sky-600 para el promedio).
const GradesRow = ({ grades, accent = false }) => {
  return (
    <View className="flex-row">
      {grades.map((grade, i) => (
        <Text
          key={i}
          className={clsx(
            'w-12 text-center text-sm font-bold',
            // Si hay nota y accent=true → sky-600 (promedio).
            // Si hay nota y accent=false → slate-900 (materia).
            // Si no hay nota → "—" slate-300 + font-normal.
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
const CalificacionesTable = ({ subjects = [], averageByTrimester = {} }) => {
  return (
    // Contenedor de la tabla.
    // - bg-white: fondo blanco sobre el slate-50 de la pantalla.
    // - rounded-2xl: bordes consistentes con el resto de cards.
    // - border-t-[5px] border-t-sky-500: CINTA de color sky-500
    //   en el borde superior (5px). Es el "ribbon" que identifica
    //   visualmente a esta card.
    // - border border-slate-200: contorno sutil slate-200 en
    //   los otros 3 lados.
    // - shadow-md + elevation 3: sombra prominente.
    // - overflow-hidden: necesario para que el borderRadius
    //   respete los hijos internos.
    <View
      className="bg-white rounded-2xl border border-slate-200 border-t-[5px] border-t-sky-500 shadow-md overflow-hidden"
      style={{ elevation: 3 }}
    >
      {/* ------------------------------------------------------
          HEADER DE COLUMNAS
          ------------------------------------------------------
          MATERIA a la izquierda (flex-1) + 3 columnas T1/T2/T3
          (w-12 cada una, centradas) a la derecha. bg-slate-50
          + border-b para separar del cuerpo.
          ------------------------------------------------------ */}
      <View className="flex-row items-center px-5 py-3 bg-slate-50">
        <Text className="flex-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Materia
        </Text>
        <View className="flex-row">
          <Text className="w-12 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
            T1
          </Text>
          <Text className="w-12 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
            T2
          </Text>
          <Text className="w-12 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
            T3
          </Text>
        </View>
      </View>

      {/* ------------------------------------------------------
          FILAS DE MATERIAS
          ------------------------------------------------------
          flex-row con:
            - Icono en cuadrado sky-100 (w-9 h-9)
            - Nombre de la materia (flex-1)
            - 3 notas a la derecha (GradesRow)
          ------------------------------------------------------ */}
      {subjects.map((subject, index) => {
        const Icon = subject.icon;
        return (
          <View
            key={subject.id}
            className={clsx(
              'flex-row items-center px-5 py-3.5',
              index > 0 && 'border-t border-slate-100',
            )}
          >
            <View className="flex-1 flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-sky-100 items-center justify-center mr-3">
                {Icon && <Icon size={18} color="#0369a1" strokeWidth={2.25} />}
              </View>
              <Text
                className="text-sm font-semibold text-slate-900 flex-1"
                numberOfLines={1}
              >
                {subject.name}
              </Text>
            </View>
            <GradesRow
              grades={[subject.t1, subject.t2, subject.t3]}
            />
          </View>
        );
      })}

      {/* ------------------------------------------------------
          FILA DE PROMEDIO (destacada)
          ------------------------------------------------------
          bg-sky-50 + icono Σ en cuadrado blanco. Las 3 notas
          (T1, T2, T3) van en sky-600 para reforzar la
          jerarquía "resumen vs detalle". border-t slate-200
          para marcar el corte.
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
          grades={[
            averageByTrimester.t1,
            averageByTrimester.t2,
            averageByTrimester.t3,
          ]}
          accent
        />
      </View>
    </View>
  );
};

export default CalificacionesTable;
