// components/AccentBar.jsx
// Detalle de marca: azul + amarillo, los dos colores institucionales de la
// clinica.
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
