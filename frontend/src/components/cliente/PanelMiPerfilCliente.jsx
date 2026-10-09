// components/cliente/PanelMiPerfilCliente.jsx
// "Mi perfil" del cliente (/panel/perfil), inspirado en el del medico y
// adaptado a lo que un cliente necesita ver o cambiar. Dos secciones:
// - Informacion personal: resumen de la cuenta, datos personales editables
//   (nombre, telefono, documento, direccion) y resumen de actividad
//   (mascotas, citas proximas y realizadas).
// - Seguridad:
//   * correo: se cambia confirmando un codigo enviado AL CORREO NUEVO (asi
//     se comprueba que existe y que es suyo);
//   * contraseña: se cambia confirmando un codigo enviado a SU CORREO ACTUAL
//     (asi se comprueba que quien la cambia es el dueño de la cuenta).
// Los codigos se escriben en CampoCodigo (un recuadro por digito) con la
// cuenta regresiva para reenviar, igual que al recuperar la contraseña.
import { useEffect, useState } from 'react';
import {
  actualizarPerfilCliente,
  cambiarContrasenaCliente,
  confirmarCambioCorreoCliente,
  obtenerPerfilCliente,
  solicitarCambioCorreoCliente,
  solicitarCodigoContrasenaCliente,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useCuentaRegresiva } from '../../hooks/useCuentaRegresiva';
import { iniciales } from '../../utils/texto';
import { Boton, EstadoError, Insignia, Pestanas } from '../vetui';
import { Campo } from '../form/Campo';
import { CampoCodigo } from '../form/CampoCodigo';
import { ReenviarCodigo } from '../form/ReenviarCodigo';
import { IconoCalendario, IconoCorazon, IconoCorreo, IconoEscudo, IconoPata, IconoPersona } from '../icons';

const TABS = [
  { id: 'personal', etiqueta: 'Información personal', icono: IconoPersona },
  { id: 'seguridad', etiqueta: 'Seguridad', icono: IconoEscudo },
];

function Tarjeta({ titulo, descripcion, children, className = '' }) {
  return (
    <section className={`vidrio-blanco rounded-superficie p-5 sm:p-6 ${className}`}>
      {titulo && <h2 className="font-heading text-base font-semibold text-brand-navy">{titulo}</h2>}
      {descripcion && <p className="mt-1 text-sm text-slate-700">{descripcion}</p>}
      <div className={titulo ? 'mt-4' : ''}>{children}</div>
    </section>
  );
}

function Mensaje({ estado }) {
  if (!estado?.texto) return null;
  return (
    <p role="alert" className={`rounded-lg px-3 py-2 text-sm ring-1 ${estado.tipo === 'ok' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-red-50 text-red-700 ring-red-200'}`}>
      {estado.texto}
    </p>
  );
}

