// components/ui/StatusToggle.jsx
// Toggle estandar de "activo/inactivo" en todo el sistema: verde
// encendido, gris apagado (decision de diseno, ver el alcance del proyecto/mockups:
// se estandariza en verde para evitar el azul, que queda solo para
// elementos interactivos/de navegacion).
export function StatusToggle({ checked, onChange, label, helpText, disabled = false }) {
  return (
    <label className={`flex items-center gap-3 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-brand-green' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
      {(label || helpText) && (
        <span className="flex flex-col">
          {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
          {helpText && <span className="text-xs text-slate-400">{helpText}</span>}
        </span>
      )}
    </label>
  );
}
