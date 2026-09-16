# Incremento 2 — Módulo de gestión de citas: pruebas

## Pruebas unitarias

Ejecutadas con Jest + Supertest, con los modelos de datos (`cita.model.js`, `sede.model.js`) mockeados. `horarioAtencion.js` se prueba con su lógica real (no depende de PostgreSQL). Comando: `npm test` (dentro de `backend/`).

| Archivo | Casos cubiertos | Resultado |
|---|---|---|
| `horarioAtencion.test.js` | Domingo sin franjas, franjas de entre semana (08:00–16:30, cada 30 min), franjas de sábado (08:00–11:30), separación exacta entre franjas | 4/4 ✅ |
| `cita.controller.test.js` | RF-07: disponibilidad sin médicos para el servicio, franja ocupada por todos los médicos, disponibilidad acotada a un solo médico (usada al reprogramar), médicos libres en una franja exacta. RF-06: campos obligatorios, médico que no presta el servicio, fecha en el pasado, franja ya ocupada por ese médico, agendamiento exitoso. RF-08: cita inexistente, cita de otro cliente, cita ya cancelada, reprogramación validando conflicto contra el mismo médico. RF-09: cita de otro cliente, cancelación exitosa. Control de acceso: rol administrador no puede usar `/api/citas/*` | 16/16 ✅ |

**Total: 46/46 pruebas unitarias del backend pasando** (incluye las 23 del incremento 1), ejecutado 2026-09-16.

## Pruebas de aceptación (manuales, contra la API real y PostgreSQL local)

| ID | Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| PA-09 | Consultar disponibilidad de una sede en una fecha futura (sábado) | `GET /api/citas/disponibilidad?sedeId=...&fecha=2026-09-26` con token de cliente | 200, franjas de 08:00 a 11:30 (hora local), todas `disponible: true` | ✅ Igual a lo esperado |
| PA-10 | Agendar una cita en una franja disponible (RF-06) | `POST /api/citas` con sede, fecha/hora válida y nombre de mascota | 201, cita creada con `estado: agendada` | ✅ Igual a lo esperado |
| PA-11 | Intentar agendar dos citas en la misma franja y sede | Repetir PA-10 con los mismos datos | 409, "Esa franja ya fue reservada" | ✅ Igual a lo esperado |
| PA-12 | Listar mis citas (necesario para reprogramar/cancelar desde el frontend) | `GET /api/citas/mias` | 200, incluye la cita creada en PA-10 con nombre y ciudad de la sede | ✅ Igual a lo esperado |
| PA-13 | Reprogramar una cita propia a otra franja libre (RF-08) | `PATCH /api/citas/:id/reprogramar` con `nuevaFechaHora` válida | 200, `fecha_hora` actualizada, mismo `id` | ✅ Igual a lo esperado |
| PA-14 | Cancelar una cita propia (RF-09) | `PATCH /api/citas/:id/cancelar` | 200, `estado: cancelada` | ✅ Igual a lo esperado |
| PA-15 | Reprogramar una cita ya cancelada | `PATCH /api/citas/:id/reprogramar` sobre la cita de PA-14 | 400, "Solo se pueden reprogramar citas activas" | ✅ Igual a lo esperado |

*Nota: los usuarios y citas de prueba (`pruebacitas@test.com`, `pruebacitas2@test.com`, `pruebacitas3@test.com`) se eliminaron de la base de datos después de cada validación.*

## Ampliación: servicio y médico (retroalimentación de la usuaria, 2026-09-16)

A partir de la revisión de las publicaciones oficiales de la clínica (`identidadmarca/`), se agregó el catálogo real de servicios (Consulta médica, Vacunación, Desparasitación, Profilaxis dental, Laboratorio clínico, Radiología, Cirugía, Oncología, Endoscopia) y la posibilidad de elegir médico. Pruebas adicionales:

| ID | Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| PA-16 | Consultar disponibilidad filtrando por sede y servicio | `GET /api/citas/disponibilidad?sedeId=...&servicioId=...&fecha=...` | 200, `medicosDisponiblesEnSede` > 0, franjas coherentes con el horario del médico sembrado | ✅ Igual a lo esperado |
| PA-17 | Consultar médicos libres en una franja específica | `GET /api/citas/medicos-disponibles?sedeId=...&servicioId=...&fechaHora=...` | 200, devuelve el médico sembrado que presta ese servicio en esa sede | ✅ Igual a lo esperado |
| PA-18 | Agendar una cita indicando servicio y médico (RF-06 ampliado) | `POST /api/citas` con `servicioId` y `medicoId` | 201, cita con `servicio_id` y `medico_id` guardados | ✅ Igual a lo esperado |
| PA-19 | Dos clientes intentan agendar el mismo médico en la misma franja | Repetir PA-18 con otro cliente, mismo médico y hora | 409, "Ese médico ya tiene una cita en esa franja" | ✅ Igual a lo esperado |
| PA-20 | `GET /api/citas/mias` incluye nombre del servicio y del médico | — | 200, `servicio_nombre` y `medico_nombre` presentes | ✅ Igual a lo esperado |

## Decisiones de alcance registradas

- **Disponibilidad sin módulo administrativo todavía**: el horario de atención (RF-13, incremento 3) no existe como configuración en base de datos aún. Se generan franjas de 30 minutos a partir de una constante compartida (`backend/src/config/horarioAtencion.js`), igual al horario ya publicado en la landing. Cuando el incremento 3 permita configurar horarios por sede, este módulo deberá leer esa configuración en vez de la constante.
- **Mascota como texto libre**: `cita.nombre_mascota` es un campo de texto simple; no existe todavía una tabla `mascota` (RF-14 es del incremento 4). Se documenta como deuda técnica intencional a resolver cuando exista el módulo de clientes.
- **Médicos y especialidades sembrados por script, no por UI**: `servicio_medico` (qué médico presta qué servicio) no tiene panel de administración todavía — eso es RF-11/RF-10 del incremento 3. Mientras tanto se siembra con `npm run seed:veterinarios` (4 veterinarios de ejemplo, 2 por sede), igual que el admin se creó con `seed:admin` en el incremento 1.
- **Restricción de no-doble-reserva por médico, no por sede**: se corrigió de `(sede_id, fecha_hora)` a `(medico_id, fecha_hora)`, porque varios médicos sí pueden atender en la misma sede a la misma hora; uno solo no puede estar en dos citas activas a la vez.
- **Pendiente declarado por la usuaria**: el formulario de agendar necesitará más adelante un cuestionario más completo (preguntas adicionales aún sin definir), más allá de nombre de mascota y motivo.
