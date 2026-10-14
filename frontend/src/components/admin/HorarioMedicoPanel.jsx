// components/admin/HorarioMedicoPanel.jsx
// Medicos > Horario: el administrador de la sede define el horario de trabajo
// de cada medico.
import { useEffect, useState } from 'react';
import {
  crearBloqueoDeMedico,
  eliminarBloqueoDeMedico,
  guardarHorarioDeMedico,
  obtenerDisponibilidadDeMedico,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { hoyComoFechaLocal } from '../../utils/fecha';
import { SidePanel } from '../ui/SidePanel';
import { EstadoError } from '../ui/EstadoError';
import { CampoFecha } from '../form/CampoFecha';
import { CampoHora } from '../form/CampoHora';
import { IconoPapelera, IconoReloj } from '../icons';
import { EditorHorarioMedico } from './EditorHorarioMedico';
import { problemaDelDia } from '../../utils/horarioMedico';

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
const CLASE_CAMPO = 'campo px-2.5 py-1.5 text-sm';
const BLOQUEO_VACIO = { fechaInicio: '', fechaFin: '', soloHoras: false, horaInicio: '', horaFin: '', motivo: '' };

const hhmm = (hora) => String(hora).slice(0, 5);
const formatoFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
function fechaLegible(texto) {
  const [a, m, d] = texto.split('-').map(Number);
  return formatoFecha.format(new Date(a, m - 1, d));
}

function Mensaje({ estado }) {
  if (!estado?.texto) return null;
  const clases = {
    ok: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    alerta: 'bg-amber-50 text-amber-800 ring-amber-200',
    error: 'bg-red-50 text-red-700 ring-red-200',
  };
  return (
    <p role="status" className={`rounded-lg px-3 py-2 text-sm ring-1 ${clases[estado.tipo]}`}>
      {estado.texto}
    </p>
  );
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
              horaInicio: hhmm(h.hora_inicio),
              horaFin: hhmm(h.hora_fin),
              conPausa: Boolean(h.pausa_inicio),
              pausaInicio: h.pausa_inicio ? hhmm(h.pausa_inicio) : '',
              pausaFin: h.pausa_fin ? hhmm(h.pausa_fin) : '',
            }
          : { activo: false, horaInicio: '', horaFin: '', conPausa: false, pausaInicio: '', pausaFin: '' },
      ];
    })
  );
}

