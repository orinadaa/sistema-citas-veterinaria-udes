// components/ProtectedRoute.jsx
// RF-05: rutas que exigen sesion, y opcionalmente un rol especifico.
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, rolesPermitidos }) {
  const { estaAutenticado, usuario } = useAuth();
  const ubicacion = useLocation();

  if (!estaAutenticado) {
    const destino = `/iniciar-sesion?next=${encodeURIComponent(ubicacion.pathname)}`;
    return <Navigate to={destino} replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
