# vetUI — sistema de diseño

Sistema de diseño del sistema de citas de la Clínica Veterinaria UDES. Estética **floating glass**: superficies de vidrio que flotan sobre un fondo azul de marca iluminado por halos de luz.

- **Estilos y tokens:** `frontend/src/styles/vetui.css` (lo importa `index.css`).
- **Componentes:** `frontend/src/components/vetui/` (`import { Boton, Superficie, ... } from '../vetui'`).
- **Guía visual viva:** ruta `/vetui` (`pages/GuiaVetuiPage.jsx`). Muestra cada fundamento y componente con el código real, sobre el fondo real.

Alcance actual: landing, flujo de agendar cita y panel del cliente (Mis citas, Mis mascotas). Los paneles de administrador y médico todavía usan `components/ui/` y se migran en una etapa posterior.

---

## 1. Principios

1. **Todo flota.** Ninguna superficie es un bloque sólido pegado a la página: el vidrio deja ver el fondo difuminado, tiene un borde de luz y una sombra que lo separa.
2. **Jerarquía por material, no por decoración.** Cuanto más importante y cercano al usuario es algo, más opaco es su material: fondo → vidrio → cristal → cristal fuerte.
3. **El ámbar es único.** Se reserva para la acción principal de cada vista y para el estado "activo/seleccionado". Una sola acción ámbar por vista.
4. **Legibilidad primero.** Todo texto cumple WCAG AA medido contra el píxel más desfavorable que tiene detrás (no contra el color teórico del material). Si un material no alcanza, se ajusta el material, nunca se acepta el texto ilegible.
5. **Movimiento sutil y opcional.** 200 ms con salida suave; nada se anima con `prefers-reduced-motion`.

## 2. Fundamentos

### Color

| Token | Valor | Uso |
|---|---|---|
| `brand-blue-500` | `#4280F7` | Azul de marca, topbar, inicio del fondo del landing |
| `brand-blue-600` | `#0C5CF5` | Inicio del fondo de las pantallas de la app |
| `brand-blue-700` | `#0847C0` | Tramo medio del fondo, texto de botón contorno |
| `brand-blue-800` | `#06338A` | Fondo profundo, vidrio azul, texto sobre blanco |
| `brand-amber` | `#F7A71C` | Acción principal, estado activo, selección |
| `brand-green` | `#16A34A` | Completado, éxito |
| `brand-red` | `#E4434B` | Peligro, cancelar |
| `brand-navy` | `#0B3C74` | Títulos sobre cristal fuerte |

**Texto según la superficie:**

| Superficie | Títulos | Cuerpo | Secundario |
|---|---|---|---|
| Fondo / vidrio (oscuro) | `white` | `blue-50` | `blue-100` |
| Cristal (claro) | `slate-900` | `slate-700` | `slate-700` (nunca `slate-500/600`: no llegan a AA) |
| Cristal fuerte | `brand-navy` | `slate-700` | `slate-600` |

### Tipografía

**Raleway** es la fuente del sistema (decisión definitiva de Oriana, 8 de octubre de 2026, tras probar Manrope, Poppins, Josefin Sans e Inter). Se usa en todo: títulos, texto, botones, formularios y paneles. Pesos 400, 500, 600 y 700, empaquetada con el proyecto (`@fontsource/raleway`, sin depender de internet).

- Tokens: `--font-sans` y `--font-heading` en `frontend/src/styles/vetui.css`; los pesos se importan en `frontend/src/main.jsx`.
- **Cifras alineadas**: Raleway dibuja por defecto los números en estilo antiguo (el 0 y el 3 quedan bajos). `vetui.css` activa las cifras alineadas para todo el sistema (`font-feature-settings: "lnum"` en `html`); no quitarlo, o precios, fechas y tablas se ven desparejos.
- Única excepción: el código de la cita en la confirmación de `/agendar` va en monoespaciada (`font-mono`).

