// components/form/CampoContrasenaNueva.jsx
// Campo para definir una contraseña nueva (registro, recuperación, primer
// ingreso y cambio desde el perfil). Debajo muestra una barra con el nivel
// (débil, media o fuerte) y la lista de requisitos, que se marcan a medida que
// se cumplen. El atributo data-contrasena-nueva hace que la validación global
// de formularios (utils/validacionFormularios.js) exija todas las reglas.
import { Campo } from './Campo';
import { IconoCheck } from '../icons';
import { REGLAS_CONTRASENA, nivelContrasena } from '../../utils/contrasena';

const NIVELES = {
  debil: { texto: 'Débil', segmentos: 1, color: 'bg-red-500', textoColor: 'text-red-700' },
  media: { texto: 'Media', segmentos: 2, color: 'bg-amber-500', textoColor: 'text-amber-800' },
  fuerte: { texto: 'Fuerte', segmentos: 3, color: 'bg-green-600', textoColor: 'text-green-700' },
};

export function CampoContrasenaNueva({ id, value, ...resto }) {
  const clave = String(value ?? '');
  const nivel = NIVELES[nivelContrasena(clave)];

  return (
    <div className="flex flex-col gap-2">
      <Campo
        id={id}
        type="password"
        autoComplete="new-password"
        value={value}
        data-contrasena-nueva="true"
        aria-describedby={`${id}-requisitos`}
        {...resto}
      />
      <div id={`${id}-requisitos`} className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="grid flex-1 grid-cols-3 gap-1.5" aria-hidden="true">
            {[1, 2, 3].map((segmento) => (
              <span
                key={segmento}
                className={`h-1.5 rounded-full transition-colors ${nivel && segmento <= nivel.segmentos ? nivel.color : 'bg-slate-900/10'}`}
              />
            ))}
          </div>
          <p className={`w-28 text-right text-xs font-semibold ${nivel ? nivel.textoColor : 'text-slate-500'}`} aria-live="polite">
            {nivel ? `Seguridad: ${nivel.texto}` : 'Seguridad: —'}
          </p>
        </div>
        <ul className="flex flex-col gap-1">
          {REGLAS_CONTRASENA.map((regla) => {
            const cumple = regla.cumple(clave);
            return (
              <li key={regla.id} className={`flex items-center gap-2 text-xs ${cumple ? 'text-green-700' : 'text-slate-600'}`}>
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${cumple ? 'border-green-600 bg-green-600 text-white' : 'border-slate-400'}`}
                  aria-hidden="true"
                >
                  {cumple && <IconoCheck className="h-2.5 w-2.5" />}
                </span>
                <span>
                  {regla.texto}
                  <span className="sr-only">{cumple ? ': cumplido' : ': pendiente'}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
