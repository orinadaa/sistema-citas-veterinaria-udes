// pages/PanelClientePage.jsx
// Panel del cliente autenticado (Incremento 4, modulo de Clientes):
// "Mis citas" (RF-06/RF-08/RF-09/RF-15) y "Mis mascotas" (RF-14),
// con el mismo lenguaje visual del panel administrativo (PageHeader,
// KPICard, Tabs, colores de marca) en vez del layout generico anterior.
// El banner reutiliza el mismo degradado + foto del Hero del landing
// (fotomain.png), sin inventar formas decorativas que no existen ahi.
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Tabs } from '../components/ui/Tabs';
import { KPICard } from '../components/ui/KPICard';
import { PanelMisCitas } from '../components/cliente/PanelMisCitas';
import { PanelMisMascotas } from '../components/cliente/PanelMisMascotas';
import { estadoDeCita } from '../components/citas/DetalleCitaPanel';
import { obtenerMisCitas, obtenerMisMascotas } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatearFechaLarga, formatearHora } from '../utils/fecha';
import fotoMain from '../assets/foto-main.png';
import { IconoCalendario, IconoPata, IconoCorazon } from '../components/icons';

const TABS = [
  { id: 'citas', label: 'Mis citas' },
  { id: 'mascotas', label: 'Mis mascotas' },
];

export function PanelClientePage() {
  const { usuario, token } = useAuth();
  const [parametros] = useSearchParams();
  const [pestana, setPestana] = useState('citas');

  const [citas, setCitas] = useState([]);
  const [cargandoCitas, setCargandoCitas] = useState(true);
  const [mascotas, setMascotas] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(parametros.get('agendar') === '1');

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

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-b from-brand-blue-500 to-brand-blue-800">
        <div className="relative mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">Mi cuenta</p>
            <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">
              Hola, {usuario?.nombreCompleto?.split(' ')[0]} 👋
            </h1>
            <p className="mt-2 max-w-md text-blue-50">
              Aquí puedes gestionar tus citas y las mascotas de tu cuenta de forma rápida y sencilla.
            </p>
          </div>
          <img src={fotoMain} alt="" className="mx-auto hidden w-full max-w-[360px] drop-shadow-2xl lg:block" />
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="-mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KPICard
            icon={IconoCalendario}
            color="blue"
            value={proximaCita ? formatearFechaLarga(proximaCita.fecha_hora) : 'Sin citas próximas'}
            detalle={proximaCita ? formatearHora(proximaCita.fecha_hora) : undefined}
            label="Próxima cita"
            onClick={() => setPestana('citas')}
          />
          <KPICard
            icon={IconoPata}
            color="amber"
            value={mascotas.length}
            label="Mascotas registradas"
            onClick={() => setPestana('mascotas')}
          />
          <KPICard
            icon={IconoCorazon}
            color="pink"
            value={citasCompletadas}
            label="Citas realizadas"
            onClick={() => setPestana('citas')}
          />
        </div>

        <div className="mt-10">
          <Tabs items={TABS} activeItem={pestana} onChange={setPestana} />
        </div>

        <div className="mt-6">
          {pestana === 'citas' ? (
            <PanelMisCitas
              citas={citas}
              cargando={cargandoCitas}
              onActualizada={cargarCitas}
              mostrarFormulario={mostrarFormulario}
              onAbrirFormulario={() => setMostrarFormulario(true)}
              onCerrarFormulario={() => setMostrarFormulario(false)}
              servicioIdInicial={parametros.get('servicioId') || undefined}
            />
          ) : (
            <PanelMisMascotas />
          )}
        </div>
      </main>
    </div>
  );
}
