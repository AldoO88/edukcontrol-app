// =====================================================================
// babel.config.js
// ---------------------------------------------------------------------
// Configuración de Babel para el proyecto "EdukControl".
// Babel es el motor que transforma JS moderno (JSX, TypeScript,
// sintaxis moderna) en código compatible con React Native.
//
// IMPORTANTE: el ORDEN de los presets importa. El preset de Expo
// debe ir ANTES del de NativeWind, porque el de NativeWind necesita
// que JSX ya haya sido parseado por el de Expo para funcionar bien.
// =====================================================================

// babel-preset-expo: preset oficial de Expo, incluye:
//   - @babel/preset-env (sintaxis moderna)
//   - @babel/preset-react (JSX)
//   - Soporte para TypeScript
//   - El "transformer" específico de RN (gestionado por Metro)
module.exports = function (api) {
  // Cache: true acelera builds en desarrollo.
  api.cache(true);

  return {
    // Presets: se aplican en orden INVERSO al listado (el último
    // se aplica primero). Por eso listamos Expo primero y NativeWind
    // después: esto significa que NativeWind se ejecuta ANTES que
    // Expo, que es lo que queremos para que el plugin de className
    // opere sobre JSX crudo.
    presets: [
      // Preset oficial de Expo SDK 57.
      ['babel-preset-expo', { jsxImportSource: 'react' }],
      // Preset de NativeWind v4: transforma className en StyleSheet.
      // Sin esto, las clases de Tailwind NO funcionarían en RN.
      'nativewind/babel',
    ],
    // Plugins: NativeWind v4 usa react-native-worklets (basado en
    // reanimated) para poder transformar las clases en runtime sin
    // perder rendimiento. El plugin DEBE ir el último en la lista.
    plugins: ['react-native-worklets/plugin'],
  };
};
