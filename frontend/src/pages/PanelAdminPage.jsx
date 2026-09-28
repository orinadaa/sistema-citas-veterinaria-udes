// pages/PanelAdminPage.jsx
// Panel administrativo/veterinario. RF-10 (agenda por sede), RF-11
// (servicios y especialidades de los medicos), RF-12 (seguimiento de
// citas), RF-13 (horarios). El veterinario tiene su propio modulo
// (components/medico/): Mis citas, Mis pacientes y Mi perfil.
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
import { PanelReportes } from '../components/admin/PanelReportes';
import { PanelMisCitasMedico } from '../components/medico/PanelMisCitasMedico';

export function PanelAdminPage() {
  const { usuario } = useAuth();
  const esAdministrador = usuario?.rol === 'administrador';
  const [pestana, setPestana] = useState('citas');
  // Termino de busqueda precargado por pestana: lo llena la busqueda
  // global del topbar (AdminHeader) cuando se elige un resultado, y
  // cada panel lo usa para inicializar su propio filtro de busqueda.
  const [busquedaPorPestana, setBusquedaPorPestana] = useState({});

  function navegarDesdeBusqueda(pestanaDestino, termino) {
    setBusquedaPorPestana((anterior) => ({ ...anterior, [pestanaDestino]: termino }));
    setPestana(pestanaDestino);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFBFC]">
      <AdminSidebar activo={pestana} onCambiar={setPestana} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onNavegar={navegarDesdeBusqueda} />

        <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
          {esAdministrador && pestana === 'citas' && <PanelCitasSeguimiento />}
          {esAdministrador && pestana === 'servicios' && <PanelServicios busquedaInicial={busquedaPorPestana.servicios} />}
          {esAdministrador && pestana === 'medicos' && <PanelMedicos busquedaInicial={busquedaPorPestana.medicos} />}
          {esAdministrador && pestana === 'pacientes' && <PanelPacientes busquedaInicial={busquedaPorPestana.pacientes} />}
          {esAdministrador && pestana === 'horarios' && <PanelHorarios />}
          {esAdministrador && pestana === 'reportes' && <PanelReportes />}
          {esAdministrador && pestana === 'configuracion' && <PanelConfiguracion />}
          {/* Panel propio del medico veterinario */}
          {!esAdministrador && pestana === 'citas' && <PanelMisCitasMedico />}
        </main>
      </div>
    </div>
  );
}
