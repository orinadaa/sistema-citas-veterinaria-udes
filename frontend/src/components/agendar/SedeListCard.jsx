// components/agendar/SedeListCard.jsx
// Tarjeta de sede en formato lista (no grid) para el paso "Selecciona la
// sede": foto, badge "Sede principal", direccion, horario real
// (horario_atencion, RF-13) y amenidades. Las amenidades salen de datos
// reales: parqueadero y sala pet friendly las marca el administrador en
// Sedes; "especialidades" es el conteo de servicios que prestan los
// medicos de la sede (sede.model.js#listarTodas).
// Material: Tarjeta de cristal de vetUI (interactiva, seleccionable).
import { agruparHorario } from '../../utils/horarioTexto';
import { Insignia, Tarjeta } from '../vetui';
import { IconoCarro, IconoEstetoscopio, IconoPata, IconoReloj, IconoSede, IconoUbicacion } from '../icons';

function Amenidad({ icono: Icono, texto }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-boton bg-white/75 px-2.5 py-1 text-xs font-medium text-slate-700">
      <Icono className="h-3.5 w-3.5" />
      {texto}
    </span>
  );
}

export function SedeListCard({ sede, horario, seleccionada, onSeleccionar }) {
  const lineasHorario = horario ? agruparHorario(horario) : [];

  return (
    <Tarjeta
      as="button"
      type="button"
      onClick={onSeleccionar}
      aria-pressed={seleccionada}
      interactiva
      seleccionada={seleccionada}
      className="flex w-full flex-col gap-4 p-4 sm:flex-row"
    >

      {sede.foto_url ? (
        <img src={sede.foto_url} alt={sede.nombre} className="h-28 w-full shrink-0 rounded-xl object-cover sm:h-24 sm:w-32" />
      ) : (
        <span className="flex h-28 w-full shrink-0 items-center justify-center rounded-xl bg-blue-100 text-brand-blue-700 sm:h-24 sm:w-32">
          <IconoSede className="h-8 w-8" peso="duotone" />
        </span>
      )}

      <div className="min-w-0 flex-1 pr-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-slate-900">{sede.nombre}</p>
          {sede.es_principal && (
            <Insignia tono="ambar">Sede principal</Insignia>
          )}
        </div>

        <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-700">
          <IconoUbicacion className="mt-0.5 h-4 w-4 shrink-0" />
          {sede.direccion ? `${sede.direccion}, ${sede.ciudad}` : sede.ciudad}
        </p>

        <div className="mt-1 flex items-start gap-1.5 text-sm text-slate-700">
          <IconoReloj className="mt-0.5 h-4 w-4 shrink-0" />
          {horario === undefined ? (
            <span className="h-4 w-40 animate-pulse rounded bg-slate-300/60" />
          ) : lineasHorario.length === 0 ? (
            <span>Sin horario de atención configurado</span>
          ) : (
            <span>{lineasHorario.join(' · ')}</span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {sede.tiene_parqueadero && <Amenidad icono={IconoCarro} texto="Parqueadero" />}
          {sede.sala_pet_friendly && <Amenidad icono={IconoPata} texto="Sala de espera pet friendly" />}
          <Amenidad
            icono={IconoEstetoscopio}
            texto={`${sede.servicios_ofrecidos} ${sede.servicios_ofrecidos === 1 ? 'especialidad' : 'especialidades'}`}
          />
        </div>
      </div>
    </Tarjeta>
  );
}
