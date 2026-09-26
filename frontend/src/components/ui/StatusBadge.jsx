// components/ui/StatusBadge.jsx
// Pill de solo lectura para el estado de una cita en "Mis citas" del
// panel del cliente: 3 estados (proxima/completada/cancelada), a
// diferencia de StatusToggle.jsx (que es un interruptor on/off de
// activo/inactivo). Reutiliza brand.blue/green/red, no colores nuevos.
const CONFIG = {
  proxima: { texto: 'Próxima', className: 'bg-blue-50 text-brand-blue' },
  completada: { texto: 'Completada', className: 'bg-emerald-50 text-brand-green' },
  cancelada: { texto: 'Cancelada', className: 'bg-red-50 text-brand-red' },
};

export function StatusBadge({ status }) {
  const config = CONFIG[status] ?? CONFIG.proxima;
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}>
      {config.texto}
    </span>
  );
}
