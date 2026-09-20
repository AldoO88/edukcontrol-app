// =====================================================================
// roleLabels.js
// ---------------------------------------------------------------------
// Centralización de labels de rol para UI.
// Evita duplicar ROLE_LABELS en 5+ archivos y garantiza consistencia.
//
// Uso:
//   import { getRoleLabel, ROLE_LABELS } from '@/src/constants/roleLabels';
//
//   // Para SchoolInfoCard (con género):
//   <SchoolInfoCard roleLabel={getRoleLabel(user.role, user.sex)} ... />
//
//   // Para badges de anuncios (sin género):
//   {ROLE_LABELS[senderRole]}
// =====================================================================

// ---------------------------------------------------------------------
// ROLE_LABELS — labels neutros para badges en listas de anuncios.
// Usados donde NO se conoce el sexo del emisor.
// ---------------------------------------------------------------------
export const ROLE_LABELS = {
  admin: 'Administrador',
  principal: 'Direccion',
  registrar: 'Secretaría',
  teacher: 'Docente',
  prefect: 'Prefectura',
  social_worker: 'Trabajo Social',
  super_admin: 'Super administrador',
  tutor: 'Tutor',
};

// ---------------------------------------------------------------------
// getRoleLabel(role, sex)
// ---------------------------------------------------------------------
// Devuelve el label correcto del rol según el contexto.
//
// Reglas:
//   - teacher: 'Docente' (neutro, independiente del sexo)
//   - prefect: siempre 'Prefectura' (sin distinción de género)
//   - demás roles: usa ROLE_LABELS (neutro)
//
// NOTA: el prefijo de género ('Prof.' / 'Profa.') NO vive aquí —
// ese va antes del nombre (línea superior de SchoolInfoCard) y lo
// resuelve getTeacherTitle(sex) en src/utils/teacherName.js. Aquí
// solo se computa el label del ROL para el pill/badge.
//
// Params:
//   - role: string con el rol del usuario ('teacher', 'prefect', etc.)
//   - sex: string con el sexo ('male', 'female') o null/undefined
//
// Ejemplos:
//   getRoleLabel('teacher', 'female') → 'Docente'
//   getRoleLabel('teacher', 'male')   → 'Docente'
//   getRoleLabel('prefect', 'female') → 'Prefectura'
//   getRoleLabel('admin', null)       → 'Administrador'
// ---------------------------------------------------------------------
export const getRoleLabel = (role, sex) => {
  if (role === 'teacher') {
    return 'Docente';
  }
  if (role === 'prefect') {
    return 'Prefectura';
  }
  return ROLE_LABELS[role] || role || 'Docente';
};

// ---------------------------------------------------------------------
// ROLE_IN_SENTENCE — formas con artículo para usar en oraciones.
// Solo masculino (el backend no siempre tiene sex en estos contextos).
// ---------------------------------------------------------------------
export const ROLE_IN_SENTENCE = {
  admin: 'el Administrador',
  principal: 'el Director',
  registrar: 'el Registrador',
  teacher: 'el Profesor',
  prefect: 'el Prefecto',
  social_worker: 'el Trabajador Social',
  super_admin: 'el Super Administrador',
};

export default getRoleLabel;
