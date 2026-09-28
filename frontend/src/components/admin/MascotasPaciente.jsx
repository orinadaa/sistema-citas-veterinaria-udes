// components/admin/MascotasPaciente.jsx
// Tab "Mascota(s)" del SidePanel "Detalle del paciente" (rol
// administrador). Distinto a proposito del lado del cliente:
// - Tarjeta por mascota (foto, especie · raza, sexo | edad · peso) con
//   menu de tres puntos: Editar (carga la mascota en el mismo
//   formulario de abajo) y Eliminar (confirmacion dentro de la tarjeta;
//   baja logica, 409 si tiene citas agendadas a futuro).
// - Formulario "Agregar mascota" embebido en el tab (no es otro panel),
//   con zona de foto cuadrada punteada (sube el archivo tal cual, sin
//   el editor circular del cliente), Sexo como segmented control
//   obligatorio en este formulario, y sin "Informacion medica" (no
//   aparece en la referencia de este modulo).
import { useEffect, useRef, useState } from 'react';
import { crearMascota, actualizarMascota, eliminarMascota, subirFotoMascota } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Campo } from '../form/Campo';
import { SelectorEspecieRaza } from '../form/SelectorEspecieRaza';
import { SelectorSexo } from '../form/SelectorSexo';
import { AvatarMascota } from '../cliente/AvatarMascota';
import { edadYPeso } from '../../utils/mascota';
import { IconoCamara, IconoLapiz, IconoMas, IconoPapelera, IconoPata, IconoPuntos } from '../icons';

const MAX_CARACTERISTICAS = 200;
const TAMANO_MAXIMO_FOTO = 5 * 1024 * 1024;
const TIPOS_FOTO = ['image/jpeg', 'image/png'];

const FORM_VACIO = {
  nombre: '',
  especie: '',
  raza: '',
  fechaNacimiento: '',
  sexo: '',
  pesoKg: '',
  color: '',
  caracteristicas: '',
};

function formDesdeMascota(m) {
  return {
    nombre: m.nombre,
    especie: m.especie || '',
    raza: m.raza || '',
    fechaNacimiento: m.fecha_nacimiento ? String(m.fecha_nacimiento).slice(0, 10) : '',
    sexo: m.sexo || '',
    pesoKg: m.peso_kg ?? '',
    color: m.color || '',
    caracteristicas: m.caracteristicas || '',
  };
}

