// =====================================================================
// app/(teacher)/_components/StudentAccordionRow.jsx
// ---------------------------------------------------------------------
// Fila con Accordion del directorio de alumnos. Tiene dos estados:
//   - COLLAPSED (default): una sola fila compacta con avatar + nombre
//     + NL/Ctrl + score badge + chevron-down.
//   - EXPANDED: bloque de detalles con (1) métricas 3-col,
//     (2) tutor contact bar, (3) action buttons. NO repite avatar
//     ni nombre — esos ya están en el row header.
//
// Reglas de color (basadas en el PROMEDIO, no en student.status):
//   - average >= 6.0  → PASSING.  Borde #22C55E, badge verde
//                        (#DCFCE7 / #15803D).
//   - average <  6.0  → AT RIESGO.  Borde #EF4444, badge rojo
//                        (#FEE2E2 / #DC2626).
//
// Props:
//   - student:      Student (shape de src/types/student.js).
//   - isExpanded:   boolean — si el accordion está abierto.
//   - onToggle:     fn() — abrir/cerrar el accordion de este row.
//   - onCitatorio:  fn() — handler botón "Citatorio".
//   - onAviso:      fn() — handler botón "Aviso".
//   - onExpediente: fn() — handler botón "Ver Expediente".
//   - onMessageTutor: fn() — handler chat del tutor.
//   - onNoteTutor:  fn() — handler nota del tutor.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN.
import { View, Text, Image, Pressable } from 'react-native';

// Iconos Lucide.
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  User,
  Phone,
} from 'lucide-react-native';

// Helpers de texto.
import { getInitials } from '../../../src/utils/textHelpers';

// =====================================================================
// SUBCOMPONENTES LOCALES
// =====================================================================

