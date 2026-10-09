# Clave temporal obligatoria de cambiar y "Mi perfil" del cliente

Decisiones de Oriana (9 de octubre de 2026).

## 1. Clave temporal

Las cuentas que crea otra persona nacen con una contraseña generada por el
sistema y enviada por correo: los administradores y médicos que crea el
superadministrador (Usuarios) y los médicos que crea el administrador de sede
(Médicos). Por seguridad, la primera vez que entran deben establecer su propia
contraseña antes de usar el sistema.

- `usuario.debe_cambiar_contrasena` (migración `incremento_10a_clave_temporal.sql`).
  Queda en falso para todas las cuentas que ya existían.
- Al iniciar sesión, la respuesta trae `debeCambiarContrasena` y el token lleva
  la marca `cambiarClave`. Con ese token el servidor rechaza todo (403,
  `CAMBIO_CLAVE_OBLIGATORIO`) salvo `POST /api/auth/primera-clave`.
- La pantalla `/crear-clave` pide la contraseña nueva dos veces (mínimo 8
  caracteres, distinta a la temporal). Al guardar, la marca se apaga y la
  persona entra a su panel con una sesión normal.
- Cualquier otra forma de cambiar la contraseña (recuperación por código,
  perfil) también apaga la marca.
- Los clientes eligen su contraseña al registrarse: no les aplica.

## 2. Mi perfil del cliente (`/panel/perfil`)

Se abre desde el menú del avatar. Dos secciones:

- **Información personal:** resumen de la cuenta, datos editables (nombre,
  teléfono, documento, dirección) y resumen de actividad (mascotas, citas
  próximas, citas realizadas).
- **Seguridad:**
  - Correo: se cambia confirmando un código de 6 dígitos enviado al correo
    nuevo.
  - Contraseña: se cambia confirmando un código de 6 dígitos enviado al correo
    actual de la cuenta (vence en 15 minutos, 5 intentos, un envío por minuto).

Rutas en `/api/cuenta` (solo clientes, siempre sobre su propia cuenta).

## Pruebas

Unitarias: `backend/tests/claveTemporalYCuenta.test.js` (18). Total del
servidor: 362.

| Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| Login con clave temporal | Cuenta con la marca | `debeCambiarContrasena: true` y token marcado | Correcto |
| Token marcado | Consultar perfil, citas o sesión | 403 `CAMBIO_CLAVE_OBLIGATORIO` | Correcto |
| Establecer contraseña propia | Clave válida | 200, marca apagada, token normal | Correcto |
| Rechazos | Clave corta; igual a la temporal; cuenta sin marca; sin token | 400 / 400 / 400 / 401 | Correcto |
| Personal nuevo | `POST /api/usuarios` | Se crea con clave temporal | Correcto |
| Perfil solo de clientes | Médico; sin sesión | 403 / 401 | Correcto |
| Editar datos | Nombre, teléfono; campos ajenos (rol, activo) | Se guardan solo los permitidos | Correcto |
| Validaciones | Nombre vacío, teléfono con letras, documento inválido | 400 | Correcto |
| Código de contraseña | Pedir; pedir otro antes de 1 minuto | Se envía al correo de la cuenta; 429 | Correcto |
| Cambiar contraseña | Código correcto; incorrecto; vencido; 5 intentos; misma clave | 200 / 400 en los demás | Correcto |

Aceptación sobre la base real, con dos cuentas temporales "zz-" que se
borraron al terminar: ciclo completo de clave temporal (entrar, quedar
bloqueado, establecer clave, entrar con la nueva y no con la temporal) y del
perfil del cliente (ver, editar, borrar opcionales, correo repetido 409,
cambiar contraseña con código). En el navegador: al iniciar sesión con clave
temporal se llega a `/crear-clave` y no se puede ir a otra pantalla.

No probado: el envío real de los correos con código, ni guardar desde las
pantallas del perfil con una cuenta real.
