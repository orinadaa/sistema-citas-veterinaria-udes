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

### Ampliación: calendario de citas en el panel administrativo

| Archivo | Casos cubiertos | Resultado |
|---|---|---|
| `cita.controller.test.js` (ampliado) | `POST /citas` ahora acepta al administrador: rechaza sin `clienteId`, responde 404 si `clienteId` no es un cliente, agenda en la sede del administrador con el cliente indicado; control de acceso actualizado: administrador puede consultar disponibilidad/médicos-disponibles, pero sigue sin poder ver "mis citas", reprogramar ni cancelar (siguen siendo exclusivas del cliente dueño) | 25/25 ✅ |
| `usuario.controller.test.js` (ampliado) | `GET /usuarios?rol=cliente` filtra correctamente; `?rol=` inválido responde 400 | 11/11 ✅ |

**Total: 102/102 pruebas unitarias del backend pasando**, ejecutado 2026-09-23.

### Ampliación: landing dinámico, mascotas/pacientes, configuración y reportes

| Archivo | Casos cubiertos | Resultado |
|---|---|---|
| `sede.controller.test.js` (ampliado) | `GET /sedes` confirma que solo llama al modelo público (no `listarTodasAdmin`); `GET /sedes/admin` rechaza cliente, devuelve todas incluidas las inactivas | 8/8 ✅ |
| `cita.controller.test.js` (ampliado) | `nombreMascota` reemplazado por `mascotaId` en todos los casos; nuevo caso 404 si la mascota no existe o no es del cliente (cliente y administrador) | 27/27 ✅ |
| `mascota.controller.test.js` (nuevo) | `GET /mascotas/mias` exclusivo de cliente; `GET /mascotas?clienteId=` exclusivo de administrador; `POST /mascotas` (cliente crea la propia, administrador exige y valida `clienteId`); `PUT /mascotas/:id` (404, 403 si no es del dueño, administrador puede editar cualquiera) | 14/14 ✅ |
| `administracion.controller.test.js` (ampliado) | `GET /pacientes` rechaza veterinario, devuelve lista + citas del mes; `GET /pacientes/:id` 404 si no es cliente, devuelve cliente+mascotas+citas | 24/24 ✅ |
| `usuario.controller.test.js` (ampliado) | Nuevo `PATCH /usuarios/:id`: actualiza activo/teléfono, responde 404 si no existe, **rechaza que un administrador se desactive a sí mismo** | 14/14 ✅ |
| `reportes.controller.test.js` (nuevo) | Rechaza veterinario; rechaza `desde` posterior a `hasta`; responde con rango por defecto (últimas 8 semanas) cuando no se indica; pasa el `sedeId` a los modelos que lo aceptan | 4/4 ✅ |

**Total: 131/131 pruebas unitarias del backend pasando**, ejecutado 2026-09-23.

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

### Ampliación: calendario de citas en el panel administrativo

| ID | Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| PA-32 | Admin consulta disponibilidad para agendar en nombre de un cliente | `GET /api/citas/disponibilidad` con el `sedeId` del admin, autenticado como administrador (antes exclusivo de cliente) | 200, franjas disponibles calculadas igual que para un cliente | ✅ Igual a lo esperado |
| PA-33 | Admin agenda una cita en nombre de un cliente real | `POST /api/citas` con `clienteId` de un cliente existente, `servicioId`, `medicoId` y `fechaHora` válidos, sin enviar `sedeId` | 201, cita creada con `sede_id` igual a la del administrador (no la que se hubiera enviado) y `cliente_id` igual al cliente indicado | ✅ Igual a lo esperado |
| PA-34 | La cita creada aparece en el seguimiento con la categoría del servicio | `GET /api/administracion/citas` tras PA-33 | 200, la fila incluye `categoria_nombre: "Consulta"` y `categoria_color: "blue"` (para pintar la tarjeta del calendario) | ✅ Igual a lo esperado |

*Nota: la cita de prueba ("Firulais (prueba calendario)") creada sobre la cuenta cliente real existente en la base de datos local se eliminó después de la prueba.*

### Ampliación: landing dinámico, mascotas/pacientes, configuración y reportes

