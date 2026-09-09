# SPEC: `GET /api/teacher-subjects/me/grades/validation`

Endpoint consumido por la pantalla **Calificaciones** del tab bar del maestro (rol `teacher`).

**Estado:** confirmado con backend. Frontend ya conectado.

---

## Endpoint

```
GET /api/teacher-subjects/me/grades/validation?grading_period_id={id}
```

**Auth:** JWT + role `teacher` + middlewares `attachSchoolContext`, `attachActiveSchoolYear`.

**Query params:**
- `grading_period_id` (requerido): ObjectId del período a consultar.

**Solo se aceptan períodos existentes en el modelo `GradingPeriod`** — el endpoint rechaza IDs inválidos con 404. La pantalla del frontend llama primero a `GET /api/teacher-subjects/me/grading-periods` para listar los IDs disponibles y solo deja seleccionar entre esos.

---

## Response shape

```json
{
  "gradingPeriod": {
    "_id": "6a856e8d7781785c238f03f8",
    "name": "Primer Trimestre",
    "order": 1,
    "startDate": "2026-08-18T00:00:00.000Z",
    "endDate": "2026-11-15T23:59:59.999Z",
    "isClosed": false
  },
  "progress": {
    "totalGroups": 5,
    "closedGroups": 1,
    "percentage": 20
  },
  "groups": [
    {
      "_id": "<groupId>",
      "group": {
        "_id": "...",
        "label": "1°C",
        "grade": 1,
        "section": "C",
        "type": "regular"
      },
      "subject": {
        "_id": "...",
        "name": "Tutoría",
        "code": "TUT",
        "macroCategory": "...",
        "isTutoria": true
      },
      "average": 7.54,
      "status": "closed",
      "closedAt": "2026-08-31T02:14:31.726Z"
    }
  ]
}
```

---

## Lógica de `status`

| status | condición |
|---|---|
| `closed` | existe `GradeClosing` para esta combinación grupo/materia/periodo |
| `pending` | NO existen `EvaluationType` definidos para esta combinación |
| `review` | existen `EvaluationType` pero hay al menos un `(student, evaluation_type)` sin nota |

---

## Modelo nuevo: `GradeClosing`

```
{
  schoolYearId: ObjectId ref SchoolYear,
  groupId:      ObjectId ref Group,
  subjectId:    ObjectId ref Subject,
  periodId:     ObjectId ref GradingPeriod,
  teacherId:    ObjectId ref Teacher,
  closedAt:     Date
}
```

Índices:
- Unique: `{ schoolYearId, groupId, subjectId, periodId }` — garantiza una sola fila por combo.
- `{ teacherId }` — para queries del dashboard del maestro.

---

## Alcance: incluir grupos taller

**Sí, incluir grupos `taller` en el response.** Si el maestro da clases de taller, esos grupos también aparecen en la pantalla de validación con su propio status/average.

`group.type` puede ser `"regular" | "taller"` — el frontend lo pinta igual sin lógica especial; la diferencia visual es solo el `label` del grupo.

---

## Optimización: paralelizar queries con `Promise.all`

Estructura sugerida para minimizar latencia:

```js
// Globales (3 queries en paralelo)
const [gradingPeriod, teacherSubjects, allEvaluationTypes] = await Promise.all([
  GradingPeriod.findById(gradingPeriodId),
  TeacherSubject.find({ teacherId, schoolYearId }),
  EvaluationType.find({ schoolYearId }),
]);

// Por cada combo: 2 queries en paralelo (GradeClosing + Grade)
const groupValidations = await Promise.all(
  teacherSubjects.map(async (ts) => {
    const [closing, grades] = await Promise.all([
      GradeClosing.findOne({ /* combo único */ }),
      Grade.find({ /* combo */ }),
    ]);
    return { /* ... */ };
  })
);
```

**Total: ~10 queries en paralelo ≈ 100-200ms** vs ~2000ms con queries seriales.

Si el maestro tiene >20 grupos, considerar batch con `$in` para evitar saturar el pool de conexiones.

---

## Errores esperados

| código | causa |
|---|---|
| `400` | falta `grading_period_id` o es inválido |
| `401` | token expirado / inválido |
| `404` | período no encontrado o no pertenece al tenant |

---

## Cambios respecto al SPEC anterior

| Cambio | Antes | Ahora |
|---|---|---|
| Campo `actaUrl` en cada grupo del response | incluido | **removido** (no se usa en el front actual) |
| Campo `actaUrl` en modelo `GradeClosing` | incluido | **removido** (no hay endpoint de descarga) |
| Endpoint `GET .../acta` | en P5 | **fuera de scope** |
| Endpoint `POST .../export-siee` | en P5 | renombrado a `POST .../export-excel` |
| Grupos taller | excluidos | **incluidos** |
| Validación de período | rechazar `order === 0` | **solo aceptar períodos existentes en `GradingPeriod`** |

---

## Cambios en el frontend (ya implementados)

Archivos modificados:

| Archivo | Cambio |
|---|---|
| `src/services/teacherService.js` | Nueva función `getGradeValidation(gradingPeriodId)` + endpoint constant `GRADE_VALIDATION_ENDPOINT` |
| `src/hooks/useGradeValidation.js` (nuevo) | Hook con fetch, loading, error, refetch + `useFocusEffect` |
| `app/(teacher)/(tabs)/grades/index.jsx` | Refactor completo: elimina MOCKS, usa `getGradingPeriods` + `useGradeValidation` |

---

## Verificación post-implementación

1. Backend expone el endpoint con el shape exacto del SPEC.
2. Login como maestro → tab "Calificaciones" → ver tabs de trimestres (los que estén dados de alta en `GradingPeriod`).
3. Seleccionar "Primer Trimestre" → ver `progress` correcto + cards con status/average por grupo (incluyendo talleres si aplica).
4. Verificar que `pending` aparece sin `EvaluationType`, `review` cuando hay EvaluationType pero faltan notas, y `closed` cuando hay `GradeClosing`.
5. Crear al menos un `GradeClosing` de prueba → confirmar que la card muestra "Trimestre Cerrado (Acta Generada)" con cinta verde + botón "Desbloquear".
6. Botón "Exportar a Excel" al fondo (placeholder hasta tener endpoint).
7. Verificar error 401 (token expirado) → Alert + botón Reintentar.
8. Verificar error 404 (period_id inválido) → Alert + botón Reintentar.

---

## Pendientes para iteraciones futuras

Estos endpoints NO son necesarios para el sprint actual. Se definirán cuando se implementen:

- `GET /api/teacher-subjects/me/grades/validation/:groupId/acta` — descargar PDF del acta (cuando se reactive el botón "Descargar Acta").
- `PATCH /api/teacher-subjects/me/grades/validation/:groupId/unlock` — borrar el `GradeClosing` y refrescar status.
- `POST /api/teacher-subjects/me/grades/export-excel?grading_period_id=...` — generar el Excel con los concentrados.
