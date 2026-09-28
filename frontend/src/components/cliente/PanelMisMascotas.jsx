// components/cliente/PanelMisMascotas.jsx
// Pestaña "Mis mascotas" del panel del cliente (cierra RF-14): antes
// solo se podia agregar una mascota de forma inline al agendar una
// cita (MascotaSelector.jsx); aqui se pueden ver todas y editarlas.
// El formulario (SidePanel) vive en FormularioMascotaPanel.jsx, compartido
// con el flujo de agendamiento.
import { useEffect, useState } from 'react';
import { obtenerMisMascotas } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { EstadoError } from '../ui/EstadoError';
import { IconoPata, IconoLapiz, IconoPapelera } from '../icons';
import { FormularioMascotaPanel } from './FormularioMascotaPanel';

export function PanelMisMascotas() {
  const { token } = useAuth();
  const [mascotas, setMascotas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [mascotaEditando, setMascotaEditando] = useState(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [aviso, setAviso] = useState('');

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
    setConfirmarEliminar(false);
    setPanelAbierto(true);
  }

  function abrirEditar(mascota, { eliminar = false } = {}) {
    setMascotaEditando(mascota);
    setConfirmarEliminar(eliminar);
    setAviso('');
    setPanelAbierto(true);
  }

  return (
    <>
    <div className="flex flex-col gap-6" inert={panelAbierto} aria-hidden={panelAbierto}>
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

      {aviso && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-brand-green ring-1 ring-emerald-200">{aviso}</p>
      )}

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
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => abrirEditar(mascota)}
                  aria-label={`Editar a ${mascota.nombre}`}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <IconoLapiz className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => abrirEditar(mascota, { eliminar: true })}
                  aria-label={`Eliminar a ${mascota.nombre}`}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-brand-red"
                >
                  <IconoPapelera className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>

    <FormularioMascotaPanel
      isOpen={panelAbierto}
      onClose={() => setPanelAbierto(false)}
      mascota={mascotaEditando}
      confirmarAlAbrir={confirmarEliminar}
      onGuardada={() => {
        setPanelAbierto(false);
        cargar();
      }}
      onEliminada={(eliminada) => {
        setPanelAbierto(false);
        setAviso(`${eliminada.nombre} se eliminó de tus mascotas.`);
        cargar();
      }}
    />
    </>
  );
}
