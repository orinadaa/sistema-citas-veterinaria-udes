// components/landing/SectionHeading.jsx
// Encabezado de seccion del landing publico: titulo + AccentBar de dos
// tonos (azul+ambar) debajo + subtitulo opcional. Se repite en
// Servicios, Sedes y Horarios; `accion` permite el enlace opcional a
// la derecha del titulo (ej. "Ver todos los servicios →").
import { AccentBar } from '../AccentBar';

export function SectionHeading({ titulo, subtitulo, accion }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{titulo}</h2>
        <AccentBar />
        {subtitulo && <p className="mt-4 max-w-[60ch] text-slate-600">{subtitulo}</p>}
      </div>
      {accion}
    </div>
  );
}
