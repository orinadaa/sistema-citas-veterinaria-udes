// pages/PanelAdminPage.jsx
// Panel administrativo/veterinario. RF-10 (agenda por sede), RF-11
// (servicios y especialidades de los medicos), RF-12 (seguimiento de
// citas), RF-13 (horarios). Los veterinarios solo ven su seguimiento
// de citas; el resto de secciones son exclusivas del administrador.
import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import { PanelServicios } from '../components/admin/PanelServicios';
import { PanelMedicos } from '../components/admin/PanelMedicos';
import { PanelHorarios } from '../components/admin/PanelHorarios';
import { PanelCitasSeguimiento } from '../components/admin/PanelCitasSeguimiento';

const PESTANAS_ADMIN = [
  { id: 'citas', etiqueta: 'Citas' },
  { id: 'servicios', etiqueta: 'Servicios' },
  { id: 'medicos', etiqueta: 'Médicos' },
  { id: 'horarios', etiqueta: 'Horarios' },
];

export function PanelAdminPage() {
  const { usuario } = useAuth();
  const esAdministrador = usuario?.rol === 'administrador';
  const [pestana, setPestana] = useState('citas');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {esAdministrador ? 'Panel administrativo' : 'Mis citas asignadas'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {usuario?.nombreCompleto} · {esAdministrador ? 'Administrador' : 'Veterinario'}
        </p>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          {esAdministrador ? (
            <>
              <div className="flex gap-1 border-b border-slate-200">
                {PESTANAS_ADMIN.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPestana(tab.id)}
                    className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                      pestana === tab.id
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.etiqueta}
                  </button>
                ))}
              </div>

              <div className="pt-6">
                {pestana === 'citas' && <PanelCitasSeguimiento />}
                {pestana === 'servicios' && <PanelServicios />}
                {pestana === 'medicos' && <PanelMedicos />}
                {pestana === 'horarios' && <PanelHorarios />}
              </div>
            </>
          ) : (
            <PanelCitasSeguimiento />
          )}
        </div>
      </main>
    </div>
  );
}
