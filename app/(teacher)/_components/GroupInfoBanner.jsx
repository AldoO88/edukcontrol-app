// =====================================================================
// app/(teacher)/_components/GroupInfoBanner.jsx
// ---------------------------------------------------------------------
// Card informativa del grupo que aparece en el header del directorio
// y expediente de alumnos. Contiene:
//   - Título con grado + etiqueta (e.g. "1° OFIMÁTICA • TALLER TÉCNICO").
//   - Pill del periodo actual (e.g. "1er Trimestre").
//   - Subtexto con el total de alumnos inscritos.
//   - Borde izquierdo cyan como acento.
//
// Props:
//   - title:      string — grado + nombre del grupo.
//   - tagLabel:   string — tipo de materia (TALLER TÉCNICO, TUTORÍA…).
//   - period:     string — etiqueta del periodo (trimestre + ciclo).
//   - studentCount: number — total de alumnos.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN.
import { View, Text } from 'react-native';

const GroupInfoBanner = ({ title, tagLabel, period, studentCount }) => {
  // Divide el título en dos partes: grado (antes de "•") y tag (después).
  const [grade = title, tag = tagLabel] = title.includes('•')
    ? title.split('•').map((s) => s.trim())
    : [title, tagLabel];

  return (
    <View
      className="bg-white rounded-2xl px-4 py-3"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: '#0284C7',
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
      }}
    >
      {/* Título + tag del grupo. */}
      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: '#0F172A',
        }}
        numberOfLines={1}
      >
        {`${grade}${tag ? ` • ${tag}` : ''}`}
      </Text>

      {/* Pill del periodo. */}
      <View
        className="self-start mt-2 px-2.5 py-1 rounded-full"
        style={{ backgroundColor: '#E0F2FE' }}
      >
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#0284C7' }}>
          {period}
        </Text>
      </View>

      {/* Subtexto: total de alumnos. */}
      <Text
        className="mt-2"
        style={{ fontSize: 13, color: '#64748B' }}
      >
        {studentCount} Alumnos Inscritos
      </Text>
    </View>
  );
};

export default GroupInfoBanner;
