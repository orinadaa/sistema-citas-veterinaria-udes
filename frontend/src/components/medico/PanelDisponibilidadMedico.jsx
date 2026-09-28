// components/medico/PanelDisponibilidadMedico.jsx
// Pestaña "Disponibilidad" de Mi perfil. Pendiente de construir (opcion
// A aprobada: horario por medico y sede + bloqueos). Mientras tanto, un
// estado claro, sin campos falsos ni datos inventados.
import { IconoReloj } from '../icons';

export function PanelDisponibilidadMedico() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
        <IconoReloj className="h-6 w-6" />
      </span>
      <p className="font-heading text-base font-semibold text-brand-navy">Esta función está en definición</p>
      <p className="max-w-md text-sm text-slate-500">
        Pronto podrás configurar aquí tu horario, pausas y bloqueos. Mientras tanto, tu agenda usa el horario de atención de tu sede.
      </p>
    </div>
  );
}
