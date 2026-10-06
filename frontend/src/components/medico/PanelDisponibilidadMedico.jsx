// components/medico/PanelDisponibilidadMedico.jsx
// "Mi perfil > Disponibilidad" (opcion A aprobada por la usuaria):
// - Horario semanal propio: por dia, si atiende, en que sede, desde/hasta
//   y una pausa opcional. Solo se ofrecen sedes abiertas ese dia y el
//   rango debe caber en su horario de atencion (el backend lo valida).
//   Sin horario propio, atiende en su sede con el horario de la sede.
// - "Sedes en las que atiendes": se deduce del horario (no es una
//   configuracion aparte, para no tener dos fuentes de verdad).
// - Bloqueos y excepciones: rango de fechas, opcionalmente solo unas
//   horas, con motivo. Las citas ya agendadas dentro no se cancelan
//   solas: se avisa cuantas hay.
import { useEffect, useState } from 'react';
import { crearBloqueoMedico, eliminarBloqueoMedico, guardarHorarioMedico, obtenerDisponibilidadMedico } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { hoyComoFechaLocal } from '../../utils/fecha';
import { EstadoError } from '../ui/EstadoError';
import { IconoPapelera, IconoReloj, IconoSede } from '../icons';

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
const CLASE_CAMPO =
  'rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30 disabled:bg-slate-50 disabled:text-slate-400';

const hhmm = (hora) => String(hora).slice(0, 5);
const formatoFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
function fechaLegible(texto) {
  const [a, m, d] = texto.split('-').map(Number);
  return formatoFecha.format(new Date(a, m - 1, d));
}

