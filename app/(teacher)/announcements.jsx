// =====================================================================
// app/(teacher)/announcements.jsx
// ---------------------------------------------------------------------
// Pantalla "Avisos y Comunicados" del MAESTRO (rol "teacher").
//
// NOTA DE ARQUITECTURA (mock visual):
//   Este es un PROTOTIPO VISUAL que replica fielmente el spec de
//   diseño proporcionado. Igual que ocurrió con la fase de diseño
//   del guardian, aquí usamos datos y layout parcialmente estáticos
//   (mock del feed) para validar el look & feel ANTES de conectar
//   el backend real.
//
//   Cuando exista el endpoint del maestro (p. ej.
//   GET /api/teacher-subjects/me/announcements), se migrará a un
//   hook + service (patrón src/services/teacherService.js +
//   src/hooks/useTeacherAnnouncements.js) y el array `MOCK_FEED`
//   de abajo se reemplaza por el shape devuelto por el backend,
//   transformado en src/utils/announcementHelpers (igual que ya
//   hace la pantalla del guardian).
//
//   La info de la escuela se reutiliza de SchoolInfoCard (componente
//   compartido del route group (app)). La pantalla NO tiene bottom
//   bar de navegación.
// =====================================================================

// React: useState para el control segmentado de tabs.
import React, { useState } from 'react';

// Primitivas RN.
import { View, Text, Pressable, ScrollView } from 'react-native';

// Safe area: paddingTop dinámico (status bar). NO usamos la
// SafeAreaView deprecada de react-native.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Navegación: useRouter para el botón "Volver".
import { useRouter } from 'expo-router';

// Iconos Lucide.
import {
  GraduationCap, // Brand del header.
  Bell,          // Campanita de notificaciones (igual que DashboardHeader).     // Botón "Volver".
  Plus,          // Botón "+ Nuevo Aviso".
  Megaphone,     // Tag del aviso de Ofimática.
  Users,         // Tag del aviso de Tutoría.
  CheckCircle2, // Estado "Lecturas" del footer.
  ChevronLeft,  // Estado "Lecturas" del footer.
} from 'lucide-react-native';

// clsx para classNames condicionales (tabs).
import { clsx } from 'clsx';

// Card de info de la escuela compartida del route group (app).
// Se alimenta con los datos reales del backend vía useTeacherDashboard.
import SchoolInfoCard from '../../src/components/SchoolInfoCard';

// Hook del dashboard del teacher: trae school + currentSchoolYear
// desde GET /api/teacher-subjects/me/dashboard. Es el mismo endpoint
// que ya alimenta el TeacherDashboard, así el logo/nombre/ciclo de
// la escuela quedan consistentes entre ambas pantallas.
import { useTeacherDashboard } from '../../src/hooks/useTeacherDashboard';

// Modal "Crear Nuevo Aviso": bottom sheet de creación de avisos.
// Vive en _components/ del grupo (teacher) — no es una ruta.
import CreateAnnouncementModal from './_components/CreateAnnouncementModal';

// ---------------------------------------------------------------------
// PALETA (spec)
// ---------------------------------------------------------------------
// bg pantalla    : #F8FAFC
// card           : #FFFFFF, radius 20, border #F1F5F9, shadow 0.04/10,
//                  elevation 2
// acento         : #0284C7
// texto primario : #0F172A
// texto secundario: #64748B
// verde éxito    : #16A34A
// ---------------------------------------------------------------------

// Sombra estandar de card según spec (multiplica para iOS/Android).
const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.04,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

// ---------------------------------------------------------------------
// MOCK_FEED
// ---------------------------------------------------------------------
// Datos estáticos del prototipo. Cada item modela una card de aviso:
//   - tagBg/tagColor: color del chip del encabezado.
//   - tagIcon: icono Lucide del chip.
//   - tagLabel / timestamp / title / body / reads (footer).
// Se reemplazará por la respuesta del backend al conectar el endpoint.
// ---------------------------------------------------------------------
const MOCK_FEED = [
  {
    id: '1',                                    // id único (key del FlatList).
    tagBg: '#E0F2FE',                           // fondo azul claro del tag.
    tagColor: '#0284C7',                        // texto/icono azul.
    tagIcon: Megaphone,                         // icono megáfono.
    tagLabel: '1° OFIMÁTICA',                   // texto del tag.
    timestamp: 'Hoy, 08:30 AM',                 // fecha/hora derecha.
    title: 'Material para práctica de Ensamblado',
    body: 'Favor de traer destornillador de cruz, pinzas de punta y pulsera antiestática para la sesión en e...',
    reads: '28/35 Lecturas',                    // footer verde.
  },
  {
    id: '2',
    tagBg: '#FEF3C7',                           // fondo ámbar claro.
    tagColor: '#92400E',                        // texto ámbar oscuro.
    tagIcon: Users,                             // icono usuarios.
    tagLabel: '3°A (Tutoría)',
    timestamp: 'Ayer, 02:15 PM',
    title: 'Firma de Boletas de Evaluación',
    body: 'Se convoca a reunión con tutores para la entrega y firma de boletas del segundo...',
    reads: '22/30 Lecturas',
  },
];

