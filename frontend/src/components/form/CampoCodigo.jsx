// components/form/CampoCodigo.jsx
// Codigo de verificacion de un solo uso (el que llega por correo): un
// recuadro por digito, en dos grupos de tres separados por un guion
// (diseño elegido por Oriana: seis digitos seguidos cuestan de leer; en
// dos grupos se copian sin perderse). Cada recuadro es un `campo` de
// vetUI: mismo borde, radio y foco ambar que el resto de los campos.
//
// Comportamiento:
// - escribir un digito pasa el foco al recuadro siguiente; Retroceso en un
//   recuadro vacio vuelve al anterior y lo borra; las flechas mueven el foco;
// - pegar el codigo completo lo reparte solo en los recuadros (sirve
//   tambien para el autocompletado del celular: autocomplete one-time-code);
// - solo acepta digitos;
// - `error`: los recuadros se pintan en rojo (aria-invalid). Quien lo usa
//   decide cuando vaciarlo; al quedar vacio con `enfocar` cambia, el foco
//   vuelve al primer recuadro.
//
// Se usa como un campo de texto: `valor` es la cadena de digitos y
// onChange recibe la cadena nueva.
import { useEffect, useRef } from 'react';

export function CampoCodigo({ id, etiqueta = 'Código de seguridad', valor, onChange, longitud = 6, error = false, disabled = false, enfocar = 0 }) {
  const recuadros = useRef([]);
  const digitos = Array.from({ length: longitud }, (_, i) => valor[i] ?? '');
  const mitad = Math.ceil(longitud / 2);
  // Valor mas reciente, sin esperar al siguiente render: al escribir, el
  // foco salta al recuadro siguiente ANTES de que llegue el `valor` nuevo.
  const ultimo = useRef(valor);
  useEffect(() => {
    ultimo.current = valor;
  }, [valor]);

  function cambiar(nuevo) {
    ultimo.current = nuevo;
    onChange(nuevo);
  }

  // `enfocar` es un contador: cada vez que cambia (al mostrarse el campo, o
  // tras un codigo incorrecto) el foco va al primer recuadro.
  useEffect(() => {
    if (enfocar > 0) recuadros.current[0]?.focus();
  }, [enfocar]);

  function irA(indice) {
    const destino = recuadros.current[Math.min(longitud - 1, Math.max(0, indice))];
    destino?.focus();
    destino?.select();
  }

  // Coloca `texto` (solo sus digitos) desde la posicion `desde`.
  function escribir(desde, texto) {
    const nuevos = texto.replace(/\D/g, '').slice(0, longitud - desde);
    if (!nuevos) return;
    const lista = [...digitos];
    nuevos.split('').forEach((digito, i) => {
      lista[desde + i] = digito;
    });
    // Sin huecos: el valor es siempre el prefijo lleno.
    const primerVacio = lista.findIndex((d) => d === '');
    cambiar((primerVacio === -1 ? lista : lista.slice(0, primerVacio)).join(''));
    irA(desde + nuevos.length);
  }

  function alPulsarTecla(evento, indice) {
    if (evento.key === 'Backspace') {
      evento.preventDefault();
      if (digitos[indice]) {
        cambiar(valor.slice(0, indice));
      } else if (indice > 0) {
        cambiar(valor.slice(0, indice - 1));
        irA(indice - 1);
      }
    } else if (evento.key === 'ArrowLeft') {
      evento.preventDefault();
      irA(indice - 1);
    } else if (evento.key === 'ArrowRight') {
      evento.preventDefault();
      irA(indice + 1);
    }
  }

  function recuadro(indice) {
    return (
      <input
        key={indice}
        ref={(elemento) => {
          recuadros.current[indice] = elemento;
        }}
        id={indice === 0 ? id : undefined}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete={indice === 0 ? 'one-time-code' : 'off'}
        maxLength={longitud}
        value={digitos[indice]}
        disabled={disabled}
        aria-label={`Dígito ${indice + 1} de ${longitud}`}
        aria-invalid={error || undefined}
        // Solo se puede escribir en el primer recuadro vacio o antes.
        onFocus={(evento) => {
          if (indice > ultimo.current.length) irA(ultimo.current.length);
          else evento.target.select();
        }}
        onChange={(evento) => escribir(indice, evento.target.value)}
        onKeyDown={(evento) => alPulsarTecla(evento, indice)}
        onPaste={(evento) => {
          evento.preventDefault();
          escribir(0, evento.clipboardData.getData('text'));
        }}
        className="campo h-14 w-full min-w-0 max-w-12 px-0 text-center text-2xl font-semibold tabular-nums"
      />
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-etiqueta`} className="text-sm font-medium text-slate-700">
        {etiqueta}
        <span className="ml-0.5 text-red-500" aria-hidden="true">
          *
        </span>
      </span>
      <div role="group" aria-labelledby={`${id}-etiqueta`} className="flex items-center justify-center gap-2 sm:gap-2.5">
        {digitos.slice(0, mitad).map((_, i) => recuadro(i))}
        <span aria-hidden="true" className="px-0.5 text-xl font-semibold text-slate-400">
          –
        </span>
        {digitos.slice(mitad).map((_, i) => recuadro(mitad + i))}
      </div>
    </div>
  );
}
