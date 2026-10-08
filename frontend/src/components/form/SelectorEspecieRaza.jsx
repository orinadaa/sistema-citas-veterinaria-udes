// components/form/SelectorEspecieRaza.jsx
// Especie + raza (ambas obligatorias) para crear/editar una mascota,
// compartido por el cliente (FormularioMascotaPanel) y el admin
// (PanelPacientes, MascotaSelector del calendario).
//
// Especie: botones tipo tarjeta, altos y angostos, con el icono del animal
// arriba y el nombre abajo (pedido de Oriana; reemplaza al <select>). Son
// pocas opciones fijas, asi que se ven todas de una vez y se eligen con un
// solo clic. Accesibilidad:
// - es un grupo de opciones (radiogroup): Tab entra a la elegida y las
//   flechas cambian de especie, como en cualquier grupo de radio;
// - la elegida no se distingue solo por el color: lleva un check, el icono
//   relleno y el texto en negrita;
// - cada boton mide al menos 44px de ancho y 96px de alto (maximo 84px
//   de ancho: siempre queda mas alto que ancho).
//
// Raza: lista que depende de la especie (utils/razas.js); para "Otro" es
// un campo de texto. Si una mascota antigua tiene una especie o una raza
// escrita a mano que no esta en el catalogo, se conserva como opcion extra
// para no perderla al editar.
import { useRef } from 'react';
import { ESPECIES, RAZAS_POR_ESPECIE, razaEsTextoLibre } from '../../utils/razas';
import { IconoAve, IconoCheck, IconoGato, IconoPata, IconoPerro } from '../icons';

// Icono de cada especie del catalogo; "Otro" (y cualquier especie antigua
// escrita a mano) usa la huella.
const ICONO_ESPECIE = { Canino: IconoPerro, Felino: IconoGato, Ave: IconoAve };

const CLASE_CAMPO =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30 disabled:bg-slate-50 disabled:text-slate-400';

function Etiqueta({ htmlFor, id, children }) {
  const Elemento = htmlFor ? 'label' : 'span';
  return (
    <Elemento htmlFor={htmlFor} id={id} className="text-sm font-medium text-slate-700">
      {children}
      <span className="ml-0.5 text-red-500" aria-hidden="true">
        *
      </span>
    </Elemento>
  );
}

export function SelectorEspecieRaza({ idPrefijo, especie, raza, onChange, className = 'flex flex-col gap-4' }) {
  const grupo = useRef(null);
  // Especie guardada con un texto que no esta en el catalogo (ej.
  // "Perro" escrito a mano antes de este cambio): se muestra tal cual.
  const especiesOpciones = especie && !ESPECIES.includes(especie) ? [...ESPECIES, especie] : ESPECIES;
  const lista = RAZAS_POR_ESPECIE[especie];
  const razasOpciones = lista && raza && !lista.includes(raza) ? [...lista, raza] : lista;

  function elegir(opcion) {
    // Cambiar de especie invalida la raza elegida.
    if (opcion !== especie) onChange({ especie: opcion, raza: '' });
  }

  // Flechas: pasan a la especie anterior/siguiente (con vuelta), la eligen
  // y le dan el foco; Inicio/Fin van a los extremos.
  function alPulsarTecla(evento, indice) {
    const ultimo = especiesOpciones.length - 1;
    let destino = null;
    if (evento.key === 'ArrowRight' || evento.key === 'ArrowDown') destino = indice === ultimo ? 0 : indice + 1;
    else if (evento.key === 'ArrowLeft' || evento.key === 'ArrowUp') destino = indice === 0 ? ultimo : indice - 1;
    else if (evento.key === 'Home') destino = 0;
    else if (evento.key === 'End') destino = ultimo;
    if (destino === null) return;
    evento.preventDefault();
    elegir(especiesOpciones[destino]);
    grupo.current?.querySelectorAll('[role="radio"]')[destino]?.focus();
  }

  return (
    <div className={className}>
      <div className="flex flex-1 flex-col gap-1.5">
        <Etiqueta id={`${idPrefijo}-especie-etiqueta`}>Especie</Etiqueta>
        <div
          ref={grupo}
          id={`${idPrefijo}-especie`}
          role="radiogroup"
          aria-required="true"
          aria-labelledby={`${idPrefijo}-especie-etiqueta`}
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${especiesOpciones.length}, minmax(0, 5.25rem))` }}
        >
          {especiesOpciones.map((opcion, indice) => {
            const elegida = opcion === especie;
            const IconoEspecie = ICONO_ESPECIE[opcion] ?? IconoPata;
            return (
              <button
                key={opcion}
                type="button"
                role="radio"
                aria-checked={elegida}
                // Un solo punto de Tab en el grupo: la elegida, o la primera
                // si aun no hay ninguna.
                tabIndex={elegida || (!especie && indice === 0) ? 0 : -1}
                onClick={() => elegir(opcion)}
                onKeyDown={(evento) => alPulsarTecla(evento, indice)}
                className={`relative flex min-h-24 min-w-11 flex-col items-center justify-center gap-1.5 rounded-xl px-1.5 py-3 text-center text-sm transition hover:[filter:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
                  elegida
                    ? 'bg-blue-50 font-semibold text-brand-blue-700 ring-2 ring-brand-blue'
                    : 'bg-white font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 hover:ring-slate-400'
                }`}
              >
                {elegida && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-blue text-white">
                    <IconoCheck className="h-2.5 w-2.5" peso="bold" />
                  </span>
                )}
                <IconoEspecie className={`h-8 w-8 ${elegida ? '' : 'text-slate-500'}`} peso={elegida ? 'duotone' : 'regular'} />
                <span className="max-w-full truncate leading-tight">{opcion}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        <Etiqueta htmlFor={`${idPrefijo}-raza`}>{razaEsTextoLibre(especie) ? '¿Qué animal es?' : 'Raza'}</Etiqueta>
        {razaEsTextoLibre(especie) ? (
          <input
            id={`${idPrefijo}-raza`}
            required
            value={raza}
            maxLength={80}
            onChange={(e) => onChange({ especie, raza: e.target.value })}
            placeholder="Ej. Conejo, hámster, tortuga..."
            className={CLASE_CAMPO}
          />
        ) : (
          <select
            id={`${idPrefijo}-raza`}
            required
            disabled={!especie}
            value={raza}
            onChange={(e) => onChange({ especie, raza: e.target.value })}
            className={CLASE_CAMPO}
          >
            <option value="">{especie ? 'Selecciona una raza' : 'Primero elige la especie'}</option>
            {(razasOpciones || []).map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
