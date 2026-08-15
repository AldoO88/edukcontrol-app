// =====================================================================
// useGroupStudentsDirectory.js
// ---------------------------------------------------------------------
// Hook del directorio de alumnos del grupo (pantalla
// "Directorio y Expediente de Alumnos"). Maneja el estado de la
// lista, el término de búsqueda, el filtrado reactivo, el item
// expandido del accordion y el criterio de ordenamiento.
//
// FRONTEND ONLY: opera 100% sobre estado local (useState). No hace
// fetch ni llamadas HTTP. La lista inicial viene de mockStudents.
//
// Retorna:
//   - students:          lista completa de alumnos del grupo.
//   - searchTerm:        término de búsqueda actual.
//   - setSearchTerm:     setter de búsqueda.
//   - filteredStudents:  lista filtrada + ordenada (vacía si no
//                        hay matches).
//   - expandedStudentId: id del alumno con el accordion abierto o
//                        null si todos están cerrados.
//   - toggleExpandStudent(id): abre el accordion si está cerrado,
//                              cierra si está abierto.
//   - sortBy:            id del criterio de ordenamiento activo.
//   - setSortBy:         setter de sortBy.
//
// Constantes exportadas:
//   - SORT_OPTIONS:      array con los IDs de los 3 criterios
//                        disponibles. El toolbar los mapea a labels
//                        e iconos. Mantener el contrato aquí (el
//                        hook) y la presentación en el toolbar.
// =====================================================================

// React.
import { useState, useMemo, useCallback } from 'react';

// Datos MOCK.
import MOCK_STUDENTS from '../constants/mockStudents';

// IDs de los criterios de ordenamiento. Single source of truth
// (consumidos por el hook y por el DirectoryToolbar).
export const SORT_OPTIONS = [
  { id: 'listNumber',  label: 'N.° de lista' },
  { id: 'averageDesc', label: 'Promedio (mayor a menor)' },
  { id: 'averageAsc',  label: 'Promedio (menor a mayor)' },
];

const useGroupStudentsDirectory = () => {
  // Lista completa (futuro: reemplazar por fetch del backend).
  const [students] = useState(MOCK_STUDENTS);

  // Término de búsqueda (raw string del input).
  const [searchTerm, setSearchTerm] = useState('');

  // Id del alumno con el accordion abierto. null = todos cerrados.
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  // Criterio de ordenamiento activo. Default: 'listNumber' (orden
  // original del mock, que viene por número de lista).
  const [sortBy, setSortBy] = useState('listNumber');

  // Lista filtrada + ordenada. Recalculada cuando cambian
  // students, searchTerm o sortBy.
  //
  //   1) Filtro: case-insensitive por nombre, N.L. o No. de Control.
  //   2) Sort:   clonamos el array (no mutamos el original) y
  //              aplicamos el criterio seleccionado. 'listNumber'
  //              deja el orden natural (asumimos que el mock ya
  //              viene ordenado por listNumber asc).
  const filteredStudents = useMemo(() => {
    const term = String(searchTerm || '').trim().toLowerCase();

    // 1) Filtrado.
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

    // 2) Ordenamiento (clonar para no mutar el array original).
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
    // 'listNumber' → orden original (no tocamos result).

    return result;
  }, [students, searchTerm, sortBy]);

  // Toggle del accordion: si toco el que ya está abierto, lo cierra;
  // si toco otro, lo abre (cerrando el anterior).
  const toggleExpandStudent = useCallback((id) => {
    setExpandedStudentId((current) => (current === id ? null : id));
  }, []);

  return {
    students,
    searchTerm,
    setSearchTerm,
    filteredStudents,
    expandedStudentId,
    toggleExpandStudent,
    sortBy,
    setSortBy,
  };
};

export default useGroupStudentsDirectory;