| ID | Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| PA-35 | El catálogo de mascotas migró sin pérdida de datos (backfill) | `GET /api/mascotas?clienteId=...` para el cliente real existente, después de correr la migración | 200, aparece una mascota "Luna" (la que antes era texto libre en la cita real) | ✅ Igual a lo esperado |
| PA-36 | Admin crea una mascota nueva para un cliente y agenda una cita con ella | `POST /api/mascotas` con `clienteId` → `POST /api/citas` con ese `mascotaId` | 201 en ambos; la cita en `GET /api/administracion/citas` trae `mascota_nombre`, `mascota_especie`, `mascota_raza` | ✅ Igual a lo esperado |
| PA-37 | Listar pacientes (clientes con resumen de mascotas/citas) | `GET /api/administracion/pacientes` | 200, incluye al cliente real con `mascotas_total`, `citas_total`, `ultima_cita` y `citasDelMes` | ✅ Igual a lo esperado |
| PA-38 | Configuración crea un usuario de personal y lo desactiva con el PATCH genérico | `POST /api/usuarios` (rol veterinario) → `PATCH /api/usuarios/:id` con `activo:false` | 201 y luego 200 con `activo:false` | ✅ Igual a lo esperado |
| PA-39 | Un administrador no puede desactivarse a sí mismo | `PATCH /api/usuarios/:id` con el id del propio token, `activo:false` | 400, "No puedes desactivar tu propia cuenta." | ✅ Igual a lo esperado |
| PA-40 | Reportes: el filtro de sede afecta a los KPIs pero no al gráfico comparativo de sedes | `GET /api/administracion/reportes?sedeId=...` (sede con 2 de los 4 médicos) | `medicosActivos` baja de 4 (todas las sedes) a 2 (solo esa sede); `citasPorSede` sigue mostrando todas las sedes | ✅ Igual a lo esperado, confirma la decisión de diseño documentada abajo |

*Nota: el usuario de personal (`pruebaconfig@udes.edu.co`) y la mascota/cita de prueba creadas durante esta validación se eliminaron después de la prueba; el cliente real se dejó reactivado (`activo:true`) tal como estaba antes de PA-39.*

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
- **Dashboard de rol médico (sección 4.2 del mockup) sigue fuera de este incremento**: no se construyó — no corresponde a ningún incremento planeado en el alcance del proyecto todavía. El calendario (sección 4.1) sí se construyó a pedido explícito posterior (ver abajo).

### Ampliación: calendario de citas (a pedido explícito, tras el sistema de diseño)

- **La vista de calendario reemplaza la tabla de "Seguimiento de citas"**, no conviven ambas — se mantiene un solo componente (`PanelCitasSeguimiento.jsx`) para no duplicar lógica de carga.
- **El administrador ahora puede agendar citas desde el panel** ("+ Nueva cita"), algo que antes era exclusivo del cliente (RF-06). Esto amplió el backend: `POST /citas`, `GET /citas/disponibilidad` y `GET /citas/medicos-disponibles` aceptan también al rol administrador; `clienteId` es obligatorio y se valida que sea una cuenta con `rol = 'cliente'`; `sedeId` se fija a la sede del administrador (ignora cualquier otro valor recibido).
- **Reprogramar y cancelar NO se ampliaron**: siguen siendo exclusivas del cliente dueño de la cita (RF-08/RF-09). El detalle de una cita en el calendario del admin es de solo lectura.
- **El veterinario ve el mismo calendario pero sin "+ Nueva cita"**: solo sus propias citas, de solo lectura — no se amplió RF-12 más allá de lo que ya existía (podía consultar, ahora además lo hace en formato calendario).
- **Sin selector de médico para el administrador**: el calendario muestra todas las citas de la sede mezcladas, diferenciadas por color de categoría del servicio y, en la tarjeta, el nombre del médico — a pedido explícito, en vez de agregar un filtro.
- **Rango fijo de 7:00 a.m. a 7:00 p.m., Lunes a Sábado**: simplificación respecto al mockup (que sugiere vistas Semana/Día/Mes); se implementó solo la vista semanal más el mini calendario mensual para navegar, ya que cubre el caso de uso principal sin construir tres vistas distintas no pedidas explícitamente.
- **Sin fotos reales de mascota**: en ese momento el sistema no tenía un módulo de mascotas (`nombre_mascota` era texto libre, ver incremento 2); las tarjetas usaban un ícono de pata genérico. *(Actualización: la ampliación siguiente reemplazó `nombre_mascota` por una entidad `mascota` real — ver abajo. Las tarjetas del calendario siguen sin foto real, ahora por la misma razón que médicos/sedes: sin infraestructura de upload.)*