| Rol | Clases |
|---|---|
| Antetítulo | `text-xs font-semibold uppercase tracking-wider text-blue-50` |
| Título de página (h1) | `text-3xl md:text-4xl font-bold tracking-tight` |
| Título de sección (h2) | `text-lg sm:text-xl font-bold` |
| Título de tarjeta (h3) | `font-semibold` |
| Cuerpo | `text-base` / `text-sm` |
| Etiqueta de dato | `text-xs font-medium uppercase tracking-wide` |

### Iconos

Phosphor Icons (`@phosphor-icons/react`, licencia MIT, sin atribución). Todo el sistema los importa desde `components/icons.jsx` (`IconoPata`, `IconoCalendario`...), nunca directo del paquete: ahí se agrega cualquier icono nuevo.

El tamaño y el color van por `className` (`h-5 w-5 text-brand-blue`); el icono toma el color del texto. La prop `peso` elige la variante:

| Peso | Dónde |
|---|---|
| `regular` (por defecto) | Botones, menús, topbar, campos, tablas |
| `duotone` | Solo iconos ilustrativos: servicios, tarjetas de indicadores, estados vacíos y de error |
| `bold` | Casos puntuales que necesitan más peso (menú de tres puntos) |

Phosphor no trae la cinta de oncología ni un endoscopio: esos dos están dibujados a mano en el mismo archivo, con el mismo trazo y los mismos pesos.

### Radios

| Token | Clase | Uso |
|---|---|---|
| `--radius-boton` (9999px) | `rounded-boton` | Botones, chips, opciones, pestañas (píldora completa) |
| `--radius-tarjeta` (16px) | `rounded-tarjeta` | Tarjetas de cristal, avisos, campos |
| `--radius-superficie` (28px) | `rounded-superficie` | Superficies de vidrio, panel lateral, diálogo |
| 32px fijo | — | Píldora de la topbar |

### Elevación

| Token | Uso |
|---|---|
| `--shadow-flotante` | Superficies de vidrio |
| `--shadow-tarjeta` | Tarjetas de cristal |
| `--shadow-superpuesto` | Panel lateral y diálogo |

### Movimiento

- Transición estándar: `200ms ease-out` en todo lo interactivo.
- Hover "se ilumina": el elemento se aclara y emite un resplandor de su propio color (`filter: drop-shadow`, que sigue su forma y no tapa el anillo de foco).
- Halos del fondo con deriva lenta (`animate-halo-deriva`, 32 s).
- Landing: paginado por secciones y entrada/salida de las tarjetas atadas al scroll.
- Con `prefers-reduced-motion` nada de lo anterior se anima.

## 3. Materiales

| Capa | Utilidad | Componente | Descripción | Texto |
|---|---|---|---|---|
| 0. Fondo | — | `FondoVetui` | Degradado de marca + halos fijos (azules y ámbar) | — |
| 1. Vidrio | `vidrio` | `Superficie` | Blanco 12 %, reflejo arriba, borde gris claro tenue, blur 12 px, oscurece lo de atrás (75 %) | Blanco |
| 1d. Vidrio blanco | `vidrio-blanco` (+ `vidrio-blanco-destacado`) | `Superficie tono="blanco"`, `Tarjeta material="blanco"`, `TarjetaDato` | Blanco 80 %, blur 20 px, reflejo y borde de luz. Contenido de las pantallas de la app (Agendar, Mis citas, Mis mascotas): corta el azul del fondo sin perder el floating glass | Oscuro |
| 1b. Vidrio azul | `vidrio-azul` | — | Azul de marca 50 %, oscurece 65 %. Para lo que flota sobre contenido que puede ser claro (topbar fuera del landing, menú del perfil) | Blanco |
| 1c. Vidrio destacado | `vidrio-destacado` | `Tarjeta material="vidrio" destacada` | Vidrio con anillo ámbar 2 px (la próxima cita) | Blanco |
| 2. Cristal | `cristal` (+ `cristal-celeste`, `cristal-crema`) | `Tarjeta` | Blanco 60 % (celeste 55 %, crema 62 %), aclara lo de atrás (140 %) para no agrisarse | Oscuro |
| 2b. Seleccionado | `cristal-seleccionado` | `Tarjeta seleccionada` | Blanco 88 % + anillo ámbar 2 px + check ámbar | Oscuro |
| 3. Cristal fuerte | `cristal-fuerte` | `PanelLateral`, `Dialogo` | Blanco 88 %, blur 28 px, sombra profunda | Oscuro |
| Velo | `velo` | (dentro de los superpuestos) | Azul 35 % + blur 3 px detrás de un superpuesto | — |

