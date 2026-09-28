# Incremento 4 — Módulo de clientes: pruebas

## Contexto

Al llegar a este incremento, RF-15 (consultar citas), RF-08/RF-09 (reprogramar/cancelar) y RF-16 (ver servicios/sedes en el landing) ya estaban cubiertos por trabajo de incrementos anteriores. El único hueco real de RF-14 (registrar mascotas) era que un cliente solo podía agregar una mascota de forma inline al agendar una cita (`MascotaSelector.jsx`), sin una pantalla propia para verlas todas o editarlas. Este incremento cierra ese hueco y además rediseña `PanelClientePage.jsx` con el mismo lenguaje visual del panel administrativo (a pedido explícito de la autora), en vez del layout genérico que tenía antes.

## Pruebas unitarias

Ejecutadas con Jest + Supertest. Comando: `npm test` (dentro de `backend/`).

| Archivo | Casos nuevos cubiertos | Resultado |
|---|---|---|
| `mascota.controller.test.js` | Perfil completo de mascota (fecha de nacimiento, sexo, color, peso, características) al crear; rechaza un `sexo` fuera de `('macho','hembra')`; rechaza un `pesoKg` ≤ 0 | 17/17 ✅ (archivo completo, incluye los casos previos) |

**Total: 145/145 pruebas unitarias del backend pasando**, ejecutado 2026-09-26.

## Pruebas de aceptación (manuales, contra la API real y PostgreSQL local)

| ID | Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| PA-41 | Crear una mascota con el perfil completo (RF-14 ampliado) | `POST /api/mascotas` con nombre, especie, raza, fechaNacimiento, sexo, color, pesoKg, características, con token de un cliente real | 201, todos los campos guardados y devueltos | ✅ Igual a lo esperado |
| PA-42 | Listar mis mascotas | `GET /api/mascotas/mias` | 200, incluye la mascota creada en PA-41 con su perfil completo | ✅ Igual a lo esperado |
| PA-43 | Editar el peso y las características de una mascota propia | `PUT /api/mascotas/:id` con `pesoKg`/`caracteristicas` nuevos | 200, solo esos campos cambian, el resto se mantiene (`COALESCE`) | ✅ Igual a lo esperado |

*Nota: el usuario y la mascota de prueba (`prueba.mascotas.temp@correo.com`, mascota "Rocky") se eliminaron de la base de datos después de la validación.*

### Ampliación: estandarizar `<SidePanel/>` y enriquecer "Detalle de la cita" (a pedido explícito)

| ID | Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| PA-44 | `GET /api/citas/mias` incluye dirección/foto de sede, precio del servicio, especialidad del médico y perfil de la mascota (sexo, peso, color, fecha de nacimiento) | Token firmado para un cliente con una cita real ya sembrada | 200, todos los campos nuevos presentes (`sede_direccion`, `sede_foto_url`, `servicio_precio`, `medico_especialidad`, `mascota_sexo`, `mascota_peso_kg`, `mascota_color`, `mascota_fecha_nacimiento`) | ✅ Igual a lo esperado (verificado contra una cita real ya existente en la base local) |

### Ampliación: flujo de "Agendar cita" por pasos (RF-06/RF-07, a pedido explícito)

Pruebas unitarias nuevas (backend, 2026-09-27): asignación automática del médico (el libre con menos citas ese día; 409 si ninguno está libre; reintento con el siguiente candidato ante `23505`), correo de confirmación (la cita se crea aunque el SMTP falle, `correoEnviado=false`), `POST /api/citas/:id/reenviar-confirmacion` (403 si la cita es de otro cliente, 400 si está cancelada, 200, 502 si falla el SMTP), motivo de más de 255 caracteres (400), código de sede obligatorio/normalizado/único (400/409) y duración de servicio fuera de rango (400). **Total: 158/158 pruebas unitarias del backend pasando.**

