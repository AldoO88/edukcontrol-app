# EdukControl — Agent Guide

Aplicación móvil escolar (Expo SDK 57 + React Native 0.86 + React 19.2.3) con dos roles: **guardian** (padres/tutores) y **teacher** (maestros).

> **Expo HAS CHANGED.** Antes de escribir cualquier código de Expo/notificaciones/navegación, leer la doc versionada en https://docs.expo.dev/versions/v57.0.0/ — la SDK 57 introduce cambios incompatibles respecto a SDK 53/54 (ver "Trampas de SDK 57" abajo).

---

## Stack y decisiones clave

- **Lenguaje:** JavaScript puro (`.js`/`.jsx`), **NO TypeScript**. No añadir tipos, interfaces, ni `.ts`/`.tsx`.
- **Estilos:** NativeWind v4 (Tailwind CSS) — `className` en componentes RN, NO `StyleSheet.create` salvo para estilos dinámicos calculados en runtime (sombras, animaciones, transformaciones).
- **Iconos:** `lucide-react-native` (set Lucide, ya instalado). Para MaterialCommunityIcons usar `@expo/vector-icons` que viene empotrado en Expo.
- **HTTP:** `axios` con instancia única en `src/services/api.js`. Todas las llamadas pasan por ahí (interceptor JWT, baseURL, manejo de errores centralizado).
- **Navegación:** **Expo Router** (`expo-router` v5, instalado vía `npx expo install`). File-based routing con `app/` como raíz. `expo-linking` se usa automáticamente para deep-links a partir del `scheme` definido en `app.json`.
- **Estado global:** Context API (empezando por `AuthContext`). No introducir Redux/Zustand salvo que se pida explícitamente.
- **Persistencia local:** `@react-native-async-storage/async-storage` para datos no sensibles. Para tokens usar `expo-secure-store` (pendiente de instalar cuando se implemente el storage seguro del JWT).
- **Notificaciones push:** `expo-notifications` con tokens Expo (no FCM directo). El push token **requiere** un `projectId` EAS configurado en `app.json` bajo `extra.eas.projectId`.
- **Safe areas:** `react-native-safe-area-context` — usar `SafeAreaView` y `useSafeAreaInsets` de esa librería, **NO** la `SafeAreaView` deprecada de `react-native`.

## Estructura del proyecto

```
school-parents-app/
├── app/                       # Raíz del routing (Expo Router, file-based).
│   ├── _layout.jsx            # Layout raíz: providers + AuthGate + Stack + SchoolHeader global.
│   ├── index.jsx              # Ruta "/". Pantalla de Login (placeholder).
│   └── (app)/                 # Route group "logueado" — no aparece en la URL.
│       ├── _layout.jsx        # Auth gate defensivo: Redirect "/" si !user.
│       ├── dashboard.jsx      # Ruta "/dashboard". Render condicional por userRole.
│       └── _components/       # Carpeta privada (prefijo "_" la oculta del routing).
│           ├── TeacherDashboardPlaceholder.jsx
│           └── GuardianDashboardPlaceholder.jsx
├── src/
│   ├── components/            # UI reutilizable (cards, inputs, botones, badges, SchoolHeader, Screen).
│   ├── context/               # AuthContext y futuros contextos globales.
│   ├── hooks/                 # useAuth, useLoginForm, useNotifications (lógica separada de UI).
│   ├── services/              # api.js (Axios), authService.js, notificationService.js.
│   ├── constants/             # Tokens de diseño, URLs, mocks multi-tenant.
│   └── utils/                 # Helpers puros (formateo de fechas, etc.).
├── assets/                    # Iconos, splash, imágenes nativas.
├── App.jsx                    # NO EXISTE. Reemplazado por app/_layout.jsx.
├── index.js                   # NO EXISTE. Lo gestiona expo-router/entry (main en package.json).
├── app.json                   # Expo config: scheme, plugins, iconos nativos.
├── babel.config.js            # babel-preset-expo + nativewind/babel + worklets/plugin.
├── metro.config.js            # withNativeWind(getDefaultConfig()).
├── tailwind.config.js         # content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'].
└── global.css                 # Directivas @tailwind base/components/utilities.
```

Reglas:
- `app/**/_components/` (prefijo `_`) y `app/**/_hooks/` son carpetas **privadas** dentro de un route group: expo-router las ignora para el routing y sirven para co-localizar UI/lógica específica de ese grupo.
- `src/hooks/` NUNCA importa de `app/`, `src/components/` ni viceversa. Los hooks solo consumen contextos y servicios.
- `app/**` (rutas) NUNCA hace `fetch`/`axios` directo. Toda llamada pasa por un hook o por `src/services/`.
- `src/components/` no conoce navegación ni contextos de negocio — son primitives reutilizables.
- Los **route groups** (carpetas entre paréntesis como `(app)/`) NO añaden segmentos a la URL: existen solo para compartir layouts y agrupar rutas por dominio/rol.

## Sistema de diseño (NativeWind tokens)

Paleta institucional fija — no inventar colores nuevos:

| Uso            | Clases                                                       |
| -------------- | ------------------------------------------------------------ |
| Fondo app      | `bg-slate-50` / `bg-gray-100`                                |
| Primario       | `bg-slate-900` / `text-slate-900` / `bg-indigo-950`          |
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

