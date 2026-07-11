# EdukControl — Agent Guide

Aplicación móvil escolar (Expo SDK 57 + React Native 0.86 + React 19.2.3) con dos roles: **guardian** (padres/tutores) y **teacher** (maestros).

> **Expo HAS CHANGED.** Antes de escribir cualquier código de Expo/notificaciones/navegación, leer la doc versionada en https://docs.expo.dev/versions/v57.0.0/ — la SDK 57 introduce cambios incompatibles respecto a SDK 53/54 (ver "Trampas de SDK 57" abajo).

---

## Stack y decisiones clave

- **Lenguaje:** JavaScript puro (`.js`), **NO TypeScript**. No añadir tipos, interfaces, ni `.ts`/`.tsx`.
- **Estilos:** NativeWind v4 (Tailwind CSS) — `className` en componentes RN, NO `StyleSheet.create` salvo para estilos dinámicos calculados en runtime (sombras, animaciones, transformaciones).
- **Iconos:** `@expo/vector-icons` (Lucide o MaterialCommunityIcons). Empotrado en Expo, no requiere `expo install` extra.
- **HTTP:** `axios` con instancia única en `src/services/api.js`. Todas las llamadas pasan por ahí (interceptor JWT, baseURL, manejo de errores centralizado).
- **Navegación:** `@react-navigation/native` + `@react-navigation/native-stack` + `@react-navigation/bottom-tabs`.
- **Estado global:** Context API (empezando por `AuthContext`). No introducir Redux/Zustand salvo que se pida explícitamente.
- **Persistencia local:** `@react-native-async-storage/async-storage` para tokens y datos no sensibles. Para tokens usar `expo-secure-store`.
- **Notificaciones push:** `expo-notifications` con tokens Expo (no FCM directo). El push token **requiere** un `projectId` EAS configurado en `app.json` bajo `extra.eas.projectId`.
- **Safe areas:** `react-native-safe-area-context` — usar `SafeAreaView` y `useSafeAreaInsets` de esa librería, **NO** la `SafeAreaView` deprecada de `react-native`.

## Estructura `src/`

```
src/
├── components/   # UI reutilizable (cards, inputs, botones, badges)
├── context/      # AuthContext y futuros contextos globales
├── hooks/        # useAuth, useNotifications (lógica separada de UI)
├── navigation/   # AppNavigator (raíz) + GuardianNavigator + TeacherNavigator
├── screens/
│   ├── auth/     # LoginScreen y flujo previo al login
│   ├── guardian/ # Pantallas del rol padre
│   └── teacher/  # Pantallas del rol maestro
└── services/     # api.js (Axios), notificationService.js
```

Reglas:
- `hooks/` NUNCA importa de `screens/` ni de `components/`. Los hooks solo consumen contextos y servicios.
- `screens/` NUNCA hace `fetch`/`axios` directo. Toda llamada pasa por un hook o por `services/`.
- `components/` no conoce navegación ni contextos de negocio.

## Sistema de diseño (NativeWind tokens)

Paleta institucional fija — no inventar colores nuevos:

| Uso            | Clases                                                       |
| -------------- | ------------------------------------------------------------ |
| Fondo app      | `bg-slate-50` / `bg-gray-100`                                |
| Primario       | `bg-slate-900` / `text-slate-900` / `bg-indigo-950`           |
| Acento activo  | `bg-sky-500` / `text-sky-600`                                |
| Éxito          | `bg-emerald-500` / `text-emerald-600` / `bg-emerald-50`      |
| Advertencia    | `bg-amber-500` / `bg-amber-50` / `text-amber-600`            |
| Crítico        | `bg-rose-500` / `bg-rose-50` / `text-rose-600`               |
| Tarjetas       | `bg-white rounded-2xl` con sombra (ver "Sombras" abajo)       |
| Títulos        | `font-bold text-slate-900`                                   |
| Subtítulos     | `text-slate-500 text-sm`                                     |

## Sombras multiplataforma

NativeWind no siempre aplica `elevation` (Android) además de `shadow*` (iOS). Para sombras fiables en ambos:

```jsx
<View className="bg-white rounded-2xl shadow-sm" style={{ elevation: 3 }}>
```

`shadow-{sm,md,lg}` da el render en iOS; `elevation` (vía `style`) cubre Android. No omitir `elevation`.

## Trampas de SDK 57 (leer antes de tocar)

