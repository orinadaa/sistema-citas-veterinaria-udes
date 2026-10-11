// components/citas/PieCancelarCita.jsx
// Pie del detalle de una cita para el personal (administrador de la sede y
// medico): permite cancelarla. Antes solo el cliente podia cancelar: si un
// medico no podia atender, nadie de la sede podia hacerlo. El servidor decide
// quien puede (la sede de la cita o el medico que la atiende) y avisa al
// cliente por la campana y por correo.
// Sigue el estandar de acciones destructivas (docs/vetui.md): boton de texto
// rojo a la izquierda; la confirmacion reemplaza al pie y ofrece primero la
// opcion segura.
import { useState } from 'react';
import { cancelarCita } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { sePuedeCancelar } from '../../utils/citaCancelable';

// `children`: las demas acciones del pie (van a la derecha).
export function PieCancelarCita({ cita, onCancelada, children }) {
  const { token } = useAuth();
  const [citaConfirmando, setCitaConfirmando] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState('');
  const confirmando = citaConfirmando === cita?.id;

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
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}
