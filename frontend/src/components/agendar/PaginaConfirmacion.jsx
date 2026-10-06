// components/agendar/PaginaConfirmacion.jsx
// Pagina 3 del flujo de agendamiento (hito 5): la cita ya quedo creada.
// Muestra el codigo visible (CV-{sede}-{año}-{consecutivo}), el medico
// asignado automaticamente y el ciclo de vida de notificaciones:
//   - Confirmacion por correo: real (se envia al agendar, RF-17 parcial).
//     Si el SMTP fallo, se dice tal cual y se ofrece reintentar.
//   - Recordatorio 24 h antes (RF-18): queda "pendiente" -- el envio
//     automatico es del incremento 5 (notificaciones), no se marca como
//     hecho antes de que exista.
//   - Asiste a tu cita: pendiente hasta el dia de la cita.
// Materiales vetUI: superficies de vidrio (texto blanco) y el codigo de la
// cita en una pildora blanca.
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
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
        <Icono className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-blue-100">{etiqueta}</p>
        <p className="font-semibold text-white">{valor}</p>
        {detalle && <p className="text-sm text-blue-100">{detalle}</p>}
      </div>
    </div>
  );
}

function PasoSiguiente({ icono: Icono, titulo, descripcion, completado, ultimo }) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!ultimo && <span aria-hidden="true" className="absolute left-5 top-10 h-[calc(100%-2.5rem)] w-0.5 bg-white/25" />}
      <span
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          completado ? 'bg-brand-green text-white' : 'border-2 border-white/45 bg-white/5 text-blue-50'
        }`}
      >
        {completado ? <IconoCheck className="h-5 w-5" /> : <Icono className="h-5 w-5" />}
      </span>
      <div className="pt-1">
        <p className="flex flex-wrap items-center gap-2 font-semibold text-white">
          {titulo}
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              completado ? 'bg-emerald-100 text-emerald-800' : 'bg-white/15 text-blue-50'
            }`}
          >
            {completado ? 'Completado' : 'Pendiente'}
          </span>
        </p>
        <p className="mt-0.5 text-sm text-blue-100">{descripcion}</p>
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
      <Superficie className="text-center sm:p-8">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/25 text-emerald-100 ring-1 ring-emerald-300/50">
          <IconoCheck className="h-9 w-9" />
        </span>
        <h2 className="mt-4 text-2xl font-bold text-white">¡Tu cita ha sido agendada!</h2>
        <p className="mt-2 inline-block rounded-boton bg-white px-4 py-1.5 font-mono text-sm font-semibold text-brand-blue-800">
          Cita #{cita.codigo}
        </p>

        <div className="mt-4 flex flex-col items-center gap-2 text-sm">
          {correoEnviado ? (
            <p className="flex items-center gap-2 text-blue-50">
              <IconoCorreo className="h-4 w-4 text-white" />
              Te hemos enviado un correo de confirmación a <span className="font-medium">{cita.cliente_correo}</span>
            </p>
          ) : (
            <p className="flex items-center gap-2 text-amber-200">
              <IconoCorreo className="h-4 w-4" />
              No pudimos enviar el correo de confirmación. Tu cita sí quedó agendada.
            </p>
          )}
          <button
            type="button"
            onClick={reenviar}
            disabled={reenviando}
            className="hover-texto-ilumina font-semibold text-white underline underline-offset-2 transition disabled:opacity-60"
          >
            {reenviando ? 'Enviando...' : correoEnviado ? 'Reenviar correo' : 'Intentar enviar de nuevo'}
          </button>
          {mensajeCorreo.texto && (
            <p className={mensajeCorreo.tipo === 'ok' ? 'text-emerald-200' : 'text-red-200'}>{mensajeCorreo.texto}</p>
          )}
        </div>
      </Superficie>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
        <Superficie>
          <h3 className="text-lg font-bold text-white">Resumen de la cita</h3>
          <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
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

        <Superficie>
          <h3 className="text-lg font-bold text-white">¿Qué sigue?</h3>
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
