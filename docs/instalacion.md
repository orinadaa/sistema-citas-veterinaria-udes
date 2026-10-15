# Instalación en un equipo nuevo

Pasos para dejar el sistema funcionando desde cero en un computador (entorno local).

## Instalador local de Windows

El repositorio incluye `instalador/Instalar-CitasUDES.bat`. Al ejecutarlo, el asistente verifica Node.js y PostgreSQL, solicita las credenciales locales, crea el esquema y los catálogos si la base está vacía, instala las dependencias, compila la interfaz, prepara cuatro cuentas ficticias de evaluación y crea un acceso directo en el escritorio. Ese acceso abre el servidor y la interfaz local.

Requisitos previos: Node.js 20 o superior; PostgreSQL 17 o superior con `psql` en `PATH`; y Windows PowerShell. El instalador solo admite PostgreSQL en `localhost`, `127.0.0.1` o `::1` y no cambia bases que ya contengan tablas. Para instalar en otro computador, copia el repositorio completo y ejecuta el archivo `.bat` desde esa copia.

El archivo que almacena la configuración privada es `backend/.env` (dotenv), no `.var`. Contiene los datos de PostgreSQL, la clave de sesión y, si se configura, el acceso SMTP. El instalador lo genera localmente y no debe incluirse en el repositorio ni entregarse por correo. El `.env.example` es una plantilla sin secretos.

Las cuentas de evaluación son `clienteprueba@demo.udes.co`, `medicoprueba@demo.udes.co`, `adminprueba@demo.udes.co` y `superadminprueba@demo.udes.co`; usan `1234` y solo se crean en PostgreSQL local. No las uses en AWS ni en la infraestructura institucional. El instalador local sirve para la demostración desde un equipo Windows; TIC debe definir y preparar el entorno institucional de producción.

Si el correo SMTP se deja vacío, la plataforma abre y permite entrar con las cuentas locales, pero no se envían códigos ni notificaciones por correo y no se puede completar el registro público.

## Requisitos

- Node.js 20 o superior.
- PostgreSQL 17 o superior. Con una versión anterior, borra la línea `SET transaction_timeout = 0;` de `database/esquema.sql` antes de ejecutarlo.

## 1. Base de datos

```bash
# Crear la base vacía
psql -U postgres -c "CREATE DATABASE clinica_veterinaria_udes"

# Estructura completa (incluye el calendario de festivos nacionales y sus excepciones por sede)
psql -U postgres -d clinica_veterinaria_udes -f database/esquema.sql

# Catálogos iniciales: sedes, horarios, categorías, servicios, especies y razas
psql -U postgres -d clinica_veterinaria_udes -f database/datos_iniciales.sql
```

`database/esquema.sql` equivale a ejecutar en orden todos los `incremento_*.sql`, que se conservan solo como historial de cómo creció la base. No hace falta ejecutarlos.

Si la base ya existía de antes, no uses `esquema.sql`: ejecuta solo los `incremento_*.sql` que falten. Entre los cambios recientes está `incremento_18a_festivos_colombia.sql`, que agrega las aperturas excepcionales de festivos por sede. Sin una excepción guardada, los festivos nacionales quedan cerrados; la regla legal de traslado se aplica al generar el calendario.

## 2. Servidor (backend)

```bash
cd backend
npm install
copy .env.example .env      # en Linux o Mac: cp .env.example .env
```

Abre `backend/.env` y llena al menos `DB_PASSWORD` y `JWT_SECRET`. El servidor no arranca si falta alguna variable obligatoria o si `JWT_SECRET` tiene menos de 32 caracteres. Para generar uno:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Los correos (confirmación de cita, códigos, credenciales del personal) necesitan `SMTP_USER` y `SMTP_APP_PASSWORD`. Sin ellos el sistema funciona, pero no envía correos y **nadie puede registrarse**: el registro confirma el correo con un código (ver `docs/verificacion_correo_pruebas.md`).

Cuentas y fotos iniciales:

```bash
npm run crear:superadmin        # cuenta del superadministrador
npm run seed:admin              # administrador de la sede principal
npm run seed:fotos-servicios    # fotos de los servicios de la página pública
npm run seed:galeria            # fotos de la portada
npm run dev                     # servidor en http://localhost:4000
```

## 3. Página (frontend)

```bash
cd frontend
npm install
npm run dev                     # sitio en http://localhost:5173
```

## 4. Comprobar

- `http://localhost:4000/api/health` responde `{"servidor":"ok","baseDeDatos":"ok"}`.
- `cd backend && npm test` pasa todas las pruebas.
- `http://localhost:5173` muestra la página de inicio con servicios, sedes y horarios.

## Datos de ejemplo (opcional)

Para mostrar el sistema con clientes, mascotas y citas de muestra: `npm run demo:cargar` (y `npm run demo:quitar` para retirarlos). Ver `docs/datos_de_ejemplo.md`. Hay que quitarlos antes de usar el sistema con personas reales.
