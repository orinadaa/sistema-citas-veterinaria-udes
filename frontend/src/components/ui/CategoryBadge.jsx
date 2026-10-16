// components/ui/CategoryBadge.jsx
// Pill de categoria/especialidad: fondo pastel + texto/punto del tono saturado
// de la paleta `category` (ver seccion 1.1 del sistema de diseno).
export const COLORES_CATEGORIA = {
  blue: { bg: '#E5F0FE', text: '#1E5FBF', dot: '#4897F6' },
  amber: { bg: '#FEF3D6', text: '#92650B', dot: '#FDD369' },
  teal: { bg: '#D6F5EA', text: '#2C7567', dot: '#51A79C' },
  purple: { bg: '#F0E8FE', text: '#6B3FC9', dot: '#9A63EE' },
  pink: { bg: '#FDE6F0', text: '#B33A76', dot: '#F788BB' },
  cyan: { bg: '#E1F7FC', text: '#1A778D', dot: '#51CAEB' },
  orange: { bg: '#FBE9D8', text: '#95571D', dot: '#D98A3D' },
  slate: { bg: '#EDF0F5', text: '#334155', dot: '#94A3B8' },
};

// Un medico sin especialidad asignada es medico general, en todas las vistas
// (tambien el servidor responde 'General' en las citas: cita.model.js).
export function EspecialidadGeneral() {
  return <CategoryBadge nombre="General" color="slate" />;
}

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
