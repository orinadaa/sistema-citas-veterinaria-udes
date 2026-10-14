// components/cliente/AvisoCitasPorReagendar.jsx
// Ventana obligatoria del cliente: si la clinica cambio su horario (o el
// medico no estara) y alguna cita suya quedo "por reagendar", al entrar a su
// cuenta ve esta ventana y no puede cerrarla hasta reagendar o cancelar cada
// una. Reagendar abre la misma ventana de fecha y hora de "Reprogramar".
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cancelarCita, obtenerHorarios, obtenerMisCitas, reprogramarCita } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatearFechaLarga, formatearHora } from '../../utils/fecha';
import { ReprogramarCitaModal } from '../citas/ReprogramarCitaModal';
import { AvatarMascota } from './AvatarMascota';
import { IconoAlerta, IconoCalendario } from '../icons';

// onCambio: se reagendo o cancelo una cita (la pagina recarga su lista).
export function AvisoCitasPorReagendar({ onCambio }) {
  const { token } = useAuth();
  const [pendientes, setPendientes] = useState([]);
  const [citaAbierta, setCitaAbierta] = useState(null);
  const [fecha, setFecha] = useState('');
  const [franja, setFranja] = useState(null);
  const [diasAbiertos, setDiasAbiertos] = useState({ sedeId: null, dias: null });
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    obtenerMisCitas(token)
      .then((datos) => setPendientes(datos.citas.filter((c) => c.estado === 'por_reagendar')))
      .catch(() => setPendientes([]));
  }, [token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const sedeId = citaAbierta?.sede_id;
  useEffect(() => {
    if (!sedeId) return undefined;
    let vigente = true;
    obtenerHorarios(sedeId)
      .then((datos) => vigente && setDiasAbiertos({ sedeId, dias: new Set(datos.horario.map((h) => h.dia_semana)) }))
      .catch(() => vigente && setDiasAbiertos({ sedeId, dias: null }));
    return () => {
      vigente = false;
    };
  }, [sedeId]);

  function abrir(cita) {
    setFecha('');
    setFranja(null);
    setError('');
    setConfirmandoCancelar(null);
    setCitaAbierta(cita);
  }

  const cerrarReagendar = useCallback(() => setCitaAbierta(null), []);

  function terminar() {
    setCitaAbierta(null);
    setConfirmandoCancelar(null);
    cargar();
    onCambio?.();
  }

  async function confirmarReagendar() {
    if (!franja || !citaAbierta) return;
    setEnviando(true);
    setError('');
    try {
      await reprogramarCita(citaAbierta.id, franja, token);
      terminar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function cancelar(cita) {
    setEnviando(true);
    setError('');
    try {
      await cancelarCita(cita.id, token);
      terminar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (pendientes.length === 0) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
        {/* Sin clic afuera ni Escape: la ventana se va sola cuando no quedan citas por reagendar. */}
        <div className="velo absolute inset-0" aria-hidden="true" />
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="titulo-por-reagendar"
          aria-describedby="detalle-por-reagendar"
          className="cristal-fuerte relative flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-superficie"
        >
          <div className="flex items-start gap-3 border-b border-slate-900/10 px-6 py-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <IconoAlerta className="h-5 w-5" />
            </span>
            <div>
              <h2 id="titulo-por-reagendar" className="text-lg font-bold text-brand-navy">
                {pendientes.length === 1 ? 'Debes reagendar una cita' : `Debes reagendar ${pendientes.length} citas`}
              </h2>
              <p id="detalle-por-reagendar" className="mt-0.5 text-sm text-slate-700">
                Por cambios en el horario de la clínica, {pendientes.length === 1 ? 'esta cita ya no se puede' : 'estas citas ya no se pueden'} atender en
                su fecha original. Elige una fecha nueva o cancélala para continuar.
              </p>
            </div>
          </div>

          <ul className="flex flex-col divide-y divide-slate-900/10 overflow-y-auto px-6">
            {pendientes.map((cita) => (
              <li key={cita.id} className="flex flex-col gap-3 py-4">
                <div className="flex items-start gap-3">
                  <AvatarMascota mascota={{ nombre: cita.mascota_nombre, foto_url: cita.mascota_foto_url }} className="h-11 w-11" iconoClassName="h-5 w-5" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold text-slate-900">
                      {cita.mascota_nombre} · {cita.servicio_nombre}
                    </p>
                    <p className="text-slate-700">
                      Era el {formatearFechaLarga(cita.fecha_hora)}, {formatearHora(cita.fecha_hora)}, en {cita.sede_nombre}.
                    </p>
                    {cita.reagendar_hasta && (
                      <p className="mt-1 font-medium text-amber-800">
                        Reagéndala antes del {formatearFechaLarga(cita.reagendar_hasta)}; si no, se cancelará.
                      </p>
                    )}
                  </div>
                </div>

                {confirmandoCancelar === cita.id ? (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <p className="mr-auto text-sm text-slate-800">¿Cancelar esta cita?</p>
                    <button
                      type="button"
                      onClick={() => setConfirmandoCancelar(null)}
                      disabled={enviando}
                      className="rounded-boton border border-slate-400 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white/60 disabled:opacity-60"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelar(cita)}
                      disabled={enviando}
                      className="rounded-boton bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
                    >
                      {enviando ? 'Cancelando...' : 'Sí, cancelar'}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setConfirmandoCancelar(cita.id);
                      }}
                      className="boton-texto rounded-boton px-3 py-2 text-sm font-semibold text-red-700"
                    >
                      Cancelar cita
                    </button>
                    <button
                      type="button"
                      onClick={() => abrir(cita)}
                      className="inline-flex items-center gap-2 rounded-boton bg-brand-amber px-4 py-2 text-sm font-semibold text-slate-900 transition hover:brightness-95"
                    >
                      <IconoCalendario className="h-4 w-4" />
                      Reagendar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {error && !citaAbierta && (
            <p role="alert" className="border-t border-slate-900/10 px-6 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>

      <ReprogramarCitaModal
        abierto={Boolean(citaAbierta)}
        cita={citaAbierta}
        onCerrar={cerrarReagendar}
        onConfirmar={confirmarReagendar}
        fecha={fecha}
        onCambiarFecha={setFecha}
        franja={franja}
        onCambiarFranja={setFranja}
        diasAbiertos={citaAbierta && diasAbiertos.sedeId === citaAbierta.sede_id ? diasAbiertos.dias : null}
        enviando={enviando}
        error={error}
      />
    </>,
    document.body
  );
}
