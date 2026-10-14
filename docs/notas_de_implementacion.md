# Notas de implementación por archivo

Explicación ampliada de los módulos del sistema: qué resuelve cada archivo, cómo se usa y por qué se hizo así. En el código queda solo una descripción breve; el detalle vive aquí para que no envejezca dentro de los archivos.

## backend/src/config

### `db.js`

Configura el pool de conexiones a PostgreSQL usando la libreria "pg". Un pool reutiliza conexiones en vez de abrir una nueva por cada consulta, lo cual es la practica recomendada para una API que atendera muchas peticiones concurrentes (agendamiento de citas, consultas, etc.).

## backend/src/controllers

### `auth.controller.js`

RF-01 (registro de clientes), RF-02 (inicio de sesion). El registro publico solo crea usuarios con rol "cliente": las cuentas de administrador/veterinario las crea un administrador (ver usuario.controller.js). El registro va en dos pasos: 1) se guardan los datos como solicitud pendiente y se envia un codigo al correo; 2) con el codigo correcto se crea la cuenta. Asi el correo de toda cuenta es de quien la creo. El paso 1 devuelve un identificador de la solicitud que el paso 2 debe traer junto con el codigo: sin el, otra persona podria registrarse encima con el mismo correo y su propia contraseña, y esperar a que el dueño del correo escriba el codigo que le llega.

### `cita.controller.js`

RF-06 (agendar), RF-07 (disponibilidad), RF-08 (reprogramar), RF-09 (cancelar): historias de usuario HU-05 a HU-08. Agendan el cliente (para si mismo), el administrador de sede y el medico (a nombre de un cliente). Reprograman y cancelan el cliente dueño, el administrador de la sede de la cita y el medico que la atiende. Una cita ocupa tantas franjas de 30 minutos como dure su servicio.

La disponibilidad de una franja depende de que al menos un medico que preste ese servicio en esa sede este libre. En el flujo de agendamiento del cliente (incremento 4) el medico se asigna automaticamente al confirmar; el calendario del administrador sigue eligiendolo explicitamente.

### `cuenta.controller.js`

"Mi perfil" del cliente (/api/cuenta). Decisiones de la autora:
- Edita sus datos personales: nombre, telefono, documento y direccion.
- El correo se cambia confirmando un codigo enviado AL CORREO NUEVO (los mismos manejadores del perfil del medico, perfilMedico.controller.js).
- La contraseña se cambia confirmando un codigo de 6 digitos enviado a SU CORREO ACTUAL: asi se comprueba que quien la cambia es el dueño de la cuenta, aunque alguien mas tenga la sesion abierta.

### `datos.controller.js`

Modulo "Datos" del superadministrador (/api/datos):
- explorar cualquier entidad en solo lectura, con busqueda, filtros, orden y paginas, y exportarla a CSV;
- correcciones puntuales, cada una con sus reglas;
- bitacora de cambios y copia de seguridad. No hay edicion libre de tablas ni eliminacion de registros.

### `disponibilidadMedico.controller.js`

Horario de trabajo del medico: horario semanal (con pausa opcional) y bloqueos (vacaciones, permisos, excepciones por horas). Decision de la autora (11 oct 2026): lo define el administrador de la sede del medico, desde Medicos; el medico solo lo consulta en "Mi perfil". Sin horario propio, el medico atiende con el horario de la sede. El horario propio siempre debe caber dentro del horario de atencion de la sede ese dia, y el administrador solo asigna dias en su propia sede.

### `logo.controller.js`

Logotipos de la clinica (Pagina web > Logotipos). Leerlos es publico: los usa toda la pagina. Cambiarlos, solo el superadministrador, subiendo un archivo (nunca un enlace); queda en la bitacora. La respuesta trae, por cada logotipo, la ruta del archivo subido o null si se usa el original que viene con el sistema.

### `perfilMedico.controller.js`

"Mi perfil" del medico veterinario (/api/medico/perfil). Decisiones de la autora:
- Edita nombre, telefono, direccion, foto y su informacion profesional (titulos, registro, años de experiencia, biografia).
- Especialidades, servicios y sede son de SOLO LECTURA (los asigna el administrador).
- El correo se puede cambiar, pero solo despues de confirmar un codigo de 6 digitos enviado AL CORREO NUEVO (asi se verifica que existe y que es suyo).

### `sede.controller.js`

RF-03: informacion accesible sin autenticacion (aqui, listado de sedes); RF-13 (ampliacion): gestion de sedes exclusiva del administrador, sin restriccion de "mi propia sede" (mismo criterio que ya tenian los horarios de atencion).

Incremento 4 (flujo de agendamiento): codigo corto de la sede (se usa en el consecutivo de la cita, CV-BGA-2026-00045), sede principal y amenidades (parqueadero, sala de espera pet friendly).

### `tablero.controller.js`

Paneles de inicio. Cada rol ve el suyo:
- GET /api/administracion/tablero (administrador): el dia de SU sede.
- GET /api/administracion/sistema (superadministrador): el estado de todo el sistema. Los avisos ("requiere atencion") se arman aca para que la interfaz solo los muestre: cada uno dice que pasa y a que modulo ir para resolverlo.

### `usuario.controller.js`

RF-04 (gestion de roles), RF-05 (restriccion por rol). Crear personal (administrador/veterinario), reasignar roles y activar o desactivar cuentas son acciones exclusivas del superadministrador (ver usuario.routes.js). El administrador de sede solo lista clientes.

## backend/src/middlewares

### `bitacora.middleware.js`

Deja registro en la bitacora de las acciones que cambian la configuracion del sistema o corrigen datos: quien (req.usuario), que accion, sobre que registro y un resumen de lo que envio.

Uso en una ruta, despues de verificar el rol: router.put('/:id', soloSuper, auditar('Editar sede', 'sede'), actualizar)

Se escribe solo si la respuesta fue exitosa (2xx), y nunca hace fallar la peticion: si la bitacora no se puede guardar, se avisa en la consola y la accion sigue su curso.

### `errorHandler.js`

Middleware centralizado de manejo de errores. Debe registrarse SIEMPRE al final de la cadena en app.js.

Los errores inesperados (500) se anotan completos en el registro del servidor, pero a quien hizo la peticion solo se le dice que algo fallo: el detalle (nombres de tablas, consultas, rutas del disco) le serviria a un atacante para conocer el sistema por dentro.

### `seguridad.middleware.js`

Endurecimiento del servidor (auditoria de seguridad, RNF-04). Sin librerias nuevas: son pocas reglas y asi el stack del proyecto no cambia.
- cabecerasSeguridad: cabeceras HTTP que le dicen al navegador que no adivine tipos de archivo, no deje incrustar el sitio en otro (clickjacking) y, en produccion, que use siempre HTTPS.
- origenesPermitidos: lista de sitios que pueden llamar a la API desde un navegador (CORS). Antes se aceptaba cualquiera.
- limitarIntentos: tope de peticiones por direccion IP en una ventana de tiempo, para frenar la fuerza bruta contra el inicio de sesion, el registro masivo y el abuso de los codigos por correo.

### `subirFoto.middleware.js`

Recepcion de fotos (multipart/form-data, campo "foto") con multer. El archivo se guarda en disco, en backend/uploads/<subcarpeta>/, con un nombre aleatorio (nunca el nombre original que manda el navegador), y la base de datos solo guarda la ruta publica -- el mismo patron que un sistema real con almacenamiento de archivos, adaptado a una entrega local. Se usa para fotos de mascotas, la foto de perfil del medico (la sube el o el administrador), la foto de cada sede, la galeria del inicio, la foto de cada servicio y los logotipos de la clinica (estos ultimos admiten ademas WebP, que conserva la transparencia y pesa menos).

## backend/src/models

### `catalogo.model.js`

Catalogos que el superadministrador gestiona sin programar:
- categorias de servicio (son tambien las especialidades de los medicos);
- especies y razas de las mascotas. Regla comun: nada se elimina, solo se desactiva. Lo desactivado deja de ofrecerse en registros nuevos; lo que ya lo usa lo conserva.

### `datos.model.js`

Modulo "Datos" del superadministrador.

1. Explorador de SOLO LECTURA. Cada entidad se describe en ENTIDADES: de que tablas sale, que columnas se muestran (con nombres legibles en vez de ids), por cuales se busca, se ordena y se filtra. Todo lo que llega del navegador (entidad, columna de orden, filtros) se valida contra esa descripcion: nunca se arma SQL con texto libre. Las contraseñas y los codigos de recuperacion no estan en ninguna lista de columnas.
2. Correcciones puntuales, cada una con sus reglas (ver el controlador).

### `medico.model.js`

"Medico" aqui es un usuario con rol 'veterinario'. RF-10/RF-11: el administrador ve los medicos de su sede y administra su perfil (documento, telefono, foto, biografia, especialidades, activo) y que servicio presta cada uno (servicio_medico).

### `reportes.model.js`

Agregaciones de solo lectura para el panel de Reportes. Vista multisede (ver decisiones del incremento 3): el filtro de sede aplica a los KPIs, el ranking de servicios, el estado de citas y las ultimas citas; "citas por semana" y "citas por sede" se muestran siempre comparando todas las sedes (el filtro no aplicaria, son graficos comparativos).

### `tablero.model.js`

Consultas de los paneles de inicio:
- resumenSede: lo que el administrador de una sede necesita ver al entrar (las citas de hoy, cuatro indicadores, la carga de la semana y lo que requiere su atencion).
- resumenSistema: lo que el superadministrador necesita ver (estado de cada sede, cuentas por rol y configuracion incompleta). Solo lectura. Sin ingresos ni facturacion (fuera del alcance).

## backend/src/routes

### `cita.routes.js`

RF-06 a RF-09: agendar, consultar disponibilidad, reprogramar y cancelar citas (HU-05 a HU-08).

Ampliacion (calendario del panel administrativo): el administrador tambien puede consultar disponibilidad y crear citas, para agendar en nombre de un cliente desde su calendario (ver cita.controller.js: crear() exige clienteId explicito cuando quien llama es administrador). Reprogramar/cancelar: el cliente dueño, el administrador de la sede de la cita o el medico que la atiende (auditoria del 11 oct 2026).

### `miCuenta.routes.js`

"Mi cuenta" del administrador de sede y del superadministrador (/api/mi-cuenta): cambiar su correo y su contraseña. Decision de la autora para la contraseña: contraseña actual + codigo por correo. Primero se comprueba la contraseña actual; solo entonces se envia el codigo de 6 digitos al correo de la cuenta, y con ese codigo se guarda la nueva. El correo se cambia confirmando un codigo enviado AL CORREO NUEVO (mismos manejadores del medico y del cliente): asi una cuenta cuyo correo no existe puede pasar a uno real y, desde ahi, recibir los codigos.

### `usuario.routes.js`

Gestion de cuentas (RF-04, RF-05). Crear personal y cambiar roles es del superadministrador, igual que activar o desactivar cualquier cuenta. El administrador de sede solo lista clientes (para agendarles); a sus medicos los crea y edita en /api/administracion/medicos, sin poder desactivarlos.

## backend/src/scripts

### `crearSuperadmin.js`

Crea la cuenta del superadministrador. Es un paso manual y deliberado: el rol no se puede asignar desde el sistema (ver usuario.controller.js), asi nadie se lo otorga por error desde una pantalla.

Uso (desde backend/): SUPERADMIN_CORREO=correo@udes.edu.co SUPERADMIN_CONTRASENA=Temporal123 npm run crear:superadmin Opcional: SUPERADMIN_NOMBRE (por defecto "Superadministrador UDES").

No toca ninguna cuenta existente: si el correo ya esta registrado, avisa y no hace nada. El superadministrador no pertenece a una sede.

### `datosDemo.js`

Carga datos de EJEMPLO para mostrar el sistema como si estuviera en funcionamiento (sustentacion, demostraciones), y permite quitarlos.

npm run demo:cargar crea los datos de ejemplo npm run demo:quitar los borra (solo los de ejemplo)

Reglas:
- Solo INSERTA. No modifica ni borra ninguna cuenta, mascota o cita que ya exista. Lo unico existente que cambia es el contador de codigos de cita (consecutivo_cita), para que las proximas citas reales no repitan un codigo.
- Todo lo de ejemplo cuelga de cuentas con correo "@demo.udes.co": asi se reconoce y se quita sin tocar lo real. "quitar" borra esas cuentas, sus mascotas y sus citas (tambien las que se hayan agendado despues a su nombre) y los servicios de la medica de ejemplo.
- Las citas respetan el sistema real: caen en dias y horas en que la sede atiende, con un medico de esa sede que presta ese servicio y que no tiene otra cita a esa hora.
- Es repetible: siempre genera lo mismo (sorteo con semilla fija). Si ya hay datos de ejemplo, "cargar" avisa y no hace nada.
- Todas las cuentas de ejemplo entran con la contraseña CONTRASENA_DEMO.

