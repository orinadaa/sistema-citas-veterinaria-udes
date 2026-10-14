// components/citas/CalendarioSemanal.jsx
// Grid de calendario por franjas de 30 min (7:00 a 19:00), extraido de
// PanelCitasSeguimiento.jsx para compartirlo entre el calendario del
// administrador y "Mis citas" del medico.
import { Fragment, useMemo } from 'react';
import { esMismoDia, formatearHora } from '../../utils/fecha';
import { COLORES_CATEGORIA } from '../ui/CategoryBadge';

const HORA_INICIO_GRID = 7;
const HORA_FIN_GRID = 19;
const TOTAL_SLOTS = (HORA_FIN_GRID - HORA_INICIO_GRID) * 2;
const NOMBRE_DIA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function etiquetaHora(slotIndex) {
  const hora24 = HORA_INICIO_GRID + slotIndex / 2;
  const periodo = hora24 < 12 ? 'AM' : 'PM';
  const hora12 = hora24 % 12 === 0 ? 12 : hora24 % 12;
  return `${hora12}:00 ${periodo}`;
}

function TarjetaCita({ cita, mostrarMedico, onClick }) {
  const tono = COLORES_CATEGORIA[cita.categoria_color] ?? COLORES_CATEGORIA.blue;
  const cancelada = cita.estado === 'cancelada';
  // Por reagendar: la hora es la original, que ya no vale; borde ambar punteado.
  const porReagendar = cita.estado === 'por_reagendar';
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ backgroundColor: tono.bg, color: tono.text }}
      className={`mb-1 flex w-full flex-col rounded-lg px-1.5 py-1 text-left text-xs leading-tight transition hover:brightness-95 ${
        cancelada ? 'opacity-50 line-through' : porReagendar ? 'opacity-70 outline-2 outline-dashed outline-amber-500' : ''
      }`}
    >
      <span className="font-semibold">{formatearHora(cita.fecha_hora)}</span>
      <span className="truncate">{cita.mascota_nombre}</span>
      <span className="truncate opacity-80">{mostrarMedico ? cita.medico_nombre : cita.servicio_nombre}</span>
    </button>
  );
}

export function CalendarioSemanal({ dias, citas, mostrarMedico = false, onSeleccionarCita }) {
  const hoy = new Date();

  const citasEnGrid = useMemo(() => {
    const mapa = new Map();
    citas.forEach((cita) => {
      const fecha = new Date(cita.fecha_hora);
      const indiceDia = dias.findIndex((dia) => esMismoDia(dia, fecha));
      if (indiceDia === -1) return;
      const minutosDesdeInicio = fecha.getHours() * 60 + fecha.getMinutes() - HORA_INICIO_GRID * 60;
      const indiceSlot = Math.floor(minutosDesdeInicio / 30);
      if (indiceSlot < 0 || indiceSlot >= TOTAL_SLOTS) return;
      const clave = `${indiceDia}-${indiceSlot}`;
      if (!mapa.has(clave)) mapa.set(clave, []);
      mapa.get(clave).push(cita);
    });
    return mapa;
  }, [citas, dias]);

  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => i);

  return (
    <div
      className={dias.length > 1 ? 'min-w-[760px]' : ''}
      style={{ display: 'grid', gridTemplateColumns: `64px repeat(${dias.length}, minmax(110px, 1fr))` }}
    >
      <div />
      {dias.map((dia, i) => (
        <div
          key={i}
          className={`border-b border-l border-slate-100 px-2 py-2 text-center text-xs font-semibold ${
            esMismoDia(dia, hoy) ? 'text-brand-blue' : 'text-slate-500'
          }`}
        >
          {NOMBRE_DIA[dia.getDay()]} <span className="block text-sm">{dia.getDate()}</span>
        </div>
      ))}

      {slots.map((indiceSlot) => (
        <Fragment key={indiceSlot}>
          <div className="border-t border-slate-100 pr-2 pt-1 text-right text-xs text-slate-400">
            {indiceSlot % 2 === 0 ? etiquetaHora(indiceSlot) : ''}
          </div>
          {dias.map((dia, indiceDia) => {
            const clave = `${indiceDia}-${indiceSlot}`;
            const citasSlot = citasEnGrid.get(clave) || [];
            return (
              <div key={clave} className="min-h-[44px] border-t border-l border-slate-100 p-0.5">
                {citasSlot.map((cita) => (
                  <TarjetaCita key={cita.id} cita={cita} mostrarMedico={mostrarMedico} onClick={() => onSeleccionarCita(cita)} />
                ))}
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
