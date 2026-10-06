// components/admin/PanelReportes.jsx
// Reportes agregados (vista multisede). Los graficos de barras/dona
// usan Recharts; "Exportar" genera Excel/PDF reales en el navegador a
// partir de los mismos datos ya cargados (sin endpoint de exportacion).
import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { obtenerReportes, obtenerSedesAdmin } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatearFechaLarga, formatearHora, hoyComoFechaLocal } from '../../utils/fecha';
import { COLORES_CATEGORIA } from '../ui/CategoryBadge';
import { PageHeader } from '../ui/PageHeader';
import { KPICard } from '../ui/KPICard';
import { DataTable } from '../ui/DataTable';
import { EstadoError } from '../ui/EstadoError';
import { IconoCalendario, IconoJeringa, IconoMedicos, IconoPersona } from '../icons';

// Orden categorico fijo (mismo set que las categorias de servicio, ver
// CategoryBadge.jsx), reutilizado aqui para identificar sedes: nunca
// se genera un color nuevo, se recorre siempre el mismo orden.
const ORDEN_COLOR = ['blue', 'amber', 'teal', 'purple', 'pink', 'cyan', 'orange'];
const COLOR_ESTADO = { agendada: '#16A34A', cancelada: '#94A3B8' };

const formatoSemana = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });

function colorPara(indice) {
  const clave = ORDEN_COLOR[indice % ORDEN_COLOR.length];
  return COLORES_CATEGORIA[clave].dot;
}

function calcularTendencia(actual, anterior) {
  if (anterior === 0) return actual > 0 ? '+100% vs. mes anterior' : 'Sin cambios vs. mes anterior';
  const cambio = Math.round(((actual - anterior) / anterior) * 100);
  const signo = cambio > 0 ? '+' : '';
  return `${signo}${cambio}% vs. mes anterior`;
}

function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

function filasExportables(ultimasCitas) {
  return ultimasCitas.map((c) => ({
    fecha: `${formatearFechaLarga(c.fecha_hora)} ${formatearHora(c.fecha_hora)}`,
    sede: c.sede_nombre,
    servicio: c.servicio_nombre,
    medico: c.medico_nombre,
    cliente: c.cliente_nombre,
    mascota: c.mascota_nombre,
    estado: c.estado === 'agendada' ? 'Agendada' : 'Cancelada',
  }));
}