### Ampliación: landing dinámico, mascotas/pacientes, configuración y reportes (a pedido explícito)

- **El propósito del panel administrativo es que un administrador no programador configure el sistema y eso se refleje en el sitio público.** Al revisarlo se encontraron dos huecos reales: `GET /api/sedes` no filtraba sedes inactivas, y el horario mostrado en el landing estaba escrito a mano en el JSX en vez de leerse de `horario_atencion`. Ambos se corrigieron antes de construir las pantallas nuevas (ver PA de landing dinámico más arriba, sección del sistema de diseño).
- **Mascota pasa a ser una entidad real** (`mascota`, con `especie`/`raza` como texto libre, sin catálogo nuevo — igual que `servicio.descripcion`), **adelantando una porción del incremento 4 (Clientes)** que el alcance del proyecto tiene planeado después de este. `cita.nombre_mascota` se migró con *backfill* (una mascota por cada combinación distinta cliente+nombre ya existente) y se eliminó la columna vieja — sin dejar un campo de compatibilidad. El incremento 4, cuando llegue, no necesita repetir este trabajo: solo construir lo que falte (ficha de mascota más completa, si se pide).
- **Pacientes y Reportes son vistas multisede** (filtro de sede opcional, no restringidas a "mi sede"): necesario para el gráfico comparativo de sedes en Reportes, y consistente con "una sola fuente de verdad multisede" (`PRODUCT.md`). Se verificó (PA-40) que el filtro de sede afecta a los KPIs de una sede pero no a los gráficos explícitamente comparativos (`citasPorSemana`, `citasPorSede`), que siempre muestran todas las sedes — de lo contrario dejarían de ser comparativos.
- **Configuración se acotó a Usuarios + Sedes**, las dos únicas pestañas del mockup con respaldo real: Usuarios reutiliza en su mayoría el backend ya existente (`POST /usuarios`, `PATCH /usuarios/:id/rol`); Sedes reutiliza `PanelHorarios` tal cual, sin duplicar código. Notificaciones (es el incremento 5 completo), Preferencias, Seguridad, Respaldo y Apariencia no se construyeron: no tienen RF/RNF ni backend detrás, hubieran sido controles decorativos sin funcionalidad real.
- **Nuevo `PATCH /api/usuarios/:id` genérico** (activo/teléfono/nombre, cualquier rol) se reutiliza en tres lugares (Configuración→Usuarios, toggle de Pacientes, y disponible para médicos si se necesitara) en vez de triplicar el mismo endpoint. Bloquea que un administrador se desactive a sí mismo (PA-39) — sin ese bloqueo, un admin podría quedar sin poder iniciar sesión.
- **Reportes agrega las primeras dependencias nuevas del proyecto desde que se fijó el stack** (autorizadas explícitamente): Recharts para los gráficos, y `exceljs` + `jspdf`/`jspdf-autotable` para exportar. Se descartó `xlsx` (la librería originalmente planeada) por una vulnerabilidad de severidad alta sin parche disponible (prototype pollution / ReDoS al *parsear* archivos); no aplicaba directamente a nuestro uso (solo generamos archivos, nunca parseamos uno externo), pero se prefirió `exceljs` por no tener ese hueco — decisión de seguridad tomada durante la instalación, documentada aquí en vez de en silencio.
- **Exportar Excel/PDF no tiene endpoint propio**: se genera en el navegador a partir de los mismos datos que ya carga la pantalla de Reportes.
- **Gráfico "pacientes por especie" del mockup se omitió** (decisión ya tomada antes de este bloque, ver arriba) — sigue sin dato agregado real detrás aunque ahora exista el campo `especie` en `mascota`, porque no hay suficiente volumen de datos reales para que ese agregado tenga sentido en el entorno local del proyecto.
