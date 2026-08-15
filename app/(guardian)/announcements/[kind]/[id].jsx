// =====================================================================
// app/(guardian)/announcements/[kind]/[id].jsx
// ---------------------------------------------------------------------
// Ruta dinámica "/announcements/:kind/:id" del route group (app). Pantalla
// de DETALLE de un aviso o citatorio.
//
// Por qué el kind en la URL:
//   - El feed del backend unifica ambos kinds en una sola lista, pero
//     los endpoints de detalle son ESPECÍFICOS por kind:
//       * announcement → GET /api/guardians/me/announcements/:id
//       * citation     → GET /api/guardians/me/citations/:id
//   - El kind ya lo conoce el front al hacer tap (viene en el item
//     del feed), así que lo pasamos en la URL para que esta pantalla
//     sepa a qué endpoint llamar SIN un fetch extra de "discovery".
//   - URLs semánticas: /announcements/citation/123 es más claro que
//     /announcements/123?kind=citation (y se puede compartir tal cual).
//
// =====================================================================
// DATA SOURCE
// ---------------------------------------------------------------------
// El item se obtiene del endpoint correspondiente al `kind`:
//
//   - kind === 'announcement':
//       GET /api/guardians/me/announcements/:id
//       → AnnouncementItem (title, message, sender, audience, etc.)
//
//   - kind === 'citation':
//       GET /api/guardians/me/citations/:id
//       → CitationDetail (reason, scheduledDate, status, student
//         con controlNumber, creator, schoolYear, etc.)
//
// El item del citatorio YA incluye `student.controlNumber`, así que
// el front puede mostrar la matrícula del alumno ("Pedro González —
// Matrícula: 2610049001") sin un fetch extra.
//
// IMPORTANTE sobre el `kind` en el body:
//   El detail del backend NO incluye `kind` en el body de la
//   respuesta (considera redundante mandarlo porque ya viaja en
//   la URL). El service (`getAnnouncementById` / `getCitationById`)
//   lo agrega al normalizar para que el consumer pueda discriminar
//   con `item.kind` sin tener que conocer la URL. Esta pantalla
//   usa `item?.kind` confiando en esa normalización.
//
// Status del citatorio (4 valores en el detail; el feed solo trae
// 'pending' | 'confirmed' porque los terminales se filtran):
//   - 'pending'   → cita futura, aún sin confirmar.
//   - 'confirmed' → la familia confirmó (la cita aún no pasó).
//   - 'completed' → la cita pasó y la familia ASISTIÓ.
//   - 'no_show'   → la cita pasó y la familia NO ASISTIÓ.
//
// La acción "Confirmar asistencia" llama a:
//   PATCH /api/guardians/me/students/:studentId/citations/:citationId/confirm
// Solo se muestra para citatorios en status 'pending'. Los otros
// estados muestran badges informativos (ver `nonPendingBadge`).
// =====================================================================
// CHROME
// ---------------------------------------------------------------------
// Esta es una pantalla "hija" (push) del feed de Avisos. NO usa el
// chrome compartido del route group (DashboardHeader, SchoolInfoCard,
// BottomTabBar) porque:
//   - El usuario ya está dentro del flujo de Avisos; no necesita
//     el brand ni la campana repetidos.
//   - El SchoolInfoCard ya se vio en el listado.
//   - El BottomTabBar no aplica en sub-rutas (el back button es el
//     patrón correcto para "subir un nivel").
//
// En su lugar, usamos una barra superior custom con back button
// (chevron-left + "Volver") que llama a router.back(). El header
// nativo de Expo Router está deshabilitado via `headerShown:false`
// en app/(guardian)/_layout.jsx.
// =====================================================================

// React + hooks.
import React, { useMemo, useCallback } from 'react';

// Primitivas RN: View, Text, ScrollView, Pressable, Image, ActivityIndicator, Alert.
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';

// useRouter y useLocalSearchParams de expo-router.
import { useRouter, useLocalSearchParams } from 'expo-router';

// useSafeAreaInsets para respetar el área segura del dispositivo
// (status bar, dynamic island, home indicator). El SafeAreaProvider
// ya está montado en app/_layout.jsx, así que el hook funciona
// directamente acá.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Chrome compartido del route group (guardian). El detalle usa el
// MISMO DashboardHeader y SchoolInfoCard que el feed para que la
// transición feed → detalle se sienta continua (el usuario ve el
// mismo brand, campana y escuela a la que pertenecen los avisos).
// Solo omitimos el BottomTabBar porque esta es una sub-ruta (el
// back button es el patrón correcto para "subir un nivel").
// Path: este archivo vive en `app/(guardian)/announcements/[kind]/`, así que
// para llegar a `src/components/` hay que subir 3 niveles.
import DashboardHeader from '../../../../src/components/DashboardHeader'
import SchoolInfoCard from '../../../../src/components/SchoolInfoCard';

// Hook del dashboard del tutor. Aquí lo usamos SOLO para obtener
// la info de la escuela (`data.school`) que consume el
// SchoolInfoCard. El hook ya está corriendo en el feed (la
// pantalla anterior en el stack); acá hacemos una segunda llamada
// que dispara otro fetch. Es un trade-off aceptable: mantiene la
// pantalla self-contained (no depende de estado compartido) y
// garantiza que si el feed se actualizó mientras el usuario
// estaba en otra tab, la escuela se vea "fresca" al volver.
import { useGuardianDashboard } from '../../../../src/hooks/useGuardianDashboard';

// Contexto de autenticación. Lo usamos SOLO como último fallback
// para el nombre del tutor (si ni el citatorio ni el dashboard lo
// traen, el usuario logueado ES el tutor de la app parent-facing).
import { useAuth } from '../../../../src/hooks/useAuth';

