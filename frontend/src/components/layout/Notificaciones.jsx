// components/layout/Notificaciones.jsx
// La campana: boton con el numero de avisos sin leer y, al pulsarlo, el panel
// con las ultimas notificaciones de quien inicio sesion (cita agendada,
// reprogramada o cancelada, mascota registrada, recordatorio del medico y
// recordatorio previo a la cita). Es del cliente y del medico (Navbar); el
// administrador y el superadministrador no tienen notificaciones.
//
// - Se actualiza sola cada minuto y al abrir el panel.
// - Pulsar un aviso lo marca como leido y lleva a donde corresponde (onIr
//   recibe el enlace, una ruta).
// - "Marcar todas como leídas" limpia el contador.
// - Se cierra con Escape o con un clic afuera.
// - Lo no leido no se distingue solo por color: lleva un punto y negrita, y
//   el boton anuncia el numero a los lectores de pantalla.
// El panel es azul opaco (no vidrio): en la pildora quedaria anidado dentro
// de otro vidrio y el navegador no desenfocaria la pagina de atras.
import { useCallback, useEffect, useRef, useState } from 'react';
import { marcarNotificacionLeida, marcarNotificacionesLeidas, obtenerNotificaciones } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { IconoCalendario, IconoCampana, IconoPata, IconoReloj, IconoX } from '../icons';

const ICONOS = {
  cita_agendada: IconoCalendario,
  cita_reprogramada: IconoCalendario,
  cita_cancelada: IconoX,
  mascota_registrada: IconoPata,
  recordatorio: IconoCampana,
  recordatorio_cita: IconoReloj,
};

// "hace 5 min", "hace 3 h", "ayer", o la fecha.
function haceCuanto(iso) {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return 'ahora';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

const BOTON = {
  pildora: 'boton-texto relative inline-flex rounded-boton p-2 text-white/90 transition',
};

export function Notificaciones({ variante = 'pildora', onIr }) {
  const { token } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [datos, setDatos] = useState({ notificaciones: [], sinLeer: 0 });
  const [cargado, setCargado] = useState(false);
  const contenedor = useRef(null);

  const cargar = useCallback(() => {
    obtenerNotificaciones(token)
      .then((respuesta) => {
        setDatos(respuesta);
        setCargado(true);
      })
      // Sin servidor la campana simplemente no muestra nada nuevo.
      .catch(() => setCargado(true));
  }, [token]);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 60000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  useEffect(() => {
    if (!abierto) return undefined;
    function alHacerClic(evento) {
      if (contenedor.current && !contenedor.current.contains(evento.target)) setAbierto(false);
    }
    function alPulsarTecla(evento) {
      if (evento.key === 'Escape') setAbierto(false);
    }
    document.addEventListener('mousedown', alHacerClic);
    document.addEventListener('keydown', alPulsarTecla);
    return () => {
      document.removeEventListener('mousedown', alHacerClic);
      document.removeEventListener('keydown', alPulsarTecla);
    };
  }, [abierto]);

  function alternar() {
    if (!abierto) cargar();
    setAbierto((valor) => !valor);
  }

  function abrirAviso(aviso) {
    if (!aviso.leida) {
      setDatos((actual) => ({
        notificaciones: actual.notificaciones.map((n) => (n.id === aviso.id ? { ...n, leida: true } : n)),
        sinLeer: Math.max(0, actual.sinLeer - 1),
      }));
      marcarNotificacionLeida(aviso.id, token).catch(() => {});
    }
    setAbierto(false);
    if (aviso.enlace) onIr?.(aviso.enlace);
  }

  function marcarTodas() {
    setDatos((actual) => ({ notificaciones: actual.notificaciones.map((n) => ({ ...n, leida: true })), sinLeer: 0 }));
    marcarNotificacionesLeidas(token).catch(() => {});
  }

  const { notificaciones, sinLeer } = datos;

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={alternar}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-label={sinLeer > 0 ? `Notificaciones, ${sinLeer} sin leer` : 'Notificaciones'}
        className={BOTON[variante] ?? BOTON.pildora}
      >
        <IconoCampana className="h-5 w-5" peso={sinLeer > 0 ? 'fill' : 'regular'} />
        {sinLeer > 0 && (
          <span
            aria-hidden="true"
            className={`absolute flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-amber px-1 text-[11px] font-bold leading-none text-slate-900 ring-2 ring-brand-blue-800 ${
              variante === 'panel' ? 'right-1.5 top-1.5' : '-right-0.5 -top-0.5'
            }`}
          >
            {sinLeer > 9 ? '9+' : sinLeer}
          </span>
        )}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="absolute right-0 top-full z-50 mt-3 flex max-h-[min(32rem,calc(100vh-7rem))] w-[23rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden whitespace-normal rounded-superficie bg-brand-blue-800 text-left text-white shadow-[0_24px_60px_-20px_rgb(0_0_0/0.6)] ring-1 ring-white/20"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/15 px-5 py-3.5">
            <p className="font-heading text-base font-semibold">Notificaciones</p>
            {sinLeer > 0 && (
              <button type="button" onClick={marcarTodas} className="boton-texto rounded-boton px-1 text-sm font-semibold text-brand-amber-400 transition">
                Marcar todas como leídas
              </button>
            )}
          </div>

          {!cargado ? (
            <p className="px-5 py-8 text-center text-sm text-white/85">Cargando...</p>
          ) : notificaciones.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
              <IconoCampana className="h-9 w-9 text-white/60" peso="duotone" />
              <p className="text-sm font-medium">No tienes notificaciones</p>
              <p className="text-sm text-white/80">Aquí verás tus citas, recordatorios y novedades.</p>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto py-1">
              {notificaciones.map((aviso) => {
                const Icono = ICONOS[aviso.tipo] ?? IconoCampana;
                return (
                  <li key={aviso.id}>
                    <button
                      type="button"
                      onClick={() => abrirAviso(aviso)}
                      className={`flex w-full items-start gap-3 px-5 py-3 text-left transition hover:bg-white/10 ${aviso.leida ? '' : 'bg-white/[0.07]'}`}
                    >
                      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${aviso.leida ? 'bg-white/10 text-white/80' : 'bg-brand-amber text-slate-900'}`}>
                        <Icono className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`flex items-center gap-2 text-sm ${aviso.leida ? 'font-medium text-white/90' : 'font-bold'}`}>
                          {aviso.titulo}
                          {!aviso.leida && (
                            <>
                              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-brand-amber" />
                              <span className="sr-only">(sin leer)</span>
                            </>
                          )}
                        </span>
                        <span className="mt-0.5 block text-sm text-white/85">{aviso.mensaje}</span>
                        <span className="mt-1 block text-xs text-white/70">{haceCuanto(aviso.creado_en)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
