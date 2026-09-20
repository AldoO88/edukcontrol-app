// =====================================================================
// src/components/PrefectBottomTabBar.jsx
// ---------------------------------------------------------------------
// Wrapper de BottomTabBar que oculta la barra cuando el prefecto está
// en un drill-down (change-password). Mantiene la barra visible en
// los top-level tabs.
// =====================================================================

import React from 'react';
import { useSegments } from 'expo-router';
import BottomTabBar from './BottomTabBar';
import { PREFECT_TABS } from '@/src/constants/navigationTabs';

const DRILL_DOWN_SEGMENTS = [
  'change-password',
];

export default function PrefectBottomTabBar(props) {
  const segments = useSegments();
  const shouldHide = segments.some((s) => DRILL_DOWN_SEGMENTS.includes(s));
  if (shouldHide) return null;
  return <BottomTabBar {...props} tabs={PREFECT_TABS} />;
}
