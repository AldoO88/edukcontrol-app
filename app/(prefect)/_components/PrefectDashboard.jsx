// =====================================================================
// app/(prefect)/_components/PrefectDashboard.jsx
// ---------------------------------------------------------------------
// Dashboard del PREFECTO (rol "prefect"). Pantalla principal
// post-login para usuarios con ese rol.
//
// Componente privado del route group (app): vive en _components/
// (prefijo "_") para que Expo Router lo ignore como ruta.
//
// Estructura (de arriba a abajo):
//   ┌──────────────────────────────────┐
//   │ 🎓 EdukControl 🔔              │  ← GraduationCap + brand + bell
//   ├──────────────────────────────────┤
//   │ School info card (logo + name)   │  ← SchoolInfoCard compartida
//   ├──────────────────────────────────┤
//   │ Hola, Profr. [Nombre]           │  ← saludo grande
//   │ [PREFECTURA]                     │  ← badge pill
//   │ Descripción del rol              │
//   ├──────────────────────────────────┤
//   │ ┌──────────┐ ┌──────────┐       │  ← grid 2x2 de quick actions
//   │ │  Avisos  │ │Pase Salida│      │
//   │ └──────────┘ └──────────┘       │
//   │ ┌──────────┐ ┌──────────┐       │
//   │ │Lev. Repo │ │Gen. Cita │       │
//   │ └──────────┘ └──────────┘       │
//   ├──────────────────────────────────┤
//   │ Control Diario de Asistencia     │  ← 3 stat cards
//   ├──────────────────────────────────┤
//   │ Últimas Incidencias y Reportes   │  ← lista de incidencias
//   │ de Conducta                      │
//   ├──────────────────────────────────┤
//   │ BottomTabBar (Home activo)       │
//   └──────────────────────────────────┘
// =====================================================================

// React.
import React, { useMemo } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';

// Navegación.
import { useRouter } from 'expo-router';

// Iconos Lucide.
import {
  GraduationCap,  // Header: junto a EdukControl (mismo que guardian).
  Bell,           // Notificaciones.
  Megaphone,      // Quick action: Avisos.
  FileOutput,     // Quick action: Pase de Salida.
  AlertTriangle,  // Quick action: Levantar Reporte.
  Mail,           // Quick action: Generar Citatorio.
  Clock,          // Incidencia: retardo.
  Info, // Incidencia: citatorio.
  CheckCircle, // Incidencia: citatorio.
  XCircle,           // Incidencia: citatorio.
} from 'lucide-react-native';

