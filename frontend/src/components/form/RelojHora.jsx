// components/form/RelojHora.jsx
// Selector de hora con reloj de manecillas (pedido de Oriana, parecido al de
// Google): se elige la hora tocando o arrastrando sobre el reloj y, al
// soltar, el reloj pasa a los minutos.
// Al lado van la hora y los minutos con flechas (o escritos) y a. m. / p. m.
// Esos dos numeros son tambien la lectura de la hora y el selector de lo que
// marca el reloj: el que esta en azul es el que se elige en la esfera. El reloj marca los minutos de 5 en 5; con las flechas se
// llega a cualquier minuto. Los controles exactos son ademas la via de
// teclado: el reloj es solo para el puntero.
// value: "HH:MM" en 24 horas. onChange recibe el nuevo "HH:MM".
// reinicio (opcional): al cambiar, el reloj vuelve a las horas.
// Movimiento: la manecilla gira por el camino corto, los numeros entran con
// un fundido al pasar de horas a minutos; con "reducir movimiento" no hay
// animaciones.
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

function Perilla({ id, etiqueta, valor, minimo, maximo, activa, onCambiar, onEnfocar }) {
  // Da la vuelta: despues de 59 viene 00, antes de 1 viene 12.
  const mover = (paso) => {
    const rango = maximo - minimo + 1;
    onEnfocar?.();
    onCambiar(((valor - minimo + paso + rango) % rango) + minimo);
  };
  const claseFlecha = 'flex h-7 w-full items-center justify-center rounded-boton text-brand-blue-700 transition duration-150 hover:bg-blue-100 active:scale-90 motion-reduce:active:scale-100';
  return (
    <div className="flex w-14 flex-col items-center gap-1">
      <button type="button" onClick={() => mover(1)} aria-label={`Subir ${etiqueta}`} className={claseFlecha}>
        <IconoChevronAbajo className="h-4 w-4 rotate-180" peso="bold" />
      </button>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        aria-label={activa ? `${etiqueta} (es lo que marca el reloj)` : etiqueta}
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
        className={`w-full rounded-boton px-0 py-1.5 text-center text-xl font-bold tabular-nums outline-none transition ${
          activa ? 'scale-105 bg-brand-blue-600 text-white ring-2 ring-brand-blue-600' : 'campo text-slate-900'
        } duration-200 motion-reduce:transition-none`}
      />
      <button type="button" onClick={() => mover(-1)} aria-label={`Bajar ${etiqueta}`} className={claseFlecha}>
        <IconoChevronAbajo className="h-4 w-4" peso="bold" />
      </button>
      <span className="text-xs font-medium text-slate-700">{etiqueta}</span>
    </div>
  );
}

export function RelojHora({ id = 'reloj', value, onChange, reinicio }) {
  const actual = partes(value);
  const [modo, setModo] = useState('hora'); // hora | minuto
  // Cuando cambia `reinicio` (se pasa a editar otra hora) el reloj vuelve a
  // empezar por las horas, sin desmontarse: asi la manecilla gira hasta alla.
  const [reinicioPrevio, setReinicioPrevio] = useState(reinicio);
  if (reinicioPrevio !== reinicio) {
    setReinicioPrevio(reinicio);
    setModo('hora');
  }
  const arrastrando = useRef(false);
  // Mientras se arrastra, la manecilla sigue al dedo casi sin retraso.
  const [arrastra, setArrastra] = useState(false);
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
  // Giro acumulado de la manecilla: siempre va por el camino corto (de 11 a
  // 1 avanza dos marcas, no retrocede diez).
  const [giro, setGiro] = useState(fraccion * 360);
  const destino = giro + ((((fraccion * 360 - giro) % 360) + 540) % 360) - 180;
  if (Math.abs(destino - giro) > 0.01) setGiro(destino);
  const marcas = modo === 'hora' ? HORAS : MINUTOS;
  const elegido = modo === 'hora' ? actual.hora12 : actual.minuto;
  const enMarca = modo === 'hora' || actual.minuto % 5 === 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-4">
      <div className="flex flex-col items-center">
        <svg
          ref={esfera}
          width={TAMANO}
          height={TAMANO}
          viewBox={`0 0 ${TAMANO} ${TAMANO}`}
          aria-hidden="true"
          className="shrink-0 cursor-pointer touch-none select-none"
          onPointerDown={(e) => {
            arrastrando.current = true;
            setArrastra(true);
            e.currentTarget.setPointerCapture(e.pointerId);
            elegirEn(e);
          }}
          onPointerMove={(e) => arrastrando.current && elegirEn(e)}
          onPointerUp={() => {
            if (!arrastrando.current) return;
            arrastrando.current = false;
            setArrastra(false);
            // Elegida la hora, el reloj pasa solo a los minutos.
            if (modo === 'hora') setModo('minuto');
          }}
          onPointerCancel={() => {
            arrastrando.current = false;
            setArrastra(false);
          }}
        >
          <circle cx={CENTRO} cy={CENTRO} r={CENTRO - 2} fill="#E8F1FD" stroke="rgb(15 23 42 / 0.1)" />
          {/* Manecilla: se dibuja apuntando a las 12 y se gira; el giro va animado. */}
          <g
            style={{
              transform: `rotate(${giro}deg)`,
              transformOrigin: `${CENTRO}px ${CENTRO}px`,
              transition: `transform ${arrastra ? 90 : 320}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
            }}
            className="motion-reduce:!transition-none"
          >
            <line x1={CENTRO} y1={CENTRO} x2={CENTRO} y2={CENTRO - RADIO} stroke="var(--color-brand-blue-600)" strokeWidth="2" />
            {/* Sobre una marca, la punta la envuelve; en un minuto intermedio es un punto pequeño que no tapa los numeros. */}
            <circle cx={CENTRO} cy={CENTRO - RADIO} r={enMarca ? 17 : 6} fill="var(--color-brand-blue-600)" style={{ transition: 'r 200ms ease-out' }} className="motion-reduce:!transition-none" />
          </g>
          <circle cx={CENTRO} cy={CENTRO} r="4" fill="var(--color-brand-blue-600)" />
          {/* key: al pasar de horas a minutos los numeros entran de nuevo, con un fundido. */}
          <g key={modo} style={{ transformOrigin: `${CENTRO}px ${CENTRO}px` }} className="animate-entra-suave motion-reduce:animate-none">
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
                style={{ transition: 'fill 220ms ease-out' }}
              >
                {modo === 'hora' ? numero : dos(numero)}
              </text>
            );
          })}
          </g>
        </svg>
      </div>

      {/* Controles exactos */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-start gap-1.5">
          <Perilla id={`${id}-hora`} etiqueta="Hora" valor={actual.hora12} minimo={1} maximo={12} activa={modo === 'hora'} onCambiar={(hora12) => cambiar({ hora12 })} onEnfocar={() => setModo('hora')} />
          <span className="pt-8 text-lg font-semibold text-slate-700" aria-hidden="true">
            :
          </span>
          <Perilla id={`${id}-minuto`} etiqueta="Minutos" valor={actual.minuto} minimo={0} maximo={59} activa={modo === 'minuto'} onCambiar={(minuto) => cambiar({ minuto })} onEnfocar={() => setModo('minuto')} />
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
              className={`rounded-boton px-3 py-1.5 text-sm font-semibold transition duration-200 ${actual.pm === pm ? 'bg-brand-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              {texto}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
