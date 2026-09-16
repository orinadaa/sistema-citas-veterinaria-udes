// pages/PanelAdminPage.jsx
// Placeholder del panel administrativo/veterinario. La gestion real de
// agendas, servicios y seguimiento de citas es el Incremento 3.
import { Navbar } from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';

export function PanelAdminPage() {
  const { usuario } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">
            Panel administrativo
          </h1>
          <p className="mt-3 text-slate-600">
            Sesión iniciada como {usuario?.rol} ({usuario?.nombreCompleto}).
            La gestión de agendas, servicios y seguimiento de citas estará
            disponible aquí en un incremento posterior.
          </p>
        </div>
      </main>
    </div>
  );
}