// Chrome compartido.
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Hook del dashboard del prefecto.
import { usePrefectDashboard } from '@/src/hooks/usePrefectDashboard';
import DashboardHeader from '../../../src/components/DashboardHeader';

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function PrefectDashboard() {
  const router = useRouter();

  // ============================================================
  // DATA DEL BACKEND (mock por ahora)
  // ============================================================
  const { data, isLoading } = usePrefectDashboard();

  // Normalizar school al shape que consume SchoolInfoCard.
  const school = useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.school.cycle || null,
    };
  }, [data?.school]);

  const prefectName = data?.prefect?.name || 'Prefecto';
  const currentDate = data?.currentDate || 'Lunes, 12 de Octubre';

  // ============================================================
  // QUICK ACTIONS (grid 2x2) — colores pasteles como el teacher
  // ============================================================
  const quickActions = [
    {
      id: 'avisos',
      label: 'Avisos',
      icon: Megaphone,
      iconBg: 'bg-sky-100',
      iconColor: '#0284c7',
    },
    {
      id: 'exit',
      label: 'Pase de Salida',
      icon: FileOutput,
      iconBg: 'bg-emerald-100',
      iconColor: '#047857',
    },
    {
      id: 'report',
      label: 'Levantar Reporte',
      icon: AlertTriangle,
      iconBg: 'bg-amber-100',
      iconColor: '#b45309',
    },
    {
      id: 'citation',
      label: 'Generar Citatorio',
      icon: Mail,
      iconBg: 'bg-rose-100',
      iconColor: '#e11d48',
    },
  ];

  // ============================================================
  // STATS (Control Diario de Asistencia)
  // ============================================================
  const stats = data?.stats || { attendances: 0, punctual: 0, tardies: 0, absences: 0 };

  // ============================================================
  // INCIDENCIAS RECIENTES
  // ============================================================
  const incidents = data?.recentIncidents || [];

  // ---------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------
  return (
    <View className="flex-1 bg-slate-50">
      {/* Header compartido: brand + campana. */}
      <DashboardHeader />

      {/* School info card compartida. */}
      <SchoolInfoCard
        school={school}
        isLoading={isLoading}
        className="mx-4 mt-2"
      />


      {/* ============================================================
          SCROLL CONTENT
          ============================================================ */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* ============================================================
            SALUDO + BADGE + DESCRIPCIÓN
            ============================================================
            "Hola, Profr. Encargado de Prefectura"
            Badge pill "PREFECTURA" en sky-50 (mismo estilo que
            "Docente" del teacher).
            Descripción del rol del prefecto.
            ============================================================ */}
        <View className="px-4 mt-6">
          <Text className="text-3xl font-bold text-slate-900">
            {`Hola, ${prefectName}`}
          </Text>

          {/* Badge: PREFECTURA. */}
          <View className="self-start mt-2 px-3 py-1 bg-sky-50 rounded-full">
            <Text className="text-xs font-bold uppercase tracking-wide text-sky-700">
              PREFECTURA
            </Text>
          </View>

          {/* Descripción del rol. */}
          <Text className="text-sm text-slate-500 mt-2">
            Gestiona el control de asistencia e incidencias{'\n'}en tiempo real.
          </Text>
        </View>

        {/* ============================================================
            ACCESOS RÁPIDOS (grid 2x2)
            ============================================================
            Cuatro cards cuadradas con icono + label. Mismo estilo que
            el dashboard del maestro: white card, icono en cuadro
            pastel, label en slate-700.
            ============================================================ */}
        <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-6 mb-3 px-5">
          Accesos rápidos
        </Text>

        <View className="px-4 flex-row flex-wrap gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Pressable
                key={action.id}
                onPress={() => {}}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm items-center justify-center py-5 px-4"
                style={{ elevation: 1, width: '47%' }}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <View className={`w-14 h-14 rounded-2xl items-center justify-center ${action.iconBg}`}>
                  <Icon size={24} color={action.iconColor} strokeWidth={2} />
                </View>
                <Text className="text-sm font-semibold text-slate-700 mt-3">
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ============================================================
            CONTROL DIARIO DE ASISTENCIA
            ============================================================
            Un solo card con Total Presentes como título + desglose
            de Puntual / Retardos / Faltas debajo con dividers.
            ============================================================ */}
        <View className="px-4 mt-6">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
            Control Diario de Asistencia
          </Text>

          <View
            className="bg-white rounded-2xl border border-slate-100 shadow-sm"
            style={{ elevation: 1 }}
          >
            {/* Header: Total Presentes (centrado). */}
            <View className="items-center px-4 pt-4 pb-3">
              <Text className="text-[11px] font-semibold text-slate-500">
                Total Presentes
              </Text>
              <Text className="text-3xl font-extrabold text-sky-600 mt-1">
                {stats.attendances}
              </Text>
            </View>

            {/* Divider horizontal. */}
            <View className="border-t border-slate-100" />

            {/* Desglose: 3 métricas en fila con dividers verticales. */}
            <View className="flex-row">
              <View className="flex-1 items-center py-3">
                <View className="w-7 h-7 rounded-full bg-emerald-100 items-center justify-center mb-1">
                  <CheckCircle size={22} color="#047857" strokeWidth={2.5} />
                </View>
                <Text className="text-[11px] font-semibold text-slate-500">
                  Puntual
                </Text>
                <Text className="text-2xl font-extrabold text-emerald-600 mt-1">
                  {stats.punctual}
                </Text>
              </View>

              <View className="w-px bg-slate-100" />

              <View className="flex-1 items-center py-3">
                <View className="w-7 h-7 rounded-full bg-amber-100 items-center justify-center mb-1">
                  <Clock size={22} color="#b45309" strokeWidth={2.5} />
                </View>
                <Text className="text-[11px] font-semibold text-slate-500">
                  Retardos
                </Text>
                <Text className="text-2xl font-extrabold text-amber-600 mt-1">
                  {stats.tardies}
                </Text>
              </View>

              <View className="w-px bg-slate-100" />

              <View className="flex-1 items-center py-3">
                <View className="w-7 h-7 rounded-full bg-rose-100 items-center justify-center mb-1">
                  <XCircle size={22} color="#e11d48" strokeWidth={2.5} />
                </View>
                <Text className="text-[11px] font-semibold text-slate-500">
                  Faltas
                </Text>
                <Text className="text-2xl font-extrabold text-rose-600 mt-1">
                  {stats.absences}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================
            ÚLTIMAS INCIDENCIAS Y REPORTES DE CONDUCTA
            ============================================================
            Lista de las incidencias más recientes del día. Cada card
            muestra: ícono de tipo (retardo/reporte/citatorio), nombre
            del alumno + grupo, hora y descripción.
            ============================================================ */}
        <View className="px-4 mt-6">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
            Últimas Incidencias y Reportes de Conducta
          </Text>

          {incidents.map((incident) => {
            // Configuración visual según el tipo de incidencia.
            const typeConfig = {
              tardy: {
                iconBg: 'bg-amber-100',
                iconColor: '#b45309',
                icon: Clock,
              },
              report: {
                iconBg: 'bg-rose-100',
                iconColor: '#e11d48',
                icon: AlertTriangle,
              },
              citation: {
                iconBg: 'bg-sky-100',
                iconColor: '#0284c7',
                icon: Info,
              },
            };
            const config = typeConfig[incident.type] || typeConfig.report;
            const IncidentIcon = config.icon;

            return (
              <View
                key={incident.id}
                className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 shadow-sm"
                style={{ elevation: 1 }}
              >
                <View className="flex-row items-center">
                  {/* Ícono de tipo. */}
                  <View className={`w-11 h-11 rounded-full items-center justify-center ${config.iconBg}`}>
                    <IncidentIcon size={20} color={config.iconColor} strokeWidth={2} />
                  </View>

                  {/* Info del incidente. */}
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-bold text-slate-900 flex-1" numberOfLines={2}>
                        {`${incident.studentName} (${incident.group})`}
                      </Text>
                      <Text className="text-[11px] font-medium text-slate-400 ml-2">
                        {incident.time}
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      {incident.description}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Empty state si no hay incidencias. */}
          {incidents.length === 0 && !isLoading && (
            <View className="items-center py-8">
              <Text className="text-xs text-slate-400">
                Sin incidencias registradas hoy
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