**Reglas de anidación**

- **Pantallas de la app (Agendar, Mis citas, Mis mascotas): el contenido va en vidrio blanco**, para que corte el azul del fondo. Dentro de un vidrio blanco, los títulos de sección, etiquetas, campos, esqueletos, estados vacíos y tarjetas de cristal anidadas cambian solos a su versión clara (marcadores `vt-*` en `vetui.css`).
- **En el landing, lo que va directo sobre el fondo es vidrio claro** (secciones, resúmenes, indicadores, tarjetas de citas y mascotas): el mismo material que las tarjetas de sección del landing, con texto blanco. Se usa `Superficie` o `Tarjeta material="vidrio"`.
- **Lo que va dentro de un vidrio es cristal** (opciones elegibles de agendar, sedes, horarios), igual que las tarjetas de sedes y horarios dentro de su sección en el landing.
- No se anida vidrio dentro de vidrio. Si ocurre, o si un botón secundario o chip de vidrio claro queda dentro de una superficie de vidrio, vetUI le aplica automáticamente un relleno azul profundo para mantener el texto en AA.
- Un `backdrop-filter` dentro de otro solo difumina lo que hay dentro del padre, no la página. Por eso los menús que deben difuminar la página se renderizan fuera de la topbar (ver `Navbar.jsx`).

## 4. Componentes

### Boton

```jsx
<Boton variante="primario" tamano="md" icono={IconoMas} iconoFinal={IconoFlechaDerecha} as={Link} to="/agendar">
  Agendar cita
</Boton>
```

| Variante | Superficie | Uso |
|---|---|---|
| `primario` | cualquiera | Acción principal (una por vista). Ámbar glass, texto oscuro |
| `secundario` | fondo / vidrio | Acciones secundarias. Vidrio claro, texto blanco |
| `inverso` | banda azul | Acción principal sobre una banda azul (cierre del landing) |
| `contorno` | cristal | Secundaria sobre superficies claras |
| `peligro` | fondo / vidrio | Cancelar o salir de un flujo |
| `peligro-claro` | cristal / superpuesto | Cancelar o eliminar sobre superficies claras |
| `fantasma` | cualquiera | Terciaria, solo texto |

Tamaños: `sm`, `md` (por defecto), `lg`, `icono`. Deshabilitado: 50 % de opacidad, sin hover.

### Superficies

- `FondoVetui`: envuelve la página completa, incluida la topbar.
- `Superficie` (vidrio, `as="section"` por defecto): contenedor con `rounded-superficie` y padding de 20–24 px.
- `Tarjeta`: `material="vidrio"` para tarjetas sobre el fondo (texto blanco, radio 28 px) o `material="cristal"` (por defecto) para tarjetas dentro de un vidrio; `tono="blanco|celeste|crema"` (cristal), `seleccionada` (anillo y check ámbar), `destacada` (anillo ámbar sin check), `interactiva` (hover que ilumina). Para opciones elegibles se usa con `as="button"` y `aria-pressed`.

### Textos

- `EncabezadoPagina`: antetítulo, título, descripción, `acciones` e `imagen` opcionales.
- `TituloSeccion`: título y descripción de una superficie; `numero` para los pasos de un flujo y `accion` a la derecha.

### Navegación

- `Pestanas`: control segmentado de vidrio para vistas hermanas. La activa es una píldora blanca.
- `Chips`: filtros con conteo. Activo blanco; inactivos vidrio claro.

### Datos

- `TarjetaDato`: indicador en vidrio (icono en círculo de color, valor, detalle, etiqueta). Con `onClick` toda la tarjeta es un botón.
- `Insignia`: estado de solo lectura. `estado="proxima|completada|cancelada"` o `tono` genérico con texto.

