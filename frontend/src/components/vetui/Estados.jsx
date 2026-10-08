// components/vetui/Estados.jsx
// Estados de una vista, todos para fondo oscuro (vidrio o fondo):
//   Aviso         mensaje en línea. tono: info | ok | alerta | error.
//   EstadoVacio   no hay elementos todavía (lista vacía).
//   EstadoError   falló la carga, con botón Reintentar.
//   Esqueleto     marcador de carga (bloques que pulsan).
import { IconoAlerta, IconoCheck } from '../icons';
import { Boton } from './Boton';

const TONOS_AVISO = {
  info: 'bg-brand-blue-800/40 text-blue-50 ring-white/30',
  ok: 'bg-emerald-400/20 text-emerald-50 ring-emerald-300/50',
  // Rojo y ambar mas opacos: translucidos sobre azul se veian morado y
  // oliva. El ambar es claro: lleva texto oscuro (como el boton ambar).
  alerta: 'bg-amber-400/90 text-slate-900 ring-amber-200/70',
  error: 'bg-red-600/50 text-white ring-red-300/60',
};

export function Aviso({ tono = 'info', children, className = '' }) {
  const Icono = tono === 'ok' ? IconoCheck : IconoAlerta;
  return (
    <p
      role={tono === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-tarjeta px-4 py-3 text-sm font-medium ring-1 backdrop-blur-md ${TONOS_AVISO[tono] ?? TONOS_AVISO.info} ${className}`}
    >
      <Icono className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function EstadoVacio({ children, accion }) {
  return (
    <div className="vt-vacio flex flex-col items-center gap-3 rounded-tarjeta border border-dashed border-white/35 p-8 text-center text-sm text-blue-50">
      <p>{children}</p>
      {accion}
    </div>
  );
}

export function EstadoError({ mensaje, onReintentar }) {
  return (
    <div className="vidrio flex flex-col items-center gap-3 rounded-superficie p-8 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/20 text-red-100">
        <IconoAlerta className="h-6 w-6" peso="duotone" />
      </span>
      <p className="text-sm text-blue-50">{mensaje}</p>
      <Boton variante="secundario" tamano="sm" onClick={onReintentar}>
        Reintentar
      </Boton>
    </div>
  );
}

export function Esqueleto({ className = 'h-24' }) {
  return <div aria-hidden="true" className={`vt-esqueleto animate-pulse rounded-tarjeta bg-white/12 ${className}`} />;
}
