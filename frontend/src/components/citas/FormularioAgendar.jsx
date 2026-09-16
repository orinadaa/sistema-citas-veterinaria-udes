// components/citas/FormularioAgendar.jsx
// RF-06: agendar una cita en línea indicando la sede.
import { useEffect, useState } from 'react';
import { obtenerSedes, agendarCita } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Campo } from '../form/Campo';
import { SelectorFranjas } from './SelectorFranjas';

export function FormularioAgendar({ onAgendada }) {
  const { token } = useAuth();
  const [sedes, setSedes] = useState([]);
  const [sedeId, setSedeId] = useState('');
  const [franja, setFranja] = useState(null);
  const [nombreMascota, setNombreMascota] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    obtenerSedes().then((datos) => setSedes(datos.sedes));
  }, []);

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setError('');

    if (!sedeId || !franja || !nombreMascota) {
      setError('Selecciona una sede, una franja y escribe el nombre de tu mascota.');
      return;
    }

    setEnviando(true);
    try {
      await agendarCita({ sedeId, fechaHora: franja, nombreMascota, motivo }, token);
      setSedeId('');
      setFranja(null);
      setNombreMascota('');
      setMotivo('');
      onAgendada();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviarFormulario} className="flex flex-col gap-5">
      <div>
        <label htmlFor="sede-cita" className="text-sm font-medium text-slate-700">
          Sede
        </label>
        <select
          id="sede-cita"
          value={sedeId}
          onChange={(evento) => {
            setSedeId(evento.target.value);
            setFranja(null);
          }}
          className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 sm:w-72"
        >
          <option value="">Selecciona una sede</option>
          {sedes.map((sede) => (
            <option key={sede.id} value={sede.id}>
              {sede.ciudad}
            </option>
          ))}
        </select>
      </div>

      <SelectorFranjas sedeId={sedeId} valorSeleccionado={franja} onSeleccionar={setFranja} />

      <Campo
        id="nombreMascota"
        label="Nombre de tu mascota"
        value={nombreMascota}
        onChange={(evento) => setNombreMascota(evento.target.value)}
        required
      />
      <Campo
        id="motivo"
        label="Motivo de la consulta (opcional)"
        value={motivo}
        onChange={(evento) => setMotivo(evento.target.value)}
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="self-start rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? 'Agendando...' : 'Agendar cita'}
      </button>
    </form>
  );
}
