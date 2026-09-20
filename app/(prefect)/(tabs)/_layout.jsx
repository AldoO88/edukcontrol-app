// =====================================================================
// app/(prefect)/(tabs)/_layout.jsx
// ---------------------------------------------------------------------
// Layout del grupo "(tabs)" del PREFECTO — define el <Tabs> navigator
// raíz con PrefectBottomTabBar como tabBar custom.
//
// PrefectBottomTabBar oculta la barra en drill-downs (change-password).
//
// Tabs del prefecto (5 tabs):
//   - dashboard → tab "Inicio"   (dashboard del prefecto).
//   - groups    → tab "Grupos"   (lista de grupos → detalle).
//   - students  → tab "Alumnos"  (búsqueda de alumnos → ficha).
//   - teachers  → tab "Maestros" (lista de maestros → horario).
//   - profile   → tab "Perfil"   (perfil del prefecto).
//
// Avisos, Citatorios y Reportes viven fuera de (tabs)/ como Stack
// screens en el root _layout.jsx (son accesibles desde quick actions
// del dashboard, no desde la bottom tab bar).
// =====================================================================

// React.
import React from 'react';

// Navegación: <Tabs> de expo-router.
import { Tabs } from 'expo-router';

// Chrome compartido: PrefectBottomTabBar (oculta en drill-downs).
import PrefectBottomTabBar from '@/src/components/PrefectBottomTabBar';

export default function PrefectTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <PrefectBottomTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="groups" />
      <Tabs.Screen name="students" />
      <Tabs.Screen name="teachers" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
