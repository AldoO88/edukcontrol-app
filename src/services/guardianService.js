// =====================================================================
// guardianService.js
// ---------------------------------------------------------------------
// Capa de servicio para endpoints del guardian (tutor). El backend
// identifica al guardian por el JWT del header Authorization (el
// "me" en el path), por lo que NO necesitamos pasar el id del user.
//
// Endpoints:
//   - getGuardianDashboard() → GET /guardians/me/dashboard
//     Retorna el payload completo del dashboard: info de la escuela
//     + lista de hijos con su status actual y métricas.
// =====================================================================

// Cliente axios. Ya tiene el interceptor JWT que añade el header
// Authorization automáticamente.
import api from './api';

// Endpoint del dashboard. Sigue la convención de prefijos del
// proyecto: /auth/* NO lleva prefijo /api/ (ej. /auth/login), pero
// el resto de endpoints SÍ lo lleva (ej. /api/guardians/me/fcm-token).
// Ver comentario en src/services/api.js para más contexto.
const DASHBOARD_ENDPOINT = '/api/guardians/me/dashboard';

// ---------------------------------------------------------------------
// getGuardianDashboard()
// ---------------------------------------------------------------------
// GET /api/guardians/me/dashboard
//
// Shape del response (real, validado contra el backend):
//   {
//     user: {
//       _id: string,
//       name: string,           // "Carlos Pérez"
//       last_name: string | null,
//       greeting: string,       // display name para saludo
//       email: string | null,
//       phone_number: string,
//       role: 'tutor',
//       is_active: boolean,
//     },
//     school: {
//       _id: string,
//       name: string,
//       cct: string,            // "Clave de Centro de Trabajo" (código SEP)
//       logo_url: string | null,
//       is_active: boolean,
//     },
//     students: [
//       {
//         _id: string,
//         enrollment_number: string,  // "ALU001"
//         first_name: string,
//         last_name: string | null,
//         status: 'active' | 'inactive',
//         photo_url: string | null,
//         current_group: string | null,  // ID del grupo
//         group_label: string | null,    // "2°B" (texto legible)
//         relationship: string,           // "padre" | "madre" | etc.
//       },
//     ],
//     stats: {
//       total_students: number,
//       active_students: number,
//       inactive_students: number,
//     },
//   }
//
// Notas de implementación:
//   - "students" (no "children"): convención del backend. El front
//     los renderiza con el copy de "hijo(s)" porque la app es
//     parent-facing.
//   - "group_label" y "current_group": ambos pueden ser null. El
//     front prioriza group_label (legible) y cae a un placeholder.
//   - NO hay metrics (attendance/average/conduct) ni lastAccess en
//     este endpoint. Se mostrarán cuando el backend los exponga en
//     un endpoint por-alumno (e.g. /api/students/:id/dashboard).
//   - El saludo viene de user.greeting (preparado por el backend
//     con el formato que quiere mostrar). Fallback al user.name del
//     AuthContext, y finalmente a "Familia".
//
// Devuelve { success, data, message? } o { success: false, message }.
// NO lanza excepciones — los errores de red/HTTP se mapean a un
// objeto con success:false para que el hook los maneje sin try/catch.
export const getGuardianDashboard = async () => {
  try {
    const response = await api.get(DASHBOARD_ENDPOINT);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (status === 401) {
      // Token expirado o inválido. El AuthContext debería limpiar
      // la sesión y redirigir al login, pero por ahora devolvemos
      // un mensaje claro.
      return {
        success: false,
        message: serverMessage || 'Tu sesión expiró. Inicia sesión de nuevo.',
        reason: 'unauthorized',
      };
    }
    if (!error?.response) {
      return {
        success: false,
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      };
    }
    return {
      success: false,
      message: 'No se pudo cargar el dashboard. Inténtalo de nuevo.',
    };
  }
};
