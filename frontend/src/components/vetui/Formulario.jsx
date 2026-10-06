// components/vetui/Formulario.jsx
// Campos de vetUI para superficies de vidrio (sobre fondo oscuro): el
// campo es casi blanco con texto oscuro (los datos siempre se leen oscuro
// sobre claro) y la etiqueta es blanca. Foco: anillo ámbar.
// Dentro de paneles laterales (cristal fuerte) se usan los campos de
// form/Campo.jsx, que ya son oscuros sobre claro.
export function Etiqueta({ htmlFor, children, requerido }) {
  return (
    <label htmlFor={htmlFor} className="vt-etiqueta text-sm font-semibold text-white">
      {children}
      {requerido && (
        <span className="ml-0.5 text-amber-300" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

export function CampoTexto({ id, etiqueta, requerido, className = '', ...resto }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Etiqueta htmlFor={id} requerido={requerido}>
        {etiqueta}
      </Etiqueta>
      <input id={id} name={id} required={requerido} className={`campo-vetui px-3.5 py-2.5 text-sm ${className}`} {...resto} />
    </div>
  );
}

export function AreaTexto({ id, etiqueta, requerido, className = '', ...resto }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Etiqueta htmlFor={id} requerido={requerido}>
        {etiqueta}
      </Etiqueta>
      <textarea id={id} name={id} required={requerido} className={`campo-vetui px-3.5 py-2.5 text-sm ${className}`} {...resto} />
    </div>
  );
}
