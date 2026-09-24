// components/citas/FormularioAgendar.jsx
// RF-06: agendar una cita en línea indicando sede, servicio, franja y
// médico.
import { useEffect, useState } from 'react';
import { obtenerSedes, obtenerServicios, agendarCita } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Campo } from '../form/Campo';
import { SelectorFranjas } from './SelectorFranjas';
import { SelectorMedico } from './SelectorMedico';
import { MascotaSelector } from './MascotaSelector';

export function FormularioAgendar({ onAgendada, servicioIdInicial }) {
  const { token } = useAuth();
  const [sedes, setSedes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [sedeId, setSedeId] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [franja, setFranja] = useState(null);
  const [medicoId, setMedicoId] = useState('');
  const [mascotaId, setMascotaId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    obtenerSedes().then((datos) => setSedes(datos.sedes));
    obtenerServicios().then((datos) => {
      setServicios(datos.servicios);
      // Preseleccion desde el landing (boton de una tarjeta de
      // servicio): solo si el id sigue existiendo entre los activos.
      if (servicioIdInicial && datos.servicios.some((s) => s.id === servicioIdInicial)) {
        setServicioId(servicioIdInicial);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setError('');

    if (!sedeId || !servicioId || !franja || !medicoId || !mascotaId) {
      setError('Completa sede, servicio, franja, médico y la mascota.');
      return;
    }

    setEnviando(true);
    try {
      await agendarCita(
        { sedeId, servicioId, medicoId, fechaHora: franja, mascotaId, motivo },
        token
      );
      setSedeId('');
      setServicioId('');
      setFranja(null);
      setMedicoId('');
      setMascotaId('');
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
      <div className="grid gap-5 sm:grid-cols-2">
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
              setMedicoId('');
            }}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">Selecciona una sede</option>
            {sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.ciudad}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="servicio-cita" className="text-sm font-medium text-slate-700">
            Tipo de servicio
          </label>
          <select
            id="servicio-cita"
            value={servicioId}
            onChange={(evento) => {
              setServicioId(evento.target.value);
              setFranja(null);
              setMedicoId('');
            }}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">Selecciona un servicio</option>
            {servicios.map((servicio) => (
              <option key={servicio.id} value={servicio.id}>
                {servicio.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <SelectorFranjas
        sedeId={sedeId}
        servicioId={servicioId}
        valorSeleccionado={franja}
        onSeleccionar={(valor) => {
          setFranja(valor);
          setMedicoId('');
        }}
      />

      <SelectorMedico
        sedeId={sedeId}
        servicioId={servicioId}
        fechaHora={franja}
        valorSeleccionado={medicoId}
        onSeleccionar={setMedicoId}
      />

      <MascotaSelector valorSeleccionado={mascotaId} onSeleccionar={setMascotaId} />

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
