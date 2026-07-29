// =====================================================================
// PasswordField.jsx
// ---------------------------------------------------------------------
// Input de contraseña con botón de mostrar/ocultar. Encapsula:
//   - El icono del candado a la izquierda.
//   - El input de tipo password (secureTextEntry).
//   - El botón toggle con icono Eye / EyeOff.
// Usa internamente useToggle para manejar la visibilidad.
// Usa TextField por debajo para no duplicar estilos.
// =====================================================================

// React.
import React from 'react';

// Primitiva RN para el botón de toggle.
import { TouchableOpacity } from 'react-native';

// Hook propio para alternar booleanos.
import { useToggle } from '../hooks/useToggle';

// Iconos.
import { Lock, Eye, EyeOff } from 'lucide-react-native';

// Componente base.
import TextField from './TextField';

// Props:
//   - value, onChangeText: controlados.
//   - placeholder: default "••••••••".
//   - iconColor: color del candado (default slate-500). El caller
//     puede sobreescribirlo para dar personalidad al campo
//     (e.g. amber-500 en el login).
//   - error: string con mensaje de error.
//   - Resto de props (autoComplete, textContentType, labelClassName,
//     etc.) se reenvían al TextField subyacente.
const PasswordField = ({
  value,
  onChangeText,
  placeholder = '••••••••',
  iconColor = '#64748b',
  error = null,
  ...rest
}) => {
  // useToggle: hook que devuelve [value, toggle]. Reemplaza el
  // patrón useState + setX(!x) que estaba en LoginScreen.
  const [isVisible, toggleVisible] = useToggle(false);

  return (
    <TextField
      // Label: lo mostramos aquí. Si el caller no lo quiere, puede
      // sobrescribir pasando label=null en ...rest.
      label="Contraseña"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      // Icono del candado a la izquierda + color personalizable.
      icon={Lock}
      iconColor={iconColor}
      // Alternamos secureTextEntry según isVisible.
      secureTextEntry={!isVisible}
      // Atributos de autocompletado correctos para contraseñas
      // (iOS sugiere del llavero, Android de Google).
      autoCapitalize="none"
      autoCorrect={false}
      spellCheck={false}
      textContentType="password"
      autoComplete="password"
      // Slot derecho: botón para mostrar/ocultar.
      rightSlot={
        <PasswordToggleButton
          isVisible={isVisible}
          onPress={toggleVisible}
        />
      }
      error={error}
      accessibilityLabel="Campo de contraseña"
      {...rest}
    />
  );
};

// Sub-componente interno: botón de toggle. Extraído para
// mantener el PasswordField limpio y legible.
const PasswordToggleButton = ({ isVisible, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    accessibilityRole="button"
    accessibilityLabel={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
  >
    {isVisible ? (
      <EyeOff size={20} color="#64748b" strokeWidth={2} />
    ) : (
      <Eye size={20} color="#64748b" strokeWidth={2} />
    )}
  </TouchableOpacity>
);

export default PasswordField;
