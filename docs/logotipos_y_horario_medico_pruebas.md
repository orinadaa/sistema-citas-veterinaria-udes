# Logotipos editables y editor del horario del médico

Dos cambios del 11 de octubre de 2026, pedidos por la autora.

## 1. Horario propio del médico con reloj

En **Médicos > Horario > Definir un horario propio** (administrador de sede) el horario se edita con los mismos componentes del horario de atención de la sede: los siete días como botones y el reloj de manecillas.

- Cada día tiene un interruptor **Atiende este día** y las horas **Entra** y **Sale**; con **Agregar una pausa** aparecen **Pausa desde** y **Pausa hasta**. La hora elegida es la que mueve el reloj.
- El punto de cada botón dice si el médico atiende ese día. Un día en que la sede no abre aparece como **Sede cerrada** y no se puede activar.
- Si una hora queda fuera del horario de la sede, o la pausa fuera del día, se avisa en el momento y no se deja guardar.
- A diferencia de la sede, la semana completa se guarda junta con **Guardar horario**.

Archivos: `frontend/src/components/admin/EditorHorarioMedico.jsx`, `HorarioMedicoPanel.jsx`, `frontend/src/utils/horarioMedico.js`. El servidor no cambió.

## 2. Logotipos de la clínica

En **Página web > Logotipos** (superadministrador) están los cinco logotipos que usa el sistema. Cada tarjeta muestra el archivo actual, dónde se usa, y permite subir otro o volver al original.

| Logotipo | Dónde se usa |
|---|---|
| Completo, blanco | Barra superior de la página pública, pantallas de sesión, pie de página, páginas legales |
| Corto, blanco | Transición de la barra superior |
| Corto, a color | Final de la transición (la píldora) y menú lateral contraído |
| Completo, a color | Menú lateral del panel |
| Ícono de la pestaña | Pestaña del navegador |

- Por defecto cada uno usa el archivo que viene con el sistema (`frontend/src/assets/` y `frontend/public/favicon.png`). No hace falta cargar nada al instalar.
- Se aceptan PNG, WebP y JPG de hasta 5 MB. No se acepta SVG: un SVG puede llevar código y se serviría desde el mismo sitio.
- El archivo subido reemplaza el logotipo en toda la página al instante. "Restaurar original" borra el archivo subido.
- Para que la transición de la barra superior siga calzando, los archivos nuevos deben tener las mismas proporciones y márgenes que los originales.
- El ícono de pantalla de inicio del celular y la imagen al compartir el enlace (`icono-180.png`, `icono-512.png`) siguen siendo archivos fijos.

Archivos: `database/incremento_14a_logos.sql` (tabla `logo_clinica`), `backend/src/models/logo.model.js`, `controllers/logo.controller.js`, `routes/logo.routes.js`, `frontend/src/hooks/useLogos.js`, `frontend/src/components/admin/PanelLogos.jsx`.

## Pruebas unitarias

`backend/tests/logo.controller.test.js`. Suite completa del servidor: 449 pruebas, todas pasan.

| N.º | Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| LG-01 | Lectura pública | `GET /api/logos` sin sesión | 200 con los cinco logotipos; `null` en los que usan el original | Igual a lo esperado |
| LG-02 | Subir sin permiso | `POST /api/logos/corto_color` sin sesión y como administrador de sede | 401 y 403; no queda archivo | Igual a lo esperado |
| LG-03 | Subir un PNG | Superadministrador, PNG válido | 200; se registra la ruta `/uploads/logos/...png` | Igual a lo esperado |
| LG-04 | Subir un WebP | Superadministrador, WebP | 200; se registra con extensión `.webp` | Igual a lo esperado |
| LG-05 | Reemplazar | Ya había un archivo propio | 200; el archivo anterior se borra del disco | Igual a lo esperado |
| LG-06 | Entradas no válidas | Clave inexistente, sin archivo, SVG, texto con tipo de imagen | 404, 400, 400, 400; no queda archivo | Igual a lo esperado |
| LG-07 | Restaurar sin permiso | `DELETE /api/logos/corto_color` sin sesión y como administrador de sede | 401 y 403 | Igual a lo esperado |
| LG-08 | Restaurar | Superadministrador | 200; se quita el registro y se borra el archivo | Igual a lo esperado |
| LG-09 | Restaurar uno que ya es el original; clave inexistente | | 200 y 404 | Igual a lo esperado |

## Comprobación en el navegador

Con una sesión y un servidor simulados (no se entró a ninguna cuenta real ni se tocó la base).

| Descripción | Resultado obtenido |
|---|---|
| Editor: siete días, horas del lunes, agregar pausa | Correcto; la pausa propuesta es de 12:00 a 1:00 |
| Editor: salida después del cierre de la sede | Avisa en el día y "Guardar horario" no envía nada |
| Editor: apagar el martes, domingo con la sede cerrada, guardar | Envía lunes (con pausa), miércoles a sábado; sin martes ni domingo |
| Editor en celular (390 px) | Sin desborde; axe-core sin observaciones |
| Logotipos: las cinco tarjetas con el archivo original | Correcto; axe-core sin observaciones |
| Subir archivo al logotipo del menú y al ícono | El menú lateral y el ícono de la pestaña cambian al instante |
| Elegir un archivo de texto | Se rechaza antes de enviarlo |
| Restaurar original | Pide confirmación y vuelve al original |

**Falta probar contra el servidor real:** subir un logotipo de verdad desde la cuenta del superadministrador y guardar un horario desde la cuenta de un administrador de sede.
