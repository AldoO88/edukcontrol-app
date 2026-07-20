// =====================================================================
// ScreenHeader.jsx
// ---------------------------------------------------------------------
// Header superior con botón "volver" + título + slot derecho opcional.
// Reemplaza el patrón repetido en AnnouncementsScreen,
// AttendanceHistory, AttendanceCheck, GradesUpload, SendMessage.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN.
import { View, Text } from 'react-native';

// Hook de navegación (expo-router). Reemplaza al useNavigation
// de @react-navigation/native desde la migración a Expo Router.
// router.back() es el equivalente exacto de navigation.goBack().
import { useRouter } from 'expo-router';

// Sub-componentes.
import IconButton from './IconButton';

// Icono de volver.
import { ChevronLeft } from 'lucide-react-native';

// Props:
//   - title: string con el título del header.
//   - subtitle: string opcional (texto pequeño bajo el título).
//   - icon: icono a la izquierda del título (opcional, e.g. Megaphone).
//   - rightSlot: nodo opcional que se renderiza a la derecha
//     (e.g. botón "Guardar").
//   - showBack: boolean. Si true (default), muestra el botón volver.
//   - onBack: callback custom. Si no se pasa, usa navigation.goBack().
//   - background: 'white' (default) | 'transparent'.
//   - className: clases extra para el contenedor.
const ScreenHeader = ({
  title,
  subtitle = null,
  icon: Icon = null,
  rightSlot = null,
  showBack = true,
  onBack = null,
  background = 'white',
  className = '',
}) => {
  // useRouter siempre se llama (regla de hooks), aunque no
  // lo usemos si onBack está definido.
  const router = useRouter();

  // Handler de back: usa el custom si existe, si no router.back.
  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack();
    } else if (router && typeof router.back === 'function') {
      router.back();
    }
  };

  // Background class. 'transparent' deja pasar el color del padre.
  const bgClass = background === 'transparent' ? 'bg-transparent' : 'bg-white border-b border-slate-100';

  return (
    <View className={`${bgClass} px-4 py-3 flex-row items-center ${className}`}>
      {/* Botón de volver opcional. */}
      {showBack && (
        <IconButton
          icon={ChevronLeft}
          onPress={handleBack}
          accessibilityLabel="Volver"
          className="-ml-2"
        />
      )}

      {/* Contenedor central: icono + título + subtítulo. flex-1
          para ocupar el espacio disponible y empujar rightSlot al
          borde derecho. */}
      <View className="flex-1 ml-2 flex-row items-center">
        {/* Icono a la izquierda del título (e.g. Megaphone). */}
        {Icon && <Icon size={20} color="#0f172a" strokeWidth={2.25} />}

        {/* Contenedor vertical para título + subtítulo. */}
        <View className={`${Icon ? 'ml-2' : ''} flex-1`}>
          <Text
            className="text-slate-900 text-lg font-bold"
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text className="text-slate-500 text-xs" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {/* Slot derecho (e.g. botón "Guardar"). */}
      {rightSlot}
    </View>
  );
};

export default ScreenHeader;
