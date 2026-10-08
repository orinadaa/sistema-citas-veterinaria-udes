// components/admin/NuevaCitaModal.jsx
// "Nueva cita" del administrador en una ventana centrada (antes era un
// panel lateral). Decisiones de Oriana: la base es el flujo de agendar del
// CLIENTE (/agendar), no un formulario aparte, organizado en 3 pasos con
// un stepper horizontal.
//
// Que se reutiliza del flujo del cliente, sin duplicarlo:
// - PaginaMascotaServicio: las tarjetas de mascota y de servicio;
// - DatePickerCalendar + TimeSlotPicker: calendario y horas disponibles;
// - el patron de pasos (stepper, Atras / Continuar) y la confirmacion al
//   salir con datos sin guardar (DialogoSalirAgendar).
//
// Que cambia frente al cliente, porque quien agenda es el administrador:
// - Paso 1 empieza eligiendo el CLIENTE (el cliente agenda para si mismo);
//   la mascota nueva se crea a nombre de ese cliente (NuevaMascotaRapida);
// - no se elige sede: es la del administrador;
// - el MEDICO lo elige el administrador entre los libres a esa hora
//   (SelectorMedico); al cliente se le asigna solo.
//
// Pasos: 1. Cliente, mascota y servicio  2. Fecha, hora y medico
//        3. Revisar y confirmar.
//
// Ventana: cristal de vetUI sobre el velo, z-[60], en <body> (portal).
// Escape, la X o un clic afuera piden confirmar si ya hay algo elegido.
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { agendarCita, obtenerMascotasDeCliente } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatearFechaLarga, formatearHora } from '../../utils/fecha';
import { especieYRaza } from '../../utils/mascota';
import { PasosHorizontal } from '../agendar/BookingStepper';
import { PaginaMascotaServicio } from '../agendar/PaginaMascotaServicio';
import { DatePickerCalendar } from '../agendar/DatePickerCalendar';
import { TimeSlotPicker } from '../agendar/TimeSlotPicker';
import { DialogoSalirAgendar } from '../agendar/DialogoSalirAgendar';
import { SelectorMedico } from '../citas/SelectorMedico';
import { NuevaMascotaRapida } from '../citas/NuevaMascotaRapida';
import { CampoBusqueda } from '../form/CampoBusqueda';
import { Desplegable } from '../form/Desplegable';
import { Boton, Superficie, TituloSeccion } from '../vetui';
import { IconoFlechaDerecha, IconoX } from '../icons';

const PASOS = [
  { numero: 1, etiqueta: 'Cliente y servicio' },
  { numero: 2, etiqueta: 'Fecha y médico' },
  { numero: 3, etiqueta: 'Confirmar' },
];

const VACIO = { clienteId: '', mascotaId: '', servicioId: '', fecha: '', franja: null, medicoId: '', medicoNombre: '', motivo: '' };

