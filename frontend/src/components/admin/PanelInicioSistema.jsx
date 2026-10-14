// components/admin/PanelInicioSistema.jsx
// Inicio del superadministrador: el estado del sistema completo de un vistazo,
// sin entrar a operar el dia a dia de ninguna sede.
import { useEffect, useState } from 'react';
import { obtenerResumenSistema } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../ui/PageHeader';
import { KPICard } from '../ui/KPICard';
import { EstadoError } from '../ui/EstadoError';
import { AvisosAtencion } from './AvisosAtencion';
import { IconoSede, IconoMedicos, IconoPersona, IconoJeringa } from '../icons';

const MODULOS = { usuarios: 'Ir a Usuarios', sedes: 'Ir a Sedes', servicios: 'Ir a Servicios', web: 'Ir a Página web' };

function Dato({ etiqueta, valor, alerta = false }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs font-medium text-slate-700">{etiqueta}</dt>
      <dd className={`text-lg font-bold tabular-nums ${alerta ? 'text-red-700' : 'text-brand-navy'}`}>{valor}</dd>
    </div>
  );
}

export function PanelInicioSistema({ onIr }) {
  const { token, usuario } = useAuth();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    obtenerResumenSistema(token)
      .then((respuesta) => vigente && (setDatos(respuesta), setError('')))
      .catch((err) => vigente && setError(err.message || 'No se pudo cargar el inicio.'));
    return () => {
      vigente = false;
    };
  }, [token, intento]);

  const titulo = `Hola, ${usuario?.nombreCompleto?.split(' ')[0] ?? ''}`;
  const subtitulo = 'Estado general del sistema y de cada sede.';

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={titulo} subtitle={subtitulo} />
        <EstadoError mensaje={error} onReintentar={() => setIntento((n) => n + 1)} />
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={titulo} subtitle={subtitulo} />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((clave) => (
            <div key={clave} className="h-36 animate-pulse rounded-2xl bg-white/20" />
          ))}
        </div>
      </div>
    );
  }

  const { sedes, cuentas, servicios, avisos } = datos;
  const sedesActivas = sedes.filter((s) => s.activo).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={titulo} subtitle={subtitulo} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard icon={IconoSede} color="blue" value={sedesActivas} label="Sedes activas" onClick={() => onIr('sedes')} />
        <KPICard
          icon={IconoMedicos}
          color="purple"
          value={cuentas.administrador + cuentas.veterinario}
          detalle={`${cuentas.administrador} administradores · ${cuentas.veterinario} médicos`}
          label="Personal activo"
          onClick={() => onIr('usuarios')}
        />
        <KPICard icon={IconoPersona} color="green" value={cuentas.cliente} label="Clientes registrados" />
        <KPICard icon={IconoJeringa} color="amber" value={servicios.activos} label="Servicios activos" onClick={() => onIr('servicios')} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-base font-semibold text-white">Sedes</h2>
          {sedes.map((sede) => (
            <article key={sede.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                {sede.foto_url ? (
                  <img src={sede.foto_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-brand-blue-700">
                    <IconoSede className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-slate-900">{sede.nombre}</h3>
                  <p className="text-xs text-slate-700">{sede.ciudad}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    sede.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {sede.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Dato etiqueta="Administradores" valor={sede.administradores} alerta={sede.activo && sede.administradores === 0} />
                <Dato etiqueta="Médicos" valor={sede.medicos} alerta={sede.activo && sede.medicos === 0} />
                <Dato etiqueta="Días con horario" valor={sede.dias_abiertos} alerta={sede.activo && sede.dias_abiertos === 0} />
                <Dato etiqueta="Citas este mes" valor={sede.citas_mes} />
              </dl>
            </article>
          ))}
        </section>

        <AvisosAtencion avisos={avisos} onIr={onIr} etiquetaModulo={MODULOS} />
      </div>
    </div>
  );
}
