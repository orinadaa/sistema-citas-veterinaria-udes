# Correcciones de la auditoría del 11 de octubre de 2026

Estado de cada observación de `docs/auditoria_sistema_2026-10-11.pdf` después de las correcciones del mismo día. Los identificadores son los del informe.

Verificación: 431 pruebas del servidor pasan (24 nuevas en `backend/tests/correccionesAuditoria.test.js` y `cita.controller.test.js`), las consultas nuevas se probaron contra la base real en modo lectura, y las páginas públicas y la vista del médico se revisaron en el navegador con axe-core.

Las pantallas del administrador de sede y del superadministrador se revisaron después, el mismo día, solo mirando (sin guardar, cancelar ni borrar; la base quedó idéntica): Médicos > Horario, la franja de módulos en celular y tableta, el detalle de una cita con la confirmación de cancelar, el horario de atención, y en el superadministrador Inicio, Sedes, Usuarios, Servicios, Página web, Catálogos, Datos (con la copia de seguridad) y Reportes. axe-core encontró 12 botones sin nombre que la auditoría no había visto (filtros desplegables, flechas de semana y accesos de las tarjetas del inicio); quedaron corregidos y ninguna de esas pantallas tiene ya observaciones. **Falta guardar algo desde ellas**: el botón "Guardar horario", "Agregar bloqueo", "Sí, cancelar la cita" y "Descargar copia de seguridad" no se pulsaron.

## Corregido

| N.º | Qué se hizo |
|---|---|
| SEG-01 | El rol y la sede se leen de la base en cada petición (`utils/estadoCuenta.js`); un cambio de rol vale de inmediato. |
| SEG-02 | Cambiar o restablecer la contraseña invalida los tokens anteriores (`usuario.sesiones_validas_desde`). Quien la cambia desde su perfil sigue con un token nuevo. |
| SEG-04 | El registro verifica el correo con un código de 6 dígitos antes de crear la cuenta (ver `docs/verificacion_correo_pruebas.md`). Además: nombre validado, campo trampa contra bots y autorización obligatoria. |
| SEG-05 | Los correos se guardan y se buscan en minúsculas y sin espacios. |
| SEG-06 | Validación de nombre, teléfono, documento, textos y fecha de la mascota, y horas del horario. Además, los errores de dato que lleguen a la base responden 400 en vez de 500. |
| SEG-07 | El médico solo consulta las mascotas de sus pacientes. |
| SEG-08 | La foto de la mascota solo entra por subida de archivo; `fotoUrl` se ignora. |
| SEG-09 | La copia de seguridad pide de nuevo la contraseña (ahora es `POST /api/datos/respaldo`). |
| SEG-11 | Se rechazan las contraseñas más comunes, hay tope de intentos por cuenta (10 cada 15 minutos) y el inicio de sesión tarda lo mismo exista o no el correo. |
| SEG-12 | La clave temporal del personal vence a las 72 horas. |
| SEG-14 | Topes por cuenta al agendar (30 cada 15 minutos) y al reenviar la confirmación (5 cada 15 minutos). |
| SEG-15 | `/api/health` solo responde "ok" o "error". |
| SEG-18 | `backend/.env.example` y comprobación de variables al arrancar. |
| SEG-19 | `/vetui` solo existe en desarrollo. |
| LOG-01 | Una cita ocupa tantas franjas como dure su servicio, debe terminar antes del cierre y el choque se comprueba de nuevo dentro de la transacción. |
| LOG-02 | El servidor y la sesión de la base fijan la zona `America/Bogota`. |
| LOG-03 | Ante un 401 el frontend cierra la sesión y lleva a iniciar sesión con un aviso. |
| LOG-04 | Una cita que ya pasó no se cancela ni se reprograma. |
| LOG-05 | La misma mascota no puede tener dos citas a la vez; máximo 10 citas por atender por cliente cuando agenda él mismo. |
| LOG-06 | No se agenda en una sede o servicio inactivos, ni a un cliente o con un médico inactivos. |
| LOG-09 | El horario de atención valida `HH:MM`, compara en minutos y exige horas en punto o y media. |
| LOG-11 | La consulta de disponibilidad rechaza fechas que no existen. |
| BD-01 | `database/esquema.sql`, `database/datos_iniciales.sql` y `docs/instalacion.md`. |
| BD-02 | Índices de las cuatro llaves foráneas y uno más por médico y fecha (`incremento_13a`). |
| COD-01 | Borrados los restos de la plantilla y los PNG pesados. Las fotos de `servicios-foto/` se conservan: las usa `npm run seed:fotos-servicios` (el informe las contó como sin uso por error). |
| COD-02 | Ícono de la pestaña: el logo corto a color sobre el azul de la píldora. |
| COD-03 | Eliminadas las funciones sin uso. |
| ACC-01 | Nombre accesible en las flechas del calendario, el cierre de los paneles, el menú lateral contraído y, en el panel de administración, los filtros desplegables, las flechas de semana y los accesos de las tarjetas. |
| ACC-02 | Los paneles y ventanas cerrados quedan `inert`. |
| ACC-03 | Corregidas las combinaciones medidas: insignias de categoría, verde de estado, botón azul, texto azul sobre blanco y pie de página. |
| ACC-04 | Título de pestaña por página. |
| ACC-05 | `<main>`, encabezado y pie en las pantallas de sesión; un solo encabezado de página; lista de definición bien formada. |
| ACC-06 | Puntos del carrusel, flechas y enlaces de texto con zona táctil de 24 px o más. |
| ACC-07 | Ningún texto por debajo de 12 px (salvo el contador de la campana). |
| ACC-09 | Botón "Saltar al contenido". |
| UX-01 | Menú para celular y tableta (`layout/MenuMovil.jsx`) con secciones, sesión, perfil y cierre de sesión. La campana también se ve en celular. |
| UX-02 | Franja de módulos deslizable en el panel de administración por debajo de 1024 px. |
| UX-03 | Página "No encontramos esta página". |
| UX-05 | Casilla de autorización en el registro, y páginas `/privacidad` y `/aviso-legal`. |
| REN-01 | Cada pantalla se carga bajo demanda y las librerías de Excel y PDF solo al exportar. El JavaScript inicial pasó de 2,72 MB a 0,37 MB. |
| REN-02 | Logos y foto principal en WebP: de 4,6 MB a 0,24 MB. |

