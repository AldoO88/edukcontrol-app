// =====================================================================
// app/(app)/_components/BottomTabBar.jsx
// ---------------------------------------------------------------------
// Bottom tab bar compartido por las pantallas del route group (app).
// Renderiza 5 tabs con icono + label, resaltando la tab activa según
// el segmento actual de la URL.
//
// Props:
//   - tabs: array opcional de tabs. Si no se pasa, usa DEFAULT_TABS
//     (las 5 tabs del rediseño: Inicio, Avisos, Conducta,
//     Calificaciones, Asistencia). Permite que pantallas con
//     navegación custom (e.g. teacher con tabs distintos)
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

// Iconos Lucide.
// Elegidos para que el icono CASE con el label de cada tab
// (mismo dominio semántico):
//   - Home:           "Inicio" (la casa es el entry point universal).
//   - Megaphone:      "Avisos" (el megáfono es el icono clásico
//                                de anuncios/comunicados).
//   - UserCheck:      "Conducta" (persona con checkmark → evaluación
//                                positiva del comportamiento del
//                                alumno, mucho más directo que un
//                                escudo genérico).
//   - GraduationCap:  "Calificaciones" (birrete académico → notas,
//                                       identidad de EdukControl).
//   - ClipboardCheck: "Asistencia" (clipboard con check → lista de
//                                    asistencia, el icono canónico
//                                    que cualquier padre reconoce
//                                    del kinder/primaria).
import {
  Home,
  Megaphone,
  UserCheck,
  GraduationCap,
  ClipboardCheck,
} from 'lucide-react-native';

// clsx para componer classNames condicionales.
import { clsx } from 'clsx';

// ---------------------------------------------------------------------
// DEFAULT_TABS
// ---------------------------------------------------------------------
// 5 tabs según el rediseño. Cada tab tiene:
//   - id: identificador único.
//   - label: texto que se muestra bajo el icono.
//   - icon: componente Lucide.
//   - route: ruta de Expo Router a la que navega.
//   - match: segmento de URL que marca esta tab como activa.
//
// IMPORTANTE: el `match` DEBE coincidir con el nombre del archivo
// en app/(app)/. Los nombres de ruta (y los ids de tab) van en
// INGLÉS igual que el resto del código; solo el `label` está en
// español porque es copy visible para el tutor.
// ---------------------------------------------------------------------
const DEFAULT_TABS = [
  { id: 'home',          label: 'Inicio',         icon: Home,            route: '/(app)/dashboard',      match: 'dashboard' },
  { id: 'announcements', label: 'Avisos',         icon: Megaphone,       route: '/(app)/announcements',  match: 'announcements' },
  { id: 'conduct',       label: 'Conducta',       icon: UserCheck,       route: '/(app)/conduct',        match: 'conduct' },
  { id: 'grades',        label: 'Calificaciones', icon: GraduationCap,   route: '/(app)/grades',         match: 'grades' },
  { id: 'attendance',    label: 'Asistencia',     icon: ClipboardCheck,  route: '/(app)/attendance',     match: 'attendance' },
];

const BottomTabBar = ({ tabs = DEFAULT_TABS }) => {
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