function TarjetaMascota({ mascota, onEditar, onEliminada }) {
  const { token } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState('');
  const menu = useRef(null);

  // Cierra el menu al hacer clic fuera de el.
  useEffect(() => {
    if (!menuAbierto) return undefined;
    function alHacerClic(evento) {
      if (menu.current && !menu.current.contains(evento.target)) setMenuAbierto(false);
    }
    document.addEventListener('mousedown', alHacerClic);
    return () => document.removeEventListener('mousedown', alHacerClic);
  }, [menuAbierto]);

  async function eliminar() {
    setEliminando(true);
    setError('');
    try {
      await eliminarMascota(mascota.id, token);
      onEliminada(mascota);
    } catch (err) {
      setError(err.message);
      setEliminando(false);
    }
  }

  const detalle = edadYPeso(mascota);

  return (
    <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <div className="flex items-center gap-3">
        <AvatarMascota mascota={mascota} className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{mascota.nombre}</p>
          <p className="truncate text-sm text-slate-500">{[mascota.especie, mascota.raza].filter(Boolean).join(' · ')}</p>
          {(mascota.sexo || detalle) && (
            <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
              {mascota.sexo && (
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden="true" className={mascota.sexo === 'hembra' ? 'text-pink-500' : 'text-brand-blue'}>
                    {mascota.sexo === 'hembra' ? '♀' : '♂'}
                  </span>
                  {mascota.sexo === 'hembra' ? 'Hembra' : 'Macho'}
                </span>
              )}
              {mascota.sexo && detalle && <span aria-hidden="true" className="h-3 w-px bg-slate-300" />}
              {detalle && <span>{detalle}</span>}
            </p>
          )}
        </div>

        <div className="relative" ref={menu}>
          <button
            type="button"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            aria-label={`Acciones para ${mascota.nombre}`}
            aria-expanded={menuAbierto}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
          >
            <IconoPuntos className="h-5 w-5" />
          </button>
          {menuAbierto && (
            <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-lg bg-white py-1 shadow-lg ring-1 ring-slate-200">
              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false);
                  onEditar(mascota);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <IconoLapiz className="h-4 w-4" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false);
                  setConfirmando(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-brand-red hover:bg-red-50"
              >
                <IconoPapelera className="h-4 w-4" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      {confirmando && (
        <div className="mt-3 rounded-lg bg-red-50 p-3 ring-1 ring-red-200">
          <p className="text-sm font-medium text-red-800">¿Eliminar a {mascota.nombre}? Sus citas pasadas se conservan.</p>
          {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={eliminar}
              disabled={eliminando}
              className="rounded-lg bg-brand-red px-3 py-1.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-60"
            >
              {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmando(false);
                setError('');
              }}
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function MascotasPaciente({ clienteId, mascotas, onCambio }) {
  const { token } = useAuth();
  const [form, setForm] = useState(FORM_VACIO);
  const [mascotaEditando, setMascotaEditando] = useState(null);
  const [foto, setFoto] = useState(null); // File elegido, pendiente de subir
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);
  const inputFoto = useRef(null);
  const formulario = useRef(null);

  // Libera la URL temporal de la vista previa cuando cambia.
  useEffect(() => () => vistaPrevia && URL.revokeObjectURL(vistaPrevia), [vistaPrevia]);

  function actualizar(campo) {
    return (evento) => setForm((actual) => ({ ...actual, [campo]: evento.target.value }));
  }

  function limpiar() {
    setForm(FORM_VACIO);
    setMascotaEditando(null);
    setFoto(null);
    setVistaPrevia(null);
    setError('');
  }

  function editar(mascota) {
    limpiar();
    setAviso('');
    setMascotaEditando(mascota);
    setForm(formDesdeMascota(mascota));
    formulario.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function elegirFoto(archivo) {
    setError('');
    if (!archivo) return;
    if (!TIPOS_FOTO.includes(archivo.type)) {
      setError('La foto debe ser JPG o PNG.');
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_FOTO) {
      setError('La foto no puede pesar más de 5 MB.');
      return;
    }
    setFoto(archivo);
    setVistaPrevia(URL.createObjectURL(archivo));
  }

  async function guardar(evento) {
    evento.preventDefault();
    setError('');
    setAviso('');
    if (!form.nombre.trim() || !form.especie || !form.raza.trim() || !form.sexo) {
      setError('Nombre, especie, raza y sexo son obligatorios.');
      return;
    }

    const datos = {
      nombre: form.nombre.trim(),
      especie: form.especie,
      raza: form.raza.trim(),
      fechaNacimiento: form.fechaNacimiento || null,
      sexo: form.sexo,
      pesoKg: form.pesoKg || null,
      color: form.color.trim(),
      caracteristicas: form.caracteristicas.trim(),
    };

    setGuardando(true);
    let guardada;
    try {
      guardada = mascotaEditando
        ? (await actualizarMascota(mascotaEditando.id, datos, token)).mascota
        : (await crearMascota({ ...datos, clienteId }, token)).mascota;
    } catch (err) {
      setError(err.message);
      setGuardando(false);
      return;
    }

    let mensaje = mascotaEditando ? `${guardada.nombre} se actualizó.` : `${guardada.nombre} se agregó.`;
    if (foto) {
      try {
        await subirFotoMascota(guardada.id, foto, token);
      } catch (err) {
        mensaje = `${guardada.nombre} se guardó, pero la foto no se pudo subir: ${err.message}`;
      }
    }
    setGuardando(false);
    limpiar();
    setAviso(mensaje);
    onCambio();
  }

  const fotoMostrada = vistaPrevia || mascotaEditando?.foto_url || null;

  return (
    <div className="flex flex-col gap-5">
      {mascotas.length === 0 ? (
        <p className="text-sm text-slate-400">Sin mascotas registradas todavía.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {mascotas.map((m) => (
            <TarjetaMascota
              key={m.id}
              mascota={m}
              onEditar={editar}
              onEliminada={(eliminada) => {
                if (mascotaEditando?.id === eliminada.id) limpiar();
                setAviso(`${eliminada.nombre} se eliminó.`);
                onCambio();
              }}
            />
          ))}
        </div>
      )}

      {aviso && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-brand-green ring-1 ring-emerald-200">{aviso}</p>}

      <form ref={formulario} onSubmit={guardar} className="flex scroll-mt-4 flex-col gap-4 border-t border-slate-100 pt-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white">
            {mascotaEditando ? <IconoLapiz className="h-4 w-4" /> : <IconoMas className="h-5 w-5" />}
          </span>
          <div>
            <p className="font-heading font-semibold text-brand-navy">
              {mascotaEditando ? `Editar a ${mascotaEditando.nombre}` : 'Agregar mascota'}
            </p>
            <p className="text-sm text-slate-500">Completa la información de tu mascota.</p>
          </div>
        </div>

        <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-4">
          {/* Zona de foto: caja cuadrada punteada (distinta al circulo del cliente) */}
          <div>
            <button
              type="button"
              onClick={() => inputFoto.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                elegirFoto(e.dataTransfer.files?.[0]);
              }}
              className="flex aspect-square w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-2 text-center transition hover:border-brand-blue"
            >
              {fotoMostrada ? (
                <img src={fotoMostrada} alt="Foto de la mascota" className="h-full w-full rounded-lg object-cover" />
              ) : (
                <>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-brand-blue">
                    <IconoCamara className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold leading-tight text-slate-700">Sube una foto de tu mascota</span>
                  <span className="text-[11px] text-slate-400">JPG, PNG. Máx. 5 MB.</span>
                </>
              )}
            </button>
            {fotoMostrada && (
              <button
                type="button"
                onClick={() => inputFoto.current?.click()}
                className="mt-1 w-full text-center text-xs font-medium text-brand-blue hover:underline"
              >
                Cambiar foto
              </button>
            )}
            <input
              ref={inputFoto}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                elegirFoto(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <Campo id="admin-mascota-nombre" label="Nombre" value={form.nombre} onChange={actualizar('nombre')} placeholder="Ej. Luna" required />
            <SelectorEspecieRaza
              idPrefijo="admin-mascota"
              className="flex flex-col gap-3"
              iconoEspecie={IconoPata}
              especie={form.especie}
              raza={form.raza}
              onChange={({ especie, raza }) => setForm((actual) => ({ ...actual, especie, raza }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo
            id="admin-mascota-nacimiento"
            label="Fecha de nacimiento (opcional)"
            type="date"
            value={form.fechaNacimiento}
            onChange={actualizar('fechaNacimiento')}
          />
          <SelectorSexo
            id="admin-mascota-sexo"
            requerido
            valor={form.sexo}
            onChange={(sexo) => setForm((actual) => ({ ...actual, sexo }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-mascota-peso" className="text-sm font-medium text-slate-700">
              Peso (kg) (opcional)
            </label>
            <div className="relative">
              <input
                id="admin-mascota-peso"
                type="number"
                min="0"
                step="0.1"
                value={form.pesoKg}
                onChange={actualizar('pesoKg')}
                className="w-full rounded-lg border border-slate-300 py-2 pl-3 pr-9 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">kg</span>
            </div>
          </div>
          <Campo
            id="admin-mascota-color"
            label="Color (opcional)"
            value={form.color}
            onChange={actualizar('color')}
            placeholder="Ej. Blanco, negro, café"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="admin-mascota-caracteristicas" className="text-sm font-medium text-slate-700">
            Características especiales (opcional)
          </label>
          <textarea
            id="admin-mascota-caracteristicas"
            rows={3}
            maxLength={MAX_CARACTERISTICAS}
            value={form.caracteristicas}
            onChange={actualizar('caracteristicas')}
            placeholder="Ej. Muy cariñosa, alérgica a ciertos alimentos, etc."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          />
          <p className="self-end text-xs text-slate-400">
            {form.caracteristicas.length}/{MAX_CARACTERISTICAS}
          </p>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              limpiar();
              setAviso('');
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconoPata className="h-4 w-4" />
            {guardando ? 'Guardando...' : mascotaEditando ? 'Guardar cambios' : 'Agregar mascota'}
          </button>
        </div>
      </form>
    </div>
  );
}
