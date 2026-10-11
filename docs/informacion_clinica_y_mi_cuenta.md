# Información de la clínica (RF-23), Mi cuenta de administradores y sin emojis

## Qué hace

**Burbuja de WhatsApp (RF-23).** En la página pública, un círculo verde con el
logo de WhatsApp queda fijo abajo a la derecha. Al pulsarlo abre, en una
pestaña nueva, el chat con el número de la clínica (`https://wa.me/<número>`).
Hay un solo número para toda la clínica (decisión de Oriana).

**Dónde se configura.** Superadministrador > Página web > Información de la
clínica:

- Número de WhatsApp. Se escribe como se quiera (`+57 322 762 1383`,
  `322-762-1383`); se guarda solo en dígitos con el indicativo.
- Interruptor "Mostrar la burbuja de WhatsApp". Apagado, la burbuja no aparece
  y el número no se publica.
- Redes sociales: Instagram, Facebook, TikTok y YouTube. Las que tienen enlace
  salen como iconos en el pie de página; las vacías no aparecen. Cada una solo
  acepta enlaces de su propio sitio.

Cada cambio queda en la bitácora.

**Mi cuenta (administrador de sede y superadministrador).** Se abre desde el
menú del avatar del panel.

- Correo: se cambia confirmando un código enviado al correo nuevo.
- Contraseña (decisión de Oriana): contraseña actual + código de 6 dígitos
  enviado al correo de la cuenta. Sin la contraseña actual correcta no se
  envía ningún código.

Una cuenta cuyo correo no existe (por ejemplo `superadmin@udes.com`) no puede
recibir el código: primero debe cambiar su correo por uno real, que sí se
confirma con un código enviado a ese correo nuevo.

**Sin emojis.** Se quitó el emoji del saludo del cliente y del médico. Los
símbolos de sexo de la mascota (caracteres de texto que algunos equipos
dibujan como emoji) pasaron a iconos del sistema.

## Dónde está

- `database/incremento_12a_info_clinica.sql` (tabla `informacion_clinica`, una sola fila).
- `backend/src/controllers/clinica.controller.js`, `routes/clinica.routes.js` (`/api/clinica`).
- `backend/src/routes/miCuenta.routes.js` (`/api/mi-cuenta`).
- `frontend/src/components/landing/BurbujaWhatsapp.jsx`, `hooks/useInfoClinica.js`, `layout/Footer.jsx`.
- `frontend/src/components/admin/PanelInfoClinica.jsx`, `PanelMiCuenta.jsx`.
- `frontend/src/components/cuenta/SeguridadCuenta.jsx` (tarjetas de correo y contraseña, compartidas con el perfil del cliente).
- `frontend/src/components/ui/EtiquetaSexo.jsx`.

## Pruebas

Unitarias: `backend/tests/clinicaYMiCuenta.test.js` (12). Total del servidor: 392.

| Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| Normalizar WhatsApp | `+57 322 762 1383`, `322-762-1383`, `12345` | `573227621383`, `573227621383`, rechazado | Correcto |
| Enlaces de redes | Enlace de Instagram; enlace de otro sitio; `javascript:` | Guardado con https; rechazados | Correcto |
| Lectura pública | `GET /api/clinica` sin sesión | 200 con número y redes | Correcto |
| Burbuja apagada | `whatsapp_activo = false` | El número no se publica; el superadministrador sí lo ve | Correcto |
| Solo el superadministrador cambia | `PUT /api/clinica` sin sesión, cliente, administrador | 401, 403, 403 | Correcto |
| Burbuja sin número | Vaciar el número con la burbuja encendida | 400 | Correcto |
| Mi cuenta no es para clientes ni médicos | `GET /api/mi-cuenta` | 403 | Correcto |
| Código solo con la contraseña actual | Contraseña incorrecta; vacía; correcta | 400 sin correo; 400; 200 y correo enviado | Correcto |
| Cambio con código | Código incorrecto; código correcto | 400 sin cambio; 200 y contraseña guardada | Correcto |

Revisión en navegador (solo lectura, sin guardar):

| Descripción | Resultado obtenido |
|---|---|
| Burbuja en el landing, 1440 px | Fija abajo a la derecha, 56 px, enlace `wa.me/573227621383`, pestaña nueva |
| Burbuja en celular, 390 px | Visible, sin desbordar la página |
| Página web del superadministrador | Muestra el número, el interruptor encendido y las cuatro redes vacías |
| Menú del avatar | Mi cuenta y Cerrar sesión |
| Mi cuenta sin contraseña actual | Avisa "Escribe tu contraseña actual." y no envía nada |
| Seguridad del perfil del cliente | Igual que antes: sin contraseña actual |
| Emojis y símbolos de texto | Ninguno en pantalla |

Pendiente de probar guardando: cambiar el número y las redes, apagar la
burbuja, y el cambio real de correo y de contraseña con el código que llega.