### Estados

- `Aviso`: `tono="info|ok|alerta|error"`. Rojo y ámbar opacos (translúcidos sobre azul se veían morado y oliva); el ámbar lleva texto oscuro.
- `EstadoVacio`, `EstadoError` (con Reintentar), `Esqueleto`.

### Superpuestos

- `PanelLateral`: formularios y detalles. Flota a 12 px de los bordes con esquinas de 28 px. `footer` fija las acciones abajo. Mismas props que el `SidePanel` anterior (`isOpen`, `onClose`, `title`, `footer`).
- `Dialogo`: confirmación de una pregunta, centrado. El foco inicial va a la primera acción (la opción segura).
- Ambos cierran con Escape o con clic en el velo, y se dibujan encima de la topbar (z-50). Quien los abre marca su contenido `inert` mientras están abiertos.

### Formulario

**Ningún control usa el aspecto que le pone el navegador.** Todos comparten borde, radio (12 px), fuente y foco (borde azul de marca + anillo ámbar). Se pueden probar en `/vetui`, bloque "Campos de formulario".

| Necesidad | Componente (`components/form/`) | Reemplaza a |
|---|---|---|
| Texto, correo, clave, número | `Campo` (etiqueta + campo + error) | `<input>` suelto |
| Lista de opciones | `Desplegable` | `<select>` |
| Hora | `CampoHora` (cada 30 min, "8:00 a. m.") | `<input type="time">` |
| Fecha | `CampoFecha` (calendario de agendar) | `<input type="date">` |
| Búsqueda | `CampoBusqueda` (lupa + X para borrar) | `<input type="search">` |
| Texto largo | `<textarea className="campo ...">` (crece con el contenido) | área de texto con esquina para estirar |
| Deslizador | `<input type="range">` (estilo global: riel fino, perilla ámbar) | deslizador gris |
| Casilla | `<input type="checkbox" className="casilla">` | casilla del navegador |
| Pocas opciones fijas | botones: `SelectorSexo`, `SelectorCategoria`, `SelectorEspecieRaza` | desplegable |

- **`campo`** (clase, `styles/vetui.css`): el aspecto único de todo campo sobre superficies claras. Solo define el aspecto; el tamaño va con utilidades (`px-3 py-2 text-sm`). Estados: reposo, hover, foco, inválido (`aria-invalid`) y deshabilitado. No se escriben a mano `border`, `rounded-*` ni `focus:ring-*` en un campo.
- **`Desplegable`** se usa igual que un `<select>` (hijos `<option>`, `value`, `onChange` con `e.target.value`). La lista es una tarjeta flotante con la opción elegida en azul y con check; se maneja con mouse o teclado (flechas, Inicio/Fin, Enter, Escape, escribir letras). Se dibuja en `<body>` para que no la recorte un panel.
- Sobre vidrio oscuro: `CampoTexto` y `AreaTexto` de `vetui/Formulario.jsx` (clase `campo-vetui`, etiqueta blanca).
- Excepción: el buscador global del encabezado del administrador conserva su caja gris propia.

### Topbar (Navbar.jsx)

- Arriba de todo: transparente, sobre el fondo.
- Al hacer scroll: píldora flotante de 64 px de alto y radio 32 px. Material vidrio claro en el landing y vidrio azul en el resto de pantallas (allí pasa sobre tarjetas claras).
- Menú del perfil: mismo material que la píldora, mismo ancho que el botón del perfil, "nace" de la píldora cuando está formada.

### Barra de desplazamiento

Todo el sistema usa la barra de vetUI en vez de la gris del navegador (diseño de Oriana): una **píldora ámbar con brillo**, del mismo color que los botones "Agendar cita", que **flota sin canal ni fondo**. Se ensancha y brilla más al pasar el mouse o arrastrarla. No hay que agregar clases en ninguna pantalla.

