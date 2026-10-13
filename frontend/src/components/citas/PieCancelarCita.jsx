// components/citas/PieCancelarCita.jsx
// Pie del detalle de una cita para el personal (administrador de la sede y
// medico): permite cancelarla y reprogramarla. Antes solo el cliente podia
// hacerlo: si un medico no podia atender, nadie de la sede podia mover sus
// citas. El servidor decide quien puede (la sede de la cita o el medico que
// la atiende) y avisa al cliente por la campana; al cancelar, tambien por
// correo.
// Sigue el estandar de acciones destructivas (docs/vetui.md): boton de texto
// rojo a la izquierda; la confirmacion reemplaza al pie y ofrece primero la
// opcion segura. Reprogramar abre la misma ventana que usa el cliente
// (ReprogramarCitaModal): conserva el medico y solo ofrece sus horas libres.
import { useCallback, useEffect, useState } from 'react';
import { cancelarCita, obtenerHorarios, reprogramarCita } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { sePuedeCancelar } from '../../utils/citaCancelable';
import { ReprogramarCitaModal } from './ReprogramarCitaModal';

// `children`: las demas acciones del pie (van a la derecha).
// `onReprogramada`: la cita cambio de fecha desde este pie (recargar la agenda).
export function PieCancelarCita({ cita, onCancelada, onReprogramada, children }) {
  const { token, usuario } = useAuth();
  const [citaConfirmando, setCitaConfirmando] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState('');
  const confirmando = citaConfirmando === cita?.id;

  // Reprogramar: guarda de que cita es la ventana abierta, para que no quede
  // abierta sobre otra cita si el detalle cambia.
  const [citaReprogramando, setCitaReprogramando] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaFranja, setNuevaFranja] = useState(null);
  const [diasAbiertos, setDiasAbiertos] = useState({ sedeId: null, dias: null });
  const [reprogramando, setReprogramando] = useState(false);
  const [errorReprogramar, setErrorReprogramar] = useState('');
  const reprogramarAbierto = Boolean(cita) && citaReprogramando === cita.id;
  const sedeId = cita?.sede_id;

  // Dias en que atiende la sede: deshabilita los demas en el calendario.
  useEffect(() => {
    if (!reprogramarAbierto || !sedeId) return undefined;
    let vigente = true;
    obtenerHorarios(sedeId)
      .then((datos) => vigente && setDiasAbiertos({ sedeId, dias: new Set(datos.horario.map((h) => h.dia_semana)) }))
      .catch(() => vigente && setDiasAbiertos({ sedeId, dias: null }));
    return () => {
      vigente = false;
    };
  }, [reprogramarAbierto, sedeId]);

  function abrirReprogramar() {
    setNuevaFecha('');
    setNuevaFranja(null);
    setErrorReprogramar('');
    setCitaReprogramando(cita.id);
  }

  const cerrarReprogramar = useCallback(() => setCitaReprogramando(null), []);

  async function confirmarReprogramacion() {
    if (!nuevaFranja) return;
    setReprogramando(true);
    setErrorReprogramar('');
    try {
      await reprogramarCita(cita.id, nuevaFranja, token);
      setCitaReprogramando(null);
      onReprogramada?.(cita);
    } catch (err) {
      setErrorReprogramar(err.message);
    } finally {
      setReprogramando(false);
    }
  }

  async function cancelar() {
    setCancelando(true);
    setError('');
    try {
      await cancelarCita(cita.id, token);
      setCitaConfirmando(null);
      onCancelada?.(cita);
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelando(false);
    }
  }

  if (!sePuedeCancelar(cita)) {
    return children ? <div className="flex items-center justify-end gap-3">{children}</div> : null;
  }

  if (confirmando) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-slate-800">
          ¿Cancelar la cita de <strong>{cita.mascota_nombre}</strong>? El horario queda libre y se le avisa a {cita.cliente_nombre}. No se puede deshacer.
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setCitaConfirmando(null)}
            disabled={cancelando}
            className="rounded-boton border border-slate-400 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white/60 disabled:opacity-60"
          >
            No, conservar
          </button>
          <button
            type="button"
            onClick={cancelar}
            disabled={cancelando}
            className="rounded-boton bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
          >
            {cancelando ? 'Cancelando...' : 'Sí, cancelar la cita'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            setError('');
            setCitaConfirmando(cita.id);
          }}
          className="boton-texto rounded-boton px-1 py-2 text-sm font-semibold text-red-700"
        >
          Cancelar cita
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={abrirReprogramar}
            className="rounded-boton border border-slate-400 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white/60"
          >
            Reprogramar
          </button>
          {children}
        </div>
      </div>

      <ReprogramarCitaModal
        abierto={reprogramarAbierto}
        // La agenda del medico no trae su propio nombre en cada cita.
        cita={{ ...cita, medico_nombre: cita.medico_nombre || usuario?.nombreCompleto }}
        onCerrar={cerrarReprogramar}
        onConfirmar={confirmarReprogramacion}
        fecha={nuevaFecha}
        onCambiarFecha={setNuevaFecha}
        franja={nuevaFranja}
        onCambiarFranja={setNuevaFranja}
        diasAbiertos={diasAbiertos.sedeId === cita.sede_id ? diasAbiertos.dias : null}
        enviando={reprogramando}
        error={errorReprogramar}
      />
    </>
  );
}
