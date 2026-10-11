// pages/NoEncontradaPage.jsx
// Direccion que no existe en el sitio (antes se veia una pagina en blanco).
// Mismo marco de las pantallas de sesion.
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { rutaPanelPorRol } from '../utils/rutas';

export function NoEncontradaPage() {
  const { estaAutenticado, usuario } = useAuth();

  return (
    <AuthLayout titulo="No encontramos esta página" subtitulo="La dirección no existe o cambió. Revisa que esté bien escrita o vuelve al inicio.">
      <div className="flex flex-col gap-3">
        <Link to="/" className="boton-glass-ambar rounded-boton px-4 py-2.5 text-center text-sm font-semibold">
          Ir al inicio
        </Link>
        {estaAutenticado && (
          <Link
            to={rutaPanelPorRol(usuario.rol)}
            className="rounded-boton border border-brand-blue-700 px-4 py-2.5 text-center text-sm font-semibold text-brand-blue-700 transition hover:bg-blue-50"
          >
            Volver a mi panel
          </Link>
        )}
      </div>
    </AuthLayout>
  );
}
