// =====================================================================
// TextField.jsx
// ---------------------------------------------------------------------
// Input de texto con icono opcional. Encapsula el patrón
// View(flex-row) + Icon + TextInput que aparecía duplicado en
// LoginScreen y otros formularios.
// Soporta label superior, mensaje de error y estados deshabilitado.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text, TextInput.
import { View, Text, TextInput } from 'react-native';

// clsx.
import { clsx } from 'clsx';

// Props:
//   - label: texto del label (opcional).
//   - value, onChangeText: controlados.
//   - placeholder, placeholderTextColor: placeholder.
//   - icon: componente Lucide a la izquierda.
//   - error: string con mensaje de error. Si existe, se muestra
//     bajo el input y se cambia el borde a rose.
//   - disabled: bloquea la edición.
//   - rightSlot: nodo opcional que se renderiza a la derecha del
//     input (útil para el botón de mostrar/ocultar contraseña).
//   - containerClassName: clases extra del contenedor externo.
//   - className: clases extra del input.
//   - Resto de props del TextInput: keyboardType, autoCapitalize,
//     secureTextEntry, maxLength, accessibilityLabel, etc.
const TextField = ({
  label,
  value,
  onChangeText,
  placeholder,
  placeholderTextColor = '#94a3b8',
  icon: Icon = null,
  iconSize = 20,
  iconColor = '#64748b',
  error = null,
  disabled = false,
  rightSlot = null,
  containerClassName = '',
  inputClassName = '',
  ...rest
}) => {
  // Flag derivado para no repetir la condición.
  const hasError = Boolean(error);

  return (
    // Contenedor externo (con label).
    <View className={clsx('mb-4', containerClassName)}>
      {/* Label opcional arriba del input. */}
      {label && (
        <Text className="text-slate-700 text-sm font-semibold mb-2">
          {label}
        </Text>
      )}

      {/* Contenedor del input + icono + rightSlot. */}
      <View
        className={clsx(
          'flex-row items-center rounded-xl px-4 py-3.5',
          // Fondo gris muy claro (no blanco puro) para distinguir
          // del fondo de la tarjeta padre.
          'bg-slate-50',
          // Borde por defecto. Cambia a rose si hay error.
          hasError ? 'border border-rose-400' : 'border border-slate-200',
          // Reducir opacidad si está deshabilitado.
          disabled && 'opacity-60',
        )}
      >
        {/* Icono izquierdo. */}
        {Icon && <Icon size={iconSize} color={iconColor} strokeWidth={2} />}

        {/* Input de texto. flex-1 para ocupar el espacio restante. */}
        <TextInput
          // ml-3 solo si hay icono para no pegar el texto al borde.
          className={clsx(
            'flex-1 text-slate-900 text-base',
            Icon ? 'ml-3' : null,
            inputClassName,
          )}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          editable={!disabled}
          // Importante: paddingVertical 0 evita que iOS añada
          // padding extra que descuadra la altura.
          paddingVertical={0}
          {...rest}
        />

        {/* Slot derecho (e.g. botón de visibilidad de contraseña). */}
        {rightSlot}
      </View>

      {/* Mensaje de error opcional bajo el input. */}
      {hasError && (
        <Text className="text-rose-600 text-xs mt-1.5 font-medium">
          {error}
        </Text>
      )}
    </View>
  );
};

export default TextField;
