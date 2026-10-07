// pages/AgendarCitaPage.jsx
// Flujo de agendamiento del cliente (RF-06 agendar indicando sede,
// RF-07 disponibilidad por sede). 5 hitos agrupados en 3 paginas:
//   1. Mascota + Servicio
//   2. Sede + Fecha y hora
//   3. Confirmacion
// Todo el estado de las selecciones vive aqui (no en cada pagina) para
// que "Cambiar" en el resumen lateral regrese a una pagina sin perder
// lo ya elegido en las demas.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { BookingStepper, BookingStepperLateral } from '../components/agendar/BookingStepper';
import { BookingSummarySidebar } from '../components/agendar/BookingSummarySidebar';
import { PaginaMascotaServicio } from '../components/agendar/PaginaMascotaServicio';
import { PaginaSedeFecha } from '../components/agendar/PaginaSedeFecha';
import { PaginaConfirmacion } from '../components/agendar/PaginaConfirmacion';
import { DialogoSalirAgendar } from '../components/agendar/DialogoSalirAgendar';
import { FormularioMascotaPanel } from '../components/cliente/FormularioMascotaPanel';
import {
  obtenerMisMascotas,
  obtenerServicios,
  obtenerSedes,
  obtenerMisCitas,
  obtenerHorarios,
  agendarCita,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import { IconoFlechaDerecha } from '../components/icons';
import { Aviso, Boton, EncabezadoPagina, FondoVetui } from '../components/vetui';

export function AgendarCitaPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [parametros] = useSearchParams();

  const [pagina, setPagina] = useState(1);

  // Catalogos
  const [mascotas, setMascotas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [sedes, setSedes] = useState([]);
  // { [sedeId]: filas de horario_atencion } -- undefined mientras carga.
  const [horariosPorSede, setHorariosPorSede] = useState({});
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  // Selecciones
  const [mascotaId, setMascotaId] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [sedeId, setSedeId] = useState('');
  // true mientras la sede sea la sugerida (la de la ultima cita) y el
  // cliente no la haya elegido explicitamente en la pagina 2.
  const [sedeSugerida, setSedeSugerida] = useState(false);
  const [fecha, setFecha] = useState('');
  const [franja, setFranja] = useState(null);
  const [motivo, setMotivo] = useState('');

  // Confirmacion (pagina 2 -> 3)
  const [enviando, setEnviando] = useState(false);
  const [errorConfirmar, setErrorConfirmar] = useState('');
  // Se incrementa para volver a consultar la disponibilidad (ej. la hora
  // elegida se ocupo mientras el cliente confirmaba).
  const [refrescoDisponibilidad, setRefrescoDisponibilidad] = useState(0);
  const [citaCreada, setCitaCreada] = useState(null);
  const [correoEnviado, setCorreoEnviado] = useState(false);

  const [panelMascotaAbierto, setPanelMascotaAbierto] = useState(false);
  const [confirmarSalida, setConfirmarSalida] = useState(false);

  // Sin setState sincronico al inicio: el primer render ya arranca en
  // cargando=true, y "Reintentar" (reintentar()) lo vuelve a poner.
  const cargar = useCallback(() => {
    Promise.all([obtenerMisMascotas(token), obtenerServicios(), obtenerSedes(), obtenerMisCitas(token)])
      .then(([datosMascotas, datosServicios, datosSedes, datosCitas]) => {
        setMascotas(datosMascotas.mascotas);
        setServicios(datosServicios.servicios);
        setSedes(datosSedes.sedes);

        // Una sola mascota: se preselecciona (no hay nada que elegir).
        if (datosMascotas.mascotas.length === 1) setMascotaId((actual) => actual || datosMascotas.mascotas[0].id);

        // ?servicioId=... (tarjetas de servicio del landing): solo si
        // sigue existiendo entre los activos.
        const servicioInicial = parametros.get('servicioId');
        if (servicioInicial && datosServicios.servicios.some((s) => s.id === servicioInicial)) {
          setServicioId((actual) => actual || servicioInicial);
        }

        // Sede por defecto = la de la ultima cita del cliente (decision
        // registrada: no existe "sede de preferencia" en el perfil). Las
        // citas vienen ordenadas por fecha_hora DESC; solo si esa sede
        // sigue activa.
        const ultima = datosCitas.citas[0];
        if (ultima && datosSedes.sedes.some((s) => s.id === ultima.sede_id)) {
          setSedeId(ultima.sede_id);
          setSedeSugerida(true);
        }

        // Horario de cada sede (tarjetas de sede + dias cerrados del
        // calendario). Si falla el de una sede, se muestra sin horario en
        // vez de bloquear todo el flujo.
        datosSedes.sedes.forEach((s) => {
          obtenerHorarios(s.id)
            .then((datos) => setHorariosPorSede((actual) => ({ ...actual, [s.id]: datos.horario })))
            .catch(() => setHorariosPorSede((actual) => ({ ...actual, [s.id]: [] })));
        });
      })
      .catch((err) => setErrorCarga(err.message || 'No se pudo cargar la información para agendar.'))
      .finally(() => setCargando(false));
    // parametros solo se lee en la carga inicial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(cargar, [cargar]);

  function reintentar() {
    setCargando(true);
    setErrorCarga('');
    cargar();
  }

  const mascota = useMemo(() => mascotas.find((m) => m.id === mascotaId), [mascotas, mascotaId]);
  const servicio = useMemo(() => servicios.find((s) => s.id === servicioId), [servicios, servicioId]);
  const sede = useMemo(() => sedes.find((s) => s.id === sedeId), [sedes, sedeId]);

  function seleccionarServicio(id) {
    if (id === servicioId) return;
    setServicioId(id);
    // La disponibilidad depende del servicio (que medicos lo prestan):
    // la hora elegida deja de ser valida.
    setFranja(null);
  }

  function seleccionarSede(id) {
    setSedeSugerida(false);
    if (id === sedeId) return;
    setSedeId(id);
    // Cada sede tiene su propio horario y sus propios medicos.
    setFranja(null);
  }

  function seleccionarFecha(valor) {
    setFecha(valor);
    setFranja(null);
  }

  // "Cancelar" (abajo, junto a Volver): si ya hay
  // algo elegido mas alla de la mascota, se confirma antes de salir para
  // no perder el progreso sin avisar.
  const hayProgreso = pagina > 1 || Boolean(servicioId || fecha || franja || motivo.trim());
  function cancelarAgendamiento() {
    if (hayProgreso) setConfirmarSalida(true);
    else navigate('/panel');
  }
  const seguirAgendando = useCallback(() => setConfirmarSalida(false), []);

  // Click en un paso de cualquiera de los dos steppers. Se puede ir a los
  // pasos ya hechos y a los de la pagina actual; a la pagina 2 desde la 1
  // solo si la 1 esta completa. El paso 5 (confirmacion) solo se alcanza
  // confirmando, y con la cita ya creada no se navega.
  function puedeIrAHito(hito) {
    if (citaCreada) return false;
    if (hito.pagina <= pagina) return true;
    return hito.pagina === 2 && pagina === 1 && paginaCompleta;
  }
  function irAHito(hito) {
    if (!puedeIrAHito(hito)) return;
    const comportamiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const desplazar = () => document.getElementById(`paso-${hito.numero}`)?.scrollIntoView({ behavior: comportamiento, block: 'start' });
    if (hito.pagina === pagina) {
      desplazar();
      return;
    }
    setErrorConfirmar('');
    setPagina(hito.pagina);
    // La seccion destino recien existe despues del render de la pagina nueva.
    requestAnimationFrame(() => requestAnimationFrame(desplazar));
  }

  function irAPagina(numero) {
    setErrorConfirmar('');
    setPagina(numero);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // El medico lo asigna el backend (el de menos carga ese dia entre los
  // libres en esa franja); aqui no se envia medicoId.
  async function confirmarCita() {
    setEnviando(true);
    setErrorConfirmar('');
    try {
      const respuesta = await agendarCita({ sedeId, servicioId, fechaHora: franja, mascotaId, motivo: motivo.trim() }, token);
      setCitaCreada(respuesta.cita);
      setCorreoEnviado(respuesta.correoEnviado);
      irAPagina(3);
    } catch (err) {
      setErrorConfirmar(err.message);
      // La hora pudo ocuparse mientras tanto: se limpia y se vuelve a
      // consultar la disponibilidad.
      setFranja(null);
      setRefrescoDisponibilidad((n) => n + 1);
    } finally {
      setEnviando(false);
    }
  }

  // "Agendar otra cita": vuelve a la pagina 1 limpia. La sede de la cita
  // recien creada queda como sugerida (es ahora la "ultima cita"), y si
  // el cliente tiene una sola mascota se deja preseleccionada.
  function agendarOtra() {
    setMascotaId(mascotas.length === 1 ? mascotas[0].id : '');
    setServicioId('');
    setSedeId(citaCreada.sede_id);
    setSedeSugerida(true);
    setFecha('');
    setFranja(null);
    setMotivo('');
    setCitaCreada(null);
    setCorreoEnviado(false);
    irAPagina(1);
  }

  const paginaCompleta =
    {
      1: Boolean(mascota && servicio),
      2: Boolean(mascota && servicio && sede && franja),
    }[pagina] ?? false;

  return (
    // vetUI: fondo de marca con halos (FondoVetui, tambien detras de la
    // topbar), secciones de vidrio y tarjetas de cristal.
    <FondoVetui>
      <Navbar />

      <div inert={panelMascotaAbierto} aria-hidden={panelMascotaAbierto}>
        <EncabezadoPagina
          antetitulo="Agendar cita"
          titulo="Agenda una cita para tu mascota"
          descripcion="Completa los pasos y confirma. Te toma menos de un minuto."
          className="pb-6 lg:pl-[76px] min-[1360px]:pl-6"
        />

        {/* Entre lg y 1359px el margen lateral no alcanza para el stepper
            lateral (48px + 12px al borde + 16px de aire): se reserva ese
            espacio a la izquierda del contenido para que no lo tape. Desde
            1360px ya hay margen libre. */}
        <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:pl-[76px] min-[1360px]:pl-6">
          {/* Desde lg, relevo con el stepper lateral atado al progreso de la
              topbar (--flow en <html>, ver Navbar.jsx): esta tarjeta se
              desvanece entre flow 0 y 0.8 y el lateral aparece entre 0.7 y 1,
              asi el lateral empieza a verse justo antes de que esta termine
              de irse. Desde la decima 8 queda invisible (sin clicks ni foco).
              Con reduced-motion no hay fundido: solo cambia la visibilidad.
              Debajo de lg no hay lateral: no cambia. */}
          <div className="py-2 lg:[opacity:clamp(0,calc(1_-_var(--flow,0)_/_0.8),1)] motion-reduce:lg:[opacity:1] lg:[[data-topbar-decima='8']_&]:invisible lg:[[data-topbar-decima='9']_&]:invisible lg:[[data-topbar-decima='10']_&]:invisible">
            <BookingStepper paginaActual={pagina} puedeIrAHito={puedeIrAHito} onIrAHito={irAHito} />
          </div>
          <BookingStepperLateral paginaActual={pagina} puedeIrAHito={puedeIrAHito} onIrAHito={irAHito} />

          {pagina === 3 && citaCreada ? (
            <div className="mt-8">
              <PaginaConfirmacion cita={citaCreada} correoEnviado={correoEnviado} onAgendarOtra={agendarOtra} />
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
              <div className="flex flex-col gap-6">
                {pagina === 1 && (
                  <PaginaMascotaServicio
                    mascotas={mascotas}
                    servicios={servicios}
                    cargando={cargando}
                    errorCarga={errorCarga}
                    onReintentar={reintentar}
                    mascotaId={mascotaId}
                    servicioId={servicioId}
                    onSeleccionarMascota={setMascotaId}
                    onSeleccionarServicio={seleccionarServicio}
                    onAgregarMascota={() => setPanelMascotaAbierto(true)}
                  />
                )}

                {pagina === 2 && (
                  <PaginaSedeFecha
                    sedes={sedes}
                    horariosPorSede={horariosPorSede}
                    sedeId={sedeId}
                    servicioId={servicioId}
                    fecha={fecha}
                    franja={franja}
                    motivo={motivo}
                    refrescoDisponibilidad={refrescoDisponibilidad}
                    onSeleccionarSede={seleccionarSede}
                    onSeleccionarFecha={seleccionarFecha}
                    onSeleccionarFranja={setFranja}
                    onCambiarMotivo={setMotivo}
                  />
                )}

                {errorConfirmar && <Aviso tono="error">{errorConfirmar}</Aviso>}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Volver (desde la pagina 2) + Cancelar, que se mantiene en
                      todas las paginas del flujo (peligro: es la accion de
                      salida). Continuar/Confirmar es la accion primaria. */}
                  <div className="flex flex-wrap items-center gap-3">
                    {pagina > 1 && (
                      <Boton variante="secundario" onClick={() => irAPagina(pagina - 1)}>
                        Volver
                      </Boton>
                    )}
                    <Boton variante="peligro" onClick={cancelarAgendamiento}>
                      Cancelar
                    </Boton>
                  </div>
                  <Boton
                    disabled={!paginaCompleta || enviando}
                    onClick={pagina === 2 ? confirmarCita : () => irAPagina(pagina + 1)}
                    iconoFinal={IconoFlechaDerecha}
                    className="px-6"
                  >
                    {pagina === 2 ? (enviando ? 'Agendando...' : 'Confirmar cita') : 'Continuar'}
                  </Boton>
                </div>
              </div>

              <BookingSummarySidebar
                mascota={mascota}
                servicio={servicio}
                sede={sede}
                sedeSugerida={sedeSugerida}
                fechaHora={franja}
                onIrAPagina={irAPagina}
              />
            </div>
          )}
        </main>
      </div>

      <DialogoSalirAgendar abierto={confirmarSalida} onSeguir={seguirAgendando} onSalir={() => navigate('/panel')} />

      <FormularioMascotaPanel
        isOpen={panelMascotaAbierto}
        onClose={() => setPanelMascotaAbierto(false)}
        fotosAnteriores={mascotas.map((m) => m.foto_url).filter(Boolean)}
        onGuardada={(nueva) => {
          setPanelMascotaAbierto(false);
          setMascotas((actuales) => [...actuales, nueva]);
          setMascotaId(nueva.id);
        }}
      />
    </FondoVetui>
  );
}
