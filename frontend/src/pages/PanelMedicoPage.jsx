// pages/PanelMedicoPage.jsx
// Vista del medico veterinario (/medico y /medico/perfil). Decisiones de
// Oriana: el medico deja el panel tipo dashboard de /admin (que queda solo
// para el administrador de sede y el superadministrador) y pasa a una
// pagina con la MISMA estructura que la del cliente (PanelClientePage):
// fondo de marca a pagina completa, barra flotante en pildora (Navbar),
// encabezado con saludo y pestañas de vidrio.
// - Dos pestañas: "Mis citas" y "Mis pacientes" (?tab=pacientes).
// - "Mi perfil" NO es una pestaña: se abre desde el menu del avatar de la
//   pildora y vive en /medico/perfil (seccion="perfil"), con sus tres
//   secciones de siempre.
// - Los indicadores son los de cada pestaña (no hay una fila fija arriba).
// Es un cambio de presentacion: lo que el medico puede hacer y el servidor
// no cambian.
import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { useAnclaTopbar } from '../hooks/useAnclaTopbar';
import { Boton, EncabezadoPagina, FondoVetui, Pestanas } from '../components/vetui';
import { PanelMisCitasMedico } from '../components/medico/PanelMisCitasMedico';
import { PanelMisPacientesMedico } from '../components/medico/PanelMisPacientesMedico';
import { PanelMiPerfilMedico } from '../components/medico/PanelMiPerfilMedico';
import { useAuth } from '../context/AuthContext';
import fotoMain from '../assets/foto-main.png';
import { IconoCalendario, IconoFlechaDerecha, IconoMas, IconoPata } from '../components/icons';

const TABS = [
  { id: 'citas', etiqueta: 'Mis citas', icono: IconoCalendario },
  { id: 'pacientes', etiqueta: 'Mis pacientes', icono: IconoPata },
];

export function PanelMedicoPage({ seccion = 'inicio' }) {
  const { usuario } = useAuth();
  const [parametros, setParametros] = useSearchParams();
  const ubicacion = useLocation();
  const enPerfil = seccion === 'perfil';
  // La pestaña vive en la URL (?tab=pacientes): asi los accesos de la
  // pildora la cambian aunque ya se este en /medico.
  const pestana = parametros.get('tab') === 'pacientes' ? 'pacientes' : 'citas';
  // "Agendar cita" de la pildora: cada pulsacion sube este contador y Mis
  // citas abre su panel de agendar. Llegando desde el perfil viene en el
  // estado de la navegacion.
  const [senalAgendar, setSenalAgendar] = useState(ubicacion.state?.agendar ? 1 : 0);

  useAnclaTopbar();

  function agendar() {
    if (pestana !== 'citas') setParametros({});
    setSenalAgendar((n) => n + 1);
  }

  const nombre = usuario?.nombreCompleto?.split(' ')[0] ?? '';

  return (
    <FondoVetui variante="panel" textoDirecto>
      <Navbar onAgendar={enPerfil ? undefined : agendar} />

      <EncabezadoPagina
        antetitulo={enPerfil ? 'Mi perfil' : 'Panel médico'}
        titulo={enPerfil ? usuario?.nombreCompleto ?? '' : `Hola, ${nombre} 👋`}
        descripcion={
          enPerfil
            ? 'Consulta y actualiza tu información personal, profesional y tu disponibilidad.'
            : 'Aquí tienes tu agenda y tus pacientes para atender el día de forma rápida y sencilla.'
        }
        className="py-6"
        agrupado
        imagen={<img src={fotoMain} alt="" className="hidden w-[340px] drop-shadow-2xl lg:-my-4 lg:block xl:w-[420px]" />}
      />

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:min-h-[calc(100vh-7rem)]">
        {enPerfil ? (
          <>
            <div data-ancla-topbar className="scroll-mt-28">
              <Link to="/medico" className="boton-texto inline-flex items-center gap-2 rounded-boton px-2 py-1 text-sm font-semibold text-white transition">
                <IconoFlechaDerecha className="h-4 w-4 rotate-180" />
                Volver a mis citas
              </Link>
            </div>
            <div className="mt-6">
              {/* key: "Disponibilidad" de la pildora abre esa seccion aunque ya se este en el perfil. */}
              <PanelMiPerfilMedico key={parametros.get('tab') ?? 'personal'} pestanaInicial={parametros.get('tab')} />
            </div>
          </>
        ) : (
          <>
            <div data-ancla-topbar className="flex scroll-mt-28 flex-wrap items-center justify-between gap-3">
              <Pestanas
                items={TABS}
                activo={pestana}
                onCambiar={(id) => setParametros(id === 'pacientes' ? { tab: 'pacientes' } : {})}
                etiqueta="Panel médico"
              />
              {/* Accion primaria a la altura de las pestañas, como en el cliente. */}
              {pestana === 'citas' && (
                <Boton icono={IconoMas} onClick={agendar}>
                  Agendar nueva cita
                </Boton>
              )}
            </div>
            <div className="mt-6">{pestana === 'citas' ? <PanelMisCitasMedico senalAgendar={senalAgendar} /> : <PanelMisPacientesMedico />}</div>
          </>
        )}
      </main>
    </FondoVetui>
  );
}
