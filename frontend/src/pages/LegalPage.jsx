// pages/LegalPage.jsx
// Politica de privacidad (/privacidad) y aviso legal (/aviso-legal).
// BORRADOR redactado a partir de lo que el sistema realmente guarda y hace
// (Ley 1581 de 2012 y Decreto 1377 de 2013, Colombia). Antes de publicar el
// sitio debe revisarlo la Universidad de Santander y alinearse con su
// politica institucional de tratamiento de datos personales.
import { Link } from 'react-router-dom';
import { FondoVetui } from '../components/vetui';
import { useLogos } from '../hooks/useLogos';

const ACTUALIZADO = 'Octubre de 2026';

function Marco({ titulo, children }) {
  const logos = useLogos();
  return (
    <FondoVetui variante="sesion" textoDirecto className="flex min-h-[100dvh] flex-col items-center px-4 py-10">
      <header className="mb-6">
      <Link to="/">
        <img src={logos.principal_blanco} alt="Clínica Veterinaria UDES, ir al inicio" width="93" height="62" className="h-[62px] w-auto" />
      </Link>
      </header>
      <main className="vidrio-blanco w-full max-w-3xl rounded-superficie p-6 sm:p-10">
        <h1 className="font-heading text-2xl font-semibold text-brand-navy">{titulo}</h1>
        <p className="mt-1 text-sm text-slate-700">Última actualización: {ACTUALIZADO}</p>
        <div className="mt-6 flex flex-col gap-6 text-sm leading-relaxed text-slate-800">{children}</div>
      </main>
      <footer className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/90">
        <Link to="/" className="hover-texto-ilumina underline underline-offset-4">
          Volver al inicio
        </Link>
        <Link to="/privacidad" className="hover-texto-ilumina underline underline-offset-4">
          Política de privacidad
        </Link>
        <Link to="/aviso-legal" className="hover-texto-ilumina underline underline-offset-4">
          Aviso legal
        </Link>
      </footer>
    </FondoVetui>
  );
}

function Apartado({ titulo, children }) {
  return (
    <section>
      <h2 className="font-heading text-base font-semibold text-brand-navy">{titulo}</h2>
      <div className="mt-2 flex flex-col gap-2">{children}</div>
    </section>
  );
}

const Lista = ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>;

