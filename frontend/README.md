# Frontend · Sistema de citas Clínica Veterinaria UDES

Aplicación web en React + Vite + Tailwind CSS v4.

## Comandos

```bash
npm install
npm run dev       # desarrollo, en http://localhost:5173
npm run build     # versión para publicar, en dist/
npm run lint
```

En desarrollo, Vite reenvía `/api` y `/uploads` al backend (`http://localhost:4000`, ver `vite.config.js`). El backend debe estar corriendo.

## Estructura

- `src/pages/`: una pantalla por ruta. Se cargan bajo demanda (ver `App.jsx`).
- `src/components/`: por área (`landing`, `agendar`, `cliente`, `medico`, `admin`, `layout`, `form`, `ui`, `vetui`).
- `src/api/client.js`: todas las llamadas al servidor.
- `src/context/AuthContext.jsx`: sesión del usuario.
- `src/styles/vetui.css`: tokens y utilidades del sistema de diseño.

## Rutas

| Ruta | Quién | Pantalla |
|---|---|---|
| `/` | Público | Inicio |
| `/iniciar-sesion`, `/registrarse`, `/olvide-clave`, `/crear-clave` | Público | Sesión |
| `/privacidad`, `/aviso-legal` | Público | Textos legales |
| `/panel`, `/panel/perfil`, `/agendar` | Cliente | Citas, mascotas, perfil y agendamiento |
| `/medico`, `/medico/perfil` | Médico veterinario | Agenda, pacientes, perfil y horario |
| `/admin` | Administrador de sede y superadministrador | Panel de administración |
| `/vetui` | Solo en desarrollo | Guía visual del sistema de diseño |

Cualquier otra dirección muestra la página "No encontramos esta página".

## Documentación

- Sistema de diseño: `../docs/vetui.md`.
- Instalación completa: `../docs/instalacion.md`.
- Publicación: `../docs/despliegue.md`.
