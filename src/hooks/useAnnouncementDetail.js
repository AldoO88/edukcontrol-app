// =====================================================================
// useAnnouncementDetail.js
// ---------------------------------------------------------------------
// Hook que carga el detalle de un item del feed (aviso o citatorio)
// por su id. Discrimina por `kind` para llamar al endpoint correcto:
//
//   kind === 'announcement' → GET /api/guardians/me/announcements/:id
//   kind === 'citation'     → GET /api/guardians/me/citations/:id
//
// Encapsula:
//   - Fetch al endpoint correspondiente.
//   - Loading / error state mapeado a mensaje en español.
//   - Re-fetch cuando cambia el id o el kind (ej. navegación entre
//     detalles de distinto tipo).
//   - Re-fetch al volver a foco (useFocusEffect de Expo Router).
//   - Acción `confirm()` para citatorios pendientes
//     (PATCH /api/guardians/me/students/:studentId/citations/:id/confirm).
//     Tras un confirm exitoso, refetchea el detalle para refrescar
//     el status en la UI.
//
// Sigue el mismo patrón que useAnnouncements / useGuardianDashboard:
//   - kindRef / idRef para evitar meter state en deps de useCallback
//     (evita loop infinito con useFocusEffect).
//   - inFlightRef como guard anti-concurrencia (evita race conditions
//     entre focus rápido + cambio de id + React 18 strict mode).
//
// Si `id` o `kind` es null/vacío, el hook NO fetchea (devuelve
// { data: null, isLoading: false }). Cubre el caso de "no llegó
// param" durante el primer render (raro, pero defensivo).
//
// Si `kind` no es 'announcement' ni 'citation', el hook NO fetchea
// y devuelve un error: "Tipo de aviso no válido."
//
// Uso:
//
//   const { kind, id } = useLocalSearchParams();
//   const { data, isLoading, error, refetch, confirm } =
//     useAnnouncementDetail(id, kind);
// =====================================================================

// React hooks.
import { useState, useRef, useCallback, useEffect } from 'react';

// useFocusEffect de expo-router: corre el callback cada vez que la
// pantalla gana foco (incluye initial mount).
import { useFocusEffect } from 'expo-router';

// Servicio de avisos.
import {
  getAnnouncementById,
  getCitationById,
  confirmCitation,
} from '../services/announcementsService';

// Kind válidos. Centralizado para reutilizar en el switch de
// servicios y en la validación de params de la pantalla.
const VALID_KINDS = new Set(['announcement', 'citation']);

