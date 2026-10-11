// components/medico/PanelMisCitasMedico.jsx
// "Mis citas": pestaña de inicio de la vista del medico (/medico). Solo sus
// citas (GET /api/administracion/citas ya las filtra por medico).
// Presentacion vetUI, igual que la vista del cliente: va directo sobre el
// fondo de marca, con los indicadores, el calendario y las tarjetas de la
// derecha en vidrio blanco (TarjetaDato / Tarjeta) y los controles en
// vidrio (Pestanas, boton-glass-claro). El titulo y "Agendar nueva cita" los
// pone la pagina (PanelMedicoPage), junto a las pestañas.
// - 4 KPIs reales: citas esta semana, citas hoy, proximas citas y
//   pacientes (mascotas) atendidos este mes.
// - Vistas Semana / Dia (mismo grid del admin, CalendarioSemanal) y
//   Agenda (lista agrupada por dia de la semana visible).
// - Columna derecha: mini calendario, citas de hoy y conteo real por
//   categoria de servicio de la semana visible (colores de la BD).
// "Agendar nueva cita" abre AgendarCitaMedicoPanel (cita con el mismo
// medico, en su sede).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { obtenerCitasAdministracion } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  esMismoDia,
  formatearFechaLarga,
  formatearHora,
  formatearMesAnio,
  formatearRangoSemana,
  inicioDeSemana,
  sumarDias,
} from '../../utils/fecha';
import { Pestanas, Tarjeta, TarjetaDato } from '../vetui';
// EstadoError del panel (claro): aca se muestra dentro de un vidrio blanco.
import { EstadoError } from '../ui/EstadoError';
import { COLORES_CATEGORIA } from '../ui/CategoryBadge';
import { MiniCalendario } from '../citas/MiniCalendario';
import { CalendarioSemanal } from '../citas/CalendarioSemanal';
import { estadoDeCita } from '../citas/DetalleCitaPanel';
import { AvatarMascota } from '../cliente/AvatarMascota';
import { DetalleCitaMedicoPanel } from './DetalleCitaMedicoPanel';
import { CrearRecordatorioPanel } from './CrearRecordatorioPanel';
import { AgendarCitaMedicoPanel } from './AgendarCitaMedicoPanel';
import { IconoCalendario, IconoCampana, IconoCorazon, IconoFlechaDerecha, IconoReloj } from '../icons';

const VISTAS = [
  { id: 'semana', etiqueta: 'Semana' },
  { id: 'dia', etiqueta: 'Día' },
  { id: 'agenda', etiqueta: 'Agenda' },
];

const COLOR_ESTADO = { proxima: 'bg-brand-blue', completada: 'bg-brand-green', cancelada: 'bg-brand-red' };

function hoyAMedianoche() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
}

