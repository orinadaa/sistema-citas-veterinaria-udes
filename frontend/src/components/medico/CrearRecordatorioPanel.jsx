// components/medico/CrearRecordatorioPanel.jsx
// SidePanel "Crear recordatorio" del medico, siempre para una mascota
// concreta (contexto arriba: foto, nombre, especie · raza y dueño).
// - 5 tipos seleccionables (medicacion, control, vacunacion,
//   desparasitacion, otro); el titulo se sugiere segun el tipo mientras
//   el medico no lo haya escrito a mano.
// - Fecha y hora futuras; descripcion opcional (max. 300).
// - Al guardar, el backend avisa al dueño por correo (decision de la
//   usuaria). Debajo se listan los recordatorios de esa mascota.
// onVerPerfil (opcional): enlace "Ver perfil" para volver al detalle
// del paciente.
import { useEffect, useState } from 'react';
import { crearRecordatorioMedico, obtenerRecordatoriosMascota } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { especieYRaza } from '../../utils/mascota';
import { SidePanel } from '../ui/SidePanel';
import { CampoFecha } from '../form/CampoFecha';
import { AvatarMascota } from '../cliente/AvatarMascota';
import { IconoCampana, IconoCheck, IconoDesparasitacion, IconoEstetoscopio, IconoJeringa, IconoPastilla } from '../icons';
import { CampoHora } from '../form/CampoHora';

const TIPOS = [
  { id: 'medicacion', titulo: 'Medicación', descripcion: 'Dosis o tratamiento', icono: IconoPastilla, sugerido: (n) => `Dar medicación a ${n}` },
  { id: 'control', titulo: 'Control', descripcion: 'Revisión o seguimiento', icono: IconoEstetoscopio, sugerido: (n) => `Control de ${n}` },
  { id: 'vacunacion', titulo: 'Vacunación', descripcion: 'Próxima vacuna o refuerzo', icono: IconoJeringa, sugerido: (n) => `Vacuna de ${n}` },
  { id: 'desparasitacion', titulo: 'Desparasitación', descripcion: 'Interna o externa', icono: IconoDesparasitacion, sugerido: (n) => `Desparasitación de ${n}` },
  { id: 'otro', titulo: 'Otro', descripcion: 'Cualquier otro aviso', icono: IconoCampana, sugerido: () => '' },
];
const ETIQUETA_TIPO = Object.fromEntries(TIPOS.map((t) => [t.id, t.titulo]));
const MAX_DESCRIPCION = 300;
const CLASE_CAMPO =
  'w-full campo px-3 py-2 text-sm';

const formatoFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
function fechaLegible(texto) {
  const [a, m, d] = texto.split('-').map(Number);
  return formatoFecha.format(new Date(a, m - 1, d));
}

