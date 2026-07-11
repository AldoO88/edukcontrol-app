// =====================================================================
// RecipientItem.jsx
// ---------------------------------------------------------------------
// Fila seleccionable de destinatario (checkbox visual). Encapsula
// el patrón "icono check/user + nombre" usado en SendMessageScreen.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text, TouchableOpacity.
import { View, Text, TouchableOpacity } from 'react-native';

// clsx.
import { clsx } from 'clsx';

// Iconos.
import { Check, User } from 'lucide-react-native';

// Props:
//   - name: string con el nombre del destinatario.
//   - isSelected: boolean.
//   - isLast: boolean. Si true, no dibuja border-b.
//   - onPress: callback al pulsar.
const RecipientItem = ({ name, isSelected, isLast, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={clsx(
        'flex-row items-center py-3',
        !isLast && 'border-b border-slate-100',
      )}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={name}
    >
      {/* Checkbox visual. */}
      <View
        className={clsx(
          'p-1.5 rounded mr-3',
          isSelected ? 'bg-sky-500' : 'bg-slate-100',
        )}
      >
        {isSelected ? (
          <Check size={16} color="#ffffff" strokeWidth={3} />
        ) : (
          <User size={16} color="#64748b" strokeWidth={2.25} />
        )}
      </View>

      {/* Nombre del destinatario. */}
      <Text
        className={clsx(
          'flex-1 text-sm',
          isSelected ? 'text-slate-900 font-semibold' : 'text-slate-700',
        )}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
};

export default RecipientItem;
