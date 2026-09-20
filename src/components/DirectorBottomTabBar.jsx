// =====================================================================
// src/components/DirectorBottomTabBar.jsx
// ---------------------------------------------------------------------
// Wrapper de BottomTabBar que oculta la barra cuando el director
// está en un drill-down (change-password, student-health, etc.).
// Mantiene la barra visible en los top-level tabs.
// =====================================================================

import React from 'react';
import { useSegments } from 'expo-router';
import BottomTabBar from './BottomTabBar';
import { DIRECTOR_TABS } from '@/src/constants/navigationTabs';

const DRILL_DOWN_SEGMENTS = [
  'change-password',
  'student-health',
];

export default function DirectorBottomTabBar(props) {
  const segments = useSegments();
  const shouldHide = segments.some((s) => DRILL_DOWN_SEGMENTS.includes(s));
  if (shouldHide) return null;
  return <BottomTabBar {...props} tabs={DIRECTOR_TABS} />;
}
