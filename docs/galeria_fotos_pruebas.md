# Galería del inicio y fotos por archivo en el panel administrativo: pruebas y decisiones

## Contexto

Las fotos que rotan en la portada (Hero) de la página pública estaban escritas en el código. Ahora forman la **Galería**, que el administrador gestiona desde **Configuración > Galería**: sube las fotos como archivo, las describe, elige su encuadre, las ordena, las oculta o las elimina. El Hero las lee de `GET /api/galeria`.

Además, en el panel administrativo ya no queda ningún campo donde se pegue el enlace de una foto: la **foto de la sede** y la **foto del médico** se suben como archivo.

Migración nueva: `incremento_6a_galeria.sql` (tabla `foto_galeria`). Fotos de ejemplo: `npm run seed:galeria` en `backend/`.

## Decisiones de alcance registradas

- **Fotos de ejemplo**: son las cinco de `identidadmarca/galeria` que ya usaba el Hero (versión liviana en `frontend/src/assets/galeria`). El script `seed:galeria` las copia a `backend/uploads/galeria` y las registra; solo actúa si la galería está vacía.
- **El Hero nunca queda vacío**: si no hay fotos visibles o el backend no responde, muestra las cinco de ejemplo que vienen con el sistema.
- **Máximo 12 fotos** en la galería: el Hero rota una cada 3 segundos y con más la vuelta completa se hace muy larga.
- **Descripción obligatoria** por foto: es el texto que leen los lectores de pantalla.
- **Encuadre**: cada foto guarda el punto (en %) que debe quedar al centro cuando el Hero la recorta a su marco. Se elige con un clic sobre la foto o con dos deslizadores.
- **Ocultar no es eliminar**: una foto oculta sigue guardada y se puede volver a mostrar. Eliminar borra la fila y el archivo.
- **La imagen de una foto ya subida no se reemplaza**: se elimina y se sube otra.
- **Las fotos rectangulares se reducen en el navegador** antes de subirlas (máx. 1600 px por lado, JPEG): se acepta un original de hasta 15 MB y al backend llega un archivo liviano. Componente nuevo `ZonaImagen` (galería y sede).
- **Foto del médico**: mismo editor circular de mascotas y "Mi perfil" (`ZonaFoto` + `FotoMascotaModal`), misma carpeta `uploads/usuarios` y mismo campo: es la misma foto que el médico puede cambiar desde su perfil.
- **Los enlaces ya guardados se conservan**: una sede o un médico que tenía un enlace externo lo sigue mostrando hasta que se le suba una foto. `PUT /api/sedes/:id`, `POST /api/sedes` y `PUT /api/administracion/medicos/:id` ya no aceptan `fotoUrl`.
- **Permisos**: la galería y la foto de sede son de cualquier administrador; la foto del médico, solo del administrador de la sede de ese médico (mismo criterio que el resto de su ficha).

## Pruebas unitarias

253/253 pruebas del backend pasando, entre ellas las nuevas de:
- `galeria.controller.test.js`: lectura pública, permisos, validación de archivo, descripción, tope de fotos, encuadre, orden y eliminación con borrado del archivo.
- `fotosAdmin.test.js`: foto de sede y foto de médico (permisos, sede ajena, archivo inválido, reemplazo de la foto anterior) y rechazo del enlace escrito a mano.

Ninguna prueba deja archivos en `backend/uploads/`.

## Pruebas de aceptación (contra la API real y PostgreSQL local)

| ID | Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| PA-67 | La galería pública trae las fotos de ejemplo | `GET /api/galeria` sin sesión | 200 con las 5 fotos | ✅ |
| PA-68 | La lista de administración exige sesión | `GET /api/galeria/admin` sin token | 401 | ✅ |
| PA-69 | El administrador sube una foto | `POST /api/galeria` con JPG y descripción | 201, archivo en `uploads/galeria`, al final y visible | ✅ |
| PA-70 | Se rechaza un archivo que no es imagen | `POST /api/galeria` con texto plano | 400 "La foto debe ser JPG o PNG." | ✅ |
| PA-71 | Se rechaza una foto sin descripción | `POST /api/galeria` con descripción vacía | 400 y sin archivo en disco | ✅ |
| PA-72 | Editar descripción y encuadre | `PUT /api/galeria/:id` con `focoX: 20, focoY: 80` | 200 con los valores nuevos | ✅ |
| PA-73 | Ocultar una foto | `PUT /api/galeria/:id` con `activo: false` | Deja de salir en `GET /api/galeria` | ✅ |
| PA-74 | Reordenar | `PUT /api/galeria/orden` con la foto nueva de primera | La galería vuelve en ese orden | ✅ |
| PA-75 | Eliminar | `DELETE /api/galeria/:id` | 200 y el archivo se borra del disco | ✅ |
| PA-76 | Crear sede ya no guarda un enlace de foto | `POST /api/sedes` con `fotoUrl` | 201 con `foto_url` vacío | ✅ |
| PA-77 | Subir la foto de la sede | `POST /api/sedes/:id/foto` con JPG | 200, archivo en `uploads/sedes` y la sede queda con esa foto | ✅ |
| PA-78 | Cambiar la foto de la sede | Segunda subida a la misma sede | El archivo anterior se borra | ✅ |
| PA-79 | Sede inexistente | `POST /api/sedes/no-es-un-id/foto` | 404 | ✅ |
| PA-80 | Subir la foto de un médico | `POST /api/administracion/medicos/:id/foto` con JPG | 200, archivo en `uploads/usuarios` y aparece en el listado | ✅ |
| PA-81 | Editar médico ya no acepta un enlace de foto | `PUT /api/administracion/medicos/:id` con `fotoUrl` | 200 y la foto no cambia | ✅ |

Los datos de prueba (foto de galería, sede temporal y foto del médico) se eliminaron al terminar.

## Pruebas en el navegador (Edge, sesión de administrador)

| ID | Descripción | Resultado obtenido |
|---|---|---|
| PN-01 | El Hero carga las fotos de la galería con su encuadre y las rota cada 3 s | ✅ |
| PN-02 | Configuración > Galería muestra las 5 fotos con su orden y "5 de 12 fotos, 5 visibles" | ✅ |
| PN-03 | Subir desde la pantalla una foto original de 3,5 MB con descripción y encuadre | ✅ llega al backend de 135 KB, con el encuadre elegido |
| PN-04 | Mover una foto una posición antes | ✅ |
| PN-05 | Ocultar y volver a mostrar con el interruptor de la tarjeta | ✅ la galería pública pasa de 5 a 4 y vuelve a 5 |
| PN-06 | Eliminar desde el panel de edición, con confirmación | ✅ desaparece la tarjeta y el archivo |
| PN-07 | "Editar sede" y "Editar médico" ya no muestran el campo de enlace | ✅ sede con zona de archivo rectangular, médico con la zona circular |
