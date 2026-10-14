// components/agendar/PaginaConfirmacion.jsx
// Pagina 3 del flujo de agendamiento (hito 5): la cita ya quedo creada.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { reenviarConfirmacionCita } from '../../api/client';
import { Boton, Superficie } from '../vetui';
import { useAuth } from '../../context/AuthContext';
import { formatearFechaLarga, formatearHora } from '../../utils/fecha';
import { especieYRaza } from '../../utils/mascota';
import { IconoCalendario, IconoCampana, IconoCheck, IconoCorreo, IconoEstetoscopio, IconoLapiz, IconoPata, IconoPersona, IconoUbicacion } from '../icons';

function Dato({ icono: Icono, etiqueta, valor, detalle }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-brand-blue-700">
        <Icono className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-700">{etiqueta}</p>
        <p className="font-semibold text-slate-900">{valor}</p>
        {detalle && <p className="text-sm text-slate-700">{detalle}</p>}
      </div>
    </div>
  );
}

function PasoSiguiente({ icono: Icono, titulo, descripcion, completado, ultimo }) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!ultimo && <span aria-hidden="true" className="absolute left-5 top-10 h-[calc(100%-2.5rem)] w-0.5 bg-slate-200" />}
      <span
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          completado ? 'bg-brand-green text-white' : 'border-2 border-slate-300 bg-white text-slate-600'
        }`}
      >
        {completado ? <IconoCheck className="h-5 w-5" /> : <Icono className="h-5 w-5" />}
      </span>
      <div className="pt-1">
        <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
          {titulo}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              completado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {completado ? 'Completado' : 'Pendiente'}
          </span>
        </p>
        <p className="mt-0.5 text-sm text-slate-700">{descripcion}</p>
      </div>
    </li>
  );
}

export function PaginaConfirmacion({ cita, correoEnviado: correoEnviadoInicial, onAgendarOtra }) {
  const { token } = useAuth();
  const [correoEnviado, setCorreoEnviado] = useState(correoEnviadoInicial);
  const [reenviando, setReenviando] = useState(false);
  const [mensajeCorreo, setMensajeCorreo] = useState({ tipo: '', texto: '' });

  async function reenviar() {
    setReenviando(true);
    setMensajeCorreo({ tipo: '', texto: '' });
    try {
      const respuesta = await reenviarConfirmacionCita(cita.id, token);
      setCorreoEnviado(true);
      setMensajeCorreo({ tipo: 'ok', texto: respuesta.mensaje });
    } catch (err) {
      setMensajeCorreo({ tipo: 'error', texto: err.message });
    } finally {
      setReenviando(false);
    }
  }

  const mascota = {
    especie: cita.mascota_especie,
    raza: cita.mascota_raza,
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Superficie tono="blanco" className="text-center sm:p-8">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <IconoCheck className="h-9 w-9" />
        </span>
        <h2 className="mt-4 text-2xl font-bold text-brand-navy">¡Tu cita ha sido agendada!</h2>
        <p className="mt-2 inline-block rounded-boton bg-blue-100 px-4 py-1.5 font-mono text-sm font-semibold text-brand-blue-800">
          Cita #{cita.codigo}
        </p>

        <div className="mt-4 flex flex-col items-center gap-2 text-sm">
          {correoEnviado ? (
            <p className="flex items-center gap-2 text-slate-700">
              <IconoCorreo className="h-4 w-4 text-brand-blue-700" />
              Te hemos enviado un correo de confirmación a <span className="font-medium">{cita.cliente_correo}</span>
            </p>
          ) : (
            <p className="flex items-center gap-2 text-amber-800">
              <IconoCorreo className="h-4 w-4" />
              No pudimos enviar el correo de confirmación. Tu cita sí quedó agendada.
            </p>
          )}
          <button
            type="button"
            onClick={reenviar}
            disabled={reenviando}
            className="font-semibold text-brand-blue-700 underline underline-offset-2 transition disabled:opacity-60"
          >
            {reenviando ? 'Enviando...' : correoEnviado ? 'Reenviar correo' : 'Intentar enviar de nuevo'}
          </button>
          {mensajeCorreo.texto && (
            <p className={mensajeCorreo.tipo === 'ok' ? 'text-emerald-700' : 'text-red-700'}>{mensajeCorreo.texto}</p>
          )}
        </div>
      </Superficie>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
        <Superficie tono="blanco">
          <h3 className="text-lg font-bold text-brand-navy">Resumen de la cita</h3>
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-5 sm:grid-cols-2">
            <Dato icono={IconoPata} etiqueta="Mascota" valor={cita.mascota_nombre} detalle={especieYRaza(mascota)} />
            <Dato
              icono={IconoEstetoscopio}
              etiqueta="Servicio"
              valor={cita.servicio_nombre}
              detalle={cita.servicio_duracion_minutos ? `Duración estimada: ${cita.servicio_duracion_minutos} min` : undefined}
            />
            <Dato
              icono={IconoCalendario}
              etiqueta="Fecha y hora"
              valor={formatearFechaLarga(cita.fecha_hora)}
              detalle={formatearHora(cita.fecha_hora)}
            />
            <Dato
              icono={IconoUbicacion}
              etiqueta="Sede"
              valor={cita.sede_nombre}
              detalle={cita.sede_direccion ? `${cita.sede_direccion}, ${cita.sede_ciudad}` : cita.sede_ciudad}
            />
            <Dato
              icono={IconoPersona}
              etiqueta="Médico veterinario"
              valor={cita.medico_nombre}
              detalle={cita.medico_especialidad || 'Asignado según disponibilidad'}
            />
            <Dato icono={IconoLapiz} etiqueta="Motivo" valor={cita.motivo || 'Sin motivo indicado'} />
          </div>
        </Superficie>

        <Superficie tono="blanco">
          <h3 className="text-lg font-bold text-brand-navy">¿Qué sigue?</h3>
          <ol className="mt-5">
            <PasoSiguiente
              icono={IconoCorreo}
              titulo="Confirmación por correo"
              descripcion="El resumen de tu cita, en tu bandeja de entrada."
              completado={correoEnviado}
            />
            <PasoSiguiente
              icono={IconoCampana}
              titulo="Recordatorio"
              descripcion="Un recordatorio 24 horas antes de la cita."
              completado={false}
            />
            <PasoSiguiente
              icono={IconoPata}
              titulo="Asiste a tu cita"
              descripcion="Llega 10 minutos antes con tu mascota."
              completado={false}
              ultimo
            />
          </ol>
        </Superficie>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
        <Boton as={Link} to="/" variante="secundario">
          Volver al inicio
        </Boton>
        <Boton variante="secundario" onClick={onAgendarOtra}>
          Agendar otra cita
        </Boton>
        <Boton as={Link} to="/panel">
          Ver mis citas
        </Boton>
      </div>
    </div>
  );
}
