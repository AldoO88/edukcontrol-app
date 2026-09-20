// =====================================================================
// app/(social-worker)/(tabs)/_layout.jsx
// ---------------------------------------------------------------------
// Layout del grupo "(tabs)" del TRABAJADOR SOCIAL.
// =====================================================================

import React from 'react';
import { Tabs } from 'expo-router';
import SocialWorkerBottomTabBar from '@/src/components/SocialWorkerBottomTabBar';

export default function SocialWorkerTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <SocialWorkerBottomTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="groups" />
      <Tabs.Screen name="students" />
      <Tabs.Screen name="teachers" />
      <Tabs.Screen name="expediente" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
