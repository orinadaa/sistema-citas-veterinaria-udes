// components/ui/CategoryBadge.jsx
// Pill de categoria/especialidad: fondo pastel + texto/punto del tono
// saturado de la paleta `category` (ver seccion 1.1 del sistema de diseno).
// Los 7 colores tienen 2 variantes precalculadas (fondo ~90% blanco,
// texto/punto en el tono saturado); el ejemplo "Preventiva" del
// documento (bg #D6F5EA / text #2E7A6B) corresponde a `teal`.
export const COLORES_CATEGORIA = {
  blue: { bg: '#E5F0FE', text: '#1E5FBF', dot: '#4897F6' },
  amber: { bg: '#FEF3D6', text: '#92650B', dot: '#FDD369' },
  teal: { bg: '#D6F5EA', text: '#2E7A6B', dot: '#51A79C' },
  purple: { bg: '#F0E8FE', text: '#6B3FC9', dot: '#9A63EE' },
  pink: { bg: '#FDE6F0', text: '#C23E80', dot: '#F788BB' },
  cyan: { bg: '#E1F7FC', text: '#1B7C93', dot: '#51CAEB' },
  orange: { bg: '#FBE9D8', text: '#A15F1F', dot: '#D98A3D' },
};

export function CategoryBadge({ nombre, color }) {
  const tono = COLORES_CATEGORIA[color] ?? COLORES_CATEGORIA.blue;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: tono.bg, color: tono.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tono.dot }} />
      {nombre}
    </span>
  );
}
