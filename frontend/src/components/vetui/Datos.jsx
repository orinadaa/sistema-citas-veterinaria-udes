// components/vetui/Datos.jsx
// Piezas para mostrar datos:
//   TarjetaDato  indicador (KPI) en cristal: icono, valor, etiqueta. Si
//                recibe onClick, toda la tarjeta es un botón.
//   Insignia     etiqueta de estado de solo lectura. Para citas:
//                estado="proxima" | "completada" | "cancelada"; o un
//                `tono` genérico con `children`.
// Colores de texto oscuros (-700/-800): sobre cristal los tonos -500/600
// no llegan a AA.
import { IconoFlechaDerecha } from '../icons';

const TONOS_ICONO = {
  azul: 'bg-blue-100 text-brand-blue-700',
  ambar: 'bg-amber-100 text-amber-700',
  rosa: 'bg-pink-100 text-pink-700',
  verde: 'bg-emerald-100 text-emerald-700',
};

export function TarjetaDato({ icono: Icono, tono = 'azul', valor, detalle, etiqueta, onClick }) {
  const Componente = onClick ? 'button' : 'div';
  return (
    <Componente
      {...(onClick ? { type: 'button', onClick } : {})}
      className={`cristal relative flex w-full flex-col items-start rounded-tarjeta p-5 text-left ${
        onClick ? 'hover-ilumina-claro outline-none focus-visible:ring-4 focus-visible:ring-white/60' : ''
      }`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${TONOS_ICONO[tono] ?? TONOS_ICONO.azul}`}>
        {Icono && <Icono className="h-5 w-5" />}
      </span>
      <span className="mt-4 text-2xl font-bold text-slate-900">{valor}</span>
      {detalle && <span className="text-xs font-medium text-slate-700">{detalle}</span>}
      <span className="mt-0.5 text-sm text-slate-700">{etiqueta}</span>
      {onClick && (
        <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-slate-700">
          <IconoFlechaDerecha className="h-3.5 w-3.5" />
        </span>
      )}
    </Componente>
  );
}

const ESTADOS_CITA = {
  proxima: { texto: 'Próxima', tono: 'azul' },
  completada: { texto: 'Completada', tono: 'verde' },
  cancelada: { texto: 'Cancelada', tono: 'rojo' },
};

const TONOS_INSIGNIA = {
  azul: 'bg-blue-100 text-blue-800',
  verde: 'bg-emerald-100 text-emerald-800',
  rojo: 'bg-red-100 text-red-800',
  ambar: 'bg-amber-100 text-amber-800',
  gris: 'bg-slate-100 text-slate-700',
};

export function Insignia({ estado, tono = 'gris', children }) {
  const config = estado ? ESTADOS_CITA[estado] ?? ESTADOS_CITA.proxima : { texto: children, tono };
  return (
    <span className={`inline-flex shrink-0 items-center rounded-boton px-3 py-1 text-xs font-semibold ${TONOS_INSIGNIA[config.tono]}`}>
      {config.texto}
    </span>
  );
}
