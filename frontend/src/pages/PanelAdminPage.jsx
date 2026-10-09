// pages/PanelAdminPage.jsx
// Panel interno (/admin). Tres roles, cada uno con sus modulos (el menu
// lateral, AdminSidebar, muestra los mismos):
// - Superadministrador: administra el sistema completo sin programar
//   (sedes, cuentas, catalogo de servicios, pagina web, catalogos, datos y
//   reportes de todas las sedes). No opera citas.
// - Administrador de sede: el dia a dia de SU sede (inicio, citas, medicos,
//   pacientes, horario, reportes de su sede; los servicios, solo consulta).
// - Medico veterinario: su propio modulo (components/medico/).
// Los permisos reales los impone el servidor; aca solo se decide que mostrar.
import { useState } from 'react';
import { AdminSidebar } from '../components/layout/AdminSidebar';
import { AdminHeader } from '../components/layout/AdminHeader';
import { useAuth } from '../context/AuthContext';
import { FondoVetui } from '../components/vetui';
import { PageHeader } from '../components/ui/PageHeader';
import { PanelInicioSede } from '../components/admin/PanelInicioSede';
import { PanelInicioSistema } from '../components/admin/PanelInicioSistema';
import { PanelServicios } from '../components/admin/PanelServicios';
import { PanelMedicos } from '../components/admin/PanelMedicos';
import { PanelHorarios } from '../components/admin/PanelHorarios';
import { PanelCitasSeguimiento } from '../components/admin/PanelCitasSeguimiento';
import { PanelPacientes } from '../components/admin/PanelPacientes';
import { PanelConfiguracion } from '../components/admin/PanelConfiguracion';
import { PanelGaleria } from '../components/admin/PanelGaleria';
import { PanelCatalogos } from '../components/admin/PanelCatalogos';
import { PanelDatos } from '../components/admin/PanelDatos';
import { PanelReportes } from '../components/admin/PanelReportes';
import { PanelMisCitasMedico } from '../components/medico/PanelMisCitasMedico';
import { PanelMisPacientesMedico } from '../components/medico/PanelMisPacientesMedico';
import { PanelMiPerfilMedico } from '../components/medico/PanelMiPerfilMedico';

export function PanelAdminPage() {
  const { usuario } = useAuth();
  const rol = usuario?.rol;
  const esSuper = rol === 'superadministrador';
  const esAdministrador = rol === 'administrador';
  const esMedico = !esSuper && !esAdministrador;
  const [pestana, setPestana] = useState(esMedico ? 'citas' : 'inicio');
  // Termino de busqueda precargado por pestana: lo llena la busqueda
  // global del topbar (AdminHeader) cuando se elige un resultado, y
  // cada panel lo usa para inicializar su propio filtro de busqueda.
  const [busquedaPorPestana, setBusquedaPorPestana] = useState({});

  function navegarDesdeBusqueda(pestanaDestino, termino) {
    setBusquedaPorPestana((anterior) => ({ ...anterior, [pestanaDestino]: termino }));
    setPestana(pestanaDestino);
  }

  function irA(modulo) {
    setPestana(modulo);
  }

  // Marco en vidrio (vetUI): fondo de marca con halos y, flotando sobre el,
  // el menu lateral (vidrio; contraido es una pildora), las pildoras de la
  // barra superior y la hoja de trabajo (el mismo vidrio translucido de la
  // barra, texto blanco; las tarjetas de adentro son las blancas, con texto
  // oscuro). El vidrio de la hoja es una capa
  // HERMANA del <main>, no su contenedor: backdrop-filter convertiria a la
  // hoja en el marco de los paneles laterales (position: fixed) y quedarian
  // recortados dentro de ella.
  return (
    <FondoVetui variante="panel" className="flex h-screen gap-3 overflow-hidden p-3">
      <AdminSidebar activo={pestana} onCambiar={irA} />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <AdminHeader onNavegar={navegarDesdeBusqueda} />

        <div className="relative min-h-0 flex-1">
          <div aria-hidden="true" className="vidrio vidrio-hoja absolute inset-0 rounded-superficie" />
          <main className="hoja-panel relative h-full overflow-y-auto rounded-superficie px-6 py-8 text-white sm:px-8">
            {/* Superadministrador */}
            {esSuper && pestana === 'inicio' && <PanelInicioSistema onIr={irA} />}
            {esSuper && pestana === 'sedes' && <PanelHorarios />}
            {esSuper && pestana === 'usuarios' && <PanelConfiguracion key={busquedaPorPestana.usuarios} busquedaInicial={busquedaPorPestana.usuarios} />}
            {esSuper && pestana === 'servicios' && <PanelServicios busquedaInicial={busquedaPorPestana.servicios} />}
            {esSuper && pestana === 'web' && (
              <div className="flex flex-col gap-6">
                <PageHeader title="Página web" subtitle="Lo que ve cualquier visitante en la página pública de la clínica." />
                <PanelGaleria />
              </div>
            )}
            {esSuper && pestana === 'catalogos' && <PanelCatalogos />}
            {esSuper && pestana === 'datos' && <PanelDatos />}
            {esSuper && pestana === 'reportes' && <PanelReportes />}

            {/* Administrador de sede */}
            {esAdministrador && pestana === 'inicio' && <PanelInicioSede onIr={irA} />}
            {esAdministrador && pestana === 'citas' && <PanelCitasSeguimiento />}
            {esAdministrador && pestana === 'medicos' && <PanelMedicos busquedaInicial={busquedaPorPestana.medicos} />}
            {esAdministrador && pestana === 'pacientes' && <PanelPacientes busquedaInicial={busquedaPorPestana.pacientes} />}
            {esAdministrador && pestana === 'servicios' && <PanelServicios soloLectura busquedaInicial={busquedaPorPestana.servicios} />}
            {esAdministrador && pestana === 'horarios' && <PanelHorarios sedeFija={usuario.sedeId} />}
            {esAdministrador && pestana === 'reportes' && <PanelReportes sedeFija={usuario.sedeId} />}

            {/* Panel propio del medico veterinario */}
            {esMedico && pestana === 'citas' && <PanelMisCitasMedico />}
            {esMedico && pestana === 'pacientes' && (
              <PanelMisPacientesMedico key={busquedaPorPestana.pacientes} busquedaInicial={busquedaPorPestana.pacientes} />
            )}
            {esMedico && pestana === 'perfil' && <PanelMiPerfilMedico />}
          </main>
        </div>
      </div>
    </FondoVetui>
  );
}