function fechaLarga(iso) {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ------------------------------------------------------------ datos personales
function DatosPersonales({ perfil, token, onGuardado }) {
  const [form, setForm] = useState({
    nombreCompleto: perfil.nombre_completo ?? '',
    telefono: perfil.telefono ?? '',
    documento: perfil.documento ?? '',
    direccion: perfil.direccion ?? '',
  });
  const [estado, setEstado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const cambiar = (campo) => (evento) => setForm((actual) => ({ ...actual, [campo]: evento.target.value }));

  async function guardar(evento) {
    evento.preventDefault();
    if (!form.nombreCompleto.trim()) {
      setEstado({ tipo: 'error', texto: 'El nombre es obligatorio.' });
      return;
    }
    setGuardando(true);
    setEstado(null);
    try {
      const respuesta = await actualizarPerfilCliente(form, token);
      onGuardado(respuesta.perfil);
      setEstado({ tipo: 'ok', texto: 'Tus datos quedaron actualizados.' });
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Tarjeta titulo="Datos personales" descripcion="Son los datos con los que la clínica te identifica y te contacta.">
      <form onSubmit={guardar} className="flex flex-col gap-4" noValidate>
        <Campo id="perfil-nombre" label="Nombre completo" value={form.nombreCompleto} maxLength={150} onChange={cambiar('nombreCompleto')} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="perfil-telefono" label="Teléfono (opcional)" inputMode="tel" value={form.telefono} maxLength={20} onChange={cambiar('telefono')} />
          <Campo id="perfil-documento" label="Documento de identidad (opcional)" value={form.documento} maxLength={20} onChange={cambiar('documento')} />
        </div>
        <Campo id="perfil-direccion" label="Dirección (opcional)" value={form.direccion} maxLength={200} onChange={cambiar('direccion')} />
        <Mensaje estado={estado} />
        <Boton type="submit" disabled={guardando} className="self-end">
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </Boton>
      </form>
    </Tarjeta>
  );
}

// ------------------------------------------------------------ correo (codigo al correo NUEVO)
function CambioCorreo({ correoActual, token, onCambiado }) {
  const [paso, setPaso] = useState('inicio'); // inicio | pedir | confirmar
  const [correoNuevo, setCorreoNuevo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [estado, setEstado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [codigoInvalido, setCodigoInvalido] = useState(false);
  const [enfocar, setEnfocar] = useState(0);
  const cuenta = useCuentaRegresiva(60);

  async function pedir(evento) {
    evento?.preventDefault();
    setEnviando(true);
    setEstado(null);
    try {
      const respuesta = await solicitarCambioCorreoCliente(correoNuevo.trim(), token);
      setEstado({ tipo: 'ok', texto: respuesta.mensaje });
      setCodigo('');
      setCodigoInvalido(false);
      setPaso('confirmar');
      cuenta.iniciar();
      setEnfocar((n) => n + 1);
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  async function confirmar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setEstado(null);
    try {
      const respuesta = await confirmarCambioCorreoCliente(codigo, token);
      onCambiado(respuesta.correo);
      setEstado({ tipo: 'ok', texto: respuesta.mensaje });
      setPaso('inicio');
      setCorreoNuevo('');
      setCodigo('');
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
      setCodigoInvalido(true);
      setCodigo('');
      setEnfocar((n) => n + 1);
    } finally {
      setEnviando(false);
    }
  }

  function cancelar() {
    setPaso('inicio');
    setCorreoNuevo('');
    setCodigo('');
    setEstado(null);
  }

  return (
    <Tarjeta titulo="Correo electrónico" descripcion="Con este correo inicias sesión y recibes las confirmaciones de tus citas.">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex min-w-0 flex-1 items-center gap-2 rounded-tarjeta bg-white/70 px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-900/10">
            <IconoCorreo className="h-4 w-4 shrink-0 text-slate-700" />
            <span className="truncate">{correoActual}</span>
          </p>
          {paso === 'inicio' && (
            <Boton
              variante="contorno"
              tamano="sm"
              onClick={() => {
                setEstado(null);
                setPaso('pedir');
              }}
            >
              Cambiar correo
            </Boton>
          )}
        </div>

        {paso === 'pedir' && (
          <form onSubmit={pedir} className="flex flex-col gap-3" noValidate>
            <p className="text-sm text-slate-700">Te enviaremos un código de 6 dígitos al correo nuevo. Tu correo solo cambia cuando confirmes ese código.</p>
            <Campo id="correo-nuevo" label="Correo nuevo" type="email" autoComplete="email" value={correoNuevo} onChange={(e) => setCorreoNuevo(e.target.value)} required />
            <div className="flex flex-wrap justify-end gap-3">
              <Boton variante="contorno" tamano="sm" onClick={cancelar} disabled={enviando}>
                Cancelar
              </Boton>
              <Boton type="submit" tamano="sm" disabled={enviando || !correoNuevo.trim()}>
                {enviando ? 'Enviando...' : 'Enviar código'}
              </Boton>
            </div>
          </form>
        )}

        {paso === 'confirmar' && (
          <form onSubmit={confirmar} className="flex flex-col gap-3" noValidate>
            <CampoCodigo
              id="codigo-correo"
              etiqueta={`Código enviado a ${correoNuevo.trim()}`}
              valor={codigo}
              onChange={(valor) => {
                setCodigo(valor);
                setCodigoInvalido(false);
              }}
              error={codigoInvalido}
              disabled={enviando}
              enfocar={enfocar}
            />
            <ReenviarCodigo cuenta={cuenta} onReenviar={() => pedir()} disabled={enviando} className="self-center" />
            <div className="flex flex-wrap justify-end gap-3">
              <Boton variante="contorno" tamano="sm" onClick={cancelar} disabled={enviando}>
                Cancelar
              </Boton>
              <Boton type="submit" tamano="sm" disabled={enviando || codigo.length !== 6}>
                {enviando ? 'Verificando...' : 'Confirmar correo'}
              </Boton>
            </div>
          </form>
        )}
        <Mensaje estado={estado} />
      </div>
    </Tarjeta>
  );
}

// ------------------------------------------------------------ contraseña (codigo al correo ACTUAL)
function CambioContrasena({ correo, token }) {
  const [paso, setPaso] = useState('inicio'); // inicio | confirmar
  const [codigo, setCodigo] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [estado, setEstado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [codigoInvalido, setCodigoInvalido] = useState(false);
  const [enfocar, setEnfocar] = useState(0);
  const cuenta = useCuentaRegresiva(60);

  async function pedirCodigo() {
    setEnviando(true);
    setEstado(null);
    try {
      const respuesta = await solicitarCodigoContrasenaCliente(token);
      setEstado({ tipo: 'ok', texto: respuesta.mensaje });
      setCodigo('');
      setCodigoInvalido(false);
      setPaso('confirmar');
      cuenta.iniciar();
      setEnfocar((n) => n + 1);
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  async function guardar(evento) {
    evento.preventDefault();
    if (codigo.length !== 6) {
      setCodigoInvalido(true);
      setEstado({ tipo: 'error', texto: 'Escribe los 6 dígitos del código.' });
      return;
    }
    if (nueva.length < 8) {
      setEstado({ tipo: 'error', texto: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    if (nueva !== confirmacion) {
      setEstado({ tipo: 'error', texto: 'Las dos contraseñas no coinciden.' });
      return;
    }
    setEnviando(true);
    setEstado(null);
    try {
      const respuesta = await cambiarContrasenaCliente({ codigo, contrasenaNueva: nueva }, token);
      setEstado({ tipo: 'ok', texto: respuesta.mensaje });
      setPaso('inicio');
      setCodigo('');
      setNueva('');
      setConfirmacion('');
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
      // Codigo incorrecto o vencido: recuadros en rojo, vacios y foco al primero.
      if (/c[oó]digo/i.test(err.message)) {
        setCodigoInvalido(true);
        setCodigo('');
        setEnfocar((n) => n + 1);
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tarjeta titulo="Contraseña" descripcion="Para cambiarla confirmamos que eres tú con un código que enviamos a tu correo.">
      <div className="flex flex-col gap-4">
        {paso === 'inicio' ? (
          <>
            <p className="text-sm text-slate-700">
              Enviaremos un código de 6 dígitos a <strong className="font-semibold text-slate-900">{correo}</strong>. Vence en 15 minutos.
            </p>
            <Boton variante="contorno" onClick={pedirCodigo} disabled={enviando} className="self-start">
              {enviando ? 'Enviando...' : 'Enviar código para cambiar mi contraseña'}
            </Boton>
          </>
        ) : (
          <form onSubmit={guardar} className="flex flex-col gap-4" noValidate>
            <CampoCodigo
              id="codigo-contrasena"
              etiqueta="Código de seguridad"
              valor={codigo}
              onChange={(valor) => {
                setCodigo(valor);
                setCodigoInvalido(false);
              }}
              error={codigoInvalido}
              disabled={enviando}
              enfocar={enfocar}
            />
            <ReenviarCodigo cuenta={cuenta} onReenviar={pedirCodigo} disabled={enviando} className="-mt-1 self-center" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="contrasena-nueva-perfil" label="Nueva contraseña" type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} required />
              <Campo id="contrasena-confirmar-perfil" label="Repite la contraseña" type="password" autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} required />
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Boton
                variante="contorno"
                tamano="sm"
                disabled={enviando}
                onClick={() => {
                  setPaso('inicio');
                  setEstado(null);
                  setCodigo('');
                  setNueva('');
                  setConfirmacion('');
                }}
              >
                Cancelar
              </Boton>
              <Boton type="submit" tamano="sm" disabled={enviando}>
                {enviando ? 'Guardando...' : 'Cambiar contraseña'}
              </Boton>
            </div>
          </form>
        )}
        <Mensaje estado={estado} />
      </div>
    </Tarjeta>
  );
}

function FilaResumen({ icono: Icono, etiqueta, valor }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-brand-blue-700">
        <Icono className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm text-slate-800">{etiqueta}</span>
      <span className="text-lg font-bold tabular-nums text-brand-navy">{valor}</span>
    </li>
  );
}

export function PanelMiPerfilCliente() {
  const { token, usuario, iniciarSesion } = useAuth();
  const [pestana, setPestana] = useState('personal');
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    obtenerPerfilCliente(token)
      .then((datos) => vigente && (setPerfil(datos.perfil), setError('')))
      .catch((err) => vigente && setError(err.message || 'No se pudo cargar tu perfil.'));
    return () => {
      vigente = false;
    };
  }, [token, intento]);

  // El nombre y el correo tambien viven en la sesion (saludo, pildora).
  function aplicar(nuevo) {
    setPerfil(nuevo);
    iniciarSesion({ usuario: { ...usuario, nombreCompleto: nuevo.nombre_completo, correo: nuevo.correo }, token });
  }

  if (error) return <EstadoError mensaje={error} onReintentar={() => setIntento((n) => n + 1)} />;
  if (!perfil) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1].map((k) => (
          <div key={k} className="h-32 animate-pulse rounded-superficie bg-white/15" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Pestanas items={TABS} activo={pestana} onCambiar={setPestana} etiqueta="Secciones de mi perfil" />

      {pestana === 'personal' ? (
        <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_260px]">
          <Tarjeta>
            <div className="flex flex-col items-center text-center">
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-blue-700 text-2xl font-bold text-white ring-4 ring-white">
                {iniciales(perfil.nombre_completo)}
              </span>
              <p className="mt-3 font-heading text-lg font-semibold text-brand-navy">{perfil.nombre_completo}</p>
              <div className="mt-2">
                <Insignia tono={perfil.activo ? 'verde' : 'gris'}>{perfil.activo ? 'Cuenta activa' : 'Cuenta inactiva'}</Insignia>
              </div>
            </div>
            <dl className="mt-5 flex flex-col gap-3 border-t border-slate-900/10 pt-4 text-sm">
              <div>
                <dt className="text-xs font-medium text-slate-700">Correo</dt>
                <dd className="break-words text-slate-900">{perfil.correo}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-700">Teléfono</dt>
                <dd className="text-slate-900">{perfil.telefono || 'Sin registrar'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-700">Cliente desde</dt>
                <dd className="text-slate-900">{fechaLarga(perfil.creado_en)}</dd>
              </div>
            </dl>
          </Tarjeta>

          <DatosPersonales perfil={perfil} token={token} onGuardado={aplicar} />

          <Tarjeta titulo="Resumen" className="self-start">
            <ul className="flex flex-col gap-3">
              <FilaResumen icono={IconoPata} etiqueta="Mascotas" valor={perfil.resumen.mascotas} />
              <FilaResumen icono={IconoCalendario} etiqueta="Citas próximas" valor={perfil.resumen.citas_proximas} />
              <FilaResumen icono={IconoCorazon} etiqueta="Citas realizadas" valor={perfil.resumen.citas_realizadas} />
            </ul>
          </Tarjeta>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <CambioCorreo correoActual={perfil.correo} token={token} onCambiado={(correo) => aplicar({ ...perfil, correo })} />
          <CambioContrasena correo={perfil.correo} token={token} />
        </div>
      )}
    </div>
  );
}
