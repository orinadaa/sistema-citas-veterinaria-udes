// components/cliente/FormularioMascotaPanel.jsx
// SidePanel "Agregar mascota" / "Editar mascota" del cliente. Se
// reutiliza en "Mis mascotas" y en el flujo de agendamiento (tarjeta
// "+ Agregar mascota"): onGuardada recibe la mascota guardada, asi quien
// lo abre puede seleccionarla sin recargar.
//
// - Foto circular arriba con boton de camara -> FotoMascotaModal (el
//   unico modal centrado del sistema). La foto recortada queda pendiente
//   y se sube al guardar (POST /api/mascotas/:id/foto), asi "Cancelar"
//   no deja fotos a medias.
// - Obligatorios: nombre, especie y raza (lista segun la especie,
//   SelectorEspecieRaza). Sexo, nacimiento, color y peso son opcionales.
// - "Informacion medica (opcional)": texto libre que informa el dueño
//   (alergias, medicamentos, condiciones, observaciones). No es
//   historial clinico: sin registros por fecha ni diagnosticos.
import { useEffect, useState } from 'react';
import { crearMascota, actualizarMascota, eliminarMascota, subirFotoMascota } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Campo } from '../form/Campo';
import { SelectorEspecieRaza } from '../form/SelectorEspecieRaza';
import { Boton, PanelLateral } from '../vetui';
import { AvatarMascota } from './AvatarMascota';
import { FotoMascotaModal } from './FotoMascotaModal';
import { IconoCamara, IconoPapelera } from '../icons';

const FORM_VACIO = {
  nombre: '',
  especie: '',
  raza: '',
  fechaNacimiento: '',
  sexo: '',
  color: '',
  pesoKg: '',
  caracteristicas: '',
  alergias: '',
  medicamentos: '',
  condicionesMedicas: '',
  observaciones: '',
};

function formDesdeMascota(mascota) {
  if (!mascota) return FORM_VACIO;
  return {
    nombre: mascota.nombre,
    especie: mascota.especie || '',
    raza: mascota.raza || '',
    fechaNacimiento: mascota.fecha_nacimiento ? String(mascota.fecha_nacimiento).slice(0, 10) : '',
    sexo: mascota.sexo || '',
    color: mascota.color || '',
    pesoKg: mascota.peso_kg ?? '',
    caracteristicas: mascota.caracteristicas || '',
    alergias: mascota.alergias || '',
    medicamentos: mascota.medicamentos || '',
    condicionesMedicas: mascota.condiciones_medicas || '',
    observaciones: mascota.observaciones || '',
  };
}

const CLASE_TEXTAREA =
  'rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30';

function AreaTexto({ id, label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea id={id} rows={2} value={value} onChange={onChange} placeholder={placeholder} className={CLASE_TEXTAREA} />
    </div>
  );
}

