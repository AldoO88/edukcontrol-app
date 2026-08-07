// =====================================================================
// studentHelpers.js
// ---------------------------------------------------------------------
// Helpers para transformar la lista de `students` que llega del
// backend (endpoint /api/guardians/me/dashboard) al shape que
// consumen los componentes de UI:
//
//   - <StudentFilter>:     array de { id, name, avatarUrl, avatarLetter }
//   - <GuardianDashboard>: array de students con la shape del backend
//                          (lo pasa directo al StudentCard)
//
// El backend devuelve cada student con shape:
//
//   {
//     _id: "65f0...",
//     first_name: "Juan",
//     last_name: "Pérez",
//     photo_url: "https://...",
//     status: "active",
//     ...
//   }
//
// y los componentes de filtro esperan { id, name, avatarUrl, avatarLetter }.
// Esta función mapea entre las dos shapes.
// =====================================================================

// ---------------------------------------------------------------------
// studentForFilter(student)
// ---------------------------------------------------------------------
// Transforma un student del backend al shape que consume
// <StudentFilter> (y otros componentes de pills). Si el student
// es null/undefined, devuelve null (lo filtramos después).
//
//   id:           student._id (string MongoDB ObjectId).
//   name:         "first_name last_name" (trim).
//   avatarUrl:    student.photo_url (puede ser null).
//   avatarLetter: inicial de first_name (uppercase, fallback "?").
// ---------------------------------------------------------------------
export const studentForFilter = (student) => {
  if (!student) return null;

  // Nombre completo: combinamos first + last, manejando el caso
  // de last_name null.
  const fullName = [student.first_name, student.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  // Inicial: primera letra de first_name. Si no hay, "?".
  const avatarLetter = (student?.first_name?.[0] || '?').toUpperCase();

  return {
    id: student._id,
    name: fullName || 'Alumno',
    avatarUrl: student.photo_url || null,
    avatarLetter,
  };
};

// ---------------------------------------------------------------------
// studentsForFilter(data)
// ---------------------------------------------------------------------
// Transforma el array `data.students` del backend (lo que devuelve
// useGuardianDashboard) al array de pills que consume
// <StudentFilter>. Filtra nulls por si el backend devuelve un
// array con elementos vacíos.
//
// Uso típico:
//
//   const { data } = useGuardianDashboard();
//   const students = useMemo(
//     () => studentsForFilter(data),
//     [data],
//   );
//   <StudentFilter students={students} ... />
// ---------------------------------------------------------------------
export const studentsForFilter = (data) => {
  if (!data?.students || !Array.isArray(data.students)) return [];
  return data.students.map(studentForFilter).filter(Boolean);
};
