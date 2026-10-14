// components/form/Campo.jsx
// Bloque de formulario consistente: label arriba, input, error debajo.
import { useState } from 'react';
import { IconoOjo, IconoOjoTachado } from '../icons';

export function Campo({ id, label, error, type = 'text', required, ...resto }) {
  const [mostrarClave, setMostrarClave] = useState(false);
  const esClave = type === 'password';
  const tipoInput = esClave && mostrarClave ? 'text' : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={tipoInput}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`campo w-full px-3 py-2 text-sm ${esClave ? 'pr-10' : ''}`}
          {...resto}
        />
        {esClave && (
          <button
            type="button"
            onClick={() => setMostrarClave((valor) => !valor)}
            tabIndex={-1}
            aria-label={mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-600"
          >
            {mostrarClave ? <IconoOjoTachado className="h-4 w-4" /> : <IconoOjo className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