export function PanelReportes() {
  const { token } = useAuth();
  const [sedes, setSedes] = useState([]);
  const [sedeId, setSedeId] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [exportando, setExportando] = useState('');

  function cargar() {
    setCargando(true);
    setErrorCarga('');
    obtenerReportes({ sedeId: sedeId || undefined, desde: desde || undefined, hasta: hasta || undefined }, token)
      .then((resultado) => {
        setDatos(resultado);
      })
      .catch((err) => setErrorCarga(err.message || 'No se pudo generar el reporte.'))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [token]);
  useEffect(() => {
    obtenerSedesAdmin(token)
      .then((resultado) => setSedes(resultado.sedes))
      .catch((err) => console.error('No se pudieron cargar las sedes:', err));
  }, [token]);

  const nombresSede = useMemo(() => {
    if (!datos) return [];
    return Array.from(new Set(datos.citasPorSemana.map((f) => f.sede_nombre))).sort();
  }, [datos]);

  const datosSemana = useMemo(() => {
    if (!datos) return [];
    const porSemana = new Map();
    datos.citasPorSemana.forEach((fila) => {
      const etiqueta = formatoSemana.format(new Date(fila.semana));
      if (!porSemana.has(etiqueta)) porSemana.set(etiqueta, { semana: etiqueta });
      porSemana.get(etiqueta)[fila.sede_nombre] = fila.total;
    });
    return Array.from(porSemana.values());
  }, [datos]);

  async function exportarExcel() {
    if (!datos) return;
    setExportando('excel');
    try {
      const libro = new ExcelJS.Workbook();
      const hoja = libro.addWorksheet('Últimas citas');
      hoja.columns = [
        { header: 'Fecha', key: 'fecha', width: 28 },
        { header: 'Sede', key: 'sede', width: 30 },
        { header: 'Servicio', key: 'servicio', width: 20 },
        { header: 'Médico', key: 'medico', width: 25 },
        { header: 'Cliente', key: 'cliente', width: 25 },
        { header: 'Mascota', key: 'mascota', width: 15 },
        { header: 'Estado', key: 'estado', width: 12 },
      ];
      filasExportables(datos.ultimasCitas).forEach((fila) => hoja.addRow(fila));
      hoja.getRow(1).font = { bold: true };

      const buffer = await libro.xlsx.writeBuffer();
      descargarBlob(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `reporte-citas-${hoyComoFechaLocal()}.xlsx`
      );
    } finally {
      setExportando('');
    }
  }

  function exportarPDF() {
    if (!datos) return;
    setExportando('pdf');
    try {
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text('Reporte de citas — Clínica Veterinaria UDES', 14, 16);
      doc.setFontSize(10);
      doc.text(
        `Citas del mes: ${datos.kpis.citasMes} · Servicios activos: ${datos.kpis.serviciosActivos} · Médicos activos: ${datos.kpis.medicosActivos}`,
        14,
        23
      );

      autoTable(doc, {
        startY: 28,
        head: [['Fecha', 'Sede', 'Servicio', 'Médico', 'Cliente', 'Mascota', 'Estado']],
        body: filasExportables(datos.ultimasCitas).map((f) => [f.fecha, f.sede, f.servicio, f.medico, f.cliente, f.mascota, f.estado]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [11, 60, 116] },
      });

      doc.save(`reporte-citas-${hoyComoFechaLocal()}.pdf`);
    } finally {
      setExportando('');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reportes"
        subtitle="Indicadores y tendencias de citas en todas las sedes."
        actionLabel="Generar reporte"
        actionColor="blue"
        onAction={cargar}
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500">Sede</label>
          <select
            value={sedeId}
            onChange={(e) => setSedeId(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
          >
            <option value="">Todas las sedes</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500">Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500">Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none" />
        </div>
      </div>

      {cargando ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((k) => (
            <div key={k} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : errorCarga || !datos ? (
        <EstadoError mensaje={errorCarga || 'No se pudo generar el reporte.'} onReintentar={cargar} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KPICard icon={IconoCalendario} color="blue" value={datos.kpis.citasMes} label={`Citas este mes · ${calcularTendencia(datos.kpis.citasMes, datos.kpis.citasMesAnterior)}`} />
            <KPICard icon={IconoJeringa} color="green" value={datos.kpis.serviciosActivos} label="Servicios activos" />
            <KPICard icon={IconoMedicos} color="blue" value={datos.kpis.medicosActivos} label="Médicos activos" />
            <KPICard icon={IconoPersona} color="amber" value={datos.kpis.pacientesRegistrados} label="Pacientes registrados" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="font-heading text-sm font-semibold text-brand-navy">Citas por semana, por sede</p>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosSemana}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="semana" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94A3B8" />
                    <Tooltip />
                    <Legend />
                    {nombresSede.map((nombre, indice) => (
                      <Bar key={nombre} dataKey={nombre} fill={colorPara(indice)} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="font-heading text-sm font-semibold text-brand-navy">Servicios más solicitados</p>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datos.rankingServicios} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94A3B8" />
                    <YAxis type="category" dataKey="servicio" width={140} tick={{ fontSize: 12 }} stroke="#94A3B8" />
                    <Tooltip />
                    <Bar dataKey="total" fill="#4280F7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="font-heading text-sm font-semibold text-brand-navy">Citas por sede</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={datos.citasPorSede} dataKey="total" nameKey="sede" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {datos.citasPorSede.map((entrada, indice) => (
                        <Cell key={entrada.sede} fill={colorPara(indice)} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="font-heading text-sm font-semibold text-brand-navy">Estado de las citas</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={datos.estadoCitas} dataKey="total" nameKey="estado" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {datos.estadoCitas.map((entrada) => (
                        <Cell key={entrada.estado} fill={COLOR_ESTADO[entrada.estado] ?? '#94A3B8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend formatter={(valor) => (valor === 'agendada' ? 'Agendada' : 'Cancelada')} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div>
              <p className="mb-3 font-heading text-sm font-semibold text-brand-navy">Últimas citas registradas</p>
              <DataTable
                filaVacia="No hay citas en el rango seleccionado."
                columns={[
                  { header: 'Fecha', render: (c) => `${formatearFechaLarga(c.fecha_hora)} · ${formatearHora(c.fecha_hora)}` },
                  { header: 'Sede', render: (c) => c.sede_nombre },
                  { header: 'Servicio', render: (c) => c.servicio_nombre },
                  { header: 'Cliente', render: (c) => c.cliente_nombre },
                  {
                    header: 'Estado',
                    render: (c) => (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.estado === 'agendada' ? 'bg-emerald-50 text-brand-green' : 'bg-slate-100 text-slate-500'}`}>
                        {c.estado === 'agendada' ? 'Agendada' : 'Cancelada'}
                      </span>
                    ),
                  },
                ]}
                rows={datos.ultimasCitas}
              />
            </div>

            <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="font-heading text-sm font-semibold text-brand-navy">Exportar reportes</p>
              <button
                type="button"
                onClick={exportarExcel}
                disabled={Boolean(exportando)}
                className="rounded-boton border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {exportando === 'excel' ? 'Generando...' : 'Descargar Excel'}
              </button>
              <button
                type="button"
                onClick={exportarPDF}
                disabled={Boolean(exportando)}
                className="rounded-boton border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {exportando === 'pdf' ? 'Generando...' : 'Descargar PDF'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
