// pages/LoginPage.jsx
// RF-02.
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Campo } from '../components/form/Campo';
import { iniciarSesion as iniciarSesionApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const [parametros] = useSearchParams();
  const siguiente = parametros.get('next') || '/panel';
  const navegar = useNavigate();
  const { iniciarSesion } = useAuth();

  const [datos, setDatos] = useState({ correo: '', contrasena: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  function actualizarCampo(evento) {
    setDatos((anterior) => ({ ...anterior, [evento.target.name]: evento.target.value }));
  }

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setError('');
    setEnviando(true);

    try {
      const respuesta = await iniciarSesionApi(datos);
      iniciarSesion(respuesta);
      navegar(siguiente, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout
      titulo="Inicia sesión"
      subtitulo="Ingresa con tu correo y contraseña para continuar."
      pieDePagina={
        <>
          ¿No tienes cuenta?{' '}
          <Link
            to={`/registrarse?next=${encodeURIComponent(siguiente)}`}
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Regístrate
          </Link>
        </>
      }
    >
      <form onSubmit={enviarFormulario} className="flex flex-col gap-4" noValidate>
        <Campo
          id="correo"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          value={datos.correo}
          onChange={actualizarCampo}
          required
        />
        <Campo
          id="contrasena"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={datos.contrasena}
          onChange={actualizarCampo}
          required
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="mt-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>
    </AuthLayout>
  );
}
