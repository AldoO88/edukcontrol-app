// =====================================================================
// app/(guardian)/profile/change-password.jsx
// ---------------------------------------------------------------------
// Formulario de cambio de contraseña para el tutor/padre de familia.
// Reutiliza el hook useChangePassword (role-agnostic).
// =====================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Lock, Eye, EyeOff } from 'lucide-react-native';

import { useGuardianDashboard } from '@/src/hooks/useGuardianDashboard';
import { useChangePassword } from '@/src/hooks/useChangePassword';
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import BottomTabBar from '@/src/components/BottomTabBar';

export default function GuardianChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data } = useGuardianDashboard();

  const { values, errors, isSubmitting, handleChange, handleSubmit } =
    useChangePassword();

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
          school={data?.school}
          isLoading={!data?.school}
          className="mx-4 mt-2"
        />

        <View className="flex-row items-center px-4 mt-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{ backgroundColor: '#F1F5F9' }}
          >
            <ChevronLeft size={20} color="#0F172A" strokeWidth={2.5} />
          </Pressable>
          <Text
            className="ml-3"
            style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}
          >
            Cambiar Contraseña
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: insets.bottom + 24,
          }}
        >
          {errors.general && (
            <View
              className="rounded-2xl p-4 mb-6"
              style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#DC2626' }}>
                {errors.general}
              </Text>
            </View>
          )}

          <View
            className="rounded-2xl p-5"
            style={{
              backgroundColor: '#FFFFFF',
              shadowColor: '#0F172A',
              shadowOpacity: 0.06,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <View className="mb-4">
              <Text
                style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}
              >
                Contraseña Actual
              </Text>
              <View
                className="flex-row items-center rounded-xl px-3"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: errors.currentPassword ? '#FCA5A5' : '#E2E8F0',
                }}
              >
                <Lock size={18} color="#94A3B8" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-2"
                  style={{ paddingVertical: 14, fontSize: 14, color: '#0F172A' }}
                  placeholder="Ingresa tu contraseña actual"
                  placeholderTextColor="#94A3B8"
                  value={values.currentPassword}
                  onChangeText={(v) => handleChange('currentPassword', v)}
                  secureTextEntry={!showCurrent}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? (
                    <EyeOff size={18} color="#94A3B8" strokeWidth={2} />
                  ) : (
                    <Eye size={18} color="#94A3B8" strokeWidth={2} />
                  )}
                </Pressable>
              </View>
              {errors.currentPassword && (
                <Text className="mt-1.5 ml-1" style={{ fontSize: 12, fontWeight: '500', color: '#DC2626' }}>
                  {errors.currentPassword}
                </Text>
              )}
            </View>

            <View className="mb-4">
              <Text
                style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}
              >
                Nueva Contraseña
              </Text>
              <View
                className="flex-row items-center rounded-xl px-3"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: errors.newPassword ? '#FCA5A5' : '#E2E8F0',
                }}
              >
                <Lock size={18} color="#94A3B8" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-2"
                  style={{ paddingVertical: 14, fontSize: 14, color: '#0F172A' }}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor="#94A3B8"
                  value={values.newPassword}
                  onChangeText={(v) => handleChange('newPassword', v)}
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowNew(!showNew)}>
                  {showNew ? (
                    <EyeOff size={18} color="#94A3B8" strokeWidth={2} />
                  ) : (
                    <Eye size={18} color="#94A3B8" strokeWidth={2} />
                  )}
                </Pressable>
              </View>
              {errors.newPassword && (
                <Text className="mt-1.5 ml-1" style={{ fontSize: 12, fontWeight: '500', color: '#DC2626' }}>
                  {errors.newPassword}
                </Text>
              )}
            </View>

            <View className="mb-2">
              <Text
                style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}
              >
                Confirmar Contraseña
              </Text>
              <View
                className="flex-row items-center rounded-xl px-3"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: errors.confirmPassword ? '#FCA5A5' : '#E2E8F0',
                }}
              >
                <Lock size={18} color="#94A3B8" strokeWidth={2} />
                <TextInput
                  className="flex-1 ml-2"
                  style={{ paddingVertical: 14, fontSize: 14, color: '#0F172A' }}
                  placeholder="Repite la nueva contraseña"
                  placeholderTextColor="#94A3B8"
                  value={values.confirmPassword}
                  onChangeText={(v) => handleChange('confirmPassword', v)}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? (
                    <EyeOff size={18} color="#94A3B8" strokeWidth={2} />
                  ) : (
                    <Eye size={18} color="#94A3B8" strokeWidth={2} />
                  )}
                </Pressable>
              </View>
              {errors.confirmPassword && (
                <Text className="mt-1.5 ml-1" style={{ fontSize: 12, fontWeight: '500', color: '#DC2626' }}>
                  {errors.confirmPassword}
                </Text>
              )}
            </View>
          </View>

          <Pressable
            className="mt-4 rounded-2xl overflow-hidden"
            style={{
              backgroundColor: isSubmitting ? '#93C5FD' : '#0284C7',
              shadowColor: '#0284C7',
              shadowOpacity: isSubmitting ? 0 : 0.25,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 3 },
              elevation: isSubmitting ? 0 : 4,
            }}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <View className="flex-row items-center justify-center py-4">
              <Lock size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text
                className="ml-2"
                style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}
              >
                {isSubmitting ? 'Cambiando contraseña...' : 'Guardar Nueva Contraseña'}
              </Text>
            </View>
          </Pressable>
        </ScrollView>

        <BottomTabBar />
      </View>
    </KeyboardAvoidingView>
  );
}
