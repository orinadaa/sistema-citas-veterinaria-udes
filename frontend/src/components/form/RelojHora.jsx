// components/form/RelojHora.jsx
// Selector de hora con reloj de manecillas (pedido de Oriana, parecido al de
// Google): se elige la hora tocando o arrastrando sobre el reloj y, al
// soltar, el reloj pasa a los minutos.
// Al lado van los controles exactos: hora y minutos con flechas (o escritos)
// y a. m. / p. m. El reloj marca los minutos de 5 en 5; con las flechas se
// llega a cualquier minuto. Los controles exactos son ademas la via de
// teclado: el reloj es solo para el puntero.
// value: "HH:MM" en 24 horas. onChange recibe el nuevo "HH:MM".
import { useRef, useState } from 'react';
import { IconoChevronAbajo } from '../icons';

const TAMANO = 208;
const CENTRO = TAMANO / 2;
const RADIO = 80;
const HORAS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTOS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const dos = (n) => String(n).padStart(2, '0');

function partes(valor) {
  const [h, m] = (valor || '08:00').split(':').map(Number);
  return { hora12: h % 12 === 0 ? 12 : h % 12, minuto: m || 0, pm: h >= 12 };
}

function armar({ hora12, minuto, pm }) {
  return `${dos((hora12 % 12) + (pm ? 12 : 0))}:${dos(minuto)}`;
}

// Posicion sobre el reloj de la marca numero `indice` de 12 (0 = arriba).
function punto(fraccion, radio = RADIO) {
  const angulo = fraccion * 2 * Math.PI;
  return { x: CENTRO + radio * Math.sin(angulo), y: CENTRO - radio * Math.cos(angulo) };
}

function Perilla({ id, etiqueta, valor, minimo, maximo, onCambiar, onEnfocar }) {
  // Da la vuelta: despues de 59 viene 00, antes de 1 viene 12.
  const mover = (paso) => {
    const rango = maximo - minimo + 1;
    onCambiar(((valor - minimo + paso + rango) % rango) + minimo);
  };
  const claseFlecha = 'flex h-7 w-full items-center justify-center rounded-boton text-brand-blue-700 transition hover:bg-blue-100';
  return (
    <div className="flex w-14 flex-col items-center gap-1">
      <button type="button" onClick={() => mover(1)} aria-label={`Subir ${etiqueta}`} className={claseFlecha}>
        <IconoChevronAbajo className="h-4 w-4 rotate-180" peso="bold" />
      </button>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        aria-label={etiqueta}
        value={dos(valor)}
        onFocus={(e) => {
          e.target.select();
          onEnfocar?.();
        }}
        onChange={(e) => {
          const numero = Number(e.target.value.replace(/\D/g, '').slice(-2));
          if (numero >= minimo && numero <= maximo) onCambiar(numero);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            mover(1);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            mover(-1);
          }
        }}
        className="campo w-full px-0 py-1.5 text-center text-lg font-semibold tabular-nums text-slate-900"
      />
      <button type="button" onClick={() => mover(-1)} aria-label={`Bajar ${etiqueta}`} className={claseFlecha}>
        <IconoChevronAbajo className="h-4 w-4" peso="bold" />
      </button>
      <span className="text-xs font-medium text-slate-700">{etiqueta}</span>
    </div>
  );
}

