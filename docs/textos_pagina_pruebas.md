# Textos de la página pública (superadministrador)

Amplía RF-37 (contenido de la página pública: galería, logotipos y, desde ahora, textos de marca). Pedido de Oriana del 14 de octubre de 2026: que el superadministrador cambie el texto del hero y los demás textos de marca sin programar.

## Qué se puede cambiar

*Página web > Textos*. Solo textos que identifican a la clínica; los botones, los avisos del sistema y los textos legales quedan fijos.

| Sección | Textos |
|---|---|
| Portada | Título, parte destacada en ámbar (al final del título), descripción, viñeta 1 y viñeta 2 |
| Secciones | Título y subtítulo de Servicios, Sedes y Horarios |
| Pie de página | Descripción de la clínica y texto institucional |

## Cómo funciona

- **Solo se guarda lo cambiado** (tabla `texto_sitio`, `database/incremento_16a_textos_sitio.sql`). La lista de textos editables, su largo máximo y el texto original están en `backend/src/utils/textosSitio.js`; la API rechaza cualquier otra clave.
- **Sin cambio, se usa el original:** si el servidor no responde, la portada muestra los originales de `frontend/src/utils/textosSitio.js`. Una prueba automática comprueba que los originales del frontend y del backend sean iguales.
- **Restaurar texto original** devuelve el campo al de siempre; al guardar, se borra la fila.
- **Solo texto plano**, de una línea, con largo máximo por campo. El título, la descripción y los títulos de sección no pueden quedar vacíos; las viñetas y la parte destacada sí (desaparecen de la portada).
- Cada guardado queda en la bitácora ("Cambiar textos de la página pública") con la cuenta que lo hizo.
- La pantalla muestra una vista previa de la portada mientras se escribe.

## Instalación en una base existente

```bash
psql -U postgres -d clinica_veterinaria_udes -f database/incremento_16a_textos_sitio.sql
```

`database/esquema.sql` ya incluye la tabla.

## Pruebas

| Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| Lectura pública sin cambios | `GET /api/textos` | Los 13 textos originales | Correcto |
| Texto cambiado | Fila `hero_titulo` guardada | Reemplaza al original; el resto sigue igual | Correcto |
| Clave vieja en la base | Fila con una clave que ya no existe | Se ignora | Correcto |
| Permisos | Sin sesión, administrador de sede | 401 y 403 | Correcto |
| Guardar | Texto con saltos y espacios de más | Se guarda en una línea limpia, con quién lo cambió | Correcto |
| Volver al original | El texto original o `null` | Se borra el cambio | Correcto |
| Datos inválidos | Clave desconocida, 71 caracteres en el título, título vacío, número, objeto vacío | 400 sin tocar la base | Correcto |
| Opcionales vacíos | Viñeta 2 vacía | Se guarda vacía | Correcto |
| Falla de la base | Error al guardar | Se deshace todo (ROLLBACK) | Correcto |
| Originales iguales | `frontend/src/utils/textosSitio.js` contra el backend | Mismos textos | Correcto |
| Largo de los originales | Cada original | Cabe en su máximo | Correcto |
| Pantalla (local, sin guardar) | Escribir en el título | La vista previa cambia, aparece "Restaurar texto original" y se habilita "Guardar textos" | Correcto |
