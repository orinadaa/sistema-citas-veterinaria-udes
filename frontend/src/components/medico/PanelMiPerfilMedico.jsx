// components/medico/PanelMiPerfilMedico.jsx
// "Mi perfil" del medico veterinario (/medico/perfil).
import { useEffect, useState } from 'react';
import {
  actualizarPerfilMedico,
  cambiarContrasenaMedico,
  confirmarCambioCorreoMedico,
  obtenerPerfilMedico,
  solicitarCambioCorreoMedico,
  subirFotoPerfilMedico,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { EstadoError, Pestanas } from '../vetui';
import { CategoryBadge } from '../ui/CategoryBadge';
import { Campo } from '../form/Campo';
import { CampoCodigo } from '../form/CampoCodigo';
import { ReenviarCodigo } from '../form/ReenviarCodigo';
import { useCuentaRegresiva } from '../../hooks/useCuentaRegresiva';
import { FotoMascotaModal } from '../cliente/FotoMascotaModal';
import { ZonaFoto } from '../form/ZonaFoto';
import { PanelDisponibilidadMedico } from './PanelDisponibilidadMedico';
import { IconoCalendario, IconoCamara, IconoCorreo, IconoEstetoscopio, IconoPata, IconoPersona, IconoReloj, IconoSede } from '../icons';
import { Desplegable } from '../form/Desplegable';

const TABS = [
  { id: 'personal', etiqueta: 'Información personal', etiquetaCorta: 'Mis datos', icono: IconoPersona },
  { id: 'profesional', etiqueta: 'Información profesional', etiquetaCorta: 'Profesional', icono: IconoEstetoscopio },
  { id: 'disponibilidad', etiqueta: 'Mi horario', etiquetaCorta: 'Horario', icono: IconoReloj },
];
const ANIOS_EXPERIENCIA = [
  { valor: '0-1', etiqueta: 'Menos de 1 año' },
  { valor: '1-3', etiqueta: '1 a 3 años' },
  { valor: '3-5', etiqueta: '3 a 5 años' },
  { valor: '5-10', etiqueta: '5 a 10 años' },
  { valor: '10+', etiqueta: 'Más de 10 años' },
];
const CLASE_CAMPO =
  'w-full campo px-3 py-2 text-sm';

function Tarjeta({ titulo, children, className = '' }) {
  return (
    <section className={`grises-legibles vidrio-blanco rounded-superficie p-5 sm:p-6 ${className}`}>
      {titulo && <h2 className="mb-4 font-heading text-base font-semibold text-brand-navy">{titulo}</h2>}
      {children}
    </section>
  );
}

function Mensaje({ estado }) {
  if (!estado?.texto) return null;
  return (
    <p
      className={`rounded-lg px-3 py-2 text-sm ring-1 ${
        estado.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-red-50 text-red-700 ring-red-200'
      }`}
    >
      {estado.texto}
    </p>
  );
}

function AreaConContador({ id, label, value, onChange, max, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea id={id} rows={4} maxLength={max} value={value} onChange={onChange} placeholder={placeholder} className={CLASE_CAMPO} />
      <p className="self-end text-xs text-slate-400">
        {value.length}/{max}
      </p>
    </div>
  );
}

// Cambio de correo en 2 pasos: pedir codigo -> confirmar. El correo de
// la cuenta solo cambia al confirmar el codigo.
function CambioCorreo({ correoActual, onCambiado }) {
  const { token } = useAuth();
  const [paso, setPaso] = useState('inicio'); // inicio | pedir | confirmar
  const [correoNuevo, setCorreoNuevo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [estado, setEstado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [codigoInvalido, setCodigoInvalido] = useState(false);
  const [enfocarCodigo, setEnfocarCodigo] = useState(0);
  const cuenta = useCuentaRegresiva(60);

  async function pedirCodigo() {
    setEnviando(true);
    setEstado(null);
    try {
      const r = await solicitarCambioCorreoMedico(correoNuevo.trim(), token);
      setEstado({ tipo: 'ok', texto: r.mensaje });
      setCodigo('');
      setCodigoInvalido(false);
      setPaso('confirmar');
      cuenta.iniciar();
      setEnfocarCodigo((n) => n + 1);
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  async function confirmar() {
    setEnviando(true);
    setEstado(null);
    try {
      const r = await confirmarCambioCorreoMedico(codigo.trim(), token);
      onCambiado(r.correo);
      setEstado({ tipo: 'ok', texto: r.mensaje });
      setPaso('inicio');
      setCorreoNuevo('');
      setCodigo('');
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
      // Codigo incorrecto: recuadros en rojo, vacios y foco al primero.
      setCodigoInvalido(true);
      setCodigo('');
      setEnfocarCodigo((n) => n + 1);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">
        Correo<span className="ml-0.5 text-red-500">*</span>
      </span>
      <div className="flex items-center gap-2">
        <p className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <IconoCorreo className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{correoActual}</span>
        </p>
        {paso === 'inicio' && (
          <button
            type="button"
            onClick={() => {
              setPaso('pedir');
              setEstado(null);
            }}
            className="shrink-0 rounded-boton border border-brand-blue px-3 py-2 text-sm font-semibold text-brand-blue-600 hover:bg-blue-50"
          >
            Cambiar
          </button>
        )}
      </div>

      {paso !== 'inicio' && (
        <div className="flex flex-col gap-3 rounded-xl bg-[#EEF6FD] p-4">
          <p className="text-xs text-slate-600">
            Te enviaremos un código de 6 dígitos al correo nuevo. Tu correo solo cambia cuando confirmes ese código.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={correoNuevo}
              disabled={paso === 'confirmar'}
              onChange={(e) => setCorreoNuevo(e.target.value)}
              placeholder="nuevo@correo.com"
              aria-label="Correo nuevo"
              className={`${CLASE_CAMPO} bg-white disabled:bg-slate-100`}
            />
            {paso === 'pedir' && (
              <button
                type="button"
                disabled={enviando || !correoNuevo.trim()}
                onClick={pedirCodigo}
                className="shrink-0 rounded-boton bg-brand-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-blue-700 disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Enviar código'}
              </button>
            )}
          </div>
          {paso === 'confirmar' && (
            <div className="flex flex-col items-center gap-3">
              <CampoCodigo
                id="codigo-cambio-correo"
                etiqueta="Código de verificación"
                valor={codigo}
                onChange={(valor) => {
                  setCodigo(valor);
                  setCodigoInvalido(false);
                }}
                error={codigoInvalido}
                disabled={enviando}
                enfocar={enfocarCodigo}
              />
              <button
                type="button"
                disabled={enviando || codigo.length !== 6}
                onClick={confirmar}
                className="shrink-0 rounded-boton bg-brand-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-blue-700 disabled:opacity-50"
              >
                {enviando ? 'Verificando...' : 'Confirmar'}
              </button>
            </div>
          )}
          <div className="flex gap-3 text-xs">
            {paso === 'confirmar' && (
              <ReenviarCodigo cuenta={cuenta} onReenviar={pedirCodigo} disabled={enviando} className="!text-xs" />
            )}
            <button
              type="button"
              onClick={() => {
                setPaso('inicio');
                setCorreoNuevo('');
                setCodigo('');
                setEstado(null);
              }}
              className="font-semibold text-slate-500 hover:underline"
            >
              Cancelar cambio
            </button>
          </div>
        </div>
      )}
      <Mensaje estado={estado} />
    </div>
  );
}

// pestanaInicial: 'disponibilidad' llega del acceso "Disponibilidad" de la pildora.
export function PanelMiPerfilMedico({ pestanaInicial }) {
  const { token, usuario, iniciarSesion } = useAuth();
  const [pestana, setPestana] = useState(['profesional', 'disponibilidad'].includes(pestanaInicial) ? pestanaInicial : 'personal');
  const [perfil, setPerfil] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [intento, setIntento] = useState(0);

  const [personal, setPersonal] = useState({ nombreCompleto: '', telefono: '', direccion: '' });
  const [profesional, setProfesional] = useState({ titulosProfesionales: '', registroProfesional: '', aniosExperiencia: '', biografia: '' });
  const [claves, setClaves] = useState({ actual: '', nueva: '', confirmar: '' });
  const [estadoPersonal, setEstadoPersonal] = useState(null);
  const [estadoProfesional, setEstadoProfesional] = useState(null);
  const [estadoClave, setEstadoClave] = useState(null);
  const [guardando, setGuardando] = useState('');
  const [editorFoto, setEditorFoto] = useState(false);

  function aplicarPerfil(datos) {
    setPerfil(datos);
    setPersonal({ nombreCompleto: datos.nombre_completo, telefono: datos.telefono || '', direccion: datos.direccion || '' });
    setProfesional({
      titulosProfesionales: datos.titulos_profesionales || '',
      registroProfesional: datos.registro_profesional || '',
      aniosExperiencia: datos.anios_experiencia || '',
      biografia: datos.biografia || '',
    });
  }

  useEffect(() => {
    let vigente = true;
    obtenerPerfilMedico(token)
      .then((datos) => vigente && aplicarPerfil(datos.perfil))
      .catch((err) => vigente && setErrorCarga(err.message || 'No se pudo cargar tu perfil.'));
    return () => {
      vigente = false;
    };
  }, [token, intento]);

  // Mantiene el nombre/correo de la sesion (header, menu) al dia.
  function actualizarSesion(cambios) {
    iniciarSesion({ usuario: { ...usuario, ...cambios }, token });
  }

  async function guardar(seccion, datos, setEstado) {
    setGuardando(seccion);
    setEstado(null);
    try {
      const { perfil: nuevo } = await actualizarPerfilMedico(datos, token);
      aplicarPerfil(nuevo);
      if (datos.nombreCompleto) actualizarSesion({ nombreCompleto: nuevo.nombre_completo });
      setEstado({ tipo: 'ok', texto: 'Cambios guardados.' });
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando('');
    }
  }

  async function cambiarClave(evento) {
    evento.preventDefault();
    setEstadoClave(null);
    if (claves.nueva !== claves.confirmar) {
      setEstadoClave({ tipo: 'error', texto: 'La confirmación no coincide con la nueva contraseña.' });
      return;
    }
    setGuardando('clave');
    try {
      const r = await cambiarContrasenaMedico({ actual: claves.actual, nueva: claves.nueva }, token);
      setEstadoClave({ tipo: 'ok', texto: r.mensaje });
      setClaves({ actual: '', nueva: '', confirmar: '' });
    } catch (err) {
      setEstadoClave({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando('');
    }
  }

  if (errorCarga) {
    return (
      <EstadoError
        mensaje={errorCarga}
        onReintentar={() => {
          setErrorCarga('');
          setIntento((n) => n + 1);
        }}
      />
    );
  }

  if (!perfil) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((k) => (
          <div key={k} className="h-24 animate-pulse rounded-superficie bg-white/15" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6" inert={editorFoto} aria-hidden={editorFoto}>
        {/* El titulo lo pone la pagina (/medico/perfil); aca, las secciones. */}
        <Pestanas items={TABS} activo={pestana} onCambiar={setPestana} etiqueta="Secciones de mi perfil" />

        {pestana === 'personal' && (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[260px_minmax(0,1fr)_260px]">
            <Tarjeta>
              <div className="flex flex-col items-center text-center">
                {/* Zona de foto estandar del sistema; el clic abre el editor. */}
                <ZonaFoto
                  fotoUrl={perfil.foto_url}
                  onClick={() => setEditorFoto(true)}
                  ayuda="Sube tu foto de perfil"
                  alt={perfil.nombre_completo}
                  className="w-32"
                />
                <p className="mt-3 font-heading text-lg font-bold text-brand-navy">{perfil.nombre_completo}</p>
                <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                  {perfil.activo ? 'Activo' : 'Inactivo'}
                </span>
                <p className="mt-1 text-sm text-slate-500">Médico Veterinario</p>
              </div>
              <dl className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm">
                <div>
                  <dt className="text-xs text-slate-400">Correo</dt>
                  <dd className="break-all text-slate-800">{perfil.correo}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Teléfono</dt>
                  <dd className="text-slate-800">{perfil.telefono || 'No registrado'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Sede principal</dt>
                  <dd className="text-slate-800">{perfil.sede_nombre || 'Sin sede'}</dd>
                </div>
              </dl>
            </Tarjeta>

            <div className="flex flex-col gap-6">
              <Tarjeta titulo="Datos personales">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    guardar('personal', personal, setEstadoPersonal);
                  }}
                  className="flex flex-col gap-4"
                >
                  <Campo
                    id="perfil-nombre"
                    label="Nombre completo"
                    value={personal.nombreCompleto}
                    onChange={(e) => setPersonal({ ...personal, nombreCompleto: e.target.value })}
                    required
                  />
                  <CambioCorreo
                    correoActual={perfil.correo}
                    onCambiado={(correo) => {
                      setPerfil({ ...perfil, correo });
                      actualizarSesion({ correo });
                    }}
                  />
                  <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
                    <Campo
                      id="perfil-telefono"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      title="Ingresa exactamente 10 dígitos, sin espacios ni signos."
                      maxLength={10}
                      autoComplete="tel"
                      label="Teléfono"
                      value={personal.telefono}
                      onChange={(e) => setPersonal({ ...personal, telefono: e.target.value })}
                      required
                    />
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-slate-700">Foto de perfil</span>
                      <button
                        type="button"
                        onClick={() => setEditorFoto(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-boton border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <IconoCamara className="h-4 w-4" />
                        Cambiar foto
                      </button>
                    </div>
                  </div>
                  <Campo
                    id="perfil-direccion"
                    label="Dirección (opcional)"
                    value={personal.direccion}
                    onChange={(e) => setPersonal({ ...personal, direccion: e.target.value })}
                  />
                  <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-slate-700">Sede principal</span>
                      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">{perfil.sede_nombre || 'Sin sede'}</p>
                      <p className="text-xs text-slate-400">La asigna el administrador.</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-slate-700">Estado de la cuenta</span>
                      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        {perfil.activo ? 'Activa' : 'Inactiva'}
                      </p>
                    </div>
                  </div>
                  <Mensaje estado={estadoPersonal} />
                  <button
                    type="submit"
                    disabled={guardando === 'personal'}
                    className="self-end rounded-boton bg-brand-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-blue-700 disabled:opacity-60"
                  >
                    {guardando === 'personal' ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </form>
              </Tarjeta>

              <Tarjeta titulo="Cambiar contraseña">
                <form onSubmit={cambiarClave} className="flex flex-col gap-4">
                  <Campo
                    id="clave-actual"
                    label="Contraseña actual"
                    type="password"
                    autoComplete="current-password"
                    value={claves.actual}
                    onChange={(e) => setClaves({ ...claves, actual: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
                    <Campo
                      id="clave-nueva"
                      label="Nueva contraseña"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      value={claves.nueva}
                      onChange={(e) => setClaves({ ...claves, nueva: e.target.value })}
                      required
                    />
                    <Campo
                      id="clave-confirmar"
                      label="Confirmar contraseña"
                      type="password"
                      autoComplete="new-password"
                      value={claves.confirmar}
                      onChange={(e) => setClaves({ ...claves, confirmar: e.target.value })}
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-400">Mínimo 8 caracteres.</p>
                  <Mensaje estado={estadoClave} />
                  <button
                    type="submit"
                    disabled={guardando === 'clave'}
                    className="self-end rounded-boton border border-brand-blue px-5 py-2 text-sm font-semibold text-brand-blue-600 hover:bg-blue-50 disabled:opacity-60"
                  >
                    {guardando === 'clave' ? 'Actualizando...' : 'Actualizar contraseña'}
                  </button>
                </form>
              </Tarjeta>
            </div>

            <div className="flex flex-col gap-6">
              <Tarjeta titulo="Sedes asignadas">
                <ul className="flex flex-col gap-2">
                  {(perfil.sedes_asignadas?.length ? perfil.sedes_asignadas : [{ id: perfil.sede_id, nombre: perfil.sede_nombre, principal: true }])
                    .filter((s) => s.id)
                    .map((s) => (
                      <li key={s.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <IconoSede className="h-4 w-4 shrink-0 text-brand-blue" />
                        <span className="flex-1">{s.nombre}</span>
                        {s.principal && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Principal</span>
                        )}
                      </li>
                    ))}
                </ul>
              </Tarjeta>
              <Tarjeta titulo="Resumen">
                <dl className="flex flex-col gap-3">
                  {[
                    { icono: IconoCalendario, etiqueta: 'Citas este mes', valor: perfil.resumen.citas_mes },
                    { icono: IconoPersona, etiqueta: 'Pacientes atendidos', valor: perfil.resumen.pacientes_atendidos },
                    { icono: IconoPata, etiqueta: 'Mascotas', valor: perfil.resumen.mascotas },
                  ].map((dato) => (
                    <div key={dato.etiqueta} className="flex items-center gap-3">
                      <dt className="flex flex-1 items-center gap-3 text-sm text-slate-500">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
                          <dato.icono className="h-4 w-4" />
                        </span>
                        {dato.etiqueta}
                      </dt>
                      <dd className="font-heading text-lg font-bold text-brand-navy">{dato.valor}</dd>
                    </div>
                  ))}
                </dl>
              </Tarjeta>
            </div>
          </div>
        )}

        {pestana === 'profesional' && (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Tarjeta titulo="Información profesional">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  guardar('profesional', profesional, setEstadoProfesional);
                }}
                className="flex flex-col gap-4"
              >
                <AreaConContador
                  id="perfil-titulos"
                  label="Títulos profesionales"
                  max={500}
                  value={profesional.titulosProfesionales}
                  onChange={(e) => setProfesional({ ...profesional, titulosProfesionales: e.target.value })}
                  placeholder="Ej. Médico Veterinario Zootecnista, Universidad de Santander"
                />
                <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
                  <Campo
                    id="perfil-registro"
                    label="Número de registro profesional"
                    maxLength={50}
                    value={profesional.registroProfesional}
                    onChange={(e) => setProfesional({ ...profesional, registroProfesional: e.target.value })}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="perfil-experiencia" className="text-sm font-medium text-slate-700">
                      Años de experiencia
                    </label>
                    <Desplegable
                      id="perfil-experiencia"
                      value={profesional.aniosExperiencia}
                      onChange={(e) => setProfesional({ ...profesional, aniosExperiencia: e.target.value })}
                      className={CLASE_CAMPO}
                    >
                      <option value="">Selecciona</option>
                      {ANIOS_EXPERIENCIA.map((a) => (
                        <option key={a.valor} value={a.valor}>
                          {a.etiqueta}
                        </option>
                      ))}
                    </Desplegable>
                  </div>
                </div>
                <AreaConContador
                  id="perfil-biografia"
                  label="Biografía profesional"
                  max={500}
                  value={profesional.biografia}
                  onChange={(e) => setProfesional({ ...profesional, biografia: e.target.value })}
                  placeholder="Cuéntale a tus pacientes sobre tu experiencia y enfoque."
                />
                <Mensaje estado={estadoProfesional} />
                <button
                  type="submit"
                  disabled={guardando === 'profesional'}
                  className="self-end rounded-boton bg-brand-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-blue-700 disabled:opacity-60"
                >
                  {guardando === 'profesional' ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </form>
            </Tarjeta>

            <div className="flex flex-col gap-6">
              <Tarjeta titulo="Especialidades">
                {perfil.especialidades.length === 0 ? (
                  <p className="text-sm text-slate-400">Sin especialidades asignadas.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {perfil.especialidades.map((e) => (
                      <CategoryBadge key={e.id} nombre={e.nombre} color={e.color} />
                    ))}
                  </div>
                )}
                <p className="mt-3 text-xs text-slate-400">Las asigna el administrador.</p>
              </Tarjeta>
              <Tarjeta titulo="Servicios que presto">
                {perfil.servicios.length === 0 ? (
                  <p className="text-sm text-slate-400">Sin servicios asignados.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {perfil.servicios.map((s) => (
                      <span key={s.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {s.nombre}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-xs text-slate-400">Los asigna el administrador.</p>
              </Tarjeta>
            </div>
          </div>
        )}

        {pestana === 'disponibilidad' && <PanelDisponibilidadMedico />}
      </div>

      <FotoMascotaModal
        isOpen={editorFoto}
        onClose={() => setEditorFoto(false)}
        titulo="Foto de perfil"
        fotoActual={perfil.foto_url}
        onGuardar={async (blob) => {
          setEditorFoto(false);
          setEstadoPersonal(null);
          try {
            const { fotoUrl } = await subirFotoPerfilMedico(blob, token);
            setPerfil((p) => ({ ...p, foto_url: fotoUrl }));
          } catch (err) {
            setEstadoPersonal({ tipo: 'error', texto: `No se pudo subir la foto: ${err.message}` });
          }
        }}
      />
    </>
  );
}
