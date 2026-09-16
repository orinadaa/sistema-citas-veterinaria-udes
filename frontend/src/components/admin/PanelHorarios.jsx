// components/admin/PanelHorarios.jsx
// RF-13: horario de atencion de la sede del administrador.
import { useEffect, useState } from 'react';
import { obtenerHorarios, actualizarHorario, cerrarDiaHorario } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function formatoInput(hora) {
  return hora ? hora.slice(0, 5) : '';
}

export function PanelHorarios() {
  const { usuario, token } = useAuth();
  const [dias, setDias] = useState(() =>
    DIAS.map((nombre, indice) => ({ diaSemana: indice, nombre, abierto: false, horaInicio: '08:00', horaFin: '17:00' }))
  );
  const [cargando, setCargando] = useState(true);
  const [guardandoDia, setGuardandoDia] = useState(null);
  const [mensaje, setMensaje] = useState('');

  function cargar() {
    setCargando(true);
    obtenerHorarios(usuario.sedeId).then((datos) => {
      setDias((anterior) =>
        anterior.map((dia) => {
          const encontrado = datos.horario.find((h) => h.dia_semana === dia.diaSemana);
          return encontrado
            ? { ...dia, abierto: true, horaInicio: formatoInput(encontrado.hora_inicio), horaFin: formatoInput(encontrado.hora_fin) }
            : { ...dia, abierto: false };
        })
      );
      setCargando(false);
    });
  }

  useEffect(cargar, [usuario.sedeId]);

  function actualizarCampoDia(diaSemana, campo, valor) {
    setDias((anterior) => anterior.map((d) => (d.diaSemana === diaSemana ? { ...d, [campo]: valor } : d)));
  }

  async function guardarDia(dia) {
    setGuardandoDia(dia.diaSemana);
    setMensaje('');
    try {
      await actualizarHorario(
        { sedeId: usuario.sedeId, diaSemana: dia.diaSemana, horaInicio: dia.horaInicio, horaFin: dia.horaFin },
        token
      );
      actualizarCampoDia(dia.diaSemana, 'abierto', true);
      setMensaje(`Horario del ${dia.nombre.toLowerCase()} actualizado.`);
    } catch (error) {
      setMensaje(error.message);
    } finally {
      setGuardandoDia(null);
    }
  }

  async function cerrarDia(dia) {
    setGuardandoDia(dia.diaSemana);
    setMensaje('');
    try {
      await cerrarDiaHorario(usuario.sedeId, dia.diaSemana, token);
      actualizarCampoDia(dia.diaSemana, 'abierto', false);
      setMensaje(`${dia.nombre} marcado como cerrado.`);
    } catch (error) {
      setMensaje(error.message);
    } finally {
      setGuardandoDia(null);
    }
  }

  if (cargando) {
    return (
      <div className="flex flex-col gap-3">
        {DIAS.map((nombre) => (
          <div key={nombre} className="h-14 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {mensaje && <p className="mb-4 text-sm text-slate-600">{mensaje}</p>}
      <div className="flex flex-col divide-y divide-slate-100">
        {dias.map((dia) => (
          <div key={dia.diaSemana} className="flex flex-wrap items-center gap-3 py-3">
            <span className="w-28 shrink-0 text-sm font-medium text-slate-700">{dia.nombre}</span>

            {dia.abierto ? (
              <>
                <input
                  type="time"
                  value={dia.horaInicio}
                  onChange={(e) => actualizarCampoDia(dia.diaSemana, 'horaInicio', e.target.value)}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <span className="text-sm text-slate-400">a</span>
                <input
                  type="time"
                  value={dia.horaFin}
                  onChange={(e) => actualizarCampoDia(dia.diaSemana, 'horaFin', e.target.value)}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <button
                  type="button"
                  disabled={guardandoDia === dia.diaSemana}
                  onClick={() => guardarDia(dia)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-60"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  disabled={guardandoDia === dia.diaSemana}
                  onClick={() => cerrarDia(dia)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  Cerrar este día
                </button>
              </>
            ) : (
              <>
                <span className="text-sm text-slate-400">Cerrado</span>
                <button
                  type="button"
                  disabled={guardandoDia === dia.diaSemana}
                  onClick={() => guardarDia(dia)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-60"
                >
                  Abrir con horario por defecto (08:00–17:00)
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
