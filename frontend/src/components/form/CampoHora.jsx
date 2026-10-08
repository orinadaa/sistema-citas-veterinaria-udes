// components/form/CampoHora.jsx
// Campo de hora de vetUI: reemplaza al <input type="time"> del navegador,
// cuyo selector de hora lo dibuja el sistema operativo y no sigue la
// marca. Es un Desplegable con las horas del dia cada 30 minutos (el paso
// con que trabaja la agenda), escritas como en el resto del sistema
// ("8:00 a. m.").
//
// Se usa igual que el input que reemplaza: value es "HH:MM" (24 horas) y
// onChange recibe un evento de forma { target: { value: "HH:MM" } }. Si el
// valor guardado no cae en el paso (ej. 08:15), se agrega a la lista para
// no perderlo.
import { Desplegable } from './Desplegable';

const formatoHora = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });

function etiquetaDe(valor) {
  const [horas, minutos] = valor.split(':').map(Number);
  return formatoHora.format(new Date(2000, 0, 1, horas, minutos));
}

function horasDelDia(pasoMinutos) {
  const lista = [];
  for (let minutos = 0; minutos < 24 * 60; minutos += pasoMinutos) {
    lista.push(`${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`);
  }
  return lista;
}

export function CampoHora({ value, onChange, paso = 30, marcador = 'Hora', className = '', ...resto }) {
  const valor = (value || '').slice(0, 5);
  const horas = horasDelDia(paso);
  if (valor && !horas.includes(valor)) {
    horas.push(valor);
    horas.sort();
  }

  return (
    <Desplegable value={valor} onChange={onChange} className={`min-w-[8.25rem] tabular-nums ${className}`} {...resto}>
      {!valor && <option value="">{marcador}</option>}
      {horas.map((hora) => (
        <option key={hora} value={hora}>
          {etiquetaDe(hora)}
        </option>
      ))}
    </Desplegable>
  );
}
