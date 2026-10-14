// components/citas/DetalleCitaPanel.jsx
// Detalle de una cita en "Mis citas" del panel del cliente, con reprogramar
// (RF-08) y cancelar (RF-09) cuando esta activa y es futura.
import { useCallback, useEffect, useState } from 'react';
import { reprogramarCita, cancelarCita, obtenerHorarios } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { aFechaLocal, formatearFechaLarga, formatearFechaCorta, formatearHora } from '../../utils/fecha';
import { formatearCOP } from '../../utils/moneda';
import { PanelLateral } from '../vetui';
import { StatusBadge } from '../ui/StatusBadge';
import { ReprogramarCitaModal } from './ReprogramarCitaModal';
import { AvatarMascota } from '../cliente/AvatarMascota';
import {
  IconoCalendario,
  IconoCheck,
  IconoDocumento,
  IconoEscudo,
  IconoEstetoscopio,
  IconoPapelera,
  IconoPersona,
  IconoPeso,
  IconoUbicacion,
} from '../icons';

import { ETIQUETA_SEXO } from '../../utils/sexo';
import { IconoSexo } from '../ui/EtiquetaSexo';

// Recomendaciones fijas que se muestran en el detalle de la cita.
const RECOMENDACIONES = [
  'Llega 10 minutos antes de la hora programada.',
  'Trae el carnet de vacunas de tu mascota.',
  'Si tu mascota toma algún medicamento, infórmanos.',
  'Mantén a tu mascota con correa o en guacal.',
];

export function estadoDeCita(cita) {
  if (cita.estado === 'cancelada') return 'cancelada';
  if (cita.estado === 'por_reagendar') return 'por_reagendar';
  return new Date(cita.fecha_hora) > new Date() ? 'proxima' : 'completada';
}

// Fila de "Informacion de la cita": icono en chip circular azul claro,
// etiqueta gris, valor en negrita, subtexto y accion opcional a la derecha.
function FilaInfo({ icono: Icono, etiqueta, valor, detalle, accion }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F1FD] text-brand-blue-600">
        <Icono className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-400">{etiqueta}</p>
        <p className="font-semibold text-slate-900">{valor}</p>
        {detalle && <div className="mt-0.5 text-sm text-slate-500">{detalle}</div>}
      </div>
      {accion && <div className="shrink-0">{accion}</div>}
    </div>
  );
}

