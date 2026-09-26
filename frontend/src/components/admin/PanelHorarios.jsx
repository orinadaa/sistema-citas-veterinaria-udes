// components/admin/PanelHorarios.jsx
// RF-13: gestion de sedes (perfil, activa/inactiva) y su horario de
// atencion por dia. Cualquier administrador puede gestionar cualquier
// sede (ver database/incremento_3d_sedes_perfil.sql).
import { useEffect, useMemo, useState } from 'react';
import {
  obtenerSedesAdmin,
  crearSede,
  actualizarSede,
  obtenerHorarios,
  actualizarHorario,
  cerrarDiaHorario,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Campo } from '../form/Campo';
import { PageHeader } from '../ui/PageHeader';
import { StatusToggle } from '../ui/StatusToggle';
import { DataTable } from '../ui/DataTable';
import { SidePanel } from '../ui/SidePanel';
import { EstadoError } from '../ui/EstadoError';
import { IconoSede } from '../icons';

const DIAS = [
  { numero: 1, letra: 'L', nombre: 'Lunes' },
  { numero: 2, letra: 'M', nombre: 'Martes' },
  { numero: 3, letra: 'M', nombre: 'Miércoles' },
  { numero: 4, letra: 'J', nombre: 'Jueves' },
  { numero: 5, letra: 'V', nombre: 'Viernes' },
  { numero: 6, letra: 'S', nombre: 'Sábado' },
  { numero: 0, letra: 'D', nombre: 'Domingo' },
];

const FORM_VACIO = { nombre: '', ciudad: '', direccion: '', fotoUrl: '', activo: true };

function formatoInput(hora) {
  return hora ? hora.slice(0, 5) : '';
}

function diasVacios() {
  return DIAS.map((d) => ({ ...d, abierto: false, horaInicio: '08:00', horaFin: '17:00' }));
}

function resumenHorario(dias) {
  const abiertos = dias.filter((d) => d.abierto);
  if (abiertos.length === 0) return 'Cerrado toda la semana';
  const inicio = abiertos.reduce((min, d) => (d.horaInicio < min ? d.horaInicio : min), abiertos[0].horaInicio);
  const fin = abiertos.reduce((max, d) => (d.horaFin > max ? d.horaFin : max), abiertos[0].horaFin);
  return `${inicio} – ${fin}`;
}