function Tarjeta({ titulo, subtitulo, children }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="font-heading text-base font-semibold text-brand-navy">{titulo}</h2>
      {subtitulo && <p className="mt-0.5 text-sm text-slate-500">{subtitulo}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Mensaje({ estado }) {
  if (!estado?.texto) return null;
  const clases = {
    ok: 'bg-emerald-50 text-brand-green ring-emerald-200',
    alerta: 'bg-amber-50 text-amber-800 ring-amber-200',
    error: 'bg-red-50 text-red-700 ring-red-200',
  };
  return <p className={`rounded-lg px-3 py-2 text-sm ring-1 ${clases[estado.tipo]}`}>{estado.texto}</p>;
}

// Semana editable a partir del horario guardado (o vacia).
function semanaDesde(horario) {
  const porDia = new Map(horario.map((h) => [h.dia_semana, h]));
  return Object.fromEntries(
    DIAS.map(({ dia }) => {
      const h = porDia.get(dia);
      return [
        dia,
        h
          ? {
              activo: true,
              sedeId: h.sede_id,
              horaInicio: hhmm(h.hora_inicio),
              horaFin: hhmm(h.hora_fin),
              conPausa: Boolean(h.pausa_inicio),
              pausaInicio: h.pausa_inicio ? hhmm(h.pausa_inicio) : '',
              pausaFin: h.pausa_fin ? hhmm(h.pausa_fin) : '',
            }
          : { activo: false, sedeId: '', horaInicio: '', horaFin: '', conPausa: false, pausaInicio: '', pausaFin: '' },
      ];
    })
  );
}

export function PanelDisponibilidadMedico() {
  const { token } = useAuth();
  const [datos, setDatos] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [intento, setIntento] = useState(0);

  const [personalizado, setPersonalizado] = useState(false);
  const [semana, setSemana] = useState({});
  const [estadoHorario, setEstadoHorario] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const BLOQUEO_VACIO = { fechaInicio: '', fechaFin: '', soloHoras: false, horaInicio: '', horaFin: '', motivo: '' };
  const [bloqueo, setBloqueo] = useState(BLOQUEO_VACIO);
  const [estadoBloqueo, setEstadoBloqueo] = useState(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null);

  function aplicar(nuevos) {
    setDatos(nuevos);
    setPersonalizado(nuevos.horario.length > 0);
    setSemana(semanaDesde(nuevos.horario));
  }

  useEffect(() => {
    let vigente = true;
    obtenerDisponibilidadMedico(token)
      .then((d) => vigente && aplicar(d))
      .catch((err) => vigente && setErrorCarga(err.message || 'No se pudo cargar tu disponibilidad.'));
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
  if (!datos) return <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />;

  const sedePorId = new Map(datos.sedes.map((s) => [s.id, s]));
  const horarioSede = (sedeId, dia) => sedePorId.get(sedeId)?.horario.find((h) => h.dia_semana === dia);
  const sedesAbiertas = (dia) => datos.sedes.filter((s) => s.horario.some((h) => h.dia_semana === dia));
  const principal = sedePorId.get(datos.sedePrincipalId);

  function cambiarDia(dia, cambios) {
    setSemana((s) => ({ ...s, [dia]: { ...s[dia], ...cambios } }));
  }

  // Al personalizar: parte del horario de la sede principal.
  function personalizar() {
    const base = semanaDesde([]);
    DIAS.forEach(({ dia }) => {
      const h = principal ? horarioSede(principal.id, dia) : null;
      if (h) base[dia] = { ...base[dia], activo: true, sedeId: principal.id, horaInicio: hhmm(h.hora_inicio), horaFin: hhmm(h.hora_fin) };
    });
    setSemana(base);
    setPersonalizado(true);
    setEstadoHorario(null);
  }

  async function guardarHorario(dias, mensajeOk) {
    setGuardando(true);
    setEstadoHorario(null);
    try {
      const { horario } = await guardarHorarioMedico(dias, token);
      setDatos((d) => ({ ...d, horario }));
      setSemana(semanaDesde(horario));
      setPersonalizado(horario.length > 0);
      setEstadoHorario({ tipo: 'ok', texto: mensajeOk });
    } catch (err) {
      setEstadoHorario({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  function guardarSemana() {
    const dias = DIAS.filter(({ dia }) => semana[dia]?.activo).map(({ dia }) => {
      const d = semana[dia];
      return {
        diaSemana: dia,
        sedeId: d.sedeId,
        horaInicio: d.horaInicio,
        horaFin: d.horaFin,
        pausaInicio: d.conPausa ? d.pausaInicio : null,
        pausaFin: d.conPausa ? d.pausaFin : null,
      };
    });
    if (dias.length === 0) {
      setEstadoHorario({ tipo: 'error', texto: 'Marca al menos un día, o vuelve al horario de la sede.' });
      return;
    }
    guardarHorario(dias, 'Horario guardado. Tu agenda ya usa este horario.');
  }

  async function agregarBloqueo(evento) {
    evento.preventDefault();
    setEstadoBloqueo(null);
    try {
      const { citasAfectadas } = await crearBloqueoMedico(
        {
          fechaInicio: bloqueo.fechaInicio,
          fechaFin: bloqueo.fechaFin || bloqueo.fechaInicio,
          horaInicio: bloqueo.soloHoras ? bloqueo.horaInicio : null,
          horaFin: bloqueo.soloHoras ? bloqueo.horaFin : null,
          motivo: bloqueo.motivo,
        },
        token
      );
      setBloqueo(BLOQUEO_VACIO);
      setEstadoBloqueo(
        citasAfectadas > 0
          ? {
              tipo: 'alerta',
              texto: `Bloqueo guardado. Ojo: tienes ${citasAfectadas} ${citasAfectadas === 1 ? 'cita agendada' : 'citas agendadas'} en esas fechas; no se cancelan automáticamente.`,
            }
          : { tipo: 'ok', texto: 'Bloqueo guardado. No se ofrecerán citas contigo en ese periodo.' }
      );
      setIntento((n) => n + 1);
    } catch (err) {
      setEstadoBloqueo({ tipo: 'error', texto: err.message });
    }
  }

  async function eliminarBloqueo(id) {
    try {
      await eliminarBloqueoMedico(id, token);
      setConfirmandoEliminar(null);
      setIntento((n) => n + 1);
    } catch (err) {
      setEstadoBloqueo({ tipo: 'error', texto: err.message });
    }
  }

  const sedesEnUso = personalizado
    ? [...new Set(DIAS.filter(({ dia }) => semana[dia]?.activo && semana[dia].sedeId).map(({ dia }) => semana[dia].sedeId))]
        .map((id) => sedePorId.get(id))
        .filter(Boolean)
    : principal
      ? [principal]
      : [];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-6">
        <Tarjeta titulo="Horario semanal" subtitulo="Define qué días atiendes, en qué sede y en qué horario.">
          {!personalizado ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl bg-[#EEF6FD] p-4">
                <p className="text-sm font-semibold text-brand-navy">Usas el horario de tu sede{principal ? `: ${principal.nombre}` : ''}</p>
                {principal && (
                  <ul className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                    {DIAS.map(({ dia, nombre }) => {
                      const h = horarioSede(principal.id, dia);
                      return (
                        <li key={dia}>
                          <span className="font-medium text-slate-700">{nombre}:</span> {h ? `${hhmm(h.hora_inicio)} – ${hhmm(h.hora_fin)}` : 'Cerrado'}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={personalizar}
                className="self-start rounded-boton bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-600"
              >
                Personalizar mi horario
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {DIAS.map(({ dia, nombre }) => {
                const d = semana[dia];
                const abiertas = sedesAbiertas(dia);
                const atencion = d.sedeId ? horarioSede(d.sedeId, dia) : null;
                return (
                  <div key={dia} className={`rounded-xl p-3 ring-1 ${d.activo ? 'bg-white ring-slate-200' : 'bg-slate-50 ring-slate-100'}`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex w-32 items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={d.activo}
                          disabled={abiertas.length === 0}
                          onChange={(e) => {
                            const sede = abiertas.find((s) => s.id === d.sedeId) || abiertas.find((s) => s.id === datos.sedePrincipalId) || abiertas[0];
                            const h = sede ? horarioSede(sede.id, dia) : null;
                            cambiarDia(dia, {
                              activo: e.target.checked,
                              sedeId: d.sedeId || sede?.id || '',
                              horaInicio: d.horaInicio || (h ? hhmm(h.hora_inicio) : ''),
                              horaFin: d.horaFin || (h ? hhmm(h.hora_fin) : ''),
                            });
                          }}
                          className="h-4 w-4 accent-brand-blue"
                        />
                        {nombre}
                      </label>
                      {abiertas.length === 0 ? (
                        <span className="text-xs text-slate-400">Ninguna sede atiende este día</span>
                      ) : (
                        <>
                          <select
                            aria-label={`Sede del ${nombre}`}
                            value={d.sedeId}
                            disabled={!d.activo}
                            onChange={(e) => cambiarDia(dia, { sedeId: e.target.value })}
                            className={CLASE_CAMPO}
                          >
                            <option value="">Sede</option>
                            {abiertas.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.ciudad}
                              </option>
                            ))}
                          </select>
                          <input
                            type="time"
                            aria-label={`Hora de inicio del ${nombre}`}
                            value={d.horaInicio}
                            disabled={!d.activo}
                            onChange={(e) => cambiarDia(dia, { horaInicio: e.target.value })}
                            className={CLASE_CAMPO}
                          />
                          <span className="text-sm text-slate-400">a</span>
                          <input
                            type="time"
                            aria-label={`Hora de fin del ${nombre}`}
                            value={d.horaFin}
                            disabled={!d.activo}
                            onChange={(e) => cambiarDia(dia, { horaFin: e.target.value })}
                            className={CLASE_CAMPO}
                          />
                          {d.activo && !d.conPausa && (
                            <button
                              type="button"
                              onClick={() => cambiarDia(dia, { conPausa: true })}
                              className="text-xs font-semibold text-brand-blue hover:underline"
                            >
                              + Pausa
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    {d.activo && d.conPausa && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 pl-32 text-sm text-slate-600">
                        <span>Pausa</span>
                        <input
                          type="time"
                          aria-label={`Inicio de la pausa del ${nombre}`}
                          value={d.pausaInicio}
                          onChange={(e) => cambiarDia(dia, { pausaInicio: e.target.value })}
                          className={CLASE_CAMPO}
                        />
                        <span className="text-slate-400">a</span>
                        <input
                          type="time"
                          aria-label={`Fin de la pausa del ${nombre}`}
                          value={d.pausaFin}
                          onChange={(e) => cambiarDia(dia, { pausaFin: e.target.value })}
                          className={CLASE_CAMPO}
                        />
                        <button
                          type="button"
                          onClick={() => cambiarDia(dia, { conPausa: false, pausaInicio: '', pausaFin: '' })}
                          className="text-xs font-semibold text-slate-500 hover:underline"
                        >
                          Quitar pausa
                        </button>
                      </div>
                    )}
                    {d.activo && atencion && (
                      <p className="mt-1.5 pl-32 text-xs text-slate-400">
                        Horario de la sede ese día: {hhmm(atencion.hora_inicio)} – {hhmm(atencion.hora_fin)}
                      </p>
                    )}
                  </div>
                );
              })}
              <Mensaje estado={estadoHorario} />
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => guardarHorario([], 'Listo: vuelves a usar el horario de tu sede.')}
                  className="rounded-boton border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  Volver al horario de la sede
                </button>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={guardarSemana}
                  className="rounded-boton bg-brand-blue px-5 py-2 text-sm font-semibold text-white hover:bg-brand-blue-600 disabled:opacity-60"
                >
                  {guardando ? 'Guardando...' : 'Guardar horario'}
                </button>
              </div>
            </div>
          )}
          {!personalizado && <div className="mt-3"><Mensaje estado={estadoHorario} /></div>}
        </Tarjeta>

        <Tarjeta titulo="Bloqueos y excepciones" subtitulo="Vacaciones, permisos o horas puntuales en las que no atiendes.">
          <form onSubmit={agregarBloqueo} className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                Desde<span className="sr-only"> (fecha)</span>
                <input
                  type="date"
                  required
                  min={hoyComoFechaLocal()}
                  value={bloqueo.fechaInicio}
                  onChange={(e) => setBloqueo({ ...bloqueo, fechaInicio: e.target.value })}
                  className={CLASE_CAMPO}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                Hasta (opcional, un solo día si lo dejas vacío)
                <input
                  type="date"
                  min={bloqueo.fechaInicio || hoyComoFechaLocal()}
                  value={bloqueo.fechaFin}
                  onChange={(e) => setBloqueo({ ...bloqueo, fechaFin: e.target.value })}
                  className={CLASE_CAMPO}
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={bloqueo.soloHoras}
                onChange={(e) => setBloqueo({ ...bloqueo, soloHoras: e.target.checked })}
                className="h-4 w-4 accent-brand-blue"
              />
              Solo unas horas (no el día completo)
            </label>
            {bloqueo.soloHoras && (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  required
                  aria-label="Hora de inicio del bloqueo"
                  value={bloqueo.horaInicio}
                  onChange={(e) => setBloqueo({ ...bloqueo, horaInicio: e.target.value })}
                  className={CLASE_CAMPO}
                />
                <span className="text-sm text-slate-400">a</span>
                <input
                  type="time"
                  required
                  aria-label="Hora de fin del bloqueo"
                  value={bloqueo.horaFin}
                  onChange={(e) => setBloqueo({ ...bloqueo, horaFin: e.target.value })}
                  className={CLASE_CAMPO}
                />
              </div>
            )}
            <input
              maxLength={150}
              value={bloqueo.motivo}
              onChange={(e) => setBloqueo({ ...bloqueo, motivo: e.target.value })}
              placeholder="Motivo (opcional). Ej. Vacaciones, congreso, cita médica..."
              aria-label="Motivo del bloqueo"
              className={CLASE_CAMPO}
            />
            <Mensaje estado={estadoBloqueo} />
            <button type="submit" className="self-end rounded-boton bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-600">
              Agregar bloqueo
            </button>
          </form>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-700">Bloqueos vigentes</p>
            {datos.bloqueos.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">No tienes bloqueos programados.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {datos.bloqueos.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                    <IconoReloj className="h-4 w-4 shrink-0 text-brand-blue" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {b.fecha_inicio === b.fecha_fin ? fechaLegible(b.fecha_inicio) : `${fechaLegible(b.fecha_inicio)} – ${fechaLegible(b.fecha_fin)}`}
                        {b.hora_inicio ? ` · ${b.hora_inicio} – ${b.hora_fin}` : ' · Todo el día'}
                      </p>
                      {b.motivo && <p className="truncate text-xs text-slate-500">{b.motivo}</p>}
                    </div>
                    {confirmandoEliminar === b.id ? (
                      <span className="flex gap-2 text-xs">
                        <button type="button" onClick={() => eliminarBloqueo(b.id)} className="font-semibold text-brand-red hover:underline">
                          Sí, eliminar
                        </button>
                        <button type="button" onClick={() => setConfirmandoEliminar(null)} className="font-semibold text-slate-500 hover:underline">
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmandoEliminar(b.id)}
                        aria-label="Eliminar bloqueo"
                        className="rounded-boton p-1.5 text-slate-400 hover:bg-red-50 hover:text-brand-red"
                      >
                        <IconoPapelera className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Tarjeta>
      </div>

      <div className="flex flex-col gap-6">
        <Tarjeta titulo="Sedes en las que atiendes" subtitulo={personalizado ? 'Según tu horario semanal.' : 'Tu sede principal.'}>
          {sedesEnUso.length === 0 ? (
            <p className="text-sm text-slate-400">Sin sedes: marca al menos un día.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {sedesEnUso.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <IconoSede className="h-4 w-4 text-brand-blue" />
                  <span className="flex-1">{s.nombre}</span>
                  {s.id === datos.sedePrincipalId && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Principal</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
        <Tarjeta titulo="¿Cómo funciona?">
          <ul className="flex flex-col gap-2 text-sm text-slate-600">
            <li>Los pacientes solo pueden agendar contigo en los días y horas de tu horario.</li>
            <li>Tu horario debe estar dentro del horario de atención de cada sede.</li>
            <li>Durante una pausa o un bloqueo no se ofrecen citas contigo.</li>
            <li>Las citas que ya estaban agendadas no se mueven ni se cancelan solas.</li>
          </ul>
        </Tarjeta>
      </div>
    </div>
  );
}
