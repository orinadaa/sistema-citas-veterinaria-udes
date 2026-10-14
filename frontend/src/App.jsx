import { lazy, Suspense, useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { ROLES_DEL_PANEL } from './utils/rutas';
import { BarraPagina } from './components/layout/BarraPagina';
import { AvisoAmbientePruebas } from './components/layout/AvisoAmbientePruebas';

// Cada pantalla se descarga cuando se visita (antes todo iba en un solo
// archivo de 2,7 MB que tambien cargaba quien solo veia el inicio). El
// inicio va incluido: es la primera pantalla de casi todas las visitas.
const pagina = (cargar, nombre) => lazy(() => cargar().then((modulo) => ({ default: modulo[nombre] })));
const LoginPage = pagina(() => import('./pages/LoginPage'), 'LoginPage');
const RegistroPage = pagina(() => import('./pages/RegistroPage'), 'RegistroPage');
const OlvideClavePage = pagina(() => import('./pages/OlvideClavePage'), 'OlvideClavePage');
const CrearClavePage = pagina(() => import('./pages/CrearClavePage'), 'CrearClavePage');
const PanelClientePage = pagina(() => import('./pages/PanelClientePage'), 'PanelClientePage');
const PanelMedicoPage = pagina(() => import('./pages/PanelMedicoPage'), 'PanelMedicoPage');
const PanelAdminPage = pagina(() => import('./pages/PanelAdminPage'), 'PanelAdminPage');
const AgendarCitaPage = pagina(() => import('./pages/AgendarCitaPage'), 'AgendarCitaPage');
const GuiaVetuiPage = pagina(() => import('./pages/GuiaVetuiPage'), 'GuiaVetuiPage');
const NoEncontradaPage = pagina(() => import('./pages/NoEncontradaPage'), 'NoEncontradaPage');
const PrivacidadPage = pagina(() => import('./pages/LegalPage'), 'PrivacidadPage');
const AvisoLegalPage = pagina(() => import('./pages/LegalPage'), 'AvisoLegalPage');

const NOMBRE_SITIO = 'Clínica Veterinaria UDES';
// Titulo de la pestaña por pagina (WCAG 2.4.2): dice donde se esta.
const TITULOS = [
  ['/iniciar-sesion', 'Iniciar sesión'],
  ['/registrarse', 'Crear cuenta'],
  ['/olvide-clave', 'Recuperar contraseña'],
  ['/crear-clave', 'Crear contraseña'],
  ['/panel/perfil', 'Mi perfil'],
  ['/panel', 'Mis citas y mascotas'],
  ['/agendar', 'Agendar cita'],
  ['/medico/perfil', 'Mi perfil'],
  ['/medico', 'Panel médico'],
  ['/admin', 'Panel de administración'],
  ['/privacidad', 'Política de privacidad'],
  ['/aviso-legal', 'Aviso legal'],
  ['/vetui', 'Guía vetUI'],
];

function tituloDe(ruta) {
  if (ruta === '/') return `${NOMBRE_SITIO} · Agenda la cita de tu mascota`;
  const encontrado = TITULOS.find(([prefijo]) => ruta === prefijo || ruta.startsWith(`${prefijo}/`));
  return `${encontrado ? encontrado[1] : 'Página no encontrada'} · ${NOMBRE_SITIO}`;
}

// Mientras llega el codigo de una pantalla: el fondo de marca, sin salto blanco.
function Cargando() {
  return <div role="status" aria-label="Cargando" className="min-h-[100dvh] bg-brand-blue-800" />;
}

// Aviso breve al llegar redirigido (ej. al abrir un panel de otro perfil).
function AvisoDeRuta({ texto }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const temporizador = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(temporizador);
  }, []);
  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-4 z-[75] flex justify-center">
      <p role="status" className="cristal-fuerte pointer-events-auto flex max-w-md items-center gap-3 rounded-tarjeta px-4 py-3 text-sm font-medium text-slate-800">
        {texto}
        <button type="button" onClick={() => setVisible(false)} className="boton-texto shrink-0 rounded-boton px-2 py-1 text-sm font-semibold text-brand-blue-700">
          Entendido
        </button>
      </p>
    </div>
  );
}

function Rutas() {
  const { pathname, state, key } = useLocation();
  useEffect(() => {
    document.title = tituloDe(pathname);
  }, [pathname]);

  // Primer elemento de cada pagina al navegar con teclado: salta la barra
  // superior y lleva el foco al contenido.
  function saltarAlContenido() {
    const principal = document.querySelector('main');
    if (!principal) return;
    principal.tabIndex = -1;
    principal.focus();
    principal.scrollIntoView();
  }

  return (
    <>
    {state?.aviso && <AvisoDeRuta key={key} texto={state.aviso} />}
    <AvisoAmbientePruebas />
    <div role="region" aria-label="Atajo de teclado">
      <button
        type="button"
        onClick={saltarAlContenido}
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-boton focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-navy focus:shadow-lg"
      >
        Saltar al contenido
      </button>
    </div>
    <Suspense fallback={<Cargando />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/iniciar-sesion" element={<LoginPage />} />
        <Route path="/registrarse" element={<RegistroPage />} />
        <Route path="/olvide-clave" element={<OlvideClavePage />} />
        {/* Primera entrada con clave temporal: establecer la contraseña propia. */}
        <Route path="/crear-clave" element={<CrearClavePage />} />
        <Route path="/privacidad" element={<PrivacidadPage />} />
        <Route path="/aviso-legal" element={<AvisoLegalPage />} />
        {/* Guia visual del sistema de diseño vetUI: herramienta de trabajo,
            solo existe en desarrollo (no se publica). */}
        {import.meta.env.DEV && <Route path="/vetui" element={<GuiaVetuiPage />} />}
        <Route
          path="/panel"
          element={
            <ProtectedRoute rolesPermitidos={['cliente']}>
              <PanelClientePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/perfil"
          element={
            <ProtectedRoute rolesPermitidos={['cliente']}>
              <PanelClientePage seccion="perfil" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agendar"
          element={
            <ProtectedRoute rolesPermitidos={['cliente']}>
              <AgendarCitaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medico"
          element={
            <ProtectedRoute rolesPermitidos={['veterinario']}>
              <PanelMedicoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medico/perfil"
          element={
            <ProtectedRoute rolesPermitidos={['veterinario']}>
              <PanelMedicoPage seccion="perfil" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute rolesPermitidos={ROLES_DEL_PANEL}>
              <PanelAdminPage />
            </ProtectedRoute>
          }
        />
        {/* Cualquier otra direccion: pagina "no encontrada" (antes quedaba en blanco). */}
        <Route path="*" element={<NoEncontradaPage />} />
      </Routes>
    </Suspense>
    </>
  );
}

// Router "de datos" con una sola ruta comodin que contiene las <Routes> de
// siempre: es lo que permite frenar una navegacion con useBlocker (ver
// AgendarCitaPage: confirmar antes de abandonar una cita a medio agendar).
// basename: carpeta desde la que se sirve la pagina ("/" salvo en la demostracion de GitHub Pages).
const router = createBrowserRouter([{ path: '*', element: <Rutas /> }], { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' });

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      {/* Barra de desplazamiento flotante de la pagina (todas las vistas). */}
      <BarraPagina />
    </AuthProvider>
  );
}

export default App;
