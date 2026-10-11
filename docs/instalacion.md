# Instalación en un equipo nuevo

Pasos para dejar el sistema funcionando desde cero en un computador (entorno local).

## Requisitos

- Node.js 20 o superior.
- PostgreSQL 17 o superior. Con una versión anterior, borra la línea `SET transaction_timeout = 0;` de `database/esquema.sql` antes de ejecutarlo.

## 1. Base de datos

```bash
# Crear la base vacía
psql -U postgres -c "CREATE DATABASE clinica_veterinaria_udes"

# Estructura completa (21 tablas, índices y reglas)
psql -U postgres -d clinica_veterinaria_udes -f database/esquema.sql

# Catálogos iniciales: sedes, horarios, categorías, servicios, especies y razas
psql -U postgres -d clinica_veterinaria_udes -f database/datos_iniciales.sql
```

`database/esquema.sql` equivale a ejecutar en orden todos los `incremento_*.sql`, que se conservan solo como historial de cómo creció la base. No hace falta ejecutarlos.

Si la base ya existía de antes, no uses `esquema.sql`: ejecuta solo los `incremento_*.sql` que falten. El más reciente es `incremento_13a_seguridad_auditoria.sql`.

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

Los correos (confirmación de cita, códigos, credenciales del personal) necesitan `SMTP_USER` y `SMTP_APP_PASSWORD`. Sin ellos el sistema funciona, pero no envía correos.

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
