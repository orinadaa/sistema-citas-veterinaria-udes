// pages/PanelAdminPage.jsx
// Panel administrativo/veterinario. RF-10 (agenda por sede), RF-11
// (servicios y especialidades de los medicos), RF-12 (seguimiento de
// citas), RF-13 (horarios). El veterinario tiene su propio modulo
// (components/medico/): Mis citas, Mis pacientes y Mi perfil.
import { useState } from 'react';
import { AdminSidebar } from '../components/layout/AdminSidebar';
import { AdminHeader } from '../components/layout/AdminHeader';
import { useAuth } from '../context/AuthContext';
import { FondoVetui } from '../components/vetui';
import { PanelServicios } from '../components/admin/PanelServicios';
import { PanelMedicos } from '../components/admin/PanelMedicos';
import { PanelHorarios } from '../components/admin/PanelHorarios';
import { PanelCitasSeguimiento } from '../components/admin/PanelCitasSeguimiento';
import { PanelPacientes } from '../components/admin/PanelPacientes';
import { PanelConfiguracion } from '../components/admin/PanelConfiguracion';
import { PanelReportes } from '../components/admin/PanelReportes';
import { PanelMisCitasMedico } from '../components/medico/PanelMisCitasMedico';
import { PanelMisPacientesMedico } from '../components/medico/PanelMisPacientesMedico';
import { PanelMiPerfilMedico } from '../components/medico/PanelMiPerfilMedico';

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

  // Marco en vidrio (vetUI): fondo de marca con halos y tres piezas que
  // flotan sobre el: menu lateral (vidrio), barra superior y hoja de
  // trabajo (vidrio blanco, texto oscuro). El vidrio de la hoja es una capa
  // HERMANA del <main>, no su contenedor: backdrop-filter convertiria a la
  // hoja en el marco de los paneles laterales (position: fixed) y quedarian
  // recortados dentro de ella.
  return (
    <FondoVetui className="flex h-screen gap-3 overflow-hidden p-3">
      <AdminSidebar activo={pestana} onCambiar={setPestana} />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <AdminHeader onNavegar={navegarDesdeBusqueda} />

        <div className="relative min-h-0 flex-1">
          <div aria-hidden="true" className="vidrio-blanco absolute inset-0 rounded-superficie" />
          <main className="relative h-full overflow-y-auto rounded-superficie px-6 py-8 sm:px-8">
          {esAdministrador && pestana === 'citas' && <PanelCitasSeguimiento />}
          {esAdministrador && pestana === 'servicios' && <PanelServicios busquedaInicial={busquedaPorPestana.servicios} />}
          {esAdministrador && pestana === 'medicos' && <PanelMedicos busquedaInicial={busquedaPorPestana.medicos} />}
          {esAdministrador && pestana === 'pacientes' && <PanelPacientes busquedaInicial={busquedaPorPestana.pacientes} />}
          {esAdministrador && pestana === 'horarios' && <PanelHorarios />}
          {esAdministrador && pestana === 'reportes' && <PanelReportes />}
          {esAdministrador && pestana === 'configuracion' && <PanelConfiguracion />}
          {/* Panel propio del medico veterinario */}
          {!esAdministrador && pestana === 'citas' && <PanelMisCitasMedico />}
          {!esAdministrador && pestana === 'pacientes' && (
            <PanelMisPacientesMedico key={busquedaPorPestana.pacientes} busquedaInicial={busquedaPorPestana.pacientes} />
          )}
          {!esAdministrador && pestana === 'perfil' && <PanelMiPerfilMedico />}
          </main>
        </div>
      </div>
    </FondoVetui>
  );
}