// Iconos vectoriales (lucide).
import {
  ChevronLeft,     // back button
  User,            // persona (sender / creator)
  Users,           // grupo (target group)
  Globe,           // audiencia general
  UserRound,       // audiencia por alumno
  Calendar,        // fechas (meta)
  Clock,           // hora (meta)
  GraduationCap,   // alumno (citatorio)
  AlertCircle,     // error
  RefreshCw,       // retry
  Check,           // confirmar citatorio / asistir
  XCircle,         // no asistió
  CalendarClock,   // reagendar citatorio
  IdCard,          // matrícula
} from 'lucide-react-native';

// Hook que carga el item del backend y expone la acción `confirm`.
import { useAnnouncementDetail } from '../../../../src/hooks/useAnnouncementDetail';

// Helpers de fechas. Sentence helpers se usan para componer la
// frase del citatorio ("Cita con el Profesor X el martes 28 de
// octubre a las 10:30 AM").
import {
  formatFullDate,
  formatFullDateTime,
  formatScheduledDateTime,
  formatScheduledSentenceDate,
  formatScheduledSentenceTime,
} from '../../../../src/utils/dateHelpers';

// Helper para derivar targetType, motivo y status del item (mismo
// helper que usa el feed; garantiza que la pantalla de detalle
// muestre exactamente la misma metadata que la card del listado).
import {
  audienceTargetTypeLabel,
  citatorioStudentName,
  citatorioStatusInfo,
} from '../../../../src/utils/announcementHelpers';

// clsx.
import { clsx } from 'clsx';

// ---------------------------------------------------------------------
// PRIORITY_CONFIG / CITATION_CONFIG (mismos que AnnouncementCard)
// ---------------------------------------------------------------------
// Reusamos los mismos estilos de borde y pill que las cards del feed
// para que la pantalla de detalle "pertenezca" visualmente al mismo
// universo. Centralizado en el feed, pero duplicado aquí para que
// esta pantalla sea self-contained (no necesita importar el card).
//
// Cada entrada expone:
//   - borderClass:      color del borde IZQUIERDO de 4px (legacy,
//                      igual que en el card del feed). Se mantiene
//                      por consistencia aunque acá no lo usemos.
//   - rightBorderClass: color del borde DERECHO de 4px para la
//                      card del título en el detalle. Mismo color
//                      semántico que el izquierdo, pero prefijo
//                      `border-r-` para aplicar solo al lado
//                      derecho (los otros lados quedan con el
//                      border sutil slate-100).
//   - badge: { bg, text, label } — estilos del pill de tipo.
// ---------------------------------------------------------------------
const PRIORITY_CONFIG = {
  urgent: {
    borderClass: 'border-rose-500',
    rightBorderClass: 'border-r-rose-500',
    badge: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'URGENTE' },
  },
  informative: {
    borderClass: 'border-sky-500',
    rightBorderClass: 'border-r-sky-500',
    badge: { bg: 'bg-sky-600', text: 'text-white', label: 'INFORMATIVO' },
  },
};

const CITATION_CONFIG = {
  borderClass: 'border-amber-500',
  rightBorderClass: 'border-r-amber-500',
  badge: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'CITATORIO' },
};

// ---------------------------------------------------------------------
// CITATION_TYPE_CONFIG
// ---------------------------------------------------------------------
// Pill adicional que muestra el `type` del citatorio (Académico /
// Conductual / Administrativo). Se muestra junto al pill CITATORIO
// para dar contexto sobre el motivo.
// ---------------------------------------------------------------------
const CITATION_TYPE_CONFIG = {
  academic: { bg: 'bg-sky-100', text: 'text-sky-700', label: 'ACADÉMICO' },
  behavioral: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'CONDUCTUAL' },
  administrative: { bg: 'bg-slate-200', text: 'text-slate-700', label: 'ADMINISTRATIVO' },
};

// ---------------------------------------------------------------------
// ROLE_LABELS
// ---------------------------------------------------------------------
// Traducción de los roles del backend (inglés) a etiquetas en
// español. La traducción es best-effort: si el rol no está en el
// mapa, mostramos el valor crudo.
// ---------------------------------------------------------------------
const ROLE_LABELS = {
  admin: 'Administrador',
  principal: 'Director(a)',
  registrar: 'Secretaría',
  teacher: 'Docente',
  prefect: 'Prefecto(a)',
  social_worker: 'Trabajador(a) social',
  super_admin: 'Super administrador',
};

// ---------------------------------------------------------------------
// ROLE_IN_SENTENCE
// ---------------------------------------------------------------------
// Versión "en oración" del rol, usada para componer la frase del
// citatorio. Ejemplos:
//
//   "Cita con el Profesor Carlos Ramírez el martes 28 de octubre a las 10:30 AM"
//   "Cita con el Director Carlos Ramírez ..."
//
// El artículo es siempre "el" (masculino genérico, convencional en
// es-MX para roles profesionales). El sustantivo va en singular
// capitalizado como si fuera un título antes del nombre propio.
// ---------------------------------------------------------------------
const ROLE_IN_SENTENCE = {
  admin: 'el Administrador',
  principal: 'el Director',
  registrar: 'el Registrador',
  teacher: 'el Profesor',
  prefect: 'el Prefecto',
  social_worker: 'el Trabajador Social',
  super_admin: 'el Super Administrador',
};

