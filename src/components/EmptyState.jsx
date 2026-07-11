// =====================================================================
// EmptyState.jsx
// ---------------------------------------------------------------------
// Estado vacío reutilizable. Aparece como ListEmptyComponent en
// FlatList, o como pantalla cuando no hay datos. Centraliza el
// patrón "icono grande + texto centrado".
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text.
import { View, Text } from 'react-native';

// clsx.
import { clsx } from 'clsx';

// Props:
//   - icon: componente Lucide (e.g. Megaphone, Inbox).
//   - title: string principal.
//   - message: string secundario (opcional).
//   - iconSize: tamaño del icono. Default 48.
//   - className: clases extra para el contenedor.
const EmptyState = ({
  icon: Icon = null,
  title = 'No hay datos',
  message = null,
  iconSize = 48,
  iconColor = '#cbd5e1', // slate-300
  className = '',
}) => {
  return (
    <View className={clsx('items-center justify-center py-12 px-6', className)}>
      {Icon && <Icon size={iconSize} color={iconColor} strokeWidth={1.5} />}
      <Text className="text-slate-400 text-sm mt-3 font-medium text-center">
        {title}
      </Text>
      {message && (
        <Text className="text-slate-400 text-xs mt-1 text-center">
          {message}
        </Text>
      )}
    </View>
  );
};

export default EmptyState;
