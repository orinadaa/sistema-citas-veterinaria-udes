// components/cliente/PanelMisMascotas.jsx
// Pestaña "Mis mascotas" del panel del cliente (cierra RF-14): antes
// solo se podia agregar una mascota de forma inline al agendar una
// cita (MascotaSelector.jsx); aqui se pueden ver todas y editarlas.
// Sin foto real (misma razon que medicos/sedes: sin infraestructura de
// upload) y sin catalogo de razas por especie (especie/raza siguen
// siendo texto libre, decision ya tomada en el incremento de mascotas
// -- "Especie" es un select con opciones comunes solo para agilizar la
// captura, pero se guarda como el mismo texto libre de siempre).
import { useEffect, useState } from 'react';
import { obtenerMisMascotas, crearMascota, actualizarMascota } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Campo } from '../form/Campo';
import { SidePanel } from '../ui/SidePanel';
import { EstadoError } from '../ui/EstadoError';
import { IconoPata, IconoLapiz } from '../icons';

const ESPECIES = ['Canino', 'Felino', 'Ave', 'Otro'];

const FORM_VACIO = {
  nombre: '',
  especie: '',
  raza: '',
  fechaNacimiento: '',
  sexo: '',
  color: '',
  pesoKg: '',
  caracteristicas: '',
};

export function PanelMisMascotas() {
  const { token } = useAuth();
  const [mascotas, setMascotas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [mascotaEditando, setMascotaEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    setCargando(true);
    setErrorCarga('');
    obtenerMisMascotas(token)
      .then((datos) => setMascotas(datos.mascotas))
      .catch((err) => setErrorCarga(err.message || 'No se pudieron cargar tus mascotas.'))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [token]);

  function abrirCrear() {
    setMascotaEditando(null);
    setForm(FORM_VACIO);
    setError('');
    setPanelAbierto(true);
  }

  function abrirEditar(mascota) {
    setMascotaEditando(mascota);
    setForm({
      nombre: mascota.nombre,
      especie: mascota.especie || '',
      raza: mascota.raza || '',
      fechaNacimiento: mascota.fecha_nacimiento ? String(mascota.fecha_nacimiento).slice(0, 10) : '',
      sexo: mascota.sexo || '',
      color: mascota.color || '',
      pesoKg: mascota.peso_kg ?? '',
      caracteristicas: mascota.caracteristicas || '',
    });
    setError('');
    setPanelAbierto(true);
  }

  async function guardar(evento) {
    evento.preventDefault();
    setError('');
    if (!form.nombre) {
      setError('El nombre es obligatorio.');
      return;
    }

    setGuardando(true);
    const datos = {
      nombre: form.nombre,
      especie: form.especie || null,
      raza: form.raza || null,
      fechaNacimiento: form.fechaNacimiento || null,
      sexo: form.sexo || null,
      color: form.color || null,
      pesoKg: form.pesoKg || null,
      caracteristicas: form.caracteristicas || null,
    };

    try {
      if (mascotaEditando) {
        await actualizarMascota(mascotaEditando.id, datos, token);
      } else {
        await crearMascota(datos, token);
      }
      setPanelAbierto(false);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-brand-navy">Mis mascotas</h2>
          <p className="text-sm text-slate-500">Registra y edita la información de tus mascotas.</p>
        </div>
        <button
          type="button"
          onClick={abrirCrear}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-amber px-4 py-2.5 text-sm font-semibold text-brand-navy shadow-sm transition hover:brightness-95"
        >
          + Agregar mascota
        </button>
      </div>

      {cargando ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((clave) => (
            <div key={clave} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : errorCarga ? (
        <EstadoError mensaje={errorCarga} onReintentar={cargar} />
      ) : mascotas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Aún no has registrado mascotas.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {mascotas.map((mascota) => (
            <div
              key={mascota.id}
              className="flex items-start justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50 text-brand-amber">
                  <IconoPata className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{mascota.nombre}</p>
                  <p className="text-sm text-slate-500">
                    {[mascota.especie, mascota.raza].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
                  </p>
                  {mascota.peso_kg && <p className="text-xs text-slate-400">{mascota.peso_kg} kg</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => abrirEditar(mascota)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <IconoLapiz className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <SidePanel
        isOpen={panelAbierto}
        onClose={() => setPanelAbierto(false)}
        title={mascotaEditando ? 'Editar mascota' : 'Agregar mascota'}
      >
        <form onSubmit={guardar} className="flex flex-col gap-4">
          <Campo
            id="nombre-mascota-cliente"
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="especie-mascota-cliente" className="text-sm font-medium text-slate-700">
              Especie
            </label>
            <select
              id="especie-mascota-cliente"
              value={form.especie}
              onChange={(e) => setForm({ ...form, especie: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="">Selecciona una especie</option>
              {ESPECIES.map((especie) => (
                <option key={especie} value={especie}>
                  {especie}
                </option>
              ))}
            </select>
          </div>

          <Campo
            id="raza-mascota-cliente"
            label="Raza (opcional)"
            value={form.raza}
            onChange={(e) => setForm({ ...form, raza: e.target.value })}
          />

          <Campo
            id="fecha-nacimiento-mascota-cliente"
            label="Fecha de nacimiento (opcional)"
            type="date"
            value={form.fechaNacimiento}
            onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sexo-mascota-cliente" className="text-sm font-medium text-slate-700">
              Sexo (opcional)
            </label>
            <select
              id="sexo-mascota-cliente"
              value={form.sexo}
              onChange={(e) => setForm({ ...form, sexo: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            >
              <option value="">Selecciona</option>
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </div>

          <Campo
            id="color-mascota-cliente"
            label="Color (opcional)"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
          />

          <Campo
            id="peso-mascota-cliente"
            label="Peso en kg (opcional)"
            type="number"
            min="0"
            step="0.1"
            value={form.pesoKg}
            onChange={(e) => setForm({ ...form, pesoKg: e.target.value })}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="caracteristicas-mascota-cliente" className="text-sm font-medium text-slate-700">
              Características especiales (opcional)
            </label>
            <textarea
              id="caracteristicas-mascota-cliente"
              rows={3}
              value={form.caracteristicas}
              onChange={(e) => setForm({ ...form, caracteristicas: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPanelAbierto(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 rounded-xl bg-brand-amber px-4 py-2 text-sm font-semibold text-brand-navy transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Guardar mascota'}
            </button>
          </div>
        </form>
      </SidePanel>
    </div>
  );
}
