// components/medico/PanelDisponibilidadMedico.jsx
// "Mi perfil > Mi horario": el medico CONSULTA su horario de trabajo y sus
// bloqueos. No los edita: desde el 11 oct 2026 (decision de la usuaria) los
// define el administrador de su sede en Medicos > Horario
// (admin/HorarioMedicoPanel.jsx).
// - Horario semanal: dias, horas y pausa. Sin horario propio, atiende con
//   el horario de atencion de su sede.
// - Bloqueos vigentes: vacaciones, permisos u horas puntuales sin atencion.
import { useEffect, useState } from 'react';
import { obtenerDisponibilidadMedico } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { EstadoError } from '../vetui';
import { IconoCalendario, IconoReloj, IconoSede } from '../icons';

// Lunes primero (la BD guarda 0 = domingo).
const DIAS = [
  { dia: 1, nombre: 'Lunes' },
  { dia: 2, nombre: 'Martes' },
  { dia: 3, nombre: 'Miércoles' },
  { dia: 4, nombre: 'Jueves' },
  { dia: 5, nombre: 'Viernes' },
  { dia: 6, nombre: 'Sábado' },
  { dia: 0, nombre: 'Domingo' },
];

const formatoHora = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });
function horaLegible(hora) {
  const [h, m] = String(hora).split(':').map(Number);
  return formatoHora.format(new Date(2000, 0, 1, h, m));
}
const formatoFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
function fechaLegible(texto) {
  const [a, m, d] = texto.split('-').map(Number);
  return formatoFecha.format(new Date(a, m - 1, d));
}

function Tarjeta({ titulo, subtitulo, children }) {
  return (
    <section className="grises-legibles vidrio-blanco rounded-superficie p-5 sm:p-6">
      <h2 className="font-heading text-base font-semibold text-brand-navy">{titulo}</h2>
      {subtitulo && <p className="mt-0.5 text-sm text-slate-500">{subtitulo}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function PanelDisponibilidadMedico() {
  const { token } = useAuth();
  const [datos, setDatos] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    obtenerDisponibilidadMedico(token)
      .then((d) => vigente && setDatos(d))
      .catch((err) => vigente && setErrorCarga(err.message || 'No se pudo cargar tu horario.'));
    return () => {
      vigente = false;
    };
  }, [token, intento]);

  if (errorCarga) {
    return (
      <EstadoError
        mensaje={errorCarga}
        onReintentar={() => {
          setErrorCarga('');
          setIntento((n) => n + 1);
        }}
      />
    );
  }
  if (!datos) return <div className="h-64 animate-pulse rounded-superficie bg-white/15" />;

  const sedePorId = new Map(datos.sedes.map((s) => [s.id, s]));
  const principal = sedePorId.get(datos.sedePrincipalId);
  const propio = datos.horario.length > 0;
  const horarioPorDia = new Map(datos.horario.map((h) => [h.dia_semana, h]));

  // Lo que se muestra por dia: su horario propio o, si no tiene, el de la sede.
  const semana = DIAS.map(({ dia, nombre }) => {
    if (propio) {
      const h = horarioPorDia.get(dia);
      return { dia, nombre, turno: h ? { inicio: h.hora_inicio, fin: h.hora_fin, pausaInicio: h.pausa_inicio, pausaFin: h.pausa_fin, sede: h.sede_nombre } : null };
    }
    const h = principal?.horario.find((x) => x.dia_semana === dia);
    return { dia, nombre, turno: h ? { inicio: h.hora_inicio, fin: h.hora_fin, sede: principal.nombre } : null };
  });
  const sedes = [...new Set(semana.filter((d) => d.turno).map((d) => d.turno.sede))];
  const hoy = new Date().getDay();

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-6">
        <Tarjeta
          titulo="Mi horario de trabajo"
          subtitulo={propio ? 'Los días y horas en que atiendes.' : `Atiendes con el horario de tu sede${principal ? `, ${principal.nombre}` : ''}.`}
        >
          <ul className="flex flex-col gap-2">
            {semana.map(({ dia, nombre, turno }) => (
              <li
                key={dia}
                className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl px-4 py-3 ring-1 ${
                  turno ? 'bg-white ring-slate-200' : 'bg-slate-50 ring-slate-200'
                }`}
              >
                <span className="flex w-32 items-center gap-2 text-sm font-semibold text-brand-navy">
                  {nombre}
                  {dia === hoy && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-brand-blue-700">Hoy</span>}
                </span>
                {turno ? (
                  <span className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                      <IconoReloj className="h-4 w-4 text-brand-blue" />
                      {horaLegible(turno.inicio)} – {horaLegible(turno.fin)}
                    </span>
                    {turno.pausaInicio && (
                      <span className="text-slate-600">
                        Pausa de {horaLegible(turno.pausaInicio)} a {horaLegible(turno.pausaFin)}
                      </span>
                    )}
                    {sedes.length > 1 && <span className="text-slate-600">{turno.sede}</span>}
                  </span>
                ) : (
                  <span className="text-sm text-slate-600">No atiendes</span>
                )}
              </li>
            ))}
          </ul>
        </Tarjeta>

        <Tarjeta titulo="Días sin atención" subtitulo="Vacaciones, permisos u horas puntuales en las que no se ofrecen citas contigo.">
          {datos.bloqueos.length === 0 ? (
            <p className="text-sm text-slate-600">No tienes bloqueos programados.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {datos.bloqueos.map((b) => (
                <li key={b.id} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                  <IconoCalendario className="h-4 w-4 shrink-0 text-brand-blue" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {b.fecha_inicio === b.fecha_fin ? fechaLegible(b.fecha_inicio) : `${fechaLegible(b.fecha_inicio)} – ${fechaLegible(b.fecha_fin)}`}
                      {b.hora_inicio ? ` · ${horaLegible(b.hora_inicio)} – ${horaLegible(b.hora_fin)}` : ' · Todo el día'}
                    </p>
                    {b.motivo && <p className="truncate text-xs text-slate-600">{b.motivo}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>

      <div className="flex flex-col gap-6">
        <Tarjeta titulo={sedes.length > 1 ? 'Sedes en las que atiendes' : 'Tu sede'}>
          {sedes.length === 0 ? (
            <p className="text-sm text-slate-600">Todavía no tienes días de atención asignados.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {sedes.map((nombre) => (
                <li key={nombre} className="flex items-center gap-2 text-sm text-slate-700">
                  <IconoSede className="h-4 w-4 text-brand-blue" />
                  <span className="flex-1">{nombre}</span>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
        <Tarjeta titulo="¿Quién define mi horario?">
          <ul className="flex flex-col gap-2 text-sm text-slate-600">
            <li>Tu horario y tus días sin atención los define el administrador de tu sede.</li>
            <li>Si necesitas un cambio, un permiso o vacaciones, pídeselo al administrador: aquí verás el cambio cuando lo guarde.</li>
            <li>Los pacientes solo pueden agendar contigo dentro de este horario.</li>
            <li>Las citas que ya estaban agendadas no se mueven ni se cancelan solas.</li>
          </ul>
        </Tarjeta>
      </div>
    </div>
  );
}
