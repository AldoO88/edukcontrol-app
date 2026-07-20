// =====================================================================
// useApiResource.js
// ---------------------------------------------------------------------
// Hook para consumir un endpoint HTTP de forma declarativa. Maneja:
//   - El estado de carga (loading).
//   - El error (si lo hubo).
//   - Los datos (data) en un cache local.
//   - Una función refresh() para recargar bajo demanda (pull-to-refresh).
// Pensado para reemplazar el patrón "useEffect + setLoading + try/catch"
// repetido en cada pantalla que trae datos de un endpoint.
// =====================================================================

// React hooks: useState, useEffect, useCallback.
import { useState, useEffect, useCallback } from 'react';

// El hook acepta:
//   - fetcher: función ASÍNCRONA que devuelve los datos (típicamente
//     un wrapper de api.get(...) o similar).
//   - deps: array de dependencias opcional. Si cambia, se vuelve a
//     fetchear automáticamente. Default: [] (solo al montar).
//   - options.initialData: valor inicial de data mientras el fetcher
//     no ha terminado. Útil para que la UI no reciba `null` y pueda
//     hacer `.length` o `.map` directamente. Default: undefined.
// Devuelve:
//   - data: lo que devolvió el fetcher (o initialData mientras carga).
//   - loading: true mientras está cargando.
//   - error: Error|null.
//   - refresh(): recarga invocando fetcher() de nuevo.
//   - setData: setter manual (útil para optimistic updates).
export const useApiResource = (fetcher, deps = [], options = {}) => {
  // Estado de los datos. Inicia en initialData (default undefined).
  // Usar undefined (no null) es importante: el destructuring default
  // `= []` del caller solo se activa cuando el valor es undefined.
  // Si devolviéramos null, el `[]` nunca se aplicaría y `data.length`
  // explotaría con "Cannot read property 'length' of null".
  const [data, setData] = useState(options.initialData);

  // Estado de carga. Inicia en true porque asumimos carga al montar.
  const [loading, setLoading] = useState(true);

  // Estado de error. Inicia en null.
  const [error, setError] = useState(null);

  // load: función central que ejecuta el fetcher. Encapsula el
  // try/catch y la actualización de estados. useCallback para
  // identidad estable (importante para useEffect y refresh).
  const load = useCallback(async () => {
    // Activamos loading y limpiamos error ANTES de empezar.
    setLoading(true);
    setError(null);
    try {
      // Ejecutamos el fetcher. Si el caller no pasa uno, no
      // hacemos nada (útil para hooks condicionales).
      if (typeof fetcher !== 'function') {
        setData(options.initialData);
        return;
      }
      // Esperamos la promesa. Asumimos que el fetcher ya devuelve
      // la data (no la response cruda) — esa es la convención.
      const result = await fetcher();
      setData(result);
    } catch (err) {
      // Guardamos el error para que la UI pueda mostrarlo. NO
      // relanzamos para que la app no se caiga.
      setError(err);
    } finally {
      // Siempre desactivamos loading, incluso si hubo error.
      setLoading(false);
    }
  }, [fetcher, options.initialData]);

  // useEffect: ejecuta load al montar y cuando cambien las deps.
  // Usamos la firma async-safe: load() devuelve una promesa que
  // ignoramos (ya gestiona su propio estado).
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // refresh: alias semántico de load, para que el código que
  // hace pull-to-refresh sea legible ("refresh" vs "load").
  const refresh = useCallback(() => {
    return load();
  }, [load]);

  return { data, loading, error, refresh, setData };
};
