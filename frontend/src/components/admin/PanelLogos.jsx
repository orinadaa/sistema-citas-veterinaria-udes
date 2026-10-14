// components/admin/PanelLogos.jsx
// Pagina web > Logotipos: todos los logotipos de la clinica que usa el
// sistema, incluidos los de la animacion de la barra superior, con un lugar
// para ver cada uno.
import { useRef, useState } from 'react';
import { restaurarLogo, subirLogo } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { LOGOS_ORIGINALES, publicarLogos, useLogos, useLogosPropios } from '../../hooks/useLogos';
import { Insignia } from '../vetui';

const PESO_MAXIMO_MB = 5;
const FORMATOS = ['image/png', 'image/webp', 'image/jpeg'];

// fondo: sobre que se muestra en la pagina (los blancos no se ven en claro).
const LOGOS = [
  {
    clave: 'principal_blanco',
    nombre: 'Logotipo completo, blanco',
    uso: 'Barra superior de la página pública (antes de bajar), pantallas de inicio de sesión y registro, pie de página y páginas legales.',
    fondo: 'azul',
  },
  {
    clave: 'corto_blanco',
    nombre: 'Logotipo corto, blanco',
    uso: 'Transición de la barra superior: aparece sobre el logotipo completo mientras se encoge al bajar por la página.',
    fondo: 'azul',
  },
  {
    clave: 'corto_color',
    nombre: 'Logotipo corto, a color',
    uso: 'Final de la transición de la barra superior (la píldora) y menú lateral del panel cuando está contraído.',
    fondo: 'azul',
  },
  {
    clave: 'principal_color',
    nombre: 'Logotipo completo, a color',
    uso: 'Menú lateral del panel de administración.',
    fondo: 'azul',
  },
  {
    clave: 'icono',
    nombre: 'Ícono de la pestaña',
    uso: 'Pestaña del navegador y favoritos. Conviene una imagen cuadrada, de 64 px o más.',
    fondo: 'claro',
  },
];

const FONDOS = {
  azul: 'bg-gradient-to-b from-[#0847c0] to-[#06338a]',
  claro: 'bg-slate-100',
};

function TarjetaLogo({ logo, imagen, esPropio, ocupado, onSubir, onRestaurar }) {
  const selector = useRef(null);
  const [confirmando, setConfirmando] = useState(false);
  const idTitulo = `logo-${logo.clave}`;

  return (
    <section aria-labelledby={idTitulo} className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <h2 id={idTitulo} className="font-heading text-base font-semibold text-brand-navy">
          {logo.nombre}
        </h2>
        <Insignia tono={esPropio ? 'verde' : 'gris'}>{esPropio ? 'Archivo propio' : 'Original'}</Insignia>
      </div>

      <div className={`flex h-36 items-center justify-center rounded-xl p-5 ${FONDOS[logo.fondo]}`}>
        <img src={imagen} alt={`${logo.nombre}, archivo actual`} className="max-h-full max-w-full object-contain" />
      </div>

      <p className="text-sm text-slate-700">
        <span className="font-semibold text-slate-800">Dónde se usa:</span> {logo.uso}
      </p>

      <input
        ref={selector}
        type="file"
        accept={FORMATOS.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(evento) => {
          const archivo = evento.target.files?.[0];
          evento.target.value = '';
          if (archivo) onSubir(logo, archivo);
        }}
      />

      {confirmando ? (
        <div className="flex flex-col gap-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
          <p className="text-sm text-amber-900">¿Volver al logotipo original? El archivo que subiste se borra.</p>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setConfirmando(false)} className="rounded-boton bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 transition hover:bg-slate-50">
              No, conservar
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={async () => {
                await onRestaurar(logo);
                setConfirmando(false);
              }}
              className="rounded-boton bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-700 disabled:opacity-60"
            >
              Sí, usar el original
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-auto flex flex-wrap justify-end gap-2">
          {esPropio && (
            <button type="button" disabled={ocupado} onClick={() => setConfirmando(true)} className="rounded-boton bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 transition hover:bg-slate-50 disabled:opacity-60">
              Restaurar original
            </button>
          )}
          <button
            type="button"
            disabled={ocupado}
            onClick={() => selector.current?.click()}
            aria-label={`Subir otro archivo para: ${logo.nombre}`}
            className="rounded-boton bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-700 disabled:opacity-60"
          >
            {ocupado ? 'Subiendo...' : 'Subir otro archivo'}
          </button>
        </div>
      )}
    </section>
  );
}

export function PanelLogos() {
  const { token } = useAuth();
  const logos = useLogos();
  const propios = useLogosPropios();
  const [ocupado, setOcupado] = useState(null);
  const [estado, setEstado] = useState(null);

  async function subir(logo, archivo) {
    setEstado(null);
    if (!FORMATOS.includes(archivo.type)) {
      setEstado({ tipo: 'error', texto: 'El archivo debe ser una imagen PNG, WebP o JPG.' });
      return;
    }
    if (archivo.size > PESO_MAXIMO_MB * 1024 * 1024) {
      setEstado({ tipo: 'error', texto: `El archivo no puede pesar más de ${PESO_MAXIMO_MB} MB.` });
      return;
    }
    setOcupado(logo.clave);
    try {
      const respuesta = await subirLogo(logo.clave, archivo, token);
      publicarLogos(respuesta.logos);
      setEstado({ tipo: 'ok', texto: `«${logo.nombre}» actualizado. Ya se ve en toda la página.` });
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
    } finally {
      setOcupado(null);
    }
  }

  async function restaurar(logo) {
    setEstado(null);
    setOcupado(logo.clave);
    try {
      const respuesta = await restaurarLogo(logo.clave, token);
      publicarLogos(respuesta.logos);
      setEstado({ tipo: 'ok', texto: `«${logo.nombre}» volvió al original.` });
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-3xl text-sm text-white/90">
        <p>Los logotipos de la clínica que usa el sistema. Cada uno muestra el archivo actual; sube otro para reemplazarlo en toda la página.</p>
        <p className="mt-2">
          Usa PNG o WebP con fondo transparente (máximo {PESO_MAXIMO_MB} MB). Para que la transición de la barra superior siga calzando, los archivos nuevos deben tener las mismas proporciones y márgenes que los originales.
        </p>
      </div>

      {estado && (
        <p role="status" className={`rounded-lg px-3 py-2 text-sm ring-1 ${estado.tipo === 'ok' ? 'bg-green-50 text-green-800 ring-green-200' : 'bg-red-50 text-red-700 ring-red-200'}`}>
          {estado.texto}
        </p>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2 xl:grid-cols-3">
        {LOGOS.map((logo) => (
          <TarjetaLogo
            key={logo.clave}
            logo={logo}
            imagen={logos[logo.clave] ?? LOGOS_ORIGINALES[logo.clave]}
            esPropio={Boolean(propios[logo.clave])}
            ocupado={ocupado === logo.clave}
            onSubir={subir}
            onRestaurar={restaurar}
          />
        ))}
      </div>
    </div>
  );
}