function FilaResumen({ etiqueta, children }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-900/10 py-3 last:border-0 sm:flex-row sm:gap-4">
      <dt className="w-32 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-600">{etiqueta}</dt>
      <dd className="min-w-0 text-sm font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export function NuevaCitaModal({ abierto, onCerrar, onAgendada, clientes, servicios, sedeId, diasAbiertos }) {
  const { token } = useAuth();
  const [paso, setPaso] = useState(1);
  const [datos, setDatos] = useState(VACIO);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [mascotas, setMascotas] = useState({ clienteId: '', lista: [], error: '' });
  const [agregandoMascota, setAgregandoMascota] = useState(false);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmarSalida, setConfirmarSalida] = useState(false);

  // Cada vez que se abre arranca limpia (ajuste durante el render).
  const [abiertoAntes, setAbiertoAntes] = useState(false);
  if (abierto !== abiertoAntes) {
    setAbiertoAntes(abierto);
    if (abierto) {
      setPaso(1);
      setDatos(VACIO);
      setBusquedaCliente('');
      setAgregandoMascota(false);
      setError('');
      setConfirmarSalida(false);
    }
  }

  // Mascotas del cliente elegido. Se guarda con que cliente se pidieron:
  // si no coincide con el actual, estan cargando.
  const { clienteId } = datos;
  useEffect(() => {
    if (!abierto || !clienteId) return undefined;
    let vigente = true;
    obtenerMascotasDeCliente(clienteId, token)
      .then((respuesta) => vigente && setMascotas({ clienteId, lista: respuesta.mascotas, error: '' }))
      .catch((err) => vigente && setMascotas({ clienteId, lista: [], error: err.message || 'No se pudieron cargar las mascotas.' }));
    return () => {
      vigente = false;
    };
  }, [abierto, clienteId, token]);
  const cargandoMascotas = Boolean(clienteId) && mascotas.clienteId !== clienteId;
  const listaMascotas = mascotas.clienteId === clienteId ? mascotas.lista : [];

  const clientesFiltrados = useMemo(
    () => clientes.filter((c) => c.nombre_completo.toLowerCase().includes(busquedaCliente.trim().toLowerCase())),
    [clientes, busquedaCliente]
  );

  // Cada eleccion limpia el aviso de "falta algo" del pie.
  function actualizar(cambios) {
    setError('');
    setDatos((actual) => ({ ...actual, ...cambios }));
  }

  const cliente = clientes.find((c) => c.id === datos.clienteId);
  const mascota = listaMascotas.find((m) => m.id === datos.mascotaId);
  const servicio = servicios.find((s) => s.id === datos.servicioId);

  const paso1Completo = Boolean(datos.clienteId && datos.mascotaId && datos.servicioId);
  const paso2Completo = Boolean(datos.franja && datos.medicoId);
  const hayDatos = Boolean(datos.clienteId || datos.servicioId || datos.motivo.trim());

  // Salir: con algo elegido se confirma antes (misma pregunta que al
  // cliente cuando abandona una cita a medias).
  function pedirCerrar() {
    if (guardando) return;
    if (hayDatos) setConfirmarSalida(true);
    else onCerrar();
  }

  useEffect(() => {
    if (!abierto) return undefined;
    function alPresionarTecla(evento) {
      if (evento.key !== 'Escape' || confirmarSalida) return;
      evento.stopPropagation();
      if (guardando) return;
      if (hayDatos) setConfirmarSalida(true);
      else onCerrar();
    }
    document.addEventListener('keydown', alPresionarTecla, true);
    return () => document.removeEventListener('keydown', alPresionarTecla, true);
  }, [abierto, confirmarSalida, guardando, hayDatos, onCerrar]);

  function puedeIrA(numero) {
    if (numero <= paso) return true;
    if (numero === 2) return paso1Completo;
    return paso1Completo && paso2Completo;
  }

  function continuar() {
    setError('');
    if (paso === 1 && !paso1Completo) {
      setError('Elige el cliente, la mascota y el servicio para continuar.');
      return;
    }
    if (paso === 2 && !paso2Completo) {
      setError('Elige el día, la hora y el médico para continuar.');
      return;
    }
    setPaso((actual) => actual + 1);
  }

  async function agendar() {
    setError('');
    setGuardando(true);
    try {
      await agendarCita(
        {
          clienteId: datos.clienteId,
          servicioId: datos.servicioId,
          medicoId: datos.medicoId,
          fechaHora: datos.franja,
          mascotaId: datos.mascotaId,
          motivo: datos.motivo.trim() || null,
        },
        token
      );
      onAgendada();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (!abierto) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" inert={confirmarSalida}>
        <div className="velo absolute inset-0" onClick={pedirCerrar} aria-hidden="true" />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-nueva-cita"
          className="cristal-fuerte relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-superficie"
        >
          <div className="border-b border-slate-900/10 px-6 pb-4 pt-5">
            <div className="flex items-center justify-between gap-4">
              <h2 id="titulo-nueva-cita" className="text-lg font-bold text-brand-navy">
                Nueva cita
              </h2>
              <button
                type="button"
                onClick={pedirCerrar}
                aria-label="Cerrar"
                className="boton-texto rounded-boton p-1.5 text-slate-600 transition hover:text-slate-900"
              >
                <IconoX className="h-5 w-5" />
              </button>
            </div>
            <div className="mx-auto mt-4 max-w-2xl">
              <PasosHorizontal
                pasos={PASOS}
                actual={paso}
                puedeIr={puedeIrA}
                onIr={(numero) => {
                  setError('');
                  setPaso(numero);
                }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {paso === 1 && (
              <div className="flex flex-col gap-6">
                <Superficie tono="blanco">
                  <TituloSeccion numero={1} titulo="Selecciona el cliente" descripcion="¿A nombre de quién es la cita?" />
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <CampoBusqueda placeholder="Buscar cliente por nombre..." value={busquedaCliente} onChange={(e) => setBusquedaCliente(e.target.value)} />
                    <Desplegable
                      id="cliente-nueva-cita"
                      aria-label="Cliente"
                      value={datos.clienteId}
                      onChange={(e) => {
                        setAgregandoMascota(false);
                        actualizar({ clienteId: e.target.value, mascotaId: '' });
                      }}
                      className="w-full px-3 py-2 text-sm"
                    >
                      <option value="">{clientesFiltrados.length === 0 ? 'Ningún cliente coincide' : 'Selecciona un cliente'}</option>
                      {clientesFiltrados.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre_completo} ({c.correo})
                        </option>
                      ))}
                    </Desplegable>
                  </div>
                </Superficie>

                {datos.clienteId ? (
                  <>
                    {agregandoMascota && (
                      <NuevaMascotaRapida
                        clienteId={datos.clienteId}
                        onCancelar={() => setAgregandoMascota(false)}
                        onCreada={(nueva, aviso) => {
                          setMascotas((actual) => ({ ...actual, lista: [...actual.lista, nueva] }));
                          actualizar({ mascotaId: nueva.id });
                          setAgregandoMascota(false);
                          setError(aviso || '');
                        }}
                      />
                    )}
                    {/* Mismas tarjetas de mascota y de servicio del flujo del cliente. */}
                    <PaginaMascotaServicio
                      mascotas={listaMascotas}
                      servicios={servicios}
                      cargando={cargandoMascotas}
                      errorCarga={mascotas.clienteId === clienteId ? mascotas.error : ''}
                      onReintentar={() => setMascotas({ clienteId: '', lista: [], error: '' })}
                      mascotaId={datos.mascotaId}
                      servicioId={datos.servicioId}
                      onSeleccionarMascota={(id) => actualizar({ mascotaId: id })}
                      onSeleccionarServicio={(id) => actualizar({ servicioId: id, franja: null, medicoId: '', medicoNombre: '' })}
                      onAgregarMascota={() => setAgregandoMascota(true)}
                      numeroMascota={2}
                      numeroServicio={3}
                      descripcionMascota="¿Para cuál de sus mascotas?"
                      descripcionServicio="¿Qué necesita la mascota?"
                    />
                  </>
                ) : (
                  <p className="rounded-tarjeta border-2 border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-700">
                    Elige un cliente para ver sus mascotas y los servicios.
                  </p>
                )}
              </div>
            )}

            {paso === 2 && (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
                <Superficie tono="blanco">
                  <TituloSeccion numero={1} titulo="Elige el día" />
                  <div className="mt-5">
                    <DatePickerCalendar
                      valor={datos.fecha}
                      onChange={(fecha) => actualizar({ fecha, franja: null, medicoId: '', medicoNombre: '' })}
                      diasAbiertos={diasAbiertos}
                    />
                  </div>
                </Superficie>

                <div className="flex flex-col gap-6">
                  <Superficie tono="blanco">
                    <TituloSeccion numero={2} titulo="Elige la hora" descripcion="Horas con al menos un médico libre." />
                    <div className="mt-5">
                      <TimeSlotPicker
                        sedeId={sedeId}
                        servicioId={datos.servicioId}
                        fecha={datos.fecha}
                        valor={datos.franja}
                        textoSinServicio="Ningún médico de tu sede presta este servicio. Vuelve al paso 1 y elige otro."
                        onChange={(franja) => actualizar({ franja, medicoId: '', medicoNombre: '' })}
                      />
                    </div>
                  </Superficie>

                  {datos.franja && (
                    <Superficie tono="blanco">
                      <TituloSeccion numero={3} titulo="Elige el médico" descripcion="Solo aparecen los que están libres a esa hora." />
                      <div className="mt-3">
                        <SelectorMedico
                          sedeId={sedeId}
                          servicioId={datos.servicioId}
                          fechaHora={datos.franja}
                          valorSeleccionado={datos.medicoId}
                          onSeleccionar={(id, medico) => actualizar({ medicoId: id, medicoNombre: medico?.nombreCompleto ?? '' })}
                        />
                      </div>
                    </Superficie>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="motivo-nueva-cita" className="text-sm font-medium text-slate-700">
                      Motivo de la consulta (opcional)
                    </label>
                    <textarea
                      id="motivo-nueva-cita"
                      maxLength={300}
                      value={datos.motivo}
                      onChange={(e) => actualizar({ motivo: e.target.value })}
                      placeholder="Ej. Control anual y refuerzo de vacunas"
                      className="campo px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {paso === 3 && (
              <Superficie tono="blanco" className="mx-auto max-w-2xl">
                <TituloSeccion titulo="Revisa los datos antes de agendar" descripcion="Puedes volver a un paso anterior para corregir algo." />
                <dl className="mt-4">
                  <FilaResumen etiqueta="Cliente">
                    {cliente?.nombre_completo}
                    <span className="block text-xs font-normal text-slate-700">{cliente?.correo}</span>
                  </FilaResumen>
                  <FilaResumen etiqueta="Mascota">
                    {mascota?.nombre}
                    {mascota && especieYRaza(mascota) && <span className="block text-xs font-normal text-slate-700">{especieYRaza(mascota)}</span>}
                  </FilaResumen>
                  <FilaResumen etiqueta="Servicio">{servicio?.nombre}</FilaResumen>
                  <FilaResumen etiqueta="Fecha y hora">
                    {datos.franja && `${formatearFechaLarga(datos.franja)}, ${formatearHora(datos.franja)}`}
                  </FilaResumen>
                  <FilaResumen etiqueta="Médico">{datos.medicoNombre}</FilaResumen>
                  {datos.motivo.trim() && <FilaResumen etiqueta="Motivo">{datos.motivo.trim()}</FilaResumen>}
                </dl>
              </Superficie>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-900/10 px-6 py-4">
            <p role="alert" className="min-w-0 flex-1 text-sm font-medium text-red-700">
              {error}
            </p>
            <div className="flex shrink-0 flex-wrap gap-3">
              {paso === 1 ? (
                <Boton variante="contorno" onClick={pedirCerrar}>
                  Cancelar
                </Boton>
              ) : (
                <Boton
                  variante="contorno"
                  disabled={guardando}
                  onClick={() => {
                    setError('');
                    setPaso((actual) => actual - 1);
                  }}
                >
                  Atrás
                </Boton>
              )}
              {paso < 3 ? (
                <Boton iconoFinal={IconoFlechaDerecha} onClick={continuar}>
                  Continuar
                </Boton>
              ) : (
                <Boton onClick={agendar} disabled={guardando}>
                  {guardando ? 'Agendando...' : 'Agendar cita'}
                </Boton>
              )}
            </div>
          </div>
        </div>
      </div>

      <DialogoSalirAgendar abierto={confirmarSalida} onSeguir={() => setConfirmarSalida(false)} onSalir={onCerrar} />
    </>,
    document.body
  );
}
