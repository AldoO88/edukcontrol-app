// =====================================================================
// app/(teacher)/_components/EvaluationTab.jsx
// ---------------------------------------------------------------------
// Tab "Evaluación" del Expediente del Alumno.
//
// Renderiza según `selectedPeriod`:
//   - 'ALL'  → Resumen con promedio por trimestre (T1, T2, T3).
//   - 'T1'|'T2'|'T3' → Desglose de evaluaciones del trimestre.
//
// Estructura del backend (grades.trimesters.T1):
//   {
//     evaluations: { [abbr]: { weight, score, type } },
//     average: number,
//     averagingRule: string
//   }
// =====================================================================

// React.
import React from 'react';

// Primitivas RN.
import { View, Text } from 'react-native';

// clsx.
import { clsx } from 'clsx';

const TRIMESTERS = ['T1', 'T2', 'T3'];

const EvaluationTab = ({ file, selectedPeriod = 'T1', evalNameMap = {} }) => {
  // -----------------------------------------------------------------
  // MODO 'ALL': resumen con promedio por trimestre.
  // -----------------------------------------------------------------
  if (selectedPeriod === 'ALL') {
    return (
      <View className="mx-4 mt-3">
        <Text
          className="text-slate-500 mb-2"
          style={{
            fontSize: 11,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Resumen por Trimestre
        </Text>
        {TRIMESTERS.map((t) => {
          const trimesterData = file.grades?.trimesters?.[t];
          const avg = trimesterData?.average ?? null;
          const isFailing = avg !== null && avg < 6.0;
          return (
            <View
              key={t}
              className={clsx(
                'bg-white rounded-2xl p-4 mb-2 border border-slate-100',
                'flex-row items-center',
              )}
              style={{
                shadowColor: '#0F172A',
                shadowOpacity: 0.04,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 1 },
                elevation: 1,
              }}
            >
              {/* Left: pill trimestre. */}
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: '#F1F5F9' }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: '#475569',
                    letterSpacing: 0.3,
                  }}
                >
                  {t}
                </Text>
              </View>
              <Text
                className="flex-1 ml-3 text-slate-700"
                style={{ fontSize: 12, fontWeight: '600' }}
              >
                Promedio
              </Text>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: '800',
                  color: avg === null
                    ? '#94A3B8'
                    : isFailing
                    ? '#DC2626'
                    : '#0284C7',
                }}
              >
                {avg !== null ? avg.toFixed(1) : '—'}
              </Text>
            </View>
          );
        })}
      </View>
    );
  }

  // -----------------------------------------------------------------
  // MODO T1/T2/T3: desglose de evaluaciones del trimestre.
  // -----------------------------------------------------------------
  const trimesterData = file.grades?.trimesters?.[selectedPeriod];
  const evaluations = trimesterData?.evaluations || {};

  if (!trimesterData || Object.keys(evaluations).length === 0) {
    return (
      <View className="mx-4 mt-3">
        <View
          className="bg-white rounded-2xl p-8 items-center border border-slate-100"
          style={{
            shadowColor: '#0F172A',
            shadowOpacity: 0.04,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        >
          <Text
            className="text-slate-500 text-center"
            style={{ fontSize: 13, fontWeight: '600' }}
          >
            {`Sin datos para ${selectedPeriod}`}
          </Text>
          <Text
            className="text-slate-400 text-center mt-1"
            style={{ fontSize: 11 }}
          >
            El trimestre aún no ha iniciado.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mx-4 mt-3">
      {Object.entries(evaluations).map(([abbr, value]) => {
        const isFailing = Number(value.score) < 6.0;
        return (
          <View
            key={abbr}
            className={clsx(
              'bg-white rounded-2xl p-4 mb-2 border border-slate-100',
              'flex-row items-center',
            )}
            style={{
              shadowColor: '#0F172A',
              shadowOpacity: 0.04,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1,
            }}
          >
            {/* Left: nombre completo + badge. */}
            <View className="flex-1 mr-3">
              <Text
                className="text-slate-900"
                style={{ fontSize: 14, fontWeight: '700' }}
                numberOfLines={1}
              >
                {evalNameMap[abbr] || abbr}
              </Text>
              {value.type === 'extra' && (
                <View
                  className="self-start mt-1.5 px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#FEF3C7' }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '700',
                      color: '#92400E',
                    }}
                  >
                    Punto Extra
                  </Text>
                </View>
              )}
            </View>

            {/* Right: score, color por threshold. */}
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: isFailing ? '#DC2626' : '#0284C7',
              }}
            >
              {Number(value.score || 0).toFixed(1)}
            </Text>
          </View>
        );
      })}

      {/* Promedio del trimestre. */}
      {trimesterData.average != null && (
        <View
          className="bg-white rounded-2xl p-4 mt-2 flex-row items-center justify-between border border-slate-200"
          style={{
            shadowColor: '#0F172A',
            shadowOpacity: 0.04,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: '#0F172A',
            }}
          >
            Promedio del Trimestre
          </Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '800',
              color: trimesterData.average < 6.0 ? '#DC2626' : '#0284C7',
            }}
          >
            {trimesterData.average.toFixed(1)}
          </Text>
        </View>
      )}
    </View>
  );
};

export default EvaluationTab;
