# Campos personalizados administrables: arquitectura, decisiones y pruebas

## Contexto

El administrador necesita agregar campos a ciertos formularios sin programar (por ejemplo, un certificado de vacunación al registrar una mascota). Se administran en **Configuración > Campos** y los formularios los dibujan solos.

**Regla de negocio no negociable:** un campo **nunca se elimina, solo se desactiva**. Desactivado deja de pedirse en registros nuevos; los valores ya guardados se conservan y siguen siendo legibles.

Migración nueva: `incremento_7a_campos_personalizados.sql`.

## Arquitectura (decisión de la usuaria: JSONB + definiciones)

- **`definicion_campo`**: una fila por campo (`entidad`, `clave`, `etiqueta`, `tipo`, `ayuda`, `opciones`, `requerido`, `orden`, `activo`).
- **`mascota.campos_adicionales` (JSONB)**: los valores de cada mascota, `{ "<clave>": <valor> }`.

Se eligió sobre un modelo EAV (tabla de valores) porque leer un registro con sus campos es una sola fila sin uniones, y sumar otra entidad es agregar una columna. La integridad por tipo la valida el backend contra la definición (`utils/camposAdicionales.js`).

Reglas que protegen el historial:

1. **La clave no cambia.** Se genera sola a partir del nombre al crear el campo; el nombre sí se puede corregir.
2. **El tipo no cambia.** Si se necesita otro, se desactiva el campo y se crea uno nuevo.
3. **Las opciones de una lista tampoco se eliminan**: cada una tiene su propio `activo`. En el registro se guarda el `valor` de la opción, no su texto.
4. **Un campo desactivado se sigue mostrando** en los registros que lo tienen lleno, en solo lectura ("Datos que ya no se solicitan"), y su valor no se puede modificar.
5. **No existe ningún DELETE** de definiciones, ni en la interfaz ni en la API.

## Decisiones de alcance registradas

- **Entidad:** solo `mascota` por ahora. Para sumar otra: agregar su columna `campos_adicionales`, registrarla en `ENTIDADES` (`utils/camposAdicionales.js`) y validar sus valores en su controlador.
- **Tipos:** texto corto, texto largo, número, fecha, sí/no, lista de opciones y **archivo adjunto** (PDF, JPG o PNG, máx. 5 MB).
- **Archivo adjunto:** el archivo vive en `backend/uploads/adjuntos` y en el JSON se guarda `{ url, nombre, tipo }`. Se sube después de guardar la mascota (`POST /api/mascotas/:id/campos/:clave/archivo`), igual que la foto. Por eso un adjunto **obligatorio** lo exige el formulario, no el backend al crear. Como el resto de `/uploads`, se sirve sin sesión a quien tenga el enlace.
- **Dónde se piden:** al final de los formularios de mascota del cliente, del administrador y del médico, en "Información adicional". En el alta rápida de mascota al agendar (administrador) solo se piden los obligatorios.
- **Permisos:** leer las definiciones, cualquier usuario con sesión; crear, editar, desactivar y ordenar, solo el administrador.

## Pruebas unitarias

303/303 pruebas del backend pasando, entre ellas las nuevas de:
- `camposAdicionales.test.js`: claves, validación por tipo, obligatorios, y que un campo desactivado conserva su valor.
- `campo.controller.test.js`: permisos, clave única, tipo inmutable, opciones que no se eliminan, ausencia de DELETE, valores en la mascota y adjuntos.

## Pruebas de aceptación (contra la API real y PostgreSQL local)

| ID | Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| PA-82 | Un cliente no puede crear campos | `POST /api/campos` como cliente | 403 | ✅ |
| PA-83 | El administrador crea un campo de texto obligatorio | `POST /api/campos` | 201, clave generada del nombre | ✅ |
| PA-84 | Crea una lista con opciones | tipo `seleccion`, 3 opciones | 201, cada opción con su valor | ✅ |
| PA-85 | Crea un campo de archivo | tipo `archivo` | 201 | ✅ |
| PA-86 | No se repite el nombre de un campo | mismo nombre con otras mayúsculas | 409 | ✅ |
| PA-87 | El tipo no se puede cambiar | `PUT` con otro tipo | 400 | ✅ |
| PA-88 | No existe eliminar | `DELETE /api/campos/:id` | 404 | ✅ |
| PA-89 | El cliente lee las definiciones | `GET /api/campos?entidad=mascota` | 200 | ✅ |
| PA-90 | Mascota sin el campo obligatorio | `POST /api/mascotas` | 400 con el nombre del campo | ✅ |
| PA-91 | Mascota con campos adicionales | texto, lista y una clave inventada | 201; la clave inventada se ignora | ✅ |
| PA-92 | Opción inexistente | `PUT` con un valor fuera de la lista | 400 | ✅ |
| PA-93 | Editar un campo conserva los demás | `PUT` con un solo campo | 200 | ✅ |
| PA-94 | Editar otros datos no toca los campos | `PUT` solo con el nombre | 200, campos intactos | ✅ |
| PA-95 | Adjuntar un PDF | `POST .../archivo` con nombre con tilde | 200, archivo en disco, nombre correcto | ✅ |
| PA-96 | El adjunto se abre | `GET` de su URL | 200 | ✅ |
| PA-97 | Archivo de tipo no permitido | texto plano | 400 | ✅ |
| PA-98 | Adjuntar a un campo que no es de archivo | clave de un campo de texto | 404 | ✅ |
| PA-99 | Reemplazar el adjunto | segunda subida | Se borra el archivo anterior | ✅ |
| PA-100 | Desactivar un campo | `PUT` con `activo: false` | 200 | ✅ |
| PA-101 | El valor de un campo desactivado se conserva | `PUT` intentando cambiarlo | 200; el valor histórico queda igual | ✅ |
| PA-102 | Mascota nueva tras desactivar el obligatorio | `POST /api/mascotas` sin ese campo | 201 | ✅ |
| PA-103 | Desactivar una opción y agregar otra | `PUT` de opciones | Quedan 4 opciones, ninguna eliminada | ✅ |
| PA-104 | Quien tenía la opción desactivada la conserva | `PUT` con ese mismo valor | 200 | ✅ |
| PA-105 | Reordenar los campos | `PUT /api/campos/orden` | Vuelven en el nuevo orden | ✅ |

La primera corrida falló en PA-83 por un error de tipos en una consulta SQL y en PA-95 porque el nombre del archivo perdía las tildes; ambos se corrigieron y la prueba se repitió completa. Los campos y mascotas de prueba ("ZZ Prueba...") se borraron al terminar y se verificó que ningún registro existente cambió.

## Prueba en el navegador

Con cinco campos temporales (texto obligatorio, sí/no, lista, fecha y archivo), el formulario "Editar mascota" del cliente muestra la sección "Información adicional" con los cinco, cada uno con el control de vetUI que le corresponde. No se guardó nada.
