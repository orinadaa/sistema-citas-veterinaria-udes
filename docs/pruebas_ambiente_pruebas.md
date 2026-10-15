# Pruebas en el ambiente de pruebas (AWS)

**Informe vigente:** batería funcional final del 15 de octubre de 2026 sobre el commit `056358c`, la versión publicada ese día en `https://citas-veterinaria-udes.duckdns.org` (Amazon EC2 `t3.micro` en us-east-2, Ubuntu 24.04, PostgreSQL 18, Node.js 22 con PM2 y Nginx con certificado de Let's Encrypt).

Resultado: **321 de 321 casos aprobados**. La batería repite los casos funcionales del 14 de octubre con las reglas vigentes y agrega las funciones nuevas: citas por reagendar (RF-42), festivos (RF-43) y validación de formularios con teléfono obligatorio (RF-44).

La batería del 14 de octubre (290 casos sobre `a364595`) se conserva al final como anexo histórico, junto con las comprobaciones intermedias del 14 y el 15 de octubre.

## Batería final del 15 de octubre de 2026

### Versión probada

- Antes de probar se publicó `056358c` en AWS: respaldo de la base (`/var/backups/citas-udes/antes-de-056358c-*.dump`) y del código, extracción del código sin tocar `.env`, `.env.production.local` ni `uploads`, `npm ci`, compilación y reinicio de PM2. La versión no trae migraciones nuevas.
- `056358c` incluye el teléfono obligatorio de diez dígitos al crear médicos y cuentas de personal, y las correcciones del instalador descritas más abajo.

### Cómo se probó

- **Instancia aislada en el mismo servidor de AWS.** Las pruebas que crean o modifican datos se ejecutaron contra una segunda instancia del mismo código (`056358c`) en el mismo EC2, en el puerto 4101 y solo en `127.0.0.1`, con una base propia (`citas_udes_qa_20261015`) creada desde `database/esquema.sql`, `database/datos_iniciales.sql` y los datos de ejemplo ficticios (`@demo.udes.co`). Usó la misma configuración que la instancia publicada (`NODE_ENV=production`, `TRUST_PROXY=1`, zona horaria America/Bogota); se cambiaron solo la base, el puerto y la clave de sesión. Así ninguna prueba tocó las cuentas ni las citas de la base publicada.
- **Acceso:** desde el equipo de la autora por un túnel SSH. Cada petición lleva las cabeceras que agrega Nginx (`X-Forwarded-Proto: https` y `X-Forwarded-For`). Cada perfil de la prueba usa su propia dirección de origen, como si fueran equipos distintos; las pruebas de límites de intentos usan una dirección aparte.
- **Correos:** la instancia aislada reemplaza el envío SMTP por una captura en memoria. Se verificó que cada correo se genera, a quién va dirigido, su asunto y su contenido (códigos, contraseña temporal, fechas, sede, mascota), sin enviar nada a buzones reales. La entrega real por Gmail ya se había comprobado el 14 de octubre (casos CO-00 a CO-19 del anexo).
- **Sitio público:** las pruebas de despliegue y de seguridad del servidor web (HTTPS, cabeceras, CORS, archivos expuestos, tamaño de peticiones, puertos y TLS) se hicieron contra el dominio publicado y fueron solo de lectura.
- **Interfaz:** la interfaz final se compiló en modo de pruebas (`VITE_AMBIENTE=pruebas`) y se sirvió en el equipo de la autora conectada a la instancia aislada. Microsoft Edge sin ventana, controlado por el protocolo de depuración, revisó 34 pantallas en escritorio (1366x820) y teléfono (390x844), las pantallas nuevas de reagendar y de festivos, y un agendamiento completo escribiendo en los formularios.
- **Integridad:** se tomó una huella de la base publicada antes y después de la batería (cantidades y md5 de cuentas y citas).
- **Cierre:** al terminar se detuvo la instancia aislada y se eliminaron su base y su carpeta del servidor. En el servidor solo queda la aplicación publicada. El arnés, los resultados y las capturas quedaron fuera del repositorio, en `Documents/Proyecto de grado/respaldos/pruebas-aws-2026-10-15/`.

### Resumen por módulo

| Módulo | Casos | Aprobados |
|---|---|---|
| Registro | 8 | 8 |
| Autenticación | 16 | 16 |
| Cuenta del cliente | 14 | 14 |
| Mascotas | 8 | 8 |
| Citas | 27 | 27 |
| Citas por reagendar | 11 | 11 |
| Festivos | 12 | 12 |
| Validación | 9 | 9 |
| Notificaciones | 5 | 5 |
| Correo | 19 | 19 |
| Médico veterinario | 17 | 17 |
| Administrador de sede | 24 | 24 |
| Superadministrador | 42 | 42 |
| Textos de la página | 4 | 4 |
| Permisos | 20 | 20 |
| Seguridad | 35 | 35 |
| Despliegue | 3 | 3 |
| Interfaz | 38 | 38 |
| Flujo en el navegador | 7 | 7 |
| Integridad | 2 | 2 |
| **Total** | **321** | **321** |

### Ajustes del arnés durante la ejecución

Cinco casos fallaron en su primera ejecución por errores de la prueba, no del sistema. Se corrigió la prueba y el caso se repitió. La tabla registra el resultado de la repetición.

| Caso | Primera ejecución | Causa | Corrección |
|---|---|---|---|
| SA-11 | "0 días" | La prueba leía la propiedad `horarios`; la API responde `horario` con los 7 días | Se leyó la propiedad correcta |
| CO-08 | Aprobado con el correo equivocado | La prueba tomó la confirmación de otra cita (00002) como el reenvío de la 00001 | Se busca el asunto con el código exacto; hay dos confirmaciones de la 00001 |
| RG-10 | Cita sin cancelar | El plazo vencido se escribió con una sesión de PostgreSQL en UTC; el sistema guarda las horas en hora de Colombia y el plazo quedaba 5 horas en el futuro | Se fijó el plazo con `NOW() AT TIME ZONE 'America/Bogota'` y se repitió con otra cita |
| FL-03 | "Continuar 2: no encontrado" | Desde el 14 de octubre la fecha, la hora y "Confirmar cita" están en la misma página; la prueba esperaba el flujo anterior de tres páginas | Se verifica que aparezca "Confirmar cita" con el resumen lateral |
| UI-37 | Sin sección de festivos | La sección está en el panel que abre "Cambiar horario"; la prueba no daba ese clic | Se agregó el clic |

En la repetición del flujo (FL-04), el primer intento eligió las 7:00 del mismo día para la mascota que ya tenía una cita a esa hora en la ejecución anterior, y el sistema lo rechazó correctamente. Se canceló esa cita de prueba y el flujo se repitió completo.

### Hallazgos

- No se encontraron fallos funcionales en la versión `056358c`.
- Detalle de redacción en la ventana de reagendar: el día de la semana aparece con mayúscula inicial a mitad de frase ("Era el Miércoles, 28 de octubre"). No afecta el funcionamiento.
- Lighthouse y la prueba de carga no se repitieron; siguen vigentes los resultados del anexo (LH-01 a LH-08 y CA-01 a CA-04), incluida la observación sobre el peso de las fotos de sedes y servicios.

## Instalador local de Windows: prueba de punta a punta (15 de octubre de 2026)

Se ejecutó `instalador/Instalar-CitasUDES.ps1` con Windows PowerShell 5.1, el mismo intérprete que usa el `.bat`, sobre una copia limpia del repositorio y con una base nueva (`citas_udes_prueba_instalador`) en el PostgreSQL 18 local. Las respuestas a las preguntas del asistente se entregaron con un script. La prueba encontró cinco problemas, que se corrigieron en `056358c`:

| Problema | Efecto | Corrección |
|---|---|---|
| El `.ps1` estaba en UTF-8 sin BOM | Windows PowerShell 5.1 lo lee como ANSI: los mensajes salían como "InstalaciÃ³n" | Se guarda en UTF-8 con BOM |
| Al comprobar si la base existe, `psql` no devuelve nada cuando no existe y el script llamaba `.Trim()` sobre ese valor nulo | El instalador se detenía en todo equipo nuevo, justo después de escribir `backend/.env` | Se usa `-join ''`, que convierte el resultado vacío en texto |
| El `backend/.env` escrito antes del fallo bloqueaba un segundo intento ("Ya existe backend/.env") | No se podía reintentar sin borrar el archivo a mano | Si el instalador falla, retira el `.env` que creó en ese intento |
| El paquete de WinGet de PostgreSQL 18 no documenta una contraseña inicial y el script suponía `postgres` | En un equipo sin PostgreSQL, el cambio de contraseña podía fallar | Se instala con una contraseña temporal aleatoria (`--custom "--superpassword …"`) y luego se reemplaza por la que define quien instala, enviada en un archivo UTF-8 para no dañar tildes ni eñes |
| El médico de evaluación no tenía servicios asignados | En una instalación nueva no había franjas libres (18 franjas, 0 libres) | El script de cuentas de evaluación le asigna los servicios activos |

Resultado después de las correcciones:

| Comprobación | Resultado |
|---|---|
| Instalación completa | Terminó en unos 2 minutos con código de salida 0: base creada, esquema y catálogos cargados, dependencias instaladas con `npm ci`, interfaz compilada y acceso directo creado en el escritorio |
| Servidor instalado | `GET /api/health` respondió `{"servidor":"ok","baseDeDatos":"ok"}` |
| Cuentas de evaluación | Las cuatro (`clienteprueba`, `medicoprueba`, `adminprueba` y `superadminprueba`, todas `@demo.udes.co`) iniciaron sesión con HTTP 200 |
| Agendamiento en la instalación nueva | 18 de 18 franjas libres para Consulta médica en Bucaramanga; se creó la cita CV-BGA-2026-00001 con el médico de evaluación |
| Interfaz | El servidor de desarrollo de Vite sirvió la página con su título |
| Lanzador `Abrir-CitasUDES.bat` | Abre las carpetas `backend` y `frontend` correctamente aunque la ruta tenga espacios |

Límites de esta prueba: el equipo ya tenía Node.js 24 y PostgreSQL 18, así que no se ejecutó la instalación de esos programas por WinGet. Se verificó el identificador del paquete de PostgreSQL (`PostgreSQL.PostgreSQL.18`, versión 18.6-5) y sus parámetros de instalación desatendida en el manifiesto público de WinGet. El lanzador no se abrió con doble clic porque los puertos 4000 y 5173 estaban ocupados por el entorno de desarrollo. Al terminar se eliminaron la base y el acceso directo de la prueba.

## Detalle de la batería final

### Registro

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| RE-01 | Registro sin autorizar el tratamiento de datos | autorizaTratamiento: false | HTTP 400 | HTTP 400 "Para crear tu cuenta debes autorizar el tratamiento de tus datos personales." | Aprobado |
| RE-02 | Registro con el campo trampa lleno (robot) | sitioWeb con valor | HTTP 400 | HTTP 400 "No se pudo crear la cuenta. Recarga la página e inténtalo de nuevo." | Aprobado |
| RE-03 | Registro con contraseña común | contrasena: password | HTTP 400 | HTTP 400 "Esa contraseña es muy fácil de adivinar. Elige otra, por ejemplo una frase corta." | Aprobado |
| RE-04 | Registro con un correo que ya tiene cuenta | correo de una cuenta existente | HTTP 409 | HTTP 409 "Ya existe una cuenta registrada con este correo." | Aprobado |
| RE-05 | Registro válido: queda pendiente de confirmar el correo | datos completos y autorización | HTTP 202 | HTTP 202 "Te enviamos un código de 6 dígitos a [correo de prueba]. Escríbelo para terminar de crear tu" | Aprobado |
| RE-06 | Verificación con un código equivocado | código 000000 | HTTP 400 | HTTP 400 "Código inválido o expirado." | Aprobado |
| RE-07 | Verificación con el código correcto crea la cuenta | código recibido por correo | HTTP 201; sesión iniciada | HTTP 201 | Aprobado |
| RE-08 | El mismo código no sirve dos veces | repetir la verificación | HTTP 400 o 409 | HTTP 400 "Código inválido o expirado." | Aprobado |

### Autenticación

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| AU-01 | Inicio de sesión con la contraseña temporal | Correo y contraseña del correo de credenciales | HTTP 200 | HTTP 200 | Aprobado |
| AU-02 | La sesión con clave temporal exige crear una contraseña propia | Respuesta del inicio de sesión | debe_cambiar_contrasena verdadero | debeCambiar: true | Aprobado |
| AU-03 | Con la sesión temporal no se puede usar el panel | GET /administracion/tablero con token temporal | HTTP 401 o 403 | HTTP 403 "Antes de continuar debes crear tu propia contraseña." | Aprobado |
| AU-04 | La contraseña nueva no puede ser la temporal | contrasenaNueva = temporal | HTTP 400 | HTTP 400 "Elige una contraseña distinta a la temporal que recibiste por correo." | Aprobado |
| AU-05 | Contraseña común rechazada | contrasenaNueva = 12345678 | HTTP 400 | HTTP 400 "Esa contraseña es muy fácil de adivinar. Elige otra, por ejemplo una frase corta." | Aprobado |
| AU-06 | Crear la contraseña propia en el primer ingreso | contraseña nueva válida | HTTP 200; sesión normal | HTTP 200 | Aprobado |
| AU-07 | Primer ingreso del médico y creación de su contraseña | clave temporal y contraseña nueva | HTTP 200 | HTTP 200 | Aprobado |
| AU-08 | Inicio de sesión de una cuenta de ejemplo | maria.gomez@demo.udes.co | HTTP 200 | HTTP 200 | Aprobado |
| AU-09 | Una cuenta desactivada no puede iniciar sesión | contraseña correcta | HTTP 403 "cuenta inactiva" | HTTP 403 CUENTA_INACTIVA | Aprobado |
| AU-10 | Con contraseña equivocada no se revela que la cuenta está inactiva | contraseña equivocada | HTTP 401 genérico | HTTP 401 "El correo o la contraseña no son correctos. Revísalos e inténtalo de nuevo." | Aprobado |
| AU-11 | La cuenta reactivada vuelve a entrar | contraseña correcta | HTTP 200 | HTTP 200 | Aprobado |
| AU-12 | Restablecer con un código equivocado | código 000000 | HTTP 400 | HTTP 400 "Código inválido o expirado." | Aprobado |
| AU-13 | Restablecer la contraseña con el código correcto | código recibido | HTTP 200 | HTTP 200 "Contraseña actualizada correctamente." | Aprobado |
| AU-14 | El código de recuperación no sirve dos veces | mismo código | HTTP 400 | HTTP 400 "Código inválido o expirado." | Aprobado |
| AU-15 | La contraseña anterior ya no sirve | contraseña previa al restablecimiento | HTTP 401 | HTTP 401 "El correo o la contraseña no son correctos. Revísalos e inténtalo de nuevo." | Aprobado |
| AU-16 | Entrar con la contraseña restablecida | contraseña nueva | HTTP 200 | HTTP 200 | Aprobado |

### Cuenta del cliente

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| CU-01 | Ver los datos de su cuenta | GET /cuenta/perfil | HTTP 200 | HTTP 200 | Aprobado |
| CU-02 | Teléfono con letras | telefono "abc" | HTTP 400 | HTTP 400 "El teléfono debe contener exactamente 10 dígitos, sin espacios ni signos." | Aprobado |
| CU-03 | Actualizar nombre y teléfono | nombre y teléfono nuevos | HTTP 200 | HTTP 200 | Aprobado |
| CU-04 | Pedir el código para cambiar la contraseña | POST /cuenta/contrasena/codigo | HTTP 200 | HTTP 200 "Enviamos un código de 6 dígitos a [correo de prueba]. Vence en 15 minutos." | Aprobado |
| CU-05 | Pedir otro código antes de un minuto | segunda solicitud inmediata | HTTP 429 | HTTP 429 "Ya te enviamos un código. Espera 60 segundos para pedir otro." | Aprobado |
| CU-06 | Cambiar la contraseña con un código equivocado | código 000000 | HTTP 400 | HTTP 400 "Código inválido o expirado. Solicita uno nuevo." | Aprobado |
| CU-07 | Cambiar la contraseña con el código correcto | código recibido y contraseña nueva | HTTP 200 | HTTP 200 "Tu contraseña quedó actualizada." | Aprobado |
| CU-08 | Cambiar a un correo con formato inválido | "no-es-un-correo" | HTTP 400 | HTTP 400 "Escribe un correo válido." | Aprobado |
| CU-09 | Cambiar a un correo que ya usa otra cuenta | correo de otra cuenta | HTTP 409 | HTTP 409 "Ese correo ya está registrado en otra cuenta." | Aprobado |
| CU-10 | Pedir el cambio de correo | correo nuevo válido | HTTP 200; el código va al correo nuevo | HTTP 200 "Enviamos un código de 6 dígitos a [correo de prueba]. Vence en 15 minutos." | Aprobado |
| CU-11 | Confirmar el correo nuevo con el código | código recibido | HTTP 200 | HTTP 200 "Tu correo quedó actualizado y verificado." | Aprobado |
| CU-12 | La cuenta queda con el correo nuevo | GET /cuenta/perfil | el correo nuevo | Correo actualizado | Aprobado |
| CU-13 | Se inicia sesión con el correo nuevo | correo nuevo y contraseña | HTTP 200 | HTTP 200 | Aprobado |
| CU-14 | Confirmar el correo nuevo con un código equivocado | código 000000 | HTTP 400 | HTTP 400 "Código inválido o expirado. Solicita uno nuevo." | Aprobado |

### Mascotas

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| MA-01 | Catálogo público de especies y razas | GET /catalogos/especies | HTTP 200 | HTTP 200 | Aprobado |
| MA-02 | Registrar mascota con un sexo no válido | sexo "otro" | HTTP 400 | HTTP 400 "El sexo debe ser uno de: macho, hembra." | Aprobado |
| MA-03 | Registrar mascota con peso negativo | pesoKg -3 | HTTP 400 | HTTP 400 "El peso debe ser un número mayor a 0." | Aprobado |
| MA-04 | Registrar mascota con datos completos | Canino, Labrador retriever, macho, 12,5 kg | HTTP 201 | HTTP 201 | Aprobado |
| MA-05 | Registrar una segunda mascota | gato hembra | HTTP 201 | HTTP 201 | Aprobado |
| MA-06 | Subir la foto de la mascota | JPEG de 53 KB | HTTP 200 o 201 | HTTP 200 | Aprobado |
| MA-07 | Subir un archivo que no es imagen | archivo de texto | HTTP 400 o 415 | HTTP 400 "La imagen debe ser JPG o PNG." | Aprobado |
| MA-08 | La foto de la mascota se entrega con enlace firmado | GET /mascotas/mias | foto_url con firma (?e=...&f=...) | /uploads/mascotas/17e7155c-12c1-4855-8d9c-472a92a0e979.jpg?e=1792134000000&f=… | Aprobado |

### Citas

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| CI-01 | Consultar la disponibilidad de la sede | sede de pruebas, Consulta médica, 2026-10-16 | HTTP 200 | HTTP 200 | Aprobado |
| CI-02 | La pausa del médico no aparece disponible | franjas de 12:00 y 12:30 | No disponibles | 12:00 no disponible, 12:30 no disponible | Aprobado |
| CI-03 | Franjas del día según el horario de la sede | horario 07:00 a 19:00 | Primera 07:00, sin franjas fuera del horario | 24 franjas, de 07:00 a 18:30; 22 libres | Aprobado |
| CI-04 | El día bloqueado del médico no tiene franjas libres | fecha 2026-10-21 | 0 franjas disponibles | 0 disponibles | Aprobado |
| CI-05 | Disponibilidad con una fecha que no existe | 31 de febrero | HTTP 400 | HTTP 400 "La fecha debe ser un día que exista, con el formato YYYY-MM-DD." | Aprobado |
| CI-06 | Agendar con un motivo de más de 255 caracteres | motivo de 256 caracteres | HTTP 400 | HTTP 400 "El motivo no puede superar los 255 caracteres." | Aprobado |
| CI-07 | Agendar en una fecha pasada | ayer | HTTP 409 | HTTP 409 "No se puede agendar una fecha en el pasado." | Aprobado |
| CI-08 | Agendar a una hora que no es una franja | 07:10 | HTTP 409 | HTTP 409 "La hora seleccionada no coincide con una franja de atención válida." | Aprobado |
| CI-09 | Agendar durante la pausa del médico | 12:00 | HTTP 409 | HTTP 409 "Ya no hay médicos disponibles en esa franja. Elige otra hora." | Aprobado |
| CI-10 | Agendar una cita válida | 2026-10-16 07:00, Consulta médica | HTTP 201; médico asignado automáticamente | HTTP 201 | Aprobado |
| CI-11 | La cita recibe un código consecutivo de la sede | respuesta del agendamiento | Código CV-PRB-AAAA-NNNNN | CV-PRB-2026-00001 | Aprobado |
| CI-12 | Se asigna el único médico que presta el servicio en la sede | respuesta del agendamiento | Médico De Pruebas | Médico De Pruebas | Aprobado |
| CI-13 | El servidor confirma el envío del correo de la cita | correoEnviado | true | true | Aprobado |
| CI-14 | La misma mascota no puede tener dos citas a la vez | misma mascota y hora | HTTP 409 | HTTP 409 "Esa mascota ya tiene una cita a esa hora." | Aprobado |
| CI-15 | Otra mascota en la misma franja con el único médico ocupado | segunda mascota, misma hora | HTTP 409 | HTTP 409 "Ya no hay médicos disponibles en esa franja. Elige otra hora." | Aprobado |
| CI-16 | La franja agendada deja de aparecer disponible | 07:00 | No disponible | No disponible | Aprobado |
| CI-17 | Servicio de 60 minutos que no alcanza a terminar antes del cierre | 2026-10-17 18:30 (cierra 19:00) | HTTP 409 | HTTP 409 "Ese servicio dura 60 minutos y no alcanza a terminar dentro del horario de atención. Elige una hora más tempra" | Aprobado |
| CI-18 | Agendar un servicio de 60 minutos | 2026-10-17 10:00 | HTTP 201 | HTTP 201 | Aprobado |
| CI-19 | La cita de 60 minutos ocupa también la franja siguiente | 10:30 del mismo día | No disponible | No disponible | Aprobado |
| CI-20 | El cliente ve sus citas | GET /citas/mias | Incluye las citas agendadas | 2 citas | Aprobado |
| CI-21 | Reenviar el correo de confirmación | botón Reenviar correo | HTTP 200 | HTTP 200 "Enviamos de nuevo la confirmación a [correo de prueba]." | Aprobado |
| CI-22 | El cliente reprograma su cita | 2026-10-17 14:00 | HTTP 200 | HTTP 200 | Aprobado |
| CI-23 | Reprogramar con una fecha inválida | 2026-13-45 | HTTP 400 | HTTP 400 "nuevaFechaHora no es una fecha válida." | Aprobado |
| CI-24 | El cliente cancela su cita | PATCH cancelar | HTTP 200 | HTTP 200 | Aprobado |
| CI-25 | No se agenda un servicio desactivado | servicio inactivo | HTTP 409 | HTTP 409 "Ese servicio no está disponible." | Aprobado |
| CI-26 | Cinco solicitudes simultáneas por la misma franja con un solo médico | 4 del cliente (mascotas distintas) y 1 del administrador, 2026-10-23 | Exactamente una cita creada; las demás HTTP 409 | Respuestas: 201, 409, 409, 409, 409 | Aprobado |
| CI-27 | En la base queda una sola cita en esa franja | agenda de la sede | 1 cita agendada | 1 cita(s) agendada(s) a esa hora | Aprobado |

### Citas por reagendar

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| RG-01 | Antes de bloquear, la sede ve las citas que el bloqueo afecta | bloqueo del médico el 2026-10-24 | Incluye la cita CV-PRB-2026-00006 | HTTP 200; 1 cita(s): CV-PRB-2026-00006 | Aprobado |
| RG-02 | Sin otro médico que preste el servicio, la cita queda por reagendar | bloqueo de todo el día; único médico con ese servicio | HTTP 201; 1 cita por reagendar | HTTP 201; reasignadas 0, por reagendar 1 | Aprobado |
| RG-03 | El cliente ve la cita por reagendar con su plazo | GET /citas/mias | estado por_reagendar y fecha límite | estado por_reagendar; plazo definido | Aprobado |
| RG-04 | El cliente recibe el aviso y el correo para reagendar | campana y correo capturado | Aviso "Debes reagendar tu cita" y correo | aviso; correo "Debes reagendar tu cita CV-PRB-2026-00006 — Clínica Veterinaria UDES" | Aprobado |
| RG-05 | El cliente reagenda la cita y vuelve a quedar agendada | 2026-10-25 09:00 | HTTP 200; estado agendada | HTTP 200; estado agendada | Aprobado |
| RG-06 | Con otro médico libre, la cita se reasigna y conserva la hora | bloqueo de 09:00 a 12:00 del médico asignado, 2026-10-26 | HTTP 201; cita agendada con el otro médico, misma hora | HTTP 201; reasignadas 1; estado agendada; otro médico; misma hora | Aprobado |
| RG-07 | El cliente recibe el aviso del cambio de médico | correo capturado | Correo "Tu cita tiene otro médico" | "Tu cita tiene otro médico CV-PRB-2026-00007 — Clínica Veterinaria UDES" | Aprobado |
| RG-08 | Antes de cerrar un día, la sede ve las citas afectadas | cerrar el día 3 de la semana | Incluye la cita CV-PRB-2026-00008 | HTTP 200; 1 cita(s) | Aprobado |
| RG-09 | Cerrar un día de atención deja por reagendar sus citas | DELETE /horarios/:sede/3 | HTTP 200; cita por reagendar | HTTP 200; afectadas 1; estado por_reagendar | Aprobado |
| RG-10 | Al vencer el plazo sin reagendar, la cita se cancela y se avisa | cita CV-PRB-2026-00010 UPDATE 1 por reagendar con el plazo vencido; se ejecuta la revisión periódica | Cita cancelada y correo "Tu cita fue cancelada" | antes por_reagendar; revisión: 1 cancelada(s); después cancelada; correo "Tu cita fue cancelada CV-PRB-2026-00010 — Clínica Veterinaria UDES" | Aprobado |
| RG-11 | La sede vuelve a abrir el día cerrado | día 3, 07:00 a 19:00 | HTTP 200 | HTTP 200 | Aprobado |

### Festivos

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| FE-01 | La sede consulta los festivos nacionales del año | GET /horarios/festivos, 2026 | 18 festivos, todos cerrados | HTTP 200; 18 festivos; abiertos 0; 2026-11-02: Día de Todos los Santos | Aprobado |
| FE-02 | Un festivo cerrado no tiene franjas libres | disponibilidad del 2026-11-02 | 0 franjas disponibles | 0 disponibles de 0 | Aprobado |
| FE-03 | No se agenda en un festivo cerrado | 2026-11-02 09:00 | HTTP 409 | HTTP 409 "La hora seleccionada no coincide con una franja de atención válida." | Aprobado |
| FE-04 | Abrir un festivo con una hora que no es en punto ni media hora | 08:15 a 12:00 | HTTP 400 | HTTP 400 "El horario debe empezar y terminar en punto o a la media hora." | Aprobado |
| FE-05 | Abrir como festivo una fecha que no lo es | 2026-11-03 | HTTP 400 | HTTP 400 "La fecha debe ser un festivo nacional de Colombia en formato YYYY-MM-DD." | Aprobado |
| FE-06 | El administrador no abre festivos de otra sede | sede Clinica Veterinaria UDES Bucaramanga | HTTP 403 | HTTP 403 "Solo puedes cambiar el horario de tu propia sede." | Aprobado |
| FE-07 | La sede abre un festivo con horario especial | 2026-11-02, 08:00 a 12:00 | HTTP 200 | HTTP 200 | Aprobado |
| FE-08 | El festivo abierto ofrece franjas solo dentro del horario especial | disponibilidad del 2026-11-02 | Franjas de 08:00 a 11:30 | 8 libres, de 08:00 a 11:30 | Aprobado |
| FE-09 | Se agenda en el festivo abierto | 2026-11-02 09:00 | HTTP 201 | HTTP 201 | Aprobado |
| FE-10 | Cliente y médico no administran festivos | GET /horarios/festivos | HTTP 403 para ambos | cliente HTTP 403; médico HTTP 403 | Aprobado |
| FE-11 | Al volver a cerrar el festivo, sus citas quedan por reagendar | DELETE /horarios/festivos/:sede/2026-11-02 | HTTP 200; la cita queda por reagendar | HTTP 200; afectadas 1; estado por_reagendar | Aprobado |
| FE-12 | El festivo cerrado otra vez no ofrece franjas | disponibilidad del 2026-11-02 | 0 franjas disponibles | 0 disponibles | Aprobado |

### Validación

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| VA-01 | Registro sin teléfono | todos los datos menos el teléfono | HTTP 400; mensaje sobre el teléfono | HTTP 400 "Nombre completo, correo, teléfono y contraseña son obligatorios." | Aprobado |
| VA-02 | Registro con un teléfono de nueve dígitos | telefono 300123456 | HTTP 400 | HTTP 400 "El teléfono debe contener exactamente 10 dígitos, sin espacios ni signos." | Aprobado |
| VA-03 | Registro con un teléfono con signos | telefono 300-123-45 | HTTP 400 | HTTP 400 "El teléfono debe contener exactamente 10 dígitos, sin espacios ni signos." | Aprobado |
| VA-04 | Registro con un correo sin formato válido | correo-sin-arroba.com | HTTP 400 | HTTP 400 "El correo electrónico no tiene un formato válido." | Aprobado |
| VA-05 | Crear cuenta de personal sin teléfono | administrador sin teléfono | HTTP 400; mensaje sobre el teléfono | HTTP 400 "Nombre completo, correo, teléfono, rol y sede son obligatorios." | Aprobado |
| VA-06 | Crear cuenta de personal con teléfono de nueve dígitos | telefono 300111000 | HTTP 400 | HTTP 400 "El teléfono debe contener exactamente 10 dígitos, sin espacios ni signos." | Aprobado |
| VA-07 | Crear médico sin teléfono | nombre, correo y documento | HTTP 400; mensaje sobre el teléfono | HTTP 400 "Nombre completo, correo, teléfono y documento de identidad son obligatorios." | Aprobado |
| VA-08 | Crear médico con un documento que tiene letras | documento 10A0000001 | HTTP 400 | HTTP 400 "El documento de identidad debe contener solo dígitos (máximo 20)." | Aprobado |
| VA-09 | Registro con un enlace en el nombre | nombre con "www." | HTTP 400 | HTTP 400 "El nombre contiene caracteres que no se permiten." | Aprobado |

### Notificaciones

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| NO-01 | El cliente recibe avisos en la campana | GET /notificaciones | Avisos de las citas | 11 avisos: Cita cancelada; Cita reprogramada; Cita agendada; Recordatorio para Firulais Prueba | Aprobado |
| NO-02 | Marcar todos los avisos como leídos | PATCH /notificaciones/leidas | HTTP 200 o 204 | HTTP 204 | Aprobado |
| NO-03 | El médico recibe el aviso cuando el cliente reprograma y cancela | campana del médico | Avisos de cambio y cancelación | Cita cancelada; Cita reprogramada; Cita cancelada; Cita reprogramada; Nueva cita | Aprobado |
| NO-04 | Después de marcarlos, no quedan avisos sin leer | GET /notificaciones | 0 sin leer | 0 sin leer | Aprobado |
| NO-05 | Recordatorio automático en la campana 24 horas antes | cita de mañana 07:00; se ejecuta el ciclo de recordatorios | Aviso "Tu cita se acerca" | "Firulais Prueba tiene Consulta médica el viernes, 16 de octubre, 7:00 a. m. en Sede de Pruebas, con Médico De " | Aprobado |

### Correo

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| CO-01 | Se genera el correo con las credenciales del administrador de sede | Correo capturado del administrador | Correo con contraseña temporal | "Tu cuenta en el Sistema de Citas — Clínica Veterinaria UDES"; contiene la contraseña temporal | Aprobado |
| CO-02 | Las tildes del correo se conservan | Cuerpo del correo de credenciales | Texto legible con tildes | Se lee "Clínica", "contraseña", "sesión" | Aprobado |
| CO-03 | Se genera el correo con las credenciales del médico | Correo capturado del médico | Correo con contraseña temporal | con contraseña temporal | Aprobado |
| CO-04 | Se genera el código de verificación del registro | Correo capturado del cliente | Correo con código de 6 dígitos | "Confirma tu correo — Clínica Veterinaria UDES"; código presente | Aprobado |
| CO-05 | Se genera el correo de bienvenida | Correo capturado del cliente | Correo de cuenta creada | "Tu cuenta ha sido creada — Clínica Veterinaria UDES" | Aprobado |
| CO-06 | Se genera el correo de confirmación de la cita | Correo capturado del cliente | Asunto con CV-PRB-2026-00001 | "Cita confirmada CV-PRB-2026-00001 — Clínica Veterinaria UDES" | Aprobado |
| CO-07 | La confirmación trae la fecha, la sede y la mascota | cuerpo del correo | Sede de Pruebas y Firulais Prueba | sede, mascota | Aprobado |
| CO-08 | Se genera el correo reenviado | Correo capturado del cliente | Segundo correo de confirmación de la misma cita | 2 correos "Cita confirmada CV-PRB-2026-00001" | Aprobado |
| CO-09 | El cliente recibe la confirmación de la cita que agendó el médico | Correo capturado del cliente | Correo de confirmación | "Cita confirmada CV-PRB-2026-00003 — Clínica Veterinaria UDES" | Aprobado |
| CO-10 | El dueño recibe el recordatorio del médico | Correo capturado del cliente | Correo "Recordatorio para Firulais Prueba" | "Recordatorio para Firulais Prueba: Refuerzo de vacuna — Clínica Veterinaria UDES" | Aprobado |
| CO-11 | El cliente recibe el aviso del cambio de fecha | Correo capturado del cliente | Correo "Tu cita cambió de fecha" | "Tu cita cambió de fecha CV-PRB-2026-00004 — Clínica Veterinaria UDES" | Aprobado |
| CO-12 | El cliente recibe el aviso de cancelación | Correo capturado del cliente | Correo "Tu cita fue cancelada" | "Tu cita fue cancelada CV-PRB-2026-00004 — Clínica Veterinaria UDES" | Aprobado |
| CO-13 | El cliente recibe la confirmación de la cita que agendó la sede | Correo capturado del cliente | Correo de confirmación | "Cita confirmada CV-PRB-2026-00004 — Clínica Veterinaria UDES" | Aprobado |
| CO-14 | Se genera el correo del recordatorio automático | Correo capturado del cliente | Correo "Recordatorio de tu cita CV-PRB-2026-00001" | "Recordatorio de tu cita CV-PRB-2026-00001 — Clínica Veterinaria UDES" | Aprobado |
| CO-15 | Se genera el código para cambiar la contraseña | Correo capturado del cliente | Código de 6 dígitos | "Código de recuperación de contraseña — Clínica Veterinaria UDES" | Aprobado |
| CO-16 | Se genera el código de recuperación de contraseña | Correo capturado del cliente | Código de 6 dígitos | "Código de recuperación de contraseña — Clínica Veterinaria UDES" | Aprobado |
| CO-17 | El código se envía al correo nuevo | Correo capturado del buzón nuevo | Código de 6 dígitos | Para clientenuevo.mv9wi4ov@…; código presente | Aprobado |
| CO-18 | El asunto conserva tildes y guiones | asunto del correo | "Confirma tu nuevo correo — Clínica Veterinaria UDES" | Confirma tu nuevo correo — Clínica Veterinaria UDES | Aprobado |
| CO-19 | Se genera la confirmación de la cita agendada desde la interfaz | Correo capturado del cliente | Correo con CV-PRB-2026-00012 | "Cita confirmada CV-PRB-2026-00012 — Clínica Veterinaria UDES" | Aprobado |

### Médico veterinario

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| ME-01 | Ver su perfil profesional | GET /medico/perfil | HTTP 200 | HTTP 200 | Aprobado |
| ME-02 | Editar su biografía | PUT /medico/perfil | HTTP 200 | HTTP 200 | Aprobado |
| ME-03 | Ver los servicios que presta | GET /medico/servicios | Los 3 servicios asignados | 3 servicios | Aprobado |
| ME-04 | Ver sus pacientes (dueños con citas con él) | GET /medico/pacientes | Incluye al cliente de pruebas | HTTP 200; incluye al cliente | Aprobado |
| ME-05 | Ver el detalle de un paciente | GET /medico/pacientes/:clienteId | HTTP 200 | HTTP 200 | Aprobado |
| ME-06 | Buscar un cliente para agendarle | busqueda "Cliente De Pruebas" | Lo encuentra | Encontrado | Aprobado |
| ME-07 | Ver su horario y bloqueos | GET /medico/disponibilidad | HTTP 200 | HTTP 200 | Aprobado |
| ME-08 | Ver su agenda de citas | GET /administracion/citas | Incluye la cita del cliente | 2 citas | Aprobado |
| ME-09 | Agendar a un cliente (siempre en su sede y consigo mismo) | Vacunación, 2026-10-18 09:00; envía otra sede y otro médico en la petición | HTTP 201 | HTTP 201 | Aprobado |
| ME-10 | El servidor ignora la sede y el médico que envía el médico | sede y médico de la cita creada | Sede de Pruebas y Médico De Pruebas | Sede de Pruebas / Médico De Pruebas | Aprobado |
| ME-11 | Recordatorio con un tipo no válido | tipo "cumpleaños" | HTTP 400 | HTTP 400 "Elige un tipo de recordatorio válido." | Aprobado |
| ME-12 | Recordatorio en una fecha pasada | hace dos días | HTTP 400 | HTTP 400 "El recordatorio debe ser para una fecha y hora futuras." | Aprobado |
| ME-13 | Crear un recordatorio de cuidado para la mascota | vacunación, 2026-11-04 09:00 | HTTP 201 | HTTP 201 | Aprobado |
| ME-14 | Ver los recordatorios de la mascota | GET /medico/recordatorios | HTTP 200 | HTTP 200 | Aprobado |
| ME-15 | El médico no puede reprogramar citas (las gestiona la sede) | cita propia a 2026-10-18 10:00 | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| ME-16 | El médico no puede cancelar citas (las gestiona la sede) | PATCH cancelar cita propia | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| ME-17 | El médico recibe avisos en la campana | GET /notificaciones | Aviso de la cita agendada por el cliente | 4 avisos | Aprobado |

### Administrador de sede

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| AD-01 | Tablero de inicio de la sede | GET /administracion/tablero | HTTP 200 | HTTP 200 | Aprobado |
| AD-02 | Crear médico sin documento | sin documento de identidad | HTTP 400 | HTTP 400 "Nombre completo, correo, teléfono y documento de identidad son obligatorios." | Aprobado |
| AD-03 | Crear médico de la sede | nombre, correo, documento y teléfono | HTTP 201; queda en la sede del administrador | HTTP 201 | Aprobado |
| AD-04 | Consultar el catálogo de servicios | GET /servicios/admin | HTTP 200 | HTTP 200 | Aprobado |
| AD-05 | Asignar servicios al médico | 3 servicios (Consulta médica, Vacunación, Servicio de prueba) | HTTP 200 | HTTP 200 | Aprobado |
| AD-06 | Cambiar el horario de su propia sede | sábado 07:00 a 19:00 | HTTP 200 | HTTP 200 | Aprobado |
| AD-07 | Horario del médico fuera del horario de la sede | lunes 06:00 a 12:00 (la sede abre a las 07:00) | HTTP 400 | HTTP 400 "El horario debe estar dentro del horario de Sede de Pruebas (07:00 – 19:00)." | Aprobado |
| AD-08 | Definir el horario del médico con pausa | 7 días 07:00 a 19:00, pausa 12:00 a 13:00 | HTTP 200 | HTTP 200 | Aprobado |
| AD-09 | Bloqueo con la fecha final antes de la inicial | inicio día +5, fin día +3 | HTTP 400 | HTTP 400 "Revisa las fechas: la de inicio debe ser igual o anterior a la final." | Aprobado |
| AD-10 | Registrar un bloqueo en la agenda del médico | día 2026-10-21 completo | HTTP 201 | HTTP 201 | Aprobado |
| AD-11 | Consultar el horario y los bloqueos del médico | GET disponibilidad del médico | HTTP 200 | HTTP 200 | Aprobado |
| AD-12 | Lista de médicos solo de su sede | GET /administracion/medicos | Solo los médicos de la sede de pruebas | 2 médico(s): Médico De Pruebas, Segunda Médica De Pruebas | Aprobado |
| AD-13 | Lista de citas de la sede | GET /administracion/citas | HTTP 200 | HTTP 200 | Aprobado |
| AD-14 | Lista de pacientes de la sede | GET /administracion/pacientes | HTTP 200 | HTTP 200 | Aprobado |
| AD-15 | Reporte de la sede | GET /administracion/reportes | HTTP 200 | HTTP 200 | Aprobado |
| AD-16 | El administrador agenda a nombre de un cliente | Consulta médica, 2026-10-19 08:00 | HTTP 201 | HTTP 201 | Aprobado |
| AD-17 | El médico no puede tener dos citas en la misma franja | otra mascota, mismo médico y hora | HTTP 409 | HTTP 409 "Ese médico ya tiene una cita en esa franja. Elige otra." | Aprobado |
| AD-18 | El administrador reprograma una cita de su sede | 2026-10-19 08:30 | HTTP 200 | HTTP 200 | Aprobado |
| AD-19 | El administrador cancela una cita de su sede | PATCH cancelar | HTTP 200 | HTTP 200 | Aprobado |
| AD-20 | Cancelar una cita ya cancelada | repetir la cancelación | HTTP 400 | HTTP 400 "La cita ya está cancelada." | Aprobado |
| AD-21 | Reprogramar una cita cancelada | cita cancelada | HTTP 400 | HTTP 400 "Solo se pueden reprogramar citas activas." | Aprobado |
| AD-22 | Ver el detalle de un paciente de la sede | GET /administracion/pacientes/:id | HTTP 200 | HTTP 200 | Aprobado |
| AD-23 | El tablero refleja la actividad de la sede | GET /administracion/tablero | Con datos de citas | {"sede":{"id":"b4935cd0-af2c-4930-8379-7e8df31dedc6","nombre":"Sede de Pruebas","ciudad":"Bucaramanga"},"citas | Aprobado |
| AD-24 | Crear un segundo médico en la sede | otro médico con todos los datos | HTTP 201 | HTTP 201 | Aprobado |

### Superadministrador

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| SA-01 | Crear la cuenta de superadministrador con el script del proyecto | npm run crear:superadmin (base aislada) | Cuenta creada | Cambia la contraseña después del primer inicio de sesión (¿Olvidaste tu contraseña?). | Aprobado |
| SA-02 | Inicio de sesión del superadministrador | Correo y contraseña correctos | HTTP 200 | HTTP 200 | Aprobado |
| SA-03 | Resumen del sistema en el inicio del superadministrador | GET /administracion/sistema | HTTP 200 | HTTP 200 | Aprobado |
| SA-04 | Crear sede con código inválido | codigo "P1" (lleva número) | HTTP 400 | HTTP 400 "El código debe tener de 2 a 5 letras, sin tildes (ej. BGA)." | Aprobado |
| SA-05 | Crear sede nueva | nombre, ciudad y código "prb" | HTTP 201; código guardado en mayúsculas | HTTP 201 | Aprobado |
| SA-06 | El código de la sede se normaliza a mayúsculas | código "prb" | PRB | PRB | Aprobado |
| SA-07 | Crear sede con código repetido | codigo "PRB" ya existente | HTTP 409 | HTTP 409 "Ya existe otra sede con ese código." | Aprobado |
| SA-08 | Definir el horario de atención de la sede | 7 días, 07:00 a 19:00 | HTTP 200 en los 7 días | HTTP 200 en los 7 días | Aprobado |
| SA-09 | Horario que no empieza en punto ni a la media hora | 08:15 a 17:00 | HTTP 400 | HTTP 400 "El horario debe empezar y terminar en punto o a la media hora (por ejemplo 08:00 o 17:30)." | Aprobado |
| SA-10 | Horario con inicio posterior al fin | 18:00 a 08:00 | HTTP 400 | HTTP 400 "La hora de inicio debe ser anterior a la hora de fin." | Aprobado |
| SA-11 | Consulta pública del horario de la sede | GET /horarios?sedeId | 7 días | 7 días, 07:00 a 19:00 | Aprobado |
| SA-12 | Listar categorías de servicio | GET /catalogos/categorias | HTTP 200 | HTTP 200 | Aprobado |
| SA-13 | Crear servicio | nombre, categoría, precio y 60 minutos | HTTP 201 | HTTP 201 | Aprobado |
| SA-14 | Crear servicio con datos inválidos | precio negativo y sin categoría | HTTP 400 | HTTP 400 "La categoría del servicio es obligatoria." | Aprobado |
| SA-15 | Listar servicios (vista administrativa) | GET /servicios/admin | HTTP 200 | HTTP 200 | Aprobado |
| SA-16 | Crear cuenta de personal con rol no permitido | rol "cliente" | HTTP 400 | HTTP 400 "Este endpoint solo crea cuentas de administrador o veterinario. Para clientes use /api/auth/registro." | Aprobado |
| SA-17 | Crear administrador de sede | nombre, correo, teléfono, rol administrador y sede de pruebas | HTTP 201; correoEnviado true | HTTP 201 | Aprobado |
| SA-18 | El servidor confirma el envío del correo con las credenciales | respuesta de la creación | correoEnviado: true | correoEnviado: true | Aprobado |
| SA-19 | Crear cuenta con un correo ya registrado | mismo correo | HTTP 409 | HTTP 409 "Ya existe una cuenta registrada con este correo." | Aprobado |
| SA-20 | Desactivar una cuenta de personal | PATCH /usuarios/:id { activo: false } | HTTP 200 | HTTP 200 | Aprobado |
| SA-21 | Crear el administrador definitivo de la sede de pruebas | rol administrador, sede de pruebas | HTTP 201 | HTTP 201 | Aprobado |
| SA-22 | Ver las entidades del módulo de datos | GET /datos | Lista de entidades | Usuarios, Mascotas, Citas, Servicios, Sedes, Horarios de atención | Aprobado |
| SA-23 | Buscar cuentas en el módulo de datos | busqueda "De Pruebas" | Las cuentas de prueba | 6 resultados | Aprobado |
| SA-24 | La bitácora registra las acciones administrativas | búsqueda de cada acción en la bitácora | Cada acción al menos una vez | Crear sede: 1; Crear médico: 2; Cambiar horario de un médico: 1; Crear cuenta de personal: 2; Editar o activar/desactivar cuenta: 3; Descargar copia de seguridad: 1; Exportar datos: 1 | Aprobado |
| SA-25 | Exportar usuarios en CSV | GET /datos/usuarios/exportar | Archivo CSV | HTTP 200, text/csv; charset=utf-8 | Aprobado |
| SA-26 | La copia de seguridad pide la contraseña de quien la descarga | contraseña equivocada | HTTP 403 | HTTP 403 "La contraseña no es correcta." | Aprobado |
| SA-27 | Descargar la copia de seguridad de la base | contraseña correcta | Archivo .sql completo de pg_dump | HTTP 200, 149 KB, termina en "dump complete" | Aprobado |
| SA-28 | Corregir el teléfono de una cuenta | teléfono nuevo para el cliente de pruebas | HTTP 200 | HTTP 200 | Aprobado |
| SA-29 | Desactivar la cuenta de un cliente | PATCH /usuarios/:id activo false | HTTP 200 | HTTP 200 | Aprobado |
| SA-30 | Reactivar la cuenta | activo true | HTTP 200 | HTTP 200 | Aprobado |
| SA-31 | Reporte global | GET /administracion/reportes | HTTP 200 | HTTP 200 | Aprobado |
| SA-32 | Reporte de la sede de pruebas | sedeId de pruebas | Cuenta las citas de prueba | {"rango":{"desde":"2026-08-20T18:58:37.104Z","hasta":"2026-10-16T18:58:37.104Z"},"kpis":{"citasMes":4,"citasMesAnterior" | Aprobado |
| SA-33 | Información de la clínica | GET /api/clinica/admin | HTTP 200 | HTTP 200 | Aprobado |
| SA-34 | Catálogo de especies y razas | GET /api/catalogos/especies/admin | HTTP 200 | HTTP 200 | Aprobado |
| SA-35 | Galería de la página pública | GET /api/galeria/admin | HTTP 200 | HTTP 200 | Aprobado |
| SA-36 | Logotipos | GET /api/logos | HTTP 200 | HTTP 200 | Aprobado |
| SA-37 | Lista de médicos de todas las sedes | GET /api/usuarios?rol=veterinario | HTTP 200 | HTTP 200 | Aprobado |
| SA-38 | Lista de sedes | GET /api/sedes/admin | HTTP 200 | HTTP 200 | Aprobado |
| SA-39 | Desactivar un servicio | activo false | HTTP 200 | HTTP 200 | Aprobado |
| SA-40 | El servicio desactivado no aparece en el catálogo público | GET /servicios | Sin "Servicio de prueba" | No aparece (9 servicios públicos) | Aprobado |
| SA-41 | El superadministrador no puede desactivar su propia cuenta | PATCH a su propio id | HTTP 400 | HTTP 400 "No puedes desactivar tu propia cuenta." | Aprobado |
| SA-42 | Una sede desactivada no aparece en la página pública | PUT /sedes/:id activo false (antes se cancelaron 6 citas futuras) | Sin "Sede de Pruebas" | HTTP 200; públicas: Clinica Veterinaria UDES Bucaramanga, Clinica Veterinaria UDES Valledupar | Aprobado |

### Textos de la página

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| TX-01 | El superadministrador cambia el título y deja vacía una viñeta | PUT /textos | HTTP 200 | HTTP 200 | Aprobado |
| TX-02 | La página pública recibe el texto nuevo | GET /textos | Título nuevo y viñeta 2 vacía | "Prueba de texto editable para" / viñeta 2: "" | Aprobado |
| TX-03 | El cambio queda en la bitácora | búsqueda en la bitácora | Un registro | 1 registro(s) | Aprobado |
| TX-04 | Restaurar los textos originales | null en ambos | Vuelven los originales | "Cuidamos de quienes hacen parte de" / "Atención veterinaria integral" | Aprobado |

### Permisos

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| PE-01 | El superadministrador no agenda citas | POST /citas con token de superadministrador | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-02 | El superadministrador no tiene notificaciones | GET /notificaciones | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-03 | El administrador de sede no edita servicios | PUT /servicios/:id | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-04 | El administrador no cambia el horario de otra sede | PUT /horarios con la sede Clinica Veterinaria UDES Bucaramanga (mismos valores) | HTTP 403 | HTTP 403 "Solo puedes cambiar el horario de tu propia sede." | Aprobado |
| PE-05 | El administrador de sede no ve el resumen del sistema | GET /administracion/sistema | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-06 | El administrador de sede no entra al módulo de datos | GET /datos | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-07 | El administrador de sede no crea cuentas de personal | POST /usuarios | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-08 | El administrador de sede no crea sedes | POST /sedes | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-09 | El médico no administra médicos | GET /administracion/medicos | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-10 | El médico no usa rutas exclusivas del cliente | GET /citas/mias | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-11 | El administrador de sede no tiene campana de avisos | GET /notificaciones | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-12 | Un cliente no puede cancelar la cita de otro | PATCH cancelar cita ajena | HTTP 403 | HTTP 403 "No puedes cancelar una cita que no es tuya." | Aprobado |
| PE-13 | Un cliente no puede reprogramar la cita de otro | PATCH reprogramar cita ajena | HTTP 403 | HTTP 403 "No puedes modificar una cita que no es tuya." | Aprobado |
| PE-14 | Un cliente no puede reenviarse la confirmación de otro | reenviar cita ajena | HTTP 403 | HTTP 403 "No puedes reenviar la confirmación de una cita que no es tuya." | Aprobado |
| PE-15 | Un cliente no puede agendar con la mascota de otro | mascotaId ajeno | HTTP 404 | HTTP 404 "La mascota indicada no existe o no pertenece a ese cliente." | Aprobado |
| PE-16 | Un cliente no puede editar la mascota de otro | PUT /mascotas/:id ajena | HTTP 403 o 404 | HTTP 403 "No puedes editar una mascota que no es tuya." | Aprobado |
| PE-17 | Un cliente no puede eliminar la mascota de otro | DELETE /mascotas/:id ajena | HTTP 403 o 404 | HTTP 403 "No puedes eliminar una mascota que no es tuya." | Aprobado |
| PE-18 | Un cliente no entra al panel administrativo | GET /administracion/citas | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-19 | El administrador no cancela citas de otra sede | cita CV-BGA-2026-00193 de Clinica Veterinaria UDES Bucaramanga | HTTP 403 | HTTP 403 "No puedes cancelar una cita que no es tuya." | Aprobado |
| PE-20 | El médico no cancela citas de otro médico | cita CV-BGA-2026-00193 | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |

### Seguridad

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| SE-01 | La foto privada abre con el enlace firmado | GET del enlace firmado | HTTP 200 con imagen | HTTP 200 image/jpeg | Aprobado |
| SE-02 | La foto privada no abre sin firma | misma ruta sin ?e=&f= | HTTP 403 o 404 | HTTP 403 | Aprobado |
| SE-03 | La foto privada no abre con una firma alterada | firma cambiada | HTTP 403 o 404 | HTTP 403 | Aprobado |
| SE-04 | Una búsqueda con inyección SQL no altera la consulta | busqueda: ' OR 1=1 -- | HTTP 200 con 0 resultados | HTTP 200, 0 resultados | Aprobado |
| SE-05 | La bitácora registra los inicios de sesión fallidos | búsqueda "Inicio de sesión fallido" tras AU-10 y AU-15 | Al menos un registro | 2 registros | Aprobado |
| SE-06 | La sesión abierta de una cuenta desactivada deja de servir | token emitido antes de desactivarla | HTTP 401 o 403 | HTTP 401 "Tu sesión ya no es válida. Inicia sesión de nuevo." | Aprobado |
| SE-07 | El cambio de contraseña cierra las sesiones anteriores | token anterior al cambio | HTTP 401 | HTTP 401 "Tu sesión ya no es válida. Inicia sesión de nuevo." | Aprobado |
| SE-08 | La sesión renovada sigue funcionando | token entregado con el cambio | HTTP 200 | HTTP 200 | Aprobado |
| SE-09 | La recuperación no revela si un correo tiene cuenta | correo inexistente y correo registrado | Mismo mensaje en ambos casos | Mismo mensaje: "Si el correo está registrado, se envió un código de recuperación." | Aprobado |
| SE-10 | Ruta protegida sin sesión | GET /citas/mias sin token | HTTP 401 | HTTP 401 "Token no proporcionado." | Aprobado |
| SE-11 | Token alterado para hacerse pasar por superadministrador | payload con rol cambiado y firma original | HTTP 401 | HTTP 401 "Tu sesión venció. Inicia sesión de nuevo." | Aprobado |
| SE-12 | Token sin firma (algoritmo "none") | alg none | HTTP 401 | HTTP 401 "Tu sesión venció. Inicia sesión de nuevo." | Aprobado |
| SE-13 | Token malformado | texto sin formato JWT | HTTP 401 | HTTP 401 "Tu sesión venció. Inicia sesión de nuevo." | Aprobado |
| SE-14 | Otro sitio web no puede leer la API desde el navegador | Origin: https://sitio-ajeno.example | Sin Access-Control-Allow-Origin | ACAO: (ausente) | Aprobado |
| SE-15 | El propio dominio sí está autorizado | Origin: https://citas-veterinaria-udes.duckdns.org | ACAO = https://citas-veterinaria-udes.duckdns.org | ACAO: https://citas-veterinaria-udes.duckdns.org | Aprobado |
| SE-16 | Petición previa (preflight) desde otro sitio | OPTIONS /citas con Origin ajeno | Sin autorización CORS | HTTP 401, ACAO: (ausente) | Aprobado |
| SE-17 | HTTP redirige a HTTPS | http://…/iniciar-sesion | 301 a https:// | HTTP 301 → https://citas-veterinaria-udes.duckdns.org/iniciar-sesion | Aprobado |
| SE-18 | Cabeceras de seguridad en las páginas | GET / | CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, X-Robots-Tag | Las siete presentes | Aprobado |
| SE-19 | Cabeceras de seguridad en la API | GET /api/sedes | CSP default-src 'none', Cache-Control no-store, HSTS | CSP: default-src 'none'; frame-ancestors 'none'; Cache-Control: no-store; HSTS: sí | Aprobado |
| SE-20 | El servidor no revela la tecnología del backend | cabecera X-Powered-By | Ausente | X-Powered-By: (ausente) | Aprobado |
| SE-21 | El servidor web no revela su versión | cabecera Server | "nginx" sin número de versión | Server: nginx | Aprobado |
| SE-22 | No se expone /.env | GET /.env | Sin secretos en la respuesta | HTTP 200, sin secretos | Aprobado |
| SE-23 | No se expone /backend/.env | GET /backend/.env | Sin secretos en la respuesta | HTTP 200, sin secretos | Aprobado |
| SE-24 | No se expone /.git/config | GET /.git/config | Sin secretos en la respuesta | HTTP 200, sin secretos | Aprobado |
| SE-25 | No se expone /uploads/../.env | GET /uploads/../.env | Sin secretos en la respuesta | HTTP 200, sin secretos | Aprobado |
| SE-26 | No se expone /uploads/..%2f..%2f.env | GET /uploads/..%2f..%2f.env | Sin secretos en la respuesta | HTTP 400, sin secretos | Aprobado |
| SE-27 | Ruta de la API inexistente | GET /api/no-existe | HTTP 404; mensaje en JSON | HTTP 404 "Esa ruta no existe." | Aprobado |
| SE-28 | Petición JSON demasiado grande | cuerpo de 300 KB | HTTP 413 | HTTP 413 "Los datos enviados son demasiado grandes." | Aprobado |
| SE-29 | Nginx rechaza cuerpos de más de 25 MB | cuerpo de 26 MB | HTTP 413 | HTTP 413 | Aprobado |
| SE-30 | Solo están abiertos los puertos necesarios | conexión TCP desde internet a 21, 22, 25, 80, 443, 3000, 3306, 4000, 4101, 5432, 6379 y 8080 | Abiertos solo 22, 80 y 443 | Abiertos: 22, 80, 443 | Aprobado |
| SE-31 | Configuración TLS evaluada por SSL Labs (Qualys) | análisis del dominio | Calificación A o superior; sin TLS 1.0 ni 1.1 | Calificación A+; protocolos: TLS 1.2, TLS 1.3; análisis del 2026-10-15T19:03 | Aprobado |
| SE-32 | Límite de intentos por cuenta | 11 intentos fallidos contra una misma cuenta | Del 1 al 10: 401; el 11: 429 | 401, 401, 401, 401, 401, 401, 401, 401, 401, 401, 429 | Aprobado |
| SE-33 | El límite por cuenta no se salta cambiando la IP | mismo correo desde otra conexión y con X-Forwarded-For falso | HTTP 429 | HTTP 429 | Aprobado |
| SE-34 | Límite de intentos por conexión | correos distintos desde la misma IP | HTTP 429 al pasar de 20 intentos en 15 minutos | 429 en el intento 10 de esta serie (antes hubo 12 desde la misma IP) | Aprobado |
| SE-35 | El límite por conexión no se salta con una IP falsa en X-Forwarded-For | correo nuevo con X-Forwarded-For falso | HTTP 429 | HTTP 429 | Aprobado |

### Despliegue

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| DP-01 | La versión final responde por HTTPS | GET /api/health | servidor y base de datos "ok" | HTTP 200 {"servidor":"ok","baseDeDatos":"ok"} | Aprobado |
| DP-02 | La página publicada muestra el aviso de ambiente de pruebas | HTML y JavaScript principal | Contiene "Ambiente de pruebas" | Presente en /assets/index-iKWLR5ru.js | Aprobado |
| DP-03 | Los buscadores no indexan el ambiente de pruebas | robots.txt y X-Robots-Tag | Disallow: / y noindex | robots: User-agent: * Disallow: /; X-Robots-Tag: noindex, nofollow | Aprobado |

### Interfaz

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| UI-01 | visitante: / en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Clínica Veterinaria UDES · Agenda la cita de tu mascota" (captura escritorio-visitante-inicio.png) | Aprobado |
| UI-02 | visitante: /iniciar-sesion en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Iniciar sesión · Clínica Veterinaria UDES" (captura escritorio-visitante-iniciar-sesion.png) | Aprobado |
| UI-03 | visitante: /registrarse en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Crear cuenta · Clínica Veterinaria UDES" (captura escritorio-visitante-registrarse.png) | Aprobado |
| UI-04 | visitante: /olvide-clave en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Recuperar contraseña · Clínica Veterinaria UDES" (captura escritorio-visitante-olvide-clave.png) | Aprobado |
| UI-05 | visitante: /privacidad en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Política de privacidad · Clínica Veterinaria UDES" (captura escritorio-visitante-privacidad.png) | Aprobado |
| UI-06 | visitante: /aviso-legal en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Aviso legal · Clínica Veterinaria UDES" (captura escritorio-visitante-aviso-legal.png) | Aprobado |
| UI-07 | visitante: /ruta-que-no-existe en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Página no encontrada · Clínica Veterinaria UDES" (captura escritorio-visitante-ruta-que-no-existe.png) | Aprobado |
| UI-08 | visitante: /agendar en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Iniciar sesión · Clínica Veterinaria UDES" (captura escritorio-visitante-agendar.png) | Aprobado |
| UI-09 | cliente: /panel en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Mis citas y mascotas · Clínica Veterinaria UDES" (captura escritorio-cliente-panel.png) | Aprobado |
| UI-10 | cliente: /panel?tab=mascotas en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Mis citas y mascotas · Clínica Veterinaria UDES" (captura escritorio-cliente-panel_tab_mascotas.png) | Aprobado |
| UI-11 | cliente: /panel/perfil en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Mi perfil · Clínica Veterinaria UDES" (captura escritorio-cliente-panel_perfil.png) | Aprobado |
| UI-12 | cliente: /agendar en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Agendar cita · Clínica Veterinaria UDES" (captura escritorio-cliente-agendar.png) | Aprobado |
| UI-13 | medico: /medico en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Panel médico · Clínica Veterinaria UDES" (captura escritorio-medico-medico.png) | Aprobado |
| UI-14 | medico: /medico?tab=pacientes en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Panel médico · Clínica Veterinaria UDES" (captura escritorio-medico-medico_tab_pacientes.png) | Aprobado |
| UI-15 | medico: /medico/perfil en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Mi perfil · Clínica Veterinaria UDES" (captura escritorio-medico-medico_perfil.png) | Aprobado |
| UI-16 | administrador: /admin en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Panel de administración · Clínica Veterinaria UDES" (captura escritorio-administrador-admin.png) | Aprobado |
| UI-17 | superadministrador: /admin en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Panel de administración · Clínica Veterinaria UDES" (captura escritorio-superadministrador-admin.png) | Aprobado |
| UI-18 | visitante: / en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Clínica Veterinaria UDES · Agenda la cita de tu mascota" (captura movil-visitante-inicio.png) | Aprobado |
| UI-19 | visitante: /iniciar-sesion en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Iniciar sesión · Clínica Veterinaria UDES" (captura movil-visitante-iniciar-sesion.png) | Aprobado |
| UI-20 | visitante: /registrarse en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Crear cuenta · Clínica Veterinaria UDES" (captura movil-visitante-registrarse.png) | Aprobado |
| UI-21 | visitante: /olvide-clave en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Recuperar contraseña · Clínica Veterinaria UDES" (captura movil-visitante-olvide-clave.png) | Aprobado |
| UI-22 | visitante: /privacidad en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Política de privacidad · Clínica Veterinaria UDES" (captura movil-visitante-privacidad.png) | Aprobado |
| UI-23 | visitante: /aviso-legal en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Aviso legal · Clínica Veterinaria UDES" (captura movil-visitante-aviso-legal.png) | Aprobado |
| UI-24 | visitante: /ruta-que-no-existe en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Página no encontrada · Clínica Veterinaria UDES" (captura movil-visitante-ruta-que-no-existe.png) | Aprobado |
| UI-25 | visitante: /agendar en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Iniciar sesión · Clínica Veterinaria UDES" (captura movil-visitante-agendar.png) | Aprobado |
| UI-26 | cliente: /panel en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Mis citas y mascotas · Clínica Veterinaria UDES" (captura movil-cliente-panel.png) | Aprobado |
| UI-27 | cliente: /panel?tab=mascotas en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Mis citas y mascotas · Clínica Veterinaria UDES" (captura movil-cliente-panel_tab_mascotas.png) | Aprobado |
| UI-28 | cliente: /panel/perfil en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Mi perfil · Clínica Veterinaria UDES" (captura movil-cliente-panel_perfil.png) | Aprobado |
| UI-29 | cliente: /agendar en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Agendar cita · Clínica Veterinaria UDES" (captura movil-cliente-agendar.png) | Aprobado |
| UI-30 | medico: /medico en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Panel médico · Clínica Veterinaria UDES" (captura movil-medico-medico.png) | Aprobado |
| UI-31 | medico: /medico?tab=pacientes en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Panel médico · Clínica Veterinaria UDES" (captura movil-medico-medico_tab_pacientes.png) | Aprobado |
| UI-32 | medico: /medico/perfil en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Mi perfil · Clínica Veterinaria UDES" (captura movil-medico-medico_perfil.png) | Aprobado |
| UI-33 | administrador: /admin en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Panel de administración · Clínica Veterinaria UDES" (captura movil-administrador-admin.png) | Aprobado |
| UI-34 | superadministrador: /admin en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Panel de administración · Clínica Veterinaria UDES" (captura movil-superadministrador-admin.png) | Aprobado |
| UI-35 | cliente: aviso obligatorio de cita por reagendar en escritorio | 1366x820; cita CV-PRB-2026-00014 por reagendar | Ventana "Debes reagendar una cita" con la cita y sin desborde | "Debes reagendar una cita": Debes reagendar una cita Por cambios en el horario de la clínica, esta cita ya no se puede atender en su fecha original. | Aprobado |
| UI-36 | cliente: aviso obligatorio de cita por reagendar en movil | 390x844; cita CV-PRB-2026-00014 por reagendar | Ventana "Debes reagendar una cita" con la cita y sin desborde | "Debes reagendar una cita": Debes reagendar una cita Por cambios en el horario de la clínica, esta cita ya no se puede atender en su fecha original. | Aprobado |
| UI-37 | administrador: horario de la sede con los festivos | 1366x820, Horario > Cambiar horario | Sección de festivos con las fechas nacionales cerradas | sección de festivos; "Día de Todos los Santos" visible; 19 marcados "Cerrado" | Aprobado |
| UI-38 | Sin errores de JavaScript en las pantallas nuevas | consola del navegador | 0 errores | 0 errores | Aprobado |

### Flujo en el navegador

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| FL-01 | Iniciar sesión escribiendo en el formulario | correo y contraseña del cliente de pruebas | Entra a /panel y lo saluda por su nombre | Ruta /panel; encabezado "Hola, Cliente" | Aprobado |
| FL-02 | Abrir el agendamiento desde el panel | botón Agendar nueva cita | Abre /agendar | Ruta /agendar | Aprobado |
| FL-03 | Recorrer los pasos de mascota, servicio, sede, fecha y hora | Firulais Prueba, Consulta médica, Sede de Pruebas, día 27, primera hora libre | Cada paso se puede elegir, el resumen lateral muestra lo elegido y aparece Confirmar cita | mascota: ok; servicio: ok; continuar 1: ok; sede: ok; día 27: ok; hora 7:00 a. m.: ok; botón Confirmar cita visible: ok | Aprobado |
| FL-04 | Confirmar la cita desde la interfaz | botón Confirmar cita | Pantalla "¡Tu cita ha sido agendada!" con el código | Agendada: CV-PRB-2026-00012 | Aprobado |
| FL-05 | La cita guardada coincide con lo elegido en pantalla | día 27, hora 7:00 a. m. | Misma fecha y hora en la base | Guardada: 27/10/26, 7:00 a. m., Sede de Pruebas, Firulais Prueba | Aprobado |
| FL-06 | La cita nueva aparece en "Mis citas" en el teléfono | 390x844 | La lista muestra la cita | Aparece | Aprobado |
| FL-07 | Sin errores de JavaScript durante el flujo | consola del navegador | 0 errores | 0 errores | Aprobado |

### Integridad

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| IN-01 | Las cuentas de la base publicada quedaron iguales | huella md5 de id, activo, rol, sede y correo de todas las cuentas, antes y después | eaaf37405848706bcd448eab7870ec47 | 36 cuentas; huella eaaf37405848706bcd448eab7870ec47 | Aprobado |
| IN-02 | Las citas y mascotas de la base publicada no cambiaron | conteos y huella de id, estado y fecha de las citas | 314 citas y 32 mascotas | 314 citas, 32 mascotas; huella de citas igual | Aprobado |


# Anexo: pruebas anteriores (histórico)

## Histórico: batería del 14 de octubre de 2026 y comprobaciones intermedias

El informe conserva el registro completo de 290 pruebas funcionales, de seguridad, rendimiento e interfaz ejecutadas el 14 de octubre de 2026 sobre el ambiente de pruebas publicado en `https://citas-veterinaria-udes.duckdns.org` (Amazon EC2 `t3.micro` en us-east-2, Ubuntu 24.04, PostgreSQL 18, Node.js 22 con PM2, Nginx con certificado de Let's Encrypt). Esa ejecución corresponde al commit `a364595`.

Resultado: **289 de 290 casos aprobados**. El único caso no aprobado (LH-08) depende de las fotos cargadas en la plataforma, no del código.

**Alcance de la versión:** los 290 casos de este informe se ejecutaron sobre el commit `a364595`; sus resultados no se deben atribuir a revisiones posteriores. El 14 de octubre de 2026 se verificó por SSH y en modo de solo lectura que AWS indicaba `f5ac5f8`, la revisión local contrastada ese día. Entre las revisiones se modificó el permiso de cancelación y reprogramación del médico; por tanto, el caso ME-16 es histórico y no describe el comportamiento final. El 15 de octubre se publicó en AWS el commit `6390ab6`, que integra la validación de formularios y el calendario de festivos, y se ejecutaron comprobaciones acotadas de despliegue y salud descritas abajo. La batería completa de 290 casos no se repitió sobre `f5ac5f8` ni sobre `6390ab6`.

## Histórico: Verificación posterior al despliegue (15 de octubre de 2026)

Se actualizó el ambiente de demostración AWS al commit `6390ab6`. Antes del cambio se generaron y verificaron un respaldo PostgreSQL en formato custom y un respaldo del código desplegado. Se aplicó la migración aditiva `incremento_18a_festivos_colombia.sql`; el backend volvió a quedar en línea tras el reinicio de PM2.

| Comprobación de solo lectura | Resultado observado |
|---|---|
| Versión desplegada | `/srv/citas-udes/VERSION` indica `6390ab6`; proceso `citas-udes` en estado `online`. |
| API y base de datos | `GET /api/health` devuelve `{"servidor":"ok","baseDeDatos":"ok"}`. |
| Rutas públicas | Sedes, servicios, datos públicos de la clínica y horario de una sede existente responden HTTP 200. |
| Permiso del calendario de festivos | `GET /api/horarios/festivos` sin sesión responde HTTP 401. |
| Interfaz compilada | HTML, JavaScript principal y CSS responden HTTP 200; el bundle contiene el aviso «Ambiente de pruebas». |
| Exclusión de buscadores | La página y la API envían `X-Robots-Tag: noindex, nofollow`; `robots.txt` indica `Disallow: /`. |
| Migración e integridad | Existe la tabla `horario_excepcion_sede`; antes y después se mantienen 36 usuarios, 32 mascotas y 314 citas. No se crearon citas ni cuentas nuevas. |

Esta revisión es un smoke test de lectura y despliegue, no una repetición de las pruebas funcionales de 290 casos, de las pruebas de correo, de Lighthouse ni de la inspección visual de 34 pantallas. Las 510 pruebas automatizadas se ejecutaron localmente sobre el mismo commit y usaron modelos simulados; no se ejecutaron contra la base de AWS.

## Histórico: Compilación local e instalador (15 de octubre de 2026)

La compilación local de producción del frontend completó correctamente y transformó 1103 módulos; el bundle local no contiene el aviso destinado al ambiente AWS de pruebas. Vite emitió una advertencia no bloqueante por el tamaño de los paquetes de administración y ExcelJS, ambos superiores a 500 kB minificados. El instalador de Windows se amplió para instalar Node.js LTS y PostgreSQL 18 mediante WinGet cuando faltan runtimes compatibles, y para ejecutar `npm ci` en ambos proyectos. Se validó la sintaxis de PowerShell; esa revisión no ejecutó el instalador; la prueba de punta a punta del 15 de octubre está en la sección «Instalador local de Windows» del informe vigente.

La revisión estática local con `npm run lint` reportó 20 errores y dos advertencias en 15 archivos frontend. La comparación de los archivos frontend modificados con la revisión base no detectó errores nuevos; los módulos nuevos de validación y festivos quedaron sin diagnósticos. Los hallazgos existentes se conservan como deuda técnica.

La copia local de PostgreSQL se respaldó antes de aplicar la migración aditiva `incremento_18a_festivos_colombia.sql`. Después se confirmó la tabla nueva y se realizó un smoke test con las cuatro cuentas ficticias locales: los cuatro inicios de sesión respondieron HTTP 200; cliente y médico recibieron HTTP 403 al consultar festivos, mientras los dos perfiles administrativos recibieron HTTP 200. La lista presentó 18 festivos nacionales de 2026, todos cerrados por defecto. El número de usuarios pasó de 27 a 31 por las cuatro cuentas de evaluación; las 28 mascotas y las 305 citas se conservaron. No se enviaron correos ni se crearon citas.

## Histórico: Revisión de la versión final (14 de octubre de 2026)

El 14 de octubre se repitieron comprobaciones de acceso, permisos, interfaz y disponibilidad sobre el servicio AWS, y se ejecutaron pruebas automatizadas en la copia local correspondiente a `f5ac5f8`. Esta revisión complementa el informe de 290 casos; no lo reemplaza ni se presenta como una repetición íntegra. La verificación del 15 de octubre se documenta en la sección anterior.

| Comprobación | Resultado observado |
|---|---|
| Versión y salud | `/srv/citas-udes/VERSION` indica `f5ac5f8`; `GET /api/health` responde HTTP 200. |
| Acceso por perfiles | Las cuatro cuentas sintéticas inician sesión por interfaz y API; se abren los paneles de cliente, médico, administrador de sede y superadministrador. |
| Permisos de API | 13 consultas autorizadas responden HTTP 200; cuatro intentos entre perfiles responden HTTP 403; una ruta administrativa sin sesión responde HTTP 401. |
| Regla del médico | Los intentos de cancelar o reprogramar una cita responden HTTP 403. |
| Interfaz administrativa | Se revisaron Citas, Médicos, Pacientes, Servicios, Horario y Reportes del administrador; y Sedes, Usuarios, Servicios, Página web, Catálogos, Datos y Bitácora del superadministrador. La vista previa de textos alternó entre computador y celular sin guardar cambios. |
| HTTPS y rutas | HTTPS responde HTTP 200, con certificado válido, HTTP/2, HSTS y cabeceras de seguridad; HTTP redirige a HTTPS; una ruta API inexistente responde HTTP 404 en JSON. |
| Puertos | Los puertos 4000 y 5432 no aceptaron conexiones desde internet. PostgreSQL escucha solo en `127.0.0.1:5432`. |
| Carga de solo lectura | 5.065 solicitudes concurrentes a `GET /api/sedes` durante 20 segundos; 0 fallos. Percentil 50: 93 ms; percentil 95: 120 ms; percentil 97,5: 146 ms; máximo: 584 ms. |
| Pruebas automatizadas | 502 de 502 aprobadas en 32 conjuntos, ejecutadas localmente sobre el código que se verificó en AWS. |
| Compilación web | `npm run build` terminó correctamente. Vite avisó que los paquetes de ExcelJS y del panel administrativo superan 500 KB minificados. |
| Integridad | Las cantidades antes y después fueron 314 citas y 32 mascotas; la sede PRB continúa inactiva. No se modificaron citas ni mascotas. |

La medición de carga de esta revisión consultó el catálogo de sedes y no es directamente comparable con la medición anterior sobre disponibilidad de citas. Lighthouse, SSL Labs y la entrega de correos a buzones externos no se repitieron en esta revisión; las cuentas `example.test` no reciben correo. Tampoco se repitió la batería completa de pantallas móviles en un emulador de dispositivo.

## Histórico: Cómo se probó

- **Desde el equipo de la autora y contra el sitio publicado**, no contra el servidor local: cada petición pasó por internet, Nginx, HTTPS y el backend real, con la base de datos real del ambiente.
- **Datos aislados:** el superadministrador de pruebas (creado con `npm run crear:superadmin`) creó una *Sede de Pruebas* (código PRB) con su propio administrador, médico y cliente. Así ninguna cita ni aviso tocó a las cuentas existentes. Las únicas cuentas existentes que se usaron fueron las de ejemplo (`@demo.udes.co`), solo para comprobar permisos.
- **Correos reales:** cada cuenta de prueba tenía un buzón temporal de Guerrilla Mail que se leía desde la consola. Así se comprobó que cada correo llega, cuánto tarda y qué contiene (códigos, contraseña temporal, fechas). Los buzones de mail.tm no reciben correos de Gmail y tempmail.lol recibió solo uno de dos; por eso se usó Guerrilla Mail (caso CO-00).
- **Navegador:** Microsoft Edge sin ventana, controlado por el protocolo de depuración, en escritorio (1366x820) y teléfono (390x844). Se revisaron 34 pantallas y se hizo un agendamiento completo escribiendo en los formularios y pulsando los botones por su texto.
- **Herramientas externas:** Lighthouse 12.8.2 (rendimiento, accesibilidad, buenas prácticas y SEO), SSL Labs de Qualys (TLS), autocannon 8.0.0 (carga) y pruebas de puertos TCP.
- **Antes de empezar** se sacó una copia de la base (`/var/backups/citas-udes/antes-de-pruebas-20261014-0441.dump`) y una huella de las cuentas existentes. Al terminar, la huella es idéntica (IN-01) y las cantidades de citas y mascotas previas no cambiaron (IN-02).

## Histórico: Resumen por módulo

| Módulo | Casos | Aprobados |
|---|---|---|
| Registro | 8 | 8 |
| Autenticación | 16 | 16 |
| Cuenta del cliente | 14 | 14 |
| Mascotas | 8 | 8 |
| Citas | 27 | 27 |
| Notificaciones | 5 | 5 |
| Correo | 20 | 20 |
| Médico veterinario | 17 | 17 |
| Administrador de sede | 23 | 23 |
| Superadministrador | 42 | 42 |
| Permisos | 20 | 20 |
| Seguridad | 35 | 35 |
| Rendimiento y accesibilidad | 8 | 7 |
| Carga | 4 | 4 |
| Interfaz | 34 | 34 |
| Flujo en el navegador | 7 | 7 |
| Integridad | 2 | 2 |
| **Total** | **290** | **289** |

## Histórico: Hallazgos y correcciones

| Hallazgo | Corrección | Resultado |
|---|---|---|
| Nginx no comprimía JavaScript ni CSS (solo HTML) | Se activó `gzip_types` en `/etc/nginx/nginx.conf` | El JavaScript principal pasó de 377 KB a 115 KB |
| El sitio se servía con HTTP/1.1 | `listen 443 ssl http2` | Lighthouse observa HTTP/2 |
| Rendimiento en móvil de 59 a 66 (Lighthouse) | Las dos correcciones anteriores | Inicio 59 → 81; inicio de sesión 65 → 97; registro 66 → 96 |
| La cabecera `Server` mostraba la versión exacta de Nginx | `server_tokens off` | Ahora dice solo "nginx" |
| El aviso del ambiente de pruebas tapaba texto en escritorio | Se acortó a "Ambiente de pruebas" (commit `a364595`) | Verificado en capturas |
| La foto de la sede de Bucaramanga se carga de un sitio externo y pesa 11 MB; la de un servicio es un PNG de 1,2 MB | Pendiente: son datos, no código | Subir fotos propias reducidas desde el panel (Sedes y Servicios) |

Las tres primeras correcciones son de configuración del servidor y deben repetirse en producción (ver `docs/despliegue.md`).

## Histórico: Estado en que quedó el ambiente

- Las citas de prueba futuras se cancelaron y las cuentas de administrador, médico y cliente de prueba quedaron desactivadas. La *Sede de Pruebas* está desactivada y no aparece en la página pública. El servicio "Servicio de prueba" está desactivado.
- El superadministrador de pruebas sigue activo, porque el sistema no deja que una cuenta se desactive a sí misma (SA-41). Debe desactivarlo la cuenta de superadministrador de la clínica desde *Usuarios*.
- Para volver exactamente al estado anterior a las pruebas basta con restaurar la copia del punto anterior.
- Los inicios de sesión fallidos de la prueba SE-34 bloquean, durante 15 minutos, los inicios de sesión desde la conexión del equipo con que se probó.

## Histórico: Registro

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| RE-01 | Registro sin autorizar el tratamiento de datos | autorizaTratamiento: false | HTTP 400 | HTTP 400 "Para crear tu cuenta debes autorizar el tratamiento de tus datos personales." | Aprobado |
| RE-02 | Registro con el campo trampa lleno (robot) | sitioWeb con valor | HTTP 400 | HTTP 400 "No se pudo crear la cuenta. Recarga la página e inténtalo de nuevo." | Aprobado |
| RE-03 | Registro con contraseña común | contrasena: password | HTTP 400 | HTTP 400 "Esa contraseña es muy fácil de adivinar. Elige otra, por ejemplo una frase corta." | Aprobado |
| RE-04 | Registro con un correo que ya tiene cuenta | correo de una cuenta existente | HTTP 409 | HTTP 409 "Ya existe una cuenta registrada con este correo." | Aprobado |
| RE-05 | Registro válido: queda pendiente de confirmar el correo | datos completos y autorización | HTTP 202 | HTTP 202 "Te enviamos un código de 6 dígitos a udesclientemv7mx4zl@guerrillamailblock.com. Escríbelo para terminar de cr" | Aprobado |
| RE-06 | Verificación con un código equivocado | código 000000 | HTTP 400 | HTTP 400 "Código inválido o expirado." | Aprobado |
| RE-07 | Verificación con el código correcto crea la cuenta | código recibido por correo | HTTP 201; sesión iniciada | HTTP 201 | Aprobado |
| RE-08 | El mismo código no sirve dos veces | repetir la verificación | HTTP 400 o 409 | HTTP 400 "Código inválido o expirado." | Aprobado |

## Histórico: Autenticación

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| AU-01 | Inicio de sesión con la contraseña temporal | Correo y contraseña del correo de credenciales | HTTP 200 | HTTP 200 | Aprobado |
| AU-02 | La sesión con clave temporal exige crear una contraseña propia | Respuesta del inicio de sesión | debe_cambiar_contrasena verdadero | debeCambiar: true | Aprobado |
| AU-03 | Con la sesión temporal no se puede usar el panel | GET /administracion/tablero con token temporal | HTTP 401 o 403 | HTTP 403 "Antes de continuar debes crear tu propia contraseña." | Aprobado |
| AU-04 | La contraseña nueva no puede ser la temporal | contrasenaNueva = temporal | HTTP 400 | HTTP 400 "Elige una contraseña distinta a la temporal que recibiste por correo." | Aprobado |
| AU-05 | Contraseña común rechazada | contrasenaNueva = 12345678 | HTTP 400 | HTTP 400 "Esa contraseña es muy fácil de adivinar. Elige otra, por ejemplo una frase corta." | Aprobado |
| AU-06 | Crear la contraseña propia en el primer ingreso | contraseña nueva válida | HTTP 200; sesión normal | HTTP 200 | Aprobado |
| AU-07 | Primer ingreso del médico y creación de su contraseña | clave temporal y contraseña nueva | HTTP 200 | HTTP 200 | Aprobado |
| AU-08 | Inicio de sesión de una cuenta de ejemplo | maria.gomez@demo.udes.co | HTTP 200 | HTTP 200 | Aprobado |
| AU-09 | Una cuenta desactivada no puede iniciar sesión | contraseña correcta | HTTP 403 "cuenta inactiva" | HTTP 403 CUENTA_INACTIVA | Aprobado |
| AU-10 | Con contraseña equivocada no se revela que la cuenta está inactiva | contraseña equivocada | HTTP 401 genérico | HTTP 401 "El correo o la contraseña no son correctos. Revísalos e inténtalo de nuevo." | Aprobado |
| AU-11 | La cuenta reactivada vuelve a entrar | contraseña correcta | HTTP 200 | HTTP 200 | Aprobado |
| AU-12 | Restablecer con un código equivocado | código 000000 | HTTP 400 | HTTP 400 "Código inválido o expirado." | Aprobado |
| AU-13 | Restablecer la contraseña con el código correcto | código recibido | HTTP 200 | HTTP 200 "Contraseña actualizada correctamente." | Aprobado |
| AU-14 | El código de recuperación no sirve dos veces | mismo código | HTTP 400 | HTTP 400 "Código inválido o expirado." | Aprobado |
| AU-15 | La contraseña anterior ya no sirve | contraseña previa al restablecimiento | HTTP 401 | HTTP 401 "El correo o la contraseña no son correctos. Revísalos e inténtalo de nuevo." | Aprobado |
| AU-16 | Entrar con la contraseña restablecida | contraseña nueva | HTTP 200 | HTTP 200 | Aprobado |

## Histórico: Cuenta del cliente

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| CU-01 | Ver los datos de su cuenta | GET /cuenta/perfil | HTTP 200 | HTTP 200 | Aprobado |
| CU-02 | Teléfono con letras | telefono "abc" | HTTP 400 | HTTP 400 "El teléfono solo admite números, espacios, + y -." | Aprobado |
| CU-03 | Actualizar nombre y teléfono | nombre y teléfono nuevos | HTTP 200 | HTTP 200 | Aprobado |
| CU-04 | Pedir el código para cambiar la contraseña | POST /cuenta/contrasena/codigo | HTTP 200 | HTTP 200 "Enviamos un código de 6 dígitos a udesclientemv7mx4zl@guerrillamailblock.com. Vence en 15 minutos." | Aprobado |
| CU-05 | Pedir otro código antes de un minuto | segunda solicitud inmediata | HTTP 429 | HTTP 429 "Ya te enviamos un código. Espera 46 segundos para pedir otro." | Aprobado |
| CU-06 | Cambiar la contraseña con un código equivocado | código 000000 | HTTP 400 | HTTP 400 "Código inválido o expirado. Solicita uno nuevo." | Aprobado |
| CU-07 | Cambiar la contraseña con el código correcto | código recibido y contraseña nueva | HTTP 200 | HTTP 200 "Tu contraseña quedó actualizada." | Aprobado |
| CU-08 | Cambiar a un correo con formato inválido | "no-es-un-correo" | HTTP 400 | HTTP 400 "Escribe un correo válido." | Aprobado |
| CU-09 | Cambiar a un correo que ya usa otra cuenta | correo de otra cuenta | HTTP 409 | HTTP 409 "Ese correo ya está registrado en otra cuenta." | Aprobado |
| CU-10 | Pedir el cambio de correo | correo nuevo válido | HTTP 200; el código va al correo nuevo | HTTP 200 "Enviamos un código de 6 dígitos a udesclientenuevomv7ni0db@guerrillamailblock.com. Vence en 15 minutos." | Aprobado |
| CU-11 | Confirmar el correo nuevo con el código | código recibido | HTTP 200 | HTTP 200 "Tu correo quedó actualizado y verificado." | Aprobado |
| CU-12 | La cuenta queda con el correo nuevo | GET /cuenta/perfil | udesclientenuevomv7ni0db@guerrillamailblock.com | udesclientenuevomv7ni0db@guerrillamailblock.com | Aprobado |
| CU-13 | Se inicia sesión con el correo nuevo | correo nuevo y contraseña | HTTP 200 | HTTP 200 | Aprobado |
| CU-14 | Confirmar el correo nuevo con un código equivocado | código 000000 | HTTP 400 | HTTP 400 "Código inválido o expirado. Solicita uno nuevo." | Aprobado |

## Histórico: Mascotas

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| MA-01 | Catálogo público de especies y razas | GET /catalogos/especies | HTTP 200 | HTTP 200 | Aprobado |
| MA-02 | Registrar mascota con un sexo no válido | sexo "otro" | HTTP 400 | HTTP 400 "El sexo debe ser uno de: macho, hembra." | Aprobado |
| MA-03 | Registrar mascota con peso negativo | pesoKg -3 | HTTP 400 | HTTP 400 "El peso debe ser un número mayor a 0." | Aprobado |
| MA-04 | Registrar mascota con datos completos | Canino, Labrador retriever, macho, 12,5 kg | HTTP 201 | HTTP 201 | Aprobado |
| MA-05 | Registrar una segunda mascota | gato hembra | HTTP 201 | HTTP 201 | Aprobado |
| MA-06 | Subir la foto de la mascota | JPEG de 53 KB | HTTP 200 o 201 | HTTP 200 | Aprobado |
| MA-07 | Subir un archivo que no es imagen | archivo de texto | HTTP 400 o 415 | HTTP 400 "La imagen debe ser JPG o PNG." | Aprobado |
| MA-08 | La foto de la mascota se entrega con enlace firmado | GET /mascotas/mias | foto_url con firma (?e=...&f=...) | /uploads/mascotas/25d2c989-f0fd-48ae-9694-691f91887a28.jpg?e=1791997200000&f=… | Aprobado |

## Histórico: Citas

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| CI-01 | Consultar la disponibilidad de la sede | sede de pruebas, Consulta médica, 2026-10-14 | HTTP 200 | HTTP 200 | Aprobado |
| CI-02 | La pausa del médico no aparece disponible | franjas de 12:00 y 12:30 | No disponibles | 12:00 no disponible, 12:30 no disponible | Aprobado |
| CI-03 | Franjas del día según el horario de la sede | horario 07:00 a 19:00 | Primera 07:00, sin franjas fuera del horario | 24 franjas, de 07:00 a 18:30; 22 libres | Aprobado |
| CI-04 | El día bloqueado del médico no tiene franjas libres | fecha 2026-10-19 | 0 franjas disponibles | 0 disponibles | Aprobado |
| CI-05 | Disponibilidad con una fecha que no existe | 31 de febrero | HTTP 400 | HTTP 400 "La fecha debe ser un día que exista, con el formato YYYY-MM-DD." | Aprobado |
| CI-06 | Agendar con un motivo de más de 255 caracteres | motivo de 256 caracteres | HTTP 400 | HTTP 400 "El motivo no puede superar los 255 caracteres." | Aprobado |
| CI-07 | Agendar en una fecha pasada | ayer | HTTP 409 | HTTP 409 "No se puede agendar una fecha en el pasado." | Aprobado |
| CI-08 | Agendar a una hora que no es una franja | 07:10 | HTTP 409 | HTTP 409 "La hora seleccionada no coincide con una franja de atención válida." | Aprobado |
| CI-09 | Agendar durante la pausa del médico | 12:00 | HTTP 409 | HTTP 409 "Ya no hay médicos disponibles en esa franja. Elige otra hora." | Aprobado |
| CI-10 | Agendar una cita válida | 2026-10-14 07:00, Consulta médica | HTTP 201; médico asignado automáticamente | HTTP 201 | Aprobado |
| CI-11 | La cita recibe un código consecutivo de la sede | respuesta del agendamiento | Código CV-PRB-AAAA-NNNNN | CV-PRB-2026-00001 | Aprobado |
| CI-12 | Se asigna el único médico que presta el servicio en la sede | respuesta del agendamiento | Médico De Pruebas | Médico De Pruebas | Aprobado |
| CI-13 | El servidor confirma el envío del correo de la cita | correoEnviado | true | true | Aprobado |
| CI-14 | La misma mascota no puede tener dos citas a la vez | misma mascota y hora | HTTP 409 | HTTP 409 "Esa mascota ya tiene una cita a esa hora." | Aprobado |
| CI-15 | Otra mascota en la misma franja con el único médico ocupado | segunda mascota, misma hora | HTTP 409 | HTTP 409 "Ya no hay médicos disponibles en esa franja. Elige otra hora." | Aprobado |
| CI-16 | La franja agendada deja de aparecer disponible | 07:00 | No disponible | No disponible | Aprobado |
| CI-17 | Servicio de 60 minutos que no alcanza a terminar antes del cierre | 2026-10-15 18:30 (cierra 19:00) | HTTP 409 | HTTP 409 "Ese servicio dura 60 minutos y no alcanza a terminar dentro del horario de atención. Elige una hora más tempra" | Aprobado |
| CI-18 | Agendar un servicio de 60 minutos | 2026-10-15 10:00 | HTTP 201 | HTTP 201 | Aprobado |
| CI-19 | La cita de 60 minutos ocupa también la franja siguiente | 10:30 del mismo día | No disponible | No disponible | Aprobado |
| CI-20 | El cliente ve sus citas | GET /citas/mias | Incluye las citas agendadas | 2 citas | Aprobado |
| CI-21 | Reenviar el correo de confirmación | botón Reenviar correo | HTTP 200 | HTTP 200 "Enviamos de nuevo la confirmación a udesclientemv7mx4zl@guerrillamailblock.com." | Aprobado |
| CI-22 | El cliente reprograma su cita | 2026-10-16 14:00 | HTTP 200 | HTTP 200 | Aprobado |
| CI-23 | Reprogramar con una fecha inválida | 2026-13-45 | HTTP 400 | HTTP 400 "nuevaFechaHora no es una fecha válida." | Aprobado |
| CI-24 | El cliente cancela su cita | PATCH cancelar | HTTP 200 | HTTP 200 | Aprobado |
| CI-25 | No se agenda un servicio desactivado | servicio inactivo | HTTP 409 | HTTP 409 "Ese servicio no está disponible." | Aprobado |
| CI-26 | Cinco solicitudes simultáneas por la misma franja con un solo médico | 4 del cliente (mascotas distintas) y 1 del administrador, 2026-10-22 | Exactamente una cita creada; las demás HTTP 409 | Respuestas: 201, 409, 409, 409, 409 | Aprobado |
| CI-27 | En la base queda una sola cita en esa franja | agenda de la sede | 1 cita agendada | 1 cita(s) agendada(s) a esa hora | Aprobado |

## Histórico: Notificaciones

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| NO-01 | El cliente recibe avisos en la campana | GET /notificaciones | Avisos de las citas | 13 avisos: Cita cancelada; Cita reprogramada; Cita agendada; Recordatorio para Firulais Prueba; Mascota registrada | Aprobado |
| NO-02 | Marcar todos los avisos como leídos | PATCH /notificaciones/leidas | HTTP 200 o 204 | HTTP 204 (sin contenido) | Aprobado |
| NO-03 | El médico recibe el aviso cuando el cliente reprograma y cancela | campana del médico | Avisos de cambio y cancelación | Cita cancelada; Cita reprogramada; Cita cancelada; Cita reprogramada; Nueva cita; Nueva cita | Aprobado |
| NO-04 | Después de marcarlos, no quedan avisos sin leer | GET /notificaciones | 0 sin leer | 0 sin leer | Aprobado |
| NO-05 | Recordatorio automático en la campana 24 horas antes | cita de mañana 07:00; ciclo cada 10 minutos | Aviso "Tu cita se acerca" | "Firulais Prueba tiene Consulta médica el miércoles, 14 de octubre, 7:00 a. m. en Sede de Pruebas, con Médico De Pruebas." | Aprobado |

## Histórico: Correo

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| CO-00 | Entrega a buzones temporales | Correos enviados a mail.tm, tempmail.lol y Guerrilla Mail | Recepción | Gmail aceptó todos los envíos (250 OK). mail.tm no recibió ninguno y tempmail.lol recibió uno de dos; Guerrilla Mail recibió todos. Se usó Guerrilla Mail para las pruebas. Es una limitación de esos servicios, no de la plataforma | Aprobado |
| CO-01 | Llega el correo con las credenciales del administrador de sede | Buzón del administrador | Correo con contraseña temporal | Recibido en 6 s desde citasclinicaveterinariaudes@gmail.com; contiene la contraseña temporal | Aprobado |
| CO-02 | Las tildes del correo se muestran bien | Cuerpo del correo de credenciales | Texto legible con tildes | Se lee "Clínica", "contraseña", "sesión" | Aprobado |
| CO-03 | Llega el correo con las credenciales del médico | Buzón del médico | Correo con contraseña temporal | Recibido en 2 s; con contraseña | Aprobado |
| CO-04 | Llega el código de verificación del registro | Buzón del cliente | Correo con código de 6 dígitos | Recibido en 5 s; código presente | Aprobado |
| CO-05 | Llega el correo de bienvenida | Buzón del cliente | Correo de cuenta creada | Recibido en 4 s | Aprobado |
| CO-06 | Llega el correo de confirmación de la cita | Buzón del cliente | Asunto con CV-PRB-2026-00001 | "Cita confirmada CV-PRB-2026-00001 &mdash; Cl&iacute;nica Veterinaria UDES" en 2 s | Aprobado |
| CO-07 | La confirmación trae la fecha, la sede y la mascota | cuerpo del correo | Sede de Pruebas y Firulais Prueba | sede, mascota | Aprobado |
| CO-08 | Llega el correo reenviado | Buzón del cliente | Segundo correo de confirmación | Recibido en 4 s | Aprobado |
| CO-09 | El cliente recibe la confirmación de la cita que agendó el médico | Buzón del cliente | Correo de confirmación | Recibido en 3 s | Aprobado |
| CO-10 | El dueño recibe el recordatorio del médico | Buzón del cliente | Correo "Recordatorio para Firulais Prueba" | "Recordatorio para Firulais Prueba: Refuerzo de vacuna — Clínica Veterinaria UDES" en 4 s | Aprobado |
| CO-11 | El cliente recibe el aviso del cambio de fecha | Buzón del cliente | Correo "Tu cita cambió de fecha" | Recibido en 4 s | Aprobado |
| CO-12 | El cliente recibe el aviso de cancelación | Buzón del cliente | Correo "Tu cita fue cancelada" | Recibido en 1 s | Aprobado |
| CO-13 | El cliente recibe la confirmación de la cita que agendó la sede | Buzón del cliente | Correo de confirmación | Recibido en 1 s | Aprobado |
| CO-14 | Llega el correo del recordatorio automático | Buzón del cliente | Correo "Recordatorio de tu cita CV-PRB-2026-00001" | "Recordatorio de tu cita CV-PRB-2026-00001 — Clínica Veterinaria UDES" a las 2026-10-14T05:03:40.000Z | Aprobado |
| CO-15 | Llega el código para cambiar la contraseña | Buzón del cliente | Código de 6 dígitos | Recibido en 2 s | Aprobado |
| CO-16 | Llega el código de recuperación de contraseña | Buzón del cliente | Código de 6 dígitos | Recibido en 3 s | Aprobado |
| CO-17 | Llega el código al correo nuevo | Buzón nuevo | Código de 6 dígitos | Recibido en 2 s | Aprobado |
| CO-18 | El asunto conserva tildes y guiones | asunto del correo (entidades HTML de Guerrilla decodificadas) | "Confirma tu nuevo correo — Clínica Veterinaria UDES" | Confirma tu nuevo correo — Clínica Veterinaria UDES | Aprobado |
| CO-19 | Llega la confirmación de la cita agendada desde la interfaz | Buzón del cliente | Correo con CV-PRB-2026-00006 | Recibido en 3 s | Aprobado |

## Histórico: Médico veterinario

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| ME-01 | Ver su perfil profesional | GET /medico/perfil | HTTP 200 | HTTP 200 | Aprobado |
| ME-02 | Editar su biografía | PUT /medico/perfil | HTTP 200 | HTTP 200 | Aprobado |
| ME-03 | Ver los servicios que presta | GET /medico/servicios | Los 3 servicios asignados | 3 servicios | Aprobado |
| ME-04 | Ver sus pacientes (dueños con citas con él) | GET /medico/pacientes | Incluye al cliente de pruebas | 2 paciente(s) | Aprobado |
| ME-05 | Ver el detalle de un paciente | GET /medico/pacientes/:clienteId | HTTP 200 | HTTP 200 | Aprobado |
| ME-06 | Buscar un cliente para agendarle | busqueda "Cliente De Pruebas" | Lo encuentra | Encontrado | Aprobado |
| ME-07 | Ver su horario y bloqueos | GET /medico/disponibilidad | HTTP 200 | HTTP 200 | Aprobado |
| ME-08 | Ver su agenda de citas | GET /administracion/citas | Incluye la cita del cliente | 2 citas | Aprobado |
| ME-09 | Agendar a un cliente (siempre en su sede y consigo mismo) | Vacunación, 2026-10-16 09:00; envía otra sede y otro médico en la petición | HTTP 201 | HTTP 201 | Aprobado |
| ME-10 | El servidor ignora la sede y el médico que envía el médico | sede y médico de la cita creada | Sede de Pruebas y Médico De Pruebas | Sede de Pruebas / Médico De Pruebas | Aprobado |
| ME-11 | Recordatorio con un tipo no válido | tipo "cumpleaños" | HTTP 400 | HTTP 400 "Elige un tipo de recordatorio válido." | Aprobado |
| ME-12 | Recordatorio en una fecha pasada | hace dos días | HTTP 400 | HTTP 400 "El recordatorio debe ser para una fecha y hora futuras." | Aprobado |
| ME-13 | Crear un recordatorio de cuidado para la mascota | vacunación, 2026-11-03 09:00 | HTTP 201 | HTTP 201 | Aprobado |
| ME-14 | Ver los recordatorios de la mascota | GET /medico/recordatorios | HTTP 200 | HTTP 200 | Aprobado |
| ME-15 | El médico reprograma una cita suya | 2026-10-16 10:00 | HTTP 200 | HTTP 200 | Aprobado |
| ME-16 | El médico cancela una cita suya | PATCH cancelar | HTTP 200 | HTTP 200 | Aprobado |
| ME-17 | El médico recibe avisos en la campana | GET /notificaciones | Aviso de la cita agendada por el cliente | 4 avisos | Aprobado |

## Histórico: Administrador de sede

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| AD-01 | Tablero de inicio de la sede | GET /administracion/tablero | HTTP 200 | HTTP 200 | Aprobado |
| AD-02 | Crear médico sin documento | sin documento de identidad | HTTP 400 | HTTP 400 "Nombre completo, correo y documento de identidad son obligatorios." | Aprobado |
| AD-03 | Crear médico de la sede | nombre, correo y documento | HTTP 201; queda en la sede del administrador | HTTP 201 | Aprobado |
| AD-04 | Consultar el catálogo de servicios | GET /servicios/admin | HTTP 200 | HTTP 200 | Aprobado |
| AD-05 | Asignar servicios al médico | 3 servicios (Consulta médica, Vacunación, Servicio de prueba) | HTTP 200 | HTTP 200 | Aprobado |
| AD-06 | Cambiar el horario de su propia sede | sábado 07:00 a 19:00 | HTTP 200 | HTTP 200 | Aprobado |
| AD-07 | Horario del médico fuera del horario de la sede | lunes 06:00 a 12:00 (la sede abre a las 07:00) | HTTP 400 | HTTP 400 "El horario debe estar dentro del horario de Sede de Pruebas (07:00 – 19:00)." | Aprobado |
| AD-08 | Definir el horario del médico con pausa | 7 días 07:00 a 19:00, pausa 12:00 a 13:00 | HTTP 200 | HTTP 200 | Aprobado |
| AD-09 | Bloqueo con la fecha final antes de la inicial | inicio día +5, fin día +3 | HTTP 400 | HTTP 400 "Revisa las fechas: la de inicio debe ser igual o anterior a la final." | Aprobado |
| AD-10 | Registrar un bloqueo en la agenda del médico | día 2026-10-19 completo | HTTP 201 | HTTP 201 | Aprobado |
| AD-11 | Consultar el horario y los bloqueos del médico | GET disponibilidad del médico | HTTP 200 | HTTP 200 | Aprobado |
| AD-12 | Lista de médicos solo de su sede | GET /administracion/medicos | Solo el médico de la sede de pruebas | 1 médico(s): Médico De Pruebas | Aprobado |
| AD-13 | Lista de citas de la sede | GET /administracion/citas | HTTP 200 | HTTP 200 | Aprobado |
| AD-14 | Lista de pacientes de la sede | GET /administracion/pacientes | HTTP 200 | HTTP 200 | Aprobado |
| AD-15 | Reporte de la sede | GET /administracion/reportes | HTTP 200 | HTTP 200 | Aprobado |
| AD-16 | El administrador agenda a nombre de un cliente | Consulta médica, 2026-10-18 08:00 | HTTP 201 | HTTP 201 | Aprobado |
| AD-17 | El médico no puede tener dos citas en la misma franja | otra mascota, mismo médico y hora | HTTP 409 | HTTP 409 "Ese médico ya tiene una cita en esa franja. Elige otra." | Aprobado |
| AD-18 | El administrador reprograma una cita de su sede | 2026-10-18 08:30 | HTTP 200 | HTTP 200 | Aprobado |
| AD-19 | El administrador cancela una cita de su sede | PATCH cancelar | HTTP 200 | HTTP 200 | Aprobado |
| AD-20 | Cancelar una cita ya cancelada | repetir la cancelación | HTTP 400 | HTTP 400 "La cita ya está cancelada." | Aprobado |
| AD-21 | Reprogramar una cita cancelada | cita cancelada | HTTP 400 | HTTP 400 "Solo se pueden reprogramar citas activas." | Aprobado |
| AD-22 | Ver el detalle de un paciente de la sede | GET /administracion/pacientes/:id | HTTP 200 | HTTP 200 | Aprobado |
| AD-23 | El tablero refleja la actividad de la sede | GET /administracion/tablero | Con datos de citas | {"sede":{"id":"403d4e11-c7eb-4269-8e35-6aae05572adc","nombre":"Sede de Pruebas","ciudad":"Bucaramanga"},"citas | Aprobado |

## Histórico: Superadministrador

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| SA-01 | Crear la cuenta de superadministrador con el script del proyecto | npm run crear:superadmin con correo de buzón temporal | Cuenta creada | Cuenta creada | Aprobado |
| SA-02 | Inicio de sesión del superadministrador | Correo y contraseña correctos | HTTP 200 | HTTP 200 | Aprobado |
| SA-03 | Resumen del sistema en el inicio del superadministrador | GET /administracion/sistema | HTTP 200 | HTTP 200 | Aprobado |
| SA-04 | Crear sede con código inválido | codigo "P1" (lleva número) | HTTP 400 | HTTP 400 "El código debe tener de 2 a 5 letras, sin tildes (ej. BGA)." | Aprobado |
| SA-05 | Crear sede nueva | nombre, ciudad y código "prb" | HTTP 201; código guardado en mayúsculas | HTTP 201 | Aprobado |
| SA-06 | El código de la sede se normaliza a mayúsculas | código "prb" | PRB | PRB | Aprobado |
| SA-07 | Crear sede con código repetido | codigo "PRB" ya existente | HTTP 409 | HTTP 409 "Ya existe otra sede con ese código." | Aprobado |
| SA-08 | Definir el horario de atención de la sede | 7 días, 07:00 a 19:00 | HTTP 200 en los 7 días | HTTP 200 en los 7 días | Aprobado |
| SA-09 | Horario que no empieza en punto ni a la media hora | 08:15 a 17:00 | HTTP 400 | HTTP 400 "El horario debe empezar y terminar en punto o a la media hora (por ejemplo 08:00 o 17:30)." | Aprobado |
| SA-10 | Horario con inicio posterior al fin | 18:00 a 08:00 | HTTP 400 | HTTP 400 "La hora de inicio debe ser anterior a la hora de fin." | Aprobado |
| SA-11 | Consulta pública del horario de la sede | GET /horarios?sedeId | 7 días | ? registros | Aprobado |
| SA-12 | Listar categorías de servicio | GET /catalogos/categorias | HTTP 200 | HTTP 200 | Aprobado |
| SA-13 | Crear servicio | nombre, categoría, precio y 60 minutos | HTTP 201 | HTTP 201 | Aprobado |
| SA-14 | Crear servicio con datos inválidos | precio negativo y sin categoría | HTTP 400 | HTTP 400 "La categoría del servicio es obligatoria." | Aprobado |
| SA-15 | Listar servicios (vista administrativa) | GET /servicios/admin | HTTP 200 | HTTP 200 | Aprobado |
| SA-16 | Crear cuenta de personal con rol no permitido | rol "cliente" | HTTP 400 | HTTP 400 "Este endpoint solo crea cuentas de administrador o veterinario. Para clientes use /api/auth/registro." | Aprobado |
| SA-17 | Crear administrador de sede | nombre, correo, rol administrador y sede de pruebas | HTTP 201; correoEnviado true | HTTP 201 | Aprobado |
| SA-18 | El servidor confirma el envío del correo con las credenciales | respuesta de la creación | correoEnviado: true | correoEnviado: true | Aprobado |
| SA-19 | Crear cuenta con un correo ya registrado | mismo correo | HTTP 409 | HTTP 409 "Ya existe una cuenta registrada con este correo." | Aprobado |
| SA-20 | Desactivar una cuenta de personal | PATCH /usuarios/:id { activo: false } | HTTP 200 | HTTP 200 | Aprobado |
| SA-21 | Crear administrador de sede (buzón que recibe correos) | rol administrador, sede de pruebas | HTTP 201 | HTTP 201 | Aprobado |
| SA-22 | Ver las entidades del módulo de datos | GET /datos | Lista de entidades | Usuarios, Mascotas, Citas, Servicios, Sedes, Horarios de atención | Aprobado |
| SA-23 | Buscar cuentas en el módulo de datos | busqueda "De Pruebas" | Las cuentas de prueba | 5 resultados | Aprobado |
| SA-24 | La bitácora registra las acciones administrativas | búsqueda de cada acción en la bitácora (62 registros, 25 por página) | Cada acción al menos una vez | Crear sede: 1; Crear médico: 1; Cambiar horario de un médico: 2; Crear cuenta de personal: 2; Desactivar: 3; Descargar copia de seguridad: 1; Exportar datos: 1 | Aprobado |
| SA-25 | Exportar usuarios en CSV | GET /datos/usuarios/exportar | Archivo CSV | HTTP 200, text/csv; charset=utf-8, attachment; filename="usuarios-2026-10-14.csv" | Aprobado |
| SA-26 | La copia de seguridad pide la contraseña de quien la descarga | contraseña equivocada | HTTP 403 | HTTP 403 "La contraseña no es correcta." | Aprobado |
| SA-27 | Descargar la copia de seguridad de la base | contraseña correcta | Archivo .sql completo de pg_dump | HTTP 200, 198 KB, encabezado de pg_dump, termina en "dump complete" | Aprobado |
| SA-28 | Corregir el teléfono de una cuenta | teléfono nuevo para el cliente de pruebas | HTTP 200 | HTTP 200 | Aprobado |
| SA-29 | Desactivar la cuenta de un cliente | PATCH /usuarios/:id activo false | HTTP 200 | HTTP 200 | Aprobado |
| SA-30 | Reactivar la cuenta | activo true | HTTP 200 | HTTP 200 | Aprobado |
| SA-31 | Reporte global | GET /administracion/reportes | HTTP 200 | HTTP 200 | Aprobado |
| SA-32 | Reporte de la sede de pruebas | sedeId de pruebas | Cuenta las citas de prueba | {"rango":{"desde":"2026-08-19T05:02:56.138Z","hasta":"2026-10-15T05:02:56.138Z"},"kpis":{"citasMes":4,"citasMesAnterior":0,"serviciosActivos | Aprobado |
| SA-33 | Información de la clínica | GET /api/clinica/admin | HTTP 200 | HTTP 200 | Aprobado |
| SA-34 | Catálogo de especies y razas | GET /api/catalogos/especies/admin | HTTP 200 | HTTP 200 | Aprobado |
| SA-35 | Galería de la página pública | GET /api/galeria/admin | HTTP 200 | HTTP 200 | Aprobado |
| SA-36 | Logotipos | GET /api/logos | HTTP 200 | HTTP 200 | Aprobado |
| SA-37 | Lista de médicos de todas las sedes | GET /api/usuarios?rol=veterinario | HTTP 200 | HTTP 200 | Aprobado |
| SA-38 | Lista de sedes | GET /api/sedes/admin | HTTP 200 | HTTP 200 | Aprobado |
| SA-39 | Desactivar un servicio | activo false | HTTP 200 | HTTP 200 | Aprobado |
| SA-40 | El servicio desactivado no aparece en el catálogo público | GET /servicios | Sin "Servicio de prueba" | No aparece (9 servicios públicos) | Aprobado |
| SA-41 | El superadministrador no puede desactivar su propia cuenta | PATCH a su propio id | HTTP 400 | HTTP 400 "No puedes desactivar tu propia cuenta." | Aprobado |
| SA-42 | Una sede desactivada no aparece en la página pública | GET /sedes tras desactivar la Sede de Pruebas | Sin "Sede de Pruebas" | Clinica Veterinaria UDES Bucaramanga, Clinica Veterinaria UDES Valledupar | Aprobado |

## Histórico: Permisos

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| PE-01 | El superadministrador no agenda citas | POST /citas con token de superadministrador | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-02 | El superadministrador no tiene notificaciones | GET /notificaciones | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-03 | El administrador de sede no edita servicios | PUT /servicios/:id | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-04 | El administrador no cambia el horario de otra sede | PUT /horarios con la sede Clinica Veterinaria UDES Bucaramanga (mismos valores actuales) | HTTP 403 | HTTP 403 "Solo puedes cambiar el horario de tu propia sede." | Aprobado |
| PE-05 | El administrador de sede no ve el resumen del sistema | GET /administracion/sistema | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-06 | El administrador de sede no entra al módulo de datos | GET /datos | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-07 | El administrador de sede no crea cuentas de personal | POST /usuarios | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-08 | El administrador de sede no crea sedes | POST /sedes | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-09 | El médico no administra médicos | GET /administracion/medicos | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-10 | El médico no usa rutas exclusivas del cliente | GET /citas/mias | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-11 | El administrador de sede no tiene campana de avisos | GET /notificaciones | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-12 | Un cliente no puede cancelar la cita de otro | PATCH cancelar cita ajena | HTTP 403 | HTTP 403 "No puedes cancelar una cita que no es tuya." | Aprobado |
| PE-13 | Un cliente no puede reprogramar la cita de otro | PATCH reprogramar cita ajena | HTTP 403 | HTTP 403 "No puedes modificar una cita que no es tuya." | Aprobado |
| PE-14 | Un cliente no puede reenviarse la confirmación de otro | reenviar cita ajena | HTTP 403 | HTTP 403 "No puedes reenviar la confirmación de una cita que no es tuya." | Aprobado |
| PE-15 | Un cliente no puede agendar con la mascota de otro | mascotaId ajeno | HTTP 404 | HTTP 404 "La mascota indicada no existe o no pertenece a ese cliente." | Aprobado |
| PE-16 | Un cliente no puede editar la mascota de otro | PUT /mascotas/:id ajena | HTTP 403 o 404 | HTTP 403 "No puedes editar una mascota que no es tuya." | Aprobado |
| PE-17 | Un cliente no puede eliminar la mascota de otro | DELETE /mascotas/:id ajena | HTTP 403 o 404 | HTTP 403 "No puedes eliminar una mascota que no es tuya." | Aprobado |
| PE-18 | Un cliente no entra al panel administrativo | GET /administracion/citas | HTTP 403 | HTTP 403 "No tiene permisos para acceder a este recurso." | Aprobado |
| PE-19 | El administrador no cancela citas de otra sede | cita CV-BGA-2026-00198 de Clinica Veterinaria UDES Bucaramanga | HTTP 403 | HTTP 403 "No puedes cancelar una cita que no es tuya." | Aprobado |
| PE-20 | El médico no cancela citas de otro médico | cita CV-BGA-2026-00198 | HTTP 403 | HTTP 403 "No puedes cancelar una cita que no es tuya." | Aprobado |

## Histórico: Seguridad

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| SE-01 | La foto privada abre con el enlace firmado | GET del enlace firmado | HTTP 200 con imagen | HTTP 200 image/jpeg | Aprobado |
| SE-02 | La foto privada no abre sin firma | misma ruta sin ?e=&f= | HTTP 403 o 404 | HTTP 403 | Aprobado |
| SE-03 | La foto privada no abre con una firma alterada | firma cambiada | HTTP 403 o 404 | HTTP 403 | Aprobado |
| SE-04 | Una búsqueda con inyección SQL no altera la consulta | busqueda: ' OR 1=1 -- | HTTP 200 con 0 resultados | HTTP 200, 0 resultados | Aprobado |
| SE-05 | La bitácora registra los inicios de sesión fallidos | búsqueda "Inicio de sesión fallido" tras la prueba AU-10 | Al menos un registro posterior a la prueba | 2 registros; el último 2026-10-14T05:02:55.601Z | Aprobado |
| SE-06 | La sesión abierta de una cuenta desactivada deja de servir | token emitido antes de desactivarla | HTTP 401 o 403 | HTTP 401 "Tu sesión ya no es válida. Inicia sesión de nuevo." | Aprobado |
| SE-07 | El cambio de contraseña cierra las sesiones anteriores | token anterior al cambio | HTTP 401 | HTTP 401 "Tu sesión ya no es válida. Inicia sesión de nuevo." | Aprobado |
| SE-08 | La sesión renovada sigue funcionando | token entregado con el cambio | HTTP 200 | HTTP 200 | Aprobado |
| SE-09 | La recuperación no revela si un correo tiene cuenta | correo inexistente y correo registrado | Mismo mensaje en ambos casos | Mismo mensaje: "Si el correo está registrado, se envió un código de recuperación." | Aprobado |
| SE-10 | Ruta protegida sin sesión | GET /citas/mias sin token | HTTP 401 | HTTP 401 "Token no proporcionado." | Aprobado |
| SE-11 | Token alterado para hacerse pasar por superadministrador | payload con rol cambiado y firma original | HTTP 401 | HTTP 401 "Tu sesión venció. Inicia sesión de nuevo." | Aprobado |
| SE-12 | Token sin firma (algoritmo "none") | alg none | HTTP 401 | HTTP 401 "Tu sesión venció. Inicia sesión de nuevo." | Aprobado |
| SE-13 | Token malformado | texto sin formato JWT | HTTP 401 | HTTP 401 "Tu sesión venció. Inicia sesión de nuevo." | Aprobado |
| SE-14 | Otro sitio web no puede leer la API desde el navegador | Origin: https://sitio-ajeno.example | Sin Access-Control-Allow-Origin | ACAO: (ausente) | Aprobado |
| SE-15 | El propio dominio sí está autorizado | Origin: https://citas-veterinaria-udes.duckdns.org | ACAO = https://citas-veterinaria-udes.duckdns.org | ACAO: https://citas-veterinaria-udes.duckdns.org | Aprobado |
| SE-16 | Petición previa (preflight) desde otro sitio | OPTIONS /citas con Origin ajeno | Sin autorización CORS | HTTP 401, ACAO: (ausente) | Aprobado |
| SE-17 | HTTP redirige a HTTPS | http://…/iniciar-sesion | 301 a https:// | HTTP 301 → https://citas-veterinaria-udes.duckdns.org/iniciar-sesion | Aprobado |
| SE-18 | Cabeceras de seguridad en las páginas | GET / | CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, X-Robots-Tag | Las siete presentes | Aprobado |
| SE-19 | Cabeceras de seguridad en la API | GET /api/sedes | CSP default-src 'none', Cache-Control no-store, HSTS | CSP: default-src 'none'; frame-ancestors 'none'; Cache-Control: no-store; HSTS: sí | Aprobado |
| SE-20 | El servidor no revela la tecnología del backend | cabecera X-Powered-By | Ausente | X-Powered-By: (ausente); Server: nginx/1.24.0 (Ubuntu) | Aprobado |
| SE-21 | El servidor web no revela su versión | cabecera Server | "nginx" sin número de versión | Antes: nginx/1.24.0 (Ubuntu). Se aplicó server_tokens off. Ahora: nginx | Aprobado |
| SE-22 | No se expone /.env | GET /.env | Sin secretos en la respuesta | HTTP 200, sin secretos (text/html) | Aprobado |
| SE-23 | No se expone /backend/.env | GET /backend/.env | Sin secretos en la respuesta | HTTP 200, sin secretos (text/html) | Aprobado |
| SE-24 | No se expone /.git/config | GET /.git/config | Sin secretos en la respuesta | HTTP 200, sin secretos (text/html) | Aprobado |
| SE-25 | No se expone /uploads/../.env | GET /uploads/../.env | Sin secretos en la respuesta | HTTP 200, sin secretos (text/html) | Aprobado |
| SE-26 | No se expone /uploads/..%2f..%2f.env | GET /uploads/..%2f..%2f.env | Sin secretos en la respuesta | HTTP 400, sin secretos (text/html) | Aprobado |
| SE-27 | Ruta de la API inexistente | GET /api/no-existe | HTTP 404; mensaje en JSON | HTTP 404 "Esa ruta no existe." | Aprobado |
| SE-28 | Petición JSON demasiado grande | cuerpo de 300 KB | HTTP 413 | HTTP 413 "Los datos enviados son demasiado grandes." | Aprobado |
| SE-29 | Nginx rechaza cuerpos de más de 25 MB | cuerpo de 26 MB | HTTP 413 | HTTP 413 | Aprobado |
| SE-30 | Solo están abiertos los puertos necesarios | conexión TCP desde internet a 22, 80, 443, 4000, 5432, 3000, 8080, 21, 25, 3306 y 6379 | Abiertos solo 22, 80 y 443 | Abiertos: 22, 80, 443. Cerrados: 4000 (backend), 5432 (PostgreSQL), 3000, 8080, 21, 25, 3306, 6379 | Aprobado |
| SE-31 | Configuración TLS evaluada por SSL Labs (Qualys) | análisis completo del dominio | Calificación A o superior; sin TLS 1.0 ni 1.1 | Calificación A+ (IPv4 18.227.180.143); protocolos: TLS 1.2, TLS 1.3; HSTS: present; certificado de YE1, O=Let's Encrypt, C=US válido hasta 2027-01-12; vulnerable a Heartbleed: false, POODLE: false | Aprobado |
| SE-32 | Límite de intentos por cuenta | 11 intentos fallidos contra limite.cuenta.1791956045870@… | Del 1 al 10: 401; el 11: 429 | 401, 401, 401, 401, 401, 401, 401, 401, 401, 401, 429 | Aprobado |
| SE-33 | El límite por cuenta no se salta cambiando la IP aparente | mismo correo con X-Forwarded-For falso | HTTP 429 | HTTP 429 | Aprobado |
| SE-34 | Límite de intentos por conexión | correos distintos desde la misma IP | HTTP 429 al pasar de 20 en 15 minutos (incluye los inicios de sesión previos de las pruebas) | 429 en el intento 7 de esta serie: "Demasiados intentos de inicio de sesión. Espera unos minutos e inténtalo de nuevo." | Aprobado |
| SE-35 | El límite por conexión no se salta con una IP falsa en X-Forwarded-For | correo nuevo con X-Forwarded-For falso | HTTP 429 | HTTP 429 | Aprobado |

## Histórico: Rendimiento y accesibilidad

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| LH-01 | Lighthouse: Página de inicio en móvil (4G simulada) | https://…/ | Accesibilidad y buenas prácticas en 100; rendimiento de 80 o más | Antes: rendimiento 59 (LCP 10.4 s). Después de activar compresión y HTTP/2: rendimiento 81 (LCP 4.2 s); accesibilidad 100; buenas prácticas 100; SEO 66 (solo por el noindex del ambiente de pruebas) | Aprobado |
| LH-02 | Lighthouse: Página de inicio en escritorio | https://…/ | Accesibilidad y buenas prácticas en 100; rendimiento de 80 o más | Antes: rendimiento 76 (LCP 2.6 s). Después de activar compresión y HTTP/2: rendimiento 95 (LCP 1.1 s); accesibilidad 100; buenas prácticas 100; SEO 66 (solo por el noindex del ambiente de pruebas) | Aprobado |
| LH-03 | Lighthouse: Inicio de sesión en móvil (4G simulada) | https://…/iniciar-sesion | Accesibilidad y buenas prácticas en 100; rendimiento de 80 o más | Antes: rendimiento 65 (LCP 5.9 s). Después de activar compresión y HTTP/2: rendimiento 97 (LCP 2.3 s); accesibilidad 100; buenas prácticas 100; SEO 66 (solo por el noindex del ambiente de pruebas) | Aprobado |
| LH-04 | Lighthouse: Inicio de sesión en escritorio | https://…/iniciar-sesion | Accesibilidad y buenas prácticas en 100; rendimiento de 80 o más | Antes: rendimiento 95 (LCP 1.2 s). Después de activar compresión y HTTP/2: rendimiento 100 (LCP 0.5 s); accesibilidad 100; buenas prácticas 100; SEO 66 (solo por el noindex del ambiente de pruebas) | Aprobado |
| LH-05 | Lighthouse: Registro en móvil (4G simulada) | https://…/registrarse | Accesibilidad y buenas prácticas en 100; rendimiento de 80 o más | Antes: rendimiento 66 (LCP 5.9 s). Después de activar compresión y HTTP/2: rendimiento 96 (LCP 2.3 s); accesibilidad 100; buenas prácticas 100; SEO 66 (solo por el noindex del ambiente de pruebas) | Aprobado |
| LH-06 | Lighthouse: Registro en escritorio | https://…/registrarse | Accesibilidad y buenas prácticas en 100; rendimiento de 80 o más | Antes: rendimiento 95 (LCP 1.2 s). Después de activar compresión y HTTP/2: rendimiento 99 (LCP 0.5 s); accesibilidad 100; buenas prácticas 100; SEO 66 (solo por el noindex del ambiente de pruebas) | Aprobado |
| LH-07 | Compresión y HTTP/2 en el servidor web | JavaScript principal y protocolo | Archivos comprimidos y HTTP/2 | JavaScript principal: 377 KB sin comprimir → 115 KB con gzip. Protocolo observado por Lighthouse: h2 | Aprobado |
| LH-08 | Peso de las imágenes de la página de inicio | recursos de la página de inicio | Imágenes optimizadas | La foto de la sede de Bucaramanga se carga desde un sitio externo y pesa 11 MB; la de un servicio es un PNG de 1,2 MB. Es el principal freno restante en móvil (LCP 4,2 s). Se recomienda subir fotos propias reducidas desde el panel | No aprobado |

## Histórico: Carga

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| CA-01 | Consulta pública de sedes con 10 usuarios simultáneos | 10 conexiones durante 20 s desde Colombia | Sin errores; p97,5 por debajo de 2 s | 2081 peticiones en 20 s (104/s); latencia media 96 ms, p50 93 ms, p97,5 104 ms, máx 584 ms; errores 0 | Aprobado |
| CA-02 | Consulta pública de sedes con 25 usuarios simultáneos | 25 conexiones durante 20 s desde Colombia | Sin errores; p97,5 por debajo de 2 s | 5318 peticiones en 20 s (266/s); latencia media 94 ms, p50 92 ms, p97,5 96 ms, máx 460 ms; errores 0 | Aprobado |
| CA-03 | Consulta de disponibilidad de citas con 10 usuarios simultáneos | 10 conexiones durante 20 s desde Colombia | Sin errores; p97,5 por debajo de 2 s | 1915 peticiones en 20 s (96/s); latencia media 104 ms, p50 97 ms, p97,5 172 ms, máx 561 ms; errores 0 | Aprobado |
| CA-04 | Consulta de disponibilidad de citas con 25 usuarios simultáneos | 25 conexiones durante 20 s desde Colombia | Sin errores; p97,5 por debajo de 2 s | 4664 peticiones en 20 s (233/s); latencia media 107 ms, p50 101 ms, p97,5 141 ms, máx 562 ms; errores 0 | Aprobado |

## Histórico: Interfaz

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| UI-01 | visitante: / en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Clínica Veterinaria UDES · Agenda la cita de tu mascota" (captura escritorio-visitante-inicio.png) | Aprobado |
| UI-02 | visitante: /iniciar-sesion en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Iniciar sesión · Clínica Veterinaria UDES" (captura escritorio-visitante-iniciar-sesion.png) | Aprobado |
| UI-03 | visitante: /registrarse en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Crear cuenta · Clínica Veterinaria UDES" (captura escritorio-visitante-registrarse.png) | Aprobado |
| UI-04 | visitante: /olvide-clave en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Recuperar contraseña · Clínica Veterinaria UDES" (captura escritorio-visitante-olvide-clave.png) | Aprobado |
| UI-05 | visitante: /privacidad en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Política de privacidad · Clínica Veterinaria UDES" (captura escritorio-visitante-privacidad.png) | Aprobado |
| UI-06 | visitante: /aviso-legal en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Aviso legal · Clínica Veterinaria UDES" (captura escritorio-visitante-aviso-legal.png) | Aprobado |
| UI-07 | visitante: /ruta-que-no-existe en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Página no encontrada · Clínica Veterinaria UDES" (captura escritorio-visitante-ruta-que-no-existe.png) | Aprobado |
| UI-08 | visitante: /agendar en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Iniciar sesión · Clínica Veterinaria UDES" (captura escritorio-visitante-agendar.png) | Aprobado |
| UI-09 | cliente: /panel en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Mis citas y mascotas · Clínica Veterinaria UDES" (captura escritorio-cliente-panel.png) | Aprobado |
| UI-10 | cliente: /panel?tab=mascotas en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Mis citas y mascotas · Clínica Veterinaria UDES" (captura escritorio-cliente-panel_tab_mascotas.png) | Aprobado |
| UI-11 | cliente: /panel/perfil en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Mi perfil · Clínica Veterinaria UDES" (captura escritorio-cliente-panel_perfil.png) | Aprobado |
| UI-12 | cliente: /agendar en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Agendar cita · Clínica Veterinaria UDES" (captura escritorio-cliente-agendar.png) | Aprobado |
| UI-13 | medico: /medico en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Panel médico · Clínica Veterinaria UDES" (captura escritorio-medico-medico.png) | Aprobado |
| UI-14 | medico: /medico?tab=pacientes en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Panel médico · Clínica Veterinaria UDES" (captura escritorio-medico-medico_tab_pacientes.png) | Aprobado |
| UI-15 | medico: /medico/perfil en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Mi perfil · Clínica Veterinaria UDES" (captura escritorio-medico-medico_perfil.png) | Aprobado |
| UI-16 | administrador: /admin en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Panel de administración · Clínica Veterinaria UDES" (captura escritorio-administrador-admin.png) | Aprobado |
| UI-17 | superadministrador: /admin en escritorio | 1366x820 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Panel de administración · Clínica Veterinaria UDES" (captura escritorio-superadministrador-admin.png) | Aprobado |
| UI-18 | visitante: / en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Clínica Veterinaria UDES · Agenda la cita de tu mascota" (captura movil-visitante-inicio.png) | Aprobado |
| UI-19 | visitante: /iniciar-sesion en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Iniciar sesión · Clínica Veterinaria UDES" (captura movil-visitante-iniciar-sesion.png) | Aprobado |
| UI-20 | visitante: /registrarse en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Crear cuenta · Clínica Veterinaria UDES" (captura movil-visitante-registrarse.png) | Aprobado |
| UI-21 | visitante: /olvide-clave en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Recuperar contraseña · Clínica Veterinaria UDES" (captura movil-visitante-olvide-clave.png) | Aprobado |
| UI-22 | visitante: /privacidad en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Política de privacidad · Clínica Veterinaria UDES" (captura movil-visitante-privacidad.png) | Aprobado |
| UI-23 | visitante: /aviso-legal en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Aviso legal · Clínica Veterinaria UDES" (captura movil-visitante-aviso-legal.png) | Aprobado |
| UI-24 | visitante: /ruta-que-no-existe en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Página no encontrada · Clínica Veterinaria UDES" (captura movil-visitante-ruta-que-no-existe.png) | Aprobado |
| UI-25 | visitante: /agendar en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Iniciar sesión · Clínica Veterinaria UDES" (captura movil-visitante-agendar.png) | Aprobado |
| UI-26 | cliente: /panel en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Mis citas y mascotas · Clínica Veterinaria UDES" (captura movil-cliente-panel.png) | Aprobado |
| UI-27 | cliente: /panel?tab=mascotas en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Mis citas y mascotas · Clínica Veterinaria UDES" (captura movil-cliente-panel_tab_mascotas.png) | Aprobado |
| UI-28 | cliente: /panel/perfil en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Mi perfil · Clínica Veterinaria UDES" (captura movil-cliente-panel_perfil.png) | Aprobado |
| UI-29 | cliente: /agendar en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Agendar cita · Clínica Veterinaria UDES" (captura movil-cliente-agendar.png) | Aprobado |
| UI-30 | medico: /medico en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Panel médico · Clínica Veterinaria UDES" (captura movil-medico-medico.png) | Aprobado |
| UI-31 | medico: /medico?tab=pacientes en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Panel médico · Clínica Veterinaria UDES" (captura movil-medico-medico_tab_pacientes.png) | Aprobado |
| UI-32 | medico: /medico/perfil en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Mi perfil · Clínica Veterinaria UDES" (captura movil-medico-medico_perfil.png) | Aprobado |
| UI-33 | administrador: /admin en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Panel de administración · Clínica Veterinaria UDES" (captura movil-administrador-admin.png) | Aprobado |
| UI-34 | superadministrador: /admin en movil | 390x844 | Carga sin errores, sin desborde, con aviso de pruebas | Correcto: "Panel de administración · Clínica Veterinaria UDES" (captura movil-superadministrador-admin.png) | Aprobado |

## Histórico: Flujo en el navegador

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| FL-01 | Iniciar sesión escribiendo en el formulario | correo y contraseña del cliente de pruebas | Entra a /panel y lo saluda por su nombre | Ruta /panel; encabezado "Hola, Cliente" | Aprobado |
| FL-02 | Abrir el agendamiento desde el panel | botón Agendar nueva cita | Abre /agendar | Ruta /agendar | Aprobado |
| FL-03 | Recorrer los pasos del agendamiento | Página 1: Firulais Prueba y Consulta médica, Continuar. Página 2: Sede de Pruebas, viernes 23 de octubre, 7:00 a. m. | Cada elección se marca y el resumen lateral la muestra | Las cinco elecciones quedaron marcadas; el resumen lateral mostró mascota, servicio (30 minutos), sede y fecha y hora; el paso 2 termina en el botón Confirmar cita (capturas 03 y 04) | Aprobado |
| FL-04 | Confirmar la cita desde la interfaz | botón Confirmar cita | Pantalla "¡Tu cita ha sido agendada!" con el código | Agendada: CV-PRB-2026-00006 | Aprobado |
| FL-05 | La cita guardada coincide con lo elegido en pantalla | día 23, hora 7:00 a. m. | Misma fecha y hora en la base | Guardada: 23/10/26, 7:00 a. m., Sede de Pruebas, Firulais Prueba | Aprobado |
| FL-06 | La cita nueva aparece en "Mis citas" en el teléfono | 390x844 | La lista muestra la cita | Aparece | Aprobado |
| FL-07 | Sin errores de JavaScript durante el flujo | consola del navegador | 0 errores | 0 errores | Aprobado |

## Histórico: Integridad

| Id | Descripción | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| IN-01 | Las cuentas que existían antes de las pruebas quedaron iguales | huella md5 de id, activo, rol, sede y correo de las 27 cuentas previas | e844019153891dc9fc1ad89977bad7b8 (tomada antes de las pruebas) | 27 cuentas; huella e844019153891dc9fc1ad89977bad7b8 | Aprobado |
| IN-02 | Las citas y mascotas previas no cambiaron de cantidad | conteos del módulo de datos | Citas: 307 previas + las de prueba; mascotas: 28 previas + 4 de prueba | Citas: 313 (6 de la sede de pruebas → 307 previas); mascotas: 32 (28 previas) | Aprobado |
