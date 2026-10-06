// pages/AgendarCitaPage.jsx
// Flujo de agendamiento del cliente (RF-06 agendar indicando sede,
// RF-07 disponibilidad por sede). 5 hitos agrupados en 3 paginas:
//   1. Mascota + Servicio
//   2. Sede + Fecha y hora
//   3. Confirmacion
// Todo el estado de las selecciones vive aqui (no en cada pagina) para
// que "Cambiar" en el resumen lateral regrese a una pagina sin perder
// lo ya elegido en las demas.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { BookingStepper, BookingStepperLateral } from '../components/agendar/BookingStepper';
import { BookingSummarySidebar } from '../components/agendar/BookingSummarySidebar';
import { PaginaMascotaServicio } from '../components/agendar/PaginaMascotaServicio';
import { PaginaSedeFecha } from '../components/agendar/PaginaSedeFecha';
import { PaginaConfirmacion } from '../components/agendar/PaginaConfirmacion';
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

// La pildora de la topbar ocupa hasta ~76px desde arriba (12px de
// separacion + 64px de alto). Apenas el borde superior de la tarjeta del
// stepper toca esa franja (con 8px de margen), el stepper se muda al
// costado: si se esperara a que quede totalmente tapada, se la veria
// difuminada detras de la pildora translucida mientras pasa por debajo.
const LIMITE_TOPBAR_PX = 84;

export function AgendarCitaPage() {
  const tarjetaStepperRef = useRef(null);
  const [stepperOculto, setStepperOculto] = useState(false);

  // Cuando la tarjeta horizontal del stepper llega a la topbar, se oculta
  // y aparece la version lateral (BookingStepperLateral). Se mide la caja
  // externa de la tarjeta (sin transform), asi su animacion de salida no
  // altera la medicion.
  useEffect(() => {
    let cuadro = null;
    const medir = () => {
      cuadro = null;
      const tarjeta = tarjetaStepperRef.current;
      if (tarjeta) setStepperOculto(tarjeta.getBoundingClientRect().top < LIMITE_TOPBAR_PX);
    };
    const alHacerScroll = () => {
      if (cuadro === null) cuadro = requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener('scroll', alHacerScroll, { passive: true });
    window.addEventListener('resize', alHacerScroll);
    return () => {
      window.removeEventListener('scroll', alHacerScroll);
      window.removeEventListener('resize', alHacerScroll);
      if (cuadro !== null) cancelAnimationFrame(cuadro);
    };
  }, []);

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
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div inert={panelMascotaAbierto} aria-hidden={panelMascotaAbierto}>
        {/* -mt-24 pt-24: el banner pasa por detras de la topbar (transparente
            arriba, ver Navbar.jsx), igual que el Hero del landing. */}
        <section className="-mt-24 bg-gradient-to-b from-brand-blue-500 to-brand-blue-800 pt-24">
          <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">Agendar cita</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Agenda una cita para tu mascota</h1>
            <p className="mt-2 max-w-xl text-blue-50">Completa los pasos y confirma. Te toma menos de un minuto.</p>
          </div>
        </section>

        {/* Entre lg y 1359px el margen lateral no alcanza para el stepper
            lateral (48px + 12px): se reserva ese espacio a la izquierda
            del contenido para que no lo tape. Desde 1360px ya hay margen. */}
        <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:pl-[76px] min-[1360px]:pl-6">
          {/* Caja externa (medida, sin transform) + tarjeta interna que, desde
              lg, se desvanece y se encoge hacia la izquierda cuando el stepper
              se muda al costado. Debajo de lg no hay version lateral, asi que
              la tarjeta no cambia. */}
          <div ref={tarjetaStepperRef} className="-mt-12">
            <div
              aria-hidden={stepperOculto || undefined}
              className={`origin-left rounded-2xl bg-white px-4 py-5 shadow-sm ring-1 ring-slate-200 transition-[opacity,translate,scale] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:px-8 ${
                stepperOculto ? 'lg:-translate-x-10 lg:scale-95 lg:opacity-0' : ''
              }`}
            >
              <BookingStepper paginaActual={pagina} />
            </div>
          </div>
          <BookingStepperLateral paginaActual={pagina} visible={stepperOculto} origenRef={tarjetaStepperRef} />

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

                {errorConfirmar && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{errorConfirmar}</p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => (pagina === 1 ? navigate('/panel') : irAPagina(pagina - 1))}
                    className="rounded-boton border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    {pagina === 1 ? 'Cancelar' : 'Volver'}
                  </button>
                  <button
                    type="button"
                    disabled={!paginaCompleta || enviando}
                    onClick={pagina === 2 ? confirmarCita : () => irAPagina(pagina + 1)}
                    className="inline-flex items-center gap-2 rounded-boton bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pagina === 2 ? (enviando ? 'Agendando...' : 'Confirmar cita') : 'Continuar'}
                    <IconoFlechaDerecha className="h-4 w-4" />
                  </button>
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
    </div>
  );
}
