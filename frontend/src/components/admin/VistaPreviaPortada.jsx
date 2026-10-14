// components/admin/VistaPreviaPortada.jsx
// Vista previa de la portada (hero) en Pagina web > Textos: dentro de una
// ventana de navegador de escritorio o de un marco de celular. Los botones de
// la ventana y de la pagina son decorativos (no hacen nada).
import { useState } from 'react';
import { useLogos } from '../../hooks/useLogos';
import {
  IconoCandado,
  IconoCelular,
  IconoCuadro,
  IconoEscudo,
  IconoFlechaDerecha,
  IconoImagen,
  IconoMenu,
  IconoMinimizar,
  IconoMonitor,
  IconoPata,
  IconoX,
} from '../icons';

const DOMINIO = 'citas-veterinaria-udes.duckdns.org';

function TextosHero({ valores, movil }) {
  const vinetas = [
    { Icono: IconoPata, texto: valores.hero_vineta_1 },
    { Icono: IconoEscudo, texto: valores.hero_vineta_2 },
  ].filter((v) => v.texto);
  return (
    <div className={movil ? '' : 'max-w-md'}>
      <p className={`font-heading font-bold leading-tight text-white ${movil ? 'text-2xl' : 'text-3xl'}`}>
        {valores.hero_titulo}
        {valores.hero_destacado && <> <span className="text-brand-amber">{valores.hero_destacado}</span></>}
      </p>
      <p className={`mt-3 leading-relaxed text-blue-50 ${movil ? 'text-sm' : 'text-[0.95rem]'}`}>{valores.hero_descripcion}</p>
      <div className={`mt-5 flex gap-2.5 ${movil ? 'flex-col' : 'flex-wrap'}`}>
        <span className="inline-flex items-center justify-center gap-1.5 rounded-boton bg-brand-amber px-4 py-2 text-xs font-semibold text-slate-900">
          Agendar cita
          <IconoFlechaDerecha className="h-3.5 w-3.5" />
        </span>
        <span className="inline-flex items-center justify-center rounded-boton bg-white/15 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/30">
          Conoce nuestros servicios
        </span>
      </div>
      {vinetas.length > 0 && (
        <div className={`mt-5 flex gap-2 text-xs font-medium text-white/90 ${movil ? 'flex-col' : 'flex-wrap gap-x-6'}`}>
          {vinetas.map(({ Icono, texto }) => (
            <span key={texto} className="flex items-center gap-2">
              <Icono className="h-4 w-4 shrink-0" />
              {texto}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function VentanaEscritorio({ valores, logos }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-300">
      {/* Barra de titulo con la pestaña y los botones de la ventana */}
      <div className="flex h-10 items-end justify-between bg-slate-200 pl-3">
        <div className="flex h-8 min-w-0 items-center gap-2 rounded-t-lg bg-white px-3 text-xs text-slate-700">
          <img src={logos.icono} alt="" className="h-4 w-4 shrink-0" />
          <span className="truncate">Clínica Veterinaria UDES</span>
          <IconoX className="ml-3 h-3 w-3 shrink-0 text-slate-400" />
        </div>
        <div aria-hidden="true" className="flex h-10 self-start text-slate-600">
          <span className="grid w-11 place-items-center">
            <IconoMinimizar className="h-3.5 w-3.5" />
          </span>
          <span className="grid w-11 place-items-center">
            <IconoCuadro className="h-3 w-3" />
          </span>
          <span className="grid w-11 place-items-center transition-colors hover:bg-red-600 hover:text-white">
            <IconoX className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
      {/* Barra de direccion */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
          <IconoCandado className="h-3 w-3 shrink-0" />
          <span className="truncate">{DOMINIO}</span>
        </div>
      </div>
      {/* Pagina */}
      <div className="aspect-[16/10] overflow-hidden bg-gradient-to-br from-brand-blue-500 to-brand-blue-800">
        <div className="flex items-center justify-between px-6 py-3">
          <img src={logos.principal_blanco} alt="" className="h-8 w-auto" />
          <div className="flex items-center gap-5 text-xs font-medium text-white/85">
            <span>Servicios</span>
            <span>Sedes</span>
            <span>Horarios</span>
            <span className="rounded-boton bg-white/15 px-3 py-1.5 ring-1 ring-white/30">Iniciar sesión</span>
          </div>
        </div>
        <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-center gap-6 px-6 pt-6">
          <TextosHero valores={valores} />
          <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-white/10 text-white/70 ring-1 ring-white/20">
            <span className="flex flex-col items-center gap-2 text-xs">
              <IconoImagen className="h-8 w-8" />
              Galería de fotos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarcoCelular({ valores, logos }) {
  return (
    <div className="mx-auto w-[290px] rounded-[2.75rem] bg-slate-900 p-3 shadow-2xl ring-1 ring-slate-700">
      <div className="relative h-[580px] overflow-hidden rounded-[2.1rem] bg-gradient-to-br from-brand-blue-500 to-brand-blue-800">
        {/* Barra de estado y camara */}
        <div className="flex items-center justify-between px-6 pt-3 text-[0.7rem] font-semibold text-white">
          <span>9:41</span>
          <span aria-hidden="true" className="absolute left-1/2 top-2.5 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
          <span className="flex items-center gap-1" aria-hidden="true">
            <span className="h-2 w-3 rounded-sm bg-white/90" />
            <span className="h-2.5 w-5 rounded-[3px] ring-1 ring-white/90" />
          </span>
        </div>
        <div className="h-[calc(100%-2rem)] overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-3">
            <img src={logos.corto_blanco} alt="" className="h-8 w-auto" />
            <IconoMenu className="h-6 w-6 text-white" />
          </div>
          <div className="px-5 pb-8 pt-6">
            <TextosHero valores={valores} movil />
          </div>
        </div>
      </div>
    </div>
  );
}

export function VistaPreviaPortada({ valores }) {
  const logos = useLogos();
  const [vista, setVista] = useState('escritorio');
  const opciones = [
    { id: 'escritorio', texto: 'Computador', Icono: IconoMonitor },
    { id: 'movil', texto: 'Celular', Icono: IconoCelular },
  ];
  return (
    <div aria-label="Vista previa de la portada" className="flex flex-col gap-4 self-start xl:sticky xl:top-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vista previa</p>
        <div role="group" aria-label="Tipo de pantalla" className="inline-flex rounded-full bg-slate-100 p-1 ring-1 ring-slate-200">
          {opciones.map(({ id, texto, Icono }) => (
            <button
              key={id}
              type="button"
              aria-pressed={vista === id}
              onClick={() => setVista(id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                vista === id ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-600 hover:text-brand-navy'
              }`}
            >
              <Icono className="h-4 w-4 shrink-0" />
              {texto}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:p-6">
        {vista === 'escritorio' ? <VentanaEscritorio valores={valores} logos={logos} /> : <MarcoCelular valores={valores} logos={logos} />}
      </div>
    </div>
  );
}
