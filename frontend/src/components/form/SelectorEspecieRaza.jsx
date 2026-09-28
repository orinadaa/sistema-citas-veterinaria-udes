// components/form/SelectorEspecieRaza.jsx
// Especie + raza (ambas obligatorias) para crear/editar una mascota,
// compartido por el cliente (FormularioMascotaPanel) y el admin
// (PanelPacientes, MascotaSelector del calendario). La raza es una
// lista que depende de la especie (utils/razas.js); para "Otro" es un
// campo de texto. Si una mascota antigua tiene una raza escrita a mano
// que no esta en la lista, se conserva como opcion extra para no
// perderla al editar.
import { ESPECIES, RAZAS_POR_ESPECIE, razaEsTextoLibre } from '../../utils/razas';

const CLASE_CAMPO =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30 disabled:bg-slate-50 disabled:text-slate-400';

function Etiqueta({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
      {children}
      <span className="ml-0.5 text-red-500" aria-hidden="true">
        *
      </span>
    </label>
  );
}

// iconoEspecie (opcional): icono dentro del campo de especie, a la
// izquierda (formulario de mascota del admin).
export function SelectorEspecieRaza({ idPrefijo, especie, raza, onChange, className = 'flex flex-col gap-4', iconoEspecie: IconoEspecie }) {
  // Especie guardada con un texto que no esta en el catalogo (ej.
  // "Perro" escrito a mano antes de este cambio): se muestra tal cual.
  const especiesOpciones = especie && !ESPECIES.includes(especie) ? [...ESPECIES, especie] : ESPECIES;
  const lista = RAZAS_POR_ESPECIE[especie];
  const razasOpciones = lista && raza && !lista.includes(raza) ? [...lista, raza] : lista;

  return (
    <div className={className}>
      <div className="flex flex-1 flex-col gap-1.5">
        <Etiqueta htmlFor={`${idPrefijo}-especie`}>Especie</Etiqueta>
        <div className="relative">
          {IconoEspecie && (
            <IconoEspecie className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue" />
          )}
          <select
            id={`${idPrefijo}-especie`}
            required
            value={especie}
            // Cambiar de especie invalida la raza elegida.
            onChange={(e) => onChange({ especie: e.target.value, raza: '' })}
            className={`${CLASE_CAMPO} ${IconoEspecie ? 'pl-9' : ''}`}
          >
            <option value="">Selecciona una especie</option>
            {especiesOpciones.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
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
