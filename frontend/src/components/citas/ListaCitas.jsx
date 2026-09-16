// components/citas/ListaCitas.jsx
// RF-15 (consultar mis citas) sirve de base a RF-08/RF-09 en este panel.
import { FilaCita } from './FilaCita';

export function ListaCitas({ citas, onActualizada }) {
  if (citas.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        Aún no tienes citas agendadas.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {citas.map((cita) => (
        <FilaCita key={cita.id} cita={cita} onActualizada={onActualizada} />
      ))}
    </div>
  );
}
