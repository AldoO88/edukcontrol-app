// =====================================================================
// app/(teacher)/groups.jsx
// ---------------------------------------------------------------------
// Ruta "/groups" del route group (teacher). Pantalla "Mis Grupos y
// Asignaturas" del MAESTRO (rol "teacher").
//
// NOTA DE ARQUITECTURA (mock visual):
//   Este es un PROTOTIPO VISUAL que replica fielmente el spec de
//   diseño proporcionado. Igual que en announcements.jsx del maestro,
//   los grupos asignados (sección C) son datos estáticos (MOCK_GROUPS)
//   para validar el look & feel ANTES de conectar el backend real.
//
//   Cuando exista el endpoint del maestro (p. ej.
//   GET /api/teacher-subjects/me/groups), se migrará a un hook +
//   service (patrón src/services/teacherService.js + src/hooks/) y el
//   array `MOCK_GROUPS` de abajo se reemplaza por el shape devuelto
//   por el backend.
//
//   La info de la escuela + el maestro se alimenta del mismo endpoint
//   que el TeacherDashboard (GET /api/teacher-subjects/me/dashboard)
//   vía useTeacherDashboard, con fallbacks a los valores del spec.
//
//   El header usa el chrome compartido DashboardHeader (campanita),
//   congruente con el resto de pantallas del maestro: en el grupo
//   (teacher) la campana ya es el patrón establecido y el spec de
//   esta pantalla pide "Exact Same as Previous Screens".
//
//   NO lleva bottom bar: esta pantalla se abre como ruta empujada
//   desde el quick action "Mis Grupos" del dashboard (mismo patrón
//   que announcements.jsx). Los tabs del maestro (TEACHER_TABS) NO se
//   modifican.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text, Pressable, ScrollView.
import {
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';

// Navegación: useRouter para navegar a los destinos de cada card.
import { useRouter } from 'expo-router';

// Iconos Lucide.
import {
  UserCheck,         // Botón "Pase de Lista".
  FileSpreadsheet,   // Botón "Calificar".
  List,              // Botón "Alumnos".
  Users,             // Info: nº de alumnos.
  Clock,             // Info: horario.
  MapPin,            // Info: aula/laboratorio.
} from 'lucide-react-native';

// Tabs del bottom bar del maestro (fuente única). "Mis Grupos" es uno
// de los 4 tabs de la barra inferior.
import { TEACHER_TABS } from '../../src/constants/navigationTabs';

// Chrome compartido del grupo (teacher).
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomTabBar from '../../src/components/BottomTabBar';
// Card compuesta de la escuela + maestro: la reutilizamos de
// src/components (modo compuesto con teacherName/date). Es el mismo
// card que pediste para esta pantalla y para los avisos.
import SchoolInfoCard from '../../src/components/SchoolInfoCard';

// Hook del dashboard del teacher: trae school + teacher + currentDate
// desde GET /api/teacher-subjects/me/dashboard. Mismo endpoint que
// alimenta el TeacherDashboard, así la info queda consistente.
import { useTeacherDashboard } from '../../src/hooks/useTeacherDashboard';

// ---------------------------------------------------------------------
// PALETA (spec)
// ---------------------------------------------------------------------
// bg pantalla    : #F8FAFC
// card           : #FFFFFF, radius 20, border #F1F5F9, shadow 0.04/10,
//                  elevation 2
// acento         : #0284C7
// texto primario : #0F172A
// texto secundario: #64748B
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
// MOCK_GROUPS
// ---------------------------------------------------------------------
// Grupos asignados al maestro (prototipo). Cada item modela una card:
//   - name / tagLabel / tagBg / tagColor: título + chip del header.
//   - students: nº de alumnos inscritos.
//   - day / time / classroom: horario y lugar de la clase.
//   - accentColor: color del borde izquierdo 4px de la card. Cada
//             card lleva su propio color de acento (matchea con el tag)
//             y TODAS muestran los tres botones de acción (Pase de
//             Lista, Calificar, Alumnos).
// Se reemplazará por la respuesta del backend al conectar el endpoint.
// ---------------------------------------------------------------------
const MOCK_GROUPS = [
  {
    id: '1-ofimatica',
    name: '1° OFIMÁTICA',
    tagLabel: 'TALLER TÉCNICO',
    tagBg: '#E0F2FE',
    tagColor: '#0284C7',
    students: 35,
    day: 'Hoy',
    time: '08:00 - 09:40',
    classroom: 'Taller 2',
    accentColor: '#0284C7',
  },
  {
    id: '3a-socioemocional',
    name: '3°A - Ed. Socioemocional',
    tagLabel: 'TUTORÍA',
    tagBg: '#FEF3C7',
    tagColor: '#92400E',
    students: 30,
    day: 'Martes',
    time: '10:00 - 10:50',
    classroom: 'Aula 12',
    accentColor: '#D97706',
  },
  {
    id: '2b-informatica',
    name: '2°B - Informática',
    tagLabel: 'MATERIA BASE',
    tagBg: '#F3E8FF',
    tagColor: '#6B21A8',
    students: 32,
    day: 'Miércoles',
    time: '11:40 - 13:20',
    classroom: 'Lab 1',
    accentColor: '#7C3AED',
  },
];

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function TeacherGroupsScreen() {
  const router = useRouter();

  // Datos reales de la escuela + maestro desde el backend (mismo
  // endpoint que el TeacherDashboard). Los fallbacks replican los
  // valores estáticos del spec.
  const { data } = useTeacherDashboard();

  // Normalizar school al shape que consume SchoolInfoCard: el backend
  // usa camelCase (logoUrl) y por separado currentSchoolYear, pero la
  // card espera snake_case (logo_url) + current_school_year.
  const school = React.useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.currentSchoolYear?.name || null,
    };
  }, [data?.school, data?.currentSchoolYear]);

  // Datos del modo compuesto (fila inferior de la card): nombre del
  // maestro + fecha. Fallbacks a los valores estáticos del spec.
  const teacherName = data?.teacher?.last_name || data?.teacher?.fullName || 'Juárez';
  const currentDate = data?.currentDate || 'Lunes, 10 de agosto';

  // -----------------------------------------------------------------
  // NAVEGACIÓN DESDE LOS BOTONES DE LA CARD DESTACADA
  // -----------------------------------------------------------------
  // Cada acción pasa { groupId, groupName } al destino (patrón del
  // spec). "Asistencia" abre la matriz matricial, roster lista alumnos.
  const goTakeAttendance = (group) => {
    router.push({
      pathname: '/(teacher)/matrix',
      params: { groupId: group.id, groupName: group.name },
    });
  };

  const goGrades = (group) => {
    router.push({
      pathname: '/(teacher)/grade-entry',
      params: { groupId: group.id, groupName: group.name },
    });
  };

  const goRoster = (group) => {
    router.push({
      pathname: '/(teacher)/roster',
      params: { groupId: group.id, groupName: group.name },
    });
  };

  const goDirectorio = (group) => {
    router.push({
      pathname: '/(teacher)/student-directory',
      params: { groupId: group.id, groupName: group.name },
    });
  };

  return (
    // Contenedor raíz: fondo #F8FAFC (spec).
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Header compartido del maestro: brand + campanita. */}
      <DashboardHeader />

      {/* ============================================================
          A) STATIC SCHOOL CARD compuesta (componente compartido)
          ============================================================
          Card compuesta: logo + escuela + ciclo | divisor | maestro
          + pill DOCENTE + fecha. Vive en src/components/SchoolInfoCard
          (modo compuesto, activado pasando teacherName/date) para
          reutilizarla también en la pantalla de avisos del maestro.
          ============================================================ */}
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-2"
        teacherName={teacherName}
        date={currentDate}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* ==========================================================
            B) SECCIÓN "Mis Grupos y Asignaturas" + badge contador
            ========================================================== */}
        <View className="mt-5">
          <Text className="text-[22px] font-bold text-[#0F172A]">
            Mis Grupos y Asignaturas
          </Text>

          {/* Badge contador: "3 Grupos Asignados". Fondo #E0F2FE,
              texto #0369A1 (spec). */}
          <View className="self-start mt-2 px-3 py-1 rounded-full bg-[#E0F2FE]">
            <Text className="text-xs font-bold text-[#0369A1]">
              {MOCK_GROUPS.length} Grupos Asignados
            </Text>
          </View>
        </View>

        {/* ==========================================================
            C) CARDS DE GRUPOS
            ========================================================== */}
        <View className="mt-4">
          {MOCK_GROUPS.map((group) => (
            <View
              key={group.id}
              className="bg-white rounded-[20px] p-4 mb-4 border border-[#F1F5F9]"
              style={[
                CARD_SHADOW,
                // Borde izquierdo 4px con el color de acento de la card
                // (matchea con el color de su tag). Se pone en style
                // porque el color es dinámico por grupo.
                { borderLeftWidth: 4, borderLeftColor: group.accentColor },
              ]}
            >
              {/* Header: título (izq) + tag (der). */}
              <View className="flex-row items-center justify-between">
                <Text className="text-[17px] font-bold text-[#0F172A] flex-1" numberOfLines={1}>
                  {group.name}
                </Text>
                <View
                  className="flex-row items-center px-2.5 py-1 rounded-lg ml-2"
                  style={{ backgroundColor: group.tagBg }}
                >
                  <Text
                    className="text-[11px] font-bold"
                    style={{ color: group.tagColor }}
                  >
                    {group.tagLabel}
                  </Text>
                </View>
              </View>

              {/* Info: alumnos / horario / lugar. */}
              <View className="mt-3">
                <View className="flex-row items-center">
                  <Users size={15} color="#64748B" strokeWidth={2} />
                  <Text className="text-[13px] text-[#475569] ml-2">
                    {group.students} Alumnos
                  </Text>
                </View>
                <View className="flex-row items-center mt-1.5">
                  <Clock size={15} color="#64748B" strokeWidth={2} />
                  <Text className="text-[13px] text-[#475569] ml-2">
                    {group.day} {group.time}
                  </Text>
                </View>
                <View className="flex-row items-center mt-1.5">
                  <MapPin size={15} color="#64748B" strokeWidth={2} />
                  <Text className="text-[13px] text-[#475569] ml-2">
                    {group.classroom}
                  </Text>
                </View>
              </View>

              {/* Botones de acción en TODAS las cards: Pase de Lista
                  (primario) + Calificar (outline) + Alumnos (outline).
                  Cada uno navega con { groupId, groupName }. */}
              <View className="flex-row mt-4">
                  {/* Pase de Lista: botón primario #0284C7. */}
                  <Pressable
                    onPress={() => goTakeAttendance(group)}
                    className="flex-1 flex-row items-center justify-center bg-[#0284C7] active:bg-[#0369A1] rounded-xl py-3"
                    accessibilityRole="button"
                    accessibilityLabel={`Pase de lista de ${group.name}`}
                  >
                    <UserCheck size={16} color="#ffffff" strokeWidth={2.25} />
                    <Text className="text-white font-bold text-[12px] ml-1.5">
                      Asistencia
                    </Text>
                  </Pressable>

                  {/* Calificar: botón outline. */}
                  <Pressable
                    onPress={() => goGrades(group)}
                    className="flex-1 flex-row items-center justify-center bg-white border border-[#E2E8F0] rounded-xl py-3 ml-2"
                    accessibilityRole="button"
                    accessibilityLabel={`Calificar ${group.name}`}
                  >
                    <FileSpreadsheet size={16} color="#0F172A" strokeWidth={2.25} />
                    <Text className="text-[#0F172A] font-bold text-[12px] ml-1.5">
                      Calificar
                    </Text>
                  </Pressable>

                  {/* Alumnos: botón outline. */}
                  <Pressable
                    onPress={() => goDirectorio(group)}
                    className="flex-1 flex-row items-center justify-center bg-white border border-[#E2E8F0] rounded-xl py-3 ml-2"
                    accessibilityRole="button"
                    accessibilityLabel={`Directorio de alumnos de ${group.name}`}
                  >
                    <List size={16} color="#0F172A" strokeWidth={2.25} />
                    <Text className="text-[#0F172A] font-bold text-[12px] ml-1.5">
                      Alumnos
                    </Text>
                  </Pressable>
                </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom tab bar con tabs del maestro. "Mis Grupos" es el tab
          activo (match 'groups'). */}
      <BottomTabBar tabs={TEACHER_TABS} />
    </View>
  );
}
