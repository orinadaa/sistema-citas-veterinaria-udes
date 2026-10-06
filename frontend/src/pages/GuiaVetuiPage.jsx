// pages/GuiaVetuiPage.jsx
// Guía visual viva de vetUI (ruta /vetui): cada fundamento y componente
// del sistema de diseño renderizado con el código real, sobre el fondo
// real. Sirve para revisar cambios del sistema en un solo lugar y como
// referencia para construir pantallas nuevas. Documentación: docs/vetui.md.
import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import {
  Aviso,
  AreaTexto,
  Boton,
  Chips,
  CampoTexto,
  Dialogo,
  EncabezadoPagina,
  Esqueleto,
  EstadoError,
  EstadoVacio,
  FondoVetui,
  Insignia,
  PanelLateral,
  Pestanas,
  Superficie,
  Tarjeta,
  TarjetaDato,
  TituloSeccion,
} from '../components/vetui';
import { IconoCalendario, IconoCorazon, IconoFlechaDerecha, IconoMas, IconoPata } from '../components/icons';

const COLORES = [
  { nombre: 'brand-blue-500', valor: '#4280F7', uso: 'Azul de marca, topbar, inicio del fondo' },
  { nombre: 'brand-blue-800', valor: '#06338A', uso: 'Fondo profundo, vidrio azul' },
  { nombre: 'brand-amber', valor: '#F7A71C', uso: 'Acción principal y estado activo' },
  { nombre: 'brand-green', valor: '#16A34A', uso: 'Completado, éxito' },
  { nombre: 'brand-red', valor: '#E4434B', uso: 'Peligro, cancelar' },
  { nombre: 'brand-navy', valor: '#0B3C74', uso: 'Títulos sobre cristal fuerte' },
];

function Bloque({ titulo, descripcion, children }) {
  return (
    <Superficie className="flex flex-col gap-5">
      <TituloSeccion titulo={titulo} descripcion={descripcion} />
      {children}
    </Superficie>
  );
}

