// =====================================================================
// teacherName.js
// ---------------------------------------------------------------------
// Helper para componer el nombre completo del maestro desde el objeto
// `teacher` que devuelve `GET /api/teacher-subjects/me/dashboard`.
//
// El backend puede mandar el nombre en diferentes campos:
//   - `fullName`: nombre completo ya compuesto ("Aldo Omar González Juárez").
//   - `name` + `last_name`: nombre y apellido por separado.
//
// Esta helper prioriza `fullName` (más confiable, siempre viene armado
// por el backend) y solo si falta, combina `name` + `last_name`. Si no
// hay datos, devuelve 'Docente' como fallback neutro.
//
// Por qué este helper existe:
//   - Antes cada screen construía su propio `teacherName` con la línea
//     `data?.teacher?.last_name || data?.teacher?.fullName || 'González Juárez'`,
//     lo cual mostraba SOLO el apellido en la SchoolInfoCard (bug visual).
//   - Centralizar la lógica evita inconsistencias entre screens y hace
//     trivial actualizar la regla si el backend cambia el shape.
//
// Uso:
//   import { getTeacherFullName } from '@/src/utils/teacherName';
//
//   const teacherName = getTeacherFullName(data?.teacher);
//   // → "Aldo Omar González Juárez"
// =====================================================================

export const getTeacherFullName = (teacher) => {
  if (!teacher || typeof teacher !== 'object') return 'Docente';

  // Prioridad 1: fullName ya compuesto por el backend.
  if (typeof teacher.fullName === 'string' && teacher.fullName.trim()) {
    return teacher.fullName.trim();
  }

  // Prioridad 2: combinar name + last_name. Evita duplicar el apellido
  // si el backend lo incluye dentro de `name` (defensivo).
  const first = typeof teacher.name === 'string' ? teacher.name.trim() : '';
  const last = typeof teacher.last_name === 'string' ? teacher.last_name.trim() : '';
  if (first && last) {
    // Si `name` ya incluye `last` (case-insensitive), no concatenamos.
    const alreadyIncluded = first.toLowerCase().includes(last.toLowerCase());
    return alreadyIncluded ? first : `${first} ${last}`;
  }
  if (first) return first;
  if (last) return last;

  // Sin datos: fallback neutro.
  return 'Docente';
};

// ---------------------------------------------------------------------
// TEACHER_TITLE / getTeacherTitle(sex)
// ---------------------------------------------------------------------
// Mapa del campo `sex` del backend al prefijo que se muestra antes
// del nombre del maestro:
//   - 'male'   → 'Prof.'
//   - 'female' → 'Profa.'
//   - null/undefined/otro → 'Prof.' (default masculino, según
//     decisión del producto).
//
// Uso:
//   import { getTeacherTitle } from '@/src/utils/teacherName';
//
//   const title = getTeacherTitle(teacher?.sex);
//   // → "Profa." o "Prof."
//
// Por qué existe:
//   - Antes la UI tenía hardcoded "Prof. " en SchoolInfoCard, profile
//     y otros lugares. Con la actualización del backend que expone
//     `teacher.sex`, podemos respetar el género del maestro sin
//     pedirle al usuario que corrija su perfil.
//   - Centralizar el mapa aquí permite extenderlo más adelante
//     (e.g. 'other' → "Profe.") sin tocar la UI.
// ---------------------------------------------------------------------
export const TEACHER_TITLE = {
  male: 'Prof.',
  female: 'Profa.',
  default: 'Prof.',
};

export const getTeacherTitle = (sex) => {
  if (!sex || typeof sex !== 'string') return TEACHER_TITLE.default;
  return TEACHER_TITLE[sex] || TEACHER_TITLE.default;
};

// ---------------------------------------------------------------------
// getTeacherTitleAndName(teacher)
// ---------------------------------------------------------------------
// Compone título + nombre completo en un solo string.
//   getTeacherTitleAndName({ sex: 'female', fullName: 'María López' })
//   // → "Profa. María López"
//
// Útil cuando la UI quiere ambos juntos (SchoolInfoCard, profile).
// Para pantallas que solo necesitan el nombre sin prefijo
// (e.g. "Hola, {teacherName}" en el dashboard), usar
// getTeacherFullName() directamente.
// ---------------------------------------------------------------------
export const getTeacherTitleAndName = (teacher) => {
  if (!teacher || typeof teacher !== 'object') return 'Docente';
  const title = getTeacherTitle(teacher.sex);
  const name = getTeacherFullName(teacher);
  return `${title} ${name}`;
};

export default getTeacherFullName;
