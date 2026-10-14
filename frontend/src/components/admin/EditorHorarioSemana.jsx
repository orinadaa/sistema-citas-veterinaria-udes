// components/admin/EditorHorarioSemana.jsx
// Horario de atencion de una sede, dia por dia.
import { useState } from 'react';
import { RelojHora } from '../form/RelojHora';
import { Insignia } from '../vetui';

const formatoHora = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });

function hora12(valor) {
  const [h, m] = valor.split(':').map(Number);
  return formatoHora.format(new Date(2000, 0, 1, h, m));
}

export function EditorHorarioSemana({ dias, guardandoDia, onCambiar, onGuardar, onCerrar }) {
  const [numero, setNumero] = useState(dias[0].numero);
  const [extremo, setExtremo] = useState('horaInicio'); // horaInicio | horaFin
  const [aviso, setAviso] = useState(null);
  const dia = dias.find((d) => d.numero === numero);
  const ocupado = guardandoDia === dia.numero;
  const invalido = dia.horaInicio >= dia.horaFin;

  function elegirDia(siguiente) {
    setNumero(siguiente);
    setExtremo('horaInicio');
    setAviso(null);
  }

  async function guardar() {
    setAviso(null);
    if (await onGuardar(dia)) setAviso(`Horario del ${dia.nombre.toLowerCase()} guardado.`);
  }

  async function cerrar() {
    setAviso(null);
    if (await onCerrar(dia)) setAviso(`El ${dia.nombre.toLowerCase()} quedó cerrado.`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Día de la semana" className="grid grid-cols-7 gap-1.5">
        {dias.map((d) => {
          const elegido = d.numero === numero;
          return (
            <button
              key={d.numero}
              type="button"
              role="tab"
              aria-selected={elegido}
              aria-label={`${d.nombre}: ${d.abierto ? `abre de ${hora12(d.horaInicio)} a ${hora12(d.horaFin)}` : 'cerrado'}`}
              onClick={() => elegirDia(d.numero)}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 transition duration-200 active:scale-95 motion-reduce:active:scale-100 ${
                elegido ? 'bg-brand-blue-600 text-white shadow-sm' : 'bg-white/70 text-slate-800 ring-1 ring-slate-900/10 hover:bg-white'
              }`}
            >
              <span className="text-sm font-semibold">{d.nombre.slice(0, 3)}</span>
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${d.abierto ? (elegido ? 'bg-white' : 'bg-brand-green') : elegido ? 'bg-white/40' : 'bg-slate-300'}`} />
            </button>
          );
        })}
      </div>

      {/* key: al cambiar de dia la tarjeta entra con un fundido corto. */}
      <div key={dia.numero} className="flex animate-entra-suave flex-col gap-4 rounded-2xl bg-white/70 p-4 ring-1 ring-slate-900/10 motion-reduce:animate-none">
        <div className="flex items-center justify-between gap-3">
          <p className="font-heading text-base font-semibold text-brand-navy">{dia.nombre}</p>
          <Insignia tono={dia.abierto ? 'verde' : 'gris'}>{dia.abierto ? 'Abierto' : 'Cerrado'}</Insignia>
        </div>

        {/* Que hora se esta cambiando en el reloj. */}
        <div role="radiogroup" aria-label="Hora que se cambia" className="grid grid-cols-2 gap-2">
          {[
            ['horaInicio', 'Abre'],
            ['horaFin', 'Cierra'],
          ].map(([clave, etiqueta]) => (
            <button
              key={clave}
              type="button"
              role="radio"
              aria-checked={extremo === clave}
              onClick={() => setExtremo(clave)}
              className={`flex flex-col items-start rounded-xl px-3 py-2 text-left transition duration-200 ${
                extremo === clave ? 'bg-blue-50 ring-2 ring-brand-blue' : 'bg-white ring-1 ring-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-xs font-medium text-slate-700">{etiqueta}</span>
              <span className="text-base font-semibold tabular-nums text-slate-900">{hora12(dia[clave])}</span>
            </button>
          ))}
        </div>

        {/* Un solo reloj por dia: al pasar de "Abre" a "Cierra" la manecilla gira hasta la otra hora. */}
        <RelojHora key={dia.numero} reinicio={extremo} id={`reloj-${dia.numero}`} value={dia[extremo]} onChange={(valor) => onCambiar(dia.numero, { [extremo]: valor })} />

        {invalido && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            La hora de cierre debe ser posterior a la de apertura.
          </p>
        )}
        {aviso && (
          <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
            {aviso}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          {dia.abierto && (
            <button type="button" disabled={ocupado} onClick={cerrar} className="rounded-boton bg-white px-4 py-2 text-sm font-semibold text-brand-red ring-1 ring-red-300 transition hover:bg-red-50 disabled:opacity-60">
              Cerrar este día
            </button>
          )}
          <button type="button" disabled={ocupado || invalido} onClick={guardar} className="rounded-boton bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60">
            {ocupado ? 'Guardando...' : dia.abierto ? `Guardar ${dia.nombre.toLowerCase()}` : `Abrir el ${dia.nombre.toLowerCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
