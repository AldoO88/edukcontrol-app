// =====================================================================
// app/(teacher)/_components/AttendanceSessionDetail.jsx
// ---------------------------------------------------------------------
// Modal de detalle de una sesión de asistencia.
//
// Se abre al tocar una sesión en la lista "Sesiones recientes"
// de la pantalla de Resumen de Asistencia.
//
// Props:
//   - isVisible: boolean
//   - onClose: () => void
//   - session: { sessionId, date, group, subject, present, total, pct, groupId }
//
// Solo lectura — no permite editar asistencia.
// =====================================================================

import React, { useEffect, useState } from 'react';

import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { X, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react-native';

import { getAttendanceSessionDetail } from '@/src/services/teacherService';

// ---------------------------------------------------------------------
// attendanceColor — color del % según threshold.
// ---------------------------------------------------------------------
const attendanceColor = (pct) => {
  if (pct >= 90) return { fg: '#15803D', bg: '#DCFCE7' };
  if (pct >= 80) return { fg: '#B45309', bg: '#FEF3C7' };
  return { fg: '#B91C1C', bg: '#FEE2E2' };
};

// ---------------------------------------------------------------------
// STATUS_CONFIG — configuración visual por estado de asistencia.
// ---------------------------------------------------------------------
const STATUS_CONFIG = {
  present: {
    label: 'Presente',
    icon: CheckCircle,
    color: '#15803D',
    bg: '#DCFCE7',
  },
  absent: {
    label: 'Falta',
    icon: XCircle,
    color: '#B91C1C',
    bg: '#FEE2E2',
  },
  late: {
    label: 'Retardo',
    icon: Clock,
    color: '#B45309',
    bg: '#FEF3C7',
  },
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
const AttendanceSessionDetail = ({
  isVisible,
  onClose,
  session,
}) => {
  const insets = useSafeAreaInsets();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  // ============================================================
  // FETCH: detalle de la sesión al abrir
  // ============================================================
  useEffect(() => {
    if (!isVisible || !session?.date) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    const fetchDetail = async () => {
      setLoading(true);
      const result = await getAttendanceSessionDetail(session.date);
      if (cancelled) return;
      if (result.success) {
        setDetail(result.data);
      }
      setLoading(false);
    };
    fetchDetail();
    return () => { cancelled = true; };
  }, [isVisible, session?.date]);

  // ============================================================
  // Agrupar alumnos por estado
  // ============================================================
  const groupedStudents = React.useMemo(() => {
    if (!detail?.students) return { present: [], absent: [], late: [] };

    const groups = { present: [], absent: [], late: [] };
    detail.students.forEach((s) => {
      if (groups[s.status]) {
        groups[s.status].push(s);
      }
    });
    return groups;
  }, [detail?.students]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}
      >
        <Pressable className="flex-1" onPress={onClose} />

        <View
          className="bg-white rounded-t-3xl"
          style={{
            maxHeight: '80%',
            paddingBottom: insets.bottom + 16,
          }}
        >
          {/* ================================================
              HEADER
              ================================================ */}
          <View
            className="flex-row items-center px-5 pt-5 pb-3"
            style={{ borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
          >
            <View
              className="items-center justify-center"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#F0F9FF',
              }}
            >
              <Calendar size={18} color="#0284C7" strokeWidth={2.25} />
            </View>
            <View className="flex-1 ml-3">
              <Text
                className="text-slate-900"
                style={{ fontSize: 16, fontWeight: '700' }}
                numberOfLines={1}
              >
                {`${session?.dateFormatted || '—'} · ${session?.group?.label || '—'}`}
              </Text>
              <Text
                className="text-slate-500 mt-0.5"
                style={{ fontSize: 12, fontWeight: '500' }}
                numberOfLines={1}
              >
                {session?.subject?.name || '—'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="items-center justify-center"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#F1F5F9',
              }}
              accessibilityLabel="Cerrar"
            >
              <X size={16} color="#475569" strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* ================================================
              SUMMARY PILL
              ================================================ */}
          {!loading && detail?.stats && (
            <View className="flex-row items-center px-5 py-3" style={{ gap: 8 }}>
              <View
                className="px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: attendanceColor(detail.stats.present * 100 / detail.stats.total).bg,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: attendanceColor(detail.stats.present * 100 / detail.stats.total).fg,
                  }}
                >
                  {`${detail.stats.present}/${detail.stats.total} presentes`}
                </Text>
              </View>
              {detail.stats.absent > 0 && (
                <View
                  className="px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: '#FEE2E2' }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: '#B91C1C',
                    }}
                  >
                    {`${detail.stats.absent} faltas`}
                  </Text>
                </View>
              )}
              {detail.stats.late > 0 && (
                <View
                  className="px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: '#FEF3C7' }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: '#B45309',
                    }}
                  >
                    {`${detail.stats.late} retardos`}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ================================================
              CONTENT
              ================================================ */}
          <ScrollView
            className="px-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {/* Loading. */}
            {loading && (
              <View className="items-center py-10">
                <ActivityIndicator size="large" color="#0284C7" />
                <Text className="text-slate-400 text-sm mt-3">
                  Cargando detalle...
                </Text>
              </View>
            )}

            {/* Lista de alumnos agrupados por estado. */}
            {!loading && detail && (
              <>
                {/* Presentes. */}
                {groupedStudents.present.length > 0 && (
                  <StudentGroup
                    label="Presentes"
                    count={groupedStudents.present.length}
                    students={groupedStudents.present}
                    status="present"
                  />
                )}

                {/* Faltas. */}
                {groupedStudents.absent.length > 0 && (
                  <StudentGroup
                    label="Faltas"
                    count={groupedStudents.absent.length}
                    students={groupedStudents.absent}
                    status="absent"
                  />
                )}

                {/* Retardos. */}
                {groupedStudents.late.length > 0 && (
                  <StudentGroup
                    label="Retardos"
                    count={groupedStudents.late.length}
                    students={groupedStudents.late}
                    status="late"
                  />
                )}

                {/* Sin datos. */}
                {detail.students.length === 0 && (
                  <Text className="text-slate-400 text-center text-sm py-6">
                    No hay datos de asistencia para esta sesión.
                  </Text>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------
// StudentGroup — subcomponente: lista de alumnos de un estado.
// ---------------------------------------------------------------------
const StudentGroup = ({ label, count, students, status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.present;
  const IconComponent = config.icon;

  return (
    <View className="mb-4">
      {/* Header de grupo. */}
      <View className="flex-row items-center mb-2">
        <IconComponent size={14} color={config.color} strokeWidth={2.25} />
        <Text
          className="ml-1.5"
          style={{
            fontSize: 11,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: config.color,
          }}
        >
          {`${label} (${count})`}
        </Text>
      </View>

      {/* Lista. */}
      <View
        className="bg-white rounded-2xl border border-slate-100"
        style={{
          shadowColor: '#0F172A',
          shadowOpacity: 0.04,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}
      >
        {students.map((student, index) => {
          const isLast = index === students.length - 1;
          return (
            <View
              key={student.studentId}
              className="flex-row items-center px-4 py-3"
              style={
                !isLast
                  ? {
                      borderBottomWidth: 1,
                      borderBottomColor: '#F1F5F9',
                    }
                  : undefined
              }
            >
              {/* Status dot. */}
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: config.color,
                }}
              />

              {/* Name. */}
              <Text
                className="flex-1 ml-3 text-slate-900"
                style={{ fontSize: 13, fontWeight: '600' }}
                numberOfLines={1}
              >
                {student.name}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default AttendanceSessionDetail;
