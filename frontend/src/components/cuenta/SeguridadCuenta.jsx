// components/cuenta/SeguridadCuenta.jsx
// Las dos tarjetas de seguridad de una cuenta, compartidas por "Mi perfil" del
// cliente y "Mi cuenta" del administrador y del superadministrador.
import { useState } from 'react';
import { useCuentaRegresiva } from '../../hooks/useCuentaRegresiva';
import { Boton } from '../vetui';
import { Campo } from '../form/Campo';
import { CampoCodigo } from '../form/CampoCodigo';
import { ReenviarCodigo } from '../form/ReenviarCodigo';
import { IconoCorreo } from '../icons';

export function TarjetaCuenta({ titulo, descripcion, children, className = '' }) {
  return (
    <section className={`vidrio-blanco rounded-superficie p-5 sm:p-6 ${className}`}>
      {titulo && <h2 className="font-heading text-base font-semibold text-brand-navy">{titulo}</h2>}
      {descripcion && <p className="mt-1 text-sm text-slate-700">{descripcion}</p>}
      <div className={titulo ? 'mt-4' : ''}>{children}</div>
    </section>
  );
}

export function MensajeCuenta({ estado }) {
  if (!estado?.texto) return null;
  return (
    <p role="alert" className={`rounded-lg px-3 py-2 text-sm ring-1 ${estado.tipo === 'ok' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-red-50 text-red-700 ring-red-200'}`}>
      {estado.texto}
    </p>
  );
}

// api: { solicitar(correoNuevo), confirmar(codigo) -> { correo, mensaje } }
export function CambioCorreo({ correoActual, api, onCambiado, descripcion = 'Con este correo inicias sesión y recibes los avisos del sistema.' }) {
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
      const respuesta = await api.solicitar(correoNuevo.trim());
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
      const respuesta = await api.confirmar(codigo);
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
    <TarjetaCuenta titulo="Correo electrónico" descripcion={descripcion}>
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
        <MensajeCuenta estado={estado} />
      </div>
    </TarjetaCuenta>
  );
}

// api: { solicitarCodigo(contrasenaActual?) -> { mensaje }, cambiar({ codigo, contrasenaNueva }) -> { mensaje } }
export function CambioContrasena({ correo, api, pideActual = false }) {
  const [paso, setPaso] = useState('inicio'); // inicio | confirmar
  const [actual, setActual] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [estado, setEstado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [codigoInvalido, setCodigoInvalido] = useState(false);
  const [enfocar, setEnfocar] = useState(0);
  const cuenta = useCuentaRegresiva(60);

  async function pedirCodigo(evento) {
    evento?.preventDefault();
    if (pideActual && !actual) {
      setEstado({ tipo: 'error', texto: 'Escribe tu contraseña actual.' });
      return;
    }
    setEnviando(true);
    setEstado(null);
    try {
      const respuesta = await api.solicitarCodigo(pideActual ? actual : undefined);
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

  function reiniciar() {
    setPaso('inicio');
    setActual('');
    setCodigo('');
    setNueva('');
    setConfirmacion('');
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
      const respuesta = await api.cambiar({ codigo, contrasenaNueva: nueva });
      reiniciar();
      setEstado({ tipo: 'ok', texto: respuesta.mensaje });
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
    <TarjetaCuenta
      titulo="Contraseña"
      descripcion={
        pideActual
          ? 'Para cambiarla pedimos tu contraseña actual y un código que enviamos a tu correo.'
          : 'Para cambiarla confirmamos que eres tú con un código que enviamos a tu correo.'
      }
    >
      <div className="flex flex-col gap-4">
        {paso === 'inicio' ? (
          <form onSubmit={pedirCodigo} className="flex flex-col gap-4" noValidate>
            {pideActual && (
              <Campo id="contrasena-actual-cuenta" label="Contraseña actual" type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} required />
            )}
            <p className="text-sm text-slate-700">
              Enviaremos un código de 6 dígitos a <strong className="font-semibold text-slate-900">{correo}</strong>. Vence en 15 minutos.
            </p>
            <Boton type="submit" variante="contorno" disabled={enviando} className="self-start">
              {enviando ? 'Enviando...' : 'Enviar código para cambiar mi contraseña'}
            </Boton>
          </form>
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
            <ReenviarCodigo cuenta={cuenta} onReenviar={() => pedirCodigo()} disabled={enviando} className="-mt-1 self-center" />
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
              <Campo id="contrasena-nueva-perfil" label="Nueva contraseña" type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} required />
              <Campo id="contrasena-confirmar-perfil" label="Repite la contraseña" type="password" autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} required />
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Boton
                variante="contorno"
                tamano="sm"
                disabled={enviando}
                onClick={() => {
                  reiniciar();
                  setEstado(null);
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
        <MensajeCuenta estado={estado} />
      </div>
    </TarjetaCuenta>
  );
}
