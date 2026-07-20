// =====================================================================
// app/(app)/_components/GuardianDashboard.jsx
// ---------------------------------------------------------------------
// Dashboard del PADRE / TUTOR (rol "guardian"). Pantalla principal
// post-login para usuarios con ese rol. Se monta desde el dispatcher
// Top header: brand del producto + campana de notificaciones. Cada
            // dashboard pinta su propio header (no hay uno global en
            // el Stack raíz); la info del tenant (escuela) vive en
            // la school info card justo debajo.
//
// Componente privado del route group (app): vive en _components/
// (prefijo "_") para que Expo Router lo ignore como ruta.
//
// Estructura (de arriba a abajo):
//   ┌──────────────────────────────────┐
//   │ Top header: EdukControl + 🔔    │  ← brand del producto + campana
//   ├──────────────────────────────────┤
//   │ School info card                 │  ← nombre de la escuela + ciclo
//   ├──────────────────────────────────┤
//   │ Hola, [user.name del payload]    │  ← saludo + rol + subtítulo
//   │ Padre de Familia                 │
//   ├──────────────────────────────────┤
//   │ ┌────────────────────────────┐   │
//   │ │ ChildCard (Carlos)         │   │  ← avatar + estado + métricas
//   │ └────────────────────────────┘   │
//   │ ┌────────────────────────────┐   │
//   │ │ ChildCard (Ana)            │   │
//   │ └────────────────────────────┘   │
//   ├──────────────────────────────────┤
//   │ Bottom tab bar (5 tabs)          │  ← Inicio / Avisos / etc.
//   └──────────────────────────────────┘
//
// =====================================================================
// SOBRE EL NOMBRE DE USUARIO
// ---------------------------------------------------------------------
// El saludo "Hola, [nombre]" se construye con useAuth().user.name,
// que viene del payload del JWT (authService.payloadToAppUser extrae
// payload.name y lo pone en user.name). El backend puede enviar el
// nombre de la familia (e.g. "Familia González") o el nombre del
// padre individual; el front lo muestra tal cual.
// Si user es null (no debería pasar porque el auth gate protege esta
// ruta), caemos a "Familia" como fallback graceful.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN.
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';

// Safe area: el header superior necesita paddingTop dinámico para
// no chocar con el status bar / Dynamic Island en iOS.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Routing de Expo Router: useRouter para navegar desde el tab bar;
// useSegments para saber en qué ruta estamos y resaltar el tab activo.
import { useRouter, useSegments } from 'expo-router';

// Iconos vectoriales (lucide).
import {
  GraduationCap, // birrete (brand + school card).
  Bell,          // campana de notificaciones.
  Clock,         // reloj (último acceso).
  LogOut,        // salida (cuando está fuera del plant).
  ChevronRight,  // flecha "Ver detalles".
  Home,          // tab Inicio.
  Megaphone,     // tab Avisos.
  FileText,      // tab Reportes.
  BookOpen,      // tab Materias.
  Settings,      // tab Ajustes.
} from 'lucide-react-native';

// Hook de auth: provee { user, isLoading, userRole, ... }. Aquí
// solo necesitamos user.name para personalizar el saludo.
import { useAuth } from '../../../src/hooks/useAuth';

// Tenant mock: nombre de la escuela. Viene del contexto de tenant
// en producción.
import { SCHOOL_NAME } from '../../../src/constants/school';

// clsx para componer classNames condicionales.
import { clsx } from 'clsx';