export function RelojHora({ id = 'reloj', value, onChange }) {
  const actual = partes(value);
  const [modo, setModo] = useState('hora'); // hora | minuto
  const arrastrando = useRef(false);
  const esfera = useRef(null);

  const cambiar = (cambios) => onChange(armar({ ...actual, ...cambios }));

  // Del punto tocado al numero mas cercano del reloj.
  function elegirEn(evento) {
    const caja = esfera.current.getBoundingClientRect();
    const dx = evento.clientX - (caja.left + caja.width / 2);
    const dy = evento.clientY - (caja.top + caja.height / 2);
    const vuelta = ((Math.atan2(dx, -dy) / (2 * Math.PI)) + 1) % 1;
    const marca = Math.round(vuelta * 12) % 12;
    if (modo === 'hora') cambiar({ hora12: HORAS[marca] });
    else cambiar({ minuto: MINUTOS[marca] });
  }

  const fraccion = modo === 'hora' ? (actual.hora12 % 12) / 12 : actual.minuto / 60;
  const punta = punto(fraccion);
  const marcas = modo === 'hora' ? HORAS : MINUTOS;
  const elegido = modo === 'hora' ? actual.hora12 : actual.minuto;
  const enMarca = modo === 'hora' || actual.minuto % 5 === 0;
  const claseParte = (activa) =>
    `rounded-boton px-2 py-0.5 font-heading text-3xl font-bold tabular-nums transition ${activa ? 'bg-brand-blue-600 text-white' : 'text-brand-navy hover:bg-blue-100'}`;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-4">
      <div className="flex flex-col items-center gap-3">
        {/* Hora elegida: tocar la hora o los minutos cambia lo que marca el reloj. */}
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setModo('hora')} aria-pressed={modo === 'hora'} aria-label={`Hora: ${actual.hora12}. Elegir la hora en el reloj`} className={claseParte(modo === 'hora')}>
            {actual.hora12}
          </button>
          <span className="font-heading text-3xl font-bold text-brand-navy" aria-hidden="true">
            :
          </span>
          <button type="button" onClick={() => setModo('minuto')} aria-pressed={modo === 'minuto'} aria-label={`Minutos: ${actual.minuto}. Elegir los minutos en el reloj`} className={claseParte(modo === 'minuto')}>
            {dos(actual.minuto)}
          </button>
          <span className="ml-1 text-sm font-semibold text-slate-700">{actual.pm ? 'p. m.' : 'a. m.'}</span>
        </div>

        <svg
          ref={esfera}
          width={TAMANO}
          height={TAMANO}
          viewBox={`0 0 ${TAMANO} ${TAMANO}`}
          aria-hidden="true"
          className="shrink-0 cursor-pointer touch-none select-none"
          onPointerDown={(e) => {
            arrastrando.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            elegirEn(e);
          }}
          onPointerMove={(e) => arrastrando.current && elegirEn(e)}
          onPointerUp={() => {
            if (!arrastrando.current) return;
            arrastrando.current = false;
            // Elegida la hora, el reloj pasa solo a los minutos.
            if (modo === 'hora') setModo('minuto');
          }}
          onPointerCancel={() => {
            arrastrando.current = false;
          }}
        >
          <circle cx={CENTRO} cy={CENTRO} r={CENTRO - 2} fill="#E8F1FD" stroke="rgb(15 23 42 / 0.1)" />
          {/* Manecilla */}
          <line x1={CENTRO} y1={CENTRO} x2={punta.x} y2={punta.y} stroke="var(--color-brand-blue-600)" strokeWidth="2" />
          <circle cx={CENTRO} cy={CENTRO} r="4" fill="var(--color-brand-blue-600)" />
          {/* Sobre una marca, la punta la envuelve; en un minuto intermedio es un punto pequeño que no tapa los numeros. */}
          <circle cx={punta.x} cy={punta.y} r={enMarca ? 17 : 6} fill="var(--color-brand-blue-600)" />
          {marcas.map((numero, indice) => {
            const p = punto(indice / 12);
            return (
              <text
                key={numero}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="14"
                fontWeight="600"
                fill={numero === elegido ? '#fff' : '#1e293b'}
              >
                {modo === 'hora' ? numero : dos(numero)}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Controles exactos */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-start gap-1.5">
          <Perilla id={`${id}-hora`} etiqueta="Hora" valor={actual.hora12} minimo={1} maximo={12} onCambiar={(hora12) => cambiar({ hora12 })} onEnfocar={() => setModo('hora')} />
          <span className="pt-8 text-lg font-semibold text-slate-700" aria-hidden="true">
            :
          </span>
          <Perilla id={`${id}-minuto`} etiqueta="Minutos" valor={actual.minuto} minimo={0} maximo={59} onCambiar={(minuto) => cambiar({ minuto })} onEnfocar={() => setModo('minuto')} />
        </div>
        <div role="radiogroup" aria-label="Mañana o tarde" className="flex rounded-boton bg-white p-0.5 ring-1 ring-slate-300">
          {[
            [false, 'a. m.'],
            [true, 'p. m.'],
          ].map(([pm, texto]) => (
            <button
              key={texto}
              type="button"
              role="radio"
              aria-checked={actual.pm === pm}
              onClick={() => cambiar({ pm })}
              className={`rounded-boton px-3 py-1.5 text-sm font-semibold transition ${actual.pm === pm ? 'bg-brand-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              {texto}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
