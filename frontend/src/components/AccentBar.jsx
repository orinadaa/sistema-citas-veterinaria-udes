// components/AccentBar.jsx
// Detalle de marca: azul + amarillo, los dos colores institucionales de
// la clinica. Se usa siempre igual, bajo los titulos de seccion.
// `sobreFondoAzul` cambia la mitad azul por blanco para que se distinga
// sobre un fondo ya azul (ej. el banner de cierre).
export function AccentBar({ sobreFondoAzul = false, centrado = false }) {
  return (
    <span
      className={`mt-3 flex h-1.5 w-14 overflow-hidden rounded-full ${centrado ? 'mx-auto' : ''}`}
      aria-hidden="true"
    >
      <span className={`w-1/2 ${sobreFondoAzul ? 'bg-white' : 'bg-blue-600'}`} />
      <span className="w-1/2 bg-amber-400" />
    </span>
  );
}
