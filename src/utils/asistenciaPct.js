// =====================================================================
// asistenciaPct.js
// ---------------------------------------------------------------------
// FUENTE ÚNICA del indicador "% ASIST." de los dashboards de prefecto,
// director y trabajadora social.
//
// Problema que resuelve (UX reportado 2026-10-17): el card dividía
// `dayPresent / dayTotal` (presentes ÷ [presentes + faltas]) sin filtro
// de volumen. En un día lectivo normal eso ES la tasa real — el cron de
// las 07:30 marca "absent" a todos los que no llegaron, así que el
// denominador ≈ matrícula (ej. viernes: 392/451 ≈ 87%). Pero con pocos
// registros el resultado es engañoso:
//   - sábado con 9 taps biométricos → "100%" (9 de 448 alumnos);
//   - 07:10am, antes del cron → "100%" con los primeros 30 taps;
//   - día sin registros → "0%", que no es una tasa, es aritmética rara.
//
// REGLA: el % solo se publica si `dayTotal` alcanza el umbral
// MIN_PCT_DE_MATRICULA (50%) de `totalStudents`; si no → "—".
// Cualquier día lectivo procesado por el cron supera el umbral de calle
// (el denominador queda ≥95% de la matrícula), así que el umbral oculta
// exactamente los casos raros (fin de semana, paro, cron caído, hora
// temprana) sin tocar el día normal.
//
// El backend NO cambia: `stats` ya trae dayPresent/dayAbsent/dayTotal/
// totalStudents en los 3 endpoints de dashboard. Esto es solo formato
// de presentación.
// =====================================================================

// Umbral: proporción mínima de la matrícula con registro del día para
// considerar "representativa" la tasa y publicar el %.
const MIN_PCT_DE_MATRICULA = 0.5;

// Recibe el objeto `stats` del dashboard y devuelve un string YA
// formateado para pintarlo directo en el <Text maxFontSizeMultiplier={1.3}> ("87%" o "—").
export const formatAsistPct = (stats) => {
  const dayPresent = stats?.dayPresent ?? 0;
  const dayTotal = stats?.dayTotal ?? 0;
  const totalStudents = stats?.totalStudents ?? 0;

  // Sin registros del día (domingo, día no lectivo, paro, cron caído):
  // no hay tasa que calcular. Antes esto mostraba "0%" falso.
  if (dayTotal <= 0) return "—";

  // Regla principal: pocos registros vs matrícula → sin % (evita el
  // "100%" de 9 alumnos sobre 448). Defensivo: si no hay matrícula
  // conocida (totalStudents faltante/0) se aplica la tasa cruda como
  // antes, para no regresar comportamiento a ciegas.
  if (totalStudents > 0 && dayTotal < totalStudents * MIN_PCT_DE_MATRICULA) {
    return "—";
  }

  return `${Math.round((dayPresent / dayTotal) * 100)}%`;
};
