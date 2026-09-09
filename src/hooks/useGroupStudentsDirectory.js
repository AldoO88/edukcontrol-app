// =====================================================================
// useGroupStudentsDirectory.js
// ---------------------------------------------------------------------
// Hook del directorio de alumnos del grupo (pantalla
// "Directorio y Expediente de Alumnos"). Maneja el fetch del endpoint
// GET /group-students-summary, el estado de la lista, el término de
// búsqueda, el filtrado reactivo, el item expandido del accordion y el
// criterio de ordenamiento.
//
// Retorna:
//   - students:          lista de alumnos mapeada al shape de
//                        StudentAccordionRow.
//   - stats:             { groupAverage, atRiskCount, attendancePercentage }
//                        del endpoint (para el GroupDiagnosticDashboard).
//   - groupInfo:         { label, macroCategory, totalStudents } del endpoint.
//   - periodInfo:        { _id, name } del período seleccionado.
//   - loading:           boolean — true mientras se hace fetch.
//   - error:             string | null — mensaje de error si falla.
//   - searchTerm:        término de búsqueda actual.
//   - setSearchTerm:     setter de búsqueda.
//   - filteredStudents:  lista filtrada + ordenada.
//   - expandedStudentId: id del alumno con el accordion abierto.
//   - toggleExpandStudent(id): abre/cierra el accordion.
//   - sortBy:            id del criterio de ordenamiento activo.
//   - setSortBy:         setter de sortBy.
//   - refetch:           fn() — re-invoca el endpoint.
//
// Constantes exportadas:
//   - SORT_OPTIONS:      criterios de ordenamiento disponibles.
// =====================================================================

// React.
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

// Servicio del endpoint.
import { getGroupStudentsSummary } from '../services/teacherService';

// IDs de los criterios de ordenamiento. Single source of truth
// (consumidos por el hook y por el DirectoryToolbar).
export const SORT_OPTIONS = [
  { id: 'listNumber',  label: 'N.° de lista' },
  { id: 'averageDesc', label: 'Promedio (mayor a menor)' },
  { id: 'averageAsc',  label: 'Promedio (menor a mayor)' },
];

// ---------------------------------------------------------------------
// Mapeo: backend → shape de StudentAccordionRow
// ---------------------------------------------------------------------
// El backend retorna { fullName, average, attendancePercentage,
// citationsCount, guardian, initials, controlNumber }.
// El componente espera { name, controlNumber, listNumber, initials,
// metrics: { average, attendance, citatorios }, tutor: { name, relationship } }.
// ---------------------------------------------------------------------
const mapStudentFromBackend = (s, index) => ({
  _id: s._id,
  name: s.fullName,
  controlNumber: s.controlNumber,
  listNumber: index + 1,
  initials: s.initials,
  photoUrl: null,
  status: s.average < 7.0 ? 'at_risk' : 'regular',
  metrics: {
    average: s.average,
    attendance: s.attendancePercentage,
    citatorios: s.citationsCount,
  },
  tutor: s.guardian
    ? { name: s.guardian.fullName, relationship: s.guardian.relationship, phone: s.guardian.phone }
    : null,
});

const useGroupStudentsDirectory = ({ groupId, subjectId, periodId } = {}) => {
  // -------------------------------------------------------------------
  // Estado del fetch
  // -------------------------------------------------------------------
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);
  const [periodInfo, setPeriodInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ref para evitar fetch duplicado en StrictMode.
  const fetchIdRef = useRef(0);

  // -------------------------------------------------------------------
  // Fetch del endpoint
  // -------------------------------------------------------------------
  const fetchStudents = useCallback(async () => {
    if (!groupId || !subjectId || !periodId) return;

    const currentFetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    const result = await getGroupStudentsSummary(groupId, subjectId, periodId);

    // Ignorar si ya hubo otro fetch más reciente.
    if (currentFetchId !== fetchIdRef.current) return;

    if (result.success && result.data) {
      const mapped = (result.data.students || []).map(mapStudentFromBackend);
      // Deduplicar por _id (el backend puede devolver duplicados).
      const seen = new Set();
      const unique = mapped.filter((s) => {
        if (seen.has(s._id)) return false;
        seen.add(s._id);
        return true;
      });
      setStudents(unique);
      setStats(result.data.stats || null);
      setGroupInfo(result.data.group || null);
      setPeriodInfo(result.data.period || null);
    } else {
      setError(result.message || 'No se pudieron cargar los alumnos.');
      setStudents([]);
      setStats(null);
    }

    setLoading(false);
  }, [groupId, subjectId, periodId]);

  // Ejecutar fetch cuando cambian los params.
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // -------------------------------------------------------------------
  // Búsqueda, filtrado y ordenamiento
  // -------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [sortBy, setSortBy] = useState('listNumber');

  const filteredStudents = useMemo(() => {
    const term = String(searchTerm || '').trim().toLowerCase();

    let result = term
      ? students.filter((s) => {
          const name = String(s.name || '').toLowerCase();
          const controlNumber = String(s.controlNumber || '').toLowerCase();
          const list = String(s.listNumber ?? '');
          return (
            name.includes(term) ||
            controlNumber.includes(term) ||
            list.includes(term)
          );
        })
      : students;

    result = [...result];
    if (sortBy === 'averageDesc') {
      result.sort(
        (a, b) =>
          Number(b.metrics?.average || 0) - Number(a.metrics?.average || 0),
      );
    } else if (sortBy === 'averageAsc') {
      result.sort(
        (a, b) =>
          Number(a.metrics?.average || 0) - Number(b.metrics?.average || 0),
      );
    }

    return result;
  }, [students, searchTerm, sortBy]);

  const toggleExpandStudent = useCallback((id) => {
    setExpandedStudentId((current) => (current === id ? null : id));
  }, []);

  // Reset search y expanded cuando cambian los params.
  useEffect(() => {
    setSearchTerm('');
    setExpandedStudentId(null);
    setSortBy('listNumber');
  }, [groupId, subjectId, periodId]);

  return {
    students,
    stats,
    groupInfo,
    periodInfo,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filteredStudents,
    expandedStudentId,
    toggleExpandStudent,
    sortBy,
    setSortBy,
    refetch: fetchStudents,
  };
};

export default useGroupStudentsDirectory;