// medico: { id, nombre_completo } o null (panel cerrado).
export function HorarioMedicoPanel({ medico, onClose }) {
  const { token } = useAuth();
  const medicoId = medico?.id;
  const [datos, setDatos] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [intento, setIntento] = useState(0);

  const [personalizado, setPersonalizado] = useState(false);
  const [semana, setSemana] = useState({});
  const [estadoHorario, setEstadoHorario] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [bloqueo, setBloqueo] = useState(BLOQUEO_VACIO);
  const [estadoBloqueo, setEstadoBloqueo] = useState(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null);

  // Al abrir con otro medico se parte de cero (ajuste durante el render,
  // sin efecto: asi no se pinta un instante el horario del medico anterior).
  const [medicoMostrado, setMedicoMostrado] = useState(medicoId);
  if (medicoId && medicoId !== medicoMostrado) {
    setMedicoMostrado(medicoId);
    setDatos(null);
    setErrorCarga('');
    setEstadoHorario(null);
    setEstadoBloqueo(null);
    setBloqueo(BLOQUEO_VACIO);
    setConfirmandoEliminar(null);
  }

  useEffect(() => {
    if (!medicoId) return undefined;
    let vigente = true;
    obtenerDisponibilidadDeMedico(medicoId, token)
      .then((d) => {
        if (!vigente) return;
        setDatos(d);
        setPersonalizado(d.horario.length > 0);
        setSemana(semanaDesde(d.horario));
      })
      .catch((err) => vigente && setErrorCarga(err.message || 'No se pudo cargar el horario del médico.'));
    return () => {
      vigente = false;
    };
  }, [medicoId, token, intento]);

  const sede = datos?.sedes.find((s) => s.id === datos.sedePrincipalId);
  const atencionDe = (dia) => sede?.horario.find((h) => h.dia_semana === dia);

  // Los siete dias con el horario de atencion de la sede en cada uno.
  const diasEditor = DIAS.map(({ dia, nombre }) => {
    const h = atencionDe(dia);
    return { dia, nombre, atencion: h ? { inicio: hhmm(h.hora_inicio), fin: hhmm(h.hora_fin) } : null };
  });

  function cambiarDia(dia, cambios) {
    setSemana((s) => ({ ...s, [dia]: { ...s[dia], ...cambios } }));
    setEstadoHorario(null);
  }

  // Al personalizar se parte del horario de atencion de la sede.
  function personalizar() {
    const base = semanaDesde([]);
    DIAS.forEach(({ dia }) => {
      const h = atencionDe(dia);
      if (h) base[dia] = { ...base[dia], activo: true, horaInicio: hhmm(h.hora_inicio), horaFin: hhmm(h.hora_fin) };
    });
    setSemana(base);
    setPersonalizado(true);
    setEstadoHorario(null);
  }

  async function guardarHorario(dias, mensajeOk) {
    setGuardando(true);
    setEstadoHorario(null);
    try {
      const { horario } = await guardarHorarioDeMedico(medicoId, dias, token);
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
    // Un dia en que la sede no abre no cuenta aunque hubiera quedado marcado.
    const conProblema = diasEditor.find((d) => problemaDelDia(semana[d.dia], d.atencion));
    if (conProblema) {
      setEstadoHorario({ tipo: 'error', texto: `Revisa el ${conProblema.nombre.toLowerCase()}: ${problemaDelDia(semana[conProblema.dia], conProblema.atencion)}` });
      return;
    }
    const dias = diasEditor
      .filter(({ dia, atencion }) => atencion && semana[dia]?.activo)
      .map(({ dia }) => {
      const d = semana[dia];
      return {
        diaSemana: dia,
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
    guardarHorario(dias, 'Horario guardado. La agenda del médico ya usa este horario.');
  }

  async function agregarBloqueo(evento) {
    evento.preventDefault();
    setEstadoBloqueo(null);
    if (!bloqueo.fechaInicio) {
      setEstadoBloqueo({ tipo: 'error', texto: 'Elige desde qué fecha aplica el bloqueo.' });
      return;
    }
    if (bloqueo.soloHoras && (!bloqueo.horaInicio || !bloqueo.horaFin)) {
      setEstadoBloqueo({ tipo: 'error', texto: 'Elige la hora de inicio y la de fin del bloqueo.' });
      return;
    }
    try {
      const { citasAfectadas } = await crearBloqueoDeMedico(
        medicoId,
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
              texto: `Bloqueo guardado. El médico tiene ${citasAfectadas} ${citasAfectadas === 1 ? 'cita agendada' : 'citas agendadas'} en esas fechas; no se cancelan automáticamente.`,
            }
          : { tipo: 'ok', texto: 'Bloqueo guardado. No se ofrecerán citas con el médico en ese periodo.' }
      );
      setIntento((n) => n + 1);
    } catch (err) {
      setEstadoBloqueo({ tipo: 'error', texto: err.message });
    }
  }

  async function eliminarBloqueo(id) {
    try {
      await eliminarBloqueoDeMedico(medicoId, id, token);
      setConfirmandoEliminar(null);
      setIntento((n) => n + 1);
    } catch (err) {
      setEstadoBloqueo({ tipo: 'error', texto: err.message });
    }
  }

  return (
    <SidePanel
      isOpen={Boolean(medico)}
      onClose={onClose}
      title={medico ? `Horario de ${medico.nombre_completo}` : 'Horario del médico'}
      footer={
        datos && personalizado ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={guardando}
              onClick={() => guardarHorario([], 'Listo: el médico vuelve a atender con el horario de la sede.')}
              className="boton-texto rounded-boton px-1 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
            >
              Usar el horario de la sede
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={guardarSemana}
              className="rounded-boton bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-700 disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Guardar horario'}
            </button>
          </div>
        ) : null
      }
    >
      {errorCarga ? (
        <EstadoError
          mensaje={errorCarga}
          onReintentar={() => {
            setErrorCarga('');
            setIntento((n) => n + 1);
          }}
        />
      ) : !datos ? (
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      ) : (
        <div className="flex flex-col gap-7">
          <section className="flex flex-col gap-3">
            <div>
              <h3 className="font-heading text-base font-semibold text-brand-navy">Horario semanal</h3>
              <p className="mt-0.5 text-sm text-slate-600">
                Días y horas en que atiende{sede ? ` en ${sede.nombre}` : ''}. El médico lo ve en su perfil, pero no lo puede cambiar.
              </p>
            </div>

            {!personalizado ? (
              <>
                <div className="rounded-xl bg-[#EEF6FD] p-4">
                  <p className="text-sm font-semibold text-brand-navy">Atiende con el horario de la sede</p>
                  <ul className="mt-2 grid grid-cols-[minmax(0,1fr)] gap-1 text-sm text-slate-700 sm:grid-cols-2">
                    {DIAS.map(({ dia, nombre }) => {
                      const h = atencionDe(dia);
                      return (
                        <li key={dia}>
                          <span className="font-medium text-slate-800">{nombre}:</span> {h ? `${hhmm(h.hora_inicio)} – ${hhmm(h.hora_fin)}` : 'Cerrado'}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <Mensaje estado={estadoHorario} />
                <button
                  type="button"
                  onClick={personalizar}
                  className="self-start rounded-boton bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-700"
                >
                  Definir un horario propio
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-700">
                  Elige un día y ajusta sus horas en el reloj. Los cambios de toda la semana se guardan juntos con «Guardar horario».
                </p>
                <EditorHorarioMedico key={medicoId} dias={diasEditor} semana={semana} onCambiar={cambiarDia} />
                <Mensaje estado={estadoHorario} />
              </>
            )}
          </section>

          <section className="flex flex-col gap-3 border-t border-slate-900/10 pt-6">
            <div>
              <h3 className="font-heading text-base font-semibold text-brand-navy">Bloqueos y excepciones</h3>
              <p className="mt-0.5 text-sm text-slate-600">Vacaciones, permisos u horas puntuales en las que el médico no atiende.</p>
            </div>

            <form onSubmit={agregarBloqueo} className="flex flex-col gap-3">
              <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
                {/* Cambiar "Desde" a un dia posterior al "Hasta" elegido lo borra. */}
                <CampoFecha
                  id="bloqueo-medico-desde"
                  etiqueta="Desde"
                  requerido
                  valor={bloqueo.fechaInicio}
                  minimo={hoyComoFechaLocal()}
                  onChange={(fechaInicio) =>
                    setBloqueo({ ...bloqueo, fechaInicio, fechaFin: bloqueo.fechaFin && bloqueo.fechaFin < fechaInicio ? '' : bloqueo.fechaFin })
                  }
                />
                <CampoFecha
                  id="bloqueo-medico-hasta"
                  etiqueta="Hasta (opcional)"
                  alinear="derecha"
                  valor={bloqueo.fechaFin}
                  onChange={(fechaFin) => setBloqueo({ ...bloqueo, fechaFin })}
                  minimo={bloqueo.fechaInicio || hoyComoFechaLocal()}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={bloqueo.soloHoras}
                  onChange={(e) => setBloqueo({ ...bloqueo, soloHoras: e.target.checked })}
                  className="casilla"
                />
                Solo unas horas (no el día completo)
              </label>
              {bloqueo.soloHoras && (
                <div className="flex items-center gap-2">
                  <CampoHora
                    aria-label="Hora de inicio del bloqueo"
                    value={bloqueo.horaInicio}
                    onChange={(e) => setBloqueo({ ...bloqueo, horaInicio: e.target.value })}
                    className={CLASE_CAMPO}
                  />
                  <span className="text-sm text-slate-600">a</span>
                  <CampoHora
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
                placeholder="Motivo (opcional). Ej. Vacaciones, congreso..."
                aria-label="Motivo del bloqueo"
                className="campo px-3 py-2 text-sm"
              />
              <Mensaje estado={estadoBloqueo} />
              <button
                type="submit"
                className="self-end rounded-boton border border-brand-blue px-4 py-2 text-sm font-semibold text-brand-blue-700 transition hover:bg-blue-50"
              >
                Agregar bloqueo
              </button>
            </form>

            <div>
              <p className="text-sm font-semibold text-slate-800">Bloqueos vigentes</p>
              {datos.bloqueos.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">No hay bloqueos programados.</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2">
                  {datos.bloqueos.map((b) => (
                    <li key={b.id} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                      <IconoReloj className="h-4 w-4 shrink-0 text-brand-blue" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800">
                          {b.fecha_inicio === b.fecha_fin ? fechaLegible(b.fecha_inicio) : `${fechaLegible(b.fecha_inicio)} – ${fechaLegible(b.fecha_fin)}`}
                          {b.hora_inicio ? ` · ${b.hora_inicio} – ${b.hora_fin}` : ' · Todo el día'}
                        </p>
                        {b.motivo && <p className="truncate text-xs text-slate-600">{b.motivo}</p>}
                      </div>
                      {confirmandoEliminar === b.id ? (
                        <span className="flex gap-3 text-xs">
                          <button type="button" onClick={() => eliminarBloqueo(b.id)} className="boton-texto font-semibold text-red-700">
                            Sí, eliminar
                          </button>
                          <button type="button" onClick={() => setConfirmandoEliminar(null)} className="boton-texto font-semibold text-slate-700">
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmandoEliminar(b.id)}
                          aria-label="Eliminar bloqueo"
                          className="boton-texto rounded-boton p-1.5 text-slate-600 hover:text-red-700"
                        >
                          <IconoPapelera className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </SidePanel>
  );
}
