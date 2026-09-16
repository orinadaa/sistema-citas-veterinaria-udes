// pages/PanelClientePage.jsx
// Panel del cliente autenticado: agendar citas (RF-06) y gestionar las
// propias (RF-08, RF-09), a partir del listado de RF-15.
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { ListaCitas } from '../components/citas/ListaCitas';
import { FormularioAgendar } from '../components/citas/FormularioAgendar';
import { obtenerMisCitas } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function PanelClientePage() {
  const { usuario, token } = useAuth();
  const [parametros] = useSearchParams();
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(parametros.get('agendar') === '1');

  const cargarCitas = useCallback(() => {
    setCargando(true);
    obtenerMisCitas(token)
      .then((datos) => setCitas(datos.citas))
      .finally(() => setCargando(false));
  }, [token]);

  useEffect(() => {
    cargarCitas();
  }, [cargarCitas]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Hola, {usuario?.nombreCompleto}</h1>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Mis citas</h2>
            <button
              type="button"
              onClick={() => setMostrarFormulario((valor) => !valor)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
            >
              {mostrarFormulario ? 'Cerrar' : 'Agendar cita'}
            </button>
          </div>

          {mostrarFormulario && (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <FormularioAgendar
                onAgendada={() => {
                  setMostrarFormulario(false);
                  cargarCitas();
                }}
              />
            </div>
          )}

          <div className="mt-6">
            {cargando ? (
              <div className="flex flex-col gap-4">
                {[0, 1].map((clave) => (
                  <div key={clave} className="h-24 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : (
              <ListaCitas citas={citas} onActualizada={cargarCitas} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
