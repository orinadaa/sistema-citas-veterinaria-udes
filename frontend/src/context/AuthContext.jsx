// context/AuthContext.jsx
// Sesion del usuario en el frontend. Persiste en localStorage para que
// no se pierda al recargar la pagina. RF-02, RF-05.

import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);
const CLAVE_ALMACENAMIENTO = 'udes_veterinaria_sesion';

function leerSesionGuardada() {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesionGuardada);

  useEffect(() => {
    if (sesion) {
      localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(sesion));
    } else {
      localStorage.removeItem(CLAVE_ALMACENAMIENTO);
    }
  }, [sesion]);

  function iniciarSesion({ usuario, token }) {
    setSesion({ usuario, token });
  }

  function cerrarSesion() {
    setSesion(null);
  }

  const valor = {
    usuario: sesion?.usuario ?? null,
    token: sesion?.token ?? null,
    estaAutenticado: Boolean(sesion?.token),
    iniciarSesion,
    cerrarSesion,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return contexto;
}