// senalAgendar: contador que sube cada vez que se pulsa "Agendar cita" en la
// pildora (PanelMedicoPage); al cambiar, se abre el panel de agendar.
export function PanelMisCitasMedico({ senalAgendar = 0 }) {
  const { token } = useAuth();
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [vista, setVista] = useState('semana');
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoyAMedianoche);
  const [citaDetalle, setCitaDetalle] = useState(null);
  const [agendarAbierto, setAgendarAbierto] = useState(senalAgendar > 0);
  // Ajuste durante el render (sin efecto): una señal nueva abre el panel.
  const [senalVista, setSenalVista] = useState(senalAgendar);
  if (senalAgendar !== senalVista) {
    setSenalVista(senalAgendar);
    setAgendarAbierto(true);
  }
  const [recordatorioPara, setRecordatorioPara] = useState(null); // { mascota, dueno }

  const cargar = useCallback(() => {
    obtenerCitasAdministracion(token)
      .then((datos) => {
        setCitas(datos.citas);
        setErrorCarga('');
      })
      .catch((err) => setErrorCarga(err.message || 'No se pudieron cargar tus citas.'))
      .finally(() => setCargando(false));
  }, [token]);

  useEffect(cargar, [cargar]);

  // Lunes de la semana visible como numero: dependencia estable para los useMemo.
  const inicioSemanaMs = inicioDeSemana(diaSeleccionado).getTime();
  const semanaInicio = useMemo(() => new Date(inicioSemanaMs), [inicioSemanaMs]);
  const diasSemana = useMemo(() => Array.from({ length: 6 }, (_, i) => sumarDias(semanaInicio, i)), [semanaInicio]);

  const kpis = useMemo(() => {
    const ahora = new Date();
    const inicioHoy = hoyAMedianoche();
    const inicioSemanaActual = inicioDeSemana(inicioHoy);
    const finSemanaActual = sumarDias(inicioSemanaActual, 7);
    const inicioMes = new Date(inicioHoy.getFullYear(), inicioHoy.getMonth(), 1);
    const activas = citas.filter((c) => c.estado === 'agendada');
    const enRango = (c, desde, hasta) => new Date(c.fecha_hora) >= desde && new Date(c.fecha_hora) < hasta;

    return {
      semana: activas.filter((c) => enRango(c, inicioSemanaActual, finSemanaActual)).length,
      hoy: activas.filter((c) => esMismoDia(new Date(c.fecha_hora), inicioHoy)).length,
      proximas: activas.filter((c) => new Date(c.fecha_hora) > ahora).length,
      // Mascotas distintas con cita ya pasada (no cancelada) en este mes.
      atendidosMes: new Set(activas.filter((c) => enRango(c, inicioMes, ahora)).map((c) => c.mascota_id)).size,
    };
  }, [citas]);

  const citasDeHoy = useMemo(
    () =>
      citas
        .filter((c) => esMismoDia(new Date(c.fecha_hora), new Date()))
        .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora)),
    [citas]
  );

  // Semana visible completa (lunes a domingo, fin exclusivo).
  const citasSemanaVisible = useMemo(() => {
    const finSemana = sumarDias(semanaInicio, 7);
    return citas
      .filter((c) => new Date(c.fecha_hora) >= semanaInicio && new Date(c.fecha_hora) < finSemana)
      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
  }, [citas, semanaInicio]);

  // Conteo real por categoria (sin canceladas) en la semana visible.
  const tiposSemana = useMemo(() => {
    const mapa = new Map();
    citasSemanaVisible
      .filter((c) => c.estado === 'agendada')
      .forEach((c) => {
        const actual = mapa.get(c.categoria_nombre) || { nombre: c.categoria_nombre, color: c.categoria_color, total: 0 };
        actual.total += 1;
        mapa.set(c.categoria_nombre, actual);
      });
    return [...mapa.values()].sort((a, b) => b.total - a.total);
  }, [citasSemanaVisible]);

  function mover(direccion) {
    setDiaSeleccionado((dia) => sumarDias(dia, vista === 'dia' ? direccion : direccion * 7));
  }

  const etiquetaRango =
    vista === 'dia'
      ? formatearFechaLarga(diaSeleccionado)
      : `${formatearMesAnio(semanaInicio)} · ${formatearRangoSemana(semanaInicio, sumarDias(semanaInicio, 5))}`;

  const panelAbierto = Boolean(citaDetalle) || agendarAbierto || Boolean(recordatorioPara);

  return (
    <>
      <div className="flex flex-col gap-6" inert={panelAbierto} aria-hidden={panelAbierto}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <TarjetaDato icono={IconoCalendario} tono="azul" valor={kpis.semana} etiqueta="Citas esta semana" />
          <TarjetaDato icono={IconoReloj} tono="verde" valor={kpis.hoy} etiqueta="Citas hoy" />
          <TarjetaDato icono={IconoFlechaDerecha} tono="ambar" valor={kpis.proximas} etiqueta="Próximas citas" />
          <TarjetaDato icono={IconoCorazon} tono="rosa" valor={kpis.atendidosMes} etiqueta="Pacientes atendidos este mes" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" aria-label="Anterior" onClick={() => mover(-1)} className="boton-texto rounded-boton p-2 text-white transition">
              <IconoFlechaDerecha className="h-4 w-4 rotate-180" />
            </button>
            <button type="button" aria-label="Siguiente" onClick={() => mover(1)} className="boton-texto rounded-boton p-2 text-white transition">
              <IconoFlechaDerecha className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDiaSeleccionado(hoyAMedianoche())}
              className="boton-glass-claro rounded-boton px-4 py-1.5 text-sm font-semibold text-white transition"
            >
              Hoy
            </button>
            <p className="ml-1 font-heading text-base font-semibold text-white">{etiquetaRango}</p>
          </div>

          <Pestanas items={VISTAS} activo={vista} onCambiar={setVista} etiqueta="Vista del calendario" />
        </div>

        <div className="flex flex-col gap-6 xl:flex-row">
          <Tarjeta material="blanco" className="grises-legibles min-w-0 flex-1 overflow-x-auto p-4">
            {cargando ? (
              <div className="flex flex-col gap-2 p-4">
                {[0, 1, 2, 3].map((k) => (
                  <div key={k} className="h-10 animate-pulse rounded-lg bg-slate-400/25" />
                ))}
              </div>
            ) : errorCarga ? (
              <EstadoError
                mensaje={errorCarga}
                onReintentar={() => {
                  setCargando(true);
                  cargar();
                }}
              />
            ) : vista === 'agenda' ? (
              <VistaAgenda dias={diasSemana} citas={citasSemanaVisible} onSeleccionar={setCitaDetalle} />
            ) : (
              <CalendarioSemanal
                dias={vista === 'dia' ? [diaSeleccionado] : diasSemana}
                citas={citas}
                onSeleccionarCita={setCitaDetalle}
              />
            )}
          </Tarjeta>

          <div className="flex w-full shrink-0 flex-col gap-4 xl:w-80">
            <MiniCalendario diaSeleccionado={diaSeleccionado} onSeleccionarDia={setDiaSeleccionado} clase="grises-legibles vidrio-blanco rounded-superficie p-5" />

            <Tarjeta material="blanco" className="p-5">
              <p className="font-heading text-base font-semibold text-brand-navy">Citas de hoy</p>
              <div className="mt-3 flex flex-col gap-1">
                {citasDeHoy.length === 0 ? (
                  <p className="text-sm text-slate-700">No tienes citas hoy.</p>
                ) : (
                  citasDeHoy.map((cita) => (
                    <button
                      key={cita.id}
                      type="button"
                      onClick={() => setCitaDetalle(cita)}
                      className="hover-ilumina flex items-center gap-2.5 rounded-tarjeta px-2 py-1.5 text-left transition hover:bg-white/70"
                    >
                      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${COLOR_ESTADO[estadoDeCita(cita)]}`} />
                      <span className="w-16 shrink-0 text-xs font-semibold text-slate-700">{formatearHora(cita.fecha_hora)}</span>
                      <AvatarMascota
                        mascota={{ nombre: cita.mascota_nombre, foto_url: cita.mascota_foto_url }}
                        className="h-8 w-8"
                        iconoClassName="h-4 w-4"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">{cita.mascota_nombre}</span>
                        <span className="block truncate text-xs text-slate-700">
                          {cita.cliente_nombre} · {cita.servicio_nombre}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </Tarjeta>

            <Tarjeta material="blanco" className="p-5">
              <p className="font-heading text-base font-semibold text-brand-navy">Tipos de servicio (esta semana)</p>
              <div className="mt-3 flex flex-col gap-2">
                {tiposSemana.length === 0 ? (
                  <p className="text-sm text-slate-700">Sin citas esta semana.</p>
                ) : (
                  tiposSemana.map((t) => (
                    <div key={t.nombre} className="flex items-center gap-2 text-sm text-slate-800">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: (COLORES_CATEGORIA[t.color] ?? COLORES_CATEGORIA.blue).dot }}
                      />
                      <span className="flex-1">{t.nombre}</span>
                      <span className="font-semibold text-slate-900">{t.total}</span>
                    </div>
                  ))
                )}
              </div>
            </Tarjeta>
          </div>
        </div>
      </div>

      <DetalleCitaMedicoPanel
        cita={citaDetalle}
        onClose={() => setCitaDetalle(null)}
        onCancelada={() => {
          setCitaDetalle(null);
          cargar();
        }}
        acciones={(cita) => (
          <button
            type="button"
            onClick={() =>
              setRecordatorioPara({
                mascota: {
                  id: cita.mascota_id,
                  nombre: cita.mascota_nombre,
                  especie: cita.mascota_especie,
                  raza: cita.mascota_raza,
                  foto_url: cita.mascota_foto_url,
                },
                dueno: cita.cliente_nombre,
              })
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-boton border border-brand-blue px-4 py-2.5 text-sm font-semibold text-brand-blue-600 transition hover:bg-blue-50"
          >
            <IconoCampana className="h-4 w-4" />
            Crear recordatorio
          </button>
        )}
      />
      <CrearRecordatorioPanel
        mascota={recordatorioPara?.mascota ?? null}
        nombreDueno={recordatorioPara?.dueno}
        onClose={() => setRecordatorioPara(null)}
      />
      <AgendarCitaMedicoPanel
        isOpen={agendarAbierto}
        onClose={() => setAgendarAbierto(false)}
        onAgendada={() => {
          setAgendarAbierto(false);
          cargar();
        }}
      />
    </>
  );
}

// Vista Agenda: lista de la semana visible agrupada por dia.
function VistaAgenda({ dias, citas, onSeleccionar }) {
  const conCitas = dias.map((dia) => ({ dia, citas: citas.filter((c) => esMismoDia(new Date(c.fecha_hora), dia)) }));
  if (citas.length === 0) {
    return <p className="p-6 text-center text-sm text-slate-700">No tienes citas en esta semana.</p>;
  }
  return (
    <div className="flex flex-col gap-5 p-2">
      {conCitas
        .filter((grupo) => grupo.citas.length > 0)
        .map((grupo) => (
          <div key={grupo.dia.toISOString()}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700">{formatearFechaLarga(grupo.dia)}</p>
            <div className="flex flex-col gap-2">
              {grupo.citas.map((cita) => {
                const tono = COLORES_CATEGORIA[cita.categoria_color] ?? COLORES_CATEGORIA.blue;
                return (
                  <button
                    key={cita.id}
                    type="button"
                    onClick={() => onSeleccionar(cita)}
                    className="hover-ilumina flex items-center gap-3 rounded-tarjeta bg-white/60 p-3 text-left ring-1 ring-slate-900/10 transition"
                  >
                    <span className="w-1 self-stretch rounded-full" style={{ backgroundColor: tono.dot }} aria-hidden="true" />
                    <span className="w-20 shrink-0 text-sm font-semibold text-slate-700">{formatearHora(cita.fecha_hora)}</span>
                    <AvatarMascota mascota={{ nombre: cita.mascota_nombre, foto_url: cita.mascota_foto_url }} className="h-9 w-9" iconoClassName="h-4 w-4" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{cita.mascota_nombre}</span>
                      <span className="block truncate text-xs text-slate-700">
                        {cita.cliente_nombre} · {cita.servicio_nombre}
                      </span>
                    </span>
                    {cita.estado === 'cancelada' && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">Cancelada</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}
