// =====================================================================
// app/(teacher)/(tabs)/groups/[groupId]/students/index.jsx
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
//   │ Título: "Directorio de Alumnos"        │
//   ├────────────────────────────────────────┤
//   │ Period Selector (pill button)          │  ← selector de período
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
// "Mis Grupos" (groups.jsx), pasando { groupId, groupName, subjectId }.
// =====================================================================

// React + hooks.
import React, { useEffect, useMemo, useState } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';

// Safe area.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Navegación: useRouter para el botón Volver.
import { useRouter, useLocalSearchParams } from 'expo-router';

// Iconos Lucide.
import { ChevronLeft, ChevronDown, Check, Clock } from 'lucide-react-native';

// Hook del directorio (estado local + búsqueda + accordion).
import useGroupStudentsDirectory from '@/src/hooks/useGroupStudentsDirectory';

// Hook del dashboard docente (escuela + maestro).
import { useTeacherDashboard } from '@/src/hooks/useTeacherDashboard';

// Servicio de períodos de calificación.
import { getGradingPeriods } from '@/src/services/teacherService';
// Chrome compartido.
import DashboardHeader from '@/src/components/DashboardHeader';
import SchoolInfoCard from '@/src/components/SchoolInfoCard';

// Sub-componentes privados del route group.
import GroupDiagnosticDashboard from '@/app/(teacher)/_components/GroupDiagnosticDashboard';
import DirectoryToolbar from '@/app/(teacher)/_components/DirectoryToolbar';
import StudentAccordionRow from '@/app/(teacher)/_components/StudentAccordionRow';
import GenerateCitationModal from '@/app/(teacher)/_components/GenerateCitationModal';
import CreateAnnouncementModal from '@/app/(teacher)/_components/CreateAnnouncementModal';

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function DirectorioAlumnosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  // groupId viene del segmento de URL [groupId].jsx (nesting).
  const groupId = params.groupId;
  const groupName = params.groupName || 'Grupo';
  const subjectId = params.subjectId;
  const isTutoria = params.isTutoria === 'true';
  const subjectName = params.subjectName || '';
  const totalStudents = Number(params.totalStudents) || 0;

  // ============================================================
  // PERÍODOS DE CALIFICACIÓN
  // ============================================================
  // Fetch de períodos al montar. Selecciona el primero por defecto.
  // Mismo patrón que las pantallas de asistencia y calificaciones.
  // ============================================================
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [periodDropdownVisible, setPeriodDropdownVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchPeriods = async () => {
      setPeriodsLoading(true);
      const result = await getGradingPeriods();
      if (!cancelled && result.success && result.data?.periods) {
        setPeriods(result.data.periods);
        if (result.data.periods.length > 0) {
          setSelectedPeriod(result.data.periods[0]);
        }
      }
      if (!cancelled) setPeriodsLoading(false);
    };
    fetchPeriods();
    return () => { cancelled = true; };
  }, []);

  // Hook del directorio: fetch del endpoint + búsqueda + accordion + sort.
  const {
    students,
    stats,
    loading: studentsLoading,
    error: studentsError,
    searchTerm,
    setSearchTerm,
    filteredStudents,
    expandedStudentId,
    toggleExpandStudent,
    sortBy,
    setSortBy,
  } = useGroupStudentsDirectory({
    groupId,
    subjectId,
    periodId: selectedPeriod?._id,
  });

  // Hook del dashboard: datos del maestro + escuela (mismo endpoint
  // que el TeacherDashboard, para que la card compuesta sea
  // consistente).
  const { data } = useTeacherDashboard();
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
  // MODAL STATE: Generate Citation
  // ============================================================
  // El modal se controla con dos pieces de estado: la visibilidad y
  // el alumno seleccionado. Al cerrar, ambos se limpian para que la
  // próxima apertura no muestre datos del alumno anterior.
  // ============================================================
  const [citationModalVisible, setCitationModalVisible] = useState(false);
  const [citationStudent, setCitationStudent] = useState(null);

  // ============================================================
  // MODAL STATE: Create Announcement
  // ============================================================
  // Mismo patrón que el modal de citatorio: visibilidad + alumno.
  // ============================================================
  const [avisoModalVisible, setAvisoModalVisible] = useState(false);
  const [avisoStudent, setAvisoStudent] = useState(null);

  // ============================================================
  // HANDLERS (frontend-only, placeholders)
  // ============================================================
  const handleCitatorio = (student) => {
    // Abre el bottom sheet modal de citatorio con el alumno actual.
    setCitationStudent(student);
    setCitationModalVisible(true);
  };
  const handleExpediente = (student) => {
    // Navega al Expediente del alumno: si isTutoria es true, abre
    // tutoria-file; si no, abre file (materia regular).
    const screen = isTutoria ? 'tutoria-file' : 'file';
    router.push({
      pathname: `/(teacher)/groups/${groupId}/students/${student._id}/${screen}`,
      params: { subjectId },
    });
  };
  const handleMessageTutor = (student) => {
    // TODO: open chat with tutor.
    console.log('[Directorio] mensaje tutor →', student._id);
  };
  const handleNoteTutor = (student) => {
    // TODO: open note composer for tutor.
    console.log('[Directorio] nota tutor →', student._id);
  };
  const handleAviso = (student) => {
    // Abre el bottom sheet modal de aviso con el alumno actual.
    setAvisoStudent(student);
    setAvisoModalVisible(true);
  };

  // Cierra el modal de citatorio y limpia el alumno seleccionado.
  const handleCloseCitationModal = () => {
    setCitationModalVisible(false);
    // Delay el reset del student para evitar que el modal se
    // "desdibuje" durante la animación de cierre.
    setTimeout(() => setCitationStudent(null), 300);
  };

  // Cierra el modal de aviso y limpia el alumno seleccionado.
  const handleCloseAvisoModal = () => {
    setAvisoModalVisible(false);
    setTimeout(() => setAvisoStudent(null), 300);
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
      {/* Título de la pantalla. */}
      <View className="px-4 mt-3">
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#0F172A' }}>
          Directorio de Alumnos
        </Text>
      </View>

      {/* Selector de período (pill button). */}
      <View className="px-4 mt-2">
        <Pressable
          onPress={() => setPeriodDropdownVisible(true)}
          className="flex-row items-center self-start bg-white border border-[#E2E8F0] rounded-full px-4 py-2"
          accessibilityRole="button"
          accessibilityLabel={`Periodo seleccionado: ${selectedPeriod?.name || 'Cargando...'}`}
          accessibilityHint="Toque para cambiar periodo"
          disabled={periodsLoading}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>
            {periodsLoading ? 'Cargando...' : (selectedPeriod?.name || 'Sin períodos')}
          </Text>
          {!periodsLoading && (
            <ChevronDown
              size={16}
              color="#0F172A"
              strokeWidth={2.25}
              style={{ marginLeft: 6 }}
            />
          )}
        </Pressable>
      </View>

      {/* Group Diagnostic Dashboard (3 métricas + count de alumnos). */}
      <View className="px-4 mt-3">
        <GroupDiagnosticDashboard
          title={subjectName ? `${groupName} • ${subjectName}` : groupName}
          period={selectedPeriod?.name || (periodsLoading ? 'Cargando...' : 'Sin períodos')}
          studentCount={totalStudents || filteredStudents.length}
          groupAverage={stats?.groupAverage ?? 0}
          atRiskCount={stats?.atRiskCount ?? 0}
          attendance={stats?.attendancePercentage ?? 0}
        />
      </View>

      {/* Botón "Ver Horario" — solo para tutorías. Navega a la
          pantalla de horario del grupo con selector por día. */}
      {isTutoria && (
        <View className="px-4 mt-3">
          <Pressable
            onPress={() => router.push({
              pathname: `/(teacher)/groups/${groupId}/schedule`,
              params: { groupName },
            })}
            className="flex-row items-center justify-center py-3 rounded-xl"
            style={{ backgroundColor: '#EFF6FF' }}
            accessibilityRole="button"
            accessibilityLabel="Ver horario completo del grupo"
          >
            <Clock size={16} color="#2563EB" strokeWidth={2.5} />
            <Text
              className="ml-2"
              style={{ fontSize: 13, fontWeight: '700', color: '#2563EB' }}
            >
              Ver Horario del Grupo
            </Text>
          </Pressable>
        </View>
      )}

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

  // Empty state cuando no hay matches, loading o error.
  const renderEmpty = () => {
    if (studentsLoading) {
      return (
        <View className="px-4 py-12 items-center">
          <Text className="text-sm text-slate-500 mt-1 text-center">
            Cargando alumnos...
          </Text>
        </View>
      );
    }
    if (studentsError) {
      return (
        <View className="px-4 py-12 items-center">
          <Text className="text-2xl">⚠️</Text>
          <Text className="text-sm font-bold text-rose-600 mt-3 text-center">
            {studentsError}
          </Text>
        </View>
      );
    }
    return (
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
  };

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
        teacher={data?.teacher}
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
              onAviso={() => handleAviso(item)}
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
          MODAL: Generate Citation
          ============================================================
          Bottom sheet modal con KeyboardAvoidingView (dentro del
          modal). Lo montamos al final del árbol para que el
          stacking de RN lo pinte por encima del FlatList.
          ============================================================ */}
      <GenerateCitationModal
        isVisible={citationModalVisible}
        onClose={handleCloseCitationModal}
        student={citationStudent}
        groupName={groupName}
        subjectId={subjectId}
      />

      {/* ============================================================
          MODAL: Create Announcement
          ============================================================
          Bottom sheet modal para crear un aviso dirigido al alumno
          seleccionado desde el directorio.
          ============================================================ */}
      <CreateAnnouncementModal
        visible={avisoModalVisible}
        onClose={handleCloseAvisoModal}
        groups={[]}
        student={avisoStudent}
      />

      {/* ============================================================
          MODAL: SELECCIÓN DE PERÍODO
          ============================================================ */}
      <Modal
        visible={periodDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPeriodDropdownVisible(false)}
      >
        <Pressable
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}
          onPress={() => setPeriodDropdownVisible(false)}
        >
          <Pressable
            className="bg-white rounded-2xl w-[85%] max-h-[50%] overflow-hidden"
            style={{
              shadowColor: '#0F172A',
              shadowOpacity: 0.15,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 10 },
              elevation: 5,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header del modal. */}
            <View className="px-5 pt-5 pb-3 border-b border-slate-100">
              <Text className="text-[17px] font-bold text-slate-900">
                Seleccionar Periodo
              </Text>
              <Text className="text-sm text-slate-500 mt-1">
                Elige el periodo para ver el directorio
              </Text>
            </View>

            {/* Lista de periodos. */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {periods.length === 0 && (
                <View className="px-5 py-8 items-center">
                  <Text className="text-slate-400 text-sm">
                    No hay períodos disponibles
                  </Text>
                </View>
              )}
              {periods.map((period) => {
                const isSelected = selectedPeriod?._id === period._id;
                return (
                  <Pressable
                    key={period._id}
                    onPress={() => {
                      setSelectedPeriod(period);
                      setPeriodDropdownVisible(false);
                    }}
                    className="flex-row items-center px-5 py-4 border-b border-slate-50"
                    style={{
                      backgroundColor: isSelected ? '#F0F9FF' : 'transparent',
                    }}
                  >
                    <View className="flex-1">
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? '#0284C7' : '#0F172A',
                        }}
                      >
                        {period.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <Check size={18} color="#0284C7" strokeWidth={2.5} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Botón cerrar. */}
            <Pressable
              onPress={() => setPeriodDropdownVisible(false)}
              className="px-5 py-4 border-t border-slate-100 items-center"
            >
              <Text className="text-sm font-semibold text-slate-500">
                Cerrar
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