export function GuiaVetuiPage() {
  const [pestana, setPestana] = useState('citas');
  const [chip, setChip] = useState('todas');
  const [elegida, setElegida] = useState(1);
  const [panel, setPanel] = useState(false);
  const [dialogo, setDialogo] = useState(false);

  return (
    <FondoVetui>
      <Navbar />
      <div inert={panel || dialogo}>
        <EncabezadoPagina
          antetitulo="Sistema de diseño"
          titulo="vetUI"
          descripcion="Floating glass para el sistema de citas de la Clínica Veterinaria UDES: superficies de vidrio que flotan sobre el azul de marca."
        />

        <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-20 sm:px-6">
          <Bloque titulo="Color" descripcion="Paleta de marca. El ámbar es único: acción principal y estado activo.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {COLORES.map((c) => (
                <Tarjeta key={c.nombre} className="flex items-center gap-3 p-3">
                  <span className="h-12 w-12 shrink-0 rounded-xl ring-1 ring-black/10" style={{ backgroundColor: c.valor }} />
                  <span>
                    <span className="block text-sm font-semibold">{c.nombre}</span>
                    <span className="block text-xs text-slate-700">{c.valor} · {c.uso}</span>
                  </span>
                </Tarjeta>
              ))}
            </div>
          </Bloque>

          <Bloque titulo="Tipografía" descripcion="Manrope en 400, 500, 600 y 700.">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-50">Antetítulo · xs semibold mayúsculas</p>
              <p className="text-4xl font-bold tracking-tight">Título de página · 4xl bold</p>
              <p className="text-xl font-bold">Título de sección · xl bold</p>
              <p className="font-semibold">Título de tarjeta · base semibold</p>
              <p className="text-blue-50">Cuerpo sobre fondo oscuro · base, blue-50</p>
              <p className="text-sm text-blue-100">Secundario sobre fondo oscuro · sm, blue-100</p>
            </div>
          </Bloque>

          <Bloque titulo="Materiales" descripcion="Cuatro capas: fondo, vidrio, cristal y cristal fuerte.">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="vidrio rounded-tarjeta p-4">
                <p className="font-semibold">Vidrio</p>
                <p className="text-sm text-blue-100">Contenedores sobre el fondo. Texto blanco.</p>
              </div>
              <Tarjeta className="p-4">
                <p className="font-semibold">Cristal</p>
                <p className="text-sm text-slate-700">Contenido u objetos. Texto oscuro.</p>
              </Tarjeta>
              <div className="cristal-fuerte rounded-tarjeta p-4">
                <p className="font-semibold text-brand-navy">Cristal fuerte</p>
                <p className="text-sm text-slate-700">Paneles y diálogos superpuestos.</p>
              </div>
              <Tarjeta tono="celeste" className="p-4">
                <p className="font-semibold">Cristal celeste</p>
                <p className="text-sm text-slate-700">Tinte para destacar (próxima cita).</p>
              </Tarjeta>
              <Tarjeta tono="crema" className="p-4">
                <p className="font-semibold">Cristal crema</p>
                <p className="text-sm text-slate-700">Segundo tinte (horarios).</p>
              </Tarjeta>
              <div className="vidrio-azul rounded-tarjeta p-4">
                <p className="font-semibold">Vidrio azul</p>
                <p className="text-sm text-blue-100">Sobre contenido que puede ser claro.</p>
              </div>
            </div>
          </Bloque>

          <Bloque titulo="Botones" descripcion="Una sola acción primaria (ámbar) por vista.">
            <div className="flex flex-wrap items-center gap-3">
              <Boton iconoFinal={IconoFlechaDerecha}>Primario</Boton>
              <Boton variante="secundario">Secundario</Boton>
              <Boton variante="inverso">Inverso</Boton>
              <Boton variante="peligro">Peligro</Boton>
              <Boton variante="primario" disabled>
                Deshabilitado
              </Boton>
              <Boton variante="primario" tamano="lg" icono={IconoMas}>
                Grande
              </Boton>
            </div>
            <Tarjeta className="flex flex-wrap items-center gap-3 p-4">
              <span className="text-sm font-semibold text-slate-700">Sobre cristal:</span>
              <Boton>Primario</Boton>
              <Boton variante="contorno">Contorno</Boton>
              <Boton variante="peligro-claro">Peligro claro</Boton>
              <Boton variante="contorno" tamano="sm" iconoFinal={IconoFlechaDerecha}>
                Pequeño
              </Boton>
            </Tarjeta>
          </Bloque>

          <Bloque titulo="Navegación" descripcion="Pestañas para vistas hermanas; chips para filtrar.">
            <Pestanas
              items={[
                { id: 'citas', etiqueta: 'Mis citas', icono: IconoCalendario },
                { id: 'mascotas', etiqueta: 'Mis mascotas', icono: IconoPata },
              ]}
              activo={pestana}
              onCambiar={setPestana}
            />
            <Chips
              items={[
                { id: 'todas', etiqueta: 'Todas', conteo: 6 },
                { id: 'proximas', etiqueta: 'Próximas', conteo: 2 },
                { id: 'completadas', etiqueta: 'Completadas', conteo: 4 },
              ]}
              activo={chip}
              onCambiar={setChip}
            />
          </Bloque>

          <Bloque titulo="Tarjetas y selección" descripcion="Opciones elegibles: anillo y check ámbar.">
            <div className="grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <Tarjeta
                  key={n}
                  as="button"
                  type="button"
                  interactiva
                  seleccionada={elegida === n}
                  aria-pressed={elegida === n}
                  onClick={() => setElegida(n)}
                  className="p-4"
                >
                  <p className="font-semibold">Opción {n}</p>
                  <p className="text-sm text-slate-700">Tarjeta de cristal interactiva</p>
                </Tarjeta>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <TarjetaDato icono={IconoCalendario} valor="12 oct" detalle="9:00 a. m." etiqueta="Próxima cita" onClick={() => {}} />
              <TarjetaDato icono={IconoPata} tono="ambar" valor={3} etiqueta="Mascotas registradas" />
              <TarjetaDato icono={IconoCorazon} tono="rosa" valor={8} etiqueta="Citas realizadas" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Insignia estado="proxima" />
              <Insignia estado="completada" />
              <Insignia estado="cancelada" />
              <Insignia tono="ambar">Sede principal</Insignia>
            </div>
          </Bloque>

          <Bloque titulo="Formularios" descripcion="Campos claros con etiqueta blanca; foco ámbar.">
            <div className="grid gap-4 md:grid-cols-2">
              <CampoTexto id="guia-nombre" etiqueta="Nombre de la mascota" requerido placeholder="Ej. Luna" />
              <AreaTexto id="guia-motivo" etiqueta="Motivo (opcional)" rows={2} placeholder="Ej. Revisión anual" />
            </div>
          </Bloque>

          <Bloque titulo="Estados" descripcion="Avisos, vacío, error y carga.">
            <div className="grid gap-3 md:grid-cols-2">
              <Aviso tono="info">Selecciona un día para ver los horarios.</Aviso>
              <Aviso tono="ok">Luna se agregó a tus mascotas.</Aviso>
              <Aviso tono="alerta">La foto no se pudo subir; inténtalo de nuevo.</Aviso>
              <Aviso tono="error">No se pudo agendar la cita.</Aviso>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <EstadoVacio>Aún no has registrado mascotas.</EstadoVacio>
              <EstadoError mensaje="No se pudieron cargar tus citas." onReintentar={() => {}} />
              <div className="flex flex-col gap-2">
                <Esqueleto className="h-10" />
                <Esqueleto className="h-10" />
                <Esqueleto className="h-10" />
              </div>
            </div>
          </Bloque>

          <Bloque titulo="Superpuestos" descripcion="Panel lateral y diálogo en cristal fuerte sobre un velo.">
            <div className="flex flex-wrap gap-3">
              <Boton variante="secundario" onClick={() => setPanel(true)}>
                Abrir panel lateral
              </Boton>
              <Boton variante="secundario" onClick={() => setDialogo(true)}>
                Abrir diálogo
              </Boton>
            </div>
          </Bloque>
        </main>
      </div>

      <PanelLateral
        isOpen={panel}
        onClose={() => setPanel(false)}
        title="Panel lateral"
        footer={
          <div className="flex gap-3">
            <Boton variante="contorno" className="flex-1" onClick={() => setPanel(false)}>
              Cancelar
            </Boton>
            <Boton className="flex-1" onClick={() => setPanel(false)}>
              Guardar
            </Boton>
          </div>
        }
      >
        <p className="text-sm text-slate-700">Formularios y detalles se abren aquí, flotando a la derecha.</p>
      </PanelLateral>

      <Dialogo
        abierto={dialogo}
        onCerrar={() => setDialogo(false)}
        titulo="¿Salir sin agendar la cita?"
        descripcion="Perderás lo que ya elegiste."
      >
        <Boton variante="contorno" onClick={() => setDialogo(false)}>
          Seguir agendando
        </Boton>
        <Boton variante="peligro-claro" onClick={() => setDialogo(false)}>
          Sí, salir
        </Boton>
      </Dialogo>
    </FondoVetui>
  );
}