### `seedAdmin.js`

Crea la primera cuenta de administrador. Es un paso de arranque manual: una vez existe un administrador, el resto de cuentas de personal se crean desde POST /api/usuarios (protegido por rol), no desde este script.

Uso: node src/scripts/seedAdmin.js Variables opcionales (con valores por defecto para entorno local): ADMIN_NOMBRE, ADMIN_CORREO, ADMIN_CONTRASENA, ADMIN_SEDE_CIUDAD

### `seedFotosServicios.js`

Carga las fotos predeterminadas de los servicios (las que ya mostraba la pagina publica): copia las de frontend/src/assets/servicios-foto a backend/uploads/servicios y las asigna al servicio del mismo nombre, con su descripcion, encuadre y nivel de oscurecido. Solo toca servicios que aun NO tienen foto: nunca pisa una que el administrador ya subio desde Servicios > Editar.

Uso: npm run seed:fotos-servicios (requiere database/incremento_6b_servicio_foto.sql)

### `seedGaleria.js`

Carga las fotos de ejemplo de la galeria del inicio (Hero): copia las de frontend/src/assets/galeria (version liviana de las fotos reales de identidadmarca/galeria) a backend/uploads/galeria y las registra en foto_galeria. Solo actua si la galeria esta vacia: nunca pisa lo que el administrador ya configuro desde Configuracion > Galeria.

Uso: npm run seed:galeria (requiere database/incremento_6a_galeria.sql)

### `seedVeterinarios.js`

Siembra medicos de ejemplo y sus especialidades (que servicio presta cada uno), para poder probar el flujo de agendamiento de citas de principio a fin. La administracion real de medicos/especialidades (crear, editar, reasignar) es del panel administrativo, incremento 3; este script es solo el punto de partida, igual que seedAdmin.js.

Uso: node src/scripts/seedVeterinarios.js

## backend/src/services

### `correo.service.js`

Envio de correos transaccionales (credenciales, bienvenida, recuperacion de clave) via SMTP real (Gmail + contraseña de aplicacion). Es una excepcion consciente a "sin integraciones con sistemas externos" (alcance del proyecto), acordada explicitamente con la directora del proyecto para que las credenciales y los codigos de recuperacion lleguen de verdad al correo del usuario.

### `notificaciones.service.js`

Crea los avisos de la campana cuando pasa algo que a alguien le importa: cita agendada, reprogramada o cancelada, mascota registrada, recordatorio creado por el medico y recordatorio automatico previo a la cita (RF-18).

Reglas:
- Nunca hace fallar la accion que lo origina: si un aviso no se puede guardar, se anota en la consola y la cita (o la mascota) queda igual.
- No se avisa a quien hizo la accion de lo que el mismo acaba de hacer, salvo al cliente, que siempre ve el registro de sus citas y mascotas.
- Destinatarios de una cita: el cliente y el medico que la atiende. Los administradores y el superadministrador NO reciben notificaciones (decision de la autora): ven las citas en su panel.
- En las pruebas automaticas no escribe (los modelos estan simulados).

## backend/src/utils

### `disponibilidadMedico.js`

Logica pura (sin base de datos) de la disponibilidad propia del medico (opcion A: horario por medico y sede + bloqueos). Las franjas siguen saliendo del horario de la sede (utils/franjas.js); esto solo decide si UN medico atiende en una franja concreta:
- Sin horario propio configurado: atiende siempre (en su sede), como funcionaba antes -- la sede ya se filtro en la consulta de medicos.
- Con horario propio: debe tener fila ese dia EN ESA SEDE, la franja debe caber completa dentro de su rango y no cruzarse con su pausa.
- En cualquier caso, un bloqueo (dia completo, o rango de horas) que cubra esa fecha y se cruce con la franja la deja fuera.

### `estadoCuenta.js`

Estado vigente de una cuenta, leido de la base en cada peticion con sesion (auth.middleware.js): si esta activa, su rol y sede de AHORA, y desde cuando valen sus sesiones.
- Antes solo se revisaba "activo" y el rol salia del token: a quien se le cambiaba el rol o la sede conservaba los permisos viejos hasta 8 horas.
- sesiones_validas_desde: se actualiza al cambiar la contraseña; los tokens emitidos antes dejan de servir (una sesion robada no sobrevive al cambio). La respuesta se recuerda 30 segundos para no consultar en cada peticion; los cambios hechos desde este mismo servidor la olvidan al instante.

### `validacion.js`

Validaciones compartidas de datos que escribe una persona. Devuelven el mensaje del problema (para responder 400) o null si el dato sirve. Antes varios de estos datos llegaban sin revisar hasta la base, que respondia con un error 500.

## frontend/demo

### `grabar.mjs`

Graba las respuestas de lectura de la API que usa cada pantalla, para la demostracion sin servidor (GitHub Pages). Recorre la plataforma SOLO MIRANDO con las cuentas de ejemplo (@demo.udes.co): no guarda, cancela ni borra. Antes de escribir el archivo reemplaza los datos de las cuentas que NO son de ejemplo (nombre, correo, telefono, documento, foto) por datos ficticios. Requiere el frontend (5173) y el backend encendidos. uso: node demo/grabar.mjs (desde frontend/)

### `publicar.mjs`