| ID | Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| PA-45 | Migración `incremento_4b_agendamiento.sql` numera las citas existentes | Aplicar la migración en una transacción sobre la base local | Cada cita existente recibe `CV-{sede}-{año}-{00000}` en orden de creación y `consecutivo_cita` queda en el último número usado | ✅ La cita existente quedó `CV-BGA-2026-00001`, consecutivo BGA/2026 = 1 |
| PA-46 | `GET /api/sedes` con los campos nuevos | Sin token | Sede principal primero, `codigo`, `es_principal` y `servicios_ofrecidos` calculado | ✅ `[Bucaramanga, BGA, principal, 6]`, `[Valledupar, VUP, 9]` |
| PA-47 | Disponibilidad de la sede para el día siguiente | `GET /api/citas/disponibilidad` con token de un cliente real | 200, franjas del horario de la sede con `disponible` | ✅ 20 franjas, 1 médico que presta el servicio |
| PA-48 | Agendar **sin `medicoId`** (asignación automática) | `POST /api/citas` con sede, servicio, franja, mascota y motivo | 201, médico asignado, código consecutivo siguiente, `correoEnviado: true` | ✅ `CV-BGA-2026-00002`, médico asignado, correo recibido en la cuenta real de la cliente |
| PA-49 | Agendar la misma franja cuando ya no hay médicos libres | Repetir PA-48 | 409 "Ya no hay médicos disponibles en esa franja" | ✅ Igual a lo esperado |
| PA-50 | La franja ocupada deja de aparecer disponible | `GET /api/citas/disponibilidad` después de PA-48 | Esa franja con `disponible: false` | ✅ Igual a lo esperado |
| PA-51 | Reenviar el correo de confirmación | `POST /api/citas/:id/reenviar-confirmacion` | 200 y el correo llega de nuevo | ✅ Igual a lo esperado; con un id inexistente, 404 |

*Nota: la cita de prueba se eliminó y el consecutivo de BGA/2026 se devolvió a 1 después de la validación. En la base local ninguna sede tiene todavía dos médicos que presten el mismo servicio, así que el balanceo entre varios médicos se verificó con las pruebas unitarias, no contra la API real.*

## Decisiones de alcance registradas

