// =====================================================================
// app/(teacher)/student-directory.jsx
// ---------------------------------------------------------------------
// Ruta "/student-directory" del route group (teacher). Pantalla
// "Directorio y Expediente de Alumnos" del MAESTRO: Group Student
// Directory con Accordion + Group Diagnostic Dashboard.
//
// Estructura visual (de arriba a abajo):
//
//   ┌────────────────────────────────────────┐
//   │ DashboardHeader (brand + 🔔)          │
//   ├────────────────────────────────────────┤
//   │ SchoolInfoCard compuesta                │
//   ├────────────────────────────────────────┤
//   │ Volver (chevron + texto)               │  ← botón back
//   ├────────────────────────────────────────┤
//   │ GroupDiagnosticDashboard                │  ← métricas + count
//   ├────────────────────────────────────────┤
//   │ DirectoryToolbar (search + filter)      │
//   ├────────────────────────────────────────┤
//   │ FlatList de StudentAccordionRow         │  ← colapsado/expandido
//   │   - empty: sin matches                  │
//   │   - footer: paddingBottom safe area     │
//   └────────────────────────────────────────┘
//
// Se abre desde el botón "Alumnos" de la card del grupo en
// "Mis Grupos" (groups.jsx), pasando { groupId, groupName }.
//
// NOTA DE ARQUITECTURA (mock visual):
//   PROTOTIPO VISUAL. La lista y las métricas grupales se calculan
//   en cliente sobre MOCK_STUDENTS (mockStudents.js). Cuando exista
//   el endpoint real, se reemplaza la fuente del hook
//   useGroupStudentsDirectory y los datos del dashboard vienen del
//   payload del backend.
// =====================================================================

// React + hooks.
import React, { useMemo, useState } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  FlatList,
  Pressable,
} from 'react-native';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Navegación: useRouter para el botón Volver.
import { useRouter } from 'expo-router';

// Iconos Lucide.
import { ChevronLeft } from 'lucide-react-native';

// Hook del directorio (estado local + búsqueda + accordion).
import useGroupStudentsDirectory from '../../src/hooks/useGroupStudentsDirectory';

// Hook del dashboard docente (escuela + maestro).
import { useTeacherDashboard } from '../../src/hooks/useTeacherDashboard';

// Chrome compartido.
import DashboardHeader from '../../src/components/DashboardHeader';
import SchoolInfoCard from '../../src/components/SchoolInfoCard';

