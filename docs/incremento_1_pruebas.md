# Incremento 1 — Módulo de usuarios y autenticación: pruebas

## Pruebas unitarias

Ejecutadas con Jest + Supertest, con el modelo de datos (`usuario.model.js`) mockeado para que no dependan de PostgreSQL. Ubicación: `backend/tests/`. Comando: `npm test` (dentro de `backend/`).

| Archivo | Casos cubiertos | Resultado |
|---|---|---|
| `auth.middleware.test.js` | Rechazo sin token, token inválido, token válido; rol no permitido (403), rol permitido (next) | 5/5 ✅ |
| `auth.controller.test.js` | RF-01: campos obligatorios, formato de correo, longitud de contraseña, correo duplicado (409), registro exitoso (201+token). RF-02: correo inexistente (401), contraseña incorrecta (401), cuenta inactiva (401), login exitoso (200+token) | 9/9 ✅ |
| `usuario.controller.test.js` | RF-04/RF-05: acceso sin token (401), acceso con rol cliente (403), acceso con rol administrador (200); creación de personal (rechaza rol "cliente", crea veterinario); cambio de rol (rol inválido, sede obligatoria, usuario inexistente, actualización exitosa) | 9/9 ✅ |

**Total: 23/23 pruebas unitarias pasando** (ejecutado 2026-09-14).

## Pruebas de aceptación (manuales, contra la API real y PostgreSQL local)

| ID | Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| PA-01 | Login con la cuenta de administrador sembrada por `npm run seed:admin` | `POST /api/auth/login` `{correo: admin@udes.edu.co, contrasena: CambiarEsta123}` | 200, devuelve `usuario` con `rol: administrador` y un `token` JWT | ✅ Igual a lo esperado |
| PA-02 | Registro autoservicio de un cliente nuevo (RF-01) | `POST /api/auth/registro` con nombre, correo y contraseña válidos | 201, `usuario.rol = cliente`, `usuario.sedeId = null`, incluye `token` | ✅ Igual a lo esperado |
| PA-03 | Registro con correo ya existente | Mismo correo del caso PA-02 | 409, mensaje "Ya existe una cuenta registrada con este correo." | ✅ Igual a lo esperado |
| PA-04 | Consulta pública de sedes sin autenticación (RF-03) | `GET /api/sedes` sin token | 200, lista con Bucaramanga y Valledupar | ✅ Igual a lo esperado |
| PA-05 | Acceso a `/api/usuarios` sin token (RF-05/RNF-04) | `GET /api/usuarios` sin header `Authorization` | 401 | ✅ Igual a lo esperado |
| PA-06 | Acceso a `/api/usuarios` con token de rol cliente | `GET /api/usuarios` con token de cliente | 403 | ✅ Igual a lo esperado |
| PA-07 | Acceso a `/api/usuarios` con token de rol administrador | `GET /api/usuarios` con token de admin | 200, lista de usuarios registrados | ✅ Igual a lo esperado |
| PA-08 | Consulta de perfil propio autenticado | `GET /api/auth/perfil` con token de cliente | 200, datos del propio usuario (sin `contrasena_hash`) | ✅ Igual a lo esperado |

*Nota: el usuario de prueba `cliente1@test.com` creado durante PA-02/PA-03 se eliminó de la base de datos después de la validación (no forma parte de los datos semilla del sistema).*

## Pendiente para incrementos posteriores

- Pruebas de aceptación con usuario real (no solo el desarrollador) — se ejecutarán al integrar el frontend, conforme a RNF-05 y al objetivo específico de evaluación con usuarios reales.
- Endpoint de cambio de contraseña propia (no estaba en el alcance de RF-01/RF-02, se evaluará si se requiere).