- **Barra de la página** (inicio, agendar, panel del cliente, inicio de sesión): el componente `layout/BarraPagina.jsx`, montado una sola vez en `App.jsx`. La barra nativa de la página no puede ser transparente (siempre reserva una franja), así que se oculta y la píldora se dibuja encima del contenido, atada al scroll real; se puede arrastrar. Se oculta sola si la página no tiene scroll o mientras hay un panel o diálogo abierto.
- **Barras de adentro** (paneles laterales, contenido del panel administrativo, tablas, áreas de texto): la barra nativa con el mismo aspecto, por CSS (final de `styles/vetui.css`).
- **En los topes no se ve** (todas las barras): quieta arriba de todo o al final, la barra se apaga, y vuelve al desplazarse o al pasar el mouse por su lugar. Un contenedor recién abierto arranca con la barra apagada. Lo maneja `BarraPagina.jsx` (`data-reposo` en la de la página, `data-barra-activa` en los contenedores).
- Solo con mouse: en pantallas táctiles se deja la barra del sistema, que ya es flotante. En Firefox las barras de adentro usan el mismo color, sin el brillo.

### Lo que no se puede pulsar no reacciona

Un hover le dice al usuario "esto hace algo". Si el elemento no hace nada, el hover engaña. Regla para todo el sistema:

- Solo reaccionan al mouse (brillo, cambio de color, cursor de mano) los elementos de verdad interactivos y habilitados: enlaces, botones, pestañas, opciones, campos.
- **No reaccionan:** insignias de estado, contadores y contenedores con forma de píldora, tarjetas informativas, filas de tabla, etiquetas de campo, botones deshabilitados y la pestaña que ya está elegida.
- Lo garantiza `styles/vetui.css`: los hover generales solo aplican a etiquetas interactivas, aunque un `<span>` use `rounded-boton` por la forma.
- En el código: nunca `hover:*` ni `cursor-pointer` en un elemento sin `onClick`, `href` o `to`. Y nada de botones que no hacen nada: si la función aún no existe (la campana de notificaciones), el elemento es un adorno sin hover ni foco.

### Hover de los botones sin contenedor

Un botón que a la vista es solo texto, solo icono o icono + texto ("Quitar foto", "Editar" de las tablas, la X de cerrar, flechas, la campana) lleva la clase `boton-texto`. Al pasar el mouse **brilla solo su contenido**, en su propio color (rojo si es rojo, azul si es azul). **No se le pone `hover:bg-*`**: una píldora que aparece al pasar el mouse sugiere un contenedor que el botón no tiene.

Los botones con contenedor visible (relleno, borde o vidrio) siguen iluminando toda su forma. Las filas de un menú o de una lista, los días del calendario y las pestañas sí resaltan con fondo: ahí el fondo marca la fila o la celda, no un botón.

### Acciones destructivas en un panel

Eliminar o desactivar va en el **pie fijo del panel, en el extremo izquierdo**, como botón de texto rojo sin relleno; Cancelar y la acción principal van juntas a la derecha. Así la acción siempre está a la vista (no al final de un formulario largo) y lejos de "Guardar". La confirmación reemplaza al pie en el mismo lugar, explica la consecuencia y ofrece primero la opción segura ("No, conservar"). Lo usan Editar mascota, Editar foto de la galería y Editar médico.

## 5. Accesibilidad

- Contraste WCAG AA (4,5:1 texto normal, 3:1 texto grande) medido sobre capturas reales contra el píxel más desfavorable detrás de cada texto. Los controles deshabilitados quedan exentos, como indica WCAG.
- Foco visible en todo lo interactivo (anillos blancos sobre fondo oscuro, azules sobre claro).
- Opciones elegibles como botones con `aria-pressed`; pestañas con `role="tab"` y `aria-selected`.
- Superpuestos con `role="dialog"` / `alertdialog`, `aria-modal` y contenido de atrás `inert`.
- `prefers-reduced-motion` respetado en todas las animaciones.

## 6. Cómo construir una pantalla nueva

