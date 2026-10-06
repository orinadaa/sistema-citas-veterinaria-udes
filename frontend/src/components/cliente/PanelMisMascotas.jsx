// components/cliente/PanelMisMascotas.jsx
// Pestaña "Mis mascotas" del panel del cliente (cierra RF-14): antes
// solo se podia agregar una mascota de forma inline al agendar una
// cita (MascotaSelector.jsx); aqui se pueden ver todas y editarlas.
// El formulario (SidePanel) vive en FormularioMascotaPanel.jsx, compartido
// con el flujo de agendamiento. vetUI: cada mascota en una Tarjeta de
// vidrio blanco (corta el azul del fondo); "Agregar mascota" es la accion primaria (ambar).
import { useEffect, useState } from 'react';
import { obtenerMisMascotas } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Aviso, Boton, EstadoError, EstadoVacio, Esqueleto, Tarjeta } from '../vetui';
import { IconoMas, IconoPapelera } from '../icons';
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
          <h2 className="text-xl font-bold text-white">Mis mascotas</h2>
          <p className="text-sm text-blue-100">Registra y edita la información de tus mascotas.</p>
        </div>
        <Boton icono={IconoMas} onClick={abrirCrear}>
          Agregar mascota
        </Boton>
      </div>

      {aviso.texto && <Aviso tono={aviso.tipo === 'ok' ? 'ok' : 'alerta'}>{aviso.texto}</Aviso>}

      {cargando ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((clave) => (
            <Esqueleto key={clave} />
          ))}
        </div>
      ) : errorCarga ? (
        <EstadoError mensaje={errorCarga} onReintentar={cargar} />
      ) : mascotas.length === 0 ? (
        <EstadoVacio>Aún no has registrado mascotas.</EstadoVacio>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {mascotas.map((mascota) => (
            <Tarjeta key={mascota.id} material="blanco" className="flex items-start justify-between gap-3 p-5">
              <div className="flex min-w-0 items-center gap-4">
                <AvatarMascota mascota={mascota} className="h-16 w-16 shadow-md ring-4 ring-white" iconoClassName="h-8 w-8" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{mascota.nombre}</p>
                  <p className="truncate text-sm text-slate-700">
                    {[mascota.especie, mascota.raza].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
                  </p>
                  {edadYPeso(mascota) && <p className="text-xs font-medium text-slate-700">{edadYPeso(mascota)}</p>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Boton variante="contorno" tamano="sm" onClick={() => abrirEditar(mascota)}>
                  Ver detalles
                </Boton>
                <button
                  type="button"
                  onClick={() => abrirEditar(mascota, { eliminar: true })}
                  aria-label={`Eliminar a ${mascota.nombre}`}
                  className="rounded-boton p-2 text-slate-700 transition hover:bg-red-50 hover:text-red-700"
                >
                  <IconoPapelera className="h-4 w-4" />
                </button>
              </div>
            </Tarjeta>
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
