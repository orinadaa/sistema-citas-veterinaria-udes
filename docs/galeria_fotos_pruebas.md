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

## Foto de cada servicio (ampliación)

Las fotos de la sección **Servicios** de la página pública también estaban escritas en el código. Ahora cada servicio tiene su foto, que el administrador sube en **Servicios > Editar** (o al crear el servicio), con descripción y encuadre; también puede cambiarla o quitarla.

Migración nueva: `incremento_6b_servicio_foto.sql` (columnas `foto_url`, `foto_descripcion`, `foto_foco_x`, `foto_foco_y` y `foto_fondo_claro` en `servicio`). Fotos predeterminadas: `npm run seed:fotos-servicios` en `backend/`.

### Decisiones de alcance registradas

- **Fotos predeterminadas**: las nueve que ya mostraba el inicio (`frontend/src/assets/servicios-foto`), con la misma descripción, el mismo encuadre y el mismo oscurecido. El script solo toca servicios que aún no tienen foto.
- **Un servicio sin foto no aparece en la sección Servicios del inicio**, pero se puede agendar igual; el formulario lo avisa.
- **Oscurecido automático**: al subir la foto, el navegador mide si es clara en la mitad inferior (donde va el nombre en blanco) y lo guarda en `foto_fondo_claro`; el inicio oscurece más esas fotos para que el texto se lea. El administrador no tiene que decidirlo.
- **Descripción de la foto opcional**: si se deja vacía, el inicio usa "Foto del servicio (nombre)".
- **Cambiar la foto reinicia el encuadre al centro**; quitarla borra el archivo, la descripción y el encuadre.
- "Profilaxis dental" se sigue mostrando en el inicio como "Odontología" (etiqueta pública, no cambia el nombre del servicio).

### Pruebas unitarias

268/268 pruebas del backend pasando, entre ellas las nuevas de `servicioFoto.test.js`: permisos, archivo inválido, servicio inexistente, reemplazo y borrado del archivo, quitar foto y validación de descripción y encuadre.

### Pruebas en el navegador (Edge, contra la API real y PostgreSQL local)

| ID | Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| PN-08 | El inicio muestra las fotos de la base de datos | Abrir la sección Servicios sin sesión | 9 servicios con su foto de `/uploads/servicios`, descripción y encuadre | ✅ |
| PN-09 | Un servicio sin foto avisa en el formulario | Editar un servicio temporal sin foto | Aviso "Sin foto, el servicio no aparece en la sección Servicios del inicio" | ✅ |
| PN-10 | Subir la foto de un servicio desde la pantalla | Original de 3,5 MB, descripción y encuadre (30 %, 60 %) | Se guarda con esos datos, miniatura en la tabla y aparece en el catálogo público con foto | ✅ archivo de 135 KB |
| PN-11 | Quitar la foto desde la pantalla | "Quitar foto" y guardar | `foto_url` y descripción vacías, archivo borrado del disco | ✅ |

La primera corrida de PN-10 falló con un error de PostgreSQL al guardar la foto (tipo de dato ambiguo en la consulta); se corrigió en `servicio.model.js` y la prueba se repitió completa. El servicio temporal de la prueba se eliminó al terminar.
