// components/vetui/Boton.jsx
// Botón de vetUI. La jerarquía va por variante, no por tamaño:
//   primario      ámbar glass. La acción principal de la pantalla (una
//                 sola por vista: Agendar cita, Continuar, Guardar).
//   secundario    vidrio claro. Acciones secundarias sobre fondo oscuro.
//   inverso       blanco glass. La principal sobre una banda azul.
//   contorno      borde azul. Secundaria sobre cristal (superficie clara).
//   peligro       rojo translúcido. Salir/cancelar sobre fondo oscuro.
//   peligro-claro borde rojo. Salir/cancelar sobre cristal.
//   fantasma      solo texto, para acciones terciarias.
// `as` permite usarlo como Link o <a> sin perder el estilo. `icono` va
// antes del texto e `iconoFinal` después (ej. flecha de "Continuar").
const VARIANTES = {
  primario: 'boton-glass-ambar text-slate-900',
  secundario: 'boton-glass-claro text-white',
  inverso: 'boton-glass-blanco text-brand-blue-700',
  contorno: 'boton-contorno',
  peligro: 'boton-peligro',
  'peligro-claro': 'boton-peligro-claro',
  fantasma: 'text-current underline-offset-4 hover:underline',
};

const TAMANOS = {
  sm: 'px-3.5 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  icono: 'p-2',
};

export function Boton({
  variante = 'primario',
  tamano = 'md',
  as: Componente = 'button',
  icono: Icono,
  iconoFinal: IconoFinal,
  className = '',
  children,
  ...resto
}) {
  const props = Componente === 'button' ? { type: 'button', ...resto } : resto;
  return (
    <Componente
      className={`inline-flex items-center justify-center gap-2 rounded-boton font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
        VARIANTES[variante] ?? VARIANTES.primario
      } ${TAMANOS[tamano] ?? TAMANOS.md} ${className}`}
      {...props}
    >
      {Icono && <Icono className="h-4 w-4 shrink-0" />}
      {children}
      {IconoFinal && <IconoFinal className="h-4 w-4 shrink-0" />}
    </Componente>
  );
}