// ---------------------------------------------------------------------
// MOCK DATA: hijos de la familia
// ---------------------------------------------------------------------
// En producción cada uno de estos objetos vendrá de un endpoint
// del backend (e.g. GET /family/:id/children). Aquí los hardcodeamos
// para poder maquetar la UI sin depender del server.
// avatar: URL pública de pravatar (randomuser.me). Se reemplaza
//   por la foto real del alumno cuando esté disponible.
// status: 'in_school' → "En la institución" (verde) | 'outside' →
//   "Fuera del plant" (ámbar).
// lastAccess.icon: 'clock' para "Último acceso", 'logout' para
//   "Salida".
// ---------------------------------------------------------------------
const CHILDREN = [
  {
    id: 'carlos',
    name: 'Carlos González',
    group: '2°B',
    shift: 'Turno Matutino',
    avatar: 'https://i.pravatar.cc/200?img=12',
    status: 'in_school',
    statusText: 'Activo - En la institución',
    lastAccess: { icon: 'clock', text: 'Último acceso: Hoy, 6:55 AM' },
    metrics: { attendance: 98, average: 9.4, conduct: 95 },
  },
  {
    id: 'ana',
    name: 'Ana González',
    group: '1°A',
    shift: 'Turno Matutino',
    avatar: 'https://i.pravatar.cc/200?img=5',
    status: 'outside',
    statusText: 'Activo - Fuera del plantel',
    lastAccess: { icon: 'logout', text: 'Salida: Hoy, 2:15 PM' },
    metrics: { attendance: 95, average: 9.0, conduct: 100 },
  },
];

// ---------------------------------------------------------------------
// TABS del bottom bar
// ---------------------------------------------------------------------
// Cada tab tiene una ruta destino. Las rutas apuntan a pantallas
// que AÚN NO EXISTEN (solo /dashboard está implementado). Cuando
// se creen las pantallas de Avisos/Reportes/etc., el tab bar las
// encontrará automáticamente vía useSegments.
// `match` es el segmento de URL que identifica al tab activo
// (Expo Router oculta los route groups, así que el segmento de
// /dashboard es literalmente "dashboard", no "(app)/dashboard").
// ---------------------------------------------------------------------
const TABS = [
  { id: 'inicio',   label: 'Inicio',   icon: Home,      route: '/(app)/dashboard', match: 'dashboard' },
  { id: 'avisos',   label: 'Avisos',   icon: Megaphone, route: '/(app)/avisos',    match: 'avisos' },
  { id: 'reportes', label: 'Reportes', icon: FileText,  route: '/(app)/reportes',  match: 'reportes' },
  { id: 'materias', label: 'Materias', icon: BookOpen,  route: '/(app)/materias',  match: 'materias' },
  { id: 'ajustes',  label: 'Ajustes',  icon: Settings,  route: '/(app)/ajustes',   match: 'ajustes' },
];

