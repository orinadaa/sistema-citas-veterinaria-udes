# Verificación del correo al registrarse

Desde el 11 de octubre de 2026 el registro de clientes (RF-01) va en dos pasos. Cierra la observación SEG-04 de la auditoría (`docs/auditoria_sistema_2026-10-11.pdf`).

## Cómo funciona

1. La persona llena el formulario de `/registrarse` y pulsa **Continuar**. El servidor valida los datos, los guarda como solicitud pendiente y envía un código de 6 dígitos a ese correo. **Todavía no existe la cuenta.**
2. La persona escribe el código. Si es correcto, se crea la cuenta, entra con la sesión iniciada y recibe el correo de bienvenida.

Reglas:

- El código vence a los 15 minutos y admite 5 intentos. Se guarda cifrado (bcrypt), igual que el de recuperación de contraseña.
- **Reenviar código** espera un minuto entre envíos. Un código nuevo anula el anterior.
- **Corregir mis datos** vuelve al formulario sin perder lo escrito. Si se corrige antes de un minuto, sigue sirviendo el mismo código.
- La solicitud queda atada al navegador que la inició: el paso 1 devuelve un identificador que el paso 2 debe traer junto con el código. Sin eso, otra persona podría registrarse encima con el mismo correo y su propia contraseña, y esperar a que el dueño del correo escriba el código que le llega.
- Una solicitud que nadie confirma se borra a las 24 horas: no se conservan datos de quien no terminó de registrarse.
- Si el correo del código no se puede enviar, el registro responde con un error y no deja nada guardado. **Sin el correo configurado (`SMTP_USER` y `SMTP_APP_PASSWORD` en `backend/.env`) nadie puede registrarse.**
- Las cuentas del personal no cambian: las crea el superadministrador y la clave temporal llega al correo, lo que ya comprueba que el correo es suyo.
- Las cuentas que ya existían no se tocan.

## Piezas

| Pieza | Archivo |
|---|---|
| Tabla `registro_pendiente` | `database/incremento_13b_verificacion_correo.sql` |
| Consultas | `backend/src/models/registroPendiente.model.js` |
| `POST /api/auth/registro`, `/registro/verificar`, `/registro/reenviar` | `backend/src/controllers/auth.controller.js`, `backend/src/routes/auth.routes.js` |
| Correo con el código | `backend/src/services/correo.service.js` (`enviarCodigoRegistro`) |
| Pantalla | `frontend/src/pages/RegistroPage.jsx` |

## Pruebas unitarias

`backend/tests/auth.controller.test.js` (modelos y correo simulados). Suite completa del servidor: 440 pruebas, todas pasan.

| N.º | Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| VC-01 | Registro con datos válidos | `POST /api/auth/registro` con nombre, correo, contraseña y autorización | 202, `verificacionPendiente`, `solicitudId`; sin token; no se crea la cuenta; el código va al correo y se guarda cifrado | Igual a lo esperado |
| VC-02 | Falla el envío del código | El servicio de correo responde con error | 502 y se descarta la solicitud | Igual a lo esperado |
| VC-03 | Otra persona se registra con el mismo correo antes de un minuto | Mismo correo, sin `solicitudId` | 429, no cambia los datos guardados | Igual a lo esperado |
| VC-04 | La misma persona corrige sus datos antes de un minuto | Mismo correo, con su `solicitudId` | 202, actualiza los datos, no envía otro código | Igual a lo esperado |
| VC-05 | Código correcto | `POST /api/auth/registro/verificar` con correo, `solicitudId` y código | 201 con usuario y token; cuenta creada con los datos guardados; se borra la solicitud; correo de bienvenida | Igual a lo esperado |
| VC-06 | Falla el correo de bienvenida | El servicio de correo responde con error | 201: la cuenta se crea igual | Igual a lo esperado |
| VC-07 | Código incorrecto | Código `000000` | 400, suma un intento, no crea la cuenta | Igual a lo esperado |
| VC-08 | Código vencido, intentos agotados o correo sin solicitud | Cada caso por separado | 400 en los tres | Igual a lo esperado |
| VC-09 | Código correcto desde otro navegador | `solicitudId` distinto o ausente | 400, no crea la cuenta ni gasta intentos | Igual a lo esperado |
| VC-10 | Mientras tanto se creó una cuenta con ese correo | Ya existe el usuario | 409 | Igual a lo esperado |
| VC-11 | Reenviar pasado un minuto | `POST /api/auth/registro/reenviar` | 200, código nuevo que reemplaza al anterior | Igual a lo esperado |
| VC-12 | Reenviar antes de un minuto, sin solicitud o desde otro navegador | Cada caso por separado | 200 con el mismo mensaje en los tres; no envía nada | Igual a lo esperado |

## Otras comprobaciones

| Descripción | Cómo | Resultado obtenido |
|---|---|---|
| Consultas de la tabla nueva | Contra la base local, dentro de una transacción que se deshizo | Guardar, corregir datos, renovar código, contar intentos y borrar a las 24 horas funcionan; la base quedó sin filas nuevas |
| Pantalla, paso 1 | Navegador, con el servidor simulado (no se envió ningún correo) | Sin marcar la autorización no continúa; con ella pasa al paso 2 |
| Pantalla, paso 2 | Igual | Muestra el correo, el foco queda en el primer recuadro, pegar el código lo reparte, código vacío o incorrecto muestra el error y vacía los recuadros en rojo, "Corregir mis datos" conserva lo escrito |
| Accesibilidad del paso 2 | axe-core 4.10 | Sin observaciones |
| Celular (390 px) | Navegador | Sin desborde horizontal |

**Falta probar con un correo real:** registrarse desde la pantalla con una dirección propia y comprobar que el código llega. No se hizo para no crear cuentas en la base sin autorización.
