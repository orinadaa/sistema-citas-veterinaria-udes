// components/cliente/FormularioMascotaPanel.jsx
// SidePanel "Agregar mascota" / "Editar mascota" del cliente. Se
// reutiliza en "Mis mascotas" y en el flujo de agendamiento (tarjeta
// "+ Agregar mascota"): onGuardada recibe la mascota guardada, asi quien
// lo abre puede seleccionarla sin recargar.
//
// - Foto: zona circular punteada (ZonaFoto, la misma del admin).
//   El clic abre FotoMascotaModal (el unico modal centrado del sistema),
//   que valida JPG/PNG de max. 5 MB y recorta. La foto recortada queda pendiente
//   y se sube al guardar (POST /api/mascotas/:id/foto), asi "Cancelar"
//   no deja fotos a medias.
// - Obligatorios: nombre, especie y raza (lista segun la especie,
//   SelectorEspecieRaza). Sexo (SelectorSexo, botones Hembra / Macho como
//   en el admin), nacimiento, color y peso son opcionales.
// - "Informacion medica (opcional)": texto libre que informa el dueño
//   (alergias, medicamentos, condiciones, observaciones). No es
//   historial clinico: sin registros por fecha ni diagnosticos.
import { useEffect, useState } from 'react';
import { crearMascota, actualizarMascota, eliminarMascota, subirFotoMascota } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { hoyComoFechaLocal } from '../../utils/fecha';
import { Campo } from '../form/Campo';
import { SelectorEspecieRaza } from '../form/SelectorEspecieRaza';
import { CamposAdicionales } from '../form/CamposAdicionales';
import { useCamposAdicionales } from '../../hooks/useCamposAdicionales';
import { SelectorSexo } from '../form/SelectorSexo';
import { CampoFecha } from '../form/CampoFecha';
import { ZonaFoto } from '../form/ZonaFoto';
import { Boton, PanelLateral } from '../vetui';
import { FotoMascotaModal } from './FotoMascotaModal';
import { IconoPapelera } from '../icons';

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
  'campo px-3 py-2 text-sm';

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
// "Eliminar" vive en el pie fijo del panel, en el extremo izquierdo: asi
// siempre esta a la vista (antes quedaba al final del formulario y habia
// que bajar para encontrarlo) pero separado de "Guardar mascota", que va
// a la derecha junto a "Cancelar", para que no se toque por error. Es una
// accion secundaria en rojo, sin relleno: no compite con la principal.
// La confirmacion reemplaza al pie en el mismo lugar (nunca un
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
  // Campos personalizados que el administrador definio para la mascota.
  const campos = useCamposAdicionales('mascota');
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
      campos.reiniciar(mascota);
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
    const faltaAdicional = campos.errorObligatorios();
    if (faltaAdicional) {
      setError(faltaAdicional);
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
      camposAdicionales: campos.valoresParaEnviar(),
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
    // Adjuntos de los campos personalizados de tipo archivo: mismo criterio.
    const avisoArchivos = await campos.guardarArchivos(guardada.id);
    if (avisoArchivos) avisoFoto = [avisoFoto, `${guardada.nombre} se guardó. ${avisoArchivos}`].filter(Boolean).join(' ');
    setGuardando(false);
    onGuardada(guardada, { avisoFoto });
  }

  const fotoMostrada = vistaPreviaFoto || mascota?.foto_url || null;
  const puedeEliminar = Boolean(mascota && onEliminada);

  return (
    <>
      <PanelLateral
        isOpen={isOpen}
        // Con el editor de foto abierto, Escape/clic afuera solo cierran el editor.
        onClose={() => !editorFotoAbierto && onClose()}
        title={mascota ? 'Editar mascota' : 'Agregar mascota'}
        footer={
          confirmandoEliminar && puedeEliminar ? (
            <div role="alertdialog" aria-labelledby="titulo-eliminar-mascota" aria-describedby="detalle-eliminar-mascota">
              <p id="titulo-eliminar-mascota" className="text-sm font-semibold text-red-800">
                ¿Eliminar a {mascota.nombre}?
              </p>
              <p id="detalle-eliminar-mascota" className="mt-1 text-sm text-slate-700">
                Ya no aparecerá en tus mascotas ni podrás agendarle citas. Sus citas pasadas se conservan en tu historial.
              </p>
              {errorEliminar && (
                <p role="alert" className="mt-2 text-sm font-medium text-red-800">
                  {errorEliminar}
                </p>
              )}
              <div className="mt-3 flex flex-wrap justify-end gap-3">
                <Boton
                  variante="contorno"
                  disabled={eliminando}
                  onClick={() => {
                    setConfirmandoEliminar(false);
                    setErrorEliminar('');
                  }}
                >
                  No, conservar
                </Boton>
                <button
                  type="button"
                  onClick={eliminar}
                  disabled={eliminando}
                  className="rounded-boton bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
                >
                  {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {puedeEliminar && (
                <button
                  type="button"
                  onClick={() => setConfirmandoEliminar(true)}
                  aria-label={`Eliminar a ${mascota.nombre}`}
                  className="mr-auto inline-flex items-center gap-1.5 boton-texto rounded-boton px-3 py-2 text-sm font-semibold text-brand-red transition"
                >
                  <IconoPapelera className="h-4 w-4" />
                  Eliminar
                </button>
              )}
              <Boton variante="contorno" onClick={onClose}>
                Cancelar
              </Boton>
              <Boton type="submit" form="form-mascota-cliente" disabled={guardando} className={puedeEliminar ? '' : 'flex-1'}>
                {guardando ? 'Guardando...' : 'Guardar mascota'}
              </Boton>
            </div>
          )
        }
      >
        <form id="form-mascota-cliente" onSubmit={guardar} className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2 pb-2">
            <ZonaFoto fotoUrl={fotoMostrada} onClick={() => setEditorFotoAbierto(true)} className="w-40" />
            <p className="text-xs text-slate-600">{fotoPendiente ? 'Foto nueva: se guardará con la mascota' : 'Foto (opcional)'}</p>
          </div>

          <Campo id="nombre-mascota-cliente" label="Nombre" value={form.nombre} onChange={actualizar('nombre')} required />

          <SelectorEspecieRaza
            idPrefijo="mascota-cliente"
            especie={form.especie}
            raza={form.raza}
            onChange={({ especie, raza }) => setForm((actual) => ({ ...actual, especie, raza }))}
          />

          <CampoFecha
            id="fecha-nacimiento-mascota-cliente"
            etiqueta="Fecha de nacimiento (opcional)"
            valor={form.fechaNacimiento}
            onChange={(fechaNacimiento) => setForm((actual) => ({ ...actual, fechaNacimiento }))}
            minimo={null}
            maximo={hoyComoFechaLocal()}
          />

          <SelectorSexo
            id="sexo-mascota-cliente"
            etiqueta="Sexo (opcional)"
            valor={form.sexo}
            onChange={(sexo) => setForm((actual) => ({ ...actual, sexo }))}
          />

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

          <CamposAdicionales campos={campos} idPrefijo="mascota-cliente-extra" />

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</p>}

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