// ---------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------
export default function GuardianDashboard() {
  // user.name: viene del payload del JWT. Lo usamos en el saludo.
  const { user } = useAuth();

  // Insets para el top padding del header (status bar / notch).
  // También lo usamos para el bottom padding del tab bar (home
  // indicator en iOS).
  const insets = useSafeAreaInsets();

  // Router: para navegar cuando el usuario toca un tab.
  const router = useRouter();

  // Segmento de URL actual. Usado para resaltar el tab activo.
  // useSegments() devuelve un array; el último elemento es el
  // segmento más profundo. Para /dashboard es 'dashboard'.
  const segments = useSegments();
  const currentSegment = segments[segments.length - 1] || 'dashboard';

  return (
    // Contenedor raíz flex-1. Importante: el SafeAreaView de la
    // app NO se está usando aquí (el dispatcher devuelve este
    // componente directamente), por lo que el componente es
    // responsable de su propia safe area: paddingTop en el header
    // y paddingBottom en el tab bar.
    <View className="flex-1 bg-slate-50">
      {/* ScrollView con flex-1: ocupa el espacio entre el header
          y el tab bar. contentContainerStyle.paddingBottom da un
          respiro al final del scroll para que el último card no
          quede pegado al tab bar. */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* ============================================================
            TOP HEADER: brand del producto + campana de notificaciones
            ============================================================
            Header propio del dashboard (no hay uno global en el
            Stack raíz). Muestra la marca del producto (EdukControl)
            + campana con dot de notificación. La info del tenant
            (escuela) se pinta en una card aparte justo debajo.
            --------------------------------------------------------
            - bg-white: fondo blanco para distinguirlo del body slate-50.
            - border-b border-slate-200: línea sutil de separación.
            - paddingTop: insets.top + 12 para respetar la safe area
              superior y dar 12px de padding visual.
            - flex-row + justify-between: brand a la izquierda,
              campana a la derecha.
            ============================================================ */}
        <View
          className="bg-white flex-row items-center justify-between px-4 pb-3 border-b border-slate-200"
          style={{ paddingTop: insets.top + 12 }}
        >
          <View className="flex-row items-center">
            <GraduationCap size={24} color="#1e3a8a" strokeWidth={2.25} />
            <Text className="text-xl font-bold text-slate-900 ml-2">
              EdukControl
            </Text>
          </View>

          {/* Campana con dot rojo de notificación. El dot está
              posicionado absolute en la esquina superior derecha
              del icono. border-2 border-white crea un "halo" que
              separa el dot del icono. */}
          <Pressable className="relative" hitSlop={8} accessibilityLabel="Notificaciones">
            <Bell size={24} color="#64748b" strokeWidth={2} />
            <View className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white" />
          </Pressable>
        </View>

        {/* ============================================================
            SCHOOL INFO CARD
            ============================================================
            Card blanca con el logo de la escuela (en un cuadrado
            azul) + nombre + ciclo escolar. Esta info viene del
            contexto de tenant (SCHOOL_NAME), no del payload del user.
            ============================================================ */}
        <View
          className="bg-white flex-row items-center px-4 py-4 mx-4 mt-4 rounded-2xl border border-slate-100"
          style={{ elevation: 2 }}
        >
          {/* Cuadrado azul con el birrete. w-12 h-12 (48px) coincide
              con el tamaño del avatar del hijo. */}
          <View className="w-12 h-12 rounded-xl bg-sky-600 items-center justify-center mr-3">
            <GraduationCap size={24} color="#ffffff" strokeWidth={2.25} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-900">
              {SCHOOL_NAME}
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              Ciclo Escolar 2023-2024
            </Text>
          </View>
        </View>

        {/* ============================================================
            SALUDO + TIPO DE PERFIL
            ============================================================
            - "Hola, [user.name]": viene del payload del JWT. Si el
              backend envía "Familia González", mostramos eso; si
              envía el nombre del padre individual, mostramos ese.
            - "Padre de Familia": etiqueta hardcoded que describe
              el rol del usuario (sería interesante que también
              viniera del payload, pero por ahora es UI fija).
            - Subtítulo gris: invitación a la acción.
            ============================================================ */}
        <View className="px-4 mt-6">
          <Text className="text-3xl font-bold text-slate-900">
            Hola, {user?.name || 'Familia'}
          </Text>
          <Text className="text-sm font-semibold text-sky-600 mt-1">
            Padre de Familia
          </Text>
          <Text className="text-sm text-slate-500 mt-2">
            Sigue el progreso académico de tus hijos en tiempo real.
          </Text>
        </View>

        {/* ============================================================
            CHILD CARDS
            ============================================================
            Una card por hijo. Antes el dashboard tenía un SELECTOR
            de hijo + un único bloque de status, pero el mockup nuevo
            muestra una LISTA de cards (uno por hijo), cada una con
            su propio status, último acceso y métricas. Esto escala
            mejor cuando una familia tiene 3+ hijos: el usuario hace
            scroll en vez de tocar pills.
            ============================================================ */}
        <View className="px-4 mt-6">
          {CHILDREN.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </View>
      </ScrollView>

      {/* ============================================================
          BOTTOM TAB BAR
          ============================================================
          Barra fija en la parte inferior con 5 tabs. NO está dentro
          del ScrollView para que se mantenga visible al hacer scroll.
          paddingBottom: insets.bottom respeta el home indicator de
          iOS.
          --------------------------------------------------------
          El active state se determina comparando el segmento actual
          de URL con el `match` de cada tab. Esto es robusto: cuando
          se creen las pantallas de Avisos/Reportes/etc., el tab bar
          se actualizará automáticamente.
          ============================================================ */}
      <View
        className="bg-white border-t border-slate-200 flex-row"
        style={{ paddingBottom: insets.bottom }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentSegment === tab.match;
          return (
            <Pressable
              key={tab.id}
              onPress={() => router.push(tab.route)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              className="flex-1 items-center justify-center py-2"
            >
              <Icon
                size={24}
                color={isActive ? '#0ea5e9' : '#94a3b8'}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text
                className={clsx(
                  'text-xs mt-1',
                  isActive
                    ? 'text-sky-600 font-semibold'
                    : 'text-slate-400',
                )}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------
// Sub-componente: ChildCard
// ---------------------------------------------------------------------
// Card blanca con la info de UN hijo: avatar + nombre + grupo,
// pill de status, último acceso, botón "Ver detalles" y 3 KPIs
// (ASIST. / PROM. / COND.). Extraído del padre para no inflar el
// JSX del GuardianDashboard con lógica repetida por cada hijo.
// ---------------------------------------------------------------------
function ChildCard({ child }) {
  // Derivados: in_school → verde, outside → ámbar.
  const isInSchool = child.status === 'in_school';
  // El icono de "último acceso" cambia según el status: si está
  // en la escuela, mostramos un reloj; si salió, un icono de salida.
  const AccessIcon = child.lastAccess.icon === 'clock' ? Clock : LogOut;

  return (
    // Card blanca con shadow multiplataforma (elevation 3 en Android).
    <View
      className="bg-white rounded-2xl p-4 mb-4"
      style={{ elevation: 3 }}
    >
      {/* Avatar circular + nombre + grupo. */}
      <View className="flex-row items-center">
        <Image
          source={{ uri: child.avatar }}
          className="w-16 h-16 rounded-full border-2 border-sky-200"
          accessibilityLabel={`Foto de ${child.name}`}
        />
        <View className="ml-3 flex-1">
          <Text className="text-base font-bold text-slate-900">
            {child.name}
          </Text>
          <Text className="text-xs text-slate-500 mt-0.5">
            {child.group} - {child.shift}
          </Text>
        </View>
      </View>

      {/* Pill de status. Color según in_school vs outside. */}
      <View className="mt-3">
        <View
          className={clsx(
            'flex-row items-center self-start px-3 py-1 rounded-full',
            isInSchool ? 'bg-emerald-50' : 'bg-amber-50',
          )}
        >
          <View
            className={clsx(
              'w-2 h-2 rounded-full mr-2',
              isInSchool ? 'bg-emerald-500' : 'bg-amber-500',
            )}
          />
          <Text
            className={clsx(
              'text-xs font-semibold',
              isInSchool ? 'text-emerald-700' : 'text-amber-700',
            )}
          >
            {child.statusText}
          </Text>
        </View>
      </View>

      {/* Línea de "último acceso" / "salida" con icono a la izquierda. */}
      <View className="flex-row items-center mt-2">
        <AccessIcon size={14} color="#64748b" strokeWidth={2} />
        <Text className="text-sm text-slate-500 ml-1.5">
          {child.lastAccess.text}
        </Text>
      </View>

      {/* Botón "Ver detalles". Es decorativo por ahora (no navega);
          cuando exista la pantalla de detalle del hijo, lo
          conectaremos con router.push. */}
      <Pressable
        className="flex-row items-center justify-center py-3 border border-sky-200 rounded-xl mt-4"
        accessibilityRole="button"
        accessibilityLabel={`Ver detalles de ${child.name}`}
      >
        <Text className="text-sky-600 font-semibold">Ver detalles</Text>
        <ChevronRight size={16} color="#0ea5e9" strokeWidth={2.5} className="ml-1" />
      </Pressable>

      {/* Divider antes de las métricas. */}
      <View className="h-px bg-slate-100 mt-4" />

      {/* 3 KPIs: ASIST. (sky-50) / PROM. (sky-50) / COND. (amber-50).
          COND. usa amber para destacar que es la métrica de
          "comportamiento", separada del rendimiento académico. */}
      <View className="flex-row mt-4 gap-3">
        <View className="flex-1 bg-sky-50 rounded-xl p-3">
          <Text className="text-xs font-semibold text-sky-700">ASIST.</Text>
          <Text className="text-lg font-bold text-sky-700 mt-1">
            {child.metrics.attendance}%
          </Text>
        </View>
        <View className="flex-1 bg-sky-50 rounded-xl p-3">
          <Text className="text-xs font-semibold text-sky-700">PROM.</Text>
          <Text className="text-lg font-bold text-sky-900 mt-1">
            {child.metrics.average}
          </Text>
        </View>
        <View className="flex-1 bg-amber-50 rounded-xl p-3">
          <Text className="text-xs font-semibold text-amber-700">COND.</Text>
          <Text className="text-lg font-bold text-amber-700 mt-1">
            {child.metrics.conduct}
          </Text>
        </View>
      </View>
    </View>
  );
}
