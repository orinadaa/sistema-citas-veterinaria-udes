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
import { BookingStepper } from '../components/agendar/BookingStepper';
import { BookingSummarySidebar } from '../components/agendar/BookingSummarySidebar';
import { PaginaMascotaServicio } from '../components/agendar/PaginaMascotaServicio';
import { FormularioMascotaPanel } from '../components/cliente/FormularioMascotaPanel';
import { obtenerMisMascotas, obtenerServicios, obtenerSedes, obtenerMisCitas } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { IconoFlechaDerecha } from '../components/icons';

export function AgendarCitaPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [parametros] = useSearchParams();

  const [pagina, setPagina] = useState(1);

  // Catalogos
  const [mascotas, setMascotas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  // Selecciones
  const [mascotaId, setMascotaId] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [sedeId, setSedeId] = useState('');
  // true mientras la sede sea la sugerida (la de la ultima cita) y el
  // cliente no la haya elegido explicitamente en la pagina 2.
  const [sedeSugerida, setSedeSugerida] = useState(false);
  const [franja, setFranja] = useState(null);

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

  function irAPagina(numero) {
    setPagina(numero);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const paginaCompleta = { 1: Boolean(mascota && servicio) }[pagina] ?? false;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div inert={panelMascotaAbierto} aria-hidden={panelMascotaAbierto}>
        <section className="bg-gradient-to-b from-brand-blue-500 to-brand-blue-800">
          <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">Agendar cita</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Agenda una cita para tu mascota</h1>
            <p className="mt-2 max-w-xl text-blue-50">Completa los pasos y confirma. Te toma menos de un minuto.</p>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="-mt-12 rounded-2xl bg-white px-4 py-5 shadow-sm ring-1 ring-slate-200 sm:px-8">
            <BookingStepper paginaActual={pagina} />
          </div>

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

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => (pagina === 1 ? navigate('/panel') : irAPagina(pagina - 1))}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  {pagina === 1 ? 'Cancelar' : 'Volver'}
                </button>
                <button
                  type="button"
                  disabled={!paginaCompleta}
                  onClick={() => irAPagina(pagina + 1)}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continuar
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
        </main>
      </div>

      <FormularioMascotaPanel
        isOpen={panelMascotaAbierto}
        onClose={() => setPanelMascotaAbierto(false)}
        onGuardada={(nueva) => {
          setPanelMascotaAbierto(false);
          setMascotas((actuales) => [...actuales, nueva]);
          setMascotaId(nueva.id);
        }}
      />
    </div>
  );
}
