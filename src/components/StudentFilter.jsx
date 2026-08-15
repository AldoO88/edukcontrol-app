// =====================================================================
// src/components/StudentFilter.jsx (chrome compartido)
// ---------------------------------------------------------------------
// Filtro horizontal de alumnos por pills, compartido por las pantallas
// Avisos y Conducta. Cada pill muestra avatar (foto o inicial) + nombre
// del alumno, con estado activo/inactivo.
//
// Mismo lenguaje visual que el resto de la app:
//   - Pill activo:   bg-slate-900 + text-white.
//   - Pill inactivo: bg-slate-100 + text-slate-700.
//   - Avatar:        28px circular. Si hay avatarUrl, muestra la
//                    imagen; si falla o no hay, fallback a la inicial
//                    sobre fondo sky-100 (inactivo) o slate-700
//                    (activo).
//
// Props:
//   - students: array de { id, name, avatarUrl?, avatarLetter? }.
//               Si un item NO tiene avatarUrl NI avatarLetter, no
//               se muestra avatar (caso del filtro "Todos" en
//               Avisos).
//   - activeId: id del alumno actualmente seleccionado.
//   - onChange: callback (id) => void al pulsar una pill.
//   - className: clases extra para el ScrollView (e.g. márgenes).
//   - accessibilityLabel: label ARIA del grupo de pills.
// =====================================================================

// React + hooks.
import React, { useState, useEffect } from 'react';

// Primitivas RN: View, Text, ScrollView, Pressable, Image.
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';

// clsx para componer classNames condicionales.
import { clsx } from 'clsx';

// ---------------------------------------------------------------------
// getInitials(name)
// ---------------------------------------------------------------------
// Helper: devuelve 1-2 chars de iniciales a partir de un nombre.
// Si el nombre está vacío, devuelve "?". Mismo patrón que
// AnnouncementCard / GuardianDashboard.
const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ---------------------------------------------------------------------
// StudentPill (sub-componente interno)
// ---------------------------------------------------------------------
// Renderiza UNA pill individual. Maneja su propio estado de error
// de la imagen (avatarError) para que el fallback a la inicial
// sea local y no afecte a las otras pills del filtro.
//
// Se extrae a un sub-componente para que useState/useEffect
// queden scoped a cada pill. Si se hiciera en línea dentro del
// .map(), todos los avatares compartirían el mismo estado y un
// error en uno "rompería" la imagen del resto.
// ---------------------------------------------------------------------
const StudentPill = ({ student, isActive, onPress }) => {
  // Estado local: si la URL del avatar falla (404, red caída,
  // formato no soportado), onError setea este flag y caemos al
  // fallback de la inicial. Se resetea cuando cambia la URL.
  const [avatarError, setAvatarError] = useState(false);
  useEffect(() => {
    setAvatarError(false);
  }, [student?.avatarUrl]);

  // ¿Tiene avatar definido? Si no, no renderizamos el círculo
  // (caso del filtro "Todos" en Avisos).
  const hasAvatar = Boolean(student?.avatarUrl || student?.avatarLetter);
  // ¿Mostramos la imagen real? Solo si hay URL y no hubo error.
  const showImage = Boolean(student?.avatarUrl) && !avatarError;
  // Letra a mostrar en el fallback: la forzada, o la calculada
  // del nombre.
  const fallbackLetter = student?.avatarLetter || getInitials(student?.name);

  return (
    <Pressable
      onPress={onPress}
      // flex-row + items-center: avatar a la izquierda, texto a la
      // derecha. rounded-full para look "pill".
      // pl-1.5 + pr-4 + py-1.5 cuando hay avatar: el pl reducido
      //   deja el avatar pegado al borde izq de la pill (estética
      //   tipo "chip" / "contact pill").
      // px-4 py-2.5 cuando NO hay avatar: padding uniforme, como
      //   las pills de la versión anterior.
      className={clsx(
        'flex-row items-center rounded-full',
        hasAvatar ? 'pl-1.5 pr-4 py-1.5' : 'px-4 py-2.5',
        isActive ? 'bg-slate-900' : 'bg-slate-100',
      )}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`Filtrar por ${student?.name || 'estudiante'}`}
    >
      {/* Avatar circular. w-7 h-7 (28px) — lo bastante grande
          para que la imagen se vea bien sin robarle espacio al
          nombre. El color de fondo del círculo cambia según
          estado: slate-700 (activo) o sky-100 (inactivo). */}
      {hasAvatar && (
        <View
          className={clsx(
            'w-7 h-7 rounded-full overflow-hidden items-center justify-center',
            isActive ? 'bg-slate-700' : 'bg-sky-100',
          )}
        >
          {showImage ? (
            <Image
              source={{ uri: student.avatarUrl }}
              className="w-full h-full"
              resizeMode="cover"
              accessibilityLabel={`Foto de ${student?.name || 'alumno'}`}
              onError={() => setAvatarError(true)}
            />
          ) : (
            // Fallback: inicial sobre fondo coloreado. text-xs
            // (12px) bold para que case con el cuerpo del texto
            // de la pill. Color: blanco en activo, sky-700 en
            // inactivo.
            <Text
              className={clsx(
                'text-xs font-bold',
                isActive ? 'text-white' : 'text-sky-700',
              )}
            >
              {fallbackLetter}
            </Text>
          )}
        </View>
      )}

      {/* Nombre del alumno. ml-2 solo si hay avatar (para
          separar del círculo). */}
      <Text
        className={clsx(
          'text-sm font-bold',
          hasAvatar && 'ml-2',
          isActive ? 'text-white' : 'text-slate-700',
        )}
        numberOfLines={1}
      >
        {student?.name || 'Sin nombre'}
      </Text>
    </Pressable>
  );
};

// ---------------------------------------------------------------------
// StudentFilter
// ---------------------------------------------------------------------
const StudentFilter = ({
  students = [],
  activeId,
  onChange,
  className = '',
  accessibilityLabel = 'Filtro de estudiantes',
}) => {
  return (
    // ScrollView horizontal para que los filtros se puedan
    // scrollear en pantallas angostas. showsHorizontalScrollIndicator
    // = false para UX limpia. contentContainerClassName: gap-2
    // entre pills, px-5 gutter lateral, pr-4 extra al final para
    // que la última pill no quede pegada al borde al scrollear.
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName={clsx('gap-2 px-5', className)}
      accessibilityLabel={accessibilityLabel}
    >
      {students.map((student) => (
        <StudentPill
          key={student.id}
          student={student}
          isActive={student.id === activeId}
          onPress={() => onChange?.(student.id)}
        />
      ))}
    </ScrollView>
  );
};

export default StudentFilter;
