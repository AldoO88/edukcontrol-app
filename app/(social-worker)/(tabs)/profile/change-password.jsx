// =====================================================================
// app/(social-worker)/(tabs)/profile/change-password.jsx
// ---------------------------------------------------------------------
// Ruta "change-password" del tab "Perfil" del trabajador social.
// Cambio de contraseña. Reutiliza el hook useChangePassword.
// Chrome: DashboardHeader + back button (drill-down pattern).
// =====================================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Lock, Eye, EyeOff } from 'lucide-react-native';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Hook del dashboard del trabajador social (datos de la escuela).
import { useAuth } from '@/src/hooks/useAuth';
import { useSocialWorkerDashboard } from '@/src/hooks/useSocialWorkerDashboard';

// Hook personalizado de cambio de contraseña.
import { useChangePassword } from '@/src/hooks/useChangePassword';

export default function SocialWorkerChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Datos del dashboard para el SchoolInfoCard compuesto.
  const { data: dashboardData } = useSocialWorkerDashboard();

  const school = useMemo(() => {
    if (!dashboardData?.school) return null;
    return {
      ...dashboardData.school,
      logo_url: dashboardData.school.logoUrl,
      current_school_year: dashboardData.school.cycle || null,
    };
  }, [dashboardData?.school, dashboardData?.currentSchoolYear]);

  const currentDate = dashboardData?.currentDate || '';

  const { values, errors, isSubmitting, handleChange, handleSubmit } = useChangePassword();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 bg-slate-50">
        <DashboardHeader />
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-2"
        teacher={dashboardData?.socialWorker}
        date={currentDate}
        user={user}
      />

      {/* HEADER */}
      <View className="flex-row items-center px-4 mt-4">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver al perfil"
          className="items-center justify-center -ml-2"
          style={{ padding: 8 }}
          hitSlop={8}
        >
          <ChevronLeft size={22} color="#0F172A" strokeWidth={2.25} />
        </Pressable>
        <Text className="flex-1 ml-1 text-slate-900" style={{ fontSize: 17, fontWeight: '700' }} numberOfLines={1}>
          Cambiar Contraseña
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* Info */}
        <View className="bg-sky-50 rounded-2xl p-4 mb-8">
          <Text className="text-sky-800 text-sm leading-5">
            Para cambiar tu contraseña, verifica tu contraseña actual y establece una nueva. La nueva contraseña debe tener al menos 8 caracteres.
          </Text>
        </View>

        {errors.general && (
          <View className="bg-rose-50 rounded-2xl p-4 mb-6">
            <Text className="text-rose-700 text-sm">{errors.general}</Text>
          </View>
        )}

        {/* Current password */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-slate-700 mb-2">Contraseña actual</Text>
          <View className={`flex-row items-center bg-white rounded-2xl px-4 py-3.5 ${errors.currentPassword ? 'border border-rose-500' : 'border border-slate-200'}`}>
            <Lock size={18} className="text-slate-400 mr-3" />
            <TextInput
              className="flex-1 text-slate-900 text-base"
              placeholder="Tu contraseña actual"
              placeholderTextColor="#94a3b8"
              value={values.currentPassword}
              onChangeText={(v) => handleChange('currentPassword', v)}
              secureTextEntry={!showCurrent}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
              {showCurrent ? <EyeOff size={18} className="text-slate-400" /> : <Eye size={18} className="text-slate-400" />}
            </TouchableOpacity>
          </View>
          {errors.currentPassword && <Text className="text-rose-500 text-xs mt-1.5">{errors.currentPassword}</Text>}
        </View>

        {/* New password */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-slate-700 mb-2">Nueva contraseña</Text>
          <View className={`flex-row items-center bg-white rounded-2xl px-4 py-3.5 ${errors.newPassword ? 'border border-rose-500' : 'border border-slate-200'}`}>
            <Lock size={18} className="text-slate-400 mr-3" />
            <TextInput
              className="flex-1 text-slate-900 text-base"
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#94a3b8"
              value={values.newPassword}
              onChangeText={(v) => handleChange('newPassword', v)}
              secureTextEntry={!showNew}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              {showNew ? <EyeOff size={18} className="text-slate-400" /> : <Eye size={18} className="text-slate-400" />}
            </TouchableOpacity>
          </View>
          {errors.newPassword && <Text className="text-rose-500 text-xs mt-1.5">{errors.newPassword}</Text>}
        </View>

        {/* Confirm password */}
        <View className="mb-8">
          <Text className="text-sm font-medium text-slate-700 mb-2">Confirmar nueva contraseña</Text>
          <View className={`flex-row items-center bg-white rounded-2xl px-4 py-3.5 ${errors.confirmPassword ? 'border border-rose-500' : 'border border-slate-200'}`}>
            <Lock size={18} className="text-slate-400 mr-3" />
            <TextInput
              className="flex-1 text-slate-900 text-base"
              placeholder="Repite tu nueva contraseña"
              placeholderTextColor="#94a3b8"
              value={values.confirmPassword}
              onChangeText={(v) => handleChange('confirmPassword', v)}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? <EyeOff size={18} className="text-slate-400" /> : <Eye size={18} className="text-slate-400" />}
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && <Text className="text-rose-500 text-xs mt-1.5">{errors.confirmPassword}</Text>}
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`rounded-2xl py-4 ${isSubmitting ? 'bg-slate-400' : 'bg-slate-900'}`}
        >
          <Text className="text-white text-center font-semibold text-base">
            {isSubmitting ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}