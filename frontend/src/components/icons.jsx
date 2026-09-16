// components/icons.jsx
// Iconos de linea, dibujados a mano y minimos. El proyecto no instala
// librerias de iconos nuevas (stack fijo, ver CLAUDE.md), asi que este
// set cubre unicamente lo que usa la landing y los formularios.

const trazoBase = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function Icono({ children, className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...trazoBase}>
      {children}
    </svg>
  );
}

export function IconoReloj({ className }) {
  return (
    <Icono className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </Icono>
  );
}

export function IconoUbicacion({ className }) {
  return (
    <Icono className={className}>
      <path d="M12 21s-6.5-5.44-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.56-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </Icono>
  );
}

export function IconoJeringa({ className }) {
  return (
    <Icono className={className}>
      <path d="m18.5 5.5-1-1-3.2 3.2m4.2-2.2L21 8l-2.5 2.5m-3-5 3 3m-9.5 1.5 4 4M5 19l2-5.2 3.2 3.2L5 19Z" />
    </Icono>
  );
}

export function IconoCirugia({ className }) {
  return (
    <Icono className={className}>
      <path d="M6 6 18 18M18 6 6 18" />
      <circle cx="6" cy="6" r="1.6" />
      <circle cx="18" cy="18" r="1.6" />
    </Icono>
  );
}

export function IconoLaboratorio({ className }) {
  return (
    <Icono className={className}>
      <path d="M10 2v6.2L5.5 17a2 2 0 0 0 1.8 2.9h9.4a2 2 0 0 0 1.8-2.9L14 8.2V2" />
      <path d="M9 2h6M8 14h8" />
    </Icono>
  );
}

export function IconoEstetoscopio({ className }) {
  return (
    <Icono className={className}>
      <path d="M6 3v6a4 4 0 0 0 8 0V3M6 3H4.5M14 3h1.5" />
      <path d="M10 13v2.5a4.5 4.5 0 0 0 9 0v-1" />
      <circle cx="19.5" cy="14.5" r="1.8" />
    </Icono>
  );
}

export function IconoDesparasitacion({ className }) {
  return (
    <Icono className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 8l8 8M16 8l-8 8" />
    </Icono>
  );
}

export function IconoDienteDental({ className }) {
  return (
    <Icono className={className}>
      <path d="M12 3c-2.8 0-5 1.8-5 4.5 0 2 .6 3 1 5.5.3 1.8.6 4.5 1.8 6.5.6 1 1.6 1 2.2 0 .7-1.2.9-2.5 1-3.5.1 1 .3 2.3 1 3.5.6 1 1.6 1 2.2 0C17.4 18 17.7 15.3 18 13.5c.4-2.5 1-3.5 1-5.5 0-2.7-2.2-4.5-5-4.5-.8 0-1.5.2-2 .5-.5-.3-1.2-.5-2-.5Z" />
    </Icono>
  );
}

export function IconoRadiografia({ className }) {
  return (
    <Icono className={className}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </Icono>
  );
}

export function IconoCintaOncologia({ className }) {
  return (
    <Icono className={className}>
      <path d="M9 4a3 3 0 1 1 6 0c0 2.5-1.2 3.8-2 5.5-.3.6-.8.6-1 0C11.2 7.8 9 6.5 9 4Z" />
      <path d="M9.5 9.8 6 20M14.5 9.8 18 20" />
    </Icono>
  );
}

export function IconoEndoscopia({ className }) {
  return (
    <Icono className={className}>
      <circle cx="7" cy="6" r="2.3" />
      <path d="M8.6 7.6c3 3 5.6 4 8.4 6 1.3 1 2.2 2.4 2.2 3.9a2.5 2.5 0 0 1-5 0c0-1 .4-1.7 1-2.4" />
    </Icono>
  );
}

export function IconoPata({ className }) {
  return (
    <Icono className={className}>
      <circle cx="7" cy="8" r="1.5" />
      <circle cx="11.5" cy="5.5" r="1.5" />
      <circle cx="16" cy="8" r="1.5" />
      <path d="M11.7 10.2c2.7 0 4.8 2.1 4.8 4.4 0 2.1-1.6 3.4-3.7 3.4-.9 0-1.4-.4-2-.4-.6 0-1.1.4-2 .4-2.1 0-3.8-1.3-3.8-3.4 0-2.3 2-4.4 4.7-4.4Z" />
    </Icono>
  );
}

export function IconoFlechaDerecha({ className }) {
  return (
    <Icono className={className}>
      <path d="M4 12h16M13 5l7 7-7 7" />
    </Icono>
  );
}

export function IconoAlerta({ className }) {
  return (
    <Icono className={className}>
      <path d="M12 9v4M12 16.5h.01" />
      <path d="M10.3 3.9 2.7 17.5A1.6 1.6 0 0 0 4.1 20h15.8a1.6 1.6 0 0 0 1.4-2.5L13.7 3.9a1.6 1.6 0 0 0-3.4 0Z" />
    </Icono>
  );
}
