// components/landing/BotonContacto.jsx
// Boton flotante de contacto de la pagina publica (RF-23, pedido de Oriana;
// reemplaza a la burbuja que solo abria WhatsApp). Fijo abajo a la derecha.
// Al pasar el cursor o al pulsarlo se despliegan hacia arriba los accesos
// directos: WhatsApp y las redes que tengan enlace en el panel del
// superadministrador. Sin ningun canal configurado no se dibuja nada.
// - Con raton: se abre al pasar el cursor y se cierra al salir; un clic lo
//   deja fijo. En pantallas tactiles solo cuenta el toque.
// - Teclado: el boton abre y cierra (aria-expanded); Escape cierra. Cerrado,
//   los accesos quedan fuera del orden de tabulacion (inert).
// - 56 px el boton y 48 px cada acceso: comodos para tocar. Deja libre el
//   borde derecho, donde va la barra de desplazamiento.
import { useEffect, useRef, useState } from 'react';
import { useInfoClinica } from '../../hooks/useInfoClinica';
import { IconoContacto, IconoX } from '../icons';
import { canalesDe } from './canales';

export function BotonContacto() {
  const canales = canalesDe(useInfoClinica());
  const [fijado, setFijado] = useState(false);
  const [encima, setEncima] = useState(false);
  const raiz = useRef(null);
  const abierto = fijado || encima;

  useEffect(() => {
    if (!abierto) return undefined;
    function alPresionar(evento) {
      if (evento.key === 'Escape') {
        setFijado(false);
        setEncima(false);
      }
    }
    function alPulsarFuera(evento) {
      if (!raiz.current?.contains(evento.target)) setFijado(false);
    }
    document.addEventListener('keydown', alPresionar);
    document.addEventListener('pointerdown', alPulsarFuera);
    return () => {
      document.removeEventListener('keydown', alPresionar);
      document.removeEventListener('pointerdown', alPulsarFuera);
    };
  }, [abierto]);

  if (canales.length === 0) return null;

  return (
    <div
      ref={raiz}
      className="fixed bottom-5 right-7 z-30 flex flex-col items-end gap-3 sm:bottom-6"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setEncima(true)}
      onPointerLeave={() => setEncima(false)}
    >
      <ul id="canales-contacto" aria-label="Canales de contacto" inert={!abierto} className={`flex flex-col items-end gap-2.5 ${abierto ? '' : 'pointer-events-none'}`}>
        {canales.map(({ clave, nombre, href, Icono, color }, indice) => (
          <li
            key={clave}
            // Entran de abajo hacia arriba, uno tras otro (el mas cercano al boton primero).
            style={{ transitionDelay: abierto ? `${(canales.length - 1 - indice) * 45}ms` : '0ms' }}
            className={`transition duration-200 ease-out motion-reduce:transition-none ${abierto ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}
          >
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${nombre} (se abre en una pestaña nueva)`}
              className="group flex items-center gap-2.5 outline-none"
            >
              <span className="rounded-boton bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-[0_6px_18px_-8px_rgb(0_0_0/0.6)]">{nombre}</span>
              <span
                style={{ backgroundColor: color }}
                className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-[0_8px_22px_-8px_rgb(0_0_0/0.7)] ring-2 ring-white/80 transition group-hover:scale-110 group-focus-visible:ring-4 group-focus-visible:ring-white motion-reduce:group-hover:scale-100"
              >
                <Icono className="h-6 w-6" peso="fill" />
              </span>
            </a>
          </li>
        ))}
      </ul>

      <button
        type="button"
        aria-expanded={abierto}
        aria-controls="canales-contacto"
        aria-label={abierto ? 'Cerrar los canales de contacto' : 'Contáctanos'}
        title="Contáctanos"
        onClick={() => setFijado((v) => !v)}
        className="boton-glass-ambar flex h-14 w-14 items-center justify-center rounded-full text-brand-navy outline-none ring-2 ring-white/70 transition focus-visible:ring-4 focus-visible:ring-white"
      >
        {fijado ? <IconoX className="h-6 w-6" peso="bold" /> : <IconoContacto className="h-7 w-7" peso="fill" />}
      </button>
    </div>
  );
}
