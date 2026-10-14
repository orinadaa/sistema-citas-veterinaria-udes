// components/admin/PanelInicioSede.jsx
// Inicio del administrador de sede: responde "¿que tengo que atender hoy?" al
// abrir el sistema.
import { useEffect, useState } from 'react';
import { obtenerClientes, obtenerHorarios, obtenerServicios, obtenerTableroSede } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatearHora } from '../../utils/fecha';
import { PageHeader } from '../ui/PageHeader';
import { KPICard } from '../ui/KPICard';
import { EstadoError } from '../ui/EstadoError';
import { AvisosAtencion } from './AvisosAtencion';
import { NuevaCitaModal } from './NuevaCitaModal';
import { IconoCalendario, IconoReloj, IconoGrafica, IconoX, IconoPata } from '../icons';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MODULOS = { horarios: 'Ir a Horario', medicos: 'Ir a Médicos' };

function fechaDeHoy() {
  const texto = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function PanelInicioSede({ onIr }) {
  const { token, usuario } = useAuth();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    obtenerTableroSede(token)
      .then((respuesta) => vigente && (setDatos({ ...respuesta, recibidoEn: Date.now() }), setError('')))
      .catch((err) => vigente && setError(err.message || 'No se pudo cargar el inicio.'));
    return () => {
      vigente = false;
    };
  }, [token, intento]);

  // "Nueva cita" abre la misma ventana de Citas aqui mismo, sin salir del
  // Inicio. Lo que la ventana necesita (clientes, servicios y dias con
  // horario de la sede) se pide una sola vez, la primera vez que se abre.
  const [nuevaCitaAbierta, setNuevaCitaAbierta] = useState(false);
  const [paraAgendar, setParaAgendar] = useState(null);
  const sedeId = usuario?.sedeId;

  function abrirNuevaCita() {
    setNuevaCitaAbierta(true);
    if (paraAgendar) return;
    Promise.all([obtenerClientes(token), obtenerServicios(), obtenerHorarios(sedeId)])
      .then(([clientes, servicios, horarios]) =>
        setParaAgendar({
          clientes: clientes.usuarios,
          servicios: servicios.servicios,
          diasAbiertos: new Set(horarios.horario.map((h) => h.dia_semana)),
        })
      )
      .catch((err) => console.error('No se pudieron cargar los datos para agendar:', err));
  }

  const nombre = usuario?.nombreCompleto?.split(' ')[0] ?? '';

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={`Hola, ${nombre}`} subtitle={fechaDeHoy()} />
        <EstadoError mensaje={error} onReintentar={() => setIntento((n) => n + 1)} />
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={`Hola, ${nombre}`} subtitle={fechaDeHoy()} />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((clave) => (
            <div key={clave} className="h-36 animate-pulse rounded-2xl bg-white/20" />
          ))}
        </div>
      </div>
    );
  }

  // "Ahora" es el momento en que llegaron los datos (no se recalcula en cada render).
  const { indicadores, citasHoy, porDia, avisos, sede, recibidoEn: ahora } = datos;
  // La proxima: la primera de hoy que todavia no empieza.
  const proxima = citasHoy.find((c) => new Date(c.fecha_hora).getTime() >= ahora);
  const maximo = Math.max(1, ...porDia.map((d) => d.total));
  const hoyIso = new Date().toDateString();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Hola, ${nombre}`}
        subtitle={`${fechaDeHoy()} · ${sede.nombre}`}
        actionLabel="Nueva cita"
        onAction={abrirNuevaCita}
      />

      {/* Al agendar se queda en Inicio y se refrescan las citas de hoy. */}
      <NuevaCitaModal
        abierto={nuevaCitaAbierta}
        onCerrar={() => setNuevaCitaAbierta(false)}
        onAgendada={() => {
          setNuevaCitaAbierta(false);
          setIntento((n) => n + 1);
        }}
        clientes={paraAgendar?.clientes ?? []}
        servicios={paraAgendar?.servicios ?? []}
        sedeId={sedeId}
        diasAbiertos={paraAgendar?.diasAbiertos ?? null}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard icon={IconoCalendario} color="blue" value={indicadores.citas_hoy} label="Citas de hoy" />
        <KPICard icon={IconoReloj} color="amber" value={indicadores.pendientes_hoy} label="Pendientes por atender hoy" />
        <KPICard icon={IconoGrafica} color="green" value={indicadores.citas_semana} label="Citas esta semana" />
        <KPICard icon={IconoX} color="red" value={indicadores.canceladas_semana} label="Canceladas esta semana" />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-base font-semibold text-brand-navy">Citas de hoy</h2>
            <button
              type="button"
              onClick={() => onIr('citas')}
              className="boton-texto rounded-boton px-2 py-1 text-sm font-semibold text-brand-blue-700 transition"
            >
              Ver calendario
            </button>
          </div>

          {citasHoy.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-400 px-6 py-10 text-center">
              <IconoCalendario className="h-9 w-9 text-slate-500" peso="duotone" />
              <p className="text-sm font-medium text-slate-800">No hay citas agendadas para hoy</p>
            </div>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {citasHoy.map((cita) => {
                const esProxima = proxima?.id === cita.id;
                const yaPaso = new Date(cita.fecha_hora).getTime() < ahora;
                return (
                  <li
                    key={cita.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                      esProxima ? 'bg-amber-50 ring-2 ring-brand-amber' : 'bg-white/60 ring-1 ring-slate-900/10'
                    }`}
                  >
                    <span className={`w-20 shrink-0 text-sm font-bold tabular-nums ${yaPaso ? 'text-slate-600' : 'text-brand-navy'}`}>
                      {formatearHora(cita.fecha_hora)}
                    </span>
                    <span aria-hidden="true" className="h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: cita.categoria_color }} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-900">
                        <IconoPata className="h-4 w-4 shrink-0 text-slate-600" />
                        {cita.mascota_nombre}
                        <span className="truncate font-normal text-slate-700">· {cita.cliente_nombre}</span>
                      </p>
                      <p className="truncate text-xs text-slate-700">
                        {cita.servicio_nombre} · {cita.medico_nombre}
                      </p>
                    </div>
                    {esProxima && <span className="shrink-0 rounded-full bg-brand-amber px-2.5 py-0.5 text-xs font-bold text-slate-900">Próxima</span>}
                    {yaPaso && <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">Ya pasó</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <AvisosAtencion avisos={avisos} onIr={onIr} etiquetaModulo={MODULOS} />

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="font-heading text-base font-semibold text-brand-navy">Carga de la semana</h2>
            <p className="text-xs text-slate-700">Citas agendadas por día.</p>
            {/* Barras: la altura es proporcional al dia mas cargado. El numero
                va escrito sobre cada barra (no depende solo del tamaño). */}
            <ol className="mt-4 flex h-36 items-end gap-2">
              {porDia.map((dia) => {
                const fecha = new Date(dia.dia);
                // dia.dia llega como fecha sin hora: se lee en UTC para no correrla un dia.
                const local = new Date(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate());
                const esHoy = local.toDateString() === hoyIso;
                return (
                  <li key={dia.dia} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-xs font-bold tabular-nums text-slate-800">{dia.total}</span>
                    <span
                      aria-hidden="true"
                      className={`w-full rounded-t-lg ${esHoy ? 'bg-brand-amber' : 'bg-brand-blue-600'}`}
                      style={{ height: `${Math.max(4, (dia.total / maximo) * 100)}%`, opacity: dia.total === 0 ? 0.25 : 1 }}
                    />
                    <span className={`text-xs ${esHoy ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{DIAS[local.getDay()]}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
