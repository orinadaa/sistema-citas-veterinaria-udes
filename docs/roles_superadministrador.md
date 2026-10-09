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
| Reportes | Solo de su sede | De todas las sedes, con filtro |

Reglas que lo sostienen:

- Los permisos los impone el servidor (`verificarRol` en cada ruta y
  comprobaciones de sede en los controladores). La interfaz solo decide qué
  mostrar.
- "Un servicio se presta en una sede" sigue significando que al menos un
  médico activo de esa sede lo tiene asignado. No hay una tabla aparte.
- El rol `superadministrador` no se puede asignar ni quitar desde el sistema.
  La cuenta se crea con un comando (`npm run crear:superadmin`).
- Nada se elimina: sedes, servicios y cuentas solo se desactivan.

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
| El administrador de sede no configura el sistema | Token de administrador contra crear/editar sede, crear/editar servicio y galería (7 casos) | 403 en todos | Correcto |
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

Total del servidor: 353 pruebas pasan.

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

## Catálogos (superadministrador)

Listas de opciones que se cambian sin programar. Decisiones de Oriana:
catálogos gestionados (no un editor libre de tablas); categorías, especies y
razas editables; al desactivar, los registros que ya lo usan se conservan.

- **Categorías y especialidades.** Es un solo catálogo (`categoria_servicio`):
  clasifica los servicios y es la lista de especialidades de los médicos. Se
  crean, se renombran, se les cambia el color (7 de la paleta) y se desactivan.
- **Especies y razas.** Pasaron del código a las tablas `especie` y `raza`
  (migración `incremento_8b_catalogos.sql`, con la misma lista de antes). Una
  especie nueva usa uno de cuatro iconos: perro, gato, ave o huella. Una
  especie sin razas activas pide la raza como texto libre (así funciona
  "Otro").
- `mascota.especie` y `mascota.raza` siguen guardando el texto, sin llave
  foránea: desactivar no toca ninguna mascota. Renombrar sí corrige el texto
  en las mascotas que lo tienen, en la misma transacción.
- No hay rutas para eliminar. Cada fila muestra cuántos registros la usan.
- Los formularios de mascota leen el catálogo (`hooks/useCatalogoEspecies.js`)
  y, si el servidor no responde, usan la lista de respaldo del código.

Pruebas:

| Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| Solo el superadministrador gestiona catálogos | Token de administrador contra las 8 rutas de gestión | 403 | Correcto |
| No hay eliminación | `DELETE` sobre especie, raza y categoría | 404 | Correcto |
| Lista pública de especies | `GET /api/catalogos/especies` sin sesión | Solo activas, solo nombres | Correcto |
| Validaciones | Nombre vacío o largo, color o icono fuera de lista, estado no booleano | 400 | Correcto |
| Duplicados | Nombre repetido de categoría, especie o raza | 409 | Correcto |
| Migración 8b (base real) | Ejecutarla dos veces | Canino 42, Felino 17, Ave 11, Otro 0; sin duplicar; mascotas y categorías sin cambios | Correcto |
| Ciclo completo (base real, registros temporales "ZZ") | Crear especie y raza, renombrar, desactivar; crear y editar categoría | La raza desactivada sale de la lista pública; la especie desactivada también, y sigue en la de administración | Correcto |
| Formulario del cliente | Abrir "Agregar mascota" y elegir Canino | 4 especies y 42 razas, leídas del catálogo | Correcto |

Los registros temporales de la prueba se borraron al terminar. No probado:
renombrar una especie o raza que ya tienen mascotas reales, ni guardar desde la
pantalla de Catálogos (solo se abrió para mirar).

## Pendiente

- Ver el perfil completo de un usuario desde Usuarios.
