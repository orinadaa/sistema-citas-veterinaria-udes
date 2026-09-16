// pages/PanelClientePage.jsx
// Placeholder del panel de cliente autenticado. El flujo de agendamiento
// real (HU-05 a HU-08) se construye en el Incremento 2 (gestion de citas).
import { Navbar } from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';

export function PanelClientePage() {
  const { usuario } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">
            Hola, {usuario?.nombreCompleto}
          </h1>
          <p className="mt-3 text-slate-600">
            Tu cuenta está lista. El agendamiento de citas en línea estará
            disponible aquí en el próximo incremento del sistema.
          </p>
        </div>
      </main>
    </div>
  );
}
