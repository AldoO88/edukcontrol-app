// =====================================================================
// app/(teacher)/_components/StudentAccordionRow.jsx
// ---------------------------------------------------------------------
// Fila con Accordion del directorio de alumnos. Tiene dos estados:
//   - COLLAPSED (default): una sola fila compacta con avatar + nombre
//     + NL/Ctrl + score badge + chat + chevron-down.
//   - EXPANDED: bloque de detalles con (1) métricas 3-col,
//     (2) tutor contact bar, (3) action buttons. NO repite avatar
//     ni nombre — esos ya están en el row header.
//
// Reglas de color (basadas en el PROMEDIO, no en student.status):
//   - average >= 6.0  → PASSING.  Borde #22C55E, badge verde
//                        (#DCFCE7 / #15803D).
//   - average <  6.0  → AT RISK.  Borde #EF4444, badge rojo
//                        (#FEE2E2 / #DC2626).
//
// Props:
//   - student:      Student (shape de src/types/student.js).
//   - isExpanded:   boolean — si el accordion está abierto.
//   - onToggle:     fn() — abrir/cerrar el accordion de este row.
//   - onCitatorio:  fn() — handler botón "Citatorio".
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
  MessageCircle,
  PencilLine,
  AlertCircle,
  FileText,
  User, // Icono genérico de tutor en la contact bar.
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
//   - passing (>= 6.0) → fondo #DCFCE7, texto #15803D.
//   - at_risk (< 6.0)  → fondo #FEE2E2, texto #DC2626.
const ScoreBadge = ({ score }) => {
  const numeric = Number(score || 0);
  const isPassing = numeric >= 6.0;
  return (
    <View
      className="px-2 py-1 rounded-full"
      style={{ backgroundColor: isPassing ? '#DCFCE7' : '#FEE2E2' }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '800',
          color: isPassing ? '#15803D' : '#DC2626',
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
  onExpediente,
  onMessageTutor,
  onNoteTutor,
}) => {
  // Métricas del estudiante (con defaults seguros).
  const average = Number(student.metrics?.average || 0);
  const attendance = Number(student.metrics?.attendance || 0);
  const citatorios = Number(student.metrics?.citatorios || 0);

  // Regla estricta de aprobación → controla BORDE + BADGE del row.
  //   average >= 6.0  → passing (verde).
  //   average <  6.0  → at_risk (rojo).
  const isPassing = average >= 6.0;
  const borderColor = isPassing ? '#22C55E' : '#EF4444';

  // Colores semánticos por métrica en el bloque expandido.
  const averageColor = isPassing ? '#16A34A' : '#DC2626';
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

        {/* Acciones derechas: score badge (solo colapsado) + chat + chevron. */}
        {!isExpanded && (
          <View className="flex-row items-center">
            <ScoreBadge score={average} />

            <Pressable
              onPress={onMessageTutor}
              accessibilityRole="button"
              accessibilityLabel={`Mensaje al tutor de ${student.name}`}
              className="items-center justify-center ml-2"
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: '#E0F2FE',
              }}
              hitSlop={6}
            >
              <MessageCircle size={15} color="#0284C7" strokeWidth={2.25} />
            </Pressable>
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

            {/* Citatorios. */}
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
                Citatorios
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
              TUTOR CONTACT BAR (pill gris + User icon + chat + nota)
              ============================================================
              El avatar genérico del tutor es un icono <User /> de
              Lucide (equivalente a <Feather name="user" />) en lugar
              de las iniciales del alumno.
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

            <Text
              className="flex-1 ml-2"
              style={{ fontSize: 12, color: '#334155' }}
              numberOfLines={1}
            >
              <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                {student.tutor?.name}
              </Text>
              {` (${student.tutor?.relationship || 'Tutor'})`}
            </Text>

            <Pressable
              onPress={onMessageTutor}
              accessibilityRole="button"
              accessibilityLabel={`Mensaje al tutor ${student.tutor?.name}`}
              hitSlop={8}
              className="items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: '#E0F2FE',
                marginLeft: 4,
              }}
            >
              <MessageCircle size={14} color="#0284C7" strokeWidth={2.25} />
            </Pressable>

            <Pressable
              onPress={onNoteTutor}
              accessibilityRole="button"
              accessibilityLabel={`Agregar nota sobre ${student.tutor?.name}`}
              hitSlop={8}
              className="items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: '#E0F2FE',
                marginLeft: 6,
              }}
            >
              <PencilLine size={14} color="#0284C7" strokeWidth={2.25} />
            </Pressable>
          </View>

          {/* ============================================================
              ACTION BUTTONS (Citatorio outline + Ver Expediente solid)
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
              onPress={onExpediente}
              accessibilityRole="button"
              accessibilityLabel={`Ver expediente de ${student.name}`}
              className="flex-1 flex-row items-center justify-center"
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
