// components/admin/DetalleRegistroDatos.jsx
// Como se ve un registro abierto en Datos > Explorar (superadministrador).
import { ETIQUETA_SEXO } from '../../utils/sexo';
import { ROLES_DATOS, edadDesde, formatearDato } from '../../utils/datos';
import { iniciales } from '../../utils/texto';
import { iconoDeServicio } from '../../utils/iconoServicio';
import { AvatarMascota } from '../cliente/AvatarMascota';
import { Insignia } from '../vetui';
import { IconoSexo } from '../ui/EtiquetaSexo';
import {
  IconoCalendario,
  IconoCorreo,
  IconoDocumento,
  IconoEstetoscopio,
  IconoPata,
  IconoPersona,
  IconoReloj,
  IconoSede,
  IconoTelefono,
  IconoUbicacion,
} from '../icons';

const TONO_ROL = { superadministrador: 'ambar', administrador: 'azul', veterinario: 'verde', cliente: 'gris' };

// Igual que en el resto del sistema: una cita agendada ya pasada cuenta como
// completada.
function estadoCita(estado, fecha) {
  if (estado === 'cancelada') return 'cancelada';
  if (estado === 'por_reagendar') return 'por_reagendar';
  return new Date(fecha) > new Date() ? 'proxima' : 'completada';
}

function InsigniaActivo({ activo, femenino = false }) {
  return <Insignia tono={activo ? 'verde' : 'rojo'}>{activo ? (femenino ? 'Activa' : 'Activo') : femenino ? 'Inactiva' : 'Inactivo'}</Insignia>;
}

function Cabecera({ avatar, titulo, subtitulo, children }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/70 px-5 py-6 text-center ring-1 ring-slate-900/10">
      {avatar}
      <div className="min-w-0 max-w-full">
        <p className="break-words font-heading text-xl font-bold text-brand-navy">{titulo}</p>
        {subtitulo && <p className="mt-0.5 break-words text-sm font-medium text-brand-blue-700">{subtitulo}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </div>
  );
}

function ChipIcono({ icono: Icono, className = 'h-16 w-16', iconoClassName = 'h-8 w-8' }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-[#E8F1FD] text-brand-blue-600 ${className}`}>
      <Icono className={iconoClassName} peso="duotone" />
    </span>
  );
}

function Seccion({ titulo, children }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">{titulo}</h3>
      {children}
    </section>
  );
}

// Fila con icono en chip circular (la misma del detalle de una cita).
function Fila({ icono: Icono, etiqueta, valor, detalle }) {
  const vacio = valor === null || valor === undefined || valor === '' || valor === '—';
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F1FD] text-brand-blue-600">
        <Icono className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-700">{etiqueta}</p>
        <p className={`break-words ${vacio ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>{vacio ? 'Sin registrar' : valor}</p>
        {detalle && <p className="mt-0.5 break-words text-sm text-slate-700">{detalle}</p>}
      </div>
    </div>
  );
}

// Tarjeta de dato corto (edad, peso, precio...).
function Dato({ etiqueta, valor }) {
  const vacio = valor === null || valor === undefined || valor === '' || valor === '—';
  return (
    <div className="min-w-0 rounded-xl bg-white/70 px-3 py-2.5 ring-1 ring-slate-900/10">
      <p className="text-xs font-medium text-slate-700">{etiqueta}</p>
      <p className={`break-words text-sm ${vacio ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>{vacio ? 'Sin registrar' : valor}</p>
    </div>
  );
}

function fechaLarga(valor) {
  if (!valor) return null;
  return new Date(valor).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: String(valor).length <= 10 ? 'UTC' : undefined });
}

