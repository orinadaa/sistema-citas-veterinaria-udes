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
import { IconoPapelera } from '../icons';
import { AvatarMascota } from './AvatarMascota';
import { edadYPeso } from '../../utils/mascota';
import { FormularioMascotaPanel } from './FormularioMascotaPanel';

export function PanelMisMascotas() {
  const { token } = useAuth();
  const [mascotas, setMascotas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [mascotaEditando, setMascotaEditando] = useState(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [aviso, setAviso] = useState({ tipo: '', texto: '' });

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
    setAviso({ tipo: '', texto: '' });
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
          className="inline-flex items-center gap-2 rounded-boton bg-brand-amber px-4 py-2.5 text-sm font-semibold text-brand-navy shadow-sm transition hover:brightness-95"
        >
          + Agregar mascota
        </button>
      </div>

      {aviso.texto && (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-medium ring-1 ${
            aviso.tipo === 'ok' ? 'bg-emerald-50 text-brand-green ring-emerald-200' : 'bg-amber-50 text-amber-800 ring-amber-200'
          }`}
        >
          {aviso.texto}
        </p>
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
              <div className="flex min-w-0 items-center gap-3">
                <AvatarMascota mascota={mascota} className="h-14 w-14" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{mascota.nombre}</p>
                  <p className="truncate text-sm text-slate-500">
                    {[mascota.especie, mascota.raza].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
                  </p>
                  {edadYPeso(mascota) && <p className="text-xs text-slate-400">{edadYPeso(mascota)}</p>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => abrirEditar(mascota)}
                  className="rounded-boton border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Ver detalles
                </button>
                <button
                  type="button"
                  onClick={() => abrirEditar(mascota, { eliminar: true })}
                  aria-label={`Eliminar a ${mascota.nombre}`}
                  className="rounded-boton p-2 text-slate-400 transition hover:bg-red-50 hover:text-brand-red"
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
      fotosAnteriores={mascotas.map((m) => m.foto_url).filter(Boolean)}
      onGuardada={(_, { avisoFoto }) => {
        setPanelAbierto(false);
        setAviso({ tipo: 'alerta', texto: avisoFoto });
        cargar();
      }}
      onEliminada={(eliminada) => {
        setPanelAbierto(false);
        setAviso({ tipo: 'ok', texto: `${eliminada.nombre} se eliminó de tus mascotas.` });
        cargar();
      }}
    />
    </>
  );
}
