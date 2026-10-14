// components/admin/PanelInfoClinica.jsx
// Pagina web > Informacion de la clinica (RF-23, superadministrador): lo que
// la pagina publica muestra de la clinica y que se cambia sin programar.
import { useEffect, useState } from 'react';
import { actualizarInfoClinica, obtenerInfoClinicaAdmin } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { olvidarInfoClinica } from '../../hooks/useInfoClinica';
import { StatusToggle } from '../ui/StatusToggle';
import { EstadoError } from '../ui/EstadoError';
import { Campo } from '../form/Campo';
import { IconoFacebook, IconoInstagram, IconoTiktok, IconoWhatsapp, IconoYoutube } from '../icons';

const REDES = [
  { clave: 'instagramUrl', nombre: 'Instagram', Icono: IconoInstagram, ejemplo: 'https://instagram.com/tu_cuenta' },
  { clave: 'facebookUrl', nombre: 'Facebook', Icono: IconoFacebook, ejemplo: 'https://facebook.com/tu_pagina' },
  { clave: 'tiktokUrl', nombre: 'TikTok', Icono: IconoTiktok, ejemplo: 'https://tiktok.com/@tu_cuenta' },
  { clave: 'youtubeUrl', nombre: 'YouTube', Icono: IconoYoutube, ejemplo: 'https://youtube.com/@tu_canal' },
];

// 573227621383 -> +57 322 762 1383 (solo para mostrarlo; se guarda en digitos).
function mostrarNumero(digitos) {
  if (!digitos) return '';
  const m = /^57(\d{3})(\d{3})(\d{4})$/.exec(digitos);
  return m ? `+57 ${m[1]} ${m[2]} ${m[3]}` : `+${digitos}`;
}

export function PanelInfoClinica() {
  const { token } = useAuth();
  const [form, setForm] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [estado, setEstado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [intento, setIntento] = useState(0);

  function aFormulario(clinica) {
    return {
      whatsappNumero: mostrarNumero(clinica.whatsappNumero),
      whatsappActivo: clinica.whatsappActivo,
      ...Object.fromEntries(REDES.map((red) => [red.clave, clinica[red.clave] ?? ''])),
    };
  }

  useEffect(() => {
    let vigente = true;
    obtenerInfoClinicaAdmin(token)
      .then((datos) => vigente && (setForm(aFormulario(datos.clinica)), setErrorCarga('')))
      .catch((err) => vigente && setErrorCarga(err.message || 'No se pudo cargar la información de la clínica.'));
    return () => {
      vigente = false;
    };
  }, [token, intento]);

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setEstado(null);
    try {
      const respuesta = await actualizarInfoClinica(form, token);
      setForm(aFormulario(respuesta.clinica));
      olvidarInfoClinica();
      setEstado({ tipo: 'ok', texto: 'Información de la clínica actualizada. Ya se ve en la página pública.' });
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  if (errorCarga) return <EstadoError mensaje={errorCarga} onReintentar={() => setIntento((n) => n + 1)} />;
  if (!form) return <div className="h-48 animate-pulse rounded-2xl bg-white/20" />;

  return (
    <form onSubmit={guardar} className="flex flex-col gap-6" noValidate>
      <p className="max-w-2xl text-sm text-white/90">Datos de contacto que ve cualquier visitante en la página pública.</p>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-brand-navy">
            <IconoWhatsapp className="h-5 w-5 text-[#128C7E]" peso="fill" />
            WhatsApp
          </h2>
          <p className="mt-1 text-sm text-slate-700">Un solo número para toda la clínica. La burbuja flotante de la página pública abre el chat con este número.</p>
          <div className="mt-4 flex flex-col gap-4">
            <Campo
              id="clinica-whatsapp"
              label="Número de WhatsApp"
              inputMode="tel"
              placeholder="+57 322 762 1383"
              value={form.whatsappNumero}
              maxLength={20}
              onChange={(e) => setForm({ ...form, whatsappNumero: e.target.value })}
            />
            <StatusToggle
              checked={form.whatsappActivo}
              onChange={(valor) => setForm({ ...form, whatsappActivo: typeof valor === 'boolean' ? valor : !form.whatsappActivo })}
              label="Mostrar la burbuja de WhatsApp"
              helpText="Apagada, la burbuja no aparece y el número no se publica."
            />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-heading text-base font-semibold text-brand-navy">Redes sociales</h2>
          <p className="mt-1 text-sm text-slate-700">Aparecen como iconos en el pie de página. Deja vacía la que no uses.</p>
          <div className="mt-4 flex flex-col gap-4">
            {REDES.map(({ clave, nombre, Icono, ejemplo }) => (
              <div key={clave} className="flex items-end gap-3">
                <span className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-brand-blue-700">
                  <Icono className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <Campo id={`clinica-${clave}`} label={nombre} type="url" placeholder={ejemplo} value={form[clave]} maxLength={200} onChange={(e) => setForm({ ...form, [clave]: e.target.value })} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {estado && (
        <p role="alert" className={`rounded-lg px-3 py-2 text-sm ring-1 ${estado.tipo === 'ok' ? 'bg-green-50 text-green-800 ring-green-200' : 'bg-red-50 text-red-700 ring-red-200'}`}>
          {estado.texto}
        </p>
      )}
      <button
        type="submit"
        disabled={guardando}
        className="boton-glass-ambar self-end rounded-boton px-5 py-2.5 text-sm font-semibold text-brand-navy transition disabled:opacity-60"
      >
        {guardando ? 'Guardando...' : 'Guardar información'}
      </button>
    </form>
  );
}