Compila la demostracion sin servidor y la deja lista en frontend/dist-demo para GitHub Pages. Antes hay que grabar los datos: node demo/grabar.mjs uso: node demo/publicar.mjs nombre-del-repositorio (desde frontend/) node demo/publicar.mjs nombre-del-repositorio --servir (ademas la sirve en http://localhost:4173 para probarla)

## frontend/src/components

### `AccentBar.jsx`

Detalle de marca: azul + amarillo, los dos colores institucionales de la clinica. Se usa siempre igual, bajo los titulos de seccion. `sobreFondoAzul` cambia la mitad azul por blanco para que se distinga sobre un fondo ya azul (ej. el banner de cierre).

### `icons.jsx`

Iconos del sistema: Phosphor Icons (@phosphor-icons/react, MIT), elegida por la autora porque trae los iconos de veterinaria (huella, jeringa, estetoscopio, diente...) y varios pesos del mismo dibujo. Reemplaza al set de linea dibujado a mano que habia antes.

Este archivo es la UNICA puerta de entrada: el resto del sistema sigue importando IconoReloj, IconoPata, etc. desde aca, con la misma interfaz de siempre (className para tamaño y color; el color es el del texto). Para un icono nuevo: importarlo de Phosphor y exportarlo igual que los demas.

`peso` elige la variante del dibujo:
- "regular" (por defecto): linea. Botones, menus, topbar, campos.
- "duotone": linea + relleno suave del mismo color. Solo para iconos ilustrativos: servicios, tarjetas de indicadores y estados vacios.
- "bold" / "fill": casos puntuales que necesitan mas peso.

Cada icono se importa por su propio archivo (dist/csr/...), no desde la raiz del paquete: asi Vite no tiene que procesar los ~1500 iconos.

## frontend/src/components/admin

### `AvisosAtencion.jsx`

"Requiere tu atención": lista de cosas por resolver que arma el servidor (tablero.controller.js). Cada aviso dice que pasa y lleva al modulo donde se arregla (onIr). Sin avisos, lo dice en positivo. Lo usan el inicio del administrador de sede y el del superadministrador.

### `DetalleRegistroDatos.jsx`

Como se ve un registro abierto en Datos > Explorar (superadministrador). Cada entidad tiene su propia ficha, con los mismos recursos del resto del panel: avatar e insignias en la cabecera, filas con icono (como el detalle de una cita) y tarjetas de dato corto (como la ficha de un paciente).
- DetalleRegistro: la ficha segun la entidad (usuarios, mascotas, citas, servicios, sedes; cualquier otra cae en una ficha generica).
- FilaRelacionada: una fila de "Sus mascotas" / "Sus citas". Solo dibuja: no consulta ni cambia nada.

### `EditorHorarioMedico.jsx`

Horario propio de un medico, dia por dia, con los mismos componentes del horario de atencion de la sede (EditorHorarioSemana; pedido de la autora):
- arriba, los siete dias como botones; el punto dice si el medico atiende;
- al tocar un dia se edita ESE dia: un interruptor para decir si atiende, y la hora que se cambia (entrada, salida o los dos extremos de la pausa) se ajusta en el reloj (RelojHora). A diferencia de la sede, aqui no se guarda dia por dia: la semana completa se guarda con el boton "Guardar horario" del panel (el servidor recibe los siete dias juntos y los valida contra el horario de la sede). dias: [{ dia, nombre, atencion }] (atencion = { inicio, fin } "HH:MM" de la sede ese dia, o null si la sede no abre). semana: { [dia]: { activo, horaInicio, horaFin, conPausa, pausaInicio, pausaFin } }. onCambiar(dia, cambios) actualiza el borrador.

### `EditorHorarioSemana.jsx`

Horario de atencion de una sede, dia por dia (pedido de la autora):
- arriba, los siete dias como botones; cada uno dice si abre y a que horas;
- al tocar un dia se edita ESE dia: se elige si se cambia la hora de apertura o la de cierre y se ajusta en el reloj (RelojHora);
- "Guardar" guarda solo ese dia; "Cerrar este día" lo deja sin atencion. dias: [{ numero, letra, nombre, abierto, horaInicio, horaFin }] (abierto = lo que esta guardado). onCambiar(numero, cambios) actualiza el borrador; onGuardar(dia) / onCerrar(dia) hablan con el servidor y devuelven true si salio bien.

### `HorarioMedicoPanel.jsx`

Medicos > Horario: el administrador de la sede define el horario de trabajo de cada medico (decision de la autora, 11 oct 2026; antes lo configuraba el propio medico en "Mi perfil > Disponibilidad", que ahora es solo de consulta).
- Horario semanal: por dia, si atiende, desde/hasta y una pausa opcional. Se edita con EditorHorarioMedico: los mismos botones por dia y el mismo reloj del horario de atencion de la sede. Siempre en la sede del administrador y dentro de su horario de atencion (el backend lo valida). Sin horario propio, el medico atiende con el horario de la sede.
- Bloqueos: rango de fechas, opcionalmente solo unas horas, con motivo. Las citas ya agendadas dentro no se cancelan solas: se avisa cuantas hay.

### `MascotasPaciente.jsx`

Tab "Mascota(s)" del SidePanel "Detalle del paciente" (rol administrador). Distinto a proposito del lado del cliente:
- Tarjeta por mascota (foto, especie · raza, sexo | edad · peso) con menu de tres puntos: solo Editar (carga la mascota en el mismo formulario de abajo). El administrador NO puede eliminar mascotas: eso lo hace unicamente su dueño (decision de la autora).
- Formulario "Agregar mascota" embebido en el tab (no es otro panel), con la zona de foto estandar (ZonaFoto) que abre el mismo editor de foto del cliente (FotoMascotaModal), Sexo como segmented control obligatorio en este formulario, y sin "Informacion medica" (no aparece en la referencia de este modulo).

### `NuevaCitaModal.jsx`

"Nueva cita" del administrador en una ventana centrada (antes era un panel lateral). Decisiones de la autora: la base es el flujo de agendar del CLIENTE (/agendar), no un formulario aparte, organizado en 3 pasos con un stepper horizontal.

Que se reutiliza del flujo del cliente, sin duplicarlo:
- PaginaMascotaServicio: las tarjetas de mascota y de servicio;
- DatePickerCalendar + TimeSlotPicker: calendario y horas disponibles;
- el patron de pasos (stepper, Atras / Continuar) y la confirmacion al salir con datos sin guardar (DialogoSalirAgendar).

Que cambia frente al cliente, porque quien agenda es el administrador:
- Paso 1 empieza eligiendo el CLIENTE (el cliente agenda para si mismo); la mascota nueva se crea a nombre de ese cliente (NuevaMascotaRapida);
- no se elige sede: es la del administrador;
- el MEDICO lo elige el administrador entre los libres a esa hora (SelectorMedico); al cliente se le asigna solo.

Pasos: 1. Cliente, mascota y servicio 2. Fecha, hora y medico
 3. Revisar y confirmar.

Ventana: cristal de vetUI sobre el velo, z-[60], en <body> (portal). Escape, la X o un clic afuera piden confirmar si ya hay algo elegido.

### `PanelCatalogos.jsx`

Catalogos (superadministrador): las listas de opciones del sistema, que se cambian sin programar. Dos pestañas:
- Categorias y especialidades: es un solo catalogo. Clasifica los servicios y es la lista de especialidades de los medicos.
- Especies y razas: lo que ofrecen los formularios de mascota. Una especie sin razas activas pide la raza como texto libre. Regla comun (decision de la autora): nada se elimina, se desactiva. Lo desactivado deja de ofrecerse en registros nuevos; lo que ya lo usa lo conserva. Por eso cada fila dice cuantos registros la usan. Renombrar corrige el nombre tambien en las mascotas que ya lo tienen.

### `PanelCitasSeguimiento.jsx`

RF-12: seguimiento de citas programadas, como vista de calendario semanal (reemplaza la tabla anterior). El administrador ademas puede agendar citas en nombre de un cliente ("+ Nueva cita", en una ventana centrada: NuevaCitaModal). Al hacer clic en una cita se abre su detalle (DetalleCitaMedicoPanel, el mismo del medico); desde su pie la sede y el medico pueden cancelarla o reprogramarla (RF-08/RF-09, PieCancelarCita).

### `PanelConfiguracion.jsx`

Configuracion, acotada a lo que tiene respaldo real: gestion de cuentas de personal (Usuarios), Sedes (reutiliza PanelHorarios tal cual). Desde la separacion de roles es el modulo "Usuarios" del superadministrador. El resto de pestanas del mockup (Notificaciones, Seguridad, Respaldo, Preferencias, Apariencia) no se construyen: sin RF/RNF ni backend detras, ver docs/incremento_3_pruebas.md.

### `PanelDatos.jsx`

Datos (superadministrador): ver y cuidar la informacion del sistema sin abrir la base de datos. Tres pestañas:
- Explorar: cualquier entidad en SOLO LECTURA, con busqueda, filtros, orden, paginas y exportacion a CSV. Al abrir una fila se ve el registro completo, lo relacionado y, si aplica, las correcciones disponibles.
- Bitacora: quien cambio que y cuando.
- Copia de seguridad: descarga un archivo .sql con toda la base. No hay edicion libre de tablas ni eliminacion: las correcciones son pocas y cada una tiene sus reglas (el servidor las impone).

### `PanelGaleria.jsx`

Configuracion > Galeria: las fotos que rotan en la portada (Hero) de la pagina publica. El administrador las sube como archivo (ZonaImagen), las describe, elige que parte debe quedar al centro (encuadre), las ordena, las oculta o las elimina. El Hero las lee de GET /api/galeria (ver landing/HeroGaleria.jsx); si no hay ninguna visible, el Hero usa las fotos de ejemplo que vienen con el sistema.

### `PanelInfoClinica.jsx`

Pagina web > Informacion de la clinica (RF-23, superadministrador): lo que la pagina publica muestra de la clinica y que se cambia sin programar.
- WhatsApp: un solo numero para toda la clinica. Con el interruptor encendido, el landing muestra la burbuja flotante que abre el chat.
- Redes sociales: las que tengan enlace salen como iconos en el pie de pagina; las vacias no aparecen.

### `PanelInicioSede.jsx`

Inicio del administrador de sede: responde "¿que tengo que atender hoy?" al abrir el sistema. Todo es de SU sede (el servidor la toma de su cuenta).
- Cuatro indicadores: citas de hoy, pendientes por atender, citas de la semana y canceladas de la semana.
- Citas de hoy, en orden, con la proxima destacada.
- Requiere tu atencion: configuracion que impide agendar (ver AvisosAtencion), con acceso al modulo donde se resuelve.
- Carga de la semana: citas por dia, para ver los dias mas llenos. Sin ingresos ni facturacion (fuera del alcance del proyecto). onIr(modulo): cambia de modulo en el menu lateral.

### `PanelInicioSistema.jsx`

Inicio del superadministrador: el estado del sistema completo de un vistazo, sin entrar a operar el dia a dia de ninguna sede.
- Indicadores: sedes activas, personal (administradores + medicos), clientes registrados y servicios activos.
- Sedes: una tarjeta por sede con su administrador, medicos, dias con horario y citas del mes.
- Requiere tu atencion: configuracion incompleta (ver AvisosAtencion). onIr(modulo): cambia de modulo en el menu lateral.

### `PanelLogos.jsx`

Pagina web > Logotipos (superadministrador; pedido de la autora): todos los logotipos de la clinica que usa el sistema, incluidos los de la animacion de la barra superior, con un lugar para ver cada uno, subir otro archivo y volver al original. Por defecto cada uno muestra el archivo que viene con el sistema. Subir un archivo lo reemplaza en toda la pagina al instante (useLogos).

### `PanelMiCuenta.jsx`

"Mi cuenta" del administrador de sede y del superadministrador (menu del avatar del panel): sus datos y la seguridad de su cuenta.
- Correo: se cambia confirmando un codigo enviado al correo NUEVO. Sirve para pasar una cuenta con un correo que no existe a uno real.
- Contraseña (decision de la autora): contraseña actual + codigo de 6 digitos enviado a su correo.

### `PanelServicios.jsx`

RF-11: catalogo de servicios veterinarios (categoria, precio, duracion estimada, estado). La duracion se muestra al cliente en el resumen del flujo de agendamiento; es informativa (la agenda sigue en franjas de 30 min). Cada servicio puede llevar una foto: es la que se ve en la seccion "Servicios" de la pagina publica (un servicio sin foto no aparece ahi).

## frontend/src/components/agendar

### `BookingStepper.jsx`

Los 5 hitos del flujo de agendamiento. El contenido se agrupa en 3 paginas (1: mascota+servicio, 2: sede+fecha/hora, 3: confirmacion): todos los hitos de la pagina activa se resaltan juntos (decision confirmada con la autora -- el mockup resaltaba solo el primero) y los de paginas ya completadas muestran check.

Ambas variantes (horizontal y lateral) son navegables: cada hito al que se puede ir (`puedeIrAHito`, decidido por AgendarCitaPage) es un boton que llama a `onIrAHito`; los demas se muestran sin interaccion.

### `BookingSummarySidebar.jsx`

Resumen lateral pegajoso (sticky) del flujo de agendamiento. Cada fila tiene "Cambiar", que regresa a la pagina donde se elige ese dato sin perder las demas selecciones (el estado vive en AgendarCitaPage). top-24: el Navbar publico es sticky (h ~ 4.5rem, z-40), el resumen queda debajo de el en vez de pasar por detras. Material: Superficie de vidrio blanco de vetUI (texto oscuro).

### `DatePickerCalendar.jsx`

Calendario de mes, el unico del sistema para elegir una fecha: se usa tal cual para la cita (agendar, reprogramar) y dentro de CampoFecha para cualquier otro campo de fecha. Por defecto los dias pasados y los dias en que la sede no atiende (sin fila en horario_atencion) quedan deshabilitados; hoy se marca sutilmente; el dia elegido en azul solido. Trabaja con fechas "YYYY-MM-DD" en hora local, el mismo formato que espera GET /api/citas/disponibilidad.

minimo / maximo ("YYYY-MM-DD"): limites elegibles. minimo sin pasar = hoy (no se agenda en el pasado); minimo={null} = sin limite inferior (fecha de nacimiento, reportes).

marcas (opcional): { "YYYY-MM-DD": ['proxima', 'completada', ...] }. Dibuja un punto de color por estado debajo del numero del dia (vista "Mis citas" del cliente: que dias tienen cita). El color nunca va solo: el nombre accesible del dia dice cuantas citas hay y de que estado. permiteQuitar: un clic sobre el dia ya elegido lo desmarca (onChange('')).

En todos los calendarios del sistema (pedido de la autora) el mes y el año del encabezado se pueden pulsar: el mes abre la grilla de los 12 meses y el año una lista de años para recorrer, ademas de las flechas de mes. No son <select>: se eligen dentro del mismo calendario, y lo que queda fuera de los limites sale deshabilitado.

### `DialogoSalirAgendar.jsx`

Confirmacion antes de salir del flujo de agendamiento cuando ya hay datos elegidos: "Cancelar" no debe borrar el progreso sin avisar. Usa el Dialogo de vetUI (cristal fuerte centrado): Escape o clic en el velo = seguir agendando; el foco arranca en la opcion segura.

### `PaginaConfirmacion.jsx`

Pagina 3 del flujo de agendamiento (hito 5): la cita ya quedo creada. Muestra el codigo visible (CV-{sede}-{año}-{consecutivo}), el medico asignado automaticamente y el ciclo de vida de notificaciones:
 - Confirmacion por correo: real (se envia al agendar, RF-17 parcial). Si el SMTP fallo, se dice tal cual y se ofrece reintentar.
 - Recordatorio 24 h antes (RF-18): queda "pendiente" -- el envio automatico es del incremento 5 (notificaciones), no se marca como hecho antes de que exista.
 - Asiste a tu cita: pendiente hasta el dia de la cita. Materiales vetUI: superficies de vidrio blanco (texto oscuro).

### `PaginaMascotaServicio.jsx`

Pagina 1 del flujo de agendamiento (hitos 1 y 2): mascota + servicio. La tarjeta "+ Agregar mascota" abre el mismo SidePanel de "Mis mascotas" (FormularioMascotaPanel), que AgendarCitaPage renderiza fuera del contenido `inert`; la mascota nueva queda seleccionada.

### `PaginaSedeFecha.jsx`

Pagina 2 del flujo de agendamiento (hitos 3 y 4): sede + fecha y hora.

Mapa: sin mapa interactivo embebido (seria una integracion externa nueva con API key, fuera del alcance documentado del proyecto). El recuadro de ubicacion muestra la direccion y dos hipervinculos de salida a Google Maps ("Cómo llegar" / "Ver en Google Maps"), armados con la direccion de la sede -- no hay intercambio de datos, solo abre una pestaña nueva.

### `SedeListCard.jsx`

Tarjeta de sede en formato lista (no grid) para el paso "Selecciona la sede": foto, badge "Sede principal", direccion, horario real (horario_atencion, RF-13) y amenidades. Las amenidades salen de datos reales: parqueadero y sala pet friendly las marca el administrador en Sedes; "especialidades" es el conteo de servicios que prestan los medicos de la sede (sede.model.js#listarTodas). Material: Tarjeta de cristal de vetUI (interactiva, seleccionable).

### `TimeSlotPicker.jsx`

RF-07: horarios del dia elegido, en tabs Mañana / Tarde / Noche (solo los turnos que el horario de atencion de la sede cubre ese dia). La disponibilidad la calcula el backend (GET /api/citas/disponibilidad): franjas del horario de atencion de la sede, menos las ya ocupadas por todos los medicos que prestan el servicio en esa sede, menos las que ya pasaron. Aqui solo se pinta lo que responde -- nunca se deshabilita un horario "a mano" en el frontend.

## frontend/src/components/citas

### `CalendarioSemanal.jsx`

Grid de calendario por franjas de 30 min (7:00 a 19:00), extraido de PanelCitasSeguimiento.jsx para compartirlo entre el calendario del administrador y "Mis citas" del medico. `dias` define las columnas: 6 dias (vista Semana, lunes a sabado) o 1 dia (vista Dia). Cada cita se pinta con el color de su categoria de servicio (guardado en la BD).

### `DetalleCitaPanel.jsx`

Detalle de una cita en "Mis citas" del panel del cliente, con reprogramar (RF-08) y cancelar (RF-09) cuando esta activa y es futura. Sigue la especificacion final de la autora, en orden: resumen de la mascota, numero de cita, informacion de la cita (filas con chip azul; "Reprogramar" en la fila de Fecha y hora, "Ver en mapa" en la de Sede), motivo, recomendaciones y pie con solo "Cancelar cita". Decisiones de la autora: sin "Editar cita", sin "Notas adicionales" (no existen en el sistema) y sin "Ver perfil" del medico (no hay vista de perfil). Reprogramar abre una ventana centrada (ReprogramarCitaModal), no un calendario dentro del panel. Usa el mismo calendario de mes y selector de horas del flujo de agendar (DatePickerCalendar + TimeSlotPicker), filtrado al medico de la cita: reprogramar no cambia de medico.

### `NuevaMascotaRapida.jsx`

Alta rapida de una mascota mientras el administrador agenda una cita para un cliente (NuevaCitaModal): nombre, especie y raza; el resto del perfil se completa despues en la ficha del paciente. Crea la mascota a nombre del cliente indicado y avisa con onCreada(mascota) para dejarla elegida. (Reemplaza al alta que traia el antiguo MascotaSelector.)

### `PieCancelarCita.jsx`

Pie del detalle de una cita para el personal (administrador de la sede y medico): permite cancelarla y reprogramarla. Antes solo el cliente podia hacerlo: si un medico no podia atender, nadie de la sede podia mover sus citas. El servidor decide quien puede (la sede de la cita o el medico que la atiende) y avisa al cliente por la campana; al cancelar, tambien por correo. Sigue el estandar de acciones destructivas (docs/vetui.md): boton de texto rojo a la izquierda; la confirmacion reemplaza al pie y ofrece primero la opcion segura. Reprogramar abre la misma ventana que usa el cliente (ReprogramarCitaModal): conserva el medico y solo ofrece sus horas libres.

### `ReprogramarCitaModal.jsx`

Ventana "Reprogramar cita" (RF-08). Se abre desde el boton Reprogramar del detalle de la cita, centrada sobre el panel lateral (pedido de la autora): antes el calendario se desplegaba DENTRO del panel, apretado entre los datos de la cita, y habia que desplazarse para ver las horas. Aca el calendario y las horas disponibles se ven juntos, lado a lado.

Usa el mismo calendario de mes y selector de horas del flujo de agendar (DatePickerCalendar + TimeSlotPicker), filtrados al medico de la cita: reprogramar no cambia de medico.

El estado (fecha y hora elegidas) vive en DetalleCitaPanel; esta ventana solo lo muestra. Cancelar, la X, Escape o un clic afuera la cierran sin cambiar la cita; el detalle queda abierto detras.

z-[60]: por encima del panel lateral (z-50). Se monta en <body> (portal) porque el panel usa transform, y un ancestro con transform encerraria el position:fixed de la ventana dentro de el.

## frontend/src/components/cliente

### `FormularioMascotaPanel.jsx`

SidePanel "Agregar mascota" / "Editar mascota" del cliente. Se reutiliza en "Mis mascotas" y en el flujo de agendamiento (tarjeta "+ Agregar mascota"): onGuardada recibe la mascota guardada, asi quien lo abre puede seleccionarla sin recargar.

- Foto: zona circular punteada (ZonaFoto, la misma del admin). El clic abre FotoMascotaModal (el unico modal centrado del sistema), que valida JPG/PNG de max. 5 MB y recorta. La foto recortada queda pendiente y se sube al guardar (POST /api/mascotas/:id/foto), asi "Cancelar" no deja fotos a medias.
- Obligatorios: nombre, especie y raza (lista segun la especie, SelectorEspecieRaza). Sexo (SelectorSexo, botones Hembra / Macho como en el admin), nacimiento, color y peso son opcionales.
- "Informacion medica (opcional)": texto libre que informa el dueño (alergias, medicamentos, condiciones, observaciones). No es historial clinico: sin registros por fecha ni diagnosticos.

### `FotoMascotaModal.jsx`

Editor "Foto de la mascota". Es el UNICO modal centrado del sistema (excepcion explicita pedida por la autora): todo lo demas sigue siendo <SidePanel/>. No reutilizar este patron para otros flujos.

Pasos: Subir foto (arrastrar/seleccionar JPG o PNG de max. 5 MB, o elegir una foto de otra de sus mascotas) -> Ajustar (arrastrar para encuadrar, zoom, rotar) -> Vista previa. El recorte se hace aqui, en un <canvas>, y al guardar se entrega un JPEG cuadrado de 400x400: el backend recibe la imagen final (POST /api/mascotas/:id/foto).

z-[60]: por encima del SidePanel (z-50) desde el que se abre.

### `PanelMiPerfilCliente.jsx`

"Mi perfil" del cliente (/panel/perfil), inspirado en el del medico y adaptado a lo que un cliente necesita ver o cambiar. Dos secciones:
- Informacion personal: resumen de la cuenta, datos personales editables (nombre, telefono, documento, direccion) y resumen de actividad (mascotas, citas proximas y realizadas).
- Seguridad:
 * correo: se cambia confirmando un codigo enviado AL CORREO NUEVO (asi se comprueba que existe y que es suyo);
 * contraseña: se cambia confirmando un codigo enviado a SU CORREO ACTUAL (asi se comprueba que quien la cambia es el dueño de la cuenta). Las dos tarjetas de seguridad son las compartidas con "Mi cuenta" del administrador (components/cuenta/SeguridadCuenta).

### `PanelMisCitas.jsx`

Pestaña "Mis citas" del panel del cliente (RF-15, con reprogramar RF-08 y cancelar RF-09 vía DetalleCitaPanel). Filtros por estado como pills con conteo real -- nunca un numero inventado. Cada fila: foto, mascota, fecha/hora, servicio/sede/medico, estado y "Ver detalles" (especificacion final de la autora). vetUI: chips de vidrio para filtrar, cada cita en una Tarjeta de vidrio blanco (corta el azul del fondo; la proxima mas cercana con anillo ambar). La foto de la mascota va grande, arriba del nombre y la raza.

Lista + calendario (diseño elegido por la autora): a la derecha un calendario de mes con un punto de color en cada dia que tiene cita (azul proxima, verde completada, rojo cancelada); tocar un dia deja en la lista solo las citas de ese dia, y tocarlo otra vez (o "Ver todas las fechas") quita el filtro. El filtro de dia se combina con el de estado. La lista sigue siendo lo principal: ahi se abre el detalle. En celular el calendario va arriba de la lista.

### `PanelMisMascotas.jsx`

Pestaña "Mis mascotas" del panel del cliente (cierra RF-14): antes solo se podia agregar una mascota de forma inline al agendar una cita (MascotaSelector.jsx); aqui se pueden ver todas y editarlas. El formulario (SidePanel) vive en FormularioMascotaPanel.jsx, compartido con el flujo de agendamiento. vetUI: cada mascota en una Tarjeta de vidrio blanco (corta el azul del fondo); "Agregar mascota" es la accion primaria (ambar).

## frontend/src/components/cuenta

### `SeguridadCuenta.jsx`

Las dos tarjetas de seguridad de una cuenta, compartidas por "Mi perfil" del cliente y "Mi cuenta" del administrador y del superadministrador:
- CambioCorreo: se cambia confirmando un codigo enviado AL CORREO NUEVO (asi se comprueba que existe y que es suyo).
- CambioContrasena: se cambia confirmando un codigo enviado al CORREO ACTUAL de la cuenta. Con `pideActual` (administradores) antes de enviar el codigo se exige ademas la contraseña actual. Cada pantalla pasa sus propias llamadas al servidor en `api`. Los codigos se escriben en CampoCodigo (un recuadro por digito) con la cuenta regresiva para reenviar, igual que al recuperar la contraseña.

## frontend/src/components/form

### `Campo.jsx`

Bloque de formulario consistente: label arriba, input, error debajo. El input usa `campo`, el campo unico de vetUI (styles/vetui.css): mismo borde, radio y foco que el Desplegable, el buscador, la hora y la fecha. Con `error`, aria-invalid lo pinta en rojo. Si type="password", agrega un boton de mostrar/ocultar clave dentro del input (icono de ojo).

### `CampoBusqueda.jsx`

Buscador de vetUI: reemplaza al <input type="search"> suelto. Es un `campo` mas, con la lupa a la izquierda (se reconoce como buscador sin leer el texto de ayuda) y, cuando hay algo escrito, una X propia para borrar (la X que agrega el navegador se oculta en vetui.css).

Se usa igual que el input que reemplaza: value, onChange (evento con target.value) y placeholder. `className` va al contenedor (ej. flex-1).

### `CampoCodigo.jsx`

Codigo de verificacion de un solo uso (el que llega por correo): un recuadro por digito, en dos grupos de tres separados por un guion (diseño elegido por la autora: seis digitos seguidos cuestan de leer; en dos grupos se copian sin perderse). Cada recuadro es un `campo` de vetUI: mismo borde, radio y foco ambar que el resto de los campos.

Comportamiento:
- escribir un digito pasa el foco al recuadro siguiente; Retroceso en un recuadro vacio vuelve al anterior y lo borra; las flechas mueven el foco;
- pegar el codigo completo lo reparte solo en los recuadros (sirve tambien para el autocompletado del celular: autocomplete one-time-code);
- solo acepta digitos;
- `error`: los recuadros se pintan en rojo (aria-invalid). Quien lo usa decide cuando vaciarlo; al quedar vacio con `enfocar` cambia, el foco vuelve al primer recuadro.

Se usa como un campo de texto: `valor` es la cadena de digitos y onChange recibe la cadena nueva.

### `CampoFecha.jsx`

Campo de fecha estandar del sistema: reemplaza a <input type="date"> (el calendario del navegador) en todos los formularios. Se ve como un campo mas (fecha escrita + icono) y al pulsarlo despliega debajo el mismo calendario del flujo de agendar (DatePickerCalendar).

valor / onChange trabajan con "YYYY-MM-DD" ('' = sin fecha), igual que el input nativo que reemplaza, asi quien lo usa no cambia su estado.
- minimo / maximo: se pasan al calendario (ver ahi).
- requerido: asterisco en la etiqueta; sin el, el desplegable ofrece "Borrar fecha". La validacion al enviar la hace cada formulario.
- alinear="derecha": el desplegable se ancla al borde derecho del campo (campos en la columna derecha de una grilla). El desplegable se pinta en <body> (portal) con position: fixed, pegado al campo: asi queda siempre encima de todo (tarjetas de vidrio vecinas, paneles laterales, que crean su propio contexto de apilamiento) y no lo recorta el scroll del contenedor. Se abre hacia abajo, o hacia arriba si abajo no cabe, y sigue al campo al hacer scroll.
- etiqueta (opcional): si el formulario ya pinta la suya, pasar etiquetaAccesible para lectores de pantalla.

### `CampoHora.jsx`

Campo de hora de vetUI: reemplaza al <input type="time"> del navegador, cuyo selector de hora lo dibuja el sistema operativo y no sigue la marca. Es un Desplegable con las horas del dia cada 30 minutos (el paso con que trabaja la agenda), escritas como en el resto del sistema ("8:00 a. m.").

Se usa igual que el input que reemplaza: value es "HH:MM" (24 horas) y onChange recibe un evento de forma { target: { value: "HH:MM" } }. Si el valor guardado no cae en el paso (ej. 08:15), se agrega a la lista para no perderlo.

### `Desplegable.jsx`

Lista desplegable de vetUI: reemplaza al <select> del navegador en todo el sistema. El <select> nativo abre una lista que dibuja el sistema operativo (gris, con otra fuente, distinta en cada navegador) y no se puede adaptar a la marca; esta se ve igual en todos lados: el campo es un `campo` mas (mismo borde, radio y foco ambar) y la lista es una tarjeta flotante con las opciones en Raleway, la elegida en azul de marca con un check.

Se usa igual que un <select>, para que migrar sea solo cambiar la etiqueta: recibe <option value="..."> como hijos y llama a onChange con un evento de forma { target: { value } }.

<Desplegable id="sede" value={sedeId} onChange={(e) => setSedeId(e.target.value)}> <option value="">Todas las sedes</option> {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)} </Desplegable>

Accesibilidad (patron "select-only combobox" de WAI-ARIA):
- el campo es un boton con role="combobox"; un <label htmlFor> lo nombra y un clic en la etiqueta lo enfoca;
- teclado: Enter, Espacio o las flechas abren; flechas, Inicio y Fin recorren; Enter o Espacio eligen; Escape cierra sin cambiar; Tab elige la opcion activa y sigue; escribir letras salta a la opcion que empieza asi;
- el foco no sale del campo (aria-activedescendant marca la opcion).

La lista se dibuja en <body> (portal) con posicion fija: asi no la recorta el scroll de un panel lateral, y se abre hacia arriba si abajo no hay espacio. z-[70]: sobre paneles (z-50) y ventanas (z-60).

### `EncuadreModal.jsx`

Ventana "Ajustar foto" para las fotos rectangulares que el sitio recorta (hoy: la foto de un servicio). Saca del formulario lo que la mayoria no necesita tocar: el encuadre (que parte debe verse siempre) y la descripcion de la foto. En el panel solo queda la foto y un boton "Ajustar foto"; quien quiera afinar abre esta ventana (divulgacion progresiva: lo opcional y avanzado no ocupa el formulario).

Misma forma que el editor de fotos circulares (FotoMascotaModal): ventana centrada sobre un velo, titulo con X, cuerpo y pie con Cancelar / accion principal. Trabaja sobre un borrador: nada cambia en el formulario hasta "Aplicar"; Cancelar, la X, Escape o un clic afuera lo descartan.

z-[60]: por encima del SidePanel (z-50) desde el que se abre. Se monta en <body> (portal) porque el panel usa transform, y un ancestro con transform encerraria el position:fixed de la ventana dentro de el.

### `ReenviarCodigo.jsx`

Pie del campo de codigo (CampoCodigo): mientras corre la cuenta regresiva muestra "Reenviar código en 00:42" como texto (no es clicable, asi que no reacciona al cursor); al terminar aparece el boton "Reenviar código". `cuenta` es lo que devuelve useCuentaRegresiva.

### `RelojHora.jsx`

Selector de hora con reloj de manecillas (pedido de la autora, parecido al de Google): se elige la hora tocando o arrastrando sobre el reloj y, al soltar, el reloj pasa a los minutos. Al lado van la hora y los minutos con flechas (o escritos) y a. m. / p. m. Esos dos numeros son tambien la lectura de la hora y el selector de lo que marca el reloj: el que esta en azul es el que se elige en la esfera. El reloj marca los minutos de 5 en 5; con las flechas se llega a cualquier minuto. Los controles exactos son ademas la via de teclado: el reloj es solo para el puntero. value: "HH:MM" en 24 horas. onChange recibe el nuevo "HH:MM". reinicio (opcional): al cambiar, el reloj vuelve a las horas. Movimiento: la manecilla gira por el camino corto, los numeros entran con un fundido al pasar de horas a minutos; con "reducir movimiento" no hay animaciones.

### `SelectorCategoria.jsx`

Categoria de un servicio como botones (pedido de la autora; reemplaza al <select>): una pildora por categoria con su punto de color, el mismo lenguaje de CategoryBadge que se ve en las tablas. Son pocas opciones fijas, asi que se ven todas y se elige con un clic.

Accesibilidad (igual que SelectorEspecieRaza):
- grupo de opciones (radiogroup): Tab entra a la elegida y las flechas cambian de categoria;
- la elegida no se distingue solo por el color: suma un check, borde mas grueso y texto en negrita;
- cada boton mide al menos 40px de alto.

### `SelectorEncuadre.jsx`

Encuadre de una foto que el sitio va a recortar (galeria del inicio, foto de un servicio): la foto completa con un punto que marca lo que debe quedar siempre a la vista, y debajo una vista previa del recorte. El punto se mueve con un clic sobre la foto o con los dos deslizadores (para teclado). Entrega porcentajes 0-100 por onCambiar({ focoX, focoY }), que el sitio aplica como object-position.

proporcionVista: proporcion del marco donde se mostrara (clase de Tailwind), para que la vista previa recorte igual que el sitio. mostrarVista={false}: sin la vista previa (EncuadreModal la dibuja aparte, mas grande).

### `SelectorEspecieRaza.jsx`

Especie + raza (ambas obligatorias) para crear/editar una mascota, compartido por el cliente (FormularioMascotaPanel) y el admin (PanelPacientes, MascotaSelector del calendario).

Especie: botones tipo tarjeta, altos y angostos, con el icono del animal arriba y el nombre abajo (pedido de la autora; reemplaza al <select>). Son pocas opciones fijas, asi que se ven todas de una vez y se eligen con un solo clic. Accesibilidad:
- es un grupo de opciones (radiogroup): Tab entra a la elegida y las flechas cambian de especie, como en cualquier grupo de radio;
- la elegida no se distingue solo por el color: lleva un check, el icono relleno y el texto en negrita;
- cada boton mide al menos 44px de ancho y 96px de alto (maximo 84px de ancho: siempre queda mas alto que ancho).

Especies y razas salen del catalogo que gestiona el superadministrador (Catalogos > Especies y razas; ver useCatalogoEspecies): solo las activas. Raza: lista que depende de la especie; si la especie no tiene razas (como "Otro") es un campo de texto. Si una mascota tiene una especie o una raza que ya no esta en el catalogo (escrita a mano, o desactivada despues), se conserva como opcion extra para no perderla al editar.

### `SelectorSexo.jsx`

Segmented control Hembra / Macho (reemplaza al <select> de sexo). Lo usan los formularios de mascota del admin (Detalle del paciente) y del cliente (FormularioMascotaPanel). Valores: 'hembra' | 'macho' | '' (sin elegir). Si no es requerido, un clic sobre la opcion elegida la desmarca (equivale al "Selecciona" del <select> que reemplaza).

### `ZonaFoto.jsx`

Zona de foto estandar del sistema: circulo punteado con icono de camara y "Subir foto" cuando esta vacio, o la foto recortada al circulo cuando ya hay una; debajo va la ayuda (que subir y formato) o "Cambiar foto". La usan todos los campos donde se sube una foto: mascota (cliente, admin y medico) y foto de perfil del medico. Circular (pedido de la autora): asi la foto se ve como en el resto del sistema.

Es solo la zona: el clic abre el editor de foto (FotoMascotaModal: elegir archivo, encuadrar, vista previa), que es quien valida formato y tamaño y entrega la imagen final.

### `ZonaImagen.jsx`

Zona de subida para fotos RECTANGULARES (foto de sede, galeria del inicio): la version apaisada de ZonaFoto. Rectangulo punteado con icono y "Subir foto" cuando esta vacio (clic o arrastrar el archivo), o la foto cuando ya hay una, con "Cambiar foto" debajo.

Reemplaza a los campos donde antes se pegaba un enlace: la foto siempre se sube como archivo. Valida y reduce la imagen (utils/imagen.js) y entrega el resultado por onElegir(blob); quien la usa decide cuando subirla. Las fotos circulares (mascota, medico) usan ZonaFoto.

## frontend/src/components/landing

### `BotonContacto.jsx`

Boton flotante de contacto de la pagina publica (RF-23, pedido de la autora; reemplaza a la burbuja que solo abria WhatsApp). Fijo abajo a la derecha. Al pasar el cursor o al pulsarlo se despliegan hacia arriba los accesos directos: WhatsApp y las redes que tengan enlace en el panel del superadministrador. Sin ningun canal configurado no se dibuja nada.
- Con raton: se abre al pasar el cursor y se cierra al salir; un clic lo deja fijo. En pantallas tactiles solo cuenta el toque.
- Teclado: el boton abre y cierra (aria-expanded); Escape cierra. Cerrado, los accesos quedan fuera del orden de tabulacion (inert).
- 56 px el boton y 48 px cada acceso: comodos para tocar. Deja libre el borde derecho, donde va la barra de desplazamiento.

### `canales.js`

Canales de contacto de la clinica (RF-23) que muestra la pagina publica: el boton flotante de contacto y el pie de pagina. Solo salen los que el superadministrador configuro (Pagina web > Informacion de la clinica). `color` es el del canal para su boton redondo: todos dan al menos 3:1 de contraste con el icono blanco.

### `FondoAmbientalHero.jsx`

Halos del Hero, mismo lenguaje que FondoAmbientalServicios. La base no va aca: Hero y Servicios comparten un solo degradado continuo (brand-blue-500 arriba -> brand-blue-800 al final de Servicios) en el contenedor que los envuelve (LandingPage.jsx). Estos halos se extienden por debajo del borde inferior del Hero (-bottom-[30%]) para mezclarse con los de Servicios sin dejar un corte.

La composicion cambia entre movil y desktop porque el Hero cambia: en movil el texto va arriba y la ilustracion abajo; desde lg el texto va a la izquierda y la ilustracion a la derecha.
 1. Halo brand-blue-400 detras de la ilustracion, con la misma deriva lenta que el halo central de Servicios.
 2. Profundidad brand-blue-800 detras del titulo, el parrafo y los botones: el fondo arranca en el azul claro de marca y sin esta capa el texto blanco no llegaria a contraste AA.
 3. Ambar brand-amber detras de la base de la ilustracion y en la esquina superior derecha (solo desde lg, lejos del texto).
 4. Halo brand-blue-400 abajo a la derecha, cruzando hacia Servicios (a la derecha para no aclarar el encabezado de Servicios, que va a la izquierda). + Onda organica difuminada (solo desde md).

### `FondoAmbientalServicios.jsx`

Fondo de la seccion "Servicios veterinarios": iluminacion ambiental en capas sobre el degradado base continuo Hero + Servicios (LandingPage.jsx, termina en brand-blue-800 al final de esta seccion), solo con los tokens de marca. Va detras de todo (absolute, aria-hidden, sin interaccion) y no toca el slider, que mantiene su propio overlay.

Capas, de atras hacia adelante:
 1. Base: el degradado continuo del contenedor (no va aca).
 2. Halo central brand-blue-500 al 45% (a pleno se veia demasiado claro al pasar del Hero a Servicios), el mas luminoso; deriva muy lento (32s ida y vuelta) y se detiene con prefers-reduced-motion. + Formas organicas: dos ondas grandes difuminadas (solo desde md).
 3. Halos azules secundarios: inferior izquierdo brand-blue-400 y lateral derecho brand-blue-600.
 4. Halos ambar en brand-amber (el color del boton "Agendar cita"): abajo a la derecha (el mas fuerte), lateral izquierdo a media altura, abajo al centro y lateral derecho (este solo desde md). Lejos del encabezado, que queda arriba a la izquierda. (La profundidad detras del encabezado va pegada al encabezado, en Servicios.jsx, para que lo siga en cualquier ancho.) El contenedor se extiende hacia arriba (-top-[20%]) para que estos halos se mezclen con los del Hero sin un corte en el borde entre secciones. Todos los halos se mezclan con color-mix(in oklab) y llegan a transparente en el 70-75% de su radio: no se ven bordes duros.

### `HalosAmbientales.jsx`

Halos de Sedes y Horarios, mismo lenguaje que FondoAmbientalHero/FondoAmbientalServicios. La base es el degradado continuo del landing (LandingPage.jsx); aca solo van los halos. La capa se extiende un 15% por encima y por debajo de la seccion para mezclarse con las vecinas, con mask-image en esos tramos (sin bordes rectos). Los halos van lejos de la esquina superior izquierda, donde esta el encabezado de cada seccion.

### `Hero.jsx`

Sin fondo propio: el degradado base es continuo con Servicios y vive en el contenedor que envuelve a ambos (LandingPage.jsx). Aca solo van los halos del Hero (FondoAmbientalHero.jsx). En la columna derecha va la galeria de fotos reales de la clinica (HeroGaleria.jsx), fundida con el fondo por una mascara radial.

### `HeroGaleria.jsx`

Galeria de fotos reales de la clinica en el Hero. Reemplaza a la ilustracion de la veterinaria con la perrita.

- Las fotos son las de la "Galeria" que el administrador configura en Configuracion > Galeria (GET /api/galeria: archivo, descripcion, encuadre y orden). Si no hay ninguna visible o el backend no responde, se usan las de ejemplo que vienen con el sistema (FOTOS_RESPALDO: identidadmarca/galeria -> assets/galeria, max. 1400px de ancho), asi el Hero nunca queda vacio.
- Una foto a la vez, con fundido cruzado; cambia sola cada 3s y tambien al hacer clic sobre ella (el clic reinicia el conteo).
- Sin borde ni rectangulo: una mascara lleva la foto de opaca a transparente en las orillas, asi se funde con el fondo azul del Hero (ver MASCARA). Todas las fotos se recortan al mismo marco (object-cover); `foco` es el punto de la foto que queda al centro.
- Desde lg la foto es mas ancha que su columna (130%) y se extiende hacia la derecha, hasta el borde de la pantalla en monitores comunes.
- Con prefers-reduced-motion no hay fundido (cambia de golpe).

### `Horarios.jsx`

RF-03/RF-13: horario de atencion detallado por sede (dia por dia), con el mismo dato real que RF-13 configura (horario_atencion).

Rediseño (referencia de la autora): cada sede es una tarjeta con
- la foto de la sede arriba (sede.foto_url, la misma del admin y de la seccion Sedes), fundida hacia el color de la sede, con un circulo con el icono de sede y el nombre y la ciudad en grande sobre la foto;
- un dia por fila, en un bloque centrado dentro de la tarjeta: abreviatura en una pildora del color de la sede y la hora pegada a su lado; los dias sin atencion llevan "Cerrado" en rojo;
- al final, "Agendar cita" como un boton de vidrio que se llena de ambar, de izquierda a derecha, al pasar el cursor; lleva a agendar con esa sede ya elegida (/agendar?sedeId=...). De fondo, motivos muy tenues (linea punteada, reloj).

El color se asigna por orden (la primera azul, la segunda ambar, y se repite), no por nombre de ciudad: el sistema soporta sedes nuevas (RF-13 ampliado). Hoy eso deja Bucaramanga azul y Valledupar ambar.

En computador la seccion ocupa una pantalla (landing paginado): en pantallas bajas la foto se achica y los dias pasan a dos columnas para que la tarjeta entre completa.

### `HuellasFondo.jsx`

Huellas grandes y muy tenues repartidas por todo el fondo del landing (pedido de la autora: la huella que estaba solo en Horarios, ahora en todo el fondo y en lugares que parezcan al azar). Son adorno: estaticas, no reciben el mouse y van detras de todas las secciones. Las posiciones son fijas (porcentajes del alto total del fondo, que abarca las cinco secciones), elegidas a mano para que no sigan un patron ni caigan dos juntas; al ser fijas no cambian entre visitas ni saltan al recargar. En celular se muestran solo algunas, para no ensuciar una pantalla chica. Las pantallas de sesion (AuthLayout) usan su propia lista (denso).

### `Revelar.jsx`

Scroll-reveal del landing con IntersectionObserver nativo (sin libreria nueva, ver el alcance del proyecto): el contenido entra con fade + 24px de desplazamiento vertical la primera vez que aparece en el viewport y luego deja de observarse (no se vuelve a ocultar al subir). `retraso` (ms) permite escalonar elementos de una misma seccion. Con prefers-reduced-motion el contenido se muestra siempre, sin transicion.

### `SectionHeading.jsx`

Encabezado de seccion del landing publico: titulo + AccentBar de dos tonos (azul+ambar) debajo + subtitulo opcional. Se repite en Servicios, Sedes y Horarios; `accion` permite el enlace opcional a la derecha del titulo (ej. "Ver todos los servicios →").

### `Sedes.jsx`

RF-03: informacion publica de sedes, obtenida del endpoint real GET /api/sedes. La foto de cada sede es la que el admin configuro (sede.foto_url, ver panel de Sedes) — no existe un banco de fotos reales de los edificios en identidad de marca, asi que se usa un placeholder con el icono de ubicacion mientras el admin no cargue una. La tarjeta muestra solo nombre y ciudad/direccion (el horario completo esta en la seccion Horarios, justo despues): la foto ocupa casi todo.

### `Servicios.jsx`

RF-11/RF-16: catalogo real de servicios, obtenido de GET /api/servicios. Se muestra como slider fotografico (ServicioSlider.jsx) con el nombre, la descripcion y la FOTO de cada servicio, todo de la base de datos: la foto la sube el administrador en Servicios > Editar (un servicio sin foto no aparece aca). El boton "Agendar cita" de cada slide lleva a agendar con ese servicio preseleccionado.

### `ServicioSlider.jsx`

Slider fotografico de servicios del landing (sin grilla, thumbnails ni flechas). Desde md muestra DOS servicios a la vez, lado a lado, y en cada cambio pasa a otros dos distintos; en movil, uno a la vez. Dos por vista deja cada foto en un marco casi cuadrado: asi no hay que ampliarla tanto como cuando una sola ocupaba todo el ancho con poca altura (se veia pixelada y muy recortada).

Cada servicio: foto (object-cover) -> overlay oscuro general -> degradado inferior -> nombre, descripcion y boton abajo a la izquierda. La foto y sus overlays llevan una mascara (MASCARA) que los desvanece hacia las orillas, como la galeria del Hero: la foto se funde con la tarjeta de vidrio de la seccion en vez de verse como un rectangulo dentro de otro. El texto queda fuera de la mascara. La intensidad del overlay se ajusta por foto (`oscuridad`): las fotos con fondo claro (paredes blancas, batas) necesitan mas oscuridad para que el texto blanco cumpla WCAG AA.

Como se arma: hay un "puesto" por servicio visible (1 o 2). El puesto k muestra el servicio (inicio + k) y cada puesto hace su propio fundido cruzado. Avanzar suma `porVista` a `inicio` (circular): con una cantidad impar de servicios las parejas se van corriendo y todos rotan.

Comportamiento:
- Autoplay cada 3000ms con UN solo setTimeout, recreado en cada cambio (el cleanup del efecto elimina el anterior, nunca hay dos corriendo). Toda interaccion manual incrementa `reinicio`, lo que reinicia el conteo aunque el inicio no cambie.
- Desktop: click en mitad izquierda = anteriores, mitad derecha = siguientes; hover pausa el autoplay.
- Movil: swipe horizontal con pointer events + `touch-pan-y`, asi el navegador sigue manejando el scroll vertical de la pagina (si el gesto es vertical llega `pointercancel` y no se navega).
- Teclado: flechas izquierda/derecha con el foco en el slider; el foco dentro del slider tambien pausa el autoplay.
- Lazy loading: solo se montan las <img> de los servicios visibles, los de la vista siguiente y los ya visitados.

### `TarjetaSlide.jsx`

Tarjeta de las secciones-slide del landing (Servicios, Sedes, Horarios) desde lg: el mismo vidrio claro que el boton "Conoce nuestros servicios" y que la pildora de la topbar en el landing (blanco al 12%, reflejo arriba, borde gris claro tenue (slate-300 al 25%, se disimula mas que el blanco), brillo de 1px, blur 12px + saturate 150%; ver boton-glass-claro en index.css), para que topbar, tarjetas y boton se lean como la misma familia de elementos flotantes de vidrio. Ademas oscurece un poco lo de atras (brightness 75%): el fondo de Servicios es muy luminoso y con el vidrio claro el titulo blanco no llegaba a AA. Deja ver el fondo arriba y a los costados, pero por abajo llega hasta el borde de la seccion (sin margen ni esquinas inferiores redondeadas): da la impresion de una hoja que continua hacia la seccion siguiente, como cartas que se deslizan una sobre otra. Por eso tampoco lleva borde ni sombra abajo (solo arriba y a los costados). Sube deslizandose al entrar y se desvanece al salir (slide-card, index.css). Debajo de lg es un contenedor sin estilo.

La seccion que la usa debe ser lg:flex lg:flex-col sin padding inferior desde lg: la tarjeta crece (flex-1) hasta el final de la seccion. El contenido arranca siempre a la misma distancia del borde superior (no se centra): asi el espacio entre el borde y el titulo es igual en todas las secciones, aunque tengan distinta cantidad de contenido. ultima: la tarjeta de la ultima seccion (despues solo viene el footer); no se desvanece al salir.

## frontend/src/components/layout

### `AdminHeader.jsx`

Barra superior del panel administrativo: buscador global + notificaciones + avatar/nombre/rol. Las notificaciones siguen siendo un placeholder visual (no hay backend de notificaciones en este incremento). El buscador si es funcional: busca en Servicios, Médicos y Pacientes (las 3 listas administrables con filtro de nombre); al elegir un resultado cambia a esa pestaña del sidebar y precarga el filtro de esa pantalla con el termino buscado. (El medico veterinario ya no usa este panel: su vista es /medico.)

### `AdminSidebar.jsx`

Sidebar fijo del panel administrativo, con la identidad de marca real de la clinica (ver identidadmarca/): mismo degradado de marca que el Hero del landing y las pantallas de login/registro (bg-gradient-to-b from-brand-blue-500 to-brand-blue-800, ver Hero.jsx/AuthLayout.jsx), logo completo a color (logocolor.png) expandido y el isotipo corto (logocorto.png) colapsado. El rol veterinario usa el mismo sidebar (sin "variante navy": decision de la autora) con su propio set de items (ITEMS_MEDICO).

Material: vidrio que desenfoca el fondo. Contraido queda como una pildora flotante (igual que la pildora de la topbar del cliente, en vertical), mas corta que la ventana y centrada en el eje vertical; "Cerrar sesión" queda abajo del todo dentro de la pildora.

Se puede expandir/contraer (solo iconos); el estado se recuerda entre sesiones. El ancho es fijo dentro de cada estado (no cambia con el contenido de la pagina): lo controla PanelAdminPage con un layout de alto completo (h-screen) donde solo el <main> hace scroll.

### `AuthLayout.jsx`

Envoltorio compartido por las pantallas de login, registro y recuperacion de clave. Mismo material que las pantallas del cliente (vetUI): fondo de marca con pocos toques ambar (FondoVetui variante "sesion"), muchas huellas tenues como las del landing y el formulario en una tarjeta de vidrio blanco flotante (texto oscuro: AA sobre el vidrio). El enlace de abajo va directo sobre el fondo: por eso textoDirecto.

### `BarraPagina.jsx`

Barra de desplazamiento de la PAGINA, flotante (pedido de la autora): una pildora ambar con brillo, como los botones "Agendar cita", que flota sobre el contenido sin canal ni franja de fondo.

Por que es un componente y no solo CSS: la barra nativa de la pagina siempre reserva una franja con fondo propio (no puede ser transparente sobre el contenido). Entonces se oculta la nativa (clase barra-flotante en <html>, ver vetui.css) y se dibuja esta encima, atada al scroll real: rueda, teclado, trackpad y los saltos del sistema (landing paginado, useAnclaTopbar) siguen siendo el scroll nativo; esto solo lo muestra y permite arrastrarlo.

- Solo con mouse (hover + puntero fino). En pantallas tactiles se deja la barra del sistema, que ya es flotante.
- Se oculta sola si la pagina no tiene scroll (ej. panel administrativo, que se desplaza por dentro: ahi aplica la barra CSS de vetui.css).
- En los topes no se ve (pedido de la autora): arriba de todo o al final la pagina no puede seguir en ese sentido, asi que la barra se apaga un momento despues de llegar y vuelve apenas se desplaza otra vez. Sigue ahi: pasar el mouse por el borde derecho la muestra para arrastrarla.
- La misma regla vale para las barras de ADENTRO (paneles laterales, contenido del panel administrativo, tablas, areas de texto), que son nativas y se pintan por CSS: este componente escucha el scroll de cualquier elemento y le pone data-barra-activa solo mientras no esta en un tope; vetui.css muestra la barra unicamente con ese atributo.
- aria-hidden: es un adorno del scroll; el teclado mueve la pagina igual.
- z-45: sobre la topbar (z-40), debajo de paneles y dialogos (z-50).

### `MenuMovil.jsx`

Menu de la barra superior en celular y tableta (por debajo de md). Antes, en pantallas pequeñas la barra solo dejaba el logo y el boton de agendar: no habia como llegar a Servicios/Sedes/Horarios ni a "Iniciar sesion", y con la sesion abierta no habia perfil ni "Cerrar sesion". El boton vive en la barra; la hoja se dibuja en <body> (portal) para no quedar dentro del backdrop-filter de la pildora, encima de todo (z-[70]).

### `Navbar.jsx`

Topbar publica (landing, /agendar y /panel del cliente): texto blanco y el boton "Agendar cita" en ambar (brand.amber, texto slate-900). Cada pagina que la usa empieza con un banner en degradado azul que pasa por detras de ella (-mt-24 pt-24): el Hero en la landing y el banner de encabezado en /agendar y /panel.

Topbar tipo pildora, con 2 estados:
- Estado 1 (scroll = 0): fondo transparente, sin borde, sin sombra y sin blur. El banner pasa por detras (-mt-24), asi que lo que se ve es su propio degradado continuo: no hay un bloque "topbar" que delimitar. Solo el contenido (enlaces, logo grande, botones) flota encima.
- Estado 2: se despega 12px del borde, se angosta (maximo ~68rem, centrado) y baja a 64px de alto, azul profundo translucido con blur y sombra. Radio fijo de 32px en todo el recorrido (= mitad del alto final, asi que al llegar es una capsula exacta). El paso entre ambos es progresivo: `t` va de 0 a 1 en los primeros DISTANCIA_FLOW_PX de scroll y se aplica directo al estilo (via ref, dentro de requestAnimationFrame) sin re-renderizar React. El <header> mide siempre 96px (el banner se mete por debajo con -mt-24) y es pointer-events-none: solo la pildora recibe clicks, asi el espacio transparente alrededor no bloquea el contenido que pasa por detras.

Layout en 3 columnas (grid 1fr | auto | 1fr): enlaces de seccion a la izquierda, logo al centro y acciones a la derecha. Al ser las dos columnas laterales 1fr, el logo queda centrado respecto al ancho total de la barra aunque ambos grupos midan distinto. El logo arranca grande (logoblanco.png, el que antes estaba en el Hero) y con el scroll se cruza con el logo corto: ambos leen la variable CSS --flow (0..1) que escribe aplicarFlow, asi que no hay un segundo listener de scroll.

### `Notificaciones.jsx`

La campana: boton con el numero de avisos sin leer y, al pulsarlo, el panel con las ultimas notificaciones de quien inicio sesion (cita agendada, reprogramada o cancelada, mascota registrada, recordatorio del medico y recordatorio previo a la cita). Es del cliente y del medico (Navbar); el administrador y el superadministrador no tienen notificaciones.

- Se actualiza sola cada minuto y al abrir el panel.
- Pulsar un aviso lo marca como leido y lleva a donde corresponde (onIr recibe el enlace, una ruta).
- "Marcar todas como leídas" limpia el contador.
- Se cierra con Escape o con un clic afuera.
- Lo no leido no se distingue solo por color: lleva un punto y negrita, y el boton anuncia el numero a los lectores de pantalla. El panel es el mismo vidrio azul translucido del menu del perfil de la pildora (pedido de la autora). Se dibuja en <body> (portal), no dentro de la pildora: ahi quedaria anidado en otro vidrio y el navegador solo desenfocaria la pildora, no la pagina de atras. Por eso se ubica a mano, debajo de la campana, y se reubica al desplazar o cambiar el tamaño.

## frontend/src/components/medico

### `AgendarCitaMedicoPanel.jsx`

SidePanel "Agendar nueva cita" del medico veterinario, a nombre de un cliente. La cita queda SIEMPRE con este medico y en su sede (el backend lo fuerza). 4 pasos dentro del panel:
 1. Paciente y mascota (buscador de dueño + mascota de ese dueño)
 2. Servicio (solo los que presta este medico)
 3. Fecha y hora: el mismo calendario + horas libres de /agendar, con la disponibilidad de ESTE medico (GET /api/citas/disponibilidad con medicoId) -- no un input libre, asi no se agenda en una hora ocupada (decision de la autora).
 4. Confirmar "Notas adicionales" se guarda como el motivo de la cita (lo que el cliente ve como "Motivo de la consulta"). pacienteInicial (opcional): abre con ese dueño ya elegido (boton "Agendar" de Mis pacientes).

### `CrearRecordatorioPanel.jsx`

SidePanel "Crear recordatorio" del medico, siempre para una mascota concreta (contexto arriba: foto, nombre, especie · raza y dueño).
- 5 tipos seleccionables (medicacion, control, vacunacion, desparasitacion, otro); el titulo se sugiere segun el tipo mientras el medico no lo haya escrito a mano.
- Fecha y hora futuras; descripcion opcional (max. 300).
- Al guardar, el backend avisa al dueño por correo (decision de la autora). Debajo se listan los recordatorios de esa mascota. onVerPerfil (opcional): enlace "Ver perfil" para volver al detalle del paciente.

### `DetalleCitaMedicoPanel.jsx`

Detalle de una cita en el panel del medico: mascota con su perfil e informacion medica que escribio el dueño, datos de la cita y contacto del dueño. Desde el pie el medico puede cancelar o reprogramar la cita (RF-08/RF-09, PieCancelarCita). `acciones` (opcional) agrega botones al pie (ej. "Crear recordatorio"). Tambien lo usa el calendario del administrador de sede, con `mostrarMedico` (la sede ve citas de varios medicos) y sin la informacion medica (`mostrarInfoMedica={false}`), que es solo para el medico.

### `DetallePacienteMedicoPanel.jsx`

"Detalle del paciente" en el panel del medico. Misma estructura que la version del admin (avatar de iniciales, estado, tabs Informacion / Mascota(s) / Citas) con dos diferencias decididas por la autora:
- Los datos del dueño son de SOLO LECTURA (sin editar ni activar).
- "+ Agregar mascota" abre el mismo formulario embebido del admin (MascotasPaciente), para la mascota que llega en plena consulta. El medico edita datos de mascotas pero no las elimina. `accionesMascota` pasa acciones extra al menu ⋮ de cada mascota (ej. "Crear recordatorio").

### `PanelDisponibilidadMedico.jsx`

"Mi perfil > Mi horario": el medico CONSULTA su horario de trabajo y sus bloqueos. No los edita: desde el 11 oct 2026 (decision de la autora) los define el administrador de su sede en Medicos > Horario (admin/HorarioMedicoPanel.jsx).
- Horario semanal: dias, horas y pausa. Sin horario propio, atiende con el horario de atencion de su sede.
- Bloqueos vigentes: vacaciones, permisos u horas puntuales sin atencion.

### `PanelMiPerfilMedico.jsx`

"Mi perfil" del medico veterinario (/medico/perfil). Presentacion vetUI, como la vista del cliente: secciones en el control segmentado de vidrio (Pestanas) y cada bloque en una tarjeta de vidrio blanco. Secciones:
- Informacion personal: resumen con foto (editor de foto reutilizado del de mascotas), datos personales editables, cambio de correo con codigo de verificacion enviado al correo nuevo, cambio de contraseña, sedes asignadas y resumen de actividad.
- Informacion profesional: titulos, registro, años de experiencia y biografia editables; especialidades y servicios de SOLO LECTURA (los asigna el administrador). Sin formacion academica, certificaciones ni documentos (fuera de este incremento).
- Mi horario (solo consulta): ver PanelDisponibilidadMedico.

### `PanelMisCitasMedico.jsx`

"Mis citas": pestaña de inicio de la vista del medico (/medico). Solo sus citas (GET /api/administracion/citas ya las filtra por medico). Presentacion vetUI, igual que la vista del cliente: va directo sobre el fondo de marca, con los indicadores, el calendario y las tarjetas de la derecha en vidrio blanco (TarjetaDato / Tarjeta) y los controles en vidrio (Pestanas, boton-glass-claro). El titulo y "Agendar nueva cita" los pone la pagina (PanelMedicoPage), junto a las pestañas.
- 4 KPIs reales: citas esta semana, citas hoy, proximas citas y pacientes (mascotas) atendidos este mes.
- Vistas Semana / Dia (mismo grid del admin, CalendarioSemanal) y Agenda (lista agrupada por dia de la semana visible).
- Columna derecha: mini calendario, citas de hoy y conteo real por categoria de servicio de la semana visible (colores de la BD). "Agendar nueva cita" abre AgendarCitaMedicoPanel (cita con el mismo medico, en su sede).

### `PanelMisPacientesMedico.jsx`

Presentacion vetUI, igual que la vista del cliente: va directo sobre el fondo de marca, con indicadores en TarjetaDato, el filtro de estado en Chips con conteo real y una tarjeta de vidrio blanco por mascota (como "Mis citas" del cliente) en vez de una tabla. "Mis pacientes" del medico: dueños y mascotas que ha atendido o que tienen cita con el (una fila por mascota). Sin "+ Agregar paciente": el medico no crea cuentas de cliente (decision de la autora); solo agrega mascotas a un paciente existente desde su detalle.
- KPIs reales (sobre todos sus pacientes, no dependen de filtros).
- Filtros: busqueda (dueño o mascota), sede de las citas, estado del dueño y "Limpiar filtros".
- "Agendar" en la columna de proxima cita abre el panel de agendar con ese dueño ya elegido.

## frontend/src/components/ui

### `CategoryBadge.jsx`

Pill de categoria/especialidad: fondo pastel + texto/punto del tono saturado de la paleta `category` (ver seccion 1.1 del sistema de diseno). Los 7 colores tienen 2 variantes precalculadas (fondo ~90% blanco, texto/punto en el tono saturado); el ejemplo "Preventiva" del documento (bg #D6F5EA / text #2E7A6B) corresponde a `teal`. El texto de cada color cumple contraste 4,5:1 sobre su fondo (WCAG AA).

### `EtiquetaSexo.jsx`

Sexo de la mascota con su icono (Phosphor), en vez de los caracteres de texto que algunos equipos dibujan como emoji.
- IconoSexo: solo el icono.
- EtiquetaSexo: icono + "Hembra" / "Macho". Sin sexo conocido no dibuja nada.

### `KPICard.jsx`

Tarjeta de indicador: icono en circulo de color, numero grande, etiqueta. `detalle` (opcional) agrega una segunda linea chica bajo el valor (ej. la hora de la proxima cita, debajo de su fecha). `onClick` (opcional) agrega un boton circular de flecha para navegar al detalle -- ninguno de los dos cambia el comportamiento de los paneles que no los pasan.

### `PageHeader.jsx`

Encabezado estandar de pantalla: titulo + subtitulo a la izquierda, boton de accion primaria (amber) a la derecha. `actionLabel` es opcional (algunas pantallas, como Configuracion, no tienen accion primaria); `actionColor` permite el caso especial de Reportes, donde el boton principal es azul en vez de amber.

### `SidePanel.jsx`

Panel lateral derecho, usado por todos los formularios/detalles del sistema. Lleva overlay oscuro de fondo (cambio pedido por la autora, reemplaza la regla anterior de "sin overlay"): oscurece el contenido de atras y un clic sobre el, o la tecla Escape, cierra el panel. El padre sigue marcando su contenido principal `inert` mientras esta abierto (ver cualquier PanelXxx.jsx que lo use) para que tampoco se pueda llegar a el con el teclado. Material vetUI: velo azul detras y el panel en cristal fuerte, flotando con margen y esquinas redondeadas (no pegado al borde de la ventana). `footer` (opcional) fija los botones de accion abajo, fuera del scroll del cuerpo -- si no se pasa, el panel queda sin pie fijo. z-50: mas alto que el navbar publico (Navbar.jsx, sticky z-40) -- con z-30 el navbar tapaba el encabezado del panel (titulo + boton de cerrar) en /panel y en el landing, porque ambos arrancan en y=0. El overlay tambien es z-50 pero va antes en el DOM, asi queda debajo del panel y encima del navbar.

### `StatusBadge.jsx`

Pill de solo lectura para el estado de una cita en "Mis citas" del panel del cliente: 3 estados (proxima/completada/cancelada), a diferencia de StatusToggle.jsx (que es un interruptor on/off de activo/inactivo). Reutiliza brand.blue/green/red, no colores nuevos. Proxima = azul, Completada = verde, Cancelada = rojo: version final de la autora, verificada por muestreo de pixeles (reemplaza la inversion temporal a verde/azul).

### `StatusToggle.jsx`

Toggle estandar de "activo/inactivo" en todo el sistema: verde encendido, gris apagado (decision de diseno, ver el alcance del proyecto/mockups: se estandariza en verde para evitar el azul, que queda solo para elementos interactivos/de navegacion).

### `Tabs.jsx`

items: [{ id, label, icon? }] -- icon opcional (componente de icons.jsx). sobreVidrio: las pestañas van directo sobre la hoja translucida del panel (texto blanco, activa con linea ambar). Sin el, van sobre una superficie clara (panel lateral, tarjeta blanca): texto oscuro, activa en azul.

## frontend/src/components/vetui

### `Boton.jsx`

Botón de vetUI. La jerarquía va por variante, no por tamaño: primario ámbar glass. La acción principal de la pantalla (una sola por vista: Agendar cita, Continuar, Guardar). secundario vidrio claro. Acciones secundarias sobre fondo oscuro. inverso blanco glass. La principal sobre una banda azul. contorno borde azul. Secundaria sobre cristal (superficie clara). peligro rojo translúcido. Salir/cancelar sobre fondo oscuro. peligro-claro borde rojo. Salir/cancelar sobre cristal. fantasma solo texto, para acciones terciarias. `as` permite usarlo como Link o <a> sin perder el estilo. `icono` va antes del texto e `iconoFinal` después (ej. flecha de "Continuar").

### `Datos.jsx`

Piezas para mostrar datos: TarjetaDato indicador (KPI) en vidrio blanco (como las tarjetas de contenido de la app): icono, valor, etiqueta. Si recibe onClick, toda la tarjeta es un botón. Insignia etiqueta de estado de solo lectura. Para citas: estado="proxima" | "completada" | "cancelada"; o un `tono` genérico con `children`. Insignia: pildora clara con texto oscuro (-800), legible tanto sobre vidrio como sobre cristal.

### `Estados.jsx`

Estados de una vista, todos para fondo oscuro (vidrio o fondo): Aviso mensaje en línea. tono: info | ok | alerta | error. EstadoVacio no hay elementos todavía (lista vacía). EstadoError falló la carga, con botón Reintentar. Esqueleto marcador de carga (bloques que pulsan).

### `Formulario.jsx`

Campos de vetUI para superficies de vidrio (sobre fondo oscuro): el campo es casi blanco con texto oscuro (los datos siempre se leen oscuro sobre claro) y la etiqueta es blanca. Foco: anillo ámbar. Dentro de paneles laterales (cristal fuerte) se usan los campos de form/Campo.jsx, que ya son oscuros sobre claro.

### `Navegacion.jsx`

Controles de navegación entre vistas, sobre fondo oscuro: Pestanas control segmentado de vidrio (vistas hermanas: Mis citas / Mis mascotas). La activa es una píldora blanca. Chips filtros con conteo (Todas, Próximas...). Activo blanco, inactivos vidrio claro. items: [{ id, etiqueta, icono?, conteo? }]

### `Superficies.jsx`

Las tres capas de material de vetUI como componentes.

FondoVetui: fondo de página. Degradado de marca (brand-blue-600 arriba, azul profundo desde ~32rem; arranca un tono más hondo que el Hero del landing porque las pantallas de la app tienen texto chico arriba y sobre brand-blue-500 no llega a AA) y halos de luz fijos (no se desplazan con el scroll), que son lo que el vidrio deja ver difuminado. Envuelve la página completa, incluida la topbar (transparente arriba).

Superficie: contenedor sobre el fondo (secciones, resúmenes). tono="vidrio" (por defecto) vidrio claro, texto blanco (landing). tono="blanco" vidrio blanco, texto oscuro (pantallas de la app: corta el azul del fondo). Lo de adentro se adapta solo.

Tarjeta: objeto o contenido. Regla de material (como el landing): material="vidrio" tarjetas que van directo sobre el fondo (indicadores, citas, mascotas): el mismo vidrio de las tarjetas de seccion del landing, texto blanco, radio 28px. material="blanco" igual pero en vidrio blanco (texto oscuro): las tarjetas de Mis citas / Mis mascotas. material="cristal" (por defecto) tarjetas DENTRO de una superficie de vidrio (opciones de agendar, sedes): texto oscuro, como las tarjetas de sedes/horarios del landing. `tono` celeste/crema, `seleccionada` (anillo ámbar + check) e `interactiva` (hover que ilumina) para opciones elegibles; `destacada` (anillo ámbar sin check) para resaltar sin indicar elección.

### `Superpuestos.jsx`

Lo que se abre encima de la página, en cristal fuerte sobre un velo azul difuminado: PanelLateral formularios y detalles. Flota a 12px de los bordes, con esquinas redondeadas (no pegado al borde de la ventana). `footer` fija las acciones abajo, fuera del scroll. Dialogo confirmación de una sola pregunta, centrado. Ambos: Escape o clic en el velo cierran; z-50 (encima de la topbar, z-40). Quien los abre marca su contenido `inert` mientras están abiertos, para que el teclado no llegue a lo de atrás.

### `Textos.jsx`

Encabezados de vetUI (escala tipográfica, Raleway): EncabezadoPagina antetítulo + h1 + descripción, sobre el fondo. `acciones` a la derecha, `imagen` decorativa. `agrupado`: texto e imagen forman un solo bloque centrado en la pagina (en vez de texto a la izquierda e imagen contra el borde derecho). TituloSeccion h2 de una Superficie (vidrio), con número de paso opcional. Sobre fondo oscuro el texto es blanco (títulos) y blue-50/blue-100 (cuerpo): ambos en AA sobre vidrio y fondo.

## frontend/src/demo

### `activar.js`

Demostracion sin servidor (GitHub Pages). Solo entra en la compilacion de demostracion (VITE_DEMO=1, ver vite.config.js y main.demo.jsx): la plataforma normal no carga este archivo.
- Responde las peticiones a /api con las lecturas grabadas en datos.json (frontend/demo/grabar.mjs). Nada se guarda: toda escritura responde con un aviso.
- Fija el reloj en el momento de la grabacion, para que las citas de ejemplo sigan cayendo en "esta semana".
- Muestra un aviso con las cuentas de ejemplo.

## frontend/src/hooks

### `useAnclaTopbar.js`

Scroll en dos posiciones para el arranque de una pagina con <Navbar/>. Lo usan todas las que no son el landing (/agendar, /panel, /vetui); el landing tiene su propio paginado por secciones (usePaginadoPorRueda). Es como ese paginado pero con una sola parada:
- arriba de todo (scroll 0): topbar transparente y stepper superior;
- el "ancla": la pildora de la topbar ya formada y el contenido marcado con data-ancla-topbar justo debajo de ella (respeta su scroll-margin-top, asi la pildora no tapa las tarjetas). Entre las dos no se puede quedar: un gesto de rueda hacia abajo desde arriba lleva directo al ancla, y uno hacia arriba desde el ancla vuelve arriba. Asi nunca se ve la transicion de la topbar a medio camino. Del ancla hacia abajo el scroll es el normal del navegador.

Solo desde lg (computadoras con mouse); Ctrl + rueda (zoom) no se toca, ni la rueda sobre un elemento con scroll propio (paneles laterales, listas). Las teclas de scroll (flechas, Av/Re Pag, espacio) hacen el mismo salto, salvo cuando el foco esta en un campo o control que las usa. El landing resuelve el teclado con scroll-snap de CSS, pero aca no sirve: obligaria a engancharse siempre a una de las dos posiciones, y del ancla hacia abajo el scroll tiene que ser libre. Si se llega a la zona intermedia por otro medio (barra de scroll), al terminar el scroll se completa el salto en el sentido en que se venia.

### `useCatalogoEspecies.js`

Especies y razas que ofrecen los formularios de mascota. Vienen del catalogo que el superadministrador gestiona (Catalogos > Especies y razas): solo las activas. Se piden una vez por visita y se comparten entre todos los formularios (cache en memoria). Mientras carga, o si el servidor no responde, se usa la lista que venia en el codigo (utils/razas.js), para que el formulario nunca quede vacio. Devuelve [{ nombre, icono, razas: [nombres] }].

### `useCuentaRegresiva.js`

Cuenta regresiva en segundos para "Reenviar codigo en 00:42". El servidor no reenvia un codigo antes de un minuto: el contador le dice a la persona cuanto falta en vez de dejarla pulsar un boton que no haria nada. iniciar() arranca (o reinicia) la cuenta; `restantes` llega a 0 al terminar y `texto` la da en formato mm:ss.

### `useInfoClinica.js`

Informacion general de la clinica (RF-23) para la pagina publica: el WhatsApp de la burbuja y las redes del pie de pagina. Se pide una vez por visita y se comparte (cache en memoria). Mientras carga, o si el servidor no responde, devuelve null: la burbuja y las redes simplemente no salen.

### `useLogos.js`

Logotipos de la clinica en toda la pagina (barra superior y su animacion, pantallas de sesion, pie de pagina, menu del panel e icono de la pestaña). El superadministrador puede reemplazar cada uno desde Pagina web > Logotipos; el que no se ha reemplazado usa el archivo original que viene con el sistema (assets/).

useLogos() devuelve { principal_blanco, principal_color, corto_color, corto_blanco, icono } con la direccion de la imagen que toca mostrar. Se piden al servidor una vez por visita y se comparten entre todos los componentes. Lo ultimo que respondio el servidor se guarda en el navegador: asi, al volver, el logotipo propio sale desde el primer instante y no se ve primero el original.

### `usePaginadoPorRueda.js`

Landing paginado: cada gesto de rueda del mouse (o del trackpad) lleva a la seccion siguiente o anterior, como slides. Solo desde lg (pantallas de computadora); en movil la pagina tiene scroll normal.

El scroll snap de CSS (index.css, html.snap-landing) ya engancha cada seccion para teclado, barra de scroll y enlaces, pero con la rueda un gesto corto puede volver a la seccion actual en vez de avanzar, segun el navegador y el dispositivo. Por eso la rueda se maneja aca:
- cada gesto mueve exactamente una seccion (scroll suave nativo);
- mientras la pagina se mueve, y hasta que el gesto termina (la inercia del trackpad sigue mandando eventos ~1s), los eventos se ignoran, asi un solo gesto nunca saltea secciones;
- Ctrl + rueda (zoom del navegador) no se toca. Las secciones se marcan con el atributo data-slide.

## frontend/src/pages

### `AgendarCitaPage.jsx`

Flujo de agendamiento del cliente (RF-06 agendar indicando sede, RF-07 disponibilidad por sede). 5 hitos agrupados en 3 paginas:
 1. Mascota + Servicio
 2. Sede + Fecha y hora
 3. Confirmacion Todo el estado de las selecciones vive aqui (no en cada pagina) para que "Cambiar" en el resumen lateral regrese a una pagina sin perder lo ya elegido en las demas.

### `CrearClavePage.jsx`

Primera entrada con clave temporal (/crear-clave). Las cuentas que crea otra persona (el superadministrador crea administradores y medicos; el administrador de sede crea medicos) nacen con una contraseña generada por el sistema y enviada por correo. Por seguridad, antes de usar el sistema la persona debe establecer aca su propia contraseña. No es solo una pantalla: mientras no lo haga, el servidor rechaza todo lo demas con ese inicio de sesion (ver backend, auth.middleware.js).

### `GuiaVetuiPage.jsx`

Guía visual viva de vetUI (ruta /vetui): cada fundamento y componente del sistema de diseño renderizado con el código real, sobre el fondo real. Sirve para revisar cambios del sistema en un solo lugar y como referencia para construir pantallas nuevas. Documentación: docs/vetui.md.

### `LegalPage.jsx`

Politica de privacidad (/privacidad) y aviso legal (/aviso-legal). BORRADOR redactado a partir de lo que el sistema realmente guarda y hace (Ley 1581 de 2012 y Decreto 1377 de 2013, Colombia). Antes de publicar el sitio debe revisarlo la Universidad de Santander y alinearse con su politica institucional de tratamiento de datos personales.

### `OlvideClavePage.jsx`

Recuperacion de contraseña por codigo, para cualquier rol. Dos pasos en la misma pantalla: 1) pedir el codigo por correo, 2) confirmarlo junto con la nueva contraseña. El codigo se escribe en CampoCodigo (un recuadro por digito); si es incorrecto los recuadros se ponen en rojo, se vacian y el foco vuelve al primero. "Reenviar código" espera el mismo minuto que exige el servidor entre envios.

