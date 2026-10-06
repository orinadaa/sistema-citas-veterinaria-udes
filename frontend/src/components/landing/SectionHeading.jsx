// components/landing/SectionHeading.jsx
// Encabezado de seccion del landing publico: titulo + AccentBar de dos
// tonos (azul+ambar) debajo + subtitulo opcional. Se repite en
// Servicios, Sedes y Horarios; `accion` permite el enlace opcional a
// la derecha del titulo (ej. "Ver todos los servicios →").
import { AccentBar } from '../AccentBar';

// `sobreFondoOscuro`: version para secciones con fondo azul oscuro (ej.
// Servicios): titulo blanco, subtitulo blue-50 (mismos colores de texto
// que el Hero) y AccentBar con su mitad azul en blanco.
export function SectionHeading({ titulo, subtitulo, accion, sobreFondoOscuro = false }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className={`text-3xl font-bold tracking-tight ${sobreFondoOscuro ? 'text-white' : 'text-slate-900'}`}>{titulo}</h2>
        <AccentBar sobreFondoAzul={sobreFondoOscuro} />
        {subtitulo && (
          <p className={`mt-4 max-w-[60ch] lg:max-w-[90ch] ${sobreFondoOscuro ? 'text-blue-50' : 'text-slate-600'}`}>{subtitulo}</p>
        )}
      </div>
      {accion}
    </div>
  );
}
