// components/agendar/Seccion.jsx
// Bloque numerado de cada paso del flujo de agendamiento ("1 Selecciona
// la mascota", etc.): el numero coincide con el hito del BookingStepper.
export function Seccion({ numero, titulo, descripcion, children }) {
  return (
    // id = destino del click en el stepper; scroll-mt deja la seccion por
    // debajo de la pildora de la topbar (76px) al hacer scroll hasta ella.
    <section id={`paso-${numero}`} className="scroll-mt-28 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-blue text-sm font-semibold text-white">
          {numero}
        </span>
        <div>
          <h2 className="font-heading text-lg font-semibold text-brand-navy">{titulo}</h2>
          {descripcion && <p className="text-sm text-slate-500">{descripcion}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
