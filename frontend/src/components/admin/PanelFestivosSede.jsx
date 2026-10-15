import { useEffect, useState } from 'react';
import {
  abrirFestivoSede,
  cerrarFestivoSede,
  obtenerCitasAfectadasFestivo,
  obtenerFestivosSede,
} from '../../api/client';
import { ConfirmarCitasAfectadas } from './ConfirmarCitasAfectadas';

const horaPredeterminada = { horaInicio: '08:00', horaFin: '17:00' };

function fechaLegible(fecha) {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' })
    .format(new Date(`${fecha}T12:00:00Z`));
}

export function PanelFestivosSede({ sedeId, token, onAviso }) {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [festivos, setFestivos] = useState([]);
  const [horarios, setHorarios] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState('');
  const [error, setError] = useState('');
  const [confirmacion, setConfirmacion] = useState(null);

  function cargar() {
    setCargando(true);
    setError('');
    obtenerFestivosSede(sedeId, anio, token)
      .then((datos) => {
        setFestivos(datos.festivos);
        setHorarios(Object.fromEntries(datos.festivos.map((festivo) => [festivo.fecha, {
          horaInicio: festivo.hora_inicio || horaPredeterminada.horaInicio,
          horaFin: festivo.hora_fin || horaPredeterminada.horaFin,
        }])));
      })
      .catch((err) => setError(err.message || 'No se pudo cargar el calendario de festivos.'))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    let vigente = true;
    obtenerFestivosSede(sedeId, anio, token)
      .then((datos) => {
        if (!vigente) return;
        setFestivos(datos.festivos);
        setHorarios(Object.fromEntries(datos.festivos.map((festivo) => [festivo.fecha, {
          horaInicio: festivo.hora_inicio || horaPredeterminada.horaInicio,
          horaFin: festivo.hora_fin || horaPredeterminada.horaFin,
        }])));
      })
      .catch((err) => {
        if (vigente) setError(err.message || 'No se pudo cargar el calendario de festivos.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => { vigente = false; };
  }, [sedeId, anio, token]);

  function cambiarHora(fecha, campo, valor) {
    setHorarios((actuales) => ({
      ...actuales,
      [fecha]: { ...(actuales[fecha] || horaPredeterminada), [campo]: valor },
    }));
  }

  async function confirmarSiHayCitas(festivo, horas, cerrar, accion) {
    const { citas } = await obtenerCitasAfectadasFestivo({
      sedeId,
      fecha: festivo.fecha,
      horaInicio: cerrar ? null : horas.horaInicio,
      horaFin: cerrar ? null : horas.horaFin,
    }, token);
    if (citas.length === 0) {
      await accion();
      return;
    }
    setConfirmacion({
      titulo: `${citas.length} ${citas.length === 1 ? 'cita queda' : 'citas quedan'} fuera del horario`,
      explicacion: `El cambio del festivo ${festivo.nombre} dejaría estas citas sin atención. Al confirmar, la clínica intentará reasignarlas y avisará a cada cliente para que reagende las que no pueda reasignar.`,
      textoConfirmar: 'Guardar y avisar a los clientes',
      citas,
      accion,
    });
  }

  async function guardar(festivo) {
    const horas = horarios[festivo.fecha] || horaPredeterminada;
    if (!horas.horaInicio || !horas.horaFin || horas.horaInicio >= horas.horaFin) {
      setError('En cada festivo abierto, la hora inicial debe ser anterior a la hora final.');
      return;
    }
    setError('');
    setGuardando(festivo.fecha);
    const accion = async () => {
      setConfirmacion(null);
      try {
        const { citasAfectadas } = await abrirFestivoSede({ sedeId, fecha: festivo.fecha, ...horas }, token);
        onAviso?.(citasAfectadas > 0
          ? `${festivo.nombre}: ${citasAfectadas} cita(s) quedaron por reagendar; se avisó a los clientes.`
          : `${festivo.nombre} quedó abierto de ${horas.horaInicio} a ${horas.horaFin}.`);
        cargar();
      } catch (err) {
        setError(err.message || 'No se pudo guardar el horario del festivo.');
      } finally {
        setGuardando('');
      }
    };
    try {
      await confirmarSiHayCitas(festivo, horas, false, accion);
    } catch (err) {
      setError(err.message || 'No se pudieron revisar las citas afectadas.');
      setGuardando('');
    }
  }

  async function cerrar(festivo) {
    setError('');
    setGuardando(festivo.fecha);
    const accion = async () => {
      setConfirmacion(null);
      try {
        const { citasAfectadas } = await cerrarFestivoSede(sedeId, festivo.fecha, token);
        onAviso?.(citasAfectadas > 0
          ? `${festivo.nombre} quedó cerrado; ${citasAfectadas} cita(s) quedaron por reagendar y se avisó a los clientes.`
          : `${festivo.nombre} quedó cerrado.`);
        cargar();
      } catch (err) {
        setError(err.message || 'No se pudo cerrar el festivo.');
      } finally {
        setGuardando('');
      }
    };
    try {
      await confirmarSiHayCitas(festivo, null, true, accion);
    } catch (err) {
      setError(err.message || 'No se pudieron revisar las citas afectadas.');
      setGuardando('');
    }
  }

  async function aceptarCambio() {
    if (!confirmacion?.accion) return;
    setGuardando(confirmacion.citas?.[0]?.fecha || 'festivo');
    setConfirmacion((actual) => ({ ...actual, ejecutando: true }));
    await confirmacion.accion();
  }

  return (
    <section className="mt-5 border-t border-slate-900/10 pt-4" aria-labelledby="titulo-festivos-sede">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="titulo-festivos-sede" className="text-sm font-semibold text-brand-navy">Festivos nacionales</h3>
          <p className="mt-1 text-xs text-slate-600">Colombia · Cerrados por defecto. Puedes abrir una fecha con un horario especial.</p>
        </div>
        <label className="text-xs font-medium text-slate-700">
          Año
        <select className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm" value={anio} onChange={(evento) => { setCargando(true); setAnio(Number(evento.target.value)); }}>
            {[0, 1, 2, 3, 4, 5].map((salto) => {
              const valor = new Date().getFullYear() + salto;
              return <option key={valor} value={valor}>{valor}</option>;
            })}
          </select>
        </label>
      </div>

      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      {cargando ? (
        <p className="mt-3 text-sm text-slate-500">Cargando festivos…</p>
      ) : (
        <ul className="mt-3 flex max-h-[28rem] flex-col gap-2 overflow-y-auto pr-1">
          {festivos.map((festivo) => {
            const horario = horarios[festivo.fecha] || horaPredeterminada;
            const trabajando = guardando === festivo.fecha;
            return (
              <li key={festivo.fecha} className="rounded-xl border border-slate-200 bg-white/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{festivo.nombre}</p>
                    <p className="text-xs text-slate-600">{fechaLegible(festivo.fecha)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${festivo.abierto ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                    {festivo.abierto ? 'Abierto' : 'Cerrado'}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <label className="text-xs text-slate-600">
                    Desde
                    <input aria-label={`Hora inicial ${festivo.nombre}`} type="time" value={horario.horaInicio} onChange={(evento) => cambiarHora(festivo.fecha, 'horaInicio', evento.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900" />
                  </label>
                  <label className="text-xs text-slate-600">
                    Hasta
                    <input aria-label={`Hora final ${festivo.nombre}`} type="time" value={horario.horaFin} onChange={(evento) => cambiarHora(festivo.fecha, 'horaFin', evento.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900" />
                  </label>
                  <button type="button" disabled={Boolean(guardando)} onClick={() => guardar(festivo)} className="rounded-boton bg-brand-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
                    {trabajando ? 'Guardando…' : festivo.abierto ? 'Guardar horario' : 'Abrir fecha'}
                  </button>
                  {festivo.abierto && (
                    <button type="button" disabled={Boolean(guardando)} onClick={() => cerrar(festivo)} className="rounded-boton border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60">
                      Cerrar
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmarCitasAfectadas
        confirmacion={confirmacion}
        onConfirmar={aceptarCambio}
        onCancelar={() => { setConfirmacion(null); setGuardando(''); }}
        enviando={Boolean(confirmacion?.ejecutando)}
      />
    </section>
  );
}
