// =====================================================================
// app/(director)/_layout.jsx
// ---------------------------------------------------------------------
// Layout del ROUTE GROUP "(director)" — pantallas del DIRECTOR.
// =====================================================================

import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';

function RootSplash() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50">
      <ActivityIndicator size="large" color="#0f172a" />
      <Text className="text-slate-500 text-sm mt-4 font-medium">
        Cargando EdukControl...
      </Text>
    </View>
  );
}

export default function DirectorLayout() {
  const { user, isLoading } = useAuth();

  usePushNotifications(!!user);

  if (isLoading) {
    return <RootSplash />;
  }

  if (!user) {
    return <Redirect href="/" />;
  }

  if (user?.role === 'teacher') {
    return <Redirect href="/(teacher)/dashboard" />;
  }
  if (user?.role === 'tutor') {
    return <Redirect href="/(guardian)/dashboard" />;
  }

  return (
    <Stack screenOptions={{ animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="announcements" options={{ headerShown: false }} />
      <Stack.Screen name="citations" options={{ headerShown: false }} />
      <Stack.Screen name="reports" options={{ headerShown: false }} />
      <Stack.Screen name="exit-passes" options={{ headerShown: false }} />
      <Stack.Screen name="attendance-summary" options={{ headerShown: false }} />
      <Stack.Screen name="justificantes" options={{ headerShown: false }} />
      <Stack.Screen name="announcements/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="citations/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="reports/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="exit-passes/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="groups/[groupId]" options={{ headerShown: false }} />
      <Stack.Screen name="students/[studentId]" options={{ headerShown: false }} />
      <Stack.Screen name="student-health/[studentId]" options={{ headerShown: false }} />
      <Stack.Screen name="teachers/[teacherId]" options={{ headerShown: false }} />
    </Stack>
  );
}
