# Sistema de citas — Clínica Veterinaria UDES

Plataforma web para la gestión de citas de la Clínica Veterinaria de la Universidad de Santander (UDES), sedes Bucaramanga y Valledupar. Proyecto de grado de Ingeniería de Software.

Los propietarios de mascotas agendan, reprograman y cancelan sus citas en línea; cada sede administra su agenda, sus médicos y sus horarios; y un perfil de administración general gestiona sedes, cuentas, servicios y el contenido de la página pública.

## Perfiles

| Perfil | Qué hace |
|---|---|
| Visitante | Consulta servicios, sedes, horarios y datos de contacto. Se registra. |
| Cliente | Registra sus mascotas; agenda, reprograma y cancela sus citas; recibe avisos y recordatorios. |
| Médico veterinario | Consulta su agenda y sus pacientes; agenda, reprograma y cancela citas de sus pacientes; deja recordatorios de cuidado. |
| Administrador de sede | Opera las citas, los médicos, los horarios y los reportes de su sede. |
| Superadministrador | Gestiona sedes, cuentas, servicios, catálogos, página pública, bitácora y copias de seguridad. |

El reparto detallado está en [docs/roles_superadministrador.md](docs/roles_superadministrador.md).

## Tecnologías

- **Interfaz:** React 19, Vite y Tailwind CSS 4.
- **Servidor:** Node.js y Express 5 (API REST).
- **Datos:** PostgreSQL.
- **Pruebas:** Jest y Supertest.

## Estructura

```
backend/     API: rutas, controladores, modelos, servicios y pruebas
frontend/    aplicación React (páginas, componentes, estilos)
database/    esquema completo, datos iniciales y scripts de cambio
docs/        instalación, despliegue, pruebas por módulo y auditoría
```

El servidor se organiza en `routes` (direcciones y perfiles autorizados), `controllers` (reglas del servicio), `models` (consultas SQL) y `middlewares` (sesión, límites de intentos y bitácora). La interfaz nunca accede a la base de datos: todo pasa por la API.

## Puesta en marcha

Requisitos: Node.js 20 o superior y PostgreSQL 17 o superior. Los pasos completos están en [docs/instalacion.md](docs/instalacion.md); en resumen:

```bash
# Base de datos
psql -U postgres -c "CREATE DATABASE clinica_veterinaria_udes"
psql -U postgres -d clinica_veterinaria_udes -f database/esquema.sql
psql -U postgres -d clinica_veterinaria_udes -f database/datos_iniciales.sql

# Servidor (http://localhost:4000)
cd backend
npm install
copy .env.example .env    # en Linux o Mac: cp .env.example .env
npm run dev

# Página (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Las variables de `backend/.env` están descritas en [backend/.env.example](backend/.env.example). Sin las de correo el sistema funciona, pero nadie puede registrarse, porque el registro confirma el correo con un código.

Para ver el sistema con datos de muestra: `npm run demo:cargar` desde `backend/` ([docs/datos_de_ejemplo.md](docs/datos_de_ejemplo.md)).

## Pruebas

```bash
cd backend
npm test
```

Las pruebas del servidor usan modelos simulados, así que no necesitan la base de datos ni envían correos. Cubren autenticación, citas, mascotas, médicos, horarios, administración, reportes, notificaciones y contenido público, con sus casos de error. La interfaz no tiene pruebas automatizadas; sus casos se verificaron a mano y están en los documentos de pruebas de `docs/`.

## Documentación

| Documento | Contenido |
|---|---|
| [docs/instalacion.md](docs/instalacion.md) | Instalación desde cero en un equipo |
| [docs/despliegue.md](docs/despliegue.md) | Qué hacer para publicar el sistema |
| [docs/roles_superadministrador.md](docs/roles_superadministrador.md) | Perfiles administrativos, catálogos y módulo de datos |
| [docs/notas_de_implementacion.md](docs/notas_de_implementacion.md) | Explicación ampliada de cada archivo y de sus decisiones de diseño |
| [docs/vetui.md](docs/vetui.md) | Guía de componentes de la interfaz |
| [docs/auditoria_sistema_2026-10-11.pdf](docs/auditoria_sistema_2026-10-11.pdf) | Informe de la auditoría del sistema |
| [docs/correcciones_auditoria.md](docs/correcciones_auditoria.md) | Estado de cada observación de la auditoría y revisión posterior |
| `docs/*_pruebas.md` | Casos de prueba por módulo: entrada, resultado esperado y resultado obtenido |

## Alcance y limitaciones conocidas

- El sistema se entrega para ejecución local; no está desplegado en un servidor institucional.
- Gestiona citas. No incluye historia clínica ni pagos o facturación.
- Una cita está agendada o cancelada; todavía no se registra si se atendió o si el usuario no asistió.
- La sesión se guarda en el almacenamiento local del navegador. Para un despliegue con datos reales conviene pasar a cookies `HttpOnly` y aplicar la política de contenido descrita en la guía de despliegue.
- El límite de intentos vive en la memoria del servidor: sirve para una sola instancia y se reinicia con ella.
- Las fotos de mascotas se entregan con enlaces firmados que vencen a las pocas horas; las demás fotos son contenido de la página pública.
- La copia de seguridad es un archivo SQL sin cifrar, con datos personales. Quien la descarga responde por guardarla cifrada.
- Varios componentes de la interfaz son grandes y están pendientes de dividirse.
- Los textos legales de la página pública son un borrador que la universidad debe aprobar.