// Sub-componentes privados del route group.
import GroupDiagnosticDashboard from './_components/GroupDiagnosticDashboard';
import DirectoryToolbar from './_components/DirectoryToolbar';
import StudentAccordionRow from './_components/StudentAccordionRow';
import GenerarCitatorioModal from './_components/GenerarCitatorioModal';

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function DirectorioAlumnosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Hook del directorio: lista, búsqueda, filtrado, accordion, sort.
  const {
    students,
    searchTerm,
    setSearchTerm,
    filteredStudents,
    expandedStudentId,
    toggleExpandStudent,
    sortBy,
    setSortBy,
  } = useGroupStudentsDirectory();

  // Hook del dashboard: datos del maestro + escuela (mismo endpoint
  // que el TeacherDashboard, para que la card compuesta sea
  // consistente).
  const { data } = useTeacherDashboard();
  const teacherName = data?.teacher?.last_name || data?.teacher?.fullName || 'González Juárez';
  const currentDate = data?.currentDate || 'Viernes, 14 de agosto';
  const school = useMemo(() => {
    if (!data?.school) return null;
    return {
      ...data.school,
      logo_url: data.school.logoUrl,
      current_school_year: data.currentSchoolYear?.name || null,
    };
  }, [data?.school, data?.currentSchoolYear]);

  // ============================================================
  // MÉTRICAS DEL GROUP DIAGNOSTIC DASHBOARD
  // ============================================================
  // Se calculan en cliente sobre la lista filtrada (no la completa),
  // para que el dashboard refleje el resultado de la búsqueda.
  // ============================================================
  const dashboardMetrics = useMemo(() => {
    const total = filteredStudents.length;
    if (total === 0) {
      return { groupAverage: 0, atRiskCount: 0, attendance: 0 };
    }
    const avgSum = filteredStudents.reduce(
      (acc, s) => acc + Number(s.metrics?.average || 0),
      0,
    );
    const attSum = filteredStudents.reduce(
      (acc, s) => acc + Number(s.metrics?.attendance || 0),
      0,
    );
    const atRisk = filteredStudents.filter(
      (s) => s.status === 'at_risk',
    ).length;
    return {
      groupAverage: avgSum / total,
      atRiskCount: atRisk,
      attendance: attSum / total,
    };
  }, [filteredStudents]);

  // ============================================================
  // MODAL STATE: Generar Citatorio Oficial
  // ============================================================
  // El modal se controla con dos pieces de estado: la visibilidad y
  // el alumno seleccionado. Al cerrar, ambos se limpian para que la
  // próxima apertura no muestre datos del alumno anterior.
  // ============================================================
  const [citatorioModalVisible, setCitatorioModalVisible] = useState(false);
  const [citatorioStudent, setCitatorioStudent] = useState(null);

  // ============================================================
  // HANDLERS (frontend-only, placeholders)
  // ============================================================
  const handleCitatorio = (student) => {
    // Abre el bottom sheet modal de citatorio con el alumno actual.
    setCitatorioStudent(student);
    setCitatorioModalVisible(true);
  };
  const handleExpediente = (student) => {
    // TODO: navigate to expediente detail screen.
    console.log('[Directorio] expediente →', student._id);
  };
  const handleMessageTutor = (student) => {
    // TODO: open chat with tutor.
    console.log('[Directorio] mensaje tutor →', student._id);
  };
  const handleNoteTutor = (student) => {
    // TODO: open note composer for tutor.
    console.log('[Directorio] nota tutor →', student._id);
  };

  // Cierra el modal de citatorio y limpia el alumno seleccionado.
  const handleCloseCitatorioModal = () => {
    setCitatorioModalVisible(false);
    // Delay el reset del student para evitar que el modal se
    // "desdibuje" durante la animación de cierre.
    setTimeout(() => setCitatorioStudent(null), 300);
  };

  // ============================================================
  // HEADER DE LA LISTA
  // ============================================================
  // Contiene: DashboardHeader (lo maneja el View raíz) → SchoolInfo
  // (también fuera) → Volver (también fuera) → GroupDiagnosticDashboard
  // → toolbar → (sin contador, ya está en el dashboard). Solo el
  // GroupDiagnosticDashboard + toolbar viven dentro del
  // ListHeaderComponent porque es lo que hace scroll junto con los
  // items.
  // ============================================================
  const renderListHeader = () => (
    <View>
      {/* Group Diagnostic Dashboard (3 métricas + count de alumnos). */}
      <View className="px-4 mt-3">
        <GroupDiagnosticDashboard
          title="1° OFIMÁTICA • TALLER TÉCNICO"
          period="1er Trimestre"
          studentCount={filteredStudents.length}
          groupAverage={dashboardMetrics.groupAverage}
          atRiskCount={dashboardMetrics.atRiskCount}
          attendance={dashboardMetrics.attendance}
        />
      </View>

      {/* Toolbar (search + filter). */}
      <View className="px-4 mt-4">
        <DirectoryToolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      </View>
    </View>
  );

  // Empty state cuando no hay matches.
  const renderEmpty = () => (
    <View className="px-4 py-12 items-center">
      <Text className="text-2xl">🔍</Text>
      <Text className="text-sm font-bold text-slate-600 mt-3 text-center">
        No se encontraron alumnos
      </Text>
      {searchTerm ? (
        <Text className="text-xs text-slate-500 mt-1 text-center">
          {`Intenta ajustar la búsqueda para "${searchTerm}".`}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* ============================================================
          HEADER FIJO (DashboardHeader compartido)
          ============================================================ */}
      <DashboardHeader />

      {/* SchoolInfoCard compuesta (logo escuela + maestro + fecha). */}
      <SchoolInfoCard
        school={school}
        isLoading={!school}
        className="mx-4 mt-2"
        teacherName={teacherName}
        date={currentDate}
      />

      {/* ============================================================
          BOTÓN VOLVER (debajo de la SchoolInfoCard)
          ============================================================
          Navega a la pantalla anterior (Mis Grupos) con
          router.back(). Sin bottom tab bar en esta pantalla:
          toda la navegación se hace por este back + el header
          compartido.
          ============================================================ */}
      <Pressable
        onPress={() => router.back()}
        className="flex-row items-center px-4 mt-3"
        accessibilityRole="button"
        accessibilityLabel="Volver a mis grupos"
      >
        <ChevronLeft size={18} color="#0ea5e9" strokeWidth={2.5} />
        <Text className="text-sm font-semibold text-sky-600 ml-1">
          Volver
        </Text>
      </Pressable>

      {/* ============================================================
          LISTA DE ALUMNOS (FlatList con header propio)
          ============================================================
          Vista SIEMPRE en formato lista (numColumns=1, sin toggle).
          Sin BottomTabBar: paddingBottom solo respeta safe area.
          ============================================================ */}
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View className="px-4">
            <StudentAccordionRow
              student={item}
              isExpanded={expandedStudentId === item._id}
              onToggle={() => toggleExpandStudent(item._id)}
              onCitatorio={() => handleCitatorio(item)}
              onExpediente={() => handleExpediente(item)}
              onMessageTutor={() => handleMessageTutor(item)}
              onNoteTutor={() => handleNoteTutor(item)}
            />
          </View>
        )}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {/* ============================================================
          MODAL: Generar Citatorio Oficial
          ============================================================
          Bottom sheet modal con KeyboardAvoidingView (dentro del
          modal). Lo montamos al final del árbol para que el
          stacking de RN lo pinte por encima del FlatList.
          ============================================================ */}
      <GenerarCitatorioModal
        isVisible={citatorioModalVisible}
        onClose={handleCloseCitatorioModal}
        student={citatorioStudent}
        groupName="1° OFIMÁTICA"
      />
    </View>
  );
}
