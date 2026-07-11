// =====================================================================
// tailwind.config.js
// ---------------------------------------------------------------------
// Configuración de Tailwind CSS para NativeWind v4.
// Le dice al compilador DÓNDE buscar clases y cómo extender el
// theme con los colores de nuestra paleta institucional.
// =====================================================================

/** @type {import('nativewind/types').Config} */
module.exports = {
  // presets: NativeWind v4 expone su propio preset de Tailwind que
  // registra los "theme" tokens compatibles con React Native
  // (algunos valores web como grid/floats no existen en RN y se
  // omiten). Sin este preset, NativeWind lanza el error
  // "Tailwind CSS has not been configured with the NativeWind preset".
  presets: [require('nativewind/preset')],

  // content: rutas donde el compilador buscará las clases de
  // Tailwind. Si una clase no aparece en estos archivos, NO se
  // incluirá en el bundle final (tree-shaking). Listamos TODOS
  // los directorios relevantes del proyecto.
  content: [
    // Componentes, screens, hooks, etc. de src/.
    './src/**/*.{js,jsx,ts,tsx}',
    // App.js raíz (también usa className para el splash).
    './App.js',
  ],

  // theme.extend: extendemos el theme de Tailwind con valores
  // específicos de EdukControl. Aquí podríamos redefinir colores,
  // fuentes, espaciados, etc. Por ahora dejamos el theme por
  // defecto de Tailwind (slate, sky, emerald, amber, rose ya
  // están incluidos en la paleta estándar).
  theme: {
    extend: {
      // fontFamily: si en el futuro añadimos fuentes custom con
      // expo-font, las registramos aquí. Por ahora usamos la del
      // sistema (System en iOS, Roboto en Android).
      fontFamily: {
        sans: ['System'],
      },
    },
  },

  // plugins: plugins adicionales de Tailwind. Por ahora ninguno.
  plugins: [],
};
