// =====================================================================
// app/(guardian)/profile.jsx
// ---------------------------------------------------------------------
// Pantalla de perfil del tutor/padre de familia.
// Muestra información personal, opción de cambiar contraseña,
// preferencias, soporte y cerrar sesión.
// =====================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Key,
  Bell,
  Moon,
  MessageCircle,
  Shield,
  LogOut,
  Phone,
  Mail,
  User,
} from 'lucide-react-native';

import { useGuardianDashboard } from '@/src/hooks/useGuardianDashboard';
import { useAuth } from '@/src/hooks/useAuth';
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';
import BottomTabBar from '@/src/components/BottomTabBar';

const openURL = async (url) => {
  if (Platform.OS === 'web') {
    window.open(url, '_blank');
    return;
  }
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Contacto', 'Correo: soporte@edukcontrol.com');
    }
  } catch {
    Alert.alert('Contacto', 'Correo: soporte@edukcontrol.com');
  }
};

export default function GuardianProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data } = useGuardianDashboard();
  const { user: authUser, logout } = useAuth();

  const guardianName = data?.user?.name || authUser?.name || 'Tutor';
  const guardianLastName = data?.user?.last_name || authUser?.last_name || '';
  const fullName = data?.user?.greeting || `${guardianName} ${guardianLastName}`.trim();

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <View className="flex-1 bg-slate-50">
      <DashboardHeader />
      <SchoolInfoCard
        school={data?.school}
        isLoading={!data?.school}
        className="mx-4 mt-2"
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* PROFILE CARD */}
        <View
          className="mx-4 mt-4 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: '#FFFFFF',
            shadowColor: '#0F172A',
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <View className="items-center pt-6 pb-4">
            <View
              className="items-center justify-center"
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: '#D1FAE5',
                borderWidth: 3,
                borderColor: '#A7F3D0',
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: '800',
                  color: '#059669',
                }}
              >
                {fullName
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')}
              </Text>
            </View>
          </View>

          <Text
            className="text-center px-4"
            style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }}
          >
            {fullName}
          </Text>

          <Text
            className="text-center px-4 mt-1"
            style={{ fontSize: 13, fontWeight: '500', color: '#64748B' }}
          >
            Padre de Familia • {data?.school?.name || 'Escuela'}
          </Text>

          <View
            className="mx-6 mt-4 rounded-xl p-3"
            style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}
          >
            <View className="flex-row items-center py-1.5">
              <Phone size={16} color="#64748B" strokeWidth={2} />
              <Text
                className="ml-3"
                style={{ fontSize: 13, fontWeight: '600', color: '#334155' }}
              >
                Tel: {data?.user?.phone_number || authUser?.phoneNumber || '—'}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: '#E2E8F0' }} />
            <View className="flex-row items-center py-1.5">
              <Mail size={16} color="#64748B" strokeWidth={2} />
              <Text
                className="ml-3"
                style={{ fontSize: 13, fontWeight: '600', color: '#334155' }}
              >
                {data?.user?.email || authUser?.email || '—'}
              </Text>
            </View>
          </View>

          <Text
            className="text-center px-6 mt-4 pb-5"
            style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8', fontStyle: 'italic', lineHeight: 18 }}
          >
            Para modificar tu información oficial, contacta a la administración escolar.
          </Text>
        </View>

        {/* SEGURIDAD Y CUENTA */}
        <Text
          className="mx-4 mt-5 mb-2"
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Seguridad y Cuenta
        </Text>
        <View
          className="mx-4 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: '#FFFFFF',
            shadowColor: '#0F172A',
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <ProfileRow
            icon={Key}
            iconBg="#EFF6FF"
            iconColor="#3B82F6"
            label="Cambiar Contraseña"
            onPress={() => router.push('/(guardian)/profile/change-password')}
          />
        </View>

        {/* PREFERENCIAS */}
        <Text
          className="mx-4 mt-5 mb-2"
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Preferencias
        </Text>
        <View
          className="mx-4 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: '#FFFFFF',
            shadowColor: '#0F172A',
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <ProfileRow
            icon={Bell}
            iconBg="#FEF3C7"
            iconColor="#D97706"
            label="Notificaciones"
            trailing={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
                thumbColor={notifications ? '#0284C7' : '#F1F5F9'}
              />
            }
          />
          <View className="mx-4" style={{ height: 1, backgroundColor: '#F1F5F9' }} />
          <ProfileRow
            icon={Moon}
            iconBg="#EDE9FE"
            iconColor="#7C3AED"
            label="Modo Oscuro"
            trailing={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
                thumbColor={darkMode ? '#0284C7' : '#F1F5F9'}
              />
            }
          />
        </View>

        {/* SOPORTE */}
        <Text
          className="mx-4 mt-5 mb-2"
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Soporte
        </Text>
        <View
          className="mx-4 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: '#FFFFFF',
            shadowColor: '#0F172A',
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <ProfileRow
            icon={MessageCircle}
            iconBg="#F0FDF4"
            iconColor="#16A34A"
            label="Contactar a Soporte"
            onPress={() => openURL('mailto:soporte@edukcontrol.com?subject=Soporte%20EdukControl')}
          />
          <View className="mx-4" style={{ height: 1, backgroundColor: '#F1F5F9' }} />
          <ProfileRow
            icon={Shield}
            iconBg="#F0F9FF"
            iconColor="#0284C7"
            label="Términos y Privacidad"
            onPress={() => openURL('https://edukcontrol.com/terminos')}
          />
        </View>

        {/* VERSIÓN */}
        <Text
          className="text-center mt-5"
          style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8' }}
        >
          Versión: 1.0.0
        </Text>

        {/* CERRAR SESIÓN */}
        <Pressable
          className="mx-4 mt-4 rounded-2xl overflow-hidden"
          style={{
            borderWidth: 1.5,
            borderColor: '#FCA5A5',
            backgroundColor: '#FEF2F2',
          }}
          onPress={() => {
            logout();
            router.replace('/');
          }}
        >
          <View className="flex-row items-center justify-center py-3.5">
            <LogOut size={18} color="#DC2626" strokeWidth={2.25} />
            <Text
              className="ml-2"
              style={{ fontSize: 15, fontWeight: '700', color: '#DC2626' }}
            >
              Cerrar Sesión
            </Text>
          </View>
        </Pressable>
      </ScrollView>

      <BottomTabBar />
    </View>
  );
}

const ProfileRow = ({ icon: Icon, iconBg, iconColor, label, trailing, onPress }) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    className="flex-row items-center px-4 py-3.5"
  >
    <View
      className="items-center justify-center mr-3"
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: iconBg,
      }}
    >
      <Icon size={18} color={iconColor} strokeWidth={2.25} />
    </View>
    <Text
      className="flex-1"
      style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}
    >
      {label}
    </Text>
    {trailing || (
      <Text style={{ fontSize: 16, color: '#CBD5E1' }}>›</Text>
    )}
  </Pressable>
);
