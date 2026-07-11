// =====================================================================
// GuardianDashboard.jsx
// ---------------------------------------------------------------------
// Pantalla principal del rol "guardian" (padre/tutor). Muestra
// resumen del día: estado de asistencia de los hijos, próximos
// avisos y accesos rápidos. Refactorizado para componerse de
// sub-componentes y delegar la lógica a hooks.
// =====================================================================

// React.
import React, { useCallback } from 'react';

// Primitivas RN: View, Text, TouchableOpacity.
import { View, Text, TouchableOpacity } from 'react-native';

// Iconos.
import {
  Users,
  CheckCircle2,
  Clock,
  ChevronRight,
  Calendar,
  Bell,
} from 'lucide-react-native';

// Hooks.
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useApiResource } from '../../hooks/useApiResource';

// Componentes reutilizables.
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import DashboardHeader from '../../components/DashboardHeader';
import QuickActionCard from '../../components/QuickActionCard';
import EmptyState from '../../components/EmptyState';

// Constantes y helpers.
import { attendanceStatusUi, ATTENDANCE_STATUS } from '../../constants/statusUi';

// Componente principal.
const GuardianDashboard = () => {
  // Hook de navegación.
  const navigation = useNavigation();

  // Hook de auth: extraemos "user" para personalizar el saludo.
  const { user } = useAuth();

  // useApiResource: hook para cargar los hijos del tutor. Hoy
  // devuelve datos mock; cuando se conecte al backend, el fetcher
  // будет await api.get('/guardian/children').
  const { data: children = [], loading, refresh } = useApiResource(
    // Fetcher. Lo definimos inline; useApiResource lo invoca al
    // montar y cada vez que cambien sus dependencias.
    async () => {
      // Simulación: en producción sería await api.get('/guardian/children').
      return mockChildren;
    },
    [], // deps: solo al montar.
  );

  // onRefresh: handler para el pull-to-refresh. Envuelve refresh()
  // de useApiResource. useCallback para identidad estable.
  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // displayName: nombre a mostrar. Prioriza name, luego email,
  // luego un fallback genérico.
  const displayName = user?.name || user?.email?.split('@')[0] || 'Familia';

  return (
    <Screen refreshing={loading} onRefresh={onRefresh}>
      {/* Encabezado institucional con saludo. */}
      <DashboardHeader
        greeting="Buen día,"
        name={displayName}
      />

      {/* Contenedor con marginTop negativo para superponer la card. */}
      <View className="px-6 -mt-8">
        {/* ============================================
            RESUMEN DE ASISTENCIA DEL DÍA
            ============================================ */}
        <Card>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-slate-900 text-lg font-bold">
              Asistencia de hoy
            </Text>
            <Calendar size={20} color="#0ea5e9" />
          </View>

          {children.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No tienes hijos registrados todavía."
            />
          ) : (
            children.map((child, index) => {
              // Obtenemos el "look & feel" del status desde
              // statusUi.js. Si el status no es reconocido,
              // devuelve el default (absent).
              const ui = attendanceStatusUi(child.status);
              const Icon = ui.Icon;
              const isLast = index === children.length - 1;
              return (
                <TouchableOpacity
                  key={child.id}
                  onPress={() => navigation.navigate('AttendanceHistory', { childId: child.id })}
                  className={`flex-row items-center py-3 ${isLast ? '' : 'border-b border-slate-100'}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver detalles de ${child.name}`}
                >
                  {/* Icono según status, en su color correspondiente. */}
                  <View className={`${ui.iconBgClass} p-2 rounded-lg mr-3`}>
                    <Icon size={20} color={ui.iconColor} strokeWidth={2.25} />
                  </View>

                  {/* Nombre y grado. */}
                  <View className="flex-1">
                    <Text className="text-slate-900 text-base font-semibold">
                      {child.name}
                    </Text>
                    <Text className="text-slate-500 text-xs mt-0.5">
                      {child.grade}
                    </Text>
                  </View>

                  <ChevronRight size={20} color="#94a3b8" />
                </TouchableOpacity>
              );
            })
          )}
        </Card>

        {/* ============================================
            ACCESOS RÁPIDOS
            ============================================ */}
        <Text className="text-slate-900 text-lg font-bold mt-6 mb-3">
          Accesos rápidos
        </Text>
        <View className="flex-row gap-3">
          <QuickActionCard
            icon={Users}
            title="Mis hijos"
            subtitle="Ver historial completo"
            variant="sky"
            onPress={() => navigation.navigate('AttendanceHistory')}
          />
          <QuickActionCard
            icon={Bell}
            title="Avisos"
            subtitle="Comunicados oficiales"
            variant="amber"
            onPress={() => navigation.navigate('Announcements')}
          />
        </View>
      </View>

      {/* Padding inferior. */}
      <View className="h-6" />
    </Screen>
  );
};

// Mock de hijos. En producción vendrá del backend. Lo exportamos
// desde aquí (en lugar de importarlo) para que sea fácil de
// encontrar y modificar durante el desarrollo.
const mockChildren = [
  { id: 1, name: 'Sofía Hernández', grade: '5° Primaria', status: ATTENDANCE_STATUS.PRESENT },
  { id: 2, name: 'Mateo Hernández', grade: '3° Primaria', status: ATTENDANCE_STATUS.LATE },
];

export default GuardianDashboard;
