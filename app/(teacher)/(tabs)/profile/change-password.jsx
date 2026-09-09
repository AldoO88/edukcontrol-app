// Pantalla de Cambio de Contraseña
// Permite al usuario cambiar su contraseña actual.
// Solo tiene sentido si el usuario está autenticado.
// Flujo: validar contraseña actual → confirmar nueva → enviar al backend.
// Ejemplo de custom hook: lógica encapsulada en useChangePassword.
// Chrome: DashboardHeader + SchoolInfoCard + back button (patrón drill-down).

import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Lock, Eye, EyeOff } from 'lucide-react-native';

// Hook del dashboard docente (escuela + maestro).
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';

// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Hook personalizado de cambio de contraseña.
import { useChangePassword } from '@/src/hooks/useChangePassword';

// =====================================================================
// ChangePasswordScreen
// ---------------------------------------------------------------------
// Formulario de 3 campos:
//   1. Contraseña actual
//   2. Nueva contraseña
//   3. Confirmar nueva contraseña
// Usa useChangePassword para manejar estado, validación y envío.
// Sigue el patrón chrome de otras drill-down screens (citations/[id].jsx).
// =====================================================================
export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Datos del dashboard para el SchoolInfoCard compuesto.
  const { data } = useTeacherDashboard();

  // Normalizar school de camelCase (logoUrl) a snake_case (logo_url)
  // para que SchoolInfoCard reciba el shape que espera.
  const school = useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.currentSchoolYear?.name || null,
    };
  }, [data?.school, data?.currentSchoolYear]);

  // Hook personalizado: encapsula todo el estado y lógica.
  const { values, errors, isSubmitting, handleChange, handleSubmit } =
    useChangePassword();

  // Estado local solo para toggle de visibilidad de passwords.
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <View className="flex-1 bg-slate-50">
      {/* ============================================================
          CHROME COMPARTIDO (brand + school card)
          ============================================================ */}
      <DashboardHeader />
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-2"
        teacher={data?.teacher}
        date={data?.currentDate}
      />

      {/* ============================================================
          HEADER: back + título
          ============================================================ */}
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

        <Text
          className="flex-1 ml-1 text-slate-900"
          style={{ fontSize: 17, fontWeight: '700' }}
          numberOfLines={1}
        >
          Cambiar Contraseña
        </Text>
      </View>

      {/* ============================================================
          SCROLL CONTENT
          ============================================================ */}
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
        {/* Mensaje informativo */}
        <View className="bg-sky-50 rounded-2xl p-4 mb-8">
          <Text className="text-sky-800 text-sm leading-5">
            Para cambiar tu contraseña, primero verifica tu contraseña actual
            y luego establece una nueva. La nueva contraseña debe tener al
            menos 8 caracteres.
          </Text>
        </View>

        {/* Error general del backend */}
        {errors.general && (
          <View className="bg-rose-50 rounded-2xl p-4 mb-6">
            <Text className="text-rose-700 text-sm">{errors.general}</Text>
          </View>
        )}

        {/* Campo 1: Contraseña actual */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-slate-700 mb-2">
            Contraseña actual
          </Text>
          <View
            className={`flex-row items-center bg-white rounded-2xl px-4 py-3.5 ${
              errors.currentPassword
                ? 'border border-rose-500'
                : 'border border-slate-200'
            }`}
          >
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
              {showCurrent ? (
                <EyeOff size={18} className="text-slate-400" />
              ) : (
                <Eye size={18} className="text-slate-400" />
              )}
            </TouchableOpacity>
          </View>
          {errors.currentPassword && (
            <Text className="text-rose-500 text-xs mt-1.5">
              {errors.currentPassword}
            </Text>
          )}
        </View>

        {/* Campo 2: Nueva contraseña */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-slate-700 mb-2">
            Nueva contraseña
          </Text>
          <View
            className={`flex-row items-center bg-white rounded-2xl px-4 py-3.5 ${
              errors.newPassword
                ? 'border border-rose-500'
                : 'border border-slate-200'
            }`}
          >
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
              {showNew ? (
                <EyeOff size={18} className="text-slate-400" />
              ) : (
                <Eye size={18} className="text-slate-400" />
              )}
            </TouchableOpacity>
          </View>
          {errors.newPassword && (
            <Text className="text-rose-500 text-xs mt-1.5">
              {errors.newPassword}
            </Text>
          )}
        </View>

        {/* Campo 3: Confirmar contraseña */}
        <View className="mb-8">
          <Text className="text-sm font-medium text-slate-700 mb-2">
            Confirmar nueva contraseña
          </Text>
          <View
            className={`flex-row items-center bg-white rounded-2xl px-4 py-3.5 ${
              errors.confirmPassword
                ? 'border border-rose-500'
                : 'border border-slate-200'
            }`}
          >
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
              {showConfirm ? (
                <EyeOff size={18} className="text-slate-400" />
              ) : (
                <Eye size={18} className="text-slate-400" />
              )}
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text className="text-rose-500 text-xs mt-1.5">
              {errors.confirmPassword}
            </Text>
          )}
        </View>

        {/* Botón de envío */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`rounded-2xl py-4 ${
            isSubmitting ? 'bg-slate-400' : 'bg-slate-900'
          }`}
        >
          <Text className="text-white text-center font-semibold text-base">
            {isSubmitting ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
