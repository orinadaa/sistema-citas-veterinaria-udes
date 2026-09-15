// components/form/Campo.jsx
// Bloque de formulario consistente: label arriba, input, error debajo.
export function Campo({ id, label, error, type = 'text', ...resto }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
          error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
        }`}
        {...resto}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