// Boton outline azul de una fila (boton, o enlace externo si trae href).
function BotonFila({ icono: Icono, onClick, href, children }) {
  const clase =
    'inline-flex items-center gap-1.5 rounded-boton border border-brand-blue px-3 py-1.5 text-xs font-semibold text-brand-blue-600 transition hover:bg-blue-50';
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={clase}>
        <Icono className="h-3.5 w-3.5" />
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={clase}>
      <Icono className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

export function DetalleCitaPanel({ cita, onClose, onActualizada }) {
  const { token } = useAuth();
  const [modo, setModo] = useState('vista');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaFranja, setNuevaFranja] = useState(null);
  // Dias de la semana en que atiende la sede de la cita (para deshabilitar
  // los demas en el calendario); null mientras carga o si falla.
  const [diasAbiertos, setDiasAbiertos] = useState({ sedeId: null, dias: null });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setModo('vista');
    setNuevaFecha('');
    setNuevaFranja(null);
    setError('');
  }, [cita?.id]);

  const sedeId = cita?.sede_id;
  useEffect(() => {
    if (modo !== 'reprogramar' || !sedeId) return undefined;
    let vigente = true;
    obtenerHorarios(sedeId)
      .then((datos) => vigente && setDiasAbiertos({ sedeId, dias: new Set(datos.horario.map((h) => h.dia_semana)) }))
      .catch(() => vigente && setDiasAbiertos({ sedeId, dias: null }));
    return () => {
      vigente = false;
    };
  }, [modo, sedeId]);

  // El calendario abre en el mes de la cita, con su dia ya elegido (si la
  // cita esta por reagendar, sin dia: su fecha original ya no sirve).
  function abrirReprogramar() {
    setNuevaFecha(cita.estado === 'por_reagendar' ? '' : aFechaLocal(new Date(cita.fecha_hora)));
    setNuevaFranja(null);
    setError('');
    setModo('reprogramar');
  }

  const cerrarReprogramar = useCallback(() => {
    setModo('vista');
    setNuevaFecha('');
    setNuevaFranja(null);
    setError('');
  }, []);

  async function confirmarReprogramacion() {
    if (!nuevaFranja) return;
    setEnviando(true);
    setError('');
    try {
      await reprogramarCita(cita.id, nuevaFranja, token);
      onActualizada(cita.estado === 'por_reagendar' ? 'Tu cita quedó reagendada.' : 'Tu cita quedó reprogramada.');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarCancelacion() {
    setEnviando(true);
    setError('');
    try {
      await cancelarCita(cita.id, token);
      onActualizada('Tu cita fue cancelada. La encuentras en Canceladas.');
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  const estado = cita ? estadoDeCita(cita) : null;
  const porReagendar = estado === 'por_reagendar';
  const puedeGestionar = estado === 'proxima' || porReagendar;

  // Pie fijo: solo "Cancelar cita" (Reprogramar vive en la fila de Fecha
  // y hora, y abre su propia ventana: ReprogramarCitaModal). Ocupa todo el ancho: con un unico boton, alineado a la
  // izquierda dejaba un hueco que se leia como un boton faltante.
  let footer = null;
  if (cita && puedeGestionar && modo !== 'confirmarCancelar') {
    footer = (
      <button
        type="button"
        onClick={() => setModo('confirmarCancelar')}
        className="inline-flex w-full items-center justify-center gap-2 rounded-boton border border-brand-red px-4 py-2.5 text-sm font-semibold text-brand-red transition hover:bg-red-50"
      >
        <IconoPapelera className="h-4 w-4" />
        Cancelar cita
      </button>
    );
  } else if (cita && modo === 'confirmarCancelar') {
    footer = (
      <div className="flex gap-3">
        <button
          type="button"
          disabled={enviando}
          onClick={confirmarCancelacion}
          className="flex-1 rounded-boton bg-brand-red px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? 'Cancelando...' : 'Sí, cancelar'}
        </button>
        <button
          type="button"
          onClick={() => setModo('vista')}
          className="rounded-boton border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          No, mantenerla
        </button>
      </div>
    );
  }

  const direccionSede = cita?.sede_direccion ? `${cita.sede_direccion}, ${cita.sede_ciudad}` : cita?.sede_ciudad;
  // "Ver en mapa": hipervinculo de salida a Google Maps (sin mapa
  // embebido, mismo criterio que el flujo de agendamiento).
  const urlMapa = cita
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [cita.sede_nombre, cita.sede_direccion, cita.sede_ciudad, 'Colombia'].filter(Boolean).join(', ')
      )}`
    : '';

  return (
    <>
    <PanelLateral isOpen={Boolean(cita)} onClose={onClose} title="Detalle de la cita" footer={footer}>
      {cita && (
        <div className="flex flex-col gap-6">
          {/* 2. Resumen de la mascota: foto grande y centrada */}
          <div className="flex flex-col items-center gap-3 text-center">
            <AvatarMascota
              mascota={{ nombre: cita.mascota_nombre, foto_url: cita.mascota_foto_url }}
              className="h-32 w-32 shadow-lg ring-4 ring-white"
              iconoClassName="h-14 w-14"
            />
            <div className="w-full min-w-0">
              <div className="flex flex-col items-center gap-2">
                <p className="truncate font-heading text-lg font-bold text-brand-navy">{cita.mascota_nombre}</p>
                <StatusBadge status={estado} />
              </div>
              {(cita.mascota_especie || cita.mascota_raza) && (
                <p className="text-sm font-medium text-brand-blue-600">
                  {[cita.mascota_especie, cita.mascota_raza].filter(Boolean).join(' · ')}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-slate-600">
                {cita.mascota_sexo && (
                  <span className="inline-flex items-center gap-1">
                    <IconoSexo sexo={cita.mascota_sexo} className="h-4 w-4 text-brand-blue" />
                    {ETIQUETA_SEXO[cita.mascota_sexo] ?? cita.mascota_sexo}
                  </span>
                )}
                {cita.mascota_peso_kg && (
                  <span className="inline-flex items-center gap-1">
                    <IconoPeso className="h-3.5 w-3.5 text-brand-blue" />
                    {Number(cita.mascota_peso_kg)} kg
                  </span>
                )}
                {cita.mascota_color && (
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slate-300" />
                    {cita.mascota_color}
                  </span>
                )}
              </div>
            </div>
          </div>

          {porReagendar && (
            <div role="alert" className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-300">
              <p className="font-heading text-sm font-semibold text-amber-900">Debes reagendar esta cita</p>
              <p className="mt-1 text-sm text-amber-900">
                {cita.motivo_reagendar || 'Por un cambio en el horario de la clínica'}, la cita ya no se puede atender en su fecha original.
                {cita.reagendar_hasta && ` Elige una fecha nueva antes del ${formatearFechaLarga(cita.reagendar_hasta)}, ${formatearHora(cita.reagendar_hasta)}; si no, se cancelará.`}
              </p>
              <button
                type="button"
                onClick={abrirReprogramar}
                className="mt-3 inline-flex items-center gap-2 rounded-boton bg-brand-amber px-4 py-2 text-sm font-semibold text-slate-900 transition hover:brightness-95"
              >
                <IconoCalendario className="h-4 w-4" />
                Reagendar ahora
              </button>
            </div>
          )}

          {/* 3. Numero de cita */}
          <div className="border-t border-slate-100 pt-5">
            <p className="font-heading text-base font-bold text-slate-900">Cita #{cita.codigo}</p>
            {cita.creado_en && <p className="text-sm text-slate-400">Agendada el {formatearFechaCorta(cita.creado_en)}</p>}
          </div>

          {/* 4. Informacion de la cita */}
          <div className="flex flex-col gap-5">
            <p className="font-heading text-sm font-semibold uppercase tracking-wide text-slate-400">Información de la cita</p>

            <FilaInfo
              icono={IconoCalendario}
              etiqueta="Fecha y hora"
              valor={formatearFechaLarga(cita.fecha_hora)}
              detalle={formatearHora(cita.fecha_hora)}
              accion={
                puedeGestionar && (
                  <BotonFila icono={IconoCalendario} onClick={abrirReprogramar}>
                    {porReagendar ? 'Reagendar' : 'Reprogramar'}
                  </BotonFila>
                )
              }
            />

            <FilaInfo
              icono={IconoEstetoscopio}
              etiqueta="Servicio"
              valor={cita.servicio_nombre}
              detalle={
                <>
                  {cita.servicio_descripcion && <span className="block">{cita.servicio_descripcion}</span>}
                  {cita.servicio_precio != null && (
                    <span className="block font-medium text-slate-600">Valor: {formatearCOP(cita.servicio_precio)} COP</span>
                  )}
                </>
              }
            />

            <div className="flex flex-col gap-3">
              <FilaInfo
                icono={IconoUbicacion}
                etiqueta="Sede"
                valor={cita.sede_nombre}
                detalle={direccionSede}
                accion={
                  <BotonFila icono={IconoUbicacion} href={urlMapa}>
                    Ver en mapa
                  </BotonFila>
                }
              />
              {cita.sede_foto_url && (
                <img src={cita.sede_foto_url} alt={`Fachada de ${cita.sede_nombre}`} className="h-36 w-full rounded-xl object-cover" />
              )}
            </div>

            <FilaInfo icono={IconoPersona} etiqueta="Médico veterinario" valor={cita.medico_nombre} detalle={cita.medico_especialidad} />
          </div>

          {/* 5. Motivo (las "notas adicionales" no existen en el sistema: no se muestran) */}
          {cita.motivo && (
            <div className="flex items-start gap-3 border-t border-slate-100 pt-5">
              <IconoDocumento className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
              <div>
                <p className="text-xs font-medium text-slate-400">Motivo de la consulta</p>
                <p className="text-sm text-slate-700">{cita.motivo}</p>
              </div>
            </div>
          )}

          {/* 6. Recomendaciones */}
          <div className="rounded-2xl bg-[#EEF6FD] p-5">
            <p className="flex items-center gap-2 font-heading text-sm font-semibold text-brand-navy">
              <IconoEscudo className="h-5 w-5 text-brand-blue" />
              Recomendaciones para tu cita
            </p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {RECOMENDACIONES.map((texto) => (
                <li key={texto} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white">
                    <IconoCheck className="h-3 w-3" />
                  </span>
                  {texto}
                </li>
              ))}
            </ul>
          </div>

          {modo === 'confirmarCancelar' && (
            <div className="rounded-xl bg-red-50 p-4 ring-1 ring-red-200">
              <p className="text-sm font-medium text-red-800">¿Seguro que quieres cancelar esta cita?</p>
              {error && (
                <p role="alert" className="mt-2 text-sm text-red-700">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </PanelLateral>

    <ReprogramarCitaModal
      abierto={modo === 'reprogramar'}
      cita={cita}
      onCerrar={cerrarReprogramar}
      onConfirmar={confirmarReprogramacion}
      fecha={nuevaFecha}
      onCambiarFecha={setNuevaFecha}
      franja={nuevaFranja}
      onCambiarFranja={setNuevaFranja}
      diasAbiertos={cita && diasAbiertos.sedeId === cita.sede_id ? diasAbiertos.dias : null}
      enviando={enviando}
      error={error}
    />
    </>
  );
}
