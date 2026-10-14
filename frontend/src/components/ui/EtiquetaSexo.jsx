// components/ui/EtiquetaSexo.jsx
// Sexo de la mascota con su icono (Phosphor), en vez de los caracteres de
// texto que algunos equipos dibujan como emoji.
import { IconoHembra, IconoMacho } from '../icons';

import { ETIQUETA_SEXO } from '../../utils/sexo';

export function IconoSexo({ sexo, className = 'h-4 w-4' }) {
  if (!ETIQUETA_SEXO[sexo]) return null;
  const Icono = sexo === 'hembra' ? IconoHembra : IconoMacho;
  return <Icono className={className} peso="bold" />;
}

export function EtiquetaSexo({ sexo, className = '' }) {
  if (!ETIQUETA_SEXO[sexo]) return null;
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <IconoSexo sexo={sexo} className="h-3.5 w-3.5" />
      {ETIQUETA_SEXO[sexo]}
    </span>
  );
}