6. **Expo Router v5 (SDK 57):** `babel-preset-expo` ya incluye el transformador del filesystem. NO añadir `expo-router/babel` como plugin extra. `expo install expo-router` añade automáticamente `"expo-router"` al array `plugins` de `app.json`.

7. **Auth flow con Expo Router:** implementar con `<Redirect />` declarativo en el render del layout (NO con `useEffect + router.replace`). Ver `app/_layout.jsx → AuthGate` como referencia canónica.

## Convenciones de código

- **Comentarios en español, línea por línea, exhaustivos.** El usuario lo pidió explícitamente para este proyecto. NO es la regla por defecto del sistema — es una excepción documentada.
- **Componentes funcionales con hooks.** No clases.
- **Nombres de archivos:**
  - **`.jsx`** (PascalCase) para todo lo que renderiza UI: `app/_layout.jsx`, `app/(app)/dashboard.jsx`, `src/components/Card.jsx`, `src/components/SchoolHeader.jsx`.
  - **`.js`** (camelCase) para módulos que NO renderizan JSX: hooks (`src/hooks/useAuth.js`), services (`src/services/api.js`) y módulos de contexto (`src/context/AuthContext.js`, híbrido: exporta el objeto Context + el Provider, pero se considera módulo de estado, no componente de UI).
- **No barrel files** (`index.js` re-exportando) salvo que se pida — el árbol de imports debe ser explícito.
- **Strings de UI en español.** Hardcoded en esta fase; cuando se introduzca i18n, mover a `src/i18n/es.json`.
- **Componentes privados de un route group:** usar prefijo `_` en el nombre de archivo/carpeta (`_components/`, `_hooks/`, `TeacherDashboardPlaceholder.jsx` SIN prefijo porque se importa, pero la carpeta que los contiene sí lo lleva). Expo Router ignora estos archivos para routing.

## Entry points y orden de providers

**NO existe `App.jsx`.** El entry point está en `package.json` (`"main": "expo-router/entry"`) y carga automáticamente `app/_layout.jsx` como raíz del routing.

Orden obligatorio de providers en `app/_layout.jsx` (de fuera hacia adentro):

1. `SafeAreaProvider` (de `react-native-safe-area-context`)
2. `AuthProvider` (de `src/context/AuthContext.js`)
3. `AuthGate` (sub-componente local) — usa `useAuth()` + `useSegments()` para redirigir según el estado de sesión.
4. `<Stack />` de `expo-router` — navigator raíz. `screenOptions.header` renderiza `<SchoolHeader />` como header global.

Flujo del auth gate (declarativo con `<Redirect />`):
- `isLoading` → splash (`<RootSplash />`).
- `!user` y segmento en `(app)` → `Redirect href="/"`.
- `user` y segmento en `/` o `index` → `Redirect href="/(app)/dashboard"`.
- Resto → render normal del Stack.

**Render condicional por rol** vive en `app/(app)/dashboard.jsx`: según `userRole` (`'teacher'` | `'guardian'`) se monta el placeholder correspondiente. Esto evita la colisión de URLs que generaría tener `dashboard.jsx` en múltiples route groups.

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

**Instaladas** (`package.json`):
- `expo`, `expo-status-bar`, `expo-constants`, `expo-device`, `expo-notifications`, `expo-linking`
- `expo-router` (file-based routing)
- `react`, `react-native`
- `react-native-safe-area-context`, `react-native-screens`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-worklets`
- `@react-native-async-storage/async-storage`
- `nativewind`, `tailwindcss`
- `clsx`, `lucide-react-native`, `axios`
- Dev: `babel-preset-expo`

**Pendientes de instalar** (cuando se vaya a usar cada feature):
- `expo-secure-store` (para guardar el JWT de forma segura en lugar de AsyncStorage).
- `@react-navigation/*` ya NO se necesita — el proyecto migró a Expo Router. Si ves imports de `@react-navigation/*` en código nuevo, es un error.
- ESLint, Prettier, Jest (crear configs antes de añadir código que los asuma).

Usar siempre `npx expo install` para mantener compatibilidad con SDK 57.

## Lo que NO asumir

- **No asumir `@react-navigation/*`** — este proyecto migró a **Expo Router**. Cualquier `import { ... } from '@react-navigation/native'` en código nuevo es un error de arquitectura. Usar `useRouter()`, `useSegments()`, `<Stack>`, `<Redirect>`, etc. de `expo-router`.
- No asumir que `tailwind.config.js` o `babel.config.js` están "pendientes" — ya están configurados. Verificar antes de duplicar setup.
- No asumir TypeScript ni tipos en ningún archivo.
- No asumir que existe un backend real: la URL base de `api.js` debe venir de una constante de entorno (`process.env.EXPO_PUBLIC_API_URL` o similar), no hardcoded.
- No asumir que `src/screens/` existe — esa carpeta fue eliminada durante la migración a Expo Router. Las pantallas viven ahora en `app/`.
- No asumir que `App.jsx` o `index.js` existen en la raíz — el entry point es `expo-router/entry` configurado en `package.json`.
