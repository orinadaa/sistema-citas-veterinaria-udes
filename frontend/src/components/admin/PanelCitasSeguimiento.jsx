// components/admin/PanelCitasSeguimiento.jsx
// RF-12: seguimiento de citas programadas, como vista de calendario semanal
// (reemplaza la tabla anterior).
import { useEffect, useMemo, useState } from 'react';
import {
  obtenerCitasAdministracion,
  obtenerServicios,
  obtenerClientes,
  obtenerHorarios,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatearFechaLarga, formatearHora, esMismoDia, sumarDias, inicioDeSemana, formatearMesAnio, formatearRangoSemana } from '../../utils/fecha';
import { PageHeader } from '../ui/PageHeader';
import { COLORES_CATEGORIA } from '../ui/CategoryBadge';
import { DetalleCitaMedicoPanel } from '../medico/DetalleCitaMedicoPanel';
import { MiniCalendario } from '../citas/MiniCalendario';
import { CalendarioSemanal } from '../citas/CalendarioSemanal';
import { NuevaCitaModal } from './NuevaCitaModal';
import { IconoFlechaDerecha, IconoPata } from '../icons';
import { EstadoError } from '../ui/EstadoError';

function hoyAMedianoche() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
}

export function PanelCitasSeguimiento() {
  const { token, usuario } = useAuth();
  const esAdmin = usuario.rol === 'administrador';

  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [servicios, setServicios] = useState([]);
  const [clientes, setClientes] = useState([]);

  const [diaSeleccionado, setDiaSeleccionado] = useState(hoyAMedianoche);
  const [semanaInicio, setSemanaInicio] = useState(() => inicioDeSemana(hoyAMedianoche()));

  const [citaDetalle, setCitaDetalle] = useState(null);
  const [panelNuevaAbierto, setPanelNuevaAbierto] = useState(false);
  // Dias de la semana en que atiende la sede (deshabilita los demas en el
  // calendario de "Nueva cita"); null mientras carga o si falla.
  const [diasAbiertos, setDiasAbiertos] = useState(null);
  const sedeIdUsuario = usuario?.sedeId;
  useEffect(() => {
    if (!sedeIdUsuario) return undefined;
    let vigente = true;
    obtenerHorarios(sedeIdUsuario)
      .then((datos) => vigente && setDiasAbiertos(new Set(datos.horario.map((h) => h.dia_semana))))
      .catch(() => vigente && setDiasAbiertos(null));
    return () => {
      vigente = false;
    };
  }, [sedeIdUsuario]);

  function cargarCitas() {
    setCargando(true);
    setErrorCarga('');
    obtenerCitasAdministracion(token)
      .then((datos) => {
        setCitas(datos.citas);
      })
      .catch((err) => {
        setErrorCarga(err.message || 'No se pudieron cargar las citas.');
      })
      .finally(() => {
        setCargando(false);
      });
  }

  useEffect(cargarCitas, [token]);

  useEffect(() => {
    if (!esAdmin) return;
    obtenerServicios()
      .then((datos) => setServicios(datos.servicios))
      .catch((err) => console.error('No se pudieron cargar los servicios:', err));
    obtenerClientes(token)
      .then((datos) => setClientes(datos.usuarios))
      .catch((err) => console.error('No se pudieron cargar los clientes:', err));
  }, [token, esAdmin]);

  const diasSemana = useMemo(() => Array.from({ length: 6 }, (_, i) => sumarDias(semanaInicio, i)), [semanaInicio]);

  const citasDelDia = useMemo(
    () =>
      citas
        .filter((c) => esMismoDia(new Date(c.fecha_hora), diaSeleccionado))
        .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora)),
    [citas, diaSeleccionado]
  );

  const categoriasEnUso = useMemo(() => {
    const vistos = new Map();
    citas.forEach((c) => {
      if (!vistos.has(c.categoria_nombre)) vistos.set(c.categoria_nombre, c.categoria_color);
    });
    return Array.from(vistos, ([nombre, color]) => ({ nombre, color }));
  }, [citas]);

  function irSemanaAnterior() {
    setSemanaInicio((s) => sumarDias(s, -7));
  }
  function irSemanaSiguiente() {
    setSemanaInicio((s) => sumarDias(s, 7));
  }
  function irHoy() {
    const hoy = hoyAMedianoche();
    setDiaSeleccionado(hoy);
    setSemanaInicio(inicioDeSemana(hoy));
  }
  function seleccionarDia(dia) {
    setDiaSeleccionado(dia);
    setSemanaInicio(inicioDeSemana(dia));
  }

  function abrirNueva() {
    setPanelNuevaAbierto(true);
  }

  const fin = sumarDias(semanaInicio, 5);
  const hoy = hoyAMedianoche();

  const algunPanelAbierto = Boolean(citaDetalle) || panelNuevaAbierto;

  return (
    <>
    <div className="flex flex-col gap-6" inert={algunPanelAbierto} aria-hidden={algunPanelAbierto}>
      <PageHeader
        title={esAdmin ? 'Calendario de citas' : 'Mi Calendario'}
        subtitle={esAdmin ? 'Consulta y agenda las citas de tu sede.' : 'Gestiona tus citas y organiza tu día.'}
        actionLabel={esAdmin ? 'Nueva cita' : undefined}
        onAction={esAdmin ? abrirNueva : undefined}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" aria-label="Semana anterior" onClick={irSemanaAnterior} className="boton-texto rounded-boton p-2 text-white transition">
          <IconoFlechaDerecha className="h-4 w-4 rotate-180" />
        </button>
        <button type="button" aria-label="Semana siguiente" onClick={irSemanaSiguiente} className="boton-texto rounded-boton p-2 text-white transition">
          <IconoFlechaDerecha className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={irHoy}
          className="rounded-boton bg-white/85 px-3.5 py-1.5 text-sm font-semibold text-slate-800 ring-1 ring-white transition"
        >
          Hoy
        </button>
        <p className="font-heading text-sm font-semibold text-white">
          {formatearMesAnio(semanaInicio)} · {formatearRangoSemana(semanaInicio, fin)}
        </p>
      </div>

      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="flex-1 overflow-x-auto rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          {cargando ? (
            <div className="flex flex-col gap-2 p-4">
              {[0, 1, 2, 3].map((k) => (
                <div key={k} className="h-10 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : errorCarga ? (
            <EstadoError mensaje={errorCarga} onReintentar={cargarCitas} />
          ) : (
            <CalendarioSemanal dias={diasSemana} citas={citas} mostrarMedico={esAdmin} onSeleccionarCita={setCitaDetalle} />
          )}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 xl:w-72">
          <MiniCalendario diaSeleccionado={diaSeleccionado} onSeleccionarDia={seleccionarDia} />

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="font-heading text-sm font-semibold text-brand-navy">
              Citas del {esMismoDia(diaSeleccionado, hoy) ? 'día' : formatearFechaLarga(diaSeleccionado).split(',')[0].toLowerCase()}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {citasDelDia.length === 0 ? (
                <p className="text-sm text-slate-600">No hay citas ese día.</p>
              ) : (
                citasDelDia.map((cita) => (
                  <button
                    key={cita.id}
                    type="button"
                    onClick={() => setCitaDetalle(cita)}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
                      <IconoPata className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">{cita.mascota_nombre}</span>
                      <span className="block truncate text-xs text-slate-600">
                        {formatearHora(cita.fecha_hora)} · {cita.servicio_nombre}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {categoriasEnUso.length > 0 && (
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="font-heading text-sm font-semibold text-brand-navy">Tipos de servicio</p>
              <div className="mt-3 flex flex-col gap-2">
                {categoriasEnUso.map((c) => (
                  <div key={c.nombre} className="flex items-center gap-2 text-sm text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: (COLORES_CATEGORIA[c.color] ?? COLORES_CATEGORIA.blue).dot }}
                    />
                    {c.nombre}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>

      {/* Mismo detalle con iconos que ve el medico. La sede ve ademas el medico de la cita;
          la informacion medica de la mascota es solo para el medico. */}
      <DetalleCitaMedicoPanel
        cita={citaDetalle}
        onClose={() => setCitaDetalle(null)}
        mostrarMedico={esAdmin}
        mostrarInfoMedica={!esAdmin}
        onCancelada={() => {
          setCitaDetalle(null);
          cargarCitas();
        }}
        onReprogramada={() => {
          setCitaDetalle(null);
          cargarCitas();
        }}
      />

      {/* "Nueva cita" abre una ventana centrada (NuevaCitaModal). */}
      {esAdmin && (
        <NuevaCitaModal
          abierto={panelNuevaAbierto}
          onCerrar={() => setPanelNuevaAbierto(false)}
          onAgendada={() => {
            setPanelNuevaAbierto(false);
            cargarCitas();
          }}
          clientes={clientes}
          servicios={servicios}
          sedeId={usuario.sedeId}
          diasAbiertos={diasAbiertos}
        />
      )}
    </>
  );
}
