// pages/RegistroPage.jsx
// RF-01: registro autoservicio de clientes.
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Campo } from '../components/form/Campo';
import { registrarCliente } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function RegistroPage() {
  const [parametros] = useSearchParams();
  const siguiente = parametros.get('next') || '/panel';
  const navegar = useNavigate();
  const { iniciarSesion } = useAuth();

  const [datos, setDatos] = useState({
    nombreCompleto: '',
    correo: '',
    contrasena: '',
    telefono: '',
  });
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
      const respuesta = await registrarCliente(datos);
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
      titulo="Crea tu cuenta"
      subtitulo="Regístrate para agendar y gestionar las citas de tu mascota."
      pieDePagina={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link
            to={`/iniciar-sesion?next=${encodeURIComponent(siguiente)}`}
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={enviarFormulario} className="flex flex-col gap-4" noValidate>
        <Campo
          id="nombreCompleto"
          label="Nombre completo"
          autoComplete="name"
          value={datos.nombreCompleto}
          onChange={actualizarCampo}
          required
        />
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
          id="telefono"
          label="Teléfono (opcional)"
          type="tel"
          autoComplete="tel"
          value={datos.telefono}
          onChange={actualizarCampo}
        />
        <Campo
          id="contrasena"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          value={datos.contrasena}
          onChange={actualizarCampo}
          minLength={8}
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
          {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>
    </AuthLayout>
  );
}
