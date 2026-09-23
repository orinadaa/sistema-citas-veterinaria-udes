// pages/PanelAdminPage.jsx
// Panel administrativo/veterinario. RF-10 (agenda por sede), RF-11
// (servicios y especialidades de los medicos), RF-12 (seguimiento de
// citas), RF-13 (horarios). Los veterinarios solo ven su seguimiento
// de citas; el resto de secciones son exclusivas del administrador.
import { useState } from 'react';
import { AdminSidebar } from '../components/layout/AdminSidebar';
import { AdminHeader } from '../components/layout/AdminHeader';
import { useAuth } from '../context/AuthContext';
import { PanelServicios } from '../components/admin/PanelServicios';
import { PanelMedicos } from '../components/admin/PanelMedicos';
import { PanelHorarios } from '../components/admin/PanelHorarios';
import { PanelCitasSeguimiento } from '../components/admin/PanelCitasSeguimiento';
import { PanelPacientes } from '../components/admin/PanelPacientes';
import { PanelConfiguracion } from '../components/admin/PanelConfiguracion';

export function PanelAdminPage() {
  const { usuario } = useAuth();
  const esAdministrador = usuario?.rol === 'administrador';
  const [pestana, setPestana] = useState('citas');

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFBFC]">
      <AdminSidebar activo={pestana} onCambiar={setPestana} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
          {esAdministrador && pestana === 'citas' && <PanelCitasSeguimiento />}
          {esAdministrador && pestana === 'servicios' && <PanelServicios />}
          {esAdministrador && pestana === 'medicos' && <PanelMedicos />}
          {esAdministrador && pestana === 'pacientes' && <PanelPacientes />}
          {esAdministrador && pestana === 'horarios' && <PanelHorarios />}
          {esAdministrador && pestana === 'configuracion' && <PanelConfiguracion />}
          {!esAdministrador && <PanelCitasSeguimiento />}
        </main>
      </div>
    </div>
  );
}