// Avatar circular del alumno: photo si existe, si no iniciales en
// fondo gris.
const Avatar = ({ student, size = 40 }) => {
  if (student.photoUrl) {
    return (
      <Image
        source={{ uri: student.photoUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        accessibilityLabel={`Foto de ${student.name}`}
      />
    );
  }
  return (
    <View
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#E2E8F0',
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>
        {getInitials(student.name)}
      </Text>
    </View>
  );
};

// Score badge compacto: color según el promedio del alumno.
//   - 8.0 - 10.0 → verde  (#DCFCE7 / #15803D).
//   - 6.0 - 7.9  → ámbar  (#FEF3C7 / #92400E).
//   - 5.0 - 5.9  → rojo   (#FEE2E2 / #DC2626).
//   - < 5.0      → rojo   (#FEE2E2 / #DC2626).
const ScoreBadge = ({ score }) => {
  const numeric = Number(score || 0);
  let bgColor, textColor;
  if (numeric >= 8.0) {
    bgColor = '#DCFCE7';
    textColor = '#15803D';
  } else if (numeric >= 6.0) {
    bgColor = '#FEF3C7';
    textColor = '#92400E';
  } else {
    bgColor = '#FEE2E2';
    textColor = '#DC2626';
  }
  return (
    <View
      className="px-2 py-1 rounded-full"
      style={{ backgroundColor: bgColor }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '800',
          color: textColor,
        }}
      >
        {numeric.toFixed(1)}
      </Text>
    </View>
  );
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
const StudentAccordionRow = ({
  student,
  isExpanded,
  onToggle,
  onCitatorio,
  onAviso,
  onExpediente,
  onMessageTutor,
  onNoteTutor,
}) => {
  // Métricas del estudiante (con defaults seguros).
  const average = Number(student.metrics?.average || 0);
  const attendance = Number(student.metrics?.attendance || 0);
  const citatorios = Number(student.metrics?.citatorios || 0);

  // Regla de color por promedio → controla BORDE + BADGE del row.
  //   average >= 8.0  → verde (excelente).
  //   average >= 6.0  → ámbar (aprobado).
  //   average <  6.0  → rojo (en riesgo).
  let borderColor, averageColor;
  if (average >= 8.0) {
    borderColor = '#22C55E';
    averageColor = '#16A34A';
  } else if (average >= 6.0) {
    borderColor = '#D97706';
    averageColor = '#D97706';
  } else {
    borderColor = '#EF4444';
    averageColor = '#DC2626';
  }
  const attendanceColor = attendance >= 85 ? '#16A34A' : '#D97706';
  const citatoriosColor = citatorios > 0 ? '#DC2626' : '#16A34A';

  // Nombre completo con N.L. → "1. Acosta Rodríguez, Mateo".
  const fullName = `${student.listNumber}. ${student.name}`;

  return (
    <View
      className="bg-white"
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderLeftWidth: 4,
        borderLeftColor: borderColor,
        marginBottom: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        shadowColor: '#0F172A',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}
    >
      {/* ============================================================
          ROW HEADER (siempre visible, colapsado o expandido)
          ============================================================ */}
      <View className="flex-row items-center">
        {/* Avatar. */}
        <Avatar student={student} size={40} />

        {/* Stack: nombre + subtext. */}
        <View className="flex-1 ml-3">
          <Text
            numberOfLines={1}
            style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}
          >
            {fullName}
          </Text>
          <Text
            className="mt-0.5"
            style={{ fontSize: 11, color: '#64748B' }}
          >
            {`No. Control: ${student.controlNumber}`}
          </Text>
        </View>

        {/* Acciones derechas: score badge (solo colapsado). */}
        {!isExpanded && (
          <View className="flex-row items-center">
            <ScoreBadge score={average} />
          </View>
        )}

        {/* Chevron (toggle accordion). */}
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? 'Cerrar detalles' : 'Ver detalles'}
          accessibilityState={{ expanded: isExpanded }}
          className="items-center justify-center ml-1"
          hitSlop={8}
        >
          {isExpanded ? (
            <ChevronUp size={22} color="#64748B" strokeWidth={2.25} />
          ) : (
            <ChevronDown size={22} color="#64748B" strokeWidth={2.25} />
          )}
        </Pressable>
      </View>

      {/* ============================================================
          EXPANDED BLOCK
          ============================================================
          Solo visible cuando isExpanded=true. Contiene SOLO:
            1. 3-column metrics box (#F8FAFC).
            2. Tutor contact bar (#F1F5F9) — icono User en lugar de
               iniciales del alumno.
            3. Action buttons (Citatorio outline + Ver Expediente solid).
          NO repite avatar ni nombre del alumno (ya están en el row
          header de arriba).
          ============================================================ */}
      {isExpanded && (
        <View>
          {/* ============================================================
              3-COLUMN METRICS BOX
              ============================================================ */}
          <View
            className="flex-row mt-3"
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 10,
              padding: 10,
            }}
          >
            {/* Promedio. */}
            <View className="flex-1 items-center">
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '700',
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
              >
                Promedio
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: averageColor,
                  marginTop: 2,
                }}
              >
                {average.toFixed(1)}
              </Text>
            </View>

            {/* Asistencia. */}
            <View className="flex-1 items-center">
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '700',
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
              >
                Asistencia
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: attendanceColor,
                  marginTop: 2,
                }}
              >
                {`${Math.round(attendance)}%`}
              </Text>
            </View>

            {/* Citas. */}
            <View className="flex-1 items-center">
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '700',
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
              >
                Citas
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: citatoriosColor,
                  marginTop: 2,
                }}
              >
                {citatorios}
              </Text>
            </View>
          </View>

          {/* ============================================================
              TUTOR CONTACT BAR (pill gris + User icon + nombre + teléfono)
              ============================================================
              Muestra nombre completo del tutor y teléfono con icono.
              Si no hay tutor, muestra "Sin Padre/Tutor asignado".
              ============================================================ */}
          <View
            className="flex-row items-center mt-3"
            style={{
              backgroundColor: '#F1F5F9',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <View
              className="items-center justify-center"
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: '#FFFFFF',
              }}
            >
              <User size={14} color="#64748B" strokeWidth={2.25} />
            </View>

            {student.tutor ? (
              <>
                <Text
                  className="flex-1 ml-2"
                  style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}
                  numberOfLines={1}
                >
                  {student.tutor.name}
                </Text>
                {student.tutor.phone ? (
                  <View className="flex-row items-center">
                    <Phone size={12} color="#64748B" strokeWidth={2.25} />
                    <Text
                      style={{ fontSize: 12, color: '#334155', marginLeft: 4 }}
                    >
                      {student.tutor.phone}
                    </Text>
                  </View>
                ) : null}
              </>
            ) : (
              <Text
                className="flex-1 ml-2"
                style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic' }}
              >
                Sin Padre/Tutor asignado
              </Text>
            )}
          </View>

          {/* ============================================================
              ACTION BUTTONS
              ============================================================
              Fila 1: Citatorio (outline rojo) + Aviso (outline amarillo).
              Fila 2: Ver Expediente (solid azul, full width).
              ============================================================ */}
          <View className="flex-row mt-3" style={{ gap: 8 }}>
            <Pressable
              onPress={onCitatorio}
              accessibilityRole="button"
              accessibilityLabel={`Generar citatorio para ${student.name}`}
              className="flex-1 flex-row items-center justify-center"
              style={{
                borderWidth: 1.5,
                borderColor: '#DC2626',
                borderRadius: 12,
                paddingVertical: 9,
                gap: 6,
              }}
            >
              <AlertCircle size={14} color="#DC2626" strokeWidth={2.25} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: '#DC2626',
                }}
              >
                Citatorio
              </Text>
            </Pressable>

            <Pressable
              onPress={onAviso}
              accessibilityRole="button"
              accessibilityLabel={`Enviar aviso a tutor de ${student.name}`}
              className="flex-1 flex-row items-center justify-center"
              style={{
                borderWidth: 1.5,
                borderColor: '#16A34A',
                borderRadius: 12,
                paddingVertical: 9,
                gap: 6,
              }}
            >
              <AlertCircle size={14} color="#16A34A" strokeWidth={2.25} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: '#16A34A',
                }}
              >
                Aviso
              </Text>
            </Pressable>
          </View>

          <View className="mt-2">
            <Pressable
              onPress={onExpediente}
              accessibilityRole="button"
              accessibilityLabel={`Ver expediente de ${student.name}`}
              className="flex-row items-center justify-center"
              style={{
                backgroundColor: '#0284C7',
                borderRadius: 12,
                paddingVertical: 9,
                gap: 6,
              }}
            >
              <FileText size={14} color="#ffffff" strokeWidth={2.25} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: '#ffffff',
                }}
              >
                Ver Expediente
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

export default StudentAccordionRow;
