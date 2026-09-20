// =====================================================================
// app/(director)/(tabs)/_layout.jsx
// ---------------------------------------------------------------------
// Layout del grupo "(tabs)" del DIRECTOR.
// =====================================================================

import React from 'react';
import { Tabs } from 'expo-router';
import DirectorBottomTabBar from '@/src/components/DirectorBottomTabBar';

export default function DirectorTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <DirectorBottomTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="groups" />
      <Tabs.Screen name="students" />
      <Tabs.Screen name="teachers" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