1. Envolver la página en `FondoVetui` y poner `<Navbar />` como primer hijo.
2. Encabezado con `EncabezadoPagina`.
3. Agrupar el contenido en `Superficie` (vidrio) con `TituloSeccion`.
4. Objetos sueltos sobre el fondo (listas de citas, mascotas, indicadores) en `Tarjeta material="vidrio"`; objetos dentro de una superficie en `Tarjeta` (cristal).
5. Una sola acción `primario`; el resto `secundario` (sobre vidrio) o `contorno` (sobre cristal).
6. Formularios y detalles en `PanelLateral`; confirmaciones en `Dialogo`.
7. Estados de carga, vacío y error con `Esqueleto`, `EstadoVacio` y `EstadoError`.
8. Revisar la pantalla en `/vetui` como referencia y verificar el contraste.
9. Fechas y fotos siguen el estándar de la sección 7: nunca `<input type="date">` ni `<input type="file">` sueltos.

## 7. Estándar de fechas y fotos (todo el sistema)

Aplica a los tres roles (cliente, médico y administrador), no solo a las pantallas vetUI.

**Fechas.** Ningún formulario usa el calendario del navegador. Hay un solo calendario, `DatePickerCalendar` (`components/agendar/`), el del flujo de agendar:

- Para elegir día y hora de una cita se muestra completo, con `TimeSlotPicker` al lado o debajo (agendar, reprogramar, "Nueva cita" del administrador y del médico).
- Para cualquier otro campo de fecha se usa `CampoFecha` (`components/form/`): se ve como un campo y despliega ese mismo calendario. Trabaja con `"YYYY-MM-DD"`, igual que el input nativo que reemplaza.
  - Por defecto no deja elegir días pasados. `minimo={null}` quita ese límite; `maximo` pone un tope.
  - En todos los calendarios (también el de agendar y reprogramar) el mes y el año del encabezado se pueden pulsar: el mes abre la grilla de 12 meses y el año una lista de años. No son listas desplegables del navegador; lo que queda fuera de los límites sale deshabilitado.
  - Sin `requerido`, el desplegable ofrece "Borrar fecha".

Las horas sueltas (horarios de atención, pausas, hora de un recordatorio) siguen con el campo de hora nativo: no son un calendario.

**Fotos.** Todo campo donde se sube una foto usa `ZonaFoto` (`components/form/`): círculo punteado con cámara cuando está vacío, la foto en círculo y "Cambiar foto" cuando ya hay una. El clic abre `FotoMascotaModal` (elegir archivo JPG/PNG de máx. 5 MB, encuadrar, vista previa), que entrega la imagen final. Hoy lo usan la foto de mascota (cliente, médico y administrador) y la foto del médico (en su perfil y en el panel del administrador).

Las fotos que no son un retrato (foto de sede, galería del inicio) usan `ZonaImagen` (`components/form/`): la misma zona punteada, pero rectangular; se hace clic o se arrastra el archivo (JPG/PNG de máx. 15 MB) y la imagen se reduce en el navegador antes de subirla (`utils/imagen.js`).

**Ajustes de la foto, en una ventana aparte.** El formulario muestra solo la foto y sus acciones (Cambiar, Ajustar, Quitar). El encuadre (qué parte debe verse siempre) y la descripción de la foto se editan en la ventana "Ajustar foto" (`form/EncuadreModal.jsx`), con la misma forma que el editor de fotos circulares: lo opcional y avanzado no ocupa el formulario. La ventana trabaja sobre un borrador que solo se guarda con "Aplicar". Hoy la usa la foto de cada servicio.

**Tareas con calendario, en una ventana.** Reprogramar una cita se hace en la ventana "Reprogramar cita" (`citas/ReprogramarCitaModal.jsx`), que se abre sobre el detalle de la cita: calendario a la izquierda, horas disponibles a la derecha, resumen y acciones abajo. No se despliega un calendario dentro de un panel lateral.

**Calendario con marcas.** `DatePickerCalendar` acepta `marcas` (`{ "YYYY-MM-DD": ['proxima', ...] }`): dibuja un punto de color por estado bajo el día (azul próxima, verde completada, rojo cancelada) y lo dice en el nombre accesible del día. Lo usa "Mis citas" del cliente: lista a la izquierda y calendario a la derecha; tocar un día deja en la lista solo sus citas (`permiteQuitar`: tocarlo otra vez quita el filtro). En celular el calendario va arriba.

