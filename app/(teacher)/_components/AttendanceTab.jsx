// =====================================================================
// app/(teacher)/_components/AttendanceTab.jsx
// ---------------------------------------------------------------------
// Tab "Asistencia" del Expediente del Alumno. Muestra el historial de
// sesiones filtrado por `selectedPeriod`:
//
//   - 'ALL'             → todas las sesiones (historial completo).
//   - 'T1' | 'T2' | 'T3' → solo sesiones del trimestre seleccionado.
//
// Contiene:
//   - Stats header: total / presentes / ausentes (de las sesiones
//                   filtradas).
//   - Lista cronológica de sesiones con status badge.
// =====================================================================

// React.
import React, { useMemo } from 'react';

// Primitivas RN.
import { View, Text } from 'react-native';

// Mapeo status → colores (bg pill + texto).
const STATUS_STYLES = {
  presente:          { bg: '#DCFCE7', fg: '#15803D', label: 'Presente' },
  ausente:           { bg: '#FEE2E2', fg: '#B91C1C', label: 'Falta' },
  retardo:           { bg: '#FEF3C7', fg: '#92400E', label: 'Retardo' },
  falta_justificada: { bg: '#DBEAFE', fg: '#1D4ED8', label: 'Fj. Justificada' },
};

const AttendanceTab = ({ file, selectedPeriod = 'T1' }) => {
  // Filtramos por periodo.
  //   - 'ALL' → todas las sesiones.
  //   - 'T1'/'T2'/'T3' → solo las del trimestre correspondiente.
  //   Fallback: si el backend no retorna un trimester válido (ej. "T?"),
  //   o si ningún registro matchea, mostramos todos los datos.
  const filteredSessions = useMemo(() => {
    const attendance = file.attendance || [];
    if (selectedPeriod === 'ALL') return attendance;
    const result = attendance.filter((s) => s.trimester === selectedPeriod);
    if (result.length > 0) return result;
    // Fallback: devolver todos si no hay match.
    return attendance;
  }, [file.attendance, selectedPeriod]);

  // Derivados: totales por status dentro de las sesiones filtradas.
  const total = filteredSessions.length;
  const count = filteredSessions.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    },
    { presente: 0, ausente: 0, retardo: 0, falta_justificada: 0 },
  );

  return (
    <View className="mx-4 mt-3">
      {/* ============================================================
          STATS HEADER (4 columnas: Presentes, Faltas, Retardos, Fj. Justificadas)
        */}
      <View
        className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 flex-row"
        style={{
          shadowColor: '#0F172A',
          shadowOpacity: 0.04,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}
      >
        {/* Presentes. */}
        <View className="flex-1 items-center">
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Presentes
          </Text>
          <Text
            className="mt-1"
            style={{ fontSize: 20, fontWeight: '800', color: '#15803D' }}
          >
            {count.presente}
          </Text>
        </View>

        <View className="w-px bg-slate-200" />

        {/* Faltas. */}
        <View className="flex-1 items-center">
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Faltas
          </Text>
          <Text
            className="mt-1"
            style={{ fontSize: 20, fontWeight: '800', color: '#B91C1C' }}
          >
            {count.ausente}
          </Text>
        </View>

        <View className="w-px bg-slate-200" />

        {/* Retardos. */}
        <View className="flex-1 items-center">
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Retardos
          </Text>
          <Text
            className="mt-1"
            style={{ fontSize: 20, fontWeight: '800', color: '#92400E' }}
          >
            {count.retardo}
          </Text>
        </View>

        <View className="w-px bg-slate-200" />

        {/* Fj. Justificadas. */}
        <View className="flex-1 items-center">
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Fj. Justif.
          </Text>
          <Text
            className="mt-1"
            style={{ fontSize: 20, fontWeight: '800', color: '#1D4ED8' }}
          >
            {count.falta_justificada}
          </Text>
        </View>
      </View>

      {/* ============================================================
          LISTA DE SESIONES
        */}
      {total === 0 ? (
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
            className="text-slate-500"
            style={{ fontSize: 13, fontWeight: '600' }}
          >
            {selectedPeriod === 'ALL'
              ? 'Sin sesiones registradas'
              : 'Sin sesiones registradas'}
          </Text>
          <Text
            className="text-slate-400 mt-1 text-center"
            style={{ fontSize: 11 }}
          >
            {selectedPeriod === 'ALL'
              ? 'El alumno aún no tiene sesiones registradas.'
              : 'El alumno aún no tiene sesiones registradas para este período.'}
          </Text>
        </View>
      ) : (
        filteredSessions.map((session, index) => {
          const style = STATUS_STYLES[session.status] || STATUS_STYLES.presente;
          return (
            <View
              key={`${session.date}-${index}`}
              className="bg-white rounded-xl p-3 mb-2 flex-row items-center border border-slate-100"
              style={{
                shadowColor: '#0F172A',
                shadowOpacity: 0.02,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
                elevation: 1,
              }}
            >
              {/* Date. */}
              <Text
                className="text-slate-700"
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  width: 64,
                }}
              >
                {session.date}
              </Text>

              {/* Spacer. */}
              <View className="flex-1" />

              {/* Trimester chip (solo cuando period === 'ALL'). */}
              {selectedPeriod === 'ALL' && session.trimester ? (
                <View
                  className="mr-2 px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#F1F5F9' }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '800',
                      color: '#475569',
                    }}
                  >
                    {session.trimester}
                  </Text>
                </View>
              ) : null}

              {/* Status pill. */}
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: style.bg }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: style.fg,
                  }}
                >
                  {style.label}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

export default AttendanceTab;