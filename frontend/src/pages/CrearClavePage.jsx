// pages/CrearClavePage.jsx
// Primera entrada con clave temporal (/crear-clave). Las cuentas que crea
// otra persona (el superadministrador crea administradores y medicos; el
// administrador de sede crea medicos) nacen con una contraseña generada por
// el sistema y enviada por correo. Por seguridad, antes de usar el sistema
// la persona debe establecer aca su propia contraseña.
// No es solo una pantalla: mientras no lo haga, el servidor rechaza todo lo
// demas con ese inicio de sesion (ver backend, auth.middleware.js).
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Campo } from '../components/form/Campo';
import { establecerPrimeraClave } from '../api/client';
import { useAuth, CLAVE_ALMACENAMIENTO } from '../context/AuthContext';
import { rutaPanelPorRol } from '../utils/rutas';

export function CrearClavePage() {
  const { estaAutenticado, usuario, token, iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (!estaAutenticado) return <Navigate to="/iniciar-sesion" replace />;
  // Quien ya tiene contraseña propia no tiene nada que hacer aca.
  if (!usuario.debeCambiarContrasena) return <Navigate to={rutaPanelPorRol(usuario.rol)} replace />;

  async function guardar(evento) {
    evento.preventDefault();
    setError('');
    if (nueva.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (nueva !== confirmacion) {
      setError('Las dos contraseñas no coinciden.');
      return;
    }
    setEnviando(true);
    try {
      const respuesta = await establecerPrimeraClave(nueva, token);
      iniciarSesion(respuesta);
      navegar(rutaPanelPorRol(respuesta.usuario.rol), { replace: true });
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  function salir() {
    localStorage.removeItem(CLAVE_ALMACENAMIENTO);
    window.location.href = `${import.meta.env.BASE_URL}iniciar-sesion`;
  }

  return (
    <AuthLayout
      titulo="Crea tu contraseña"
      subtitulo={`Hola, ${usuario.nombreCompleto?.split(' ')[0] ?? ''}. Entraste con una contraseña temporal. Por seguridad, establece una propia antes de continuar.`}
      pieDePagina={
        <button type="button" onClick={salir} className="boton-texto rounded-boton px-2 py-1 font-medium text-white transition">
          Cerrar sesión
        </button>
      }
    >
      <form onSubmit={guardar} className="flex flex-col gap-4" noValidate>
        <Campo
          id="contrasena-nueva"
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          required
        />
        <Campo
          id="contrasena-confirmacion"
          label="Repite la contraseña"
          type="password"
          autoComplete="new-password"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          required
        />
        <p className="-mt-1 text-xs text-slate-700">Mínimo 8 caracteres y distinta a la temporal que recibiste por correo.</p>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="mt-2 rounded-boton bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? 'Guardando...' : 'Guardar y continuar'}
        </button>
      </form>
    </AuthLayout>
  );
}
