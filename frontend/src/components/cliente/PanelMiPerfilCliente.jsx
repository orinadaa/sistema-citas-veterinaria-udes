// components/cliente/PanelMiPerfilCliente.jsx
// "Mi perfil" del cliente (/panel/perfil), inspirado en el del medico y
// adaptado a lo que un cliente necesita ver o cambiar.
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
import { iniciales } from '../../utils/texto';
import { Boton, EstadoError, Insignia, Pestanas } from '../vetui';
import { Campo } from '../form/Campo';
import { CambioContrasena, CambioCorreo, MensajeCuenta as Mensaje, TarjetaCuenta as Tarjeta } from '../cuenta/SeguridadCuenta';
import { IconoCalendario, IconoCorazon, IconoEscudo, IconoPata, IconoPersona } from '../icons';

const TABS = [
  { id: 'personal', etiqueta: 'Información personal', icono: IconoPersona },
  { id: 'seguridad', etiqueta: 'Seguridad', icono: IconoEscudo },
];

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
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
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
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[260px_minmax(0,1fr)_260px]">
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
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
          <CambioCorreo
            correoActual={perfil.correo}
            api={{ solicitar: (correoNuevo) => solicitarCambioCorreoCliente(correoNuevo, token), confirmar: (codigo) => confirmarCambioCorreoCliente(codigo, token) }}
            onCambiado={(correo) => aplicar({ ...perfil, correo })}
          />
          <CambioContrasena correo={perfil.correo} api={{ solicitarCodigo: () => solicitarCodigoContrasenaCliente(token), cambiar: (datos) => cambiarContrasenaCliente(datos, token) }} />
        </div>
      )}
    </div>
  );
}
