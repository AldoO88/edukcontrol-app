// =====================================================================
// src/components/Toast.jsx
// ---------------------------------------------------------------------
// Mensaje flotante reutilizable para confirmaciones / feedback breve.
// Renderiza un pill verde con check + mensaje, anclado arriba (top
// insets + 12px) y centrado. Aparece con animación fade/slide y se
// oculta automáticamente después de `duration` ms.
//
// Props:
//   - visible: bool — si se muestra.
//   - message: string — texto a mostrar.
//   - duration: number — ms antes de auto-ocultarse (default 1800).
//   - iconColor: string — color del ícono check (default '#15803D').
//   - bgColor: string — color de fondo del pill (default '#DCFCE7').
//   - textColor: string — color del texto (default '#15803D').
//   - onHide(): callback cuando termina la animación de salida.
//
// Self-contained: usa useEffect para auto-ocultarse. No depende de
// contextos globales.
// =====================================================================

// React + hooks.
import React, { useEffect, useRef } from 'react';

// Primitivas RN.
import { View, Text, Animated } from 'react-native';

// Iconos Lucide.
import { Check } from 'lucide-react-native';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Toast = ({
  visible,
  message,
  duration = 1800,
  iconColor = '#15803D',
  bgColor = '#DCFCE7',
  textColor = '#15803D',
  borderColor = '#BBF7D0',
  onHide,
}) => {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const hideTimer = useRef(null);

  useEffect(() => {
    if (!visible) {
      // Salida: fade out + slide up.
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
      return () => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
      };
    }

    // Entrada: fade in + slide down.
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    hideTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onHide) onHide();
      });
    }, duration);

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [visible, duration, onHide, opacity, translateY]);

  if (!visible && opacity._value === 0) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: insets.top + 12,
        left: 16,
        right: 16,
        alignItems: 'center',
        opacity,
        transform: [{ translateY }],
        zIndex: 100,
      }}
    >
      <View
        className="flex-row items-center"
        style={{
          backgroundColor: bgColor,
          borderColor,
          borderWidth: 1,
          borderRadius: 999,
          paddingHorizontal: 16,
          paddingVertical: 10,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        <Check size={16} color={iconColor} strokeWidth={3} />
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: textColor,
            marginLeft: 8,
          }}
          numberOfLines={1}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

export default Toast;