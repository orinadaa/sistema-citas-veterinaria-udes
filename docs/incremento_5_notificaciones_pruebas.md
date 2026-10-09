# Incremento 5 — Notificaciones (RF-17, RF-18)

## Qué hace

**La campana.** En la píldora del cliente y del médico. El administrador de
sede y el superadministrador no tienen notificaciones (decisión de Oriana): ni
campana en su panel ni avisos, y el servidor les niega la ruta. Muestra el número de avisos sin leer y, al pulsarla,
las últimas 30 notificaciones. Pulsar una la marca como leída y lleva a donde
corresponde; "Marcar todas como leídas" limpia el contador. Se actualiza sola
cada minuto.

**Qué genera un aviso y a quién.**

| Evento | Cliente | Médico de la cita |
|---|---|---|
| Cita agendada | Sí | Sí |
| Cita reprogramada | Sí | Sí |
| Cita cancelada | Sí | Sí |
| Mascota registrada (por él o por la clínica) | Sí | — |
| Recordatorio creado por el médico | Sí | — |
| Recordatorio previo a la cita (24 horas antes) | Sí, y por correo | — |

Quien hace la acción no recibe su propio aviso, salvo el cliente, que siempre
ve el registro de sus citas y mascotas.

**Recordatorio automático (RF-18).** El servidor revisa al arrancar y cada 10
minutos las citas activas que empiezan en las próximas 24 horas y aún no
tienen recordatorio: crea el aviso en la campana del cliente y le envía un
correo. `cita.recordatorio_enviado_en` evita repetirlo; al reprogramar la cita
se reinicia. A los correos de ejemplo (`@demo.udes.co`) no se les envía correo.

**Confirmación (RF-17).** El correo de confirmación al agendar ya existía; se
suma el aviso en la campana.

## Piezas

- `database/incremento_11a_notificaciones.sql`: tabla `notificacion` y columna
  `cita.recordatorio_enviado_en`.
- `backend/src/models/notificacion.model.js`, `services/notificaciones.service.js`,
  `routes/notificacion.routes.js` (`/api/notificaciones`).
- `frontend/src/components/layout/Notificaciones.jsx`.

Un aviso que no se puede guardar nunca hace fallar la acción que lo originó.

## Pruebas

Unitarias: `backend/tests/notificaciones.test.js` (18). Total del servidor: 380.

| Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| La campana exige sesión | `GET /api/notificaciones` sin token | 401 | Correcto |
| Solo las propias | Listar; marcar una de otro usuario; id inválido | Las del usuario; 404; 404 | Correcto |
| Marcar todas | `PATCH /api/notificaciones/leidas` | 204, contador en 0 | Correcto |
| Cita agendada por el cliente | Servicio | 2 avisos: cliente y médico | Correcto |
| Sin notificaciones para administración | `GET /api/notificaciones` como administrador o superadministrador | 403 | Correcto |
| Cita agendada por el médico o un administrador | Servicio | El médico no se avisa a sí mismo; el administrador nunca recibe aviso | Correcto |
| Reprogramada | Servicio | El aviso dice de qué fecha a qué fecha | Correcto |
| Fallo al guardar un aviso | Modelo que falla | La acción no se rompe | Correcto |
| Recordatorio previo | Citas de las próximas 24 h | Aviso y correo; no repite | Correcto |
| Correo de ejemplo | Cliente `@demo.udes.co` | Aviso sí, correo no | Correcto |
| Correo que falla | SMTP con error | El aviso queda y sigue con las demás | Correcto |

Aceptación sobre la base real, con un cliente, una mascota y una cita
temporales "ZZ" que se borraron al terminar:

| Descripción | Resultado obtenido |
|---|---|
| Migración 11a | Aplicada; citas, cuentas y mascotas sin cambios |
| Avisos de mascota registrada y de cita agendada, reprogramada y cancelada | 10 avisos, a cliente, médico y administrador de la sede, con sus enlaces |
| Campana por la API | Lista 4, marca una (3 sin leer), marca todas (0) |
| Recordatorio previo | Primera pasada toma las citas de las próximas 24 h; la segunda, ninguna |
| Campana en el navegador | Cliente de ejemplo con 3 sin leer: contador, lista y cierre con Escape. Administrador sin avisos: mensaje de vacío |

No probado: la llegada real del correo de recordatorio, y pulsar un aviso en
el navegador (solo se abrió la lista, para no cambiar datos).
