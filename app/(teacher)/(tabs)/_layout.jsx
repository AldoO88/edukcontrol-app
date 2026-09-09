// =====================================================================
// app/(teacher)/(tabs)/_layout.jsx
// ---------------------------------------------------------------------
// Layout del grupo "(tabs)" — define el <Tabs> navigator raíz del
// (teacher) con TeacherBottomTabBar como tabBar custom. Es la raíz de
// la navegación por tabs del maestro.
//
// Pantallas del grupo (tabs):
//   - dashboard       → tab "Inicio"        (TeacherDashboard).
//   - groups          → tab "Mis Grupos"    (Stack anidado).
//   - grades          → tab "Calificaciones"(placeholder).
//   - profile         → tab "Perfil"        (placeholder).
//
// La screen de cada tab se auto-descubre del filesystem (Expo Router).
// El tabBar custom usa TeacherBottomTabBar (en src/components), que
// envuelve BottomTabBar y oculta la barra en drill-downs (matrix,
// today, students, student file). El resto de screens del (teacher)
// usan BottomTabBar directo, congruente con la convención del proyecto.
// =====================================================================

// React.
import React from 'react';

// Navegación: <Tabs> de expo-router.
import { Tabs } from 'expo-router';

// Chrome compartido: wrapper de BottomTabBar que oculta la barra
// en drill-downs del grupo (matrix / today / grades / students /
// student file). Mantiene la barra visible en top-level tabs + lista
// de grupos + group detail.
import TeacherBottomTabBar from '@/src/components/TeacherBottomTabBar';

export default function TeacherTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      // tabBar custom: delegamos al TeacherBottomTabBar que decide
      // cuándo ocultar la barra según la profundidad del router.
      tabBar={(props) => <TeacherBottomTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="groups" />
      <Tabs.Screen name="grades" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}