export function CrearRecordatorioPanel({ mascota, nombreDueno, onClose, onVerPerfil }) {
  const { token } = useAuth();
  const [tipo, setTipo] = useState('');
  const [titulo, setTitulo] = useState('');
  const [tituloEditado, setTituloEditado] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [lista, setLista] = useState({ mascotaId: null, recordatorios: [] });
  const [recarga, setRecarga] = useState(0);

  // Al cambiar de mascota: formulario limpio.
  const [mascotaPrevia, setMascotaPrevia] = useState(mascota?.id);
  if (mascotaPrevia !== mascota?.id) {
    setMascotaPrevia(mascota?.id);
    setTipo('');
    setTitulo('');
    setTituloEditado(false);
    setDescripcion('');
    setFecha('');
    setHora('');
    setError('');
    setAviso('');
  }

  useEffect(() => {
    if (!mascota) return undefined;
    let vigente = true;
    obtenerRecordatoriosMascota(mascota.id, token)
      .then((datos) => vigente && setLista({ mascotaId: mascota.id, recordatorios: datos.recordatorios }))
      .catch(() => vigente && setLista({ mascotaId: mascota.id, recordatorios: [] }));
    return () => {
      vigente = false;
    };
  }, [mascota, token, recarga]);

  function elegirTipo(id) {
    setTipo(id);
    if (!tituloEditado) setTitulo(TIPOS.find((t) => t.id === id).sugerido(mascota.nombre));
  }

  async function guardar(evento) {
    evento.preventDefault();
    setError('');
    setAviso('');
    if (!tipo || !titulo.trim() || !fecha || !hora) {
      setError('Elige el tipo y completa título, fecha y hora.');
      return;
    }
    setGuardando(true);
    try {
      const respuesta = await crearRecordatorioMedico(
        { tipo, titulo: titulo.trim(), descripcion: descripcion.trim(), fecha, hora, mascotaId: mascota.id },
        token
      );
      setAviso(
        respuesta.correoEnviado
          ? `Recordatorio guardado. Le avisamos por correo a ${nombreDueno}.`
          : 'Recordatorio guardado, pero no se pudo enviar el correo al dueño.'
      );
      setTipo('');
      setTitulo('');
      setTituloEditado(false);
      setDescripcion('');
      setFecha('');
      setHora('');
      setRecarga((n) => n + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  const recordatorios = lista.mascotaId === mascota?.id ? lista.recordatorios : [];

  return (
    <SidePanel
      isOpen={Boolean(mascota)}
      onClose={onClose}
      title="Crear recordatorio"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-boton border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-recordatorio"
            disabled={guardando}
            className="flex-1 rounded-boton bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-700 disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : 'Guardar recordatorio'}
          </button>
        </div>
      }
    >
      {mascota && (
        <form id="form-recordatorio" onSubmit={guardar} className="flex flex-col gap-6">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <AvatarMascota mascota={mascota} className="h-12 w-12" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{mascota.nombre}</p>
              <p className="truncate text-sm text-slate-500">{especieYRaza(mascota)}</p>
              <p className="truncate text-xs text-slate-400">Dueño: {nombreDueno}</p>
            </div>
            {onVerPerfil && (
              <button type="button" onClick={onVerPerfil} className="shrink-0 text-sm font-semibold text-brand-blue-600 hover:underline">
                Ver perfil
              </button>
            )}
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-700">
              Tipo de recordatorio<span className="ml-0.5 text-red-500">*</span>
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {TIPOS.map((t) => {
                const elegido = tipo === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={elegido}
                    onClick={() => elegirTipo(t.id)}
                    className={`hover-ilumina relative flex items-start gap-2.5 rounded-xl p-3 text-left transition ${
                      elegido ? 'border-2 border-brand-blue bg-blue-50/40' : 'border-2 border-slate-200 hover:border-brand-blue-400'
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand-blue">
                      <t.icono className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 pr-4">
                      <span className="block text-sm font-semibold text-slate-900">{t.titulo}</span>
                      <span className="block text-xs text-slate-500">{t.descripcion}</span>
                    </span>
                    {elegido && (
                      <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-blue text-white">
                        <IconoCheck className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-slate-700">Información del recordatorio</p>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="titulo-recordatorio" className="text-sm font-medium text-slate-700">
                Título<span className="ml-0.5 text-red-500">*</span>
              </label>
              <input
                id="titulo-recordatorio"
                maxLength={120}
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  setTituloEditado(true);
                }}
                className={CLASE_CAMPO}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="descripcion-recordatorio" className="text-sm font-medium text-slate-700">
                Descripción (opcional)
              </label>
              <textarea
                id="descripcion-recordatorio"
                rows={3}
                maxLength={MAX_DESCRIPCION}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. Media tableta cada 12 horas durante 5 días."
                className={CLASE_CAMPO}
              />
              <p className="self-end text-xs text-slate-400">
                {descripcion.length}/{MAX_DESCRIPCION}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Sin minimo explicito: el calendario no deja elegir dias pasados. */}
              <CampoFecha id="fecha-recordatorio" etiqueta="Fecha" requerido valor={fecha} onChange={setFecha} />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="hora-recordatorio" className="text-sm font-medium text-slate-700">
                  Hora<span className="ml-0.5 text-red-500">*</span>
                </label>
                <CampoHora id="hora-recordatorio" value={hora} onChange={(e) => setHora(e.target.value)} className={CLASE_CAMPO} />
              </div>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</p>}
          {aviso && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">{aviso}</p>}

          <div className="border-t border-slate-100 pt-5">
            <p className="text-sm font-semibold text-slate-700">Recordatorios de {mascota.nombre}</p>
            {recordatorios.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">Todavía no tiene recordatorios.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {recordatorios.map((r) => (
                  <li key={r.id} className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                    <p className="text-sm font-medium text-slate-900">{r.titulo}</p>
                    <p className="text-xs text-slate-500">
                      {ETIQUETA_TIPO[r.tipo]} · {fechaLegible(r.fecha)}, {r.hora} · {r.medico_nombre}
                    </p>
                    {r.descripcion && <p className="mt-0.5 text-xs text-slate-500">{r.descripcion}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </form>
      )}
    </SidePanel>
  );
}
