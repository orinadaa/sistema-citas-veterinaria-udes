// components/admin/PanelServicios.jsx
// RF-11: configurar los servicios veterinarios ofrecidos.
import { useEffect, useState } from 'react';
import { obtenerServiciosAdmin, crearServicio, actualizarServicio } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Campo } from '../form/Campo';

export function PanelServicios() {
  const { token } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);

  function cargar() {
    setCargando(true);
    obtenerServiciosAdmin(token).then((datos) => {
      setServicios(datos.servicios);
      setCargando(false);
    });
  }

  useEffect(cargar, [token]);

  async function crear(evento) {
    evento.preventDefault();
    setError('');
    if (!nombre) {
      setError('El nombre es obligatorio.');
      return;
    }
    setCreando(true);
    try {
      await crearServicio({ nombre, descripcion }, token);
      setNombre('');
      setDescripcion('');
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreando(false);
    }
  }

  async function alternarActivo(servicio) {
    await actualizarServicio(servicio.id, { activo: !servicio.activo }, token);
    cargar();
  }

  return (
    <div>
      <form onSubmit={crear} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-end sm:gap-3">
        <div className="flex-1">
          <Campo id="nombre-servicio" label="Nombre del servicio" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="flex-1">
          <Campo
            id="descripcion-servicio"
            label="Descripción (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={creando}
          className="h-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {creando ? 'Creando...' : 'Agregar servicio'}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col divide-y divide-slate-100">
        {cargando ? (
          [0, 1, 2].map((clave) => <div key={clave} className="h-12 animate-pulse rounded-lg bg-slate-100 my-1" />)
        ) : (
          servicios.map((servicio) => (
            <div key={servicio.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{servicio.nombre}</p>
                {servicio.descripcion && <p className="text-xs text-slate-500">{servicio.descripcion}</p>}
              </div>
              <button
                type="button"
                onClick={() => alternarActivo(servicio)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  servicio.activo ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {servicio.activo ? 'Activo' : 'Inactivo'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
