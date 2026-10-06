// components/agendar/DialogoSalirAgendar.jsx
// Confirmacion antes de salir del flujo de agendamiento cuando ya hay
// datos elegidos: "Cancelar" no debe borrar el progreso sin avisar.
// Usa el Dialogo de vetUI (cristal fuerte centrado): Escape o clic en el
// velo = seguir agendando; el foco arranca en la opcion segura.
import { Boton, Dialogo } from '../vetui';

export function DialogoSalirAgendar({ abierto, onSeguir, onSalir }) {
  return (
    <Dialogo
      abierto={abierto}
      onCerrar={onSeguir}
      titulo="¿Salir sin agendar la cita?"
      descripcion="Perderás lo que ya elegiste (servicio, sede, fecha y hora)."
    >
      <Boton variante="contorno" onClick={onSeguir}>
        Seguir agendando
      </Boton>
      <Boton variante="peligro-claro" onClick={onSalir}>
        Sí, salir
      </Boton>
    </Dialogo>
  );
}