export function PrivacidadPage() {
  return (
    <Marco titulo="Política de privacidad y tratamiento de datos personales">
      <Apartado titulo="1. Quién es responsable de tus datos">
        <p>
          La Clínica Veterinaria UDES es un servicio de extensión de la Universidad de Santander (UDES), con sedes en Bucaramanga y Valledupar. La universidad es la
          responsable del tratamiento de los datos personales que se registran en este sistema de citas.
        </p>
      </Apartado>

      <Apartado titulo="2. Qué datos guardamos">
        <Lista>
          <li>De tu cuenta: nombre completo, correo electrónico y teléfono. Si los agregas en tu perfil, también tu documento y tu dirección.</li>
          <li>De tus mascotas: nombre, especie, raza, sexo, fecha de nacimiento, peso, color, foto y la información médica que decidas escribir (alergias, medicamentos, condiciones y observaciones).</li>
          <li>De tus citas: servicio, sede, fecha, hora, médico veterinario asignado y el motivo que indiques.</li>
          <li>Tu contraseña se guarda cifrada: ni la clínica ni la universidad pueden leerla.</li>
        </Lista>
      </Apartado>

      <Apartado titulo="3. Para qué los usamos">
        <Lista>
          <li>Agendar, reprogramar y cancelar las citas de tus mascotas.</li>
          <li>Enviarte por correo la confirmación de la cita, recordatorios y los códigos de seguridad de tu cuenta.</li>
          <li>Que el médico veterinario que te atiende conozca los datos de tu mascota.</li>
          <li>Elaborar estadísticas internas de la clínica, sin publicar datos que te identifiquen.</li>
        </Lista>
        <p>No vendemos tus datos ni los usamos para publicidad de terceros.</p>
      </Apartado>

      <Apartado titulo="4. Quién puede verlos">
        <p>
          Solo el personal autorizado de la clínica: los médicos veterinarios que atienden a tu mascota, el personal administrativo de las sedes y el
          administrador del sistema. Cada persona entra con su propia cuenta y los cambios de configuración quedan registrados.
        </p>
      </Apartado>

      <Apartado titulo="5. Cookies y almacenamiento en tu navegador">
        <p>
          Este sitio no usa cookies de publicidad ni de analítica. Solo guarda en tu navegador lo necesario para mantener tu sesión iniciada y recordar una
          preferencia de la interfaz. Al cerrar sesión, esos datos se borran.
        </p>
      </Apartado>

      <Apartado titulo="6. Tus derechos">
        <p>De acuerdo con la Ley 1581 de 2012 y el Decreto 1377 de 2013, puedes:</p>
        <Lista>
          <li>Conocer, actualizar y corregir tus datos. Los de tu cuenta y tus mascotas puedes cambiarlos tú desde tu perfil.</li>
          <li>Pedir una copia de la autorización que diste y saber qué uso se les ha dado.</li>
          <li>Revocar la autorización y pedir que se eliminen tus datos, cuando no exista un deber legal de conservarlos.</li>
          <li>Presentar una queja ante la Superintendencia de Industria y Comercio.</li>
        </Lista>
        <p>Para ejercerlos, escribe a la clínica por los canales de contacto publicados en la página de inicio o acércate a cualquiera de las sedes.</p>
      </Apartado>

      <Apartado titulo="7. Cuánto tiempo los conservamos">
        <p>Mientras tengas una cuenta activa y durante el tiempo que la clínica necesite conservar el registro de las atenciones prestadas.</p>
      </Apartado>

      <Apartado titulo="8. Autorización">
        <p>Al crear tu cuenta y marcar la casilla de autorización aceptas el tratamiento de tus datos en los términos de esta política.</p>
      </Apartado>
    </Marco>
  );
}

export function AvisoLegalPage() {
  return (
    <Marco titulo="Aviso legal">
      <Apartado titulo="1. Titular del sitio">
        <p>Este sitio pertenece a la Clínica Veterinaria UDES, servicio de la Vicerrectoría de Extensión de la Universidad de Santander (UDES), Colombia.</p>
      </Apartado>

      <Apartado titulo="2. Para qué sirve">
        <p>
          Permite conocer los servicios, sedes y horarios de la clínica, y agendar citas para tus mascotas. Agendar una cita reserva un horario de atención; no
          reemplaza la valoración de un médico veterinario.
        </p>
        <p>
          <strong>Este sitio no es un servicio de urgencias.</strong> Si tu mascota necesita atención inmediata, acude directamente a la clínica o a un servicio de
          urgencias veterinarias.
        </p>
      </Apartado>

      <Apartado titulo="3. Tu cuenta">
        <Lista>
          <li>Los datos que registres deben ser verdaderos y tuyos.</li>
          <li>Eres responsable de mantener en secreto tu contraseña y de lo que se haga con tu cuenta.</li>
          <li>La clínica puede desactivar cuentas que se usen de forma indebida, por ejemplo para reservar citas que no se van a usar.</li>
        </Lista>
      </Apartado>

      <Apartado titulo="4. Precios y disponibilidad">
        <p>
          Los precios y horarios publicados son informativos y pueden cambiar. La clínica puede reprogramar o cancelar una cita por causas de fuerza mayor y te
          avisará por los medios de contacto de tu cuenta.
        </p>
      </Apartado>

      <Apartado titulo="5. Contenidos">
        <p>El nombre, los logotipos, los textos y las fotografías del sitio pertenecen a la Universidad de Santander o se usan con autorización.</p>
      </Apartado>

      <Apartado titulo="6. Datos personales">
        <p>
          El uso de tus datos se explica en la{' '}
          <Link to="/privacidad" className="font-semibold text-brand-blue-700 underline underline-offset-2">
            política de privacidad
          </Link>
          .
        </p>
      </Apartado>
    </Marco>
  );
}
