// components/admin/PanelMiCuenta.jsx
// "Mi cuenta" del administrador de sede y del superadministrador (menu del
// avatar del panel): sus datos y la seguridad de su cuenta.
import { useEffect, useState } from 'react';
import {
  cambiarContrasenaMiCuenta,
  confirmarCambioCorreoMiCuenta,
  obtenerMiCuenta,
  solicitarCambioCorreoMiCuenta,
  solicitarCodigoContrasenaMiCuenta,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { iniciales } from '../../utils/texto';
import { PageHeader } from '../ui/PageHeader';
import { EstadoError } from '../ui/EstadoError';
import { CambioContrasena, CambioCorreo, TarjetaCuenta } from '../cuenta/SeguridadCuenta';

const ROLES = { superadministrador: 'Superadministrador', administrador: 'Administrador de sede' };

export function PanelMiCuenta() {
  const { token, usuario, iniciarSesion } = useAuth();
  const [cuenta, setCuenta] = useState(null);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    obtenerMiCuenta(token)
      .then((datos) => vigente && (setCuenta(datos.cuenta), setError('')))
      .catch((err) => vigente && setError(err.message || 'No se pudo cargar tu cuenta.'));
    return () => {
      vigente = false;
    };
  }, [token, intento]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Mi cuenta" subtitle="Tus datos de acceso al sistema." />

      {error ? (
        <EstadoError mensaje={error} onReintentar={() => setIntento((n) => n + 1)} />
      ) : !cuenta ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white/20" />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[260px_minmax(0,1fr)_minmax(0,1fr)]">
          <TarjetaCuenta className="self-start">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-blue-700 text-2xl font-bold text-white ring-4 ring-white">
                {iniciales(cuenta.nombreCompleto)}
              </span>
              <p className="mt-3 font-heading text-lg font-semibold text-brand-navy">{cuenta.nombreCompleto}</p>
              <p className="text-sm text-slate-700">{ROLES[cuenta.rol] ?? cuenta.rol}</p>
            </div>
            <dl className="mt-5 flex flex-col gap-3 border-t border-slate-900/10 pt-4 text-sm">
              <div>
                <dt className="text-xs font-medium text-slate-700">Correo</dt>
                <dd className="break-words text-slate-900">{cuenta.correo}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-700">Cuenta creada</dt>
                <dd className="text-slate-900">{new Date(cuenta.creadoEn).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
              </div>
            </dl>
          </TarjetaCuenta>

          <CambioCorreo
            correoActual={cuenta.correo}
            descripcion="Con este correo inicias sesión y recibes los códigos de seguridad."
            api={{ solicitar: (correoNuevo) => solicitarCambioCorreoMiCuenta(correoNuevo, token), confirmar: (codigo) => confirmarCambioCorreoMiCuenta(codigo, token) }}
            onCambiado={(correo) => {
              setCuenta((actual) => ({ ...actual, correo }));
              // El correo tambien vive en la sesion.
              iniciarSesion({ usuario: { ...usuario, correo }, token });
            }}
          />
          <CambioContrasena
            correo={cuenta.correo}
            pideActual
            api={{
              solicitarCodigo: (contrasenaActual) => solicitarCodigoContrasenaMiCuenta(contrasenaActual, token),
              cambiar: (datos) => cambiarContrasenaMiCuenta(datos, token),
            }}
          />
        </div>
      )}
    </div>
  );
}
