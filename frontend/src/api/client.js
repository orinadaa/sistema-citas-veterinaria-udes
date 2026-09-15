// api/client.js
// Cliente HTTP minimo para hablar con el backend. El proxy de Vite
// redirige "/api/..." al backend en desarrollo (ver vite.config.js).

async function solicitar(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const encabezados = { 'Content-Type': 'application/json' };
  if (token) {
    encabezados.Authorization = `Bearer ${token}`;
  }

  const respuesta = await fetch(`/api${ruta}`, {
    method: metodo,
    headers: encabezados,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || `Error inesperado (${respuesta.status})`);
  }

  return datos;
}

export function registrarCliente(datos) {
  return solicitar('/auth/registro', { metodo: 'POST', cuerpo: datos });
}

export function iniciarSesion(datos) {
  return solicitar('/auth/login', { metodo: 'POST', cuerpo: datos });
}

export function obtenerSedes() {
  return solicitar('/sedes');
}

export function obtenerPerfil(token) {
  return solicitar('/auth/perfil', { token });
}
