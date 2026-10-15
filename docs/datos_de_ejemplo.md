# Datos de ejemplo

Para mostrar el sistema como si estuviera en funcionamiento (sustentación,
demostraciones). Se cargan y se quitan con dos comandos, desde `backend/`:

```
npm run demo:cargar
npm run demo:quitar
```

## Qué se carga

- 16 clientes con 26 mascotas (perros, gatos, aves y un conejo), con sexo,
  color, peso, fecha de nacimiento y, en algunas, alergias o condiciones.
- 1 administrador de sede para Valledupar y 1 médica para Bucaramanga, que
  presta Vacunación, Desparasitación, Consulta médica y Profilaxis dental.
- 296 citas en las dos sedes, desde hace 8 semanas hasta dentro de 3: unas
  pasadas, varias para hoy, otras próximas y una parte canceladas.

Todas las cuentas de ejemplo tienen correo `@demo.udes.co` y entran con la
contraseña `Demo12345`. Por ejemplo:

| Rol | Correo |
|---|---|
| Cliente | maria.gomez@demo.udes.co |
| Administrador de sede (Valledupar) | jorge.castro@demo.udes.co |
| Médica (Bucaramanga) | sofia.ramirez@demo.udes.co |

## Reglas

- Solo inserta: no modifica ni borra ninguna cuenta, mascota o cita real. Lo
  único existente que cambia es el contador de códigos de cita, para que las
  próximas citas reales no repitan un código.
- Las citas respetan el sistema: caen en días y horas en que la sede atiende,
  con un médico de esa sede que presta ese servicio y sin dos citas del mismo
  médico a la misma hora.
- Siempre genera lo mismo (sorteo con semilla fija). Si ya hay datos de
  ejemplo, `demo:cargar` avisa y no hace nada.
- `demo:quitar` borra las cuentas `@demo.udes.co`, sus mascotas y sus citas,
  también las que se hayan agendado después a nombre de esas cuentas. Los
  códigos que usaron no se reutilizan.
- Las contraseñas de ejemplo son conocidas: quitar estos datos antes de usar
  el sistema con clientes reales.

## Cuentas para evaluación local

Para abrir el panel de cada perfil sin mezclar estas cuentas con los datos de
demostración, ejecuta `npm run demo:usuarios-evaluacion` desde `backend/`.
Solo funciona con PostgreSQL en `localhost`, `127.0.0.1` o `::1`, y rechaza
`NODE_ENV=production`.

| Perfil | Correo |
|---|---|
| Cliente | clienteprueba@demo.udes.co |
| Médico veterinario | medicoprueba@demo.udes.co |
| Administrador de sede | adminprueba@demo.udes.co |
| Superadministrador | superadminprueba@demo.udes.co |

Las cuatro cuentas usan `1234`. Son ficticias, no reciben correos y deben
usarse únicamente para evaluación local; no se deben cargar en AWS ni en un
servidor institucional.

## Pruebas

| Descripción | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| Cargar | `npm run demo:cargar` | 16 clientes, 26 mascotas, 2 de personal, 296 citas; lo real sin cambios | Correcto |
| Cargar dos veces | Repetir el comando | Avisa y no duplica | Correcto |
| Quitar | `npm run demo:quitar` | 18 cuentas, 26 mascotas y 296 citas menos; lo real idéntico | Correcto |
| Reglas de las citas | Consultas sobre las citas de ejemplo | 0 fuera de horario, 0 con médico que no presta el servicio, 0 con médico de otra sede, 0 creadas después de su fecha | Correcto |
| Inicio del administrador de Bucaramanga | `GET /administracion/tablero` | Citas de hoy, de la semana y canceladas con datos | Correcto: 7 hoy, 20 en la semana |
| Inicio del superadministrador | `GET /administracion/sistema` | Las dos sedes con administrador; sin avisos | Correcto |
| Inicio de sesión de una cuenta de ejemplo | `maria.gomez@demo.udes.co` | 200 | Correcto |
