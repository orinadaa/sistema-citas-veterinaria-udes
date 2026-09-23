// components/citas/MascotaSelector.jsx
// Selector de mascota para agendar una cita. Si se pasa `clienteId`,
// funciona en modo "administrador" (mascotas de ese cliente, crea
// indicando clienteId); si no, funciona en modo "cliente propio"
// (mascotas del usuario autenticado). Incluye "+ nueva mascota" inline
// para no obligar a salir del flujo de agendamiento.
import { useEffect, useState } from 'react';
import { obtenerMisMascotas, obtenerMascotasDeCliente, crearMascota } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Campo } from '../form/Campo';
import { IconoAlerta } from '../icons';

const ESTADOS = { CARGANDO: 'cargando', LISTO: 'listo', ERROR: 'error' };

export function MascotaSelector({ clienteId, valorSeleccionado, onSeleccionar }) {
  const { token } = useAuth();
  const modoAdmin = clienteId !== undefined;

  const [mascotas, setMascotas] = useState([]);
  const [estado, setEstado] = useState(ESTADOS.CARGANDO);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [nombreNueva, setNombreNueva] = useState('');
  const [especieNueva, setEspecieNueva] = useState('');
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');

  function cargar() {
    if (modoAdmin && !clienteId) {
      setMascotas([]);
      setEstado(ESTADOS.LISTO);
      return;
    }
    setEstado(ESTADOS.CARGANDO);
    const solicitud = modoAdmin ? obtenerMascotasDeCliente(clienteId, token) : obtenerMisMascotas(token);
    solicitud
      .then((datos) => {
        setMascotas(datos.mascotas);
        setEstado(ESTADOS.LISTO);
      })
      .catch(() => setEstado(ESTADOS.ERROR));
  }

  useEffect(cargar, [clienteId, modoAdmin, token]);

  async function crear(evento) {
    evento.preventDefault();
    setError('');
    if (!nombreNueva) {
      setError('El nombre de la mascota es obligatorio.');
      return;
    }

    setCreando(true);
    try {
      const cuerpo = { nombre: nombreNueva, especie: especieNueva };
      if (modoAdmin) cuerpo.clienteId = clienteId;

      const { mascota } = await crearMascota(cuerpo, token);
      setMascotas((anteriores) => [...anteriores, mascota]);
      onSeleccionar(mascota.id);
      setMostrarNueva(false);
      setNombreNueva('');
      setEspecieNueva('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreando(false);
    }
  }

  if (modoAdmin && !clienteId) {
    return <p className="text-sm text-slate-500">Selecciona primero un cliente.</p>;
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-700">Mascota</p>

      {estado === ESTADOS.CARGANDO && (
        <div className="mt-2 flex flex-col gap-2">
          {[0, 1].map((clave) => (
            <div key={clave} className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      )}

      {estado === ESTADOS.ERROR && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
          <IconoAlerta className="h-4 w-4 shrink-0" />
          No pudimos cargar las mascotas.
        </div>
      )}

      {estado === ESTADOS.LISTO && (
        <div className="mt-2 flex flex-wrap gap-2">
          {mascotas.map((mascota) => (
            <button
              key={mascota.id}
              type="button"
              onClick={() => onSeleccionar(mascota.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                mascota.id === valorSeleccionado
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-300 text-slate-700 hover:border-blue-300'
              }`}
            >
              {mascota.nombre}
              {mascota.especie ? ` (${mascota.especie})` : ''}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMostrarNueva((v) => !v)}
            className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:border-blue-400 hover:text-blue-600"
          >
            + Nueva mascota
          </button>
        </div>
      )}

      {mostrarNueva && (
        <div className="mt-3 flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Campo id="nueva-mascota-nombre" label="Nombre" value={nombreNueva} onChange={(e) => setNombreNueva(e.target.value)} />
          </div>
          <div className="flex-1">
            <Campo
              id="nueva-mascota-especie"
              label="Especie (opcional)"
              value={especieNueva}
              onChange={(e) => setEspecieNueva(e.target.value)}
              placeholder="Perro, gato..."
            />
          </div>
          <button
            type="button"
            disabled={creando}
            onClick={crear}
            className="h-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {creando ? 'Creando...' : 'Agregar'}
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
