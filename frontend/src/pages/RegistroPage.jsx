// pages/RegistroPage.jsx
// RF-01: registro autoservicio de clientes. Dos pasos en la misma pantalla:
// 1) datos de la cuenta; 2) codigo de 6 digitos que llega al correo. La
// cuenta se crea solo cuando el codigo es correcto, asi el correo de toda
// cuenta es de quien la creo. El codigo se escribe en CampoCodigo, igual que
// en la recuperacion de contraseña (OlvideClavePage).
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Campo } from '../components/form/Campo';
import { CampoCodigo } from '../components/form/CampoCodigo';
import { ReenviarCodigo } from '../components/form/ReenviarCodigo';
import { useCuentaRegresiva } from '../hooks/useCuentaRegresiva';
import { registrarCliente, verificarRegistro, reenviarCodigoRegistro } from '../api/client';
import { useAuth } from '../context/AuthContext';

const CLASE_BOTON =
  'mt-2 rounded-boton bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';

export function RegistroPage() {
  const [parametros] = useSearchParams();
  const siguiente = parametros.get('next') || '/panel';
  const navegar = useNavigate();
  const { iniciarSesion } = useAuth();

  const [datos, setDatos] = useState({
    nombreCompleto: '',
    correo: '',
    contrasena: '',
    telefono: '',
    // Campo trampa contra registros automaticos: las personas no lo ven
    // ni lo llenan; un bot que rellena todo si (el servidor lo rechaza).
    sitioWeb: '',
  });
  const [autoriza, setAutoriza] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Paso 2. `solicitud` es lo que devolvio el servidor al enviar el codigo:
  // el correo ya normalizado y el identificador que ata la solicitud a este
  // navegador (el codigo solo sirve junto con el).
  const [paso, setPaso] = useState(1);
  const [solicitud, setSolicitud] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [codigoInvalido, setCodigoInvalido] = useState(false);
  const [enfocarCodigo, setEnfocarCodigo] = useState(0);
  const [aviso, setAviso] = useState('');
  const cuenta = useCuentaRegresiva(60);

  function actualizarCampo(evento) {
    setDatos((anterior) => ({ ...anterior, [evento.target.name]: evento.target.value }));
  }

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setError('');
    if (!autoriza) {
      setError('Para crear tu cuenta debes autorizar el tratamiento de tus datos personales.');
      return;
    }
    setEnviando(true);

    try {
      const respuesta = await registrarCliente({ ...datos, autorizaTratamiento: true, solicitudId: solicitud?.solicitudId });
      // Si volvio a corregir un dato antes de un minuto, el servidor no
      // manda otro codigo: la cuenta regresiva sigue donde iba.
      const esLaMisma = solicitud?.solicitudId === respuesta.solicitudId;
      setSolicitud({ correo: respuesta.correo, solicitudId: respuesta.solicitudId });
      setAviso('');
      setCodigo('');
      setCodigoInvalido(false);
      setPaso(2);
      if (!esLaMisma) cuenta.iniciar();
      setEnfocarCodigo((n) => n + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarCodigo(evento) {
    evento.preventDefault();
    setError('');
    setAviso('');
    if (codigo.length !== 6) {
      setCodigoInvalido(true);
      setError('Escribe los 6 dígitos del código.');
      return;
    }
    setEnviando(true);
    try {
      const respuesta = await verificarRegistro({ ...solicitud, codigo });
      iniciarSesion(respuesta);
      navegar(siguiente, { replace: true });
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

  async function reenviar() {
    setError('');
    setAviso('');
    setEnviando(true);
    try {
      await reenviarCodigoRegistro(solicitud);
      setAviso('Te enviamos un código nuevo. El anterior ya no sirve.');
      setCodigo('');
      setCodigoInvalido(false);
      cuenta.iniciar();
      setEnfocarCodigo((n) => n + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout
      titulo={paso === 1 ? 'Crea tu cuenta' : 'Confirma tu correo'}
      subtitulo={
        paso === 1
          ? 'Regístrate para agendar y gestionar las citas de tu mascota.'
          : 'Escribe el código que te enviamos para terminar de crear tu cuenta.'
      }
      pieDePagina={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link
            to={`/iniciar-sesion?next=${encodeURIComponent(siguiente)}`}
            className="inline-block py-1 font-medium text-brand-amber hover:text-amber-300"
          >
            Inicia sesión
          </Link>
        </>
      }
    >
      {paso === 1 ? (
        <form onSubmit={enviarFormulario} className="flex flex-col gap-4" noValidate>
          <Campo
            id="nombreCompleto"
            label="Nombre completo"
            autoComplete="name"
            value={datos.nombreCompleto}
            onChange={actualizarCampo}
            required
          />
          <Campo
            id="correo"
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            value={datos.correo}
            onChange={actualizarCampo}
            required
          />
          <Campo
            id="telefono"
            label="Teléfono (opcional)"
            type="tel"
            autoComplete="tel"
            value={datos.telefono}
            onChange={actualizarCampo}
          />
          <Campo
            id="contrasena"
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            value={datos.contrasena}
            onChange={actualizarCampo}
            minLength={8}
            required
          />

          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="sitioWeb">No llenes este campo</label>
            <input id="sitioWeb" name="sitioWeb" type="text" tabIndex={-1} autoComplete="off" value={datos.sitioWeb} onChange={actualizarCampo} />
          </div>

          {/* Autorizacion de tratamiento de datos (Ley 1581 de 2012). */}
          <label className="flex items-start gap-2.5 text-sm text-slate-800">
            <input type="checkbox" checked={autoriza} onChange={(e) => setAutoriza(e.target.checked)} className="casilla mt-0.5" required />
            <span>
              Autorizo el tratamiento de mis datos personales según la{' '}
              <Link to="/privacidad" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-blue-700 underline underline-offset-2">
                política de privacidad
              </Link>
              .
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </p>
          )}

          <button type="submit" disabled={enviando} className={CLASE_BOTON}>
            {enviando ? 'Enviando código...' : 'Continuar'}
          </button>
        </form>
      ) : (
        <form onSubmit={confirmarCodigo} className="flex flex-col gap-4" noValidate>
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 ring-1 ring-green-200">
            Enviamos un código de 6 dígitos a <span className="font-semibold break-all">{solicitud?.correo}</span>. Si no lo ves, revisa la carpeta de
            correo no deseado.
          </p>

          <CampoCodigo
            id="codigo"
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
          <ReenviarCodigo cuenta={cuenta} onReenviar={reenviar} disabled={enviando} className="-mt-1 self-center" />

          {aviso && (
            <p role="status" className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800 ring-1 ring-blue-200">
              {aviso}
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </p>
          )}

          <button type="submit" disabled={enviando} className={CLASE_BOTON}>
            {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <button
            type="button"
            onClick={() => {
              setError('');
              setAviso('');
              setPaso(1);
            }}
            className="boton-texto self-center text-sm font-medium text-slate-600 transition"
          >
            Corregir mis datos
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