- **Mascota sigue sin catálogo de especies/razas**: "Especie" es un `<select>` con opciones comunes (Canino, Felino, Ave, Otro) solo para agilizar la captura, pero se guarda en la misma columna de texto libre de siempre — no se creó una tabla de catálogo nueva, decisión ya tomada al modelar `mascota` en el incremento anterior. "Raza" sigue siendo texto libre, no un select dependiente de la especie: no hay ningún requerimiento que respalde mantener una taxonomía de razas por especie, y hacerlo hubiera significado inventar datos.
- **Sin foto real de mascota**: mismo motivo que médicos/sedes (ver incremento 3) — no hay infraestructura de subida de archivos en el proyecto. El campo `foto_url` sigue existiendo en el modelo (por si se llena a mano con una URL), pero no se construyó un botón de "cambiar foto"/cámara.
- **Estado de una cita en "Mis citas" es derivado, no una columna nueva**: la base de datos solo tiene `estado IN ('agendada', 'cancelada')`. "Próxima" vs "Completada" se calcula en el frontend comparando `fecha_hora` con la hora actual (mismo cálculo que ya usaba `esFutura` en el código anterior) — no se agregó una columna `completada` a `cita`.
- **"Ver detalles" de una cita pasa de expandirse inline a un `SidePanel`** (`DetalleCitaPanel.jsx`), reutilizando el mismo componente `SidePanel` del panel administrativo. `FilaCita.jsx` y `ListaCitas.jsx` se eliminaron: su lógica de reprogramar/cancelar se movió ahí.
- **`<SidePanel/>` se estandarizó en los 8 lugares donde se usa** (Servicios, Médicos, Horarios, Pacientes, Configuración, Citas del admin, Mis mascotas, Detalle de cita del cliente): pie de acciones fijo (prop `footer`, fuera del scroll del cuerpo), sombra más pronunciada, y el contenido de atrás queda `inert`/`aria-hidden` mientras el panel está abierto — nunca hubo un modal centrado con overlay oscuro en este proyecto, esa parte del pedido no aplicaba a la realidad del código.
- **"Detalle de la cita" se amplió con datos reales que no estaban en la consulta de "mis citas"**: dirección/foto de sede, precio del servicio, especialidad del médico, y el perfil de la mascota (sexo, peso, color, fecha de nacimiento) — todos existían en la base de datos pero no se traían. Se agregaron al `SELECT` de `cita.model.js#listarPorCliente` (la especialidad vía subconsulta escalar, porque un médico puede tener varias). **Se descartó explícitamente** el checklist "Recomendaciones para tu cita" (sería texto genérico inventado, sin fuente real) y el botón "Editar cita" (no existe esa capacidad — solo reprogramar/cancelar, que ya estaban construidos).
- **Campana de notificaciones sin badge numérico**: el patrón que ya usa el panel administrativo (`AdminHeader.jsx`) tampoco tiene un contador real — no hay backend de notificaciones todavía (RF-17/RF-18, incremento 5), así que no se inventó una cifra.
- **`KPICard` (componente compartido con el panel administrativo) se amplió con dos props opcionales** (`detalle`, una segunda línea bajo el valor; `onClick`, un botón circular de flecha) y una variante de color `pink` — ninguna cambia el comportamiento de los paneles administrativos que ya lo usan sin pasarlas.
- **Flujo de agendamiento de 5 hitos en 3 páginas** (`/agendar`): mascota+servicio, sede+fecha/hora y confirmación. El stepper resalta juntos todos los hitos de la página activa (el mockup resaltaba solo el primero; confirmado con la usuaria). Reemplaza al formulario en línea anterior (`FormularioAgendar.jsx`, eliminado). El calendario del administrador sigue igual.
- **Médico asignado automáticamente** (decidido con la usuaria): los mockups no tienen un paso de médico. Al confirmar, el backend toma entre los médicos activos de la sede que prestan el servicio y están libres en esa franja el que tenga menos citas activas ese día (desempate por nombre). `medicoId` sigue siendo opcional en `POST /api/citas`: el calendario del administrador lo envía explícito.
- **Código visible de la cita por sede y por año** (decidido con la usuaria): `CV-{código de sede}-{año}-{consecutivo de 5 dígitos}`, ej. `CV-BGA-2026-00045`. Cada sede tiene un código corto nuevo (`sede.codigo`, 2 a 5 letras, obligatorio y editable en Sedes) y el consecutivo vive en `consecutivo_cita (sede_id, anio, ultimo)`; se incrementa con un upsert atómico en la misma transacción que crea la cita, así no hay números repetidos ni huecos si la cita falla.
- **Correo de confirmación real** (decidido con la usuaria, adelanta la parte de confirmación de RF-17): se envía al agendar, con el mismo `correo.service.js` y la misma excepción documentada a "sin integraciones externas". Si el SMTP falla, la cita igual queda creada y la pantalla lo dice (no afirma "te enviamos un correo"). El **recordatorio de 24 horas antes (RF-18) no está construido**: en "¿Qué sigue?" aparece como pendiente y así se queda hasta el incremento 5.
- **Sede sugerida = la de la última cita del cliente** (decidido con la usuaria): no existía una "sede de preferencia" en el perfil del cliente (`usuario.sede_id` queda vacío a propósito para los clientes). Sin citas previas, el resumen muestra "Selecciona una sede".
- **Sin mapa embebido**: un mapa interactivo sería una integración externa nueva con API key. El recuadro de ubicación muestra la dirección y dos hipervínculos de salida a Google Maps ("Cómo llegar" / "Ver en Google Maps"), sin intercambio de datos.
- **Campos nuevos**: `servicio.duracion_minutos` (editable en Servicios, 5 a 480 min) es **informativa**: la agenda sigue en franjas fijas de 30 minutos, un servicio más largo no bloquea franjas adicionales. `sede.es_principal` (solo una, índice único parcial), `sede.tiene_parqueadero` y `sede.sala_pet_friendly` (las marca el administrador en Sedes; hasta que lo haga, la tarjeta no muestra esas amenidades). "Especialidades" en la tarjeta de sede es el número real de servicios que prestan sus médicos, no un texto escrito a mano.
- **`<SidePanel/>` ahora sí lleva overlay oscuro** (`bg-black/40`, clic afuera o Escape cierran), a pedido de la usuaria. Reemplaza la regla anterior de "sin overlay" y aplica a todos los paneles por estar en el componente compartido.
- **`StatusBadge`, versión final: Próxima en azul, Completada en verde y Cancelada en rojo.** La usuaria lo verificó por muestreo de píxeles sobre una captura limpia; se había invertido temporalmente por una instrucción basada en una captura oscurecida. El panel administrativo no usa esta paleta (pinta las citas por categoría de servicio).
- **Lista de "Mis citas" (especificación final)**: pestañas con icono y "+ Agendar nueva cita" a su altura; pills con conteo real; filas de 6 bloques (foto, mascota, fecha/hora, servicio/sede/médico, estado, "Ver detalles →"). La próxima cita más cercana lleva fondo y borde de acento permanentes (no es hover); si hay varias próximas, solo la más cercana.
- **Foto de mascota con editor propio** (`FotoMascotaModal.jsx`, el único modal centrado del sistema, por excepción explícita). El recorte, el zoom y la rotación se hacen en el navegador (`<canvas>`) y se sube un JPEG de 400×400. **Almacenamiento como en sistemas reales**, decidido con la usuaria: archivo en `backend/uploads/mascotas/` (nombre aleatorio) y la base de datos guarda solo la ruta. Se agregó `multer` al backend (dependencia nueva). Límite de 5 MB, solo JPG/PNG. Al reemplazar una foto se borra la anterior del disco. Las miniaturas del editor son las fotos de las otras mascotas del cliente: no existe un historial de fotos.
- **Especie y raza obligatorias** (decidido con la usuaria), también para el administrador. La raza es una lista según la especie (`utils/razas.js`): perros, gatos y aves con "Criollo / mestizo" y "No sé la raza"; "Otro" es texto libre. Es un catálogo estático del frontend, no una tabla, y se guarda el mismo texto de siempre, así que las razas escritas a mano antes (ej. "French poodle") se conservan como opción al editar.
- **Información médica (opcional)**: alergias, medicamentos, condiciones médicas y observaciones, en texto libre informado por el dueño (migración `incremento_4d`). Se aprobó con la usuaria como excepción acotada a "sin historial clínico": no hay registros por fecha, ni diagnósticos, ni tratamientos del veterinario.
- **"Editar cita" no se quitó porque nunca existió**: ya se había descartado al construir el Detalle de la cita. Tampoco existen "Ver en mapa" ni "Ver perfil" del médico que menciona el documento; no se agregaron.

