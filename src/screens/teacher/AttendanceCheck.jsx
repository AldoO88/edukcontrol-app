// =====================================================================
// AttendanceCheck.jsx
// ---------------------------------------------------------------------
// Pantalla de "pase de lista" para el rol "teacher". Permite
// registrar el status de cada alumno. Refactorizado para usar
// el hook genérico de selección (mapa id->status) y sub-componentes.
// =====================================================================

// React.
import React, { useState, useCallback, useMemo } from 'react';

// Primitivas RN: View, Text, Alert.
import { View, Text, Alert } from 'react-native';

// Iconos.
import { Save } from 'lucide-react-native';

// Componentes reutilizables.
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import AttendanceButtonGroup from '../../components/AttendanceButtonGroup';
import Button from '../../components/Button';

// Constantes.
import { ATTENDANCE_STATUS } from '../../constants/statusUi';

// Componente principal.
const AttendanceCheck = ({ route, navigation }) => {
  // useNavigation como fallback si no nos pasan navigation por props.
  // navigation prop es la convención de React Navigation v6+.
  // const classId = route?.params?.classId || null;

  // attendanceMap: mapa studentId -> status. Usamos useState directo
  // (no useForm) porque no es un "formulario" sino un estado de
  // selección. Para casos con muchos ids, podría usarse useSelection,
  // pero un objeto indexado por id es más natural aquí.
  const [attendance, setAttendance] = useState({});

  // saving: estado de envío.
  const [saving, setSaving] = useState(false);

  // toggleStatus: alterna el status de un alumno. Si ya tenía ese
  // mismo status, lo desmarca (vuelve a null).
  const toggleStatus = useCallback((studentId, status) => {
    setAttendance((prev) => {
      const current = prev[studentId];
      const next = current === status ? null : status;
      return { ...prev, [studentId]: next };
    });
  }, []);

  // markAllPresent: marca a todos como 'present'.
  const markAllPresent = useCallback(() => {
    const allPresent = {};
    students.forEach((s) => {
      allPresent[s.id] = ATTENDANCE_STATUS.PRESENT;
    });
    setAttendance(allPresent);
  }, []);

  // counts: contadores derivados. useMemo evita recalcular en
  // cada render si attendance no cambia.
  const counts = useMemo(() => ({
    present: Object.values(attendance).filter((s) => s === ATTENDANCE_STATUS.PRESENT).length,
    late: Object.values(attendance).filter((s) => s === ATTENDANCE_STATUS.LATE).length,
    absent: Object.values(attendance).filter((s) => s === ATTENDANCE_STATUS.ABSENT).length,
  }), [attendance]);

  // totalMarked: suma de los tres contadores.
  const totalMarked = counts.present + counts.late + counts.absent;

  // handleSave: envía la asistencia.
  const handleSave = useCallback(async () => {
    const markedCount = Object.values(attendance).filter(Boolean).length;
    if (markedCount === 0) {
      Alert.alert('Sin registros', 'Marca al menos un alumno antes de guardar.');
      return;
    }
    setSaving(true);
    try {
      // Aquí iría: await api.post(`/classes/${classId}/attendance`, { attendance });
      await new Promise((resolve) => setTimeout(resolve, 800));
      Alert.alert('Éxito', `Asistencia guardada: ${markedCount} alumnos registrados.`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la asistencia. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }, [attendance, navigation]);

  return (
    <Screen>
      {/* Header con botón guardar. */}
      <ScreenHeader
        title="Pase de lista"
        subtitle={`${students.length} alumnos · ${totalMarked} registrados`}
        rightSlot={
          <Button
            title={saving ? 'Guardando...' : 'Guardar'}
            onPress={handleSave}
            loading={saving}
            icon={Save}
            // variant secondary para que sea un botón compacto
            // dentro del header, no el botón principal de la pantalla.
            variant="secondary"
            className="py-2 px-3"
            accessibilityLabel="Guardar asistencia"
          />
        }
      />

      {/* Resumen rápido (KPIs en vivo). */}
      <View className="px-6 pt-4">
        <View className="flex-row gap-2 mb-2">
          <StatCard
            label="A tiempo"
            value={counts.present}
            variant="emerald"
          />
          <StatCard
            label="Retardos"
            value={counts.late}
            variant="amber"
          />
          <StatCard
            label="Faltas"
            value={counts.absent}
            variant="rose"
          />
        </View>

        {/* Botón "Marcar todos". */}
        <Button
          title="✓ Marcar todos como presentes"
          onPress={markAllPresent}
          variant="secondary"
          className="bg-sky-50 border-sky-200 mb-4"
        />
      </View>

      {/* Lista de alumnos. */}
      <View className="px-6">
        {students.map((student) => {
          const currentStatus = attendance[student.id] || null;
          return (
            <Card key={student.id} className="mb-2">
              <Text className="text-slate-900 text-sm font-bold mb-3">
                {student.name}
              </Text>
              <AttendanceButtonGroup
                currentStatus={currentStatus}
                onSelect={(status) => toggleStatus(student.id, status)}
              />
            </Card>
          );
        })}
      </View>

      <View className="h-8" />
    </Screen>
  );
};

// Mock de alumnos.
const students = [
  { id: 1, name: 'Ana García López' },
  { id: 2, name: 'Carlos Mendoza' },
  { id: 3, name: 'Daniela Ruiz' },
  { id: 4, name: 'Diego Fernández' },
  { id: 5, name: 'Emiliano Torres' },
  { id: 6, name: 'Fernanda Castro' },
  { id: 7, name: 'Gabriel Ortiz' },
  { id: 8, name: 'Isabella Romero' },
];

export default AttendanceCheck;