**Agendar desde el administrador, en una ventana.** "Nueva cita" del panel administrativo es una ventana centrada (`admin/NuevaCitaModal.jsx`), no un panel lateral. Reutiliza el flujo de agendar del cliente (tarjetas de mascota y servicio, calendario y horas) en 3 pasos con `PasosHorizontal` (stepper para superficies claras, en `agendar/BookingStepper.jsx`): 1. Cliente, mascota y servicio; 2. Fecha, hora y médico; 3. Confirmar. Al cerrar con datos elegidos pide confirmar.

**Código de verificación.** Los códigos de un solo uso se escriben en `form/CampoCodigo.jsx`: un recuadro `campo` por dígito, en dos grupos de tres con un guion. Avanza y retrocede solo, acepta pegar el código completo, solo admite dígitos y con `error` pinta los recuadros en rojo. Debajo va `form/ReenviarCodigo.jsx` con `hooks/useCuentaRegresiva.js` (texto "Reenviar código en 00:42" y, al terminar, el botón). Se usa en recuperar contraseña y en el cambio de correo del médico.

**Mensajes del inicio de sesión.** Correo inexistente y contraseña incorrecta responden el mismo mensaje genérico, y la recuperación responde igual exista o no el correo: así no se puede averiguar qué correos tienen cuenta (enumeración de cuentas). El único mensaje específico es "Tu cuenta está inactiva", y solo se muestra cuando la contraseña es correcta.

**Panel administrativo y del médico en vidrio.** Fondo `FondoVetui variante="panel"` (azul del landing con más ámbar y manchas de azul oscuro). Nada va directo sobre el fondo: menú lateral en `vidrio` (contraído es una píldora de alto completo), barra superior sin contenedor con buscador, campana y perfil en píldoras `vidrio`, y hoja de trabajo en el mismo `vidrio` translúcido de la barra, con texto blanco directo sobre ella y las tarjetas blancas (texto oscuro) adentro. Los desplegables de la barra (resultados del buscador, menú del perfil) van en el mismo `vidrio` de la barra. Las tarjetas de la hoja (`rounded-2xl bg-white`) se vuelven vidrio empañado blanco con una regla de `.hoja-panel` en vetui.css, sin `backdrop-filter` propio. `ui/Tabs.jsx` lleva `sobreVidrio` cuando va directo sobre la hoja. "Cerrar sesión" va al fondo del menú lateral, solo icono y texto en rojo; contraído, al pasar el cursor queda un círculo rojo con el icono blanco. El panel lateral (`ui/SidePanel.jsx`) flota en `cristal-fuerte` sobre el `velo`. Ojo: `backdrop-filter` en un ancestro atrapa los `position: fixed`; por eso el cristal de la hoja es una capa hermana del `<main>`.

**Barra de desplazamiento en contenedores redondeados.** El recorrido de la barra empieza y termina donde acaba la curva de la esquina (margen del `::-webkit-scrollbar-track` igual al radio, por clase `rounded-*`, en vetui.css). Un contenedor con scroll y un radio nuevo debe sumarse a esa lista.

**Nunca un enlace.** Ningún formulario pide pegar la dirección de una foto: siempre se sube el archivo.

Ambos se pueden probar en `/vetui`, bloque "Fechas y fotos".

**Pocas opciones fijas: botones, no desplegable.** Cuando un campo tiene pocas opciones conocidas se muestran todas como botones (grupo de radio), no en un `<select>`: sexo (`SelectorSexo`, Hembra / Macho), categoría de un servicio (`SelectorCategoria`: píldoras con el punto de color de la categoría) y especie de la mascota (`SelectorEspecieRaza`: tarjetas más altas que anchas con el icono del animal arriba y el nombre abajo). La opción elegida se marca con color, check y negrita (nunca solo con color), y el grupo se recorre con las flechas del teclado. Las listas largas (raza) siguen siendo desplegables.