### `PanelAdminPage.jsx`

Panel interno (/admin). Dos roles, cada uno con sus modulos (el menu lateral, AdminSidebar, muestra los mismos). El medico veterinario ya no entra aca: tiene su propia vista en /medico (PanelMedicoPage).
- Superadministrador: administra el sistema completo sin programar (sedes, cuentas, catalogo de servicios, pagina web, catalogos, datos y reportes de todas las sedes). No opera citas.
- Administrador de sede: el dia a dia de SU sede (inicio, citas, medicos, pacientes, horario, reportes de su sede; los servicios, solo consulta). Los permisos reales los impone el servidor; aca solo se decide que mostrar.

### `PanelClientePage.jsx`

Panel del cliente autenticado (Incremento 4, modulo de Clientes): "Mis citas" (RF-06/RF-08/RF-09/RF-15) y "Mis mascotas" (RF-14), con vetUI (floating glass): fondo de marca, encabezado con la foto del Hero, indicadores en vidrio blanco (TarjetaDato), pestañas de vidrio y la accion primaria "Agendar nueva cita" en ambar.

### `PanelMedicoPage.jsx`

Vista del medico veterinario (/medico y /medico/perfil). Decisiones de la autora: el medico deja el panel tipo dashboard de /admin (que queda solo para el administrador de sede y el superadministrador) y pasa a una pagina con la MISMA estructura que la del cliente (PanelClientePage): fondo de marca a pagina completa, barra flotante en pildora (Navbar), encabezado con saludo y pestañas de vidrio.
- Dos pestañas: "Mis citas" y "Mis pacientes" (?tab=pacientes).
- "Mi perfil" NO es una pestaña: se abre desde el menu del avatar de la pildora y vive en /medico/perfil (seccion="perfil"), con sus tres secciones de siempre.
- Los indicadores son los de cada pestaña (no hay una fila fija arriba). Es un cambio de presentacion: lo que el medico puede hacer y el servidor no cambian.

