# Roles del panel: superadministrador y administrador de sede

Decisiones de Oriana (8 de octubre de 2026). El sistema tenía un solo rol
`administrador` que hacía todo; se separó en dos.

## Reparto

| | Administrador de sede | Superadministrador |
|---|---|---|
| Alcance | Solo su sede (`usuario.sede_id`) | Todo el sistema (sin sede) |
| Inicio | El día de su sede | Estado del sistema y de cada sede |
| Citas | Agenda y consulta las de su sede | No opera citas |
| Médicos | Crea, edita y asigna servicios a los de su sede; no los activa ni desactiva | Los ve y gestiona como cuentas en Usuarios |
| Pacientes | Consulta los clientes y sus mascotas; no activa ni desactiva cuentas | — |
| Servicios | Solo consulta el catálogo; en Médicos decide quién presta cada uno en su sede | Crea y edita el catálogo (es el de la página web) |
| Horario | Cambia el horario de atención de su sede | Cambia el de cualquier sede |
| Sedes | — | Crea, edita, activa y desactiva |
| Usuarios | — | Crea administradores y médicos y les asigna rol y sede. Es el único que activa o desactiva cuentas, de personal y de clientes |
| Página web | — | Galería de la portada |
| Campos | — | Campos adicionales de los formularios |
| Reportes | Solo de su sede | De todas las sedes, con filtro |

Reglas que lo sostienen:

- Los permisos los impone el servidor (`verificarRol` en cada ruta y
  comprobaciones de sede en los controladores). La interfaz solo decide qué
  mostrar.
- "Un servicio se presta en una sede" sigue significando que al menos un
  médico activo de esa sede lo tiene asignado. No hay una tabla aparte.
- El rol `superadministrador` no se puede asignar ni quitar desde el sistema.
  La cuenta se crea con un comando (`npm run crear:superadmin`).
- Nada se elimina: sedes, servicios, cuentas y campos solo se desactivan.

## Panel de inicio del administrador de sede

Responde "¿qué tengo que atender hoy?":

- Indicadores: citas de hoy, pendientes por atender hoy, citas de la semana y
  canceladas de la semana.
- Citas de hoy en orden, con la próxima destacada.
- Requiere tu atención: sede sin horario, médicos sin servicios asignados y
  servicios que ningún médico de la sede presta.
- Carga de la semana: citas agendadas por día.

Sin ingresos ni facturación (fuera del alcance del proyecto).

## Panel de inicio del superadministrador

- Indicadores: sedes activas, personal activo, clientes registrados y
  servicios activos.
- Una tarjeta por sede: administradores, médicos, días con horario y citas del
  mes.
- Requiere tu atención: sede sin administrador, sin horario o sin médicos;
  servicios sin médico o sin foto; galería vacía.

## Crear la cuenta del superadministrador

Desde `backend/`:

```
SUPERADMIN_CORREO=correo@udes.edu.co SUPERADMIN_CONTRASENA=Temporal123 npm run crear:superadmin
```

No cambia ninguna cuenta existente. Si el correo ya está registrado, avisa y
no hace nada.

## Pruebas

Unitarias (`backend/tests`, modelos simulados):

| Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| El administrador de sede no configura el sistema | Token de administrador contra crear/editar sede, crear/editar servicio, galería y campos (9 casos) | 403 en todos | Correcto |
| El administrador de sede consulta sedes y catálogo | `GET /api/sedes/admin`, `GET /api/servicios/admin` | 200 | Correcto |
| Solo lista clientes | `GET /api/usuarios?rol=cliente` / sin rol / `rol=veterinario` | 200 / 403 / 403 | Correcto |
| No crea personal ni cambia roles | `POST /api/usuarios`, `PATCH /api/usuarios/:id/rol` | 403 | Correcto |
| No activa ni desactiva cuentas | `PATCH /api/usuarios/:id` sobre cliente o personal; `PUT /api/administracion/medicos/:id` con `activo` distinto | 403 | Correcto |
| Horario solo de su sede | `PUT` y `DELETE /api/horarios` con administrador de otra sede | 403 | Correcto |
| El superadministrador cambia cualquier horario | `PUT /api/horarios` | 200 | Correcto |
| Reportes acotados a la sede | Administrador pide `sedeId` de otra sede | Se consulta su propia sede | Correcto |
| El rol superadministrador no se asigna ni se quita | `PATCH /:id/rol` con `rol: superadministrador` / sobre un superadministrador | 400 / 403 | Correcto |
| Inicio de sede | `GET /api/administracion/tablero` | Datos de su sede y avisos; 403 para otros roles | Correcto |
| Inicio del sistema | `GET /api/administracion/sistema` | Resumen y avisos; las sedes inactivas no generan avisos; 403 para el administrador | Correcto |

Total del servidor: 332 pruebas pasan.

Aceptación (base de datos real, solo lectura):

| Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| Migración 8a | Ejecutar `incremento_8a_superadministrador.sql` | Se amplía la lista de roles; ninguna cuenta cambia | Correcto |
| Consultas del inicio de sede | `resumenSede` para Bucaramanga y Valledupar | Sin errores; Bucaramanga avisa "Desparasitación, Vacunación" sin médico | Correcto |
| Consultas del inicio del sistema | `resumenSistema` | Sin errores; Valledupar aparece sin administrador | Correcto |
| Menú por rol en el navegador | Sesión de administrador y de superadministrador | Cada uno ve solo sus módulos | Correcto |
| Servicios en solo lectura para el administrador | Abrir Servicios | Sin "Nuevo servicio", sin "Editar", sin interruptores | Correcto |
| Horario del administrador | Abrir Horario | Solo su sede; sin "Nueva sede" | Correcto |

No probado todavía: guardar cambios desde las pantallas del superadministrador
con una cuenta real (hace falta crearla), y el formulario de horario del
administrador de sede abierto en el navegador.

## Pendiente

- Catálogos gestionados (especies y razas, categorías de servicio,
  especialidades): acordado, aún no construido.
- Ver el perfil completo de un usuario desde Usuarios.
