// pages/GuiaVetuiPage.jsx
// Guía visual viva de vetUI (ruta /vetui): cada fundamento y componente
// del sistema de diseño renderizado con el código real, sobre el fondo
// real. Sirve para revisar cambios del sistema en un solo lugar y como
// referencia para construir pantallas nuevas. Documentación: docs/vetui.md.
import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { useAnclaTopbar } from '../hooks/useAnclaTopbar';
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
import { CampoFecha } from '../components/form/CampoFecha';
import { ZonaFoto } from '../components/form/ZonaFoto';
import { Campo } from '../components/form/Campo';
import { Desplegable } from '../components/form/Desplegable';
import { CampoHora } from '../components/form/CampoHora';
import { CampoBusqueda } from '../components/form/CampoBusqueda';
import { FotoMascotaModal } from '../components/cliente/FotoMascotaModal';
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
  const [fechaCita, setFechaCita] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [foto, setFoto] = useState(null);
  const [editorFoto, setEditorFoto] = useState(false);
  // Bloque "Campos de formulario".
  const [campos, setCampos] = useState({
    nombre: '',
    precio: '60000',
    sede: '',
    raza: 'Caniche (poodle)',
    hora: '08:00',
    busqueda: '',
    notas: '',
    zoom: 40,
    soloHoras: true,
  });
  const cambiar = (clave) => (e) => setCampos((actual) => ({ ...actual, [clave]: e.target.value }));

  // Scroll en dos posiciones, como en todas las paginas con <Navbar/>.
  useAnclaTopbar();

  return (
    <FondoVetui>
      <Navbar />
      <div inert={panel || dialogo || editorFoto}>
        <EncabezadoPagina
          antetitulo="Sistema de diseño"
          titulo="vetUI"
          descripcion="Floating glass para el sistema de citas de la Clínica Veterinaria UDES: superficies de vidrio que flotan sobre el azul de marca."
        />

        <main data-ancla-topbar className="mx-auto flex max-w-7xl scroll-mt-28 flex-col gap-6 px-4 pb-20 sm:px-6">
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

          <Bloque titulo="Tipografía" descripcion="Raleway en 400, 500, 600 y 700.">
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
              <div className="vidrio-blanco rounded-tarjeta p-4">
                <p className="font-semibold">Vidrio blanco</p>
                <p className="text-sm text-slate-700">Tarjetas de contenido de la app. Texto oscuro.</p>
              </div>
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

          {/* Directo sobre el fondo (no dentro de un Bloque): asi se ve el
              vidrio real; anidado en otro vidrio usaria el relleno profundo. */}
          <section className="flex flex-col gap-4 py-2">
            <TituloSeccion titulo="Tarjetas" descripcion="Sobre el fondo: vidrio, como las secciones del landing. Dentro de un vidrio: cristal." />
            <div className="grid gap-3 sm:grid-cols-3">
              <Tarjeta material="vidrio" className="p-5">
                <p className="font-semibold">Tarjeta de vidrio</p>
                <p className="text-sm text-blue-100">Citas, mascotas, indicadores: van directo sobre el fondo.</p>
              </Tarjeta>
              <Tarjeta material="blanco" className="p-5">
                <p className="font-semibold">Tarjeta de vidrio blanco</p>
                <p className="text-sm text-slate-700">Citas, mascotas, indicadores en la app.</p>
              </Tarjeta>
              <Tarjeta material="blanco" destacada className="p-5">
                <p className="font-semibold">Vidrio blanco destacado</p>
                <p className="text-sm text-slate-700">Anillo ámbar: la próxima cita.</p>
              </Tarjeta>
            </div>
          </section>

          <Bloque titulo="Tarjetas y selección" descripcion="Opciones elegibles dentro de un vidrio: cristal con anillo y check ámbar.">
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

          {/* Estandar de todo el sistema (cliente, medico y admin): ninguna
              pantalla usa el calendario ni el selector de archivos del navegador. */}
          <Superficie tono="blanco" className="flex flex-col gap-5">
            <TituloSeccion
              titulo="Fechas y fotos"
              descripcion="Toda fecha se elige con el calendario de agendar (CampoFecha). Toda foto se sube desde el círculo punteado (ZonaFoto), que abre el editor para encuadrarla."
            />
            <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_9rem]">
              <CampoFecha id="guia-fecha" etiqueta="Fecha (no permite días pasados)" requerido valor={fechaCita} onChange={setFechaCita} />
              <CampoFecha
                id="guia-nacimiento"
                etiqueta="Fecha de nacimiento (opcional)"
                valor={fechaNacimiento}
                onChange={setFechaNacimiento}
                minimo={null}
                maximo={new Date().toLocaleDateString('en-CA')}
              />
              <ZonaFoto fotoUrl={foto} onClick={() => setEditorFoto(true)} />
            </div>
          </Superficie>

          {/* Campos de formulario: ninguno usa el aspecto que pone el
              navegador (ver docs/vetui.md > Campos de formulario). */}
          <Superficie tono="blanco" className="flex flex-col gap-5">
            <TituloSeccion
              titulo="Campos de formulario"
              descripcion="Texto, número, lista desplegable, hora, buscador, área de texto, deslizador y casilla comparten borde, radio y foco. Ninguno usa el control del navegador."
            />
            <div className="grid items-start gap-5 md:grid-cols-3">
              <Campo id="guia-nombre" label="Nombre" value={campos.nombre} onChange={cambiar('nombre')} placeholder="Ej. Luna" required />
              <Campo id="guia-precio" label="Precio (COP)" type="number" min="0" step="1000" value={campos.precio} onChange={cambiar('precio')} />
              <Campo id="guia-error" label="Correo" type="email" value="correo-sin-arroba" onChange={() => {}} error="Escribe un correo válido." />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="guia-sede" className="text-sm font-medium text-slate-700">
                  Sede
                </label>
                <Desplegable id="guia-sede" value={campos.sede} onChange={cambiar('sede')} className="px-3 py-2 text-sm">
                  <option value="">Todas las sedes</option>
                  <option value="bga">Clínica Veterinaria UDES Bucaramanga</option>
                  <option value="vup">Clínica Veterinaria UDES Valledupar</option>
                </Desplegable>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="guia-raza" className="text-sm font-medium text-slate-700">
                  Raza (lista larga)
                </label>
                <Desplegable id="guia-raza" value={campos.raza} onChange={cambiar('raza')} className="px-3 py-2 text-sm">
                  {['Akita', 'Beagle', 'Bóxer', 'Bulldog francés', 'Caniche (poodle)', 'Chihuahua', 'Dálmata', 'Golden retriever', 'Husky siberiano', 'Labrador retriever', 'Pastor alemán', 'Pug', 'Schnauzer', 'Shih tzu'].map(
                    (raza) => (
                      <option key={raza} value={raza}>
                        {raza}
                      </option>
                    )
                  )}
                </Desplegable>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="guia-hora" className="text-sm font-medium text-slate-700">
                  Hora
                </label>
                <CampoHora id="guia-hora" value={campos.hora} onChange={cambiar('hora')} className="px-3 py-2 text-sm" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">Buscador</span>
                <CampoBusqueda value={campos.busqueda} onChange={cambiar('busqueda')} placeholder="Buscar servicio..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="guia-deshabilitado" className="text-sm font-medium text-slate-700">
                  Deshabilitado
                </label>
                <Desplegable id="guia-deshabilitado" value="" disabled className="px-3 py-2 text-sm">
                  <option value="">Primero elige la especie</option>
                </Desplegable>
              </div>
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                  Deslizador
                  <input type="range" min="0" max="100" value={campos.zoom} onChange={cambiar('zoom')} />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="casilla"
                    checked={campos.soloHoras}
                    onChange={(e) => setCampos((actual) => ({ ...actual, soloHoras: e.target.checked }))}
                  />
                  Bloquear solo algunas horas
                </label>
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-3">
                <label htmlFor="guia-notas" className="text-sm font-medium text-slate-700">
                  Área de texto (crece con lo que se escribe)
                </label>
                <textarea
                  id="guia-notas"
                  value={campos.notas}
                  onChange={cambiar('notas')}
                  placeholder="Ej. Muy cariñosa, alérgica a ciertos alimentos."
                  className="campo px-3 py-2 text-sm"
                />
              </div>
            </div>
          </Superficie>

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
      <FotoMascotaModal
        isOpen={editorFoto}
        onClose={() => setEditorFoto(false)}
        fotoActual={foto}
        onGuardar={(blob) => {
          setFoto(URL.createObjectURL(blob));
          setEditorFoto(false);
        }}
      />
    </FondoVetui>
  );
}