// ---------------------------------------------------------------------
// MOCK_GROUPS
// ---------------------------------------------------------------------
// Grupos asignados al maestro, fuente de los chips "Destinatarios"
// del modal de creación. Cada item: { id, label }.
//
// En esta fase de prototipo los datos son estáticos (mismos grupos
// que alimentan los tags del MOCK_FEED). Cuando exista el endpoint
// del maestro (p. ej. GET /api/teacher-subjects/me/groups), este
// array se reemplaza por la respuesta del backend sin tocar el modal
// (el modal recibe `groups` por prop).
// ---------------------------------------------------------------------
const MOCK_GROUPS = [
  { id: '1-ofimatica', label: '1° OFIMÁTICA' },
  { id: '3-ofimatica', label: '3° OFIMÁTICA' },
  { id: '3a-tutoria', label: '3°A (Tutoría)' },
];

// ---------------------------------------------------------------------
// TABS del control segmentado
// ---------------------------------------------------------------------
const SEGMENT_TABS = ['Mis Publicaciones', 'Generales'];

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function TeacherAnnouncements() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Datos reales de la escuela desde el backend (mismo endpoint que
  // el TeacherDashboard): GET /api/teacher-subjects/me/dashboard.
  const { data, isLoading } = useTeacherDashboard();

  // Normalizar school al shape que consume SchoolInfoCard: el backend
  // usa camelCase (logoUrl) y por separado currentSchoolYear, pero la
  // card espera snake_case (logo_url) + current_school_year. Mismo
  // mapeo que hace TeacherDashboard.jsx.
  const school = React.useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.currentSchoolYear?.name || null,
    };
  }, [data?.school, data?.currentSchoolYear]);

  // Datos del modo compuesto de la SchoolInfoCard: nombre del maestro
  // + fecha (fila inferior del card). Mismo patrón que groups.jsx.
  const teacherName = data?.teacher?.last_name || data?.teacher?.fullName || 'Juárez';
  const currentDate = data?.currentDate || 'Lunes, 10 de agosto';

  // Tab activo del control segmentado. Inicia en la primera ("Mis
  // Publicaciones"). Al tocar "Generales" se re-renderiza el feed.
  const [activeSegment, setActiveSegment] = useState(SEGMENT_TABS[0]);

  // Visibilidad del modal "Crear Nuevo Aviso". El botón "+ Nuevo
  // Aviso" la enciende; el modal se cierra a sí mismo vía onClose.
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  return (
    // Contenedor raíz: fondo #F8FAFC (spec).
    <View className="flex-1 bg-[#F8FAFC]">
      {/* ============================================================
          A) HEADER FIJO (engranaje + brand)
          ============================================================
          paddingTop = insets.top + 12 → respeta status bar.
          ============================================================ */}
      <View
        className="bg-white flex-row items-center justify-between px-4 pb-3 border-b border-[#E2E8F0]"
        style={{ paddingTop: insets.top + 12 }}
      >
        {/* Brand: birrete #0284C7 + wordmark EdukControl. */}
        <View className="flex-row items-center">
          <GraduationCap size={24} color="#0284C7" strokeWidth={2.25} />
          <Text className="text-[20px] font-bold text-[#0284C7] ml-2 tracking-tight">
            EdukControl
          </Text>
        </View>

        {/* Campanita de notificaciones (igual que DashboardHeader) +
            dot rojo flotante. */}
        <Pressable
          className="relative"
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Notificaciones"
        >
          <Bell size={24} color="#64748B" strokeWidth={2} />
          {/* Dot rojo flotante arriba a la derecha. */}
          <View className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#EF4444] border-2 border-[#F8FAFC]" />
        </Pressable>
      </View>

      {/* ============================================================
          CONTENIDO (header estático + feed scrolleable)
          ============================================================
          Estructura:
            1. B) SchoolInfoCard (info de escuela compartida).
            2. C) Sección "Avisos y Comunicados" + "+ Nuevo Aviso".
            3. D) Tabs segmentadas.
            4. E) Feed de avisos.
          Sin bottom bar: esta pantalla se abre como detalle/desde el
          quick action del dashboard, no tiene navegación inferior.
          ============================================================ */}
     
        {/* ==========================================================
            B) SCHOOL INFO CARD (componente compartido)
            ========================================================== */}
        <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-4"
        teacherName={teacherName}
        date={currentDate}
      />

        {/* Botón "Volver" debajo del card de la escuela. */}
        <Pressable
        onPress={() => router.back()}
        className="flex-row items-center px-4 mt-4"
        accessibilityRole="button"
        accessibilityLabel="Volver al dashboard"
      >
        <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
        <Text className="text-sm font-semibold text-sky-600 ml-1">
          Volver
        </Text>
      </Pressable>

       <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4"
        contentContainerStyle={{ paddingBottom: 24 }}
      >

        {/* ==========================================================
            C) SECCIÓN "Avisos y Comunicados" + "+ Nuevo Aviso"
            ========================================================== */}
        <View className="mt-5">
          <Text className="text-[22px] font-bold text-[#0F172A]">
            Avisos y Comunicados
          </Text>

          {/* Botón "+ Nuevo Aviso". Abre el modal de creación. */}
          <Pressable
            onPress={() => setIsCreateModalVisible(true)}
            className="self-start mt-3 flex-row items-center bg-[#0284C7] rounded-full px-4 py-2.5"
            accessibilityRole="button"
            accessibilityLabel="Crear nuevo aviso"
          >
            <Plus size={16} color="#ffffff" strokeWidth={2.75} />
            <Text className="text-white font-bold text-[14px] ml-1.5">
              Nuevo Aviso
            </Text>
          </Pressable>
        </View>

        {/* ==========================================================
            D) TAB SEGMENTED CONTROL
            ==========================================================
            Línea base a todo el ancho (#E2E8F0). Cada tab es un
            Pressable; el activo pinta texto #0284C7 + indicador 3px.
            ========================================================== */}
        <View className="mt-4 border-b border-[#E2E8F0] flex-row">
          {SEGMENT_TABS.map((tab) => {
            const isActive = tab === activeSegment;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveSegment(tab)}
                className="mr-8 items-center"
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab}
              >
                <Text className={clsx(
                  'text-[15px] font-semibold pb-2.5',
                  isActive ? 'text-[#0284C7]' : 'text-[#64748B]',
                )}>
                  {tab}
                </Text>
                {/* Indicador inferior: 3px sólido en el tab activo. */}
                <View
                  className={clsx(
                    'h-[3px] rounded-t-full w-full',
                    isActive ? 'bg-[#0284C7]' : 'bg-transparent',
                  )}
                />
              </Pressable>
            );
          })}
        </View>

        {/* ==========================================================
            E) FEED DE AVISOS
            ==========================================================
            Renderizamos el feed con .map sobre MOCK_FEED (el propio
            ScrollView da el scroll). Al conectar el backend se puede
            voltear a un FlatList raíz si hace falta virtualización.
            ========================================================== */}
        <View className="mt-4">
          {MOCK_FEED.map((item) => {
            const TagIcon = item.tagIcon;
            return (
              <View
                key={item.id}
                className="bg-white rounded-[20px] p-4 mb-4 border border-[#F1F5F9]"
                style={CARD_SHADOW}
              >
                {/* Header: tag (izq) + timestamp (der). */}
                <View className="flex-row items-center justify-between">
                  <View
                    className="flex-row items-center px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: item.tagBg }}
                  >
                    <TagIcon size={13} color={item.tagColor} strokeWidth={2.5} />
                    <Text
                      className="text-[12px] font-bold ml-1.5"
                      style={{ color: item.tagColor }}
                    >
                      {item.tagLabel}
                    </Text>
                  </View>
                  <Text className="text-[12px] text-[#64748B]">
                    {item.timestamp}
                  </Text>
                </View>

                {/* Título. */}
                <Text className="text-[16px] font-bold text-[#0F172A] mt-1.5">
                  {item.title}
                </Text>

                {/* Body: 2 líneas truncado. */}
                <Text
                  className="text-[13px] text-[#475569] mt-1"
                  numberOfLines={2}
                >
                  {item.body}
                </Text>

                {/* Divisor interno. */}
                <View className="h-px bg-[#F1F5F9] my-3" />

                {/* Footer: check verde + "Lecturas". */}
                <View className="flex-row items-center">
                  <CheckCircle2 size={16} color="#16A34A" strokeWidth={2.25} />
                  <Text className="text-[13px] font-semibold text-[#334155] ml-2">
                    {item.reads}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Si el usuario cambia a "Generales", el mismo feed se
              reusa (mismo shape). La diferenciación real del
              contenido llega con el backend. */}
          {activeSegment !== SEGMENT_TABS[0] && (
            <Text className="text-center text-[12px] text-[#64748B] py-4">
              Tab: {activeSegment}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* ==========================================================
          MODAL "CREAR NUEVO AVISO"
          ==========================================================
          Bottom sheet de creación. Se alimenta con los grupos del
          maestro (MOCK_GROUPS en esta fase de prototipo). onClose
          apaga la bandera de visibilidad; el modal se encarga de
          publicar vía servicio y de llamar a onClose tras el éxito.
          ========================================================== */}
      <CreateAnnouncementModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        groups={MOCK_GROUPS}
      />
    </View>
  );
}