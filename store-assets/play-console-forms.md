# Contenido para formularios de Google Play Console — EdukControl

## 1. Acceso a la app (App access)

Play exige credenciales para revisores (seleccionar "Todos los revisores necesitan acceso").

| Campo | Valor |
|---|---|
| Instrucciones | La app se ingresa con teléfono (10 dígitos) y contraseña. No hay registro público; las cuentas las crea la escuela. |
| Correo electrónico (opcional) | *(correo que el usuario registre en Play Console)* |
| Usuario / Teléfono (rol Docente) | `7710000002` |
| Contraseña (Docente) | `EdukTest2026!` |
| Usuario / Teléfono (rol Padre de familia) | `7710000003` |
| Contraseña (Padre de familia) | `EdukTest2026!` |
| URL (opcional) | `https://www.edukcontrol.net/login` |

Datos visibles al ingresar (Escuela de Prueba EdukControl, ciclo 2026-2027).

## 2. Recopilación y seguridad de datos (Data safety)

**¿Se comparten o venden datos a terceros?** No.

**¿La app cumple con la política de seguridad de datos de Play?** Sí.

### Datos recopilados

| Tipo de dato | Datos concretos | ¿Se comparte? | Propósito | Obligatorio u opcional | Cifrado en tránsito | Solicitud de eliminación |
|---|---|---|---|---|---|---|
| Información personal | Nombre, correo electrónico, número de teléfono | No | Funciones de la app, Gestión de cuentas | Obligatorio (cuenta creada por la escuela) | Sí | Por correo electrónico |
| Información educativa | Calificaciones, expediente académico, historial de asistencia, horarios, grupo | No | Funciones de la app | Obligatorio | Sí | Por correo electrónico |
| Información de salud | Condiciones médicas, medicamentos, alergias, estilo de aprendizaje, diagnóstico (ficha de salud capturada por personal autorizado de la escuela) | No | Funciones de la app | Opcional | Sí | Por correo electrónico |
| Identificadores de dispositivo | Token de notificaciones push (Expo/FCM) | No | Funciones de la app (notificaciones) | Opcional (permiso de notificaciones denegable) | Sí | Por correo electrónico |

No se recopilan: ubicación, contactos, fotos/audio/video, información financiera, historial de búsqueda web, anuncios ni publicidad personalizada. No hay SDK de analítica de terceros ni de crash reporting.

**Cifrado en tránsito:** toda la comunicación usa HTTPS.
**Eliminación de datos:** solicitud por correo electrónico a la escuela/administrador *(completar con el correo de contacto de Play)*.

## 3. Clasificación de contenido (IARC questionnaire)

Todas las respuestas **No / Ninguno**:

| Pregunta | Respuesta |
|---|---|
| ¿Violencia (ficticia o realista)? | No |
| ¿Contenido sexual o desnudez? | No |
| ¿Lenguaje soez? | No |
| ¿Consumo de drogas/tabaco/alcohol? | No |
| ¿Contenido discutible (apuestas, armas, etc.)? | No |
| ¿Chat, foros, contenido generado por el usuario compartible públicamente? | No (el contenido lo captura el personal de la escuela y solo es visible para su comunidad) |
| ¿Compras dentro de la app o anuncios? | No |
| ¿Funciones sociales / compartir con usuarios externos? | No |

Resultado esperado: **Para todos (Everyone / PEGI 3)**.

## 4. Público objetivo (Target audience)

- **Grupo de edad objetivo:** Adultos (18+) — los usuarios son docentes, directivos y tutores; los alumnos no usan la app.
- No está dirigida a niños (≤12 años); no se aplica COPPA.
- Al ser un app para instituciones educativas, Play puede mostrar la advertencia de "servicios educativos" — responder que es uso administrativo escolar, no contenido educativo para niños.

## 5. Otros formularios

| Formulario | Respuesta |
|---|---|
| Declaración de permisos (sensores) | Ningún permiso sensible; solo notificaciones (denegable) y red |
| Cuenta de eliminación de cuentas | No hay autoregistro; la escuela crea y elimina cuentas. Declarar método: correo electrónico |
| Política de privacidad (URL) | `https://www.edukcontrol.net/politica-de-privacidad` |
| Términos del servicio (URL, si Play lo pide) | `https://www.edukcontrol.net/terminos` |
| Categoría | Educación |
| Declaración de seguridad del niño (Family policy) | No aplica (no dirigida a niños) |
| Anuncios / Ads ID | No usa Advertising ID ni anuncios |
