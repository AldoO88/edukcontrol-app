// =====================================================================
// src/components/BottomTabBar.jsx (chrome compartido)
// ---------------------------------------------------------------------
// Bottom tab bar compartido por los route groups por rol ((guardian)
// y (teacher)). Renderiza los tabs con icono + label, resaltando el
// tab activo según el segmento actual de la URL.
//
// Props:
//   - tabs: array opcional de tabs. Si no se pasa, usa GUARDIAN_TABS
//     (las 5 tabs del rediseño: Inicio, Avisos, Conducta,
//     Calificaciones, Asistencia). Permite que pantallas con
//     navegación custom (e.g. el teacher con tabs distintos)
//     sobreescriban la lista sin tocar este componente.
//
// Shape de cada tab:
//   { id, label, icon (Lucide), route, match }
//
// Self-contained: usa useRouter, useSegments y useSafeAreaInsets
// internamente. El padre solo necesita <BottomTabBar /> (o
// <BottomTabBar tabs={...} /> si quiere customizar).
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text, Pressable.
import { View, Text, Pressable } from 'react-native';

// Safe area: paddingBottom = insets.bottom para que la tab bar
// respete el home indicator en iPhones con notch.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Routing de Expo Router.
import { useRouter, useSegments } from 'expo-router';

// clsx para componer classNames condicionales.
import { clsx } from 'clsx';

// Tabs del tutor (default). Fuente única en src/constants/navigationTabs.js
// — este componente es agnóstico del rol: el padre puede pasarle
// `tabs={TEACHER_TABS}` para el flujo del maestro.
import { GUARDIAN_TABS } from '../constants/navigationTabs';

const BottomTabBar = ({ tabs = GUARDIAN_TABS }) => {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  // Segmento de URL actual. Usado para resaltar el tab activo.
  // El último segmento del array es la ruta hoja (e.g. "announcements"
  // para la URL /announcements, "dashboard" para /dashboard).
  const currentSegment = segments[segments.length - 1] || 'dashboard';

  return (
    // bg-white: fondo blanco.
    // border-t border-slate-100: línea sutil arriba.
    // flex-row: tabs en horizontal.
    // paddingBottom = insets.bottom → respeta el home indicator.
    <View
      className="bg-white border-t border-slate-100 flex-row"
      style={{ paddingBottom: insets.bottom }}
    >
      {tabs.map((tab) => {
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
            {/* Icono: strokeWidth 2.5 + sky-500 cuando activo,
                2 + slate-400 cuando inactivo. Refuerza la
                jerarquía visual. */}
            <Icon
              size={24}
              color={isActive ? '#0ea5e9' : '#94a3b8'}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <Text className={clsx(
              'text-xs mt-1',
              isActive ? 'text-sky-600 font-semibold' : 'text-slate-400',
            )}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default BottomTabBar;
