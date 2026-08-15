// =====================================================================
// app/(teacher)/_components/GroupDiagnosticDashboard.jsx
// ---------------------------------------------------------------------
// Card de "Group Diagnostic Dashboard" de la pantalla Directorio y
// Expediente de Alumnos. Renderiza, dentro de un solo container
// blanco, el título del grupo + periodo + conteo de alumnos +
// tres métricas diagnósticas:
//
//   1. Promedio Grupal  → score (color cyan #0284C7).
//   2. En Riesgo        → # alumnos en riesgo (red #DC2626,
//                          fondo suave #FEE2E2).
//   3. Asistencia       → porcentaje grupal (verde #16A34A).
//
// Layout (de arriba a abajo):
//   ┌────────────────────────────────────────┐
//   │ 1° OFIMÁTICA    [TALLER TÉCNICO]       │  ← title + tag
//   │ 1er Trimestre              8 alumnos   │  ← periodo + count
//   │ ┌─────┬─────┬─────┐                     │
//   │ │Prom.│Riesg│Asist│                     │  ← 3 metrics
//   │ └─────┴─────┴─────┘                     │
//   └────────────────────────────────────────┘
//
// Props:
//   - title:        string — título del grupo (e.g. "1° OFIMÁTICA").
//   - tagLabel:     string — tag de la materia (e.g. "TALLER TÉCNICO").
//   - period:       string — periodo (e.g. "1er Trimestre").
//   - studentCount: number — total de alumnos inscritos.
//   - groupAverage: number — promedio del grupo (0.0 - 10.0).
//   - atRiskCount:  number — cantidad de alumnos en riesgo.
//   - attendance:   number — porcentaje de asistencia grupal (0-100).
// =====================================================================

// React.
import { Users } from 'lucide-react-native';
import React from 'react';

// Primitivas RN.
import { View, Text } from 'react-native';

const GroupDiagnosticDashboard = ({
  title,
  tagLabel,
  period,
  studentCount,
  groupAverage,
  atRiskCount,
  attendance,
}) => {
  // Parseo del título: separamos grado y tag (e.g. "1° OFIMÁTICA •
  // TALLER TÉCNICO" → ["1° OFIMÁTICA", "TALLER TÉCNICO"]). Si NO
  // viene con "•", usamos tagLabel como tag derecho.
  const [grade, tag] = title?.includes('•')
    ? title.split('•').map((s) => s.trim())
    : [title, tagLabel];

  return (
    <View
      className="bg-white rounded-2xl px-4 py-3 border border-[#F1F5F9]"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: '#0284C7',
        // Sombra estándar slate-900 multiplataforma.
        shadowColor: '#0F172A',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      {/* ============================================================
          HEADER (título + tag)
          ============================================================ */}
      <View className="flex-row items-center justify-between">
        <Text
          className="text-base font-bold text-[#0F172A] flex-1"
          numberOfLines={1}
        >
          {grade}
        </Text>
        {tag ? (
          <View
            className="flex-row items-center px-2 py-1 rounded-lg ml-2"
            style={{ backgroundColor: '#E0F2FE' }}
          >
            <Text
              className="text-[11px] font-bold"
              style={{ color: '#0284C7' }}
            >
              {tag}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ============================================================
          SUBTITLE ROW: periodo (izq) + alumnos (der)
          ============================================================
          Misma fila, separados a los extremos con space-between.
          ============================================================ */}
      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-[13px] text-[#64748B]">
          {period}
        </Text>
     
        <View className="flex-row items-center px-4">
          <Users size={15} color="#64748B" strokeWidth={2} /> 
          <Text className="ml-2 text-[13px] text-[#64748B]">
          {`${studentCount} ${studentCount === 1 ? 'alumno' : 'alumnos'}`}
          </Text>
        </View>
      </View>

      {/* ============================================================
          ROW DE 3 MÉTRICAS (horizontal, space-between)
          ============================================================
          flexDirection: 'row' + justifyContent: 'space-between' →
          las 3 columnas se distribuyen con espacio entre ellas,
          siempre en UNA SOLA línea horizontal (nunca vertical).
          backgroundColor: #F8FAFC (spec), borderRadius: 14,
          padding: 12.
          ============================================================ */}
      <View
        className="flex-row mt-2"
        style={{
          backgroundColor: '#F8FAFC',
          borderRadius: 14,
          paddingVertical: 8,
          paddingHorizontal: 12,
          // Distribución explícita: evita que cualquier columna
          // salte a su propia línea (problema de "vertical clutter").
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* 1) PROMEDIO GRUPAL. */}
        <View className="items-center">
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Promedio
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '800',
              color: '#0284C7',
              marginTop: 4,
            }}
          >
            {Number(groupAverage || 0).toFixed(1)}
          </Text>
        </View>

        {/* 2) EN RIESGO. */}
        <View className="items-center">
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            En Riesgo
          </Text>
          <View
            className="flex-row items-center px-2 py-0.5 rounded-full mt-1"
            style={{ backgroundColor: '#FEE2E2' }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '800',
                color: '#DC2626',
              }}
            >
              {atRiskCount}
            </Text>
            <Text
              className="ml-1"
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#DC2626',
              }}
            >
              {atRiskCount === 1 ? 'Alumno' : 'Alumnos'}
            </Text>
          </View>
        </View>

        {/* 3) ASISTENCIA. */}
        <View className="items-center">
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Asistencia
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '800',
              color: '#16A34A',
              marginTop: 4,
            }}
          >
            {`${Math.round(Number(attendance || 0))}%`}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default GroupDiagnosticDashboard;
