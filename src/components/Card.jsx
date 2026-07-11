// =====================================================================
// Card.js
// ---------------------------------------------------------------------
// Contenedor visual reutilizable: tarjeta blanca con bordes
// redondeados y sombra multiplataforma (iOS + Android). Es el
// "átomo" de UI más usado en EdukControl; cualquier información
// modular (listas, formularios, KPIs) se renderiza dentro de un
// <Card> para garantizar consistencia visual y jerarquía.
//
// Props aceptadas (todas opcionales):
//   - className: clases adicionales de NativeWind (padding extra,
//     márgenes, anchos específicos, etc.). NO sobrescribe el estilo
//     base: se concatena.
//   - children: contenido a renderizar dentro de la tarjeta.
//   - onPress: si se pasa, la tarjeta se vuelve tappable y muestra
//     feedback de opacidad al tocarse (activeOpacity 0.7).
//   - elevated: boolean. Si es true, eleva la sombra (más "flotante").
//
// No usamos StyleSheet.create: todo va por NativeWind + style={{}}
// solo para las propiedades que NativeWind aún no soporta bien en
// iOS (shadowOpacity, shadowOffset, etc.) y para elevation (Android).
// =====================================================================

// Importamos React para poder definir un componente funcional.
import React from 'react';

// Importamos View (contenedor inerte) y TouchableOpacity (envuelve
// View y le da feedback táctil). Usamos la View primitiva de RN
// en lugar de un <div> porque estamos en entorno nativo.
import { View, TouchableOpacity } from 'react-native';

// Importamos clsx para combinar condicionalmente classNames de
// NativeWind de forma legible. Es una dependencia peer de NativeWind
// v4, así que ya está disponible. Alternativa: usar template strings.
import { clsx } from 'clsx';

// Definimos y exportamos el componente Card como función pura.
// Es un "presentational component": no tiene estado, no tiene
// lógica. Solo recibe props y renderiza UI.
const Card = ({
  // className extra: se concatena con las clases base.
  className = '',
  // children: el contenido interior.
  children,
  // onPress opcional: si existe, la card se vuelve tappable.
  onPress,
  // elevated: si es true, usamos una sombra más pronunciada.
  elevated = false,
  // style: estilo extra para casos puntuales (casi siempre vacío).
  style,
  // Resto de props (testID, accessibilityLabel, etc.) se reenvían
  // al elemento subyacente para que las pruebas y a11y funcionen.
  ...rest
}) => {
  // Definimos los estilos de sombra fuera del JSX para que la
  // función sea declarativa y fácil de leer. La sombra por
  // defecto es sutil (shadowOpacity 0.06); si "elevated" es true,
  // usamos una sombra más marcada para cards "destacadas".
  const shadowStyle = elevated
    ? {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
      }
    : {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      };

  // Clases base de NativeWind para TODAS las cards. Usamos clsx
  // para concatenar con la prop className externa. Si el caller
  // quiere anular algo (p. ej. bg-slate-50), puede hacerlo
  // pasándolo en className porque clsx lo concatena al final.
  const baseClasses = clsx(
    'bg-white rounded-2xl p-4',
    // Si la card es tappable, añadimos active:opacity-70 para
    // feedback visual (esto solo aplica a TouchableOpacity).
    onPress ? 'active:opacity-70' : null,
    // className externa: tiene prioridad al estar al final.
    className,
  );

  // Si NO hay onPress, devolvemos una View inerte. Más simple
  // y eficiente que un TouchableOpacity sin handler.
  if (!onPress) {
    return (
      <View
        // Pasamos className + estilos de sombra + style extra.
        className={baseClasses}
        // El style combina: sombras (definidas arriba) + style extra
        // del caller. El orden importa: el style del caller se aplica
        // último, así que puede sobreescribir si lo necesita.
        style={[shadowStyle, style]}
        // Props restantes (testID, accessibilityLabel, etc.).
        {...rest}
      >
        {children}
      </View>
    );
  }

  // Si HAY onPress, devolvemos un TouchableOpacity. La API de
  // TouchableOpacity es idéntica a la de View en cuanto a props
  // de estilo, salvo por activeOpacity que define el alpha al
  // presionar (0.7 es un valor estándar, no demasiado oscuro).
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      // accessibilityRole: 'button' indica a lectores de pantalla
      // que esto es un elemento interactivo. Importante para a11y.
      accessibilityRole="button"
      className={baseClasses}
      style={[shadowStyle, style]}
      {...rest}
    >
      {children}
    </TouchableOpacity>
  );
};

// Exportamos por defecto. Convencional para componentes que se
// importan con "import Card from '...'".
export default Card;
