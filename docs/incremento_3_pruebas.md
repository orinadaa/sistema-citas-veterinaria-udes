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

## Pruebas de aceptación (manuales, contra la API real y PostgreSQL local)

| ID | Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| PA-21 | Consultar horario público de una sede | `GET /api/horarios?sedeId=...` sin token | 200, 6 días configurados (domingo cerrado) | ✅ Igual a lo esperado |
| PA-22 | Admin lista los médicos de su sede con sus especialidades | `GET /api/administracion/medicos` | 200, incluye los veterinarios sembrados y sus servicios | ✅ Igual a lo esperado |
| PA-23 | Admin actualiza el horario de un día y el cambio se refleja en disponibilidad de citas | `PUT /api/horarios` (lunes 09:00–18:00) → `GET /api/citas/disponibilidad` para ese lunes | 200, primera franja disponible a las 09:00 local (antes 08:00) | ✅ Igual a lo esperado, confirma que el refactor de horarios funciona end-to-end |
| PA-24 | Admin crea un servicio nuevo | `POST /api/servicios` | 201, servicio creado con `activo: true` | ✅ Igual a lo esperado |
| PA-25 | Admin ve el seguimiento de citas de su sede (RF-12) | `GET /api/administracion/citas` | 200, incluye la cita real de prueba de la usuaria en esa sede | ✅ Igual a lo esperado |

*Nota: el usuario y horario modificados durante la validación (`pruebainc3@test.com`, horario del lunes) se revirtieron/eliminaron después de la prueba.*

## Decisiones de alcance registradas

- **Horarios reemplazan la constante fija**: `backend/src/config/horarioAtencion.js` se eliminó; el módulo de citas ahora consulta `horario_atencion` por sede vía `horario.model.js`. Se verificó end-to-end que un cambio de horario por el admin afecta inmediatamente la disponibilidad de citas (PA-23).
- **Alcance de "agenda por sede" (RF-10)**: se interpretó como horarios de atención + especialidades de los médicos + seguimiento de citas de la sede, no como bloqueos de fechas puntuales (vacaciones, etc.) — no estaba en el RF/HU original, se puede agregar después si se pide.
- **Visibilidad de RF-12**: el administrador ve todas las citas de su propia sede; el veterinario ve únicamente las suyas. No hay una vista "todas las sedes" (no hay un rol de super-admin en el alcance actual).
- **Servicios se desactivan, no se eliminan**: por la relación con `cita.servicio_id` (integridad referencial), "eliminar" un servicio en realidad marca `activo = false`.