// ------------------------------------------------------------ fichas
function FichaUsuario({ r }) {
  return (
    <>
      <Cabecera
        avatar={<span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-blue-700 text-2xl font-bold text-white ring-4 ring-white">{iniciales(r.nombre)}</span>}
        titulo={r.nombre}
        subtitulo={r.correo}
      >
        <Insignia tono={TONO_ROL[r.rol] ?? 'gris'}>{ROLES_DATOS[r.rol] ?? r.rol}</Insignia>
        <InsigniaActivo activo={r.activo} femenino />
      </Cabecera>
      <Seccion titulo="Contacto">
        <Fila icono={IconoCorreo} etiqueta="Correo" valor={r.correo} />
        <Fila icono={IconoTelefono} etiqueta="Teléfono" valor={r.telefono} />
        <Fila icono={IconoUbicacion} etiqueta="Dirección" valor={r.direccion} />
      </Seccion>
      <Seccion titulo="Cuenta">
        <div className="grid grid-cols-2 gap-3">
          <Dato etiqueta="Documento" valor={r.documento} />
          <Dato etiqueta="Registrado" valor={fechaLarga(r.creado)} />
          {r.rol !== 'cliente' && r.rol !== 'superadministrador' && <Dato etiqueta="Sede" valor={r.sede} />}
        </div>
      </Seccion>
    </>
  );
}

function FichaMascota({ r }) {
  return (
    <>
      <Cabecera
        avatar={<AvatarMascota mascota={r} className="h-20 w-20 ring-4 ring-white" iconoClassName="h-10 w-10" />}
        titulo={r.nombre}
        subtitulo={[r.especie, r.raza].filter(Boolean).join(' · ')}
      >
        {ETIQUETA_SEXO[r.sexo] && (
          <span className="inline-flex items-center gap-1 text-sm text-slate-800">
            <IconoSexo sexo={r.sexo} className={`h-4 w-4 ${r.sexo === 'hembra' ? 'text-pink-500' : 'text-brand-blue'}`} />
            {ETIQUETA_SEXO[r.sexo]}
          </span>
        )}
        <InsigniaActivo activo={r.activo} femenino />
      </Cabecera>
      <div className="grid grid-cols-2 gap-3">
        <Dato etiqueta="Edad" valor={edadDesde(r.nacimiento)} />
        <Dato etiqueta="Peso" valor={r.peso ? `${Number(r.peso)} kg` : null} />
        <Dato etiqueta="Nacimiento" valor={fechaLarga(r.nacimiento)} />
        <Dato etiqueta="Color" valor={r.color} />
      </div>
      <Seccion titulo="Dueño">
        <Fila icono={IconoPersona} etiqueta="Cliente" valor={r.dueno} detalle={r.dueno_correo} />
        <Fila icono={IconoCalendario} etiqueta="Registrada" valor={fechaLarga(r.creado)} />
      </Seccion>
    </>
  );
}

function FichaCita({ r }) {
  const fecha = new Date(r.fecha);
  return (
    <>
      <div className="flex flex-col gap-4 rounded-2xl bg-white/70 p-5 ring-1 ring-slate-900/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-700">Cita</p>
            <p className="font-heading text-xl font-bold text-brand-navy">{r.codigo}</p>
          </div>
          <Insignia estado={estadoCita(r.estado, r.fecha)} />
        </div>
        <div className="flex items-center gap-3">
          <ChipIcono icono={IconoCalendario} className="h-12 w-12" iconoClassName="h-6 w-6" />
          <div>
            <p className="font-semibold text-slate-900 first-letter:uppercase">{fecha.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-sm text-slate-700">
              {fecha.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}
              {r.duracion ? ` · ${r.duracion} min` : ''}
            </p>
          </div>
        </div>
      </div>
      <Seccion titulo="Paciente">
        <Fila icono={IconoPata} etiqueta="Mascota" valor={r.mascota} />
        <Fila icono={IconoPersona} etiqueta="Cliente" valor={r.cliente} />
      </Seccion>
      <Seccion titulo="Atención">
        <Fila icono={iconoDeServicio(r.servicio ?? '')} etiqueta="Servicio" valor={r.servicio} />
        <Fila icono={IconoEstetoscopio} etiqueta="Médico veterinario" valor={r.medico} />
        <Fila icono={IconoSede} etiqueta="Sede" valor={r.sede} />
        <Fila icono={IconoDocumento} etiqueta="Motivo" valor={r.motivo} />
      </Seccion>
      <p className="text-xs text-slate-700">Creada el {formatearDato(r.creada, { tipo: 'fechaHora' })}</p>
    </>
  );
}

function FichaServicio({ r }) {
  return (
    <>
      <Cabecera avatar={<ChipIcono icono={iconoDeServicio(r.nombre ?? '')} />} titulo={r.nombre} subtitulo={r.categoria}>
        <InsigniaActivo activo={r.activo} />
      </Cabecera>
      <div className="grid grid-cols-2 gap-3">
        <Dato etiqueta="Precio" valor={r.precio === null || r.precio === undefined ? null : formatearDato(r.precio, { tipo: 'dinero' })} />
        <Dato etiqueta="Duración" valor={r.duracion ? `${r.duracion} min` : null} />
      </div>
      <Seccion titulo="Descripción">
        <p className={`text-sm ${r.descripcion ? 'text-slate-900' : 'text-slate-600'}`}>{r.descripcion || 'Sin descripción.'}</p>
      </Seccion>
    </>
  );
}

function FichaSede({ r }) {
  return (
    <>
      <Cabecera avatar={<ChipIcono icono={IconoSede} />} titulo={r.nombre} subtitulo={r.ciudad}>
        {r.principal && <Insignia tono="ambar">Sede principal</Insignia>}
        <InsigniaActivo activo={r.activo} femenino />
      </Cabecera>
      <Seccion titulo="Ubicación">
        <Fila icono={IconoUbicacion} etiqueta="Dirección" valor={r.direccion} detalle={r.ciudad} />
        <Fila icono={IconoDocumento} etiqueta="Código" valor={r.codigo} />
      </Seccion>
    </>
  );
}

// Entidades sin ficha propia (horarios de atencion...): todos sus datos en
// tarjetas, con el primero como titulo.
function FichaGenerica({ r, columnas }) {
  const [primera, ...resto] = columnas;
  return (
    <>
      <Cabecera avatar={<ChipIcono icono={IconoReloj} />} titulo={formatearDato(r[primera.clave], primera)} subtitulo={primera.etiqueta} />
      <div className="grid grid-cols-2 gap-3">
        {resto.map((c) => (
          <Dato key={c.clave} etiqueta={c.etiqueta} valor={formatearDato(r[c.clave], c)} />
        ))}
      </div>
    </>
  );
}

const FICHAS = { usuarios: FichaUsuario, mascotas: FichaMascota, citas: FichaCita, servicios: FichaServicio, sedes: FichaSede };

export function DetalleRegistro({ entidad, registro, columnas }) {
  const Ficha = FICHAS[entidad] ?? FichaGenerica;
  return (
    <div className="flex flex-col gap-6">
      <Ficha r={registro} columnas={columnas} />
    </div>
  );
}

// ------------------------------------------------------------ relacionados
// Una fila de "Sus mascotas" / "Sus citas" / "Citas que atiende".
export function FilaRelacionada({ entidad, fila, columnas }) {
  if (entidad === 'mascotas') {
    return (
      <li className="flex items-center gap-3 px-3 py-2.5">
        <AvatarMascota mascota={fila} className="h-10 w-10" iconoClassName="h-5 w-5" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{fila.nombre}</p>
          <p className="truncate text-sm text-slate-700">{[fila.especie, fila.raza].filter(Boolean).join(' · ') || 'Sin especie registrada'}</p>
        </div>
        {!fila.activo && <Insignia tono="rojo">Inactiva</Insignia>}
      </li>
    );
  }
  if (entidad === 'citas') {
    const fecha = new Date(fila.fecha);
    // Lo que no es la fecha ni el estado: mascota, servicio, medico, cliente.
    const textos = columnas.filter((c) => c.clave !== 'fecha' && c.clave !== 'estado').map((c) => fila[c.clave]).filter(Boolean);
    return (
      <li className="flex items-center gap-3 px-3 py-2.5">
        <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-[#E8F1FD] leading-none text-brand-blue-700">
          <span className="text-base font-bold">{fecha.getDate()}</span>
          <span className="text-[0.65rem] font-semibold uppercase">{fecha.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{textos[0]}</p>
          <p className="truncate text-sm text-slate-700">
            {[fecha.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }), ...textos.slice(1)].join(' · ')}
          </p>
        </div>
        <Insignia estado={estadoCita(fila.estado, fila.fecha)} />
      </li>
    );
  }
  return (
    <li className="flex flex-wrap gap-x-3 px-3 py-2 text-sm text-slate-800">
      {columnas.map((c, i) => (
        <span key={c.clave} className={i === 0 ? 'font-medium text-slate-900' : ''}>
          {formatearDato(fila[c.clave], c)}
        </span>
      ))}
    </li>
  );
}
