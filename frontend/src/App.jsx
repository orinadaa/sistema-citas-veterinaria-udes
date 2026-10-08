import { createBrowserRouter, RouterProvider, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegistroPage } from './pages/RegistroPage';
import { OlvideClavePage } from './pages/OlvideClavePage';
import { PanelClientePage } from './pages/PanelClientePage';
import { PanelAdminPage } from './pages/PanelAdminPage';
import { AgendarCitaPage } from './pages/AgendarCitaPage';
import { GuiaVetuiPage } from './pages/GuiaVetuiPage';

function Rutas() {
  return (
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/iniciar-sesion" element={<LoginPage />} />
          <Route path="/registrarse" element={<RegistroPage />} />
          <Route path="/olvide-clave" element={<OlvideClavePage />} />
          {/* Guia visual del sistema de diseño vetUI (publica, solo referencia). */}
          <Route path="/vetui" element={<GuiaVetuiPage />} />
          <Route
            path="/panel"
            element={
              <ProtectedRoute rolesPermitidos={['cliente']}>
                <PanelClientePage />
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
            path="/admin"
            element={
              <ProtectedRoute rolesPermitidos={['administrador', 'veterinario']}>
                <PanelAdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
  );
}

// Router "de datos" con una sola ruta comodin que contiene las <Routes> de
// siempre: es lo que permite frenar una navegacion con useBlocker (ver
// AgendarCitaPage: confirmar antes de abandonar una cita a medio agendar).
const router = createBrowserRouter([{ path: '*', element: <Rutas /> }]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