export function PanelHorarios() {
  const { token } = useAuth();
  const [sedes, setSedes] = useState([]);
  const [horariosPorSede, setHorariosPorSede] = useState({});
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [sedeEditando, setSedeEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [diasHorario, setDiasHorario] = useState(diasVacios());
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardandoDia, setGuardandoDia] = useState(null);

  function cargar() {
    setCargando(true);
    setErrorCarga('');
    obtenerSedesAdmin(token)
      .then(async (datos) => {
        setSedes(datos.sedes);
        const entradas = await Promise.all(
          datos.sedes.map((sede) => obtenerHorarios(sede.id).then((h) => [sede.id, h.horario]))
        );
        setHorariosPorSede(Object.fromEntries(entradas));
      })
      .catch((err) => setErrorCarga(err.message || 'No se pudieron cargar las sedes.'))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [token]);

  function diasDeSede(sedeId) {
    const horario = horariosPorSede[sedeId] || [];
    return DIAS.map((d) => {
      const encontrado = horario.find((h) => h.dia_semana === d.numero);
      return encontrado
        ? { ...d, abierto: true, horaInicio: formatoInput(encontrado.hora_inicio), horaFin: formatoInput(encontrado.hora_fin) }
        : { ...d, abierto: false, horaInicio: '08:00', horaFin: '17:00' };
    });
  }

  function abrirCrear() {
    setSedeEditando(null);
    setForm(FORM_VACIO);
    setDiasHorario(diasVacios());
    setError('');
    setPanelAbierto(true);
  }

  function abrirEditar(sede) {
    setSedeEditando(sede);
    setForm({
      nombre: sede.nombre,
      ciudad: sede.ciudad,
      direccion: sede.direccion || '',
      fotoUrl: sede.foto_url || '',
      activo: sede.activo,
    });
    setDiasHorario(diasDeSede(sede.id));
    setError('');
    setPanelAbierto(true);
  }

  async function guardarSede(evento) {
    evento.preventDefault();
    setError('');
    if (!form.nombre || !form.ciudad) {
      setError('El nombre y la ciudad son obligatorios.');
      return;
    }

    setGuardando(true);
    try {
      if (sedeEditando) {
        await actualizarSede(sedeEditando.id, form, token);
        cargar();
      } else {
        const resultado = await crearSede(form, token);
        setSedeEditando(resultado.sede);
        setDiasHorario(diasVacios());
        cargar();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function alternarActivaDesdeElPanel(valor) {
    setForm((f) => ({ ...f, activo: valor }));
    if (sedeEditando) {
      await actualizarSede(sedeEditando.id, { activo: valor }, token);
      cargar();
    }
  }

  async function guardarDia(dia) {
    if (!sedeEditando) return;
    setGuardandoDia(dia.numero);
    setError('');
    try {
      await actualizarHorario(
        { sedeId: sedeEditando.id, diaSemana: dia.numero, horaInicio: dia.horaInicio, horaFin: dia.horaFin },
        token
      );
      setDiasHorario((anterior) => anterior.map((d) => (d.numero === dia.numero ? { ...d, abierto: true } : d)));
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardandoDia(null);
    }
  }

  async function cerrarDia(dia) {
    if (!sedeEditando) return;
    setGuardandoDia(dia.numero);
    setError('');
    try {
      await cerrarDiaHorario(sedeEditando.id, dia.numero, token);
      setDiasHorario((anterior) => anterior.map((d) => (d.numero === dia.numero ? { ...d, abierto: false } : d)));
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardandoDia(null);
    }
  }

  const sedesConResumen = useMemo(
    () =>
      sedes.map((sede) => ({
        ...sede,
        _diasResumen: diasDeSede(sede.id),
      })),
    [sedes, horariosPorSede]
  );

  return (
    <>
    <div className="flex flex-col gap-6" inert={panelAbierto} aria-hidden={panelAbierto}>
      <PageHeader title="Sedes y horarios" subtitle="Gestiona las sedes de la clínica y su horario de atención." actionLabel="Nueva sede" onAction={abrirCrear} />

      {cargando ? (
        <div className="flex flex-col gap-2">
          {[0, 1].map((clave) => (
            <div key={clave} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : errorCarga ? (
        <EstadoError mensaje={errorCarga} onReintentar={cargar} />
      ) : (
        <DataTable
          filaVacia="No hay sedes registradas todavía."
          columns={[
            {
              header: 'Sede',
              render: (sede) => (
                <div className="flex items-center gap-3">
                  {sede.foto_url ? (
                    <img src={sede.foto_url} alt={sede.nombre} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
                      <IconoSede className="h-4 w-4" />
                    </span>
                  )}
                  <div>
                    <p className="font-medium text-slate-900">{sede.nombre}</p>
                    <p className="text-xs text-slate-400">{sede.direccion || sede.ciudad}</p>
                  </div>
                </div>
              ),
            },
            {
              header: 'Días',
              render: (sede) => (
                <div className="flex gap-1">
                  {sede._diasResumen.map((d) => (
                    <span
                      key={d.numero}
                      title={d.nombre}
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
                        d.abierto ? 'bg-brand-green/15 text-brand-green' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {d.letra}
                    </span>
                  ))}
                </div>
              ),
            },
            { header: 'Horario', render: (sede) => <span className="text-sm text-slate-600">{resumenHorario(sede._diasResumen)}</span> },
            {
              header: 'Estado',
              render: (sede) => (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    sede.activo ? 'bg-emerald-50 text-brand-green' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {sede.activo ? 'Activa' : 'Inactiva'}
                </span>
              ),
            },
          ]}
          rows={sedesConResumen}
          actions={(sede) => (
            <button
              type="button"
              onClick={() => abrirEditar(sede)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-blue transition hover:bg-blue-50"
            >
              Editar
            </button>
          )}
        />
      )}

    </div>

    <SidePanel
      isOpen={panelAbierto}
      onClose={() => setPanelAbierto(false)}
      title={sedeEditando ? 'Editar sede' : 'Nueva sede'}
      footer={
        <button
          type="submit"
          form="form-sede"
          disabled={guardando}
          className="w-full rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
        >
          {guardando ? 'Guardando...' : sedeEditando ? 'Guardar cambios' : 'Crear sede'}
        </button>
      }
    >
        <form id="form-sede" onSubmit={guardarSede} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {form.fotoUrl ? (
              <img src={form.fotoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
                <IconoSede className="h-6 w-6" />
              </span>
            )}
            <div className="flex-1">
              <Campo id="foto-sede" label="URL de la foto (opcional)" value={form.fotoUrl} onChange={(e) => setForm({ ...form, fotoUrl: e.target.value })} placeholder="https://..." />
            </div>
          </div>

          <Campo id="nombre-sede" label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          <Campo id="ciudad-sede" label="Ciudad" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} required />
          <Campo id="direccion-sede" label="Dirección" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />

          <StatusToggle checked={form.activo} onChange={alternarActivaDesdeElPanel} label="Sede activa" helpText="Si se desactiva, no aparecerá disponible para agendar citas." />

          {error && <p className="text-sm text-red-600">{error}</p>}

          {sedeEditando ? (
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-700">Horario de atención</p>
              {diasHorario.map((dia) => (
                <div key={dia.numero} className="flex flex-wrap items-center gap-2">
                  <span className="w-24 shrink-0 text-sm text-slate-600">{dia.nombre}</span>
                  {dia.abierto ? (
                    <>
                      <input
                        type="time"
                        value={dia.horaInicio}
                        onChange={(e) =>
                          setDiasHorario((anterior) => anterior.map((d) => (d.numero === dia.numero ? { ...d, horaInicio: e.target.value } : d)))
                        }
                        className="rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-brand-blue focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">a</span>
                      <input
                        type="time"
                        value={dia.horaFin}
                        onChange={(e) =>
                          setDiasHorario((anterior) => anterior.map((d) => (d.numero === dia.numero ? { ...d, horaFin: e.target.value } : d)))
                        }
                        className="rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-brand-blue focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={guardandoDia === dia.numero}
                        onClick={() => guardarDia(dia)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-brand-blue transition hover:bg-blue-50 disabled:opacity-60"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        disabled={guardandoDia === dia.numero}
                        onClick={() => cerrarDia(dia)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-brand-red transition hover:bg-red-50 disabled:opacity-60"
                      >
                        Cerrar
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={guardandoDia === dia.numero}
                      onClick={() => guardarDia(dia)}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-brand-blue transition hover:bg-blue-50 disabled:opacity-60"
                    >
                      Abrir 08:00–17:00
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Guarda la sede primero para configurar su horario de atención.</p>
          )}
        </form>
    </SidePanel>
    </>
  );
}
