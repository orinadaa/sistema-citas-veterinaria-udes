// components/agendar/Seccion.jsx
// Bloque numerado de cada paso del flujo de agendamiento ("1 Selecciona
// la mascota", etc.): una Superficie de vidrio de vetUI con su
// TituloSeccion; el numero coincide con el hito del BookingStepper.
import { Superficie, TituloSeccion } from '../vetui';

export function Seccion({ numero, titulo, descripcion, children }) {
  return (
    // id = destino del click en el stepper; scroll-mt deja la seccion por
    // debajo de la pildora de la topbar (76px) al hacer scroll hasta ella.
    <Superficie id={`paso-${numero}`} className="scroll-mt-28">
      <TituloSeccion numero={numero} titulo={titulo} descripcion={descripcion} />
      <div className="mt-5">{children}</div>
    </Superficie>
  );
}
