# Módulo del médico veterinario: pruebas y decisiones

## Contexto

Antes de este módulo el veterinario entraba al panel del administrador y solo veía la sección "Citas", filtrada a las suyas. Ahora tiene un panel propio con el mismo layout (sidebar con degradado de marca, header y SidePanel), con tres secciones: **Mis citas**, **Mis pacientes** y **Mi perfil** (con Información personal, Información profesional y Disponibilidad).

Migraciones nuevas: `incremento_5a_recordatorios.sql`, `incremento_5b_perfil_medico.sql` y `incremento_5c_disponibilidad_medico.sql`.

## Decisiones de alcance registradas

- **Sidebar sin "variante navy"**: el médico usa el mismo degradado del admin; lo diferencia el conjunto de ítems.
- **Colores de categoría**: mandan los guardados en la base de datos (los mismos del calendario del admin), no los del mockup (decisión de la usuaria).
- **El médico sí agenda a nombre de un cliente** (cambio de decisión confirmado). La cita queda **siempre con él y en su sede**: el backend lo fuerza e ignora otros valores. El paso de fecha y hora usa el mismo calendario con horas libres de `/agendar`, filtrado a la disponibilidad de ese médico, y no un input libre. "Notas adicionales" se guarda como el motivo de la cita.
- **Sin "+ Agregar paciente"**: el médico no crea cuentas de cliente (decisión de la usuaria). Solo **agrega mascotas** a un paciente existente, para el caso de la mascota que llega en plena consulta, y edita datos de mascotas; **no las elimina** (eso es exclusivo del dueño).
- **"Paciente" del médico** = dueño con al menos una cita, pasada o futura, con él. El detalle de un cliente que no es su paciente responde 403. Los datos del dueño son de solo lectura.
- **Recordatorios**: tabla nueva `recordatorio` (tipo, título, descripción, fecha, hora, mascota, dueño, médico). Al crearlo **se envía un correo al dueño** (decisión de la usuaria). El envío automático el día del recordatorio queda para el módulo de notificaciones.
- **Mi perfil**: el médico edita nombre, teléfono, dirección, foto (mismo editor de fotos de mascota, archivo en `uploads/usuarios/`), títulos, registro profesional, años de experiencia y biografía. **Especialidades, servicios y sede son de solo lectura** (los asigna el administrador). Se quitaron formación académica, certificaciones y documentos (fuera de este incremento).
- **Cambio de correo verificado** (decisión de la usuaria): se envía un código de 6 dígitos **al correo nuevo**, con 15 minutos de vigencia y máximo 5 intentos. El correo de la cuenta solo cambia al confirmar el código (tabla `verificacion_correo`).
- **Disponibilidad: opción A** (aprobada por la usuaria entre tres opciones):
  - `horario_medico`: por día, sede, desde/hasta y pausa opcional. Así un médico puede atender en sedes distintas en días distintos (multisede); `usuario.sede_id` queda como su sede principal.
  - `bloqueo_medico`: rango de fechas, de día completo o solo unas horas, con motivo.
  - **Sin horario propio, el médico sigue atendiendo en su sede con el horario de la sede**, así que nada de lo existente cambió.
  - Las franjas que se ofrecen siguen saliendo del horario de la sede; el horario propio debe caber dentro de él y solo las restringe.
  - La disponibilidad, la asignación automática, el selector de médicos del admin, agendar con médico explícito y reprogramar respetan horario, pausa y bloqueos.
  - Las citas ya agendadas dentro de un bloqueo **no se cancelan solas**: al crear el bloqueo se avisa cuántas hay.
  - "Sedes en las que atiendes" y "Sedes asignadas" se deducen del horario, no son una configuración aparte.
- **Buscador del header (médico)**: busca entre sus pacientes (dueños y mascotas) y lleva a "Mis pacientes". No busca servicios.

## Pruebas unitarias

219/219 pruebas del backend pasando, entre ellas las nuevas de:
- `medico.controller.test.js`: buscador de clientes, servicios propios, KPIs de pacientes, detalle con 403 y recordatorios.
- `perfilMedico.controller.test.js`: edición parcial, campos de solo lectura, contraseña y cambio de correo verificado.
- `disponibilidadMedico.test.js`: lógica pura de horario, pausa, sede y bloqueos.
- `disponibilidadMedico.controller.test.js`: horario dentro del de la sede, pausas y bloqueos.
- `cita.controller.test.js`: el médico agenda solo consigo mismo; el horario propio restringe franjas y citas.
- `mascota.controller.test.js`: el médico agrega o edita mascotas solo de sus pacientes.

## Pruebas de aceptación (contra la API real y PostgreSQL local)

| ID | Descripción | Resultado obtenido |
|---|---|---|
| PA-58 | Las citas del médico traen foto y perfil de la mascota, correo del dueño y sede | ✅ |
| PA-59 | El médico busca un cliente, lista sus servicios, consulta su propia disponibilidad y agenda | ✅ 201, la cita queda con él (código consecutivo de su sede) |
| PA-60 | Mis pacientes: lista y KPIs reales; otro médico sin citas con ese cliente recibe 403 en el detalle | ✅ |
| PA-61 | El médico agrega una mascota a su paciente (201) y no puede eliminarla (403) | ✅ |
| PA-62 | Crear un recordatorio: 201, correo enviado al dueño, aparece en la lista de la mascota | ✅ |
| PA-63 | Perfil: GET/PUT parcial, subir foto, contraseña actual incorrecta (400), correo ya usado (409), confirmar sin solicitud (400) | ✅ |
| PA-64 | Horario fuera del horario de la sede → 400 con el rango permitido | ✅ |
| PA-65 | Con horario de solo lunes 9:00–10:00: el lunes ofrece 9:00 y 9:30; el martes, ninguna ("ningún médico lo atiende ese día") | ✅ |
| PA-66 | Bloqueo del lunes 9:00–9:30: solo queda 9:30 | ✅ |

*Nota: todos los datos de prueba (citas, mascotas, recordatorios, horario, bloqueos y cambios de perfil) se borraron o restauraron después de cada validación. Las pruebas que envían correo (confirmación de cita y recordatorio) llegaron a la cuenta real de la usuaria.*