// ---------------------------------------------------------------------
// getInitials(name)
// ---------------------------------------------------------------------
// Helper: 1-2 chars para fallback de avatar. Si name es vacío, "?".
const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ---------------------------------------------------------------------
// getFullName(person)
// ---------------------------------------------------------------------
// Combina first_name + last_name. Devuelve '' si la persona es null.
const getFullName = (person) => {
  if (!person) return '';
  return [person.first_name, person.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function DetalleAvisoScreen() {
  // -----------------------------------------------------------------
  // ROUTER + PARAMS
  // -----------------------------------------------------------------
  // useRouter: para el back button y (futuro) push a sub-rutas.
  // useLocalSearchParams: lee el :kind y :id de la URL. Expo Router
  // devuelve strings (o arrays), nunca números — el _id del backend
  // es un ObjectId hex de 24 chars, así que string es lo correcto.
  const router = useRouter();
  const { kind, id } = useLocalSearchParams();

  // Safe area insets del dispositivo. En iOS el `top` es ~47-59px
  // (status bar + dynamic island); en Android moderno suele ser
  // ~24-32px (status bar). Como el DashboardHeader (que va fijo
  // arriba) ya maneja el safe area top internamente, acá solo
  // necesitamos `bottom` para que el contenido del ScrollView no
  // quede pegado al home indicator.
  const insets = useSafeAreaInsets();

  // -----------------------------------------------------------------
  // DATA DE LA ESCUELA (para el SchoolInfoCard)
  // -----------------------------------------------------------------
  // useGuardianDashboard también expone `data.school`, que es lo
  // que consume <SchoolInfoCard>. Hacemos la llamada completa
  // (no desestructuramos solo `school` para mantener la firma del
  // hook consistente con el resto de la app). `isLoadingDashboard`
  // lo pasamos al card para que muestre su propio skeleton mientras
  // llegan los datos.
  const { data: dashboardData, isLoading: isLoadingDashboard } = useGuardianDashboard();

  // -----------------------------------------------------------------
  // USUARIO LOGUEADO (fallback para el nombre del tutor)
  // -----------------------------------------------------------------
  // En esta app parent-facing el usuario autenticado ES el
  // padre/tutor, así que su nombre sirve como último recurso si ni
  // el citatorio ni el dashboard traen los datos del tutor.
  const { user: authUser } = useAuth();

  // -----------------------------------------------------------------
  // DATA DEL ITEM (aviso o citatorio)
  // -----------------------------------------------------------------
  // Hook que carga el item por id según el kind. Devuelve
  // { data, isLoading, isConfirming, error, refetch, confirm }.
  // data es null mientras no se ha cargado o si no hay id/kind.
  // `confirm` es la acción para citatorios pendientes
  // (PATCH /confirm); devuelve { success, message? }.
  const {
    data: item,
    isLoading,
    isConfirming,
    error,
    refetch,
    confirm,
  } = useAnnouncementDetail(id, kind);

  console.log("Item detail:", item);

  // -----------------------------------------------------------------
  // DERIVADOS
  // -----------------------------------------------------------------
  // Config visual según kind. kind === 'citation' gana sobre priority.
  // Si llega un kind desconocido, fallback al config 'informative'.
  const itemKind = item?.kind;
  const priority = item?.priority;
  const visualConfig = useMemo(() => {
    if (itemKind === 'citation') return CITATION_CONFIG;
    return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.informative;
  }, [itemKind, priority]);

  // Pill extra para citatorios (el `type`).
  const citationTypeConfig = useMemo(() => {
    if (itemKind !== 'citation' || !item?.type) return null;
    return CITATION_TYPE_CONFIG[item.type] || null;
  }, [itemKind, item?.type]);

  // Status derivado del citatorio (VENCIDO / HOY / etc.). Reusamos
  // el helper del feed para mantener consistencia.
  const citatorioStatus = useMemo(
    () => citatorioStatusInfo(item),
    [item],
  );

  // Nombre completo del sender (anuncios) o creator (citatorios).
  const senderName = useMemo(
    () => (itemKind === 'citation' ? getFullName(item?.creator) : getFullName(item?.sender)),
    [itemKind, item],
  );

  // Sender/creator role (para mostrar debajo del nombre, si existe).
  const senderRole = useMemo(() => {
    if (itemKind === 'citation') return item?.creator?.role || null;
    return item?.sender?.role || null;
  }, [itemKind, item]);

  const roleLabel = senderRole ? ROLE_LABELS[senderRole] || senderRole : null;

  // -----------------------------------------------------------------
  // NOMBRE DEL PADRE/TUTOR (card "Para el tutor" del citatorio)
  // -----------------------------------------------------------------
  // Cascada de fuentes, de la más específica a la más genérica:
  //
  //   1) `item.guardian` — si el backend incluye el tutor destinatario
  //      en el detail del citatorio, ese es el dato correcto (es el
  //      tutor al que se dirigió ESTE citatorio).
  //   2) `dashboardData.user` — el tutor logueado según
  //      GET /api/guardians/me/dashboard. `user.name` suele venir ya
  //      como nombre completo ("Carlos Pérez"), así que solo
  //      concatenamos `last_name` cuando NO está ya contenido en
  //      `name` (evita duplicados tipo "Carlos Pérez Pérez").
  //   3) `authUser.name` — el user persistido en el AuthContext.
  //
  // Si ninguna fuente tiene datos, devolvemos null y la card muestra
  // un placeholder en vez de un string vacío.
  const guardianName = useMemo(() => {
    // 1) Tutor que viene en el propio citatorio (si el backend lo manda).
    const fromItem = getFullName(item?.guardian) || item?.guardian?.name || null;
    if (fromItem) return fromItem;

    // 2) Tutor del dashboard.
    const dashboardUser = dashboardData?.user;
    if (dashboardUser?.name) {
      const last = dashboardUser.last_name;
      const alreadyIncluded = last
        && dashboardUser.name.toLowerCase().includes(last.toLowerCase());
      return last && !alreadyIncluded
        ? `${dashboardUser.name} ${last}`.trim()
        : dashboardUser.name;
    }

    // 3) User del AuthContext.
    return authUser?.name || null;
  }, [item?.guardian, dashboardData?.user, authUser?.name]);

  // Parentesco del tutor con el alumno del citatorio ("padre",
  // "madre", "tutor"...). El dashboard lo trae por alumno en
  // `students[].relationship`, así que buscamos el alumno del
  // citatorio por _id. Si no hay match (o el backend no manda el
  // campo), devolvemos null y la card omite la línea.
  const guardianRelationship = useMemo(() => {
    const studentId = item?.student?._id;
    if (!studentId) return null;
    const match = (dashboardData?.students || []).find(
      (s) => s?._id === studentId,
    );
    const relationship = match?.relationship;
    if (!relationship) return null;
    // Capitalizamos la primera letra ("madre" → "Madre") porque el
    // backend la manda en minúsculas.
    return relationship.charAt(0).toUpperCase() + relationship.slice(1);
  }, [item?.student?._id, dashboardData?.students]);

  // -----------------------------------------------------------------
  // HANDLER: Confirmar asistencia
  // -----------------------------------------------------------------
  // useCallback para que la referencia sea estable entre renders.
  // Llama al hook `confirm`; si falla, muestra un Alert con el
  // mensaje mapeado a español (ya viene friendly desde el service).
  // Si tiene éxito, el hook refetchea el detalle automáticamente,
  // así que la UI se actualiza con el nuevo status.
  const handleConfirm = useCallback(async () => {
    const result = await confirm();
    if (!result?.success) {
      Alert.alert(
        'No se pudo confirmar',
        result?.message || 'Inténtalo de nuevo.',
        [{ text: 'Aceptar' }],
      );
    }
  }, [confirm]);

  // -----------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------
  return (
    // Contenedor raíz. bg-slate-50 mismo fondo que el resto de la
    // app, para que las cards blancas destaquen.
    <View className="flex-1 bg-slate-50">
      {/* ============================================================
          DASHBOARD HEADER (fijo, arriba)
          ============================================================
          Mismo componente que usan el feed, el dashboard y las otras
          pantallas del route group (app). Muestra el isotipo
          sky-500 + "EdukControl" + campana de notificaciones, y
          maneja su propio safe area top internamente. Lo agregamos
          al detalle para mantener la continuidad visual con el
          feed (el usuario ve el mismo brand al hacer tap en una
          card).
          ============================================================ */}
      <DashboardHeader />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        // pb-10 (40px) + insets.bottom para que la última card no
        // quede pegada al home indicator en iPhones sin botón
        // físico. En Android (donde insets.bottom suele ser 0) el
        // pb-10 manda solo.
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
      >
       

        {/* ============================================================
            SCHOOL INFO CARD (dentro del ScrollView)
            ============================================================
            Mismo componente que el feed. Muestra el logo de la
            escuela + nombre + ciclo escolar. Lo agregamos al
            detalle para que el usuario siempre tenga presente a
            qué escuela pertenece el aviso/citatorio (multi-tenant).
            `mx-4 mt-2` alinea el card con el gutter lateral y le da
            un pequeño gap respecto al back button. `isLoading`
            hace que el card muestre su propio skeleton mientras
            llega la data del dashboard.
            ============================================================ */}
        <SchoolInfoCard
          school={dashboardData?.school}
          isLoading={isLoadingDashboard}
          className="mx-4 mt-2"
        />

         {/* ============================================================
            BACK BUTTON (dentro del ScrollView, scrollea con el contenido)
            ============================================================
            Como el DashboardHeader ya maneja el safe area top, el
            "Volver" ya no necesita `insets.top + 16` — solo el
            gutter lateral (px-4) y un poco de aire vertical
            (py-2). Va DENTRO del ScrollView (no fijo arriba) para
            que scrollee con el SchoolInfoCard y el contenido del
            detalle, siguiendo el mismo patrón que el feed.
            hitSlop amplía el área táctil del Pressable sin
            afectar el layout.
            ============================================================ */}
        <View className="px-4 py-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="flex-row items-center self-start"
            accessibilityRole="button"
            accessibilityLabel="Volver al listado de avisos"
          >
            <ChevronLeft size={20} color="#0284c7" strokeWidth={2.25} />
            <Text className="text-sm font-bold text-sky-600 ml-1">
              Volver
            </Text>
          </Pressable>
        </View>

        {/* ============================================================
            ESTADOS DE CARGA
            ============================================================
            - isLoading + sin data: spinner centrado.
            - error + sin data: error card con retry.
            - data OK: render del detalle según kind.
            ============================================================ */}

        {/* 1) Loading inicial. */}
        {isLoading && !item && (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#0f172a" />
            <Text className="text-sm text-slate-500 mt-3 font-medium">
              Cargando aviso...
            </Text>
          </View>
        )}

        {/* 2) Error sin data previa. */}
        {!isLoading && error && !item && (
          <View className="bg-white rounded-3xl p-6 items-center shadow-sm border border-rose-100 mx-4 mt-4">
            <AlertCircle size={32} color="#e11d48" strokeWidth={2} />
            <Text className="text-sm font-semibold text-rose-700 mt-3 text-center">
              No se pudo cargar el aviso
            </Text>
            <Text className="text-xs text-slate-500 mt-1 text-center">
              {error}
            </Text>
            <Pressable
              onPress={refetch}
              className="flex-row items-center mt-4 px-4 py-2 bg-sky-600 active:bg-sky-700 rounded-xl"
              accessibilityRole="button"
              accessibilityLabel="Reintentar carga del aviso"
            >
              <RefreshCw size={14} color="#ffffff" strokeWidth={2.5} />
              <Text className="text-sm font-semibold text-white ml-1.5">
                Reintentar
              </Text>
            </Pressable>
          </View>
        )}

        {/* 3) Data OK: render del detalle. Discriminamos por kind. */}
        {!isLoading && !error && item && (
          itemKind === 'citation' ? (
            <CitationDetail
              item={item}
              visualConfig={visualConfig}
              citationTypeConfig={citationTypeConfig}
              citatorioStatus={citatorioStatus}
              senderName={senderName}
              roleLabel={roleLabel}
              guardianName={guardianName}
              guardianRelationship={guardianRelationship}
              isConfirming={isConfirming}
              onConfirm={handleConfirm}
            />
          ) : (
            <AnnouncementDetail
              item={item}
              visualConfig={visualConfig}
              senderName={senderName}
              roleLabel={roleLabel}
            />
          )
        )}
      </ScrollView>
    </View>
  );
}

// =====================================================================
// AnnouncementDetail — layout del detalle de un AVISO
// =====================================================================
// Estructura (de arriba a abajo):
//   - Header pill + fecha
//   - Title (text-2xl)
//   - Card "De:" (sender + role)
//   - Card "Para:" (targetType con ícono según audience.type)
//   - Card "Mensaje" con el body completo
//   - Meta info (Publicado / Expira)
//
// Alineado con el spec:
//   - Header: title
//   - Cuerpo: message completo
//   - Footer: nombre del sender/creator + role (lo mostramos arriba
//     como card "De:" para que tenga el peso visual del remitente).
// =====================================================================
function AnnouncementDetail({ item, visualConfig, senderName, roleLabel }) {
  // Fechas de la card de meta. createdAt siempre viene; expiresAt
  // puede ser null (avisos sin expiración).
  const createdAt = item.createdAt ? new Date(item.createdAt) : null;
  const expiresAt = item.expiresAt ? new Date(item.expiresAt) : null;

  return (
    <View className="px-4 pt-2">
      {/* ============================================================
          HEADER: pill de tipo + fecha corta
          ============================================================
          Replicamos el header del card del feed para que el "lenguaje
          visual" sea consistente. La fecha se formatea en formato
          corto "24 oct" (mismo helper que el feed usa).
          ============================================================ */}
      <View className="flex-row items-center justify-between">
        <View className={clsx('px-3 py-1 rounded-full', visualConfig.badge.bg)}>
          <Text className={clsx(
            'text-[11px] font-bold uppercase tracking-wider',
            visualConfig.badge.text,
          )}>
            {visualConfig.badge.label}
          </Text>
        </View>
        <Text className="text-xs font-medium text-slate-400">
          {formatDateShort(item.eventDate)}
        </Text>
      </View>

      {/* ============================================================
          TITLE (en card con accent en el borde DERECHO)
          ============================================================
          El título es el elemento más prominente de la pantalla de
          detalle. Lo envolvemos en una card blanca (mismo lenguaje
          que el resto del detalle) y le agregamos un borde DERECHO
          de 4px con el color del tipo/prioridad:

            - urgent     → border-r-rose-500
            - informative → border-r-sky-500
            - citation   → border-r-amber-500

          El accent es solo en el lado derecho (no en los 4 lados)
          para que el título se sienta distinto a las cards de
          metadata (De:, Para:, Mensaje) sin saturar visualmente.
          Los otros 3 lados quedan con un border sutil slate-100
          para que la card tenga definición.

          La card tiene un label "TÍTULO" (uppercase tracking-wide,
          mismo patrón que "De:", "Para:", "Mensaje" en las otras
          cards) para mantener consistencia visual. El text-lg
          (18px) le da peso sin dominar la pantalla (antes era
          text-2xl / 24px, demasiado grande para una card con label).
          ============================================================ */}
      <View
        className={clsx(
          'bg-white rounded-2xl p-5 mt-4 shadow-sm',
          'border border-slate-100',
          'border-r-4',
          visualConfig.rightBorderClass,
        )}
        style={{ elevation: 2 }}
      >
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Título
        </Text>
        <Text className="text-lg font-bold text-slate-900 mt-1 leading-tight">
          {item.title || 'Sin título'}
        </Text>
      </View>

      {/* ============================================================
          CARD "DE:"
          ============================================================
          Footer (según el spec): nombre del sender + role. Lo
          mostramos como card con ícono para que tenga peso visual
          de remitente. El "Para:" va en su propia card justo
          debajo.

          Como el resto de las cards del detalle, lleva un accent
          de 4px en el borde DERECHO con el color del tipo/prioridad
          (mismo `rightBorderClass` que la card del título), para
          mantener coherencia visual en toda la pantalla.
          ============================================================ */}
      <View
        className={clsx(
          'bg-white rounded-2xl p-4 mt-5 shadow-sm',
          'border border-slate-100',
          'border-r-4',
          visualConfig.rightBorderClass,
          'flex-row items-center',
        )}
        style={{ elevation: 1 }}
      >
        <View className="w-11 h-11 rounded-full bg-sky-100 items-center justify-center mr-3">
          <User size={20} color="#0284c7" strokeWidth={2.25} />
        </View>
        <View className="flex-1">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            De
          </Text>
          <Text className="text-base font-semibold text-slate-900 mt-0.5">
            {senderName || 'Remitente no especificado'}
          </Text>
          {roleLabel && (
            <Text className="text-xs text-slate-500 mt-0.5">
              {roleLabel}
            </Text>
          )}
        </View>
      </View>

      {/* ============================================================
          CARD "PARA:"
          ============================================================
          Target type con ícono según audience.type. Se muestra
          como una card separada del "De:" para que cada uno tenga
          su peso visual.

          Se renderiza SOLO si el helper devuelve una etiqueta. Si
          devuelve null, significa que el detail del backend NO
          trajo el campo `audience` (es redundante con el feed).
          En ese caso, preferimos NO mostrar la card antes que
          mostrar un "General" falso que aplicaría a todos los
          avisos (el bug que reportaste). El feed ya muestra el
          targetType correcto en cada card del listado.

          También lleva el accent de borde derecho (mismo color
          que el resto de la pantalla).
          ============================================================ */}
      {audienceTargetTypeLabel(item) && (
        <View
          className={clsx(
            'bg-white rounded-2xl p-4 mt-3 shadow-sm',
            'border border-slate-100',
            'border-r-4',
            visualConfig.rightBorderClass,
            'flex-row items-center',
          )}
          style={{ elevation: 1 }}
        >
          <View className="w-11 h-11 rounded-full bg-slate-100 items-center justify-center mr-3">
            <AudienceIcon audienceType={item.audience?.type} />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Para
            </Text>
            <Text className="text-base font-semibold text-slate-900 mt-0.5">
              {audienceTargetTypeLabel(item)}
            </Text>
            {/* Ya no mostramos el subtítulo "Turno {shift}" porque
                el label del helper ahora lo incluye (formato
                "2°B - Matutino") cuando viene del `summary` del
                backend. Mostrarlo de nuevo sería redundante. */}
          </View>
        </View>
      )}

      {/* ============================================================
          CARD "MENSAJE"
          ============================================================
          Body del aviso (spec: "message completo"). En el feed
          truncábamos a ~120 chars; aquí mostramos el texto entero.
          leading-relaxed para que respire en párrafos largos.

          También lleva el accent de borde derecho (mismo color
          que el resto de la pantalla).
          ============================================================ */}
      <View
        className={clsx(
          'bg-white rounded-2xl p-4 mt-4 shadow-sm',
          'border border-slate-100',
          'border-r-4',
          visualConfig.rightBorderClass,
        )}
        style={{ elevation: 1 }}
      >
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Mensaje
        </Text>
        <Text className="text-base text-slate-700 mt-2 leading-relaxed">
          {item.message || ''}
        </Text>
      </View>

      {/* ============================================================
          META: Publicado / Expira
          ============================================================
          Información auxiliar al pie. text-xs slate-500 con
          íconos para escaneo rápido. Solo mostramos Expira si
          el backend mandó expiresAt (puede ser null).
          ============================================================ */}
      <View className="mt-5 px-1">
        {createdAt && (
          <View className="flex-row items-center">
            <Calendar size={13} color="#94a3b8" strokeWidth={2} />
            {/* formatFullDateTime incluye fecha + hora
                ("23 de octubre de 2025, 4:30 PM") — el usuario
                pidió ver también la hora de publicación. */}
            <Text className="text-xs text-slate-500 ml-1.5">
              Publicado: {formatFullDateTime(createdAt)}
            </Text>
          </View>
        )}
        {expiresAt && (
          <View className="flex-row items-center mt-1.5">
            <Clock size={13} color="#94a3b8" strokeWidth={2} />
            <Text className="text-xs text-slate-500 ml-1.5">
              Expira: {formatFullDateTime(expiresAt)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// =====================================================================
// CitationDetail — layout del detalle de un CITATORIO
// =====================================================================
// Estructura (de arriba a abajo) — alineada con el spec:
//
//   1. Header pills (CITATORIO + TIPO + STATUS) + fecha
//   2. Title (reason completo)
//   3. Subtitle del alumno: "Pedro González — Matrícula: 2610049001"
//   4. Body: oración generada del citatorio
//      "Cita con el Profesor Carlos el martes 28 de octubre a las 10:30 AM"
//   5. Card "Programado para:" con fecha + hora
//   6. Footer (spec): "Citado por: <creator> — <role>"
//   7. Botón "Confirmar asistencia" (solo si status === 'pending')
//
// El controlNumber del student viene en el detail del citatorio
// (item.student.controlNumber), así que NO hace falta un fetch extra
// para mostrarlo.
// =====================================================================
function CitationDetail({
  item,
  visualConfig,
  citationTypeConfig,
  citatorioStatus,
  senderName,
  roleLabel,
  guardianName,
  guardianRelationship,
  isConfirming,
  onConfirm,
}) {
  // Alumno del citatorio. controlNumber viene en el detail.
  const student = item.student;
  const studentName = citatorioStudentName(item) || 'Alumno no especificado';
  const studentPhoto = student?.photoUrl || null;
  const studentInitials = (student?.first_name?.[0] || 'A').toUpperCase();
  const studentControlNumber = student?.controlNumber || null;

  // Fecha programada.
  const scheduledAt = item.scheduledDate ? new Date(item.scheduledDate) : null;
  const scheduledValid = scheduledAt && !Number.isNaN(scheduledAt.getTime());

  // -----------------------------------------------------------------
  // ORACIÓN DEL CITATORIO (body según el spec)
  // -----------------------------------------------------------------
  // Formato: "Cita con {rol} {nombre} el {weekday día de mes}
  // a las {hora}". Ejemplo:
  //   "Cita con el Profesor Carlos Ramírez el martes 28 de octubre
  //    a las 10:30 AM"
  //
  // Si no hay creator o role, caemos a "Cita con el equipo de la
  // escuela" o simplemente "Cita programada" como fallback. Si la
  // fecha es inválida, omitimos la parte de fecha/hora (mejor que
  // mostrar "el Invalid Date a las Invalid Date").
  // -----------------------------------------------------------------
  const citationSentence = useMemo(() => {
    if (!scheduledValid) return 'Cita programada';
    const roleInSentence = item.creator?.role
      ? ROLE_IN_SENTENCE[item.creator.role] || 'el equipo'
      : 'el equipo';
    const creatorName = senderName || 'el equipo';
    return `Cita con ${roleInSentence} ${creatorName} ${formatScheduledSentenceDate(scheduledAt)} a las ${formatScheduledSentenceTime(scheduledAt)}`;
  }, [scheduledValid, item.creator?.role, senderName]);

  // -----------------------------------------------------------------
  // ¿El botón "Confirmar asistencia" aplica?
  // -----------------------------------------------------------------
  // Solo se muestra el botón cuando el citatorio está pendiente de
  // confirmar. Los demás estados (confirmed / completed / no_show)
  // muestran el badge derivado en `nonPendingBadge` (más abajo).
  // -----------------------------------------------------------------
  const canConfirm = item.status === 'pending';

  // -----------------------------------------------------------------
  // BADGE DE STATUS (no-pending)
  // -----------------------------------------------------------------
  // Si el citatorio NO está pendiente, mostramos un badge en vez
  // del botón "Confirmar asistencia". El badge cambia según el
  // status raw del backend:
  //   - 'confirmed' → "Asistencia confirmada" (emerald)
  //   - 'completed' → "Asistió a la cita" (emerald)
  //   - 'no_show'   → "No asistió" (rose, con XCircle)
  // Si el status es algo inesperado (futuro estado que el backend
  // añada), no mostramos badge (cae al `canConfirm`, que también
  // será false → no se renderiza nada en este slot).
  // -----------------------------------------------------------------
  const nonPendingBadge = useMemo(() => {
    if (item.status === 'confirmed') {
      return {
        label: 'Asistencia confirmada',
        Icon: Check,
        bgClass: 'bg-emerald-50',
        textClass: 'text-emerald-700',
        borderClass: 'border-emerald-100',
      };
    }
    if (item.status === 'completed') {
      return {
        label: 'Asistió a la cita',
        Icon: Check,
        bgClass: 'bg-emerald-50',
        textClass: 'text-emerald-700',
        borderClass: 'border-emerald-100',
      };
    }
    if (item.status === 'no_show') {
      return {
        label: 'No asistió a la cita',
        Icon: XCircle,
        bgClass: 'bg-rose-50',
        textClass: 'text-rose-700',
        borderClass: 'border-rose-100',
      };
    }
    return null;
  }, [item.status]);

  return (
    <View className="px-4 pt-2">
      {/* ============================================================
          HEADER: pills (CITATORIO + TIPO + STATUS) + fecha
          ============================================================
          flex-wrap para que las pills bajen a una segunda línea en
          pantallas angostas. gap-2 separa las pills horizontal y
          verticalmente. La fecha va a la derecha (ml-auto).
          ============================================================ */}
      <View className="flex-row items-center flex-wrap gap-2">
        {citatorioStatus && (
          <View className={clsx('px-3 py-1 rounded-full', citatorioStatus.bgClass)}>
            <Text className={clsx(
              'text-[11px] font-bold uppercase tracking-wider',
              citatorioStatus.textClass,
            )}>
              {citatorioStatus.label}
            </Text>
          </View>
        )}

        <Text className="text-xs font-medium text-slate-400 ml-auto">
          {formatDateShort(item.eventDate)}
        </Text>
      </View>

      {/* ============================================================
          TITLE (reason, en card con accent en el borde DERECHO)
          ============================================================
          Mismo tratamiento que el título del anuncio: card blanca
          con `border-r-4 border-r-amber-500` (color del citatorio).
          El "reason" es el motivo del citatorio (lo que el spec
          llama "header" del citatorio). Lo mostramos completo sin
          truncar y permitimos multilinea para motivos largos.

          Mismo label "TÍTULO" + text-lg (18px) que el anuncio, para
          mantener consistencia visual entre ambas cards de título.
          ============================================================ */}
      <View
        className={clsx(
          'bg-white rounded-2xl p-5 mt-4 shadow-sm',
          'border border-slate-100',
          'border-r-4',
          visualConfig.rightBorderClass,
        )}
        style={{ elevation: 2 }}
      >
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          CITATORIO
        </Text>
        <Text className="text-lg font-bold text-slate-900 mt-1 leading-tight">
          {citationTypeConfig?.label || 'Sin tipo especificado'}
        </Text>
      </View>

      {/* ============================================================
          CARD "PARA EL TUTOR"
          ============================================================
          Destinatario del citatorio. Tiene dos bloques:

            1. TUTOR: nombre del padre/tutor del alumno + su
               parentesco si el dashboard lo trae ("Madre", "Padre",
               "Tutor"...). El nombre se resuelve en la pantalla
               (`guardianName`) con la cascada
               citatorio → dashboard → AuthContext.

            2. ALUMNO: sobre quién es la cita, con foto (o iniciales)
               y matrícula. Formato: "Pedro González — Matrícula:
               2610049001". El controlNumber viene en el detail
               (item.student.controlNumber), así que NO hace falta un
               fetch extra. Si el backend no manda controlNumber,
               mostramos solo el nombre.

          Los dos bloques van separados por un divider slate-100 para
          que se lean como "a quién se cita" / "por quién".
          ============================================================ */}
      <View
        className={clsx(
          'bg-white rounded-2xl p-5 mt-4 shadow-sm',
          'border border-slate-100',
          'border-r-4',
          visualConfig.rightBorderClass,
        )}
        style={{ elevation: 2 }}
      >
        {/* --- Bloque 1: el tutor destinatario --- */}
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Para el tutor
        </Text>
        <View className="flex-row items-center mt-2">
          <View className="w-11 h-11 rounded-full bg-sky-100 items-center justify-center mr-3">
            <User size={20} color="#0284c7" strokeWidth={2.25} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-900">
              {guardianName || 'Tutor no especificado'}
            </Text>
            {guardianRelationship && (
              <Text className="text-xs text-slate-500 mt-0.5">
                {guardianRelationship}
              </Text>
            )}
          </View>
        </View>

        {/* --- Bloque 2: el alumno del citatorio --- */}
        <View className="border-t border-slate-100 mt-4 pt-3">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Alumno
          </Text>
          <View className="flex-row items-center mt-2">
            <View className="w-9 h-9 rounded-full bg-amber-100 items-center justify-center mr-2 overflow-hidden">
              {studentPhoto ? (
                <Image
                  source={{ uri: studentPhoto }}
                  className="w-full h-full"
                  resizeMode="cover"
                  accessibilityLabel={`Foto de ${studentName}`}
                />
              ) : (
                <Text className="text-sm font-bold text-amber-700">
                  {studentInitials}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <Text
                className="text-sm font-semibold text-slate-700"
                numberOfLines={1}
              >
                {studentName}
              </Text>
              {studentControlNumber && (
                <View className="flex-row items-center mt-0.5">
                  <IdCard size={13} color="#94a3b8" strokeWidth={2} />
                  <Text className="text-xs text-slate-500 ml-1">
                    Matrícula: {studentControlNumber}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

       {/* ============================================================
          CARD "PROGRAMADO PARA"
          ============================================================
          Fecha + hora del citatorio. Usamos formatScheduledDateTime
          ("lunes, 28 de octubre, 4:30 PM") para incluir el weekday
          — los citatorios son eventos futuros, así que el weekday
          es contexto útil.
          ============================================================ */}
      <View
        className={clsx(
          'bg-white rounded-2xl p-4 mt-4 shadow-sm',
          'border border-slate-100',
          'border-r-4',
          visualConfig.rightBorderClass,
          'flex-col',
        )}
        style={{ elevation: 1 }}
      >
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Programado para
        </Text>
        <View className="flex-row items-center mt-2">
            <View className="w-11 h-11 rounded-full bg-sky-100 items-center justify-center mr-3">
                <CalendarClock size={20} color="#0284c7" strokeWidth={2.25} />
            </View>
            <View className="flex-1">
          <Text className="text-base font-semibold text-slate-900 mt-0.5">
            {scheduledValid ? formatScheduledDateTime(scheduledAt) : 'Fecha no disponible'}
          </Text>
        </View>
          </View>
      </View>

      {/* ============================================================
          FOOTER (spec): Citado por — rol
          ============================================================
          El spec dice "Footer: nombre del sender/creator + role".
          Lo mostramos como card dedicada con el nombre y, si hay
          role, una segunda línea con el roleLabel.
          ============================================================ */}
      {senderName && (
        <View
          className={clsx(
            'bg-white rounded-2xl p-4 mt-4 shadow-sm',
            'border border-slate-100',
            'border-r-4',
            visualConfig.rightBorderClass,
            'flex-col',
          )}
          style={{ elevation: 1 }}
        >
          <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Citado por
            </Text>
          <View className="flex-row items-center mt-2">  
          <View className="w-11 h-11 rounded-full bg-slate-100 items-center justify-center mr-3">
            <User size={20} color="#475569" strokeWidth={2.25} />
          </View>
          <View className="flex-1">
            
            <Text className="text-base font-semibold text-slate-900 mt-0.5">
              {senderName}
            </Text>
            {roleLabel && (
              <Text className="text-xs text-slate-500 mt-0.5">
                {roleLabel}
              </Text>
            )}
            </View>
          </View>
        </View>
      )}

      {/* ============================================================
          BODY: ORACIÓN DEL CITATORIO (callout card)
          ============================================================
          Spec: "Cita con el profesor Carlos el martes 28 de octubre
          a las 10:30 AM". Lo mostramos como callout card en
          bg-amber-50 (color del citatorio) para que se sienta como
          un "resumen" de la cita, distinto del title (que es el
          motivo).
          ============================================================ */}
      <View
        className={clsx(
          'bg-white rounded-2xl p-4 mt-4 shadow-sm',
          'border border-slate-100',
          'border-r-4',
          visualConfig.rightBorderClass,
        )}
        style={{ elevation: 1 }}
      >
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Detalle de la cita
        </Text>
        <Text className="text-base text-slate-900 mt-2 leading-relaxed">
            {item.reason || 'Sin motivo especificado'}
        </Text>
        {item.createdAt && (
          <Text className="text-xs text-slate-500 mt-2">
            {formatFullDateTime(new Date(item.createdAt))}
          </Text>
        )}
      </View>


      {/* ============================================================
          ACCIÓN: Confirmar asistencia / Status badge
          ============================================================
          Spec: "Si es citation y status === 'pending' → botón
          'Confirmar asistencia' que dispara
          PATCH /api/guardians/me/students/{{student._id}}/citations/{{item._id}}/confirm".

          Para los demás status, mostramos un badge informativo
          derivado de `nonPendingBadge`:
            - 'confirmed' → "Asistencia confirmada" (emerald)
            - 'completed' → "Asistió a la cita"     (emerald)
            - 'no_show'   → "No asistió a la cita"  (rose, XCircle)

          Esto es preferible a un botón deshabilitado porque
          comunica al tutor QUÉ pasó con el citatorio (no solo que
          "ya no se puede confirmar"). El header también tiene una
          pill con el status derivado (ASISTIÓ / NO ASISTIÓ /
          CONFIRMADO / VENCIDO / etc.) — el badge del bottom es
          redundante en color pero usa un copy más user-friendly.
          ============================================================ */}
      <View className="mt-6">
        {canConfirm ? (
          <Pressable
            onPress={onConfirm}
            disabled={isConfirming}
            className={clsx(
              'flex-row items-center justify-center px-4 py-3.5 rounded-xl',
              isConfirming
                ? 'bg-sky-400'
                : 'bg-sky-600 active:bg-sky-700',
            )}
            accessibilityRole="button"
            accessibilityLabel="Confirmar asistencia al citatorio"
            accessibilityState={{ disabled: isConfirming }}
          >
            {isConfirming ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Check size={18} color="#ffffff" strokeWidth={2.5} />
            )}
            <Text className="text-sm font-bold text-white ml-2">
              {isConfirming ? 'Confirmando...' : 'Confirmar asistencia'}
            </Text>
          </Pressable>
        ) : nonPendingBadge ? (
          <View
            className={clsx(
              'flex-row items-center justify-center px-4 py-3 rounded-xl border',
              nonPendingBadge.bgClass,
              nonPendingBadge.borderClass,
            )}
            accessibilityLabel={`Estado del citatorio: ${nonPendingBadge.label}`}
          >
            <nonPendingBadge.Icon
              size={18}
              color={nonPendingBadge.textClass.includes('emerald') ? '#047857' : '#be123c'}
              strokeWidth={2.5}
            />
            <Text
              className={clsx('text-sm font-bold ml-2', nonPendingBadge.textClass)}
            >
              {nonPendingBadge.label}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------
// AudienceIcon
// ---------------------------------------------------------------------
// Ícono que se muestra al lado del "Para:" según audience.type.
//   - 'general'  → Globe
//   - 'group'    → Users
//   - 'student'  → UserRound
//   - default    → Globe
// Se pasa como children al wrapper en AnnouncementDetail; mantiene
// el slot visual consistente (círculo de 44px, color slate-700).
// ---------------------------------------------------------------------
function AudienceIcon({ audienceType }) {
  if (audienceType === 'group') {
    return <Users size={20} color="#475569" strokeWidth={2.25} />;
  }
  if (audienceType === 'student') {
    return <UserRound size={20} color="#475569" strokeWidth={2.25} />;
  }
  return <Globe size={20} color="#475569" strokeWidth={2.25} />;
}

// ---------------------------------------------------------------------
// formatDateShort(iso)
// ---------------------------------------------------------------------
// Helper LOCAL (no se exporta) que devuelve la fecha corta en el
// formato del card del feed ("24 oct"). Usamos toLocaleDateString
// directamente porque el helper formatAnnouncementDate vive en
// announcementHelpers.js y traerlo solo para esto no aporta valor.
// ---------------------------------------------------------------------
function formatDateShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
  });
}
