// =====================================================================
// src/components/TeacherBottomTabBar.jsx
// ---------------------------------------------------------------------
// Wrapper de BottomTabBar que oculta la barra cuando el usuario está en
// un drill-down del grupo (matrix / today / grades / students /
// student file / change-password). Mantiene la barra visible en:
//   - Top-level tabs (dashboard, groups, grades, profile).
//   - Lista de grupos (groups/index).
//   - Group detail (groups/[groupId]/index).
//
// Patrón iOS estándar: tab bar oculta en focus tasks, visible en
// navigation screens. Para cambiar de tab el usuario hace back hasta
// un nivel que muestre la barra.
//
// Detección vía useSegments() de expo-router (current path del
// router). Los segmentos típicos son:
//   - dashboard           → ['(teacher)', '(tabs)', 'dashboard']
//   - groups list         → ['(teacher)', '(tabs)', 'groups']
//   - group detail        → ['(teacher)', '(tabs)', 'groups', '[groupId]']
//   - matrix / today      → ..., 'groups', '[groupId]', 'attendance' | 'today'
//   - grades (tab)        → ['(teacher)', '(tabs)', 'grades']
//   - grades (drill-down) → ..., 'groups', '[groupId]', 'grades'
//   - students            → ..., 'groups', '[groupId]', 'students'
//   - student file        → ..., 'groups', '[groupId]', 'students', '[studentId]'
//   - change-password     → ..., 'profile', 'change-password'
//
// Si cualquier segmento matchea drillDownSegments → ocultar.
// =====================================================================

// React.
import React from 'react';

// Expo Router.
import { useSegments } from 'expo-router';

// Componentes y data compartidos.
import BottomTabBar from './BottomTabBar';
import { TEACHER_TABS } from '@/src/constants/navigationTabs';

// Segmentos que indican "drill-down del grupo" (focus task).
// Cualquier nivel de navegación dentro de groups/[groupId]/que NO
// sea el index se considera focus task y oculta la barra.
const DRILL_DOWN_SEGMENTS = [
  'attendance',     // matrix + today.
  'grades',         // grade entry (groups/[groupId]/grades).
  'students',       // lista de alumnos.
  '[studentId]',    // file del alumno.
  'change-password', // cambio de contraseña (profile/change-password).
];

export default function TeacherBottomTabBar(props) {
  const segments = useSegments();

  // Ocultamos la barra si el usuario está en un drill-down.
  const shouldHide = segments.some((s) =>
    DRILL_DOWN_SEGMENTS.includes(s),
  );

  // EXCEPCIÓN: el tab "Calificaciones" (grades) es un top-level tab.
  // Si 'grades' es el ÚLTIMO segmento (no hay nada después), es el tab
  // y NO ocultamos la barra. Si hay segmentos después (grades/[groupId]),
  // es un drill-down y SÍ ocultamos.
  const gradesIdx = segments.indexOf('grades');
  const isGradesTab =
    gradesIdx !== -1 && gradesIdx === segments.length - 1;

  // También ocultamos si estamos en groups/[groupId]/grades
  // (sub-ruta del grupo, NO el tab de calificaciones).
  const isGroupGrades =
    segments.includes('groups') && segments.includes('grades');

  if ((shouldHide && !isGradesTab) || isGroupGrades) {
    return null;
  }

  // En cualquier otro nivel (dashboard, groups list, group detail,
  // top-level grades/profile) renderizamos la barra normal.
  return <BottomTabBar {...props} tabs={TEACHER_TABS} />;
}