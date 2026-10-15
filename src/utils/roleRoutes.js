// =====================================================================
// roleRoutes.js
// ---------------------------------------------------------------------
// FUENTE ÚNICA de navegación por rol. Mapea cada `role` de User
// (valores del backend: super_admin, admin, principal, registrar,
// teacher, prefect, social_worker, tutor) al href del dashboard del
// grupo de rutas QUE LE CORRESPONDE en app/.
//
// POR QUÉ EXISTE (bug real corregido, reportado como "el spinner se
// queda dando vueltas al crear la contraseña"):
//   set-password.jsx calculaba el destino con un ternario de 2 vías:
//       role === 'teacher' ? '/(teacher)/dashboard' : '/(guardian)/dashboard'
//   Un principal/prefect/social_worker que creaba su contraseña caía
//   en el grupo (guardian); el gate de (guardian) lo pateaba a
//   (teacher); el gate de (teacher) lo pateaba de vuelta a
//   (guardian)… → BUCLE INFINITO de <Redirect> → la app se quedaba
//   colgada con el spinner girando sin terminar NUNCA. En el clon
//   local de producción había 6 cuentas sin contraseña en ese
//   preciso estado (4 prefect, 1 principal, 1 social_worker).
//
// REGLAS DE USO:
//   1. Toda navegación "rol → dashboard" DEBE pasar por roleHomeHref().
//   2. NUNCA hardcodear '(grupo)/dashboard' con ternarios o maps
//      inline de rol — esto es el mapa canónico.
//   3. roleHomeHref devuelve `null` para roles SIN grupo en la app
//      móvil (admin, registrar, super_admin). El caller debe tratar
//      el null con un estado de "sin acceso" (ver UnsupportedRoleView
//      en app/index.jsx) — NUNCA con un <Redirect> a un grupo ajeno,
//      que es exactamente lo que formaba el bucle.
//
// GARANTÍA ANTI-BUCLE (por construcción):
//   - Cada valor del mapa pertenece a un grupo cuyo gate ACEPTA
//     exactamente ese rol (tutor↔(guardian), teacher↔(teacher),
//     prefect↔(prefect), social_worker↔(social-worker),
//     principal↔(director)). Un Redirect llega como máximo a 1 hop
//     y se detiene.
//   - Los roles sin home caen en "/" y app/index.jsx NO redirige
//     cuando el rol no está en el mapa (muestra el aviso de sin
//     acceso). Sin Redirect ⇒ sin ciclo posible.
// =====================================================================

// Mapa role → href del dashboard de SU grupo. Si se añade un grupo
// de rol nuevo a app/, se añade aquí su entrada (y su gate debe
// aceptar exactamente ese rol).
export const ROLE_HOME_HREF = {
  tutor: '/(guardian)/dashboard',
  teacher: '/(teacher)/dashboard',
  prefect: '/(prefect)/dashboard',
  social_worker: '/(social-worker)/dashboard',
  principal: '/(director)/dashboard',
};

// Helper: devuelve el href del home del rol, o `null` si el rol no
// tiene grupo de rutas en la app móvil (admin, registrar,
// super_admin). Los callers SIEMPRE deben cubrir el null.
export const roleHomeHref = (role) => ROLE_HOME_HREF[role] || null;
