// =====================================================================
// app/(prefect)/(tabs)/_layout.jsx
// ---------------------------------------------------------------------
// Layout del grupo "(tabs)" del PREFECTO — define el <Tabs> navigator
// raíz con BottomTabBar como tabBar custom.
//
// Tabs del prefecto (según la imagen):
//   - home     → tab "Home"      (dashboard del prefecto).
//   - gate     → tab "Gate"      (control de puerta — placeholder).
//   - reports  → tab "Reports"   (reportes — placeholder).
//   - profile  → tab "Profile"   (perfil — placeholder).
// =====================================================================

// React.
import React from 'react';

// Navegación: <Tabs> de expo-router.
import { Tabs } from 'expo-router';

// Chrome compartido: BottomTabBar con PREFECT_TABS.
import BottomTabBar from '@/src/components/BottomTabBar';

// Tabs del prefecto.
import { PREFECT_TABS } from '@/src/constants/navigationTabs';

export default function PrefectTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <BottomTabBar {...props} tabs={PREFECT_TABS} />}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="gate" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
