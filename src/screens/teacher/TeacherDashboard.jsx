// =====================================================================
// TeacherDashboard.jsx
// ---------------------------------------------------------------------
// Pantalla principal del rol "teacher". Muestra resumen del día:
// clases a impartir, conteo y accesos rápidos a funciones de
// gestión. Refactorizado para usar Screen, DashboardHeader,
// ClassCard y QuickActionCard.
// =====================================================================

// React.
import React, { useCallback } from 'react';

// Primitivas RN: View, Text.
import { View, Text } from 'react-native';

// Iconos.
import {
  BookOpen,
  ClipboardCheck,
  Award,
  MessageSquare,
  ChevronRight,
} from 'lucide-react-native';

// Hooks.
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useApiResource } from '../../hooks/useApiResource';

// Componentes reutilizables.
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import DashboardHeader from '../../components/DashboardHeader';
import ClassCard from '../../components/ClassCard';
import QuickActionCard from '../../components/QuickActionCard';
import EmptyState from '../../components/EmptyState';

// Componente principal.
const TeacherDashboard = () => {
  // Hook de navegación.
  const navigation = useNavigation();

  // Hook de auth: nombre del docente.
  const { user } = useAuth();

  // useApiResource: carga los grupos del día.
  const { data: classes = [], loading, refresh } = useApiResource(
    async () => mockClasses,
    [],
  );

  // onRefresh: handler para el pull-to-refresh.
  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // displayName: nombre a mostrar, con fallback.
  const displayName = user?.name || 'Docente';

  return (
    <Screen refreshing={loading} onRefresh={onRefresh}>
      {/* Encabezado institucional. */}
      <DashboardHeader
        greeting="Hola,"
        name={`Prof. ${displayName}`}
        subtitle={`Tienes ${classes.length} clases programadas para hoy`}
      />

      <View className="px-6 -mt-8">
        {/* ============================================
            CLASES DEL DÍA
            ============================================ */}
        <Card>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-slate-900 text-lg font-bold">
              Clases de hoy
            </Text>
            <BookOpen size={20} color="#0ea5e9" />
          </View>

          {classes.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No tienes clases programadas."
            />
          ) : (
            classes.map((cls, index) => (
              <ClassCard
                key={cls.id}
                classItem={cls}
                isLast={index === classes.length - 1}
                onPress={() => navigation.navigate('AttendanceCheck', { classId: cls.id })}
              />
            ))
          )}
        </Card>

        {/* ============================================
            ACCIONES RÁPIDAS
            ============================================ */}
        <Text className="text-slate-900 text-lg font-bold mt-6 mb-3">
          Acciones rápidas
        </Text>

        <View className="flex-row gap-3 mb-3">
          <QuickActionCard
            icon={ClipboardCheck}
            title="Pase de lista"
            subtitle="Registrar asistencia"
            variant="emerald"
            onPress={() => navigation.navigate('AttendanceCheck')}
          />
          <QuickActionCard
            icon={Award}
            title="Calificaciones"
            subtitle="Subir notas"
            variant="amber"
            onPress={() => navigation.navigate('GradesUpload')}
          />
        </View>

        {/* Enviar mensaje: card ancha. */}
        <QuickActionCard
          icon={MessageSquare}
          title="Enviar mensaje"
          subtitle="Comunicarse con padres de familia"
          variant="sky"
          layout="wide"
          onPress={() => navigation.navigate('SendMessage')}
          rightSlot={<ChevronRight size={20} color="#94a3b8" />}
        />
      </View>

      <View className="h-6" />
    </Screen>
  );
};

// Mock de clases.
const mockClasses = [
  { id: 1, name: '5° Primaria - Matemáticas', time: '08:00 - 09:00', room: 'Aula 12', students: 28 },
  { id: 2, name: '5° Primaria - Ciencias', time: '09:00 - 10:00', room: 'Lab. 2', students: 28 },
  { id: 3, name: '6° Primaria - Matemáticas', time: '10:30 - 11:30', room: 'Aula 8', students: 25 },
];

export default TeacherDashboard;