## Corregido en parte

| N.º | Hecho | Falta |
|---|---|---|
| SEG-03 | Guía de la política de contenido (CSP) en `docs/despliegue.md`. | Se configura en el hosting. La sesión sigue en localStorage. |
| SEG-10 | Opción `DB_SSL` y pasos para crear un usuario propio de base de datos. | Aplicarlo al desplegar. |
| SEG-13 | La bitácora registra inicios de sesión fallidos, accesos denegados y contraseñas restablecidas. | Guardar los registros del servidor con retención (despliegue). |
| SEG-17 | `npm audit fix`: quedan 0 avisos altos en el frontend. | 2 moderados por `exceljs` y los de herramientas de desarrollo dependen de sus autores. |
| LOG-07 | El administrador de la sede y el médico pueden cancelar citas desde el detalle; el cliente recibe aviso y correo. El servidor también les permite reprogramar. | Pantalla para reprogramar desde la sede o el médico. |
| LOG-08 | Cambiar o cerrar un horario y desactivar una cuenta avisan cuántas citas quedan afectadas; no se puede quitar el rol de médico a quien tiene citas por atender. | Avisar al quitarle un servicio a un médico. |
| COD-04 | README del frontend, documento de contexto y comentarios al día. | `infoproyecto/` (requerimientos) sigue sin versionar. |
| ACC-03 | (ver arriba) | Revisar a ojo los textos sobre vidrio o degradado, que ninguna herramienta mide. |
| UX-06 | El botón azul de los formularios ahora cumple contraste. | Sigue siendo un estilo distinto al de los botones de vidrio. |
| REN-03 | Carga diferida y tamaño declarado en logos, pie y sedes. | El resto de imágenes se dimensiona por CSS. |

## Pendiente (necesita una decisión tuya o datos de la clínica)

| N.º | Qué | Por qué no se hizo |
|---|---|---|
| LOG-10 | Estados "atendida" y "no asistió". | Es una función nueva: cambia la base, la vista del médico y los reportes. |
| BD-03 | Direcciones de las dos sedes. | Son datos reales de la clínica. |
| BD-04 | Quitar los datos de ejemplo. | Los usas para mostrar el sistema; se quitan con `npm run demo:quitar`. |
| UX-04 | Fotos propias de las sedes. | Hay que subirlas desde Sedes. |
| REN-04 | Paginación de listados. | Cambio amplio en varias pantallas; no urge con el volumen actual. |
| COD-05 | 22 avisos del lint. | Corregirlos toca la carga de datos de casi todos los paneles; conviene hacerlo aparte y probando cada uno. |
| COD-06 | Pruebas contra una base de pruebas. | Requiere montar esa base. |
| SEG-16 | Recodificar fotos en el servidor. | Aceptable en el alcance actual. |
| Legal | Textos de privacidad y aviso legal. | Son un borrador: debe aprobarlos la universidad. |
| Buscadores | `sitemap.xml`, datos estructurados y ficha de Google. | Necesitan el dominio definitivo y las direcciones de las sedes. |

Sin cambio: ACC-08 (la descripción de cada foto de la portada ya se anuncia en el botón que la contiene; el informe lo marcó por error), LOG-12, UX-07, COD-07 y SEG-16 se dejan como están.

## Cambios que conviene saber

- **Registro:** exige marcar la autorización de datos y confirmar el correo con un código. Sin el correo configurado en el servidor nadie puede registrarse.
- **Inicio de sesión:** tras 10 intentos con el mismo correo en 15 minutos, esa cuenta espera.
- **Cambio de contraseña:** cierra las demás sesiones abiertas de esa cuenta.
- **Agendar:** un cliente no puede tener más de 10 citas por atender ni dos citas de la misma mascota a la vez.
- **Horario de atención:** solo horas en punto o y media.
- **Copia de seguridad:** pide la contraseña.
- **Base de datos:** se aplicó `database/incremento_13a_seguridad_auditoria.sql` en la base local (dos columnas nuevas en `usuario` y cinco índices; no modifica datos) y `database/incremento_13b_verificacion_correo.sql` (una tabla nueva, `registro_pendiente`).
