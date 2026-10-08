// components/form/ReenviarCodigo.jsx
// Pie del campo de codigo (CampoCodigo): mientras corre la cuenta regresiva
// muestra "Reenviar código en 00:42" como texto (no es clicable, asi que no
// reacciona al cursor); al terminar aparece el boton "Reenviar código".
// `cuenta` es lo que devuelve useCuentaRegresiva.
export function ReenviarCodigo({ cuenta, onReenviar, disabled = false, className = '' }) {
  if (cuenta.restantes > 0) {
    return (
      <p className={`text-sm text-slate-600 ${className}`} aria-live="off">
        Reenviar código en <span className="font-semibold tabular-nums text-slate-800">{cuenta.texto}</span>
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={onReenviar}
      disabled={disabled}
      className={`boton-texto text-sm font-semibold text-brand-blue transition disabled:opacity-50 ${className}`}
    >
      Reenviar código
    </button>
  );
}
