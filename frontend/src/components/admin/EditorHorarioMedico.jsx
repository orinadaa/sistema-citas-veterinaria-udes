// components/admin/EditorHorarioMedico.jsx
// Horario propio de un medico, dia por dia, con los mismos componentes del
// horario de atencion de la sede.
import { useState } from "react";
import { RelojHora } from "../form/RelojHora";
import { StatusToggle } from "../ui/StatusToggle";
import { Insignia } from "../vetui";
import { hora12, problemaDelDia } from "../../utils/horarioMedico";

const aMinutos = (valor) => {
  const [h, m] = valor.split(":").map(Number);
  return h * 60 + m;
};
const aHora = (minutos) =>
  `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;

// Pausa que se propone al agregarla: de 12 a 1 si cabe en el dia; si no, la
// hora mas cercana que quede dentro.
function pausaSugerida(d) {
  const inicio = aMinutos(d.horaInicio);
  const fin = aMinutos(d.horaFin);
  const desde = Math.max(inicio, Math.min(12 * 60, fin - 60));
  return {
    pausaInicio: aHora(desde),
    pausaFin: aHora(Math.min(desde + 60, fin)),
  };
}

const EXTREMOS = [
  ["horaInicio", "Entra"],
  ["horaFin", "Sale"],
];
const EXTREMOS_PAUSA = [
  ["pausaInicio", "Pausa desde"],
  ["pausaFin", "Pausa hasta"],
];

export function EditorHorarioMedico({ dias, semana, onCambiar }) {
  const [numero, setNumero] = useState(dias[0].dia);
  const [extremo, setExtremo] = useState("horaInicio");
  const { dia, nombre, atencion } = dias.find((d) => d.dia === numero);
  const d = semana[dia];
  const problema = problemaDelDia(d, atencion);
  // Si se quita la pausa mientras se editaba, el reloj vuelve a la entrada.
  const extremoVisible =
    !d.conPausa && extremo.startsWith("pausa") ? "horaInicio" : extremo;

  function elegirDia(siguiente) {
    setNumero(siguiente);
    setExtremo("horaInicio");
  }

  function cambiarAtiende(activo) {
    onCambiar(dia, {
      activo,
      horaInicio: d.horaInicio || atencion.inicio,
      horaFin: d.horaFin || atencion.fin,
    });
    setExtremo("horaInicio");
  }

  function alternarPausa() {
    if (d.conPausa) {
      onCambiar(dia, { conPausa: false, pausaInicio: "", pausaFin: "" });
      setExtremo("horaInicio");
    } else {
      onCambiar(dia, { conPausa: true, ...pausaSugerida(d) });
      setExtremo("pausaInicio");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Día de la semana"
        className="grid grid-cols-7 gap-1.5"
      >
        {dias.map((opcion) => {
          const elegido = opcion.dia === numero;
          const horario = semana[opcion.dia];
          const atiende = Boolean(opcion.atencion) && horario.activo;
          const lectura = !opcion.atencion
            ? "la sede no atiende"
            : atiende
              ? `atiende de ${hora12(horario.horaInicio)} a ${hora12(horario.horaFin)}`
              : "no atiende";
          return (
            <button
              key={opcion.dia}
              type="button"
              role="tab"
              aria-selected={elegido}
              aria-label={`${opcion.nombre}: ${lectura}`}
              onClick={() => elegirDia(opcion.dia)}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 transition duration-200 active:scale-95 motion-reduce:active:scale-100 ${
                elegido
                  ? "bg-brand-blue-600 text-white shadow-sm"
                  : "bg-white/70 text-slate-800 ring-1 ring-slate-900/10 hover:bg-white"
              }`}
            >
              <span className="text-sm font-semibold">
                {opcion.nombre.slice(0, 3)}
              </span>
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${atiende ? (elegido ? "bg-white" : "bg-brand-green") : elegido ? "bg-white/40" : "bg-slate-300"}`}
              />
            </button>
          );
        })}
      </div>

      {/* key: al cambiar de dia la tarjeta entra con un fundido corto. */}
      <div
        key={dia}
        className="flex animate-entra-suave flex-col gap-4 rounded-2xl bg-white/70 p-4 ring-1 ring-slate-900/10 motion-reduce:animate-none"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="font-heading text-base font-semibold text-brand-navy">
            {nombre}
          </p>
          <Insignia tono={atencion && d.activo ? "verde" : "gris"}>
            {!atencion ? "Sede cerrada" : d.activo ? "Atiende" : "No atiende"}
          </Insignia>
        </div>

        {!atencion ? (
          <p className="text-sm text-slate-700">
            La sede no atiende este día, así que el médico tampoco. Para
            abrirlo, cambia primero el horario de la sede.
          </p>
        ) : (
          <>
            <StatusToggle
              checked={d.activo}
              onChange={cambiarAtiende}
              label="Atiende este día"
              helpText={`La sede atiende de ${hora12(atencion.inicio)} a ${hora12(atencion.fin)}`}
            />

            {d.activo && (
              <>
                {/* Que hora se esta cambiando en el reloj. */}
                <div
                  role="radiogroup"
                  aria-label="Hora que se cambia"
                  className="grid grid-cols-2 gap-2"
                >
                  {[...EXTREMOS, ...(d.conPausa ? EXTREMOS_PAUSA : [])].map(
                    ([clave, etiqueta]) => (
                      <button
                        key={clave}
                        type="button"
                        role="radio"
                        aria-checked={extremoVisible === clave}
                        onClick={() => setExtremo(clave)}
                        className={`flex flex-col items-start rounded-xl px-3 py-2 text-left transition duration-200 ${
                          extremoVisible === clave
                            ? "bg-blue-50 ring-2 ring-brand-blue"
                            : "bg-white ring-1 ring-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xs font-medium text-slate-700">
                          {etiqueta}
                        </span>
                        <span className="text-base font-semibold tabular-nums text-slate-900">
                          {hora12(d[clave])}
                        </span>
                      </button>
                    ),
                  )}
                </div>

                {/* Un solo reloj por dia: al pasar de una hora a otra la manecilla gira hasta ella. */}
                <RelojHora
                  key={dia}
                  reinicio={extremoVisible}
                  id={`reloj-medico-${dia}`}
                  value={d[extremoVisible]}
                  onChange={(valor) =>
                    onCambiar(dia, { [extremoVisible]: valor })
                  }
                />

                {problema && (
                  <p
                    role="alert"
                    className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200"
                  >
                    {problema}
                  </p>
                )}

                <button
                  type="button"
                  onClick={alternarPausa}
                  className="self-start rounded-boton bg-white px-4 py-2 text-sm font-semibold text-brand-blue-700 ring-1 ring-slate-300 transition hover:bg-slate-50"
                >
                  {d.conPausa ? "Quitar la pausa" : "Agregar una pausa"}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