### `RegistroPage.jsx`

RF-01: registro autoservicio de clientes. Dos pasos en la misma pantalla: 1) datos de la cuenta; 2) codigo de 6 digitos que llega al correo. La cuenta se crea solo cuando el codigo es correcto, asi el correo de toda cuenta es de quien la creo. El codigo se escribe en CampoCodigo, igual que en la recuperacion de contraseña (OlvideClavePage).

## frontend/src/utils

### `guardiaSalida.js`

Permiso para salir de una pagina con trabajo sin terminar, para las salidas que NO pasan por el router (hoy: "Cerrar sesion", que recarga la pagina completa). Las navegaciones normales (enlaces, atras del navegador) las frena useBlocker en la propia pagina.

La pagina con algo pendiente (agendar una cita a medias) registra una guardia; quien va a sacar al usuario llama a salirConPermiso(accion): con guardia, es ella quien decide si ejecuta la accion (tras confirmar con el usuario); sin guardia, la accion corre de una vez.

### `horarioTexto.js`

Convierte el horario real de una sede (horario_atencion, RF-13) en lineas de texto legibles, agrupando dias consecutivos con el mismo rango (ej. "Lunes a viernes: 08:00 - 17:00"). Usado por el landing publico (Sedes y Horarios) para no mostrar un horario escrito a mano.

