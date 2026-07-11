// =====================================================================
// metro.config.js
// ---------------------------------------------------------------------
// Configuración de Metro, el bundler de React Native. Por defecto
// Expo trae una configuración óptima, pero NativeWind v4 necesita
// que le digamos a Metro que use el resolver CSS-aware para poder
// procesar el global.css y los className.
// =====================================================================

// Importamos la config por defecto de Expo.
const { getDefaultConfig } = require('expo/metro-config');

// Importamos el resolver específico de NativeWind (withNativeWind).
// Este wrapper enseña a Metro a entender los archivos .css y a
// transformar las clases de Tailwind en objetos StyleSheet nativos.
const { withNativeWind } = require('nativewind/metro');

// Creamos la config base de Expo (ya incluye todo lo necesario
// para React Native, TypeScript, assets, etc.).
const config = getDefaultConfig(__dirname);

// Exportamos la config envuelta con withNativeWind. Esto es TODO
// lo que necesitamos: el resto lo gestiona NativeWind internamente.
module.exports = withNativeWind(config, {
  // input: ruta al archivo CSS con las directivas @tailwind.
  // NativeWind lo lee en build-time para extraer las clases usadas.
  input: './global.css',
});
