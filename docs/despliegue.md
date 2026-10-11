# Llevar el sistema a producción

El alcance del proyecto es entrega en entorno local. Esta guía reúne lo que habría que hacer el día que se publique en internet con personas reales. Sale de la auditoría del 11 de octubre de 2026 (`docs/auditoria_sistema_2026-10-11.pdf`).

## Antes de publicar

1. **Quitar los datos de ejemplo:** `cd backend && npm run demo:quitar`.
2. **Revisar los textos legales** (`frontend/src/pages/LegalPage.jsx`). Son un borrador: la Universidad de Santander debe aprobarlos y alinearlos con su política institucional de tratamiento de datos (Ley 1581 de 2012).
3. **Completar la dirección de cada sede** y subir fotos propias desde el panel (Sedes). Hoy las fotos se cargan desde sitios de terceros.
4. **Configurar el correo** (`SMTP_USER` y `SMTP_APP_PASSWORD`). El registro verifica el correo con un código: sin correo nadie puede crear una cuenta. Conviene una cuenta de correo institucional y no una personal.

## Base de datos

No usar el usuario `postgres`. Crear uno propio con permisos solo sobre esta base:

```sql
CREATE ROLE citas_udes LOGIN PASSWORD 'una-contraseña-larga';
GRANT CONNECT ON DATABASE clinica_veterinaria_udes TO citas_udes;
\c clinica_veterinaria_udes
GRANT USAGE ON SCHEMA public TO citas_udes;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO citas_udes;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO citas_udes;
```

En `backend/.env`: `DB_USER=citas_udes` y, si la base está en otro servidor, `DB_SSL=true`.

La copia de seguridad desde el panel (Datos) usa `pg_dump` con ese mismo usuario. Además conviene programar copias automáticas en el servidor de base de datos y guardarlas cifradas.

## Servidor (backend)

Variables de `backend/.env` en producción:

| Variable | Valor | Para qué |
|---|---|---|
| `NODE_ENV` | `production` | Redirige a HTTPS y envía la cabecera HSTS |
| `TRUST_PROXY` | `1` | Detrás de Nginx o de la plataforma: conocer la IP real de cada visita (sin esto el límite de intentos trata a todos como una sola persona) |
| `CORS_ORIGENES` | `https://el-dominio` | Único sitio que puede llamar a la API desde un navegador |
| `TZ` | `America/Bogota` | Las citas se manejan en hora de Colombia aunque el servidor esté en otro país |
| `JWT_SECRET` | Uno nuevo, de 48 bytes o más | No reutilizar el de desarrollo |
| `DB_SSL` | `true` | Si la base no está en la misma máquina |

Límites conocidos:

- El límite de intentos y la memoria del estado de las cuentas viven en el proceso. Sirven para un solo servidor. Con varios a la vez habría que llevarlos a un almacén compartido (Redis).
- Los recordatorios automáticos de citas corren dentro del servidor web. Con varios servidores hay que dejarlos activos en uno solo.
- Los registros van a la consola. En producción hay que redirigirlos a un archivo o a un servicio con retención.

## Página (frontend)

```bash
cd frontend
npm run build      # genera frontend/dist
```

El servidor web (Nginx o la plataforma de hosting) debe:

- Servir `frontend/dist` y devolver `index.html` para cualquier ruta que no sea un archivo (la aplicación resuelve las rutas y muestra su propia página 404).
- Reenviar `/api/` y `/uploads/` al backend, en el mismo dominio.
- Forzar HTTPS.
- Enviar una política de contenido (CSP). Punto de partida:

```
Content-Security-Policy: default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

`img-src https:` hace falta mientras las fotos de las sedes vengan de otros sitios. Con fotos propias se puede quitar.

## Buscadores

- `frontend/public/robots.txt` ya bloquea las rutas privadas. Al tener dominio, agregar la línea `Sitemap:` y crear `sitemap.xml` con la dirección de la página de inicio.
- La página de inicio ya tiene título, descripción y etiquetas para compartir. La imagen de vista previa (`og:image`) debe llevar la dirección completa con el dominio.
- Datos estructurados (`VeterinaryCare`): agregarlos cuando las sedes tengan dirección y teléfono.
- Ficha de Google: la crea y verifica la clínica en el Perfil de Negocio de Google, una por sede. No es parte del código.

## Dependencias

`npm audit` queda con avisos solo en herramientas de desarrollo del servidor (jest, nodemon) y dos moderados en el frontend por `exceljs` → `uuid`, que se corrigen cuando `exceljs` publique una versión nueva. Ninguno afecta el uso actual.

## Demostración sin servidor (GitHub Pages)

Para mostrar la plataforma sin instalar nada existe una compilación de demostración: no usa servidor ni base de datos, responde con lecturas grabadas de las cuentas de ejemplo (`@demo.udes.co`) y no guarda ningún cambio. Sirve para enseñar las pantallas, no para usar el sistema.

Desde `frontend/`, con el frontend y el backend encendidos y los datos de ejemplo cargados:

```
node demo/grabar.mjs                    # graba las lecturas (solo mira) y sustituye los datos de las cuentas que no son de ejemplo
node demo/publicar.mjs nombre-del-repo  # compila en frontend/dist-demo (agregar --servir para probarla en http://localhost:4173)
```

El contenido de `frontend/dist-demo` se publica en la rama `gh-pages` del repositorio. Entran las tres cuentas de ejemplo con cualquier contraseña; el superadministrador no está incluido. El reloj de la demostración queda fijo en el momento de la grabación. Para retirarla basta borrar la rama `gh-pages`.