### `iconoServicio.js`

Icono de linea para cada servicio del catalogo (tarjetas del flujo de agendamiento). Los servicios los crea el administrador con nombre libre, asi que se busca por palabra clave; si ninguna coincide, se usa el estetoscopio generico.

### `imagen.js`

Prepara una foto rectangular antes de subirla (galeria del inicio, foto de sede): valida formato y peso, y la reduce en el navegador a un JPEG de maximo `ladoMaximo` px por lado. Asi una foto de camara de 10 MB llega al backend pesando unos cientos de KB y el sitio la carga rapido. Las fotos circulares (mascota, medico) no pasan por aca: las recorta FotoMascotaModal.

### `razas.js`

RESPALDO: desde el incremento 8b las especies y razas viven en la base de datos y las gestiona el superadministrador (Catalogos). Esta lista es la semilla de esas tablas y lo que se muestra si el servidor no responde (ver hooks/useCatalogoEspecies.js). Lo que sigue describe el origen: Catalogo de especies y razas para el perfil de mascota (decision de la autora: especie y raza obligatorias, raza como lista desplegable que depende de la especie). Es un catalogo estatico del frontend, no una tabla: se guarda el mismo texto de siempre en mascota.especie / mascota.raza, asi las mascotas ya registradas no se rompen. Cada lista incluye "Criollo / mestizo" y "No sé la raza". "Otro" (conejo, hamster...) no tiene lista: se escribe a mano.

### `rutas.js`

`servicioId` (opcional) preselecciona el servicio en el flujo de agendamiento (/agendar) -- lo usan las tarjetas de servicio del landing. Un invitado (sin sesion) se manda primero a Registrarse, no a Iniciar sesion: la mayoria de quienes agendan por primera vez no tienen cuenta todavia, y RegistroPage ya tiene un link a "Inicia sesión" (con este mismo "next") para quien si la tiene. servicioId / sedeId (opcionales): llegan a /agendar ya preseleccionados (tarjetas de Servicios y de Horarios del landing).
