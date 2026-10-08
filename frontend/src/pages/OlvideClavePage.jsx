// pages/OlvideClavePage.jsx
// Recuperacion de contraseña por codigo, para cualquier rol. Dos pasos en
// la misma pantalla: 1) pedir el codigo por correo, 2) confirmarlo junto
// con la nueva contraseña. El codigo se escribe en CampoCodigo (un recuadro
// por digito); si es incorrecto los recuadros se ponen en rojo, se vacian y
// el foco vuelve al primero. "Reenviar código" espera el mismo minuto que
// exige el servidor entre envios.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Campo } from '../components/form/Campo';
import { CampoCodigo } from '../components/form/CampoCodigo';
import { ReenviarCodigo } from '../components/form/ReenviarCodigo';
import { useCuentaRegresiva } from '../hooks/useCuentaRegresiva';
import { solicitarCodigoRecuperacion, restablecerContrasena } from '../api/client';

export function OlvideClavePage() {
  const navegar = useNavigate();
  const [paso, setPaso] = useState(1);
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [codigoInvalido, setCodigoInvalido] = useState(false);
  const [enfocarCodigo, setEnfocarCodigo] = useState(0);
  const cuenta = useCuentaRegresiva(60);

  // Sirve para el primer envio (formulario del paso 1) y para "Reenviar".
  async function pedirCodigo(evento) {
    evento?.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const respuesta = await solicitarCodigoRecuperacion({ correo });
      setMensaje(respuesta.mensaje);
      setCodigo('');
      setCodigoInvalido(false);
      setPaso(2);
      cuenta.iniciar();
      setEnfocarCodigo((n) => n + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarNuevaContrasena(evento) {
    evento.preventDefault();
    setError('');
    if (codigo.length !== 6) {
      setCodigoInvalido(true);
      setError('Escribe los 6 dígitos del código.');
      return;
    }
    if (contrasenaNueva.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setEnviando(true);
    try {
      await restablecerContrasena({ correo, codigo, contrasenaNueva });
      navegar('/iniciar-sesion?restablecida=1', { replace: true });
    } catch (err) {
      setError(err.message);
      // Codigo incorrecto o vencido: recuadros en rojo, vacios y foco al primero.
      if (/c[oó]digo/i.test(err.message)) {
        setCodigoInvalido(true);
        setCodigo('');
        setEnfocarCodigo((n) => n + 1);
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout
      titulo="Recupera tu contraseña"
      subtitulo={
        paso === 1
          ? 'Ingresa tu correo y te enviaremos un código de seguridad.'
          : 'Ingresa el código que recibiste y tu nueva contraseña.'
      }
      pieDePagina={
        <Link to="/iniciar-sesion" className="font-medium text-brand-amber hover:text-amber-300">
          Volver a iniciar sesión
        </Link>
      }
    >
      {paso === 1 ? (
        <form onSubmit={pedirCodigo} className="flex flex-col gap-4" noValidate>
          <Campo
            id="correo"
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="mt-2 rounded-boton bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? 'Enviando...' : 'Enviar código'}
          </button>
        </form>
      ) : (
        <form onSubmit={confirmarNuevaContrasena} className="flex flex-col gap-4" noValidate>
          {mensaje && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 ring-1 ring-green-200">{mensaje}</p>
          )}

          <CampoCodigo
            id="codigo"
            valor={codigo}
            onChange={(valor) => {
              setCodigo(valor);
              setCodigoInvalido(false);
            }}
            error={codigoInvalido}
            disabled={enviando}
            enfocar={enfocarCodigo}
          />
          <ReenviarCodigo cuenta={cuenta} onReenviar={() => pedirCodigo()} disabled={enviando} className="-mt-1 self-center" />
          <Campo
            id="contrasenaNueva"
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            value={contrasenaNueva}
            onChange={(e) => setContrasenaNueva(e.target.value)}
            minLength={8}
            required
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="mt-2 rounded-boton bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? 'Restableciendo...' : 'Restablecer contraseña'}
          </button>

          <button
            type="button"
            onClick={() => {
              setError('');
              setPaso(1);
            }}
            className="boton-texto self-center text-sm font-medium text-slate-600 transition"
          >
            Usar otro correo
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