| ID | Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| PA-52 | Crear mascota sin raza | `POST /api/mascotas` con nombre y especie | 400 | ✅ 400 |
| PA-53 | Crear mascota con perfil completo e info médica | nombre, especie, raza, alergias | 201, `alergias` guardada | ✅ Igual a lo esperado |
| PA-54 | Subir foto (PNG) de una mascota propia | `POST /api/mascotas/:id/foto` multipart | 200, `foto_url = /uploads/mascotas/<uuid>.png` y el archivo se sirve con `image/png` | ✅ Igual a lo esperado |
| PA-55 | Reemplazar la foto | Segunda subida a la misma mascota | 200 y el archivo anterior se borra del disco | ✅ Igual a lo esperado |
| PA-56 | Rechazar archivo inválido | `.txt` / PNG de 6 MB | 400 en ambos, sin archivos sobrantes en disco | ✅ Igual a lo esperado |
| PA-57 | No dejar vaciar la raza al editar | `PUT /api/mascotas/:id` con `raza: ''` | 400 | ✅ 400 |

*Nota: la mascota temporal y sus fotos se borraron después de la validación. Pruebas unitarias del backend: 171/171.*
- **Tab "Mascota(s)" del Detalle del paciente (admin), rediseñado**: tarjetas con foto, especie · raza, sexo | edad · peso y menú ⋮ (Editar / Eliminar). Editar carga la mascota en el mismo formulario embebido; Eliminar confirma dentro de la tarjeta. El formulario "Agregar mascota" va embebido en el tab (no es otro panel) y tiene una zona de foto cuadrada punteada que sube el archivo tal cual, sin el editor circular del cliente. Sexo es un segmented control nuevo (`SelectorSexo.jsx`, reutilizable) y es **obligatorio solo en este formulario**; en el backend y en el formulario del cliente sigue siendo opcional. No lleva "Información médica" (no aparece en la referencia de este módulo). **El administrador ahora también puede eliminar mascotas** (antes solo el dueño), con la misma regla: 409 si tiene citas agendadas a futuro. Verificado contra la API real: el admin crea y elimina una mascota temporal (201/200); pruebas unitarias 172/172.
