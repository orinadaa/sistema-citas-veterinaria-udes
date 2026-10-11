// components/medico/DetalleCitaMedicoPanel.jsx
// Detalle de una cita en el panel del medico (solo lectura): mascota con
// su perfil e informacion medica que escribio el dueño, datos de la cita
// y contacto del dueño. El medico no reprograma ni cancela citas (eso
// es del cliente, RF-08/RF-09). `acciones` (opcional) agrega botones al
// pie (ej. "Crear recordatorio").
import { formatearFechaLarga, formatearHora } from '../../utils/fecha';
import { edadYPeso } from '../../utils/mascota';
import { SidePanel } from '../ui/SidePanel';
import { StatusBadge } from '../ui/StatusBadge';
import { CategoryBadge } from '../ui/CategoryBadge';
import { estadoDeCita } from '../citas/DetalleCitaPanel';
import { AvatarMascota } from '../cliente/AvatarMascota';
import { IconoCalendario, IconoCorreo, IconoDocumento, IconoEstetoscopio, IconoPersona, IconoUbicacion } from '../icons';
import { ETIQUETA_SEXO } from '../../utils/sexo';
import { EtiquetaSexo } from '../ui/EtiquetaSexo';

function Fila({ icono: Icono, etiqueta, valor, detalle }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F1FD] text-brand-blue-600">
        <Icono className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">{etiqueta}</p>
        <p className="font-semibold text-slate-900">{valor}</p>
        {detalle && <div className="text-sm text-slate-500">{detalle}</div>}
      </div>
    </div>
  );
}

export function DetalleCitaMedicoPanel({ cita, onClose, acciones }) {
  const infoMedica = cita
    ? [
        ['Alergias', cita.mascota_alergias],
        ['Medicamentos', cita.mascota_medicamentos],
        ['Condiciones médicas', cita.mascota_condiciones_medicas],
        ['Observaciones', cita.mascota_observaciones],
      ].filter(([, valor]) => valor)
    : [];
  const mascota = cita
    ? { nombre: cita.mascota_nombre, foto_url: cita.mascota_foto_url, fecha_nacimiento: cita.mascota_fecha_nacimiento, peso_kg: cita.mascota_peso_kg }
    : null;

  return (
    <SidePanel isOpen={Boolean(cita)} onClose={onClose} title="Detalle de la cita" footer={cita && acciones ? acciones(cita) : undefined}>
      {cita && (
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <AvatarMascota mascota={mascota} className="h-16 w-16" iconoClassName="h-7 w-7" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-heading text-lg font-bold text-brand-navy">{cita.mascota_nombre}</p>
                <StatusBadge status={estadoDeCita(cita)} />
              </div>
              <p className="text-sm font-medium text-brand-blue-600">{[cita.mascota_especie, cita.mascota_raza].filter(Boolean).join(' · ')}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-slate-500">
                <EtiquetaSexo sexo={cita.mascota_sexo} />
                {ETIQUETA_SEXO[cita.mascota_sexo] && edadYPeso(mascota) && <span aria-hidden="true">·</span>}
                {edadYPeso(mascota)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-5">
            <p className="font-heading text-base font-bold text-slate-900">Cita #{cita.codigo}</p>
            <CategoryBadge nombre={cita.categoria_nombre} color={cita.categoria_color} />
          </div>

          <div className="flex flex-col gap-5">
            <Fila icono={IconoCalendario} etiqueta="Fecha y hora" valor={formatearFechaLarga(cita.fecha_hora)} detalle={formatearHora(cita.fecha_hora)} />
            <Fila
              icono={IconoEstetoscopio}
              etiqueta="Servicio"
              valor={cita.servicio_nombre}
              detalle={cita.servicio_duracion_minutos ? `Duración estimada: ${cita.servicio_duracion_minutos} min` : undefined}
            />
            <Fila icono={IconoUbicacion} etiqueta="Sede" valor={cita.sede_nombre} />
            <Fila
              icono={IconoPersona}
              etiqueta="Dueño"
              valor={cita.cliente_nombre}
              detalle={
                <>
                  {cita.cliente_telefono && <span className="block">{cita.cliente_telefono}</span>}
                  {cita.cliente_correo && (
                    <a href={`mailto:${cita.cliente_correo}`} className="inline-flex items-center gap-1 text-brand-blue hover:underline">
                      <IconoCorreo className="h-3.5 w-3.5" />
                      {cita.cliente_correo}
                    </a>
                  )}
                </>
              }
            />
          </div>

          {cita.motivo && (
            <div className="flex items-start gap-3 border-t border-slate-100 pt-5">
              <IconoDocumento className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
              <div>
                <p className="text-xs font-medium text-slate-400">Motivo de la consulta</p>
                <p className="text-sm text-slate-700">{cita.motivo}</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-[#EEF6FD] p-4">
            <p className="font-heading text-sm font-semibold text-brand-navy">Información médica (según el dueño)</p>
            {infoMedica.length === 0 ? (
              <p className="mt-1 text-sm text-slate-500">El dueño no registró alergias, medicamentos ni condiciones.</p>
            ) : (
              <dl className="mt-2 flex flex-col gap-2">
                {infoMedica.map(([etiqueta, valor]) => (
                  <div key={etiqueta}>
                    <dt className="text-xs font-medium text-slate-500">{etiqueta}</dt>
                    <dd className="text-sm text-slate-800">{valor}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      )}
    </SidePanel>
  );
}