export const useAnnouncementDetail = (id = null, kind = null) => {
  // -----------------------------------------------------------------
  // STATE
  // -----------------------------------------------------------------
  // data: el item crudo del backend (AnnouncementItem | CitationItem).
  //   null mientras no se ha cargado o si no hay id/kind.
  // isLoading: true durante fetch inicial y refetches.
  // isConfirming: true durante el PATCH de confirm (se usa para
  //   deshabilitar el botón y mostrar un spinner inline).
  // error: mensaje de error si la carga falló. null si todo OK.
  //   'not_found' se mapea a un mensaje específico en la UI.
  //   'invalid_kind' se setea si el kind no es válido.
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------
  // REFS (no causan re-renders)
  // -----------------------------------------------------------------
  // kindRef / idRef: espejos de los params actuales. Los usamos
  // dentro de fetchData para saber qué cargar sin meter los params
  // en las deps del useCallback (eso era la causa del loop infinito
  // en hooks anteriores).
  const idRef = useRef(id);
  idRef.current = id;
  const kindRef = useRef(kind);
  kindRef.current = kind;

  // inFlightRef: guard anti-concurrencia para fetchData.
  const fetchInFlightRef = useRef(false);
  // inFlightRef: guard anti-concurrencia separado para confirm.
  // Lo separamos para que un confirm en curso no bloquee un
  // refetch disparado por focus (o viceversa).
  const confirmInFlightRef = useRef(false);

  // -----------------------------------------------------------------
  // fetchData: función estable (deps vacías) que llama al service.
  // Es la ÚNICA vía para cargar/recargar datos (interna o externa).
  // -----------------------------------------------------------------
  const fetchData = useCallback(async () => {
    const currentKind = kindRef.current;
    const currentId = idRef.current;

    // Sin params: reseteamos y no fetcheamos.
    if (!currentId || !currentKind) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Validación de kind: si no es válido, no fetcheamos.
    if (!VALID_KINDS.has(currentKind)) {
      setData(null);
      setIsLoading(false);
      setError('Tipo de aviso no válido.');
      return;
    }

    // Guard anti-concurrencia.
    if (fetchInFlightRef.current) return;
    fetchInFlightRef.current = true;

    setIsLoading(true);
    setError(null);
    try {
      // Discriminamos por kind para llamar al endpoint correcto.
      // Mantenemos un solo punto de switch para que añadir un kind
      // nuevo en el futuro sea trivial.
      const result = currentKind === 'citation'
        ? await getCitationById(currentId)
        : await getAnnouncementById(currentId);

      if (!result.success) {
        setError(result.message);
        // NO limpiamos data en un refetch: si ya teníamos data
        // previa, queremos mostrarla + el banner de error.
      } else {
        setData(result.data || null);
        setError(null);
      }
    } catch (err) {
      console.error('[useAnnouncementDetail] unexpected error:', err);
      setError('Error inesperado al cargar el aviso.');
    } finally {
      setIsLoading(false);
      fetchInFlightRef.current = false;
    }
  }, []); // DEPS VACÍAS — clave para evitar loops con useFocusEffect.

  // -----------------------------------------------------------------
  // confirm: acción que confirma la asistencia a un citatorio.
  // -----------------------------------------------------------------
  // Solo aplica a citatorios en status 'pending'. Cambia el status
  // a 'confirmed' en el backend. Tras un confirm exitoso, refetchea
  // el detalle para refrescar la UI (status, pills, botón).
  //
  // Si el item no es un citatorio, o falta el studentId, devuelve
  // un error sin llamar al backend (defensa en profundidad).
  // -----------------------------------------------------------------
  const confirm = useCallback(async () => {
    // Defensas: si no es citatorio o falta el studentId, no
    // intentamos el PATCH (la UI nunca debería llamar a confirm()
    // en estos casos, pero validamos aquí por si acaso).
    const currentData = data;
    if (!currentData || currentData.kind !== 'citation') {
      return {
        success: false,
        message: 'Solo se pueden confirmar citatorios.',
      };
    }
    if (currentData.status !== 'pending') {
      return {
        success: false,
        message: 'Este citatorio ya no se puede confirmar.',
      };
    }
    const studentId = currentData.student?._id;
    if (!studentId) {
      return {
        success: false,
        message: 'No se encontró el alumno asociado al citatorio.',
      };
    }

    // Guard anti-concurrencia (separado del de fetchData para que
    // un confirm en curso no bloquee un refetch por focus).
    if (confirmInFlightRef.current) {
      return { success: false, message: 'Ya hay una confirmación en curso.' };
    }
    confirmInFlightRef.current = true;

    setIsConfirming(true);
    try {
      const result = await confirmCitation(studentId, currentData._id);
      if (result.success) {
        // Refetch del detalle para refrescar status en la UI.
        // No await-eamos aquí para que la UI sienta la respuesta
        // del confirm de inmediato; el refetch ocurre en background.
        fetchData();
      }
      return result;
    } catch (err) {
      console.error('[useAnnouncementDetail] unexpected confirm error:', err);
      return {
        success: false,
        message: 'Error inesperado al confirmar el citatorio.',
      };
    } finally {
      setIsConfirming(false);
      confirmInFlightRef.current = false;
    }
  }, [data, fetchData]);

  // -----------------------------------------------------------------
  // EFECTO: cuando cambia el id o el kind, reseteamos y refetchamos.
  // -----------------------------------------------------------------
  useEffect(() => {
    setData(null);
    setError(null);
    if (id && kind) {
      fetchData();
    }
    // fetchData es estable (deps []), no necesita estar aquí.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, kind]);

  // -----------------------------------------------------------------
  // useFocusEffect: re-fetchea cuando la pantalla gana foco.
  // -----------------------------------------------------------------
  // Útil para cuando el usuario vuelve de otra pestaña y el item
  // podría haber cambiado (ej. citatorio confirmado por otro
  // dispositivo, o cambios en un aviso). Como fetchData es estable
  // (deps []), el callback que pasamos a useFocusEffect es siempre
  // la misma referencia → no re-dispara en cada render.
  useFocusEffect(
    useCallback(() => {
      if (idRef.current && kindRef.current) {
        fetchData();
      }
    }, [fetchData]),
  );

  return {
    data,
    isLoading,
    isConfirming,
    error,
    refetch: fetchData,
    confirm,
  };
};
