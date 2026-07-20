// =====================================================================
// Button.jsx
// ---------------------------------------------------------------------
// Botón primario reutilizable. Reemplaza el patrón TouchableOpacity +
// Text + icono + ActivityIndicator que aparecía duplicado en cada
// pantalla. Variantes: primary | secondary | danger | ghost.
// Tiene estado de loading integrado (muestra spinner + texto).
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: TouchableOpacity, View, Text, ActivityIndicator.
import { TouchableOpacity, View, Text, ActivityIndicator } from 'react-native';

// clsx para concatenar classNames condicionalmente.
import { clsx } from 'clsx';

// Mapa de variantes -> clases. Centralizarlo permite cambiar el
// estilo de todos los botones tocando un solo lugar.
const VARIANT_CLASSES = {
  primary: 'bg-slate-900 active:bg-slate-800',
  sky: 'bg-sky-600 active:bg-sky-700',
  secondary: 'bg-white border border-slate-200 active:bg-slate-50',
  danger: 'bg-rose-500 active:bg-rose-600',
  ghost: 'bg-transparent',
};

// Mapa de variantes -> color del texto. Mapeo paralelo para que
// cambiar la variante cambie también el color del texto coherente.
const VARIANT_TEXT = {
  primary: 'text-white',
  sky: 'text-white',
  secondary: 'text-slate-900',
  danger: 'text-white',
  ghost: 'text-sky-600',
};

// Componente. Acepta:
//   - title: string obligatorio con el texto del botón.
//   - onPress: callback al pulsar.
//   - loading: boolean. Si true, muestra spinner y deshabilita.
//   - disabled: boolean. Si true, baja la opacidad y deshabilita.
//   - variant: 'primary' | 'secondary' | 'danger' | 'ghost'.
//   - icon: componente Lucide opcional que se renderiza a la izquierda.
//   - iconSize, iconColor: props del icono.
//   - className: clases extra de NativeWind.
//   - style: estilos extra.
//   - accessibilityLabel, testID, etc.: props estándar.
const Button = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon: Icon = null,
  iconSize = 20,
  iconColor,
  className = '',
  style,
  ...rest
}) => {
  // Determinamos el color del icono: si no se pasa, derivamos
  // según la variante. Esto evita que el caller tenga que recordar
  // pasar el color cada vez.
  const resolvedIconColor = iconColor || (variant === 'primary' || variant === 'sky' || variant === 'danger' ? '#ffffff' : '#0f172a');

  // Flag derivado: el botón está inactivo si loading o disabled.
  // Lo calculamos una vez para no repetir la lógica en varios sitios.
  const isInactive = loading || disabled;

  return (
    <TouchableOpacity
      // onPress se ignora si el botón está inactivo. El operador ||
      // cortocircuita: si isInactive, no se ejecuta onPress.
      onPress={isInactive ? undefined : onPress}
      // disabled es la prop nativa que React Native respeta.
      disabled={isInactive}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      className={clsx(
        // Base común a todos los botones.
        'rounded-xl py-4 px-6 flex-row items-center justify-center',
        // Variante.
        VARIANT_CLASSES[variant],
        // Clases externas.
        className,
      )}
      style={[
        // Sombra sutil por defecto. Se sobreescribe si el caller
        // pasa style con shadow* explícito.
        {
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 3,
        },
        // Opacidad reducida cuando está inactivo.
        { opacity: isInactive ? 0.6 : 1 },
        // Estilos del caller.
        style,
      ]}
      {...rest}
    >
      {/* Si loading, mostramos spinner en lugar del icono. */}
      {loading ? (
        <ActivityIndicator
          // Color del spinner coherente con la variante.
          color={variant === 'primary' || variant === 'sky' || variant === 'danger' ? '#ffffff' : '#0f172a'}
          size="small"
        />
      ) : Icon ? (
        // Si hay icono definido, lo mostramos.
        <Icon size={iconSize} color={resolvedIconColor} strokeWidth={2.5} />
      ) : null}

      {/* Texto del botón. ml-2 si hay icono/spinner para separar. */}
      {(title || loading) && (
        <Text
          className={clsx(
            'font-bold text-base ml-2',
            // Color del texto según variante.
            VARIANT_TEXT[variant],
          )}
        >
          {/* Si loading, podemos mostrar un texto distinto (loadingText)
              o el mismo title. Por defecto usamos title. */}
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
