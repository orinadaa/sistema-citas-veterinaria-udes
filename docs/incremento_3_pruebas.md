# Incremento 3 — Módulo administrativo: pruebas

## Pruebas unitarias

Ejecutadas con Jest + Supertest. Comando: `npm test` (dentro de `backend/`).

| Archivo | Casos cubiertos | Resultado |
|---|---|---|
| `franjas.test.js` | Franjas de 08:00–16:30 en horario 08:00-17:00, franjas de 08:00–11:30 en horario 08:00-12:00, separación exacta entre franjas (reemplaza `horarioAtencion.test.js`) | 3/3 ✅ |
| `horario.controller.test.js` | RF-13: GET sin sedeId, sede inexistente, lectura pública; PUT sin token, con rol cliente, día fuera de rango, hora inicio ≥ hora fin, actualización exitosa; DELETE con rol no autorizado, cierre exitoso | 9/9 ✅ |
| `servicio.controller.test.js` | RF-11: GET público solo activos, GET /admin rechaza cliente y lista todos (incl. inactivos); POST rechaza cliente/sin nombre/nombre duplicado, crea correctamente; PUT servicio inexistente (404), desactivación exitosa | 8/8 ✅ |
| `administracion.controller.test.js` | RF-10/RF-11/RF-12: listar médicos rechaza veterinario, lista los de la sede del admin; actualizar especialidades valida lista/médico existente/misma sede, actualiza correctamente; listar citas rechaza cliente, admin ve su sede, veterinario ve solo las suyas | 10/10 ✅ |
| `cita.controller.test.js` (actualizado) | Ahora mockea `horario.model` en vez de depender de la constante fija eliminada | 16/16 ✅ |

**Total: 73/73 pruebas unitarias del backend pasando**, ejecutado 2026-09-16.

### Ampliación: sistema de diseño (categoría/precio de servicios, CRUD de médicos, gestión multi-sede)

| Archivo | Casos cubiertos | Resultado |
|---|---|---|
| `servicio.controller.test.js` (ampliado) | Ahora valida `categoriaId`/`precio` al crear y actualizar (obligatorios, categoría inexistente, precio negativo o no entero); nuevo `GET /api/servicios/categorias` | 13/13 ✅ |
| `administracion.controller.test.js` (ampliado) | `POST /medicos` (rechaza rol/campos faltantes/contraseña corta/correo duplicado, crea en la sede del admin), `PUT /medicos/:id` (404, 403 por sede, actualización de perfil), `PUT /medicos/:id/especialidades` (lista inválida, categoría inexistente, actualización correcta) | 20/20 ✅ |
| `sede.controller.test.js` (nuevo) | `GET /sedes` público; `POST /sedes` rechaza cliente/campos faltantes, crea correctamente; `PUT /sedes/:id` 404, y confirma que un administrador puede editar una sede que no es la suya (gestión multi-sede) | 6/6 ✅ |

**Total: 94/94 pruebas unitarias del backend pasando**, ejecutado 2026-09-23.

## Pruebas de aceptación (manuales, contra la API real y PostgreSQL local)

| ID | Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| PA-21 | Consultar horario público de una sede | `GET /api/horarios?sedeId=...` sin token | 200, 6 días configurados (domingo cerrado) | ✅ Igual a lo esperado |
| PA-22 | Admin lista los médicos de su sede con sus especialidades | `GET /api/administracion/medicos` | 200, incluye los veterinarios sembrados y sus servicios | ✅ Igual a lo esperado |
| PA-23 | Admin actualiza el horario de un día y el cambio se refleja en disponibilidad de citas | `PUT /api/horarios` (lunes 09:00–18:00) → `GET /api/citas/disponibilidad` para ese lunes | 200, primera franja disponible a las 09:00 local (antes 08:00) | ✅ Igual a lo esperado, confirma que el refactor de horarios funciona end-to-end |
| PA-24 | Admin crea un servicio nuevo | `POST /api/servicios` | 201, servicio creado con `activo: true` | ✅ Igual a lo esperado |
| PA-25 | Admin ve el seguimiento de citas de su sede (RF-12) | `GET /api/administracion/citas` | 200, incluye la cita real de prueba de la usuaria en esa sede | ✅ Igual a lo esperado |

*Nota: el usuario y horario modificados durante la validación (`pruebainc3@test.com`, horario del lunes) se revirtieron/eliminaron después de la prueba.*

### Ampliación: sistema de diseño (manuales, contra la API real y PostgreSQL local)

