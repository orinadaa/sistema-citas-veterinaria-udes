// pages/PanelClientePage.jsx
// Panel del cliente autenticado (Incremento 4, modulo de Clientes):
// "Mis citas" (RF-06/RF-08/RF-09/RF-15) y "Mis mascotas" (RF-14),
// con vetUI (floating glass): fondo de marca, encabezado con la foto del
// Hero, indicadores en vidrio blanco (TarjetaDato), pestañas de vidrio y la
// accion primaria "Agendar nueva cita" en ambar.
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { useAnclaTopbar } from '../hooks/useAnclaTopbar';
import { Boton, EncabezadoPagina, FondoVetui, Pestanas, TarjetaDato } from '../components/vetui';
import { PanelMisCitas } from '../components/cliente/PanelMisCitas';
import { PanelMisMascotas } from '../components/cliente/PanelMisMascotas';
import { estadoDeCita } from '../components/citas/DetalleCitaPanel';
import { obtenerMisCitas, obtenerMisMascotas } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatearFechaLarga, formatearHora } from '../utils/fecha';
import fotoMain from '../assets/foto-main.png';
import { IconoCalendario, IconoPata, IconoCorazon, IconoMas } from '../components/icons';

const TABS = [
  { id: 'citas', etiqueta: 'Mis citas', icono: IconoCalendario },
  { id: 'mascotas', etiqueta: 'Mis mascotas', icono: IconoPata },
];

export function PanelClientePage() {
  const { usuario, token } = useAuth();
  const [parametros] = useSearchParams();
  // ?tab=mascotas (ej. desde el atajo "Mis mascotas" del menu del
  // navbar, Navbar.jsx) preselecciona esa pestaña al entrar.
  const [pestana, setPestana] = useState(parametros.get('tab') === 'mascotas' ? 'mascotas' : 'citas');

  const [citas, setCitas] = useState([]);
  const [cargandoCitas, setCargandoCitas] = useState(true);
  const [mascotas, setMascotas] = useState([]);

  const cargarCitas = useCallback(() => {
    setCargandoCitas(true);
    obtenerMisCitas(token)
      .then((datos) => setCitas(datos.citas))
      .finally(() => setCargandoCitas(false));
  }, [token]);

  useEffect(() => {
    cargarCitas();
  }, [cargarCitas]);

  useEffect(() => {
    obtenerMisMascotas(token)
      .then((datos) => setMascotas(datos.mascotas))
      .catch((err) => console.error('No se pudieron cargar las mascotas:', err));
  }, [token]);

  const proximaCita = citas
    .filter((cita) => estadoDeCita(cita) === 'proxima')
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))[0];
  const citasCompletadas = citas.filter((cita) => estadoDeCita(cita) === 'completada').length;

  // Mismo scroll en dos posiciones que /agendar: de arriba de todo salta a
  // la vista con la pildora de la topbar ya formada, sin quedarse en la
  // transicion (el ancla son los indicadores, data-ancla-topbar).
  useAnclaTopbar();

  return (
    <FondoVetui>
      <Navbar />

      <EncabezadoPagina
        antetitulo="Mi cuenta"
        titulo={`Hola, ${usuario?.nombreCompleto?.split(' ')[0] ?? ''} 👋`}
        descripcion="Aquí puedes gestionar tus citas y las mascotas de tu cuenta de forma rápida y sencilla."
        className="py-6"
        imagen={<img src={fotoMain} alt="" className="mx-auto hidden w-full max-w-[300px] drop-shadow-2xl lg:block" />}
      />

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div data-ancla-topbar className="grid scroll-mt-28 grid-cols-1 gap-4 sm:grid-cols-3">
          <TarjetaDato
            icono={IconoCalendario}
            tono="azul"
            valor={proximaCita ? formatearFechaLarga(proximaCita.fecha_hora) : 'Sin citas próximas'}
            detalle={proximaCita ? formatearHora(proximaCita.fecha_hora) : undefined}
            etiqueta="Próxima cita"
            onClick={() => setPestana('citas')}
          />
          <TarjetaDato
            icono={IconoPata}
            tono="ambar"
            valor={mascotas.length}
            etiqueta="Mascotas registradas"
            onClick={() => setPestana('mascotas')}
          />
          <TarjetaDato
            icono={IconoCorazon}
            tono="rosa"
            valor={citasCompletadas}
            etiqueta="Citas realizadas"
            onClick={() => setPestana('citas')}
          />
        </div>

        {/* Pestañas + "Agendar nueva cita" (accion primaria) a la misma altura. */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <Pestanas items={TABS} activo={pestana} onCambiar={setPestana} etiqueta="Mi cuenta" />
          {pestana === 'citas' && (
            <Boton as={Link} to="/agendar" icono={IconoMas}>
              Agendar nueva cita
            </Boton>
          )}
        </div>

        <div className="mt-6">
          {pestana === 'citas' ? (
            <PanelMisCitas
              citas={citas}
              cargando={cargandoCitas}
              onActualizada={cargarCitas}
            />
          ) : (
            <PanelMisMascotas />
          )}
        </div>
      </main>
    </FondoVetui>
  );
}
