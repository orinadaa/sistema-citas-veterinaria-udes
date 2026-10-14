// components/ui/StatusToggle.jsx
// Toggle estandar de "activo/inactivo" en todo el sistema: verde encendido,
// gris apagado.
import { useState } from 'react';

export function StatusToggle({ checked, onChange, label, helpText, disabled = false, ariaLabel = 'Activo' }) {
  // Si el cambio se guarda en el servidor y falla, se dice aqui mismo.
  const [fallo, setFallo] = useState('');
  async function cambiar() {
    setFallo('');
    try {
      await onChange(!checked);
    } catch (err) {
      setFallo(err?.message || 'No se pudo guardar el cambio.');
    }
  }

  return (
    <label className={`flex items-center gap-3 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ? undefined : ariaLabel}
        disabled={disabled}
        onClick={cambiar}
        className={`relative h-6 w-11 shrink-0 rounded-full transition before:absolute before:-inset-2.5 before:content-[''] ${
          checked ? 'bg-brand-green' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
      {(label || helpText || fallo) && (
        <span className="flex flex-col">
          {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
          {helpText && <span className="text-xs text-slate-400">{helpText}</span>}
          {fallo && (
            <span role="alert" className="text-xs font-medium text-red-700">
              {fallo}
            </span>
          )}
        </span>
      )}
    </label>
  );
}
