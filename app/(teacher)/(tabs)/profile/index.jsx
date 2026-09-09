// =====================================================================
// app/(teacher)/(tabs)/profile/index.jsx
// ---------------------------------------------------------------------
// Ruta "/profile" del tab "Perfil" del maestro. Pantalla de perfil
// personal con información del docente, preferencias y cerrar sesión.
//
// Estructura visual:
//
//   ┌────────────────────────────────────────┐
//   │ DashboardHeader + SchoolInfoCard       │  chrome compartido
//   ├────────────────────────────────────────┤
//   │ Profile card (foto, nombre, rol, ID,   │
//   │   email, nota de administración)       │
//   ├────────────────────────────────────────┤
//   │ SEGURIDAD Y CUENTA                     │
//   │ Cambiar Contraseña →                   │
//   ├────────────────────────────────────────┤
//   │ PREFERENCIAS                           │
//   │ Notificaciones [toggle]                │
//   │ Modo Oscuro    [toggle]                │
//   ├────────────────────────────────────────┤
//   │ SOPORTE                                │
//   │ Contactar a Soporte →                  │
//   │ Términos y Privacidad →                │
//   ├────────────────────────────────────────┤
//   │ Versión: 1.0.0                         │
//   │ [Cerrar Sesión]                        │
//   └────────────────────────────────────────┘
//
// TODO: cuando exista el endpoint GET /api/teacher/profile,
// reemplazar los datos mock por la respuesta del backend.
// =====================================================================

// React + hooks.
import React, { useState, useMemo } from 'react';

// Primitivas RN.
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

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Navegación.
import { useRouter } from 'expo-router';

// Iconos Lucide.
import {
  ChevronLeft,     // Back.
  Key,             // Cambiar contraseña.
  Bell,            // Notificaciones.
  Moon,            // Modo oscuro.
  MessageCircle,   // Soporte.
  Shield,          // Términos.
  LogOut,          // Cerrar sesión.
  FileText,        // PDF.
  Phone,           // Teléfono.
  Mail,            // Email.
} from 'lucide-react-native';

// Hook del dashboard docente (escuela + maestro).
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';

// Hook de autenticación (user + logout).
import { useAuth } from '@/src/hooks/useAuth';

// Helper para componer el nombre completo del maestro y el título
// dinámico (Prof./Profa. según `teacher.sex`).
import {
  getTeacherFullName,
  getTeacherTitle,
} from '@/src/utils/teacherName';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// ---------------------------------------------------------------------
// openURL: abre URLs (mailto:, https:, etc.) en web y native.
// En web usa window.open; en native usa Linking.openURL.
// Si falla (simulator sin app de correo), muestra un alert con la URL.
// ---------------------------------------------------------------------
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

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function TeacherProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ============================================================
  // DASHBOARD DATA
  // ============================================================
  const { data } = useTeacherDashboard();
  const { user, logout } = useAuth();
  // Un solo nombre canónico: fullName del backend, con fallback
  // defensivo en el helper. Reemplaza tanto `teacherName` (que se
  // mostraba incompleto, solo last_name) como `teacherFullName` (que
  // duplicaba lógica de fallback).
  const teacherFullName = getTeacherFullName(data?.teacher);
  const teacherTitle = getTeacherTitle(data?.teacher?.sex);
  const currentDate = data?.currentDate || 'Viernes, 14 de agosto';
  const roleLabel = user?.role === 'teacher' ? 'Docente' : user?.role || 'Docente';
  const school = useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.currentSchoolYear?.name || null,
    };
  }, [data?.school, data?.currentSchoolYear]);

  // ============================================================
  // ESTADO: preferencias (mock local — TODO: persistir en backend)
  // ============================================================
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <View className="flex-1 bg-slate-50">
      {/* ============================================================
          CHROME COMPARTIDO
          ============================================================ */}
      <DashboardHeader />
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-2"
        teacher={data?.teacher}
        date={currentDate}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* ============================================================
            PROFILE CARD
            ============================================================ */}
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
          {/* Avatar. */}
          <View className="items-center pt-6 pb-4">
            <View
              className="items-center justify-center"
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: '#DBEAFE',
                borderWidth: 3,
                borderColor: '#BFDBFE',
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: '800',
                  color: '#3B82F6',
                }}
              >
                {teacherFullName
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')}
              </Text>
            </View>
          </View>

          {/* Nombre. */}
          <Text
            className="text-center px-4"
            style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }}
          >
            {teacherTitle} {teacherFullName}
          </Text>

          {/* Rol + escuela. */}
          <Text
            className="text-center px-4 mt-1"
            style={{ fontSize: 13, fontWeight: '500', color: '#64748B' }}
          >
            {roleLabel} • {data?.school?.name || 'Escuela'}
          </Text>

          {/* ID + Email card. */}
          <View
            className="mx-6 mt-4 rounded-xl p-3"
            style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}
          >
            {/* Teléfono. */}
            <View className="flex-row items-center py-1.5">
              <Phone size={16} color="#64748B" strokeWidth={2} />
              <Text
                className="ml-3"
                style={{ fontSize: 13, fontWeight: '600', color: '#334155' }}
              >
                Tel: {data?.teacher?.phoneNumber || '—'}
              </Text>
            </View>
            {/* Divider. */}
            <View style={{ height: 1, backgroundColor: '#E2E8F0' }} />
            {/* Email. */}
            <View className="flex-row items-center py-1.5">
              <Mail size={16} color="#64748B" strokeWidth={2} />
              <Text
                className="ml-3"
                style={{ fontSize: 13, fontWeight: '600', color: '#334155' }}
              >
                {data?.teacher?.email || '—'}
              </Text>
            </View>
          </View>

          {/* Nota de administración. */}
          <Text
            className="text-center px-6 mt-4 pb-5"
            style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8', fontStyle: 'italic', lineHeight: 18 }}
          >
            Para modificar tu información oficial, contacta a la administración escolar.
          </Text>
        </View>

        {/* ============================================================
            SEGURIDAD Y CUENTA
            ============================================================ */}
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
            onPress={() => router.push('/(teacher)/(tabs)/profile/change-password')}
          />
        </View>

        {/* ============================================================
            PREFERENCIAS
            ============================================================ */}
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

        {/* ============================================================
            SOPORTE
            ============================================================ */}
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

        {/* ============================================================
            VERSIÓN
            ============================================================ */}
        <Text
          className="text-center mt-5"
          style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8' }}
        >
          Versión: 1.0.0
        </Text>

        {/* ============================================================
            CERRAR SESIÓN
            ============================================================ */}
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
    </View>
  );
}

// ---------------------------------------------------------------------
// SUBCOMPONENTES LOCALES
// ---------------------------------------------------------------------

// ProfileRow: fila reutilizable para items de perfil (icono + label +
// chevron o trailing custom). Usada en secciones de seguridad,
// preferencias y soporte.
const ProfileRow = ({ icon: Icon, iconBg, iconColor, label, trailing, onPress }) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    className="flex-row items-center px-4 py-3.5"
  >
    {/* Icono circular. */}
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

    {/* Label. */}
    <Text
      className="flex-1"
      style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}
    >
      {label}
    </Text>

    {/* Trailing (toggle o chevron). */}
    {trailing || (
      <Text style={{ fontSize: 16, color: '#CBD5E1' }}>›</Text>
    )}
  </Pressable>
);