| ID | Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| PA-26 | Consultar el catálogo de categorías (compartido con especialidades de médicos) | `GET /api/servicios/categorias` sin token | 200, 10 nombres agrupados en 7 colores | ✅ Igual a lo esperado |
| PA-27 | Admin crea un servicio con categoría y precio | `POST /api/servicios` con `categoriaId` y `precio: 55000` | 201, servicio creado con `categoria_nombre: "Consulta"`, `categoria_color: "blue"`, `precio: 55000` | ✅ Igual a lo esperado |
| PA-28 | Admin crea un médico nuevo en su propia sede | `POST /api/administracion/medicos` con nombre/correo/contraseña/documento/teléfono | 201, médico creado con `sede_id` igual al del administrador, `especialidades: []` | ✅ Igual a lo esperado |
| PA-29 | Admin asigna una especialidad al médico recién creado | `PUT /api/administracion/medicos/:id/especialidades` con `categoriaIds: [id de "Cirugía"]` | 200, el médico queda con esa especialidad (badge `color: "pink"`) | ✅ Igual a lo esperado |
| PA-30 | Admin crea una sede nueva | `POST /api/sedes` con nombre/ciudad/dirección (con tildes) | 201, sede creada; se verificó además que los caracteres UTF-8 (`Cúcuta`) se guardan correctamente en PostgreSQL al enviar el payload como archivo (un primer intento por línea de comandos mostró corrupción, mostrada como bug pero confirmada como artefacto de la codificación de la terminal usada para probar, no del backend) | ✅ Igual a lo esperado tras descartar el falso positivo |
| PA-31 | Un administrador edita el horario de una sede que no es la suya (gestión multi-sede) | `PUT /api/horarios` con el `sedeId` de la sede recién creada, autenticado con el admin sembrado en Bucaramanga | 200, el horario se guarda para esa sede sin error 403 | ✅ Igual a lo esperado, confirma el criterio de permisos ya documentado (cualquier administrador gestiona cualquier sede) |

*Nota: el servicio, médico y sede creados durante esta validación (`pruebapa28@udes.edu.co`, "Sede Cúcuta (prueba PA-30)", etc.) se eliminaron de la base de datos después de la prueba.*

## Decisiones de alcance registradas

- **Horarios reemplazan la constante fija**: `backend/src/config/horarioAtencion.js` se eliminó; el módulo de citas ahora consulta `horario_atencion` por sede vía `horario.model.js`. Se verificó end-to-end que un cambio de horario por el admin afecta inmediatamente la disponibilidad de citas (PA-23).
- **Alcance de "agenda por sede" (RF-10)**: se interpretó como horarios de atención + especialidades de los médicos + seguimiento de citas de la sede, no como bloqueos de fechas puntuales (vacaciones, etc.) — no estaba en el RF/HU original, se puede agregar después si se pide.
- **Visibilidad de RF-12**: el administrador ve todas las citas de su propia sede; el veterinario ve únicamente las suyas. No hay una vista "todas las sedes" (no hay un rol de super-admin en el alcance actual).
- **Servicios se desactivan, no se eliminan**: por la relación con `cita.servicio_id` (integridad referencial), "eliminar" un servicio en realidad marca `activo = false`. La misma convención se extendió a médicos y sedes al ampliar el sistema de diseño (ver abajo): "Desactivar médico" y el toggle de sede activa/inactiva, nunca `DELETE`.

### Ampliación: sistema de diseño (mockups de interfaz)

A partir de una revisión de mockups de interfaz se amplió el alcance de este incremento más allá del restyle visual inicial:

- **Categorías de servicio y especialidades de médico son el mismo catálogo** (`categoria_servicio`): el mockup muestra ambas con el mismo componente visual (badge de color), así que se modeló como un solo concepto compartido en vez de dos tablas paralelas.
- **`precio` en servicios es un dato de catálogo, no facturación**: no hay registro de pagos, ingresos ni facturas en ningún lado del sistema; sigue vigente la restricción del alcance del proyecto sobre no manejar ingresos/facturación.
- **Gestión de sedes es global para cualquier administrador**, no restringida a "mi sede" — se verificó (PA-31) que esto ya era así para horarios antes de esta ampliación, así que extender sedes con el mismo criterio no introduce un precedente nuevo de permisos.
- **Médicos siguen restringidos a la sede del administrador que los gestiona** (403 si se intenta administrar un médico de otra sede) — a diferencia de sedes/horarios, este límite sí se mantuvo tal como ya existía.
- **Sin subida real de archivos**: no existe infraestructura de upload en el backend; `foto_url` (médicos y sedes) es un campo de texto opcional (URL), con avatar de iniciales como fallback en la interfaz.
- **Calendario/dashboard de rol médico (secciones del mockup fuera de este incremento)**: no se construyeron — no corresponden a ningún incremento planeado en el alcance del proyecto todavía.
