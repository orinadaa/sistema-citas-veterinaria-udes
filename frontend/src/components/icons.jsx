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

export function IconoEstetica({ className }) {
  return (
    <Icono className={className}>
      <path d="M12 3c1.5 2 1.5 4-.3 5.4C13.5 9.6 15 11.6 15 14a3 3 0 1 1-6 0c0-2.4 1.5-4.4 3.3-5.6C10.5 7 10.5 5 12 3Z" />
      <path d="M9 20h6" />
    </Icono>
  );
}

export function IconoHospitalizacion({ className }) {
  return (
    <Icono className={className}>
      <rect x="3" y="6" width="18" height="13" rx="1.5" />
      <path d="M12 9.5v6M9 12.5h6M3 6l4-3h10l4 3" />
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
