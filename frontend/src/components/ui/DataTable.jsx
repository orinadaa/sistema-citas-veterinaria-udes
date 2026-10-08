// components/ui/DataTable.jsx
// Tabla generica con paginacion ("Mostrando X - Y de Z"). `columns` es
// [{ header, render(fila) }]; `actions`, si se pasa, agrega una columna
// final con render(fila) para los botones de accion.
import { useEffect, useState } from 'react';

const FILAS_POR_PAGINA = 8;

export function DataTable({ columns, rows, actions, filaVacia = 'No hay resultados.' }) {
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    setPagina(1);
  }, [rows.length]);

  const totalPaginas = Math.max(1, Math.ceil(rows.length / FILAS_POR_PAGINA));
  const inicio = (pagina - 1) * FILAS_POR_PAGINA;
  const filasVisibles = rows.slice(inicio, inicio + FILAS_POR_PAGINA);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {columns.map((columna) => (
                <th key={columna.header} className="px-4 py-3">
                  {columna.header}
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filasVisibles.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-sm text-slate-400">
                  {filaVacia}
                </td>
              </tr>
            ) : (
              filasVisibles.map((fila) => (
                <tr key={fila.id} className="hover:bg-slate-50/60">
                  {columns.map((columna) => (
                    <td key={columna.header} className="px-4 py-3 align-middle text-slate-700">
                      {columna.render(fila)}
                    </td>
                  ))}
                  {actions && <td className="px-4 py-3 text-right align-middle">{actions(fila)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span>
            Mostrando {inicio + 1} - {Math.min(inicio + FILAS_POR_PAGINA, rows.length)} de {rows.length}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={pagina === 1}
              onClick={() => setPagina((p) => p - 1)}
              className="boton-texto rounded-boton px-2.5 py-1 font-medium text-slate-600 transition disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={pagina === totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
              className="boton-texto rounded-boton px-2.5 py-1 font-medium text-slate-600 transition disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
