// =====================================================================
// IconButton.jsx
// ---------------------------------------------------------------------
// Botón circular con SOLO un icono. Pensado para: botón "volver",
// botones de acción compactos, toggles de visibilidad, etc.
// Reemplaza el TouchableOpacity + Icon + hitSlop repetido en cada
// header de pantalla.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: TouchableOpacity.
import { TouchableOpacity } from 'react-native';

// clsx.
import { clsx } from 'clsx';

// Props:
//   - icon: componente Lucide obligatorio (e.g. ChevronLeft, Eye).
//   - onPress: callback.
//   - size: 'sm' | 'md' | 'lg' | número. Define el área tappable.
//   - iconSize: tamaño del icono (default 24).
//   - color: color del icono (default slate-900 #0f172a).
//   - hitSlop: extiende el área tappable fuera de los bounds.
//   - className: clases extra.
//   - accessibilityLabel, accessibilityRole: a11y.
//   - background: 'transparent' | 'filled'. Default 'transparent'.
const IconButton = ({
  icon: Icon,
  onPress,
  size = 'md',
  iconSize = 24,
  color = '#0f172a',
  hitSlop = { top: 10, bottom: 10, left: 10, right: 10 },
  background = 'transparent',
  className = '',
  accessibilityLabel,
  accessibilityRole = 'button',
  ...rest
}) => {
  // Map de tamaño -> clases. sm = 32px, md = 40, lg = 48.
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  // Map de fondo. "filled" usa un gris claro para destacar el botón.
  const bgClasses = {
    transparent: '',
    filled: 'bg-slate-100 active:bg-slate-200 rounded-full',
  };

  // Si el caller pasa size como número, no aplicamos padding fijo.
  // Útil para botones que el caller quiere dimensionar manualmente.
  const isCustomSize = typeof size === 'number';

  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      // Concatenamos las clases base según props.
      className={clsx(
        isCustomSize ? '' : sizeClasses[size],
        bgClasses[background],
        className,
      )}
      // Si el tamaño es numérico, lo aplicamos como width/height.
      style={isCustomSize ? { width: size, height: size, alignItems: 'center', justifyContent: 'center' } : undefined}
      {...rest}
    >
      {/* El icono siempre se renderiza. */}
      {Icon && <Icon size={iconSize} color={color} strokeWidth={2} />}
    </TouchableOpacity>
  );
};

export default IconButton;