// onEliminada (opcional): si se pasa y se esta editando, aparece
// "Eliminar mascota" con confirmacion dentro del mismo panel (nunca un
// window.confirm). Es una baja logica en el backend: las citas pasadas
// conservan la mascota. confirmarAlAbrir abre el panel directo en esa
// confirmacion (boton de papelera de la tarjeta en Mis mascotas).
// fotosAnteriores: fotos de las otras mascotas del cliente, para
// elegirlas rapido en el editor de foto.
export function FormularioMascotaPanel({
  isOpen,
  onClose,
  mascota = null,
  onGuardada,
  onEliminada,
  confirmarAlAbrir = false,
  fotosAnteriores = [],
}) {
  const { token } = useAuth();
  const [form, setForm] = useState(() => formDesdeMascota(mascota));
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  // Foto recortada pendiente de subir (Blob) y su URL de vista previa.
  const [fotoPendiente, setFotoPendiente] = useState(null);
  const [vistaPreviaFoto, setVistaPreviaFoto] = useState(null);
  const [editorFotoAbierto, setEditorFotoAbierto] = useState(false);

  // Cada vez que se abre, arranca limpio (crear) o con los datos de la
  // mascota a editar. Se ajusta durante el render (patron recomendado
  // por React en vez de un useEffect que haria un render extra).
  const [aperturaPrevia, setAperturaPrevia] = useState({ isOpen, mascota, confirmarAlAbrir });
  if (aperturaPrevia.isOpen !== isOpen || aperturaPrevia.mascota !== mascota || aperturaPrevia.confirmarAlAbrir !== confirmarAlAbrir) {
    setAperturaPrevia({ isOpen, mascota, confirmarAlAbrir });
    if (isOpen) {
      setForm(formDesdeMascota(mascota));
      setError('');
      setErrorEliminar('');
      setConfirmandoEliminar(Boolean(mascota && confirmarAlAbrir));
      setFotoPendiente(null);
      setVistaPreviaFoto(null);
      setEditorFotoAbierto(false);
    }
  }

  // Libera la URL temporal de la vista previa cuando cambia.
  useEffect(() => () => vistaPreviaFoto && URL.revokeObjectURL(vistaPreviaFoto), [vistaPreviaFoto]);

  function actualizar(campo) {
    return (evento) => setForm((actual) => ({ ...actual, [campo]: evento.target.value }));
  }

  async function eliminar() {
    setEliminando(true);
    setErrorEliminar('');
    try {
      await eliminarMascota(mascota.id, token);
      onEliminada(mascota);
    } catch (err) {
      // ej. 409: tiene citas agendadas a futuro
      setErrorEliminar(err.message);
    } finally {
      setEliminando(false);
    }
  }

  async function guardar(evento) {
    evento.preventDefault();
    setError('');
    if (!form.nombre.trim() || !form.especie || !form.raza.trim()) {
      setError('Nombre, especie y raza son obligatorios.');
      return;
    }

    setGuardando(true);
    // Los textos opcionales se mandan como texto (aunque vacio) para que
    // al editar se puedan borrar; los demas opcionales vacios van null.
    const datos = {
      nombre: form.nombre.trim(),
      especie: form.especie,
      raza: form.raza.trim(),
      fechaNacimiento: form.fechaNacimiento || null,
      sexo: form.sexo || null,
      color: form.color.trim(),
      pesoKg: form.pesoKg || null,
      caracteristicas: form.caracteristicas.trim(),
      alergias: form.alergias.trim(),
      medicamentos: form.medicamentos.trim(),
      condicionesMedicas: form.condicionesMedicas.trim(),
      observaciones: form.observaciones.trim(),
    };

    let guardada;
    try {
      const resultado = mascota ? await actualizarMascota(mascota.id, datos, token) : await crearMascota(datos, token);
      guardada = resultado.mascota;
    } catch (err) {
      setError(err.message);
      setGuardando(false);
      return;
    }

    // La mascota ya quedo guardada: si la foto falla, se avisa pero no se
    // pierde lo demas (quien abrio el panel muestra el aviso).
    let avisoFoto = '';
    if (fotoPendiente) {
      try {
        guardada = (await subirFotoMascota(guardada.id, fotoPendiente, token)).mascota;
      } catch (err) {
        avisoFoto = `${guardada.nombre} se guardó, pero la foto no se pudo subir: ${err.message}`;
      }
    }
    setGuardando(false);
    onGuardada(guardada, { avisoFoto });
  }

  const fotoMostrada = vistaPreviaFoto || mascota?.foto_url || null;

  return (
    <>
      <PanelLateral
        isOpen={isOpen}
        // Con el editor de foto abierto, Escape/clic afuera solo cierran el editor.
        onClose={() => !editorFotoAbierto && onClose()}
        title={mascota ? 'Editar mascota' : 'Agregar mascota'}
        footer={
          <div className="flex gap-3">
            <Boton variante="contorno" onClick={onClose}>
              Cancelar
            </Boton>
            <Boton type="submit" form="form-mascota-cliente" disabled={guardando} className="flex-1">
              {guardando ? 'Guardando...' : 'Guardar mascota'}
            </Boton>
          </div>
        }
      >
        <form id="form-mascota-cliente" onSubmit={guardar} className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2 pb-2">
            <div className="relative">
              <AvatarMascota mascota={mascota} fotoUrl={fotoMostrada} className="h-32 w-32 shadow-lg ring-4 ring-white" iconoClassName="h-14 w-14" />
              <button
                type="button"
                onClick={() => setEditorFotoAbierto(true)}
                aria-label="Cambiar foto de la mascota"
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-boton bg-brand-blue text-white shadow-md ring-4 ring-white transition hover:bg-brand-blue-600"
              >
                <IconoCamara className="h-4.5 w-4.5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">{fotoPendiente ? 'Foto nueva: se guardará con la mascota' : 'Foto (opcional)'}</p>
          </div>

          <Campo id="nombre-mascota-cliente" label="Nombre" value={form.nombre} onChange={actualizar('nombre')} required />

          <SelectorEspecieRaza
            idPrefijo="mascota-cliente"
            especie={form.especie}
            raza={form.raza}
            onChange={({ especie, raza }) => setForm((actual) => ({ ...actual, especie, raza }))}
          />

          <Campo
            id="fecha-nacimiento-mascota-cliente"
            label="Fecha de nacimiento (opcional)"
            type="date"
            value={form.fechaNacimiento}
            onChange={actualizar('fechaNacimiento')}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sexo-mascota-cliente" className="text-sm font-medium text-slate-700">
              Sexo (opcional)
            </label>
            <select id="sexo-mascota-cliente" value={form.sexo} onChange={actualizar('sexo')} className={CLASE_TEXTAREA}>
              <option value="">Selecciona</option>
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Campo id="color-mascota-cliente" label="Color (opcional)" value={form.color} onChange={actualizar('color')} />
            <Campo
              id="peso-mascota-cliente"
              label="Peso en kg (opcional)"
              type="number"
              min="0"
              step="0.1"
              value={form.pesoKg}
              onChange={actualizar('pesoKg')}
            />
          </div>

          <AreaTexto
            id="caracteristicas-mascota-cliente"
            label="Características especiales (opcional)"
            value={form.caracteristicas}
            onChange={actualizar('caracteristicas')}
          />

          <fieldset className="mt-2 flex flex-col gap-4 border-t border-slate-100 pt-4">
            <legend className="sr-only">Información médica</legend>
            <div>
              <p className="font-heading text-sm font-semibold text-brand-navy">Información médica (opcional)</p>
              <p className="text-xs text-slate-400">Lo que quieras que el equipo veterinario sepa antes de atender a tu mascota.</p>
            </div>
            <AreaTexto id="alergias-mascota" label="Alergias" value={form.alergias} onChange={actualizar('alergias')} placeholder="Ej. Alergia al pollo" />
            <AreaTexto
              id="medicamentos-mascota"
              label="Medicamentos"
              value={form.medicamentos}
              onChange={actualizar('medicamentos')}
              placeholder="Ej. Apoquel 16 mg cada 24 horas"
            />
            <AreaTexto
              id="condiciones-mascota"
              label="Condiciones médicas"
              value={form.condicionesMedicas}
              onChange={actualizar('condicionesMedicas')}
              placeholder="Ej. Displasia de cadera"
            />
            <AreaTexto id="observaciones-mascota" label="Observaciones" value={form.observaciones} onChange={actualizar('observaciones')} />
          </fieldset>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</p>}

          {mascota && onEliminada && (
            <div className="mt-2 border-t border-slate-100 pt-4">
              {confirmandoEliminar ? (
                <div className="rounded-xl bg-red-50 p-4 ring-1 ring-red-200">
                  <p className="text-sm font-semibold text-red-800">¿Eliminar a {mascota.nombre}?</p>
                  <p className="mt-1 text-sm text-red-700">
                    Ya no aparecerá en tus mascotas ni podrás agendarle citas. Sus citas pasadas se conservan en tu historial.
                  </p>
                  {errorEliminar && <p className="mt-2 text-sm font-medium text-red-800">{errorEliminar}</p>}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={eliminar}
                      disabled={eliminando}
                      className="rounded-boton bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
                    >
                      {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmandoEliminar(false);
                        setErrorEliminar('');
                      }}
                      className="rounded-boton border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmandoEliminar(true)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red transition hover:underline"
                >
                  <IconoPapelera className="h-4 w-4" />
                  Eliminar mascota
                </button>
              )}
            </div>
          )}
        </form>
      </PanelLateral>

      {/* Fuera del SidePanel: el panel usa transform, y un ancestro con
          transform encerraria el position:fixed del modal dentro de el. */}
      <FotoMascotaModal
        isOpen={isOpen && editorFotoAbierto}
        onClose={() => setEditorFotoAbierto(false)}
        fotoActual={fotoMostrada}
        fotosAnteriores={fotosAnteriores.filter((url) => url && url !== mascota?.foto_url)}
        onGuardar={(blob) => {
          setFotoPendiente(blob);
          setVistaPreviaFoto(URL.createObjectURL(blob));
          setEditorFotoAbierto(false);
        }}
      />
    </>
  );
}
