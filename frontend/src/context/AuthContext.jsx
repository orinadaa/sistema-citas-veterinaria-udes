// context/AuthContext.jsx
// Sesion del usuario en el frontend. Persiste en localStorage para que
// no se pierda al recargar la pagina. RF-02, RF-05.

import { createContext, useContext, useEffect, useState } from 'react';
import { EVENTO_SESION_TERMINADA, EVENTO_TOKEN_RENOVADO } from '../api/client';

const AuthContext = createContext(null);
// Exportada para poder limpiarla directamente (sin pasar por React state)
// justo antes de una recarga completa del navegador -- ver Navbar.jsx y
// AdminHeader.jsx: cerrarSesion() dispara un re-render en la pagina
// actual (todavia protegida) antes de que la recarga tenga efecto, lo
// que causaba un flash de /iniciar-sesion antes de llegar al landing.
export const CLAVE_ALMACENAMIENTO = 'udes_veterinaria_sesion';
// Aviso de una sola vez para la pantalla de inicio de sesion ("tu sesion
// termino"): vive solo en esta pestaña.
export const CLAVE_AVISO_SESION = 'udes_veterinaria_aviso_sesion';

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

  // El servidor rechazo el token (vencio a las 8 horas, la cuenta se
  // desactivo o cambio la contraseña en otro equipo): se cierra la sesion
  // local y ProtectedRoute lleva a iniciar sesion.
  useEffect(() => {
    function alTerminar(evento) {
      setSesion((actual) => {
        if (actual) {
          try {
            sessionStorage.setItem(CLAVE_AVISO_SESION, evento.detail || 'Tu sesión terminó. Inicia sesión de nuevo.');
          } catch {
            // sessionStorage no disponible: solo se pierde el aviso.
          }
        }
        return null;
      });
    }
    function alRenovar(evento) {
      setSesion((actual) => (actual ? { ...actual, token: evento.detail } : actual));
    }
    window.addEventListener(EVENTO_SESION_TERMINADA, alTerminar);
    window.addEventListener(EVENTO_TOKEN_RENOVADO, alRenovar);
    return () => {
      window.removeEventListener(EVENTO_SESION_TERMINADA, alTerminar);
      window.removeEventListener(EVENTO_TOKEN_RENOVADO, alRenovar);
    };
  }, []);

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
