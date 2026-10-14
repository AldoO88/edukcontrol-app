// =====================================================================
// src/components/StudentAvatar.jsx
// ---------------------------------------------------------------------
// Avatar circular de alumno COMPARTIDO entre roles (tutor, maestro,
// director, prefecto, trabajo social). Reemplaza los ~20 bloques
// duplicados de "círculo con iniciales" que nunca renderizaban <Image>.
//
// Comportamiento:
//   1. Si `uri` (photoUrl de Cloudinary, https) existe → <Image>
//      circular. Si la imagen falla al cargar (URL rota, sin red) se
//      cae a iniciales vía estado local `failed` (onError de RN Image).
//   2. Si `uri` es null/vacío → iniciales directo, sin mountear Image.
//
// El backend guarda `secure_url` de Cloudinary (https, WebP 300×300),
// formato soportado por Expo/SDK 57 — no hace falta transformación.
//
// Uso:
//   <StudentAvatar uri={student.photoUrl} name={`${student.first_name} ${student.last_name}`} size={40} />
//
// No conoce navegación ni contextos — es una primitive reutilizable
// (ver AGENTS.md: src/components/ no conoce negocio).
// =====================================================================

import { useState } from 'react';
import { Image, Text, View } from 'react-native';

// Iniciales reutilizadas del helper puro (2 letras mayúsculas).
import { getInitials } from '@/src/utils/textHelpers';

// Tamaños default: fondo gris claro (#E2E8F0) e iniciales slate-900,
// igual que el resto de la app (paleta institucional).
const DEFAULT_SIZE = 40;
const FALLBACK_BG = '#E2E8F0';
const FALLBACK_TEXT = '#0F172A';

const StudentAvatar = ({
  uri,
  name,
  size = DEFAULT_SIZE,
  fallbackColor = FALLBACK_BG,
  textColor = FALLBACK_TEXT,
}) => {
  // Estado local: true si la Image falló al cargar → mostramos iniciales.
  const [failed, setFailed] = useState(false);

  // Tamaño de fuente proporcional al diámetro (legible de 28 a 72).
  const fontSize = Math.max(11, Math.round(size * 0.34));

  // Círculo de fallback con iniciales (sin foto o imagen rota).
  const initialsCircle = (
    <View
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: fallbackColor,
      }}
      accessibilityLabel={`Foto de ${name || 'alumno'}`}
    >
      <Text style={{ fontSize, fontWeight: '800', color: textColor }}>
        {getInitials(name)}
      </Text>
    </View>
  );

  // Sin URI o ya falló → fallback.
  if (!uri || failed) {
    return initialsCircle;
  }

  // Con foto → <Image> circular. onError marca failed para volver al
  // círculo de iniciales en el siguiente render (no deja hueco roto).
  return (
    <Image
      source={{ uri }}
      onError={() => setFailed(true)}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      accessibilityLabel={`Foto de ${name || 'alumno'}`}
    />
  );
};

export default StudentAvatar;
