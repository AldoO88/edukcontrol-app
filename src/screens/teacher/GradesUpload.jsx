// =====================================================================
// GradesUpload.jsx
// ---------------------------------------------------------------------
// Pantalla para que el docente capture calificaciones de un grupo.
// Permite seleccionar el tipo de evaluación, escribir la nota por
// alumno y guardar. Refactorizado para usar Chip, GradeInput
// y el helper parseGradeInput.
// =====================================================================

// React.
import React, { useState, useCallback, useMemo } from 'react';

// Primitivas RN: View, Text, ScrollView, Alert.
import { View, Text, ScrollView, Alert } from 'react-native';

// Iconos.
import { Save, Award } from 'lucide-react-native';

// Componentes reutilizables.
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import Button from '../../components/Button';
import GradeInput from '../../components/GradeInput';
import StatCard from '../../components/StatCard';

// Helpers.
import { parseGradeInput, gradeUi } from '../../constants/statusUi';

// Tipos de evaluación. Constante fuera del componente.
const EVAL_TYPES = ['Examen', 'Tarea', 'Proyecto', 'Participación'];

// Componente principal.
const GradesUpload = ({ navigation }) => {
  // evalType: tipo de evaluación seleccionado.
  const [evalType, setEvalType] = useState(EVAL_TYPES[0]);

  // grades: mapa studentId -> number|null.
  const [grades, setGrades] = useState({});

  // saving: estado de envío.
  const [saving, setSaving] = useState(false);

  // setStudentGrade: actualiza la nota de un alumno. Usa
  // parseGradeInput (helper centralizado) para limpiar y validar.
  const setStudentGrade = useCallback((studentId, value) => {
    setGrades((prev) => {
      // Si el input es vacío o inválido, limpiamos.
      const cleaned = parseGradeInput(value);
      // Si el input no es válido, mantenemos el valor anterior
      // (no borramos si el usuario solo presionó una tecla
      // intermedia que dio NaN).
      if (cleaned === null && value !== '' && value !== '0') {
        // Solo aceptamos null cuando el input está realmente vacío.
        // Para inputs no vacíos pero fuera de rango, mantenemos
        // el valor previo.
        if (value === '' || value === null) {
          return { ...prev, [studentId]: null };
        }
        return prev;
      }
      return { ...prev, [studentId]: cleaned };
    });
  }, []);

  // average: promedio general de las notas capturadas.
  const average = useMemo(() => {
    const valid = Object.values(grades).filter((g) => g !== null);
    if (valid.length === 0) return null;
    return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);
  }, [grades]);

  // handleSave: envía las calificaciones.
  const handleSave = useCallback(async () => {
    const count = Object.values(grades).filter((g) => g !== null).length;
    if (count === 0) {
      Alert.alert('Sin calificaciones', 'Captura al menos una nota antes de guardar.');
      return;
    }
    setSaving(true);
    try {
      // Aquí iría: await api.post('/grades', { type: evalType, grades });
      await new Promise((resolve) => setTimeout(resolve, 800));
      Alert.alert('Éxito', `Calificaciones guardadas (${evalType}): ${count} alumnos.`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar las calificaciones.');
    } finally {
      setSaving(false);
    }
  }, [grades, evalType, navigation]);

  return (
    <Screen>
      {/* Header con botón guardar. */}
      <ScreenHeader
        title="Subir calificaciones"
        subtitle="Escala 0 - 10"
        rightSlot={
          <Button
            title={saving ? 'Guardando...' : 'Guardar'}
            onPress={handleSave}
            loading={saving}
            icon={Save}
            variant="secondary"
            className="py-2 px-3"
            accessibilityLabel="Guardar calificaciones"
          />
        }
      />

      {/* Selector de tipo de evaluación. */}
      <View className="px-6 pt-4">
        <Text className="text-slate-700 text-sm font-semibold mb-2">
          Tipo de evaluación
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {EVAL_TYPES.map((type) => (
            <Chip
              key={type}
              label={type}
              selected={evalType === type}
              onPress={() => setEvalType(type)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Promedio general (si hay notas). */}
      {average !== null && (
        <View className="px-6 pt-4">
          <StatCard
            label="Promedio actual"
            value={average}
            variant="amber"
            icon={Award}
            iconBgClass="bg-amber-100"
            iconColor="#d97706"
            layout="horizontal"
          />
        </View>
      )}

      {/* Lista de alumnos con input de calificación. */}
      <View className="px-6 pt-4">
        <Text className="text-slate-700 text-sm font-semibold mb-2">
          Alumnos
        </Text>
        {students.map((student) => {
          const grade = grades[student.id];
          const ui = gradeUi(grade);
          return (
            <Card key={student.id} className="mb-2">
              <View className="flex-row items-center">
                <View className="flex-1 mr-3">
                  <Text className="text-slate-900 text-sm font-bold" numberOfLines={1}>
                    {student.name}
                  </Text>
                  <Text className={`${ui.textClass} text-xs mt-0.5`}>
                    {ui.label}
                  </Text>
                </View>
                <GradeInput
                  value={grade}
                  onChange={(v) => setStudentGrade(student.id, v)}
                  accessibilityLabel={`Calificación de ${student.name}`}
                />
              </View>
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

export default GradesUpload;
