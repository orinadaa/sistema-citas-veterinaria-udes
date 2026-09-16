# Incremento 2 — Módulo de gestión de citas: pruebas

## Pruebas unitarias

Ejecutadas con Jest + Supertest, con los modelos de datos (`cita.model.js`, `sede.model.js`) mockeados. `horarioAtencion.js` se prueba con su lógica real (no depende de PostgreSQL). Comando: `npm test` (dentro de `backend/`).

| Archivo | Casos cubiertos | Resultado |
|---|---|---|
| `horarioAtencion.test.js` | Domingo sin franjas, franjas de entre semana (08:00–16:30, cada 30 min), franjas de sábado (08:00–11:30), separación exacta entre franjas | 4/4 ✅ |
| `cita.controller.test.js` | RF-07: disponibilidad sin parámetros, sede inexistente, franja marcada ocupada. RF-06: campos obligatorios, fecha en el pasado, franja no alineada al horario, franja ya ocupada, agendamiento exitoso. RF-08: cita inexistente, cita de otro cliente, cita ya cancelada, reprogramación exitosa. RF-09: cita de otro cliente, cancelación exitosa. Control de acceso: rol administrador no puede usar `/api/citas/*` | 14/14 ✅ |

**Total: 42/42 pruebas unitarias del backend pasando** (incluye las 23 del incremento 1), ejecutado 2026-09-15.

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

*Nota: el usuario y la cita de prueba (`pruebacitas@test.com`) se eliminaron de la base de datos después de la validación.*

## Decisiones de alcance registradas

- **Disponibilidad sin módulo administrativo todavía**: el horario de atención (RF-13, incremento 3) no existe como configuración en base de datos aún. Se generan franjas de 30 minutos a partir de una constante compartida (`backend/src/config/horarioAtencion.js`), igual al horario ya publicado en la landing. Cuando el incremento 3 permita configurar horarios por sede, este módulo deberá leer esa configuración en vez de la constante.
- **Mascota como texto libre**: `cita.nombre_mascota` es un campo de texto simple; no existe todavía una tabla `mascota` (RF-14 es del incremento 4). Se documenta como deuda técnica intencional a resolver cuando exista el módulo de clientes.
