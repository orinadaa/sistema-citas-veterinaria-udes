// components/cliente/FormularioMascotaPanel.jsx
// SidePanel "Agregar mascota" / "Editar mascota" del cliente. Extraido
// de PanelMisMascotas.jsx para reutilizarlo tal cual en el flujo de
// agendamiento (tarjeta "+ Agregar mascota"): onGuardada recibe la
// mascota guardada, asi quien lo abre puede seleccionarla sin recargar.
// Sin foto real (sin infraestructura de upload) y especie/raza siguen
// siendo texto libre -- "Especie" es un select solo para agilizar la
// captura.
import { useState } from 'react';
import { crearMascota, actualizarMascota } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Campo } from '../form/Campo';
import { SidePanel } from '../ui/SidePanel';

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
  };
}

export function FormularioMascotaPanel({ isOpen, onClose, mascota = null, onGuardada }) {
  const { token } = useAuth();
  const [form, setForm] = useState(() => formDesdeMascota(mascota));
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Cada vez que se abre, arranca limpio (crear) o con los datos de la
  // mascota a editar. Se ajusta durante el render (patron recomendado
  // por React en vez de un useEffect que haria un render extra).
  const [aperturaPrevia, setAperturaPrevia] = useState({ isOpen, mascota });
  if (aperturaPrevia.isOpen !== isOpen || aperturaPrevia.mascota !== mascota) {
    setAperturaPrevia({ isOpen, mascota });
    if (isOpen) {
      setForm(formDesdeMascota(mascota));
      setError('');
    }
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
      const resultado = mascota
        ? await actualizarMascota(mascota.id, datos, token)
        : await crearMascota(datos, token);
      onGuardada(resultado.mascota);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={mascota ? 'Editar mascota' : 'Agregar mascota'}
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-mascota-cliente"
            disabled={guardando}
            className="flex-1 rounded-xl bg-brand-amber px-4 py-2 text-sm font-semibold text-brand-navy transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : 'Guardar mascota'}
          </button>
        </div>
      }
    >
      <form id="form-mascota-cliente" onSubmit={guardar} className="flex flex-col gap-4">
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
      </form>
    </SidePanel>
  );
}