1. **Notification handler deprecó `shouldShowAlert`.** Usar `shouldShowBanner` y `shouldShowList`:
   ```js
   Notifications.setNotificationHandler({
     handleNotification: async () => ({
       shouldShowBanner: true,
       shouldShowList: true,
       shouldPlaySound: false,
       shouldSetBadge: false,
     }),
   });
   ```

2. **Listeners usan `.remove()`, no `removeNotificationSubscription`.**
   ```js
   const sub = Notifications.addNotificationReceivedListener(handler);
   return () => sub.remove();
   ```

3. **`getExpoPushTokenAsync` exige `projectId`.** Sin esto falla silenciosa o ruidosamente:
   ```js
   const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
   ```

4. **Android 13+ requiere canal creado ANTES de pedir permisos.** Llamar `setNotificationChannelAsync` antes de `requestPermissionsAsync`, si no el prompt nunca aparece.

5. **Push notifications no funcionan en Expo Go en Android desde SDK 53.** Para probar push real hace falta `npx expo run:android` o un dev build.

## Convenciones de código

- **Comentarios en español, línea por línea, exhaustivos.** El usuario lo pidió explícitamente para este proyecto. NO es la regla por defecto del sistema — es una excepción documentada.
- **Componentes funcionales con hooks.** No clases.
- **JSX en archivos `.js`**, no `.jsx`.
- **Nombres de archivos:**
  - **`.jsx`** (PascalCase) para todo lo que renderiza UI: `App.jsx`, `components/Card.jsx`, `screens/*/*.jsx`, `navigation/*Navigator.jsx`.
  - **`.js`** (camelCase) para módulos que NO renderizan JSX: hooks (`useAuth.js`), services (`api.js`, `notificationService.js`) y módulos de contexto (`context/AuthContext.js`, híbrido: exporta el objeto Context + el Provider, pero se considera módulo de estado, no componente de UI).
- **No barrel files** (`index.js` re-exportando) salvo que se pida — el árbol de imports debe ser explícito.
- **Strings de UI en español.** Hardcoded en esta fase; cuando se introduzca i18n, mover a `src/i18n/es.json`.

## Entry points y orden de providers en `App.js`

Orden obligatorio (de fuera hacia adentro):

1. `SafeAreaProvider` (de `react-native-safe-area-context`)
2. `AuthProvider` (de `src/context/AuthContext.js`)
3. `NavigationContainer` (de `@react-navigation/native`) — vive dentro de `AppNavigator.js`
4. `AppNavigator` resuelve flujo: `user === null` → Login, `user.role === 'guardian'` → `GuardianNavigator`, `user.role === 'teacher'` → `TeacherNavigator`.

## Comandos

```sh
npm start                # expo start (Metro)
npx expo run:android     # build nativo + instala en device/emulador
npx expo run:ios         # idem iOS
npx expo install <pkg>   # instalar con versión compatible con SDK 57 (usar SIEMPRE, no npm install)
npx expo install --check # detectar deps desalineadas con la SDK
```

**No hay** scripts de `lint`, `typecheck` o `test` configurados todavía. Antes de añadir código que asuma ESLint/Prettier/Jest, verificar que el config exista; si no, crearlo como tarea separada y documentarlo aquí.

## Estado actual de dependencias (a julio 2026)

**Instaladas** (`package.json`): `expo`, `expo-status-bar`, `react`, `react-native`.

**Pendientes de instalar** (cuando se vaya a usar cada feature):
- `@react-native-async-storage/async-storage` (AuthContext ya lo importa)
- `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`
- `react-native-safe-area-context`, `react-native-screens`
- `nativewind`, `tailwindcss`, `react-native-reanimated`, `react-native-gesture-handler`
- `expo-notifications`, `expo-device`, `expo-constants`
- `axios`

Usar siempre `npx expo install` para mantener compatibilidad con SDK 57.

## Lo que NO asumir

- No asumir `expo-router` (este proyecto usa `@react-navigation` explícito).
- No asumir que `tailwind.config.js` o `babel.config.js` existen — NativeWind aún no está configurado en este repo. Configurar antes de usar `className`.
- No asumir TypeScript ni tipos en ningún archivo.
- No asumir que existe un backend real: la URL base de `api.js` debe venir de una constante de entorno (`process.env.EXPO_PUBLIC_API_URL` o similar), no hardcoded.
