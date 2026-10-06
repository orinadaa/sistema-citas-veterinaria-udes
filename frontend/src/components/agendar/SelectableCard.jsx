// components/agendar/SelectableCard.jsx
// Tarjeta seleccionable de la grilla de mascotas y de servicios: una
// Tarjeta de cristal de vetUI interactiva (anillo y check ambar cuando
// esta elegida). Es un boton real (aria-pressed) para el teclado.
import { Tarjeta } from '../vetui';

export function SelectableCard({ seleccionada, onSeleccionar, children, className = '' }) {
  return (
    <Tarjeta
      as="button"
      type="button"
      onClick={onSeleccionar}
      aria-pressed={seleccionada}
      interactiva
      seleccionada={seleccionada}
      className={`flex w-full p-4 ${className}`}
    >
      {children}
    </Tarjeta>
  );
}
