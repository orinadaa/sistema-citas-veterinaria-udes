// components/icons.jsx
// Iconos del sistema: Phosphor Icons (@phosphor-icons/react, MIT),
// elegida por Oriana porque trae los iconos de veterinaria (huella,
// jeringa, estetoscopio, diente...) y varios pesos del mismo dibujo.
// Reemplaza al set de linea dibujado a mano que habia antes.
//
// Este archivo es la UNICA puerta de entrada: el resto del sistema sigue
// importando IconoReloj, IconoPata, etc. desde aca, con la misma interfaz
// de siempre (className para tamaño y color; el color es el del texto).
// Para un icono nuevo: importarlo de Phosphor y exportarlo igual que los demas.
//
// `peso` elige la variante del dibujo:
// - "regular" (por defecto): linea. Botones, menus, topbar, campos.
// - "duotone": linea + relleno suave del mismo color. Solo para iconos
//   ilustrativos: servicios, tarjetas de indicadores y estados vacios.
// - "bold" / "fill": casos puntuales que necesitan mas peso.
//
// Cada icono se importa por su propio archivo (dist/csr/...), no desde la
// raiz del paquete: asi Vite no tiene que procesar los ~1500 iconos.
import { ArrowClockwiseIcon } from '@phosphor-icons/react/dist/csr/ArrowClockwise';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { BellIcon } from '@phosphor-icons/react/dist/csr/Bell';
import { BirdIcon } from '@phosphor-icons/react/dist/csr/Bird';
import { BoneIcon } from '@phosphor-icons/react/dist/csr/Bone';
import { BugIcon } from '@phosphor-icons/react/dist/csr/Bug';
import { CalendarBlankIcon } from '@phosphor-icons/react/dist/csr/CalendarBlank';
import { CameraIcon } from '@phosphor-icons/react/dist/csr/Camera';
import { CarIcon } from '@phosphor-icons/react/dist/csr/Car';
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import { CatIcon } from '@phosphor-icons/react/dist/csr/Cat';
import { ChartBarIcon } from '@phosphor-icons/react/dist/csr/ChartBar';
import { CheckIcon } from '@phosphor-icons/react/dist/csr/Check';
import { ClockIcon } from '@phosphor-icons/react/dist/csr/Clock';
import { CropIcon } from '@phosphor-icons/react/dist/csr/Crop';
import { DogIcon } from '@phosphor-icons/react/dist/csr/Dog';
import { DotsThreeVerticalIcon } from '@phosphor-icons/react/dist/csr/DotsThreeVertical';
import { EnvelopeIcon } from '@phosphor-icons/react/dist/csr/Envelope';
import { EyeIcon } from '@phosphor-icons/react/dist/csr/Eye';
import { EyeSlashIcon } from '@phosphor-icons/react/dist/csr/EyeSlash';
import { FileTextIcon } from '@phosphor-icons/react/dist/csr/FileText';
import { FlaskIcon } from '@phosphor-icons/react/dist/csr/Flask';
import { GearIcon } from '@phosphor-icons/react/dist/csr/Gear';
import { HeartIcon } from '@phosphor-icons/react/dist/csr/Heart';
import { HospitalIcon } from '@phosphor-icons/react/dist/csr/Hospital';
import { ImageIcon } from '@phosphor-icons/react/dist/csr/Image';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { MapPinIcon } from '@phosphor-icons/react/dist/csr/MapPin';
import { PawPrintIcon } from '@phosphor-icons/react/dist/csr/PawPrint';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/csr/PencilSimple';
import { DatabaseIcon } from '@phosphor-icons/react/dist/csr/Database';
import { DownloadSimpleIcon } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { GlobeIcon } from '@phosphor-icons/react/dist/csr/Globe';
import { HouseIcon } from '@phosphor-icons/react/dist/csr/House';
import { StackIcon } from '@phosphor-icons/react/dist/csr/Stack';
import { PillIcon } from '@phosphor-icons/react/dist/csr/Pill';
import { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus';
import { ScalesIcon } from '@phosphor-icons/react/dist/csr/Scales';
import { ScissorsIcon } from '@phosphor-icons/react/dist/csr/Scissors';
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/csr/ShieldCheck';
import { SparkleIcon } from '@phosphor-icons/react/dist/csr/Sparkle';
import { SignOutIcon } from '@phosphor-icons/react/dist/csr/SignOut';
import { StethoscopeIcon } from '@phosphor-icons/react/dist/csr/Stethoscope';
import { SyringeIcon } from '@phosphor-icons/react/dist/csr/Syringe';
import { ToothIcon } from '@phosphor-icons/react/dist/csr/Tooth';
import { TrashIcon } from '@phosphor-icons/react/dist/csr/Trash';
import { UserIcon } from '@phosphor-icons/react/dist/csr/User';
import { UsersIcon } from '@phosphor-icons/react/dist/csr/Users';
import { WarningIcon } from '@phosphor-icons/react/dist/csr/Warning';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';

// Dibuja un icono de Phosphor (`de`) con la interfaz del sistema.
// aria-hidden: todos son decorativos (el nombre accesible lo pone el boton
// o el texto de al lado).
function Icono({ de: Phosphor, className, peso = 'regular' }) {
  return <Phosphor className={className} weight={peso} aria-hidden="true" />;
}

// --- Interfaz ---
export function IconoReloj(props) {
  return <Icono de={ClockIcon} {...props} />;
}
export function IconoUbicacion(props) {
  return <Icono de={MapPinIcon} {...props} />;
}
// Cerrar sesion: puerta con flecha saliendo.
export function IconoSalir(props) {
  return <Icono de={SignOutIcon} {...props} />;
}
export function IconoFlechaDerecha(props) {
  return <Icono de={ArrowRightIcon} {...props} />;
}
export function IconoAlerta(props) {
  return <Icono de={WarningIcon} {...props} />;
}
export function IconoCorazon(props) {
  return <Icono de={HeartIcon} {...props} />;
}
export function IconoOjo(props) {
  return <Icono de={EyeIcon} {...props} />;
}
export function IconoOjoTachado(props) {
  return <Icono de={EyeSlashIcon} {...props} />;
}
export function IconoEscudo(props) {
  return <Icono de={ShieldCheckIcon} {...props} />;
}
export function IconoCalendario(props) {
  return <Icono de={CalendarBlankIcon} {...props} />;
}
export function IconoMedicos(props) {
  return <Icono de={UsersIcon} {...props} />;
}
export function IconoSede(props) {
  return <Icono de={HospitalIcon} {...props} />;
}
export function IconoBuscar(props) {
  return <Icono de={MagnifyingGlassIcon} {...props} />;
}
export function IconoCampana(props) {
  return <Icono de={BellIcon} {...props} />;
}
export function IconoMas(props) {
  return <Icono de={PlusIcon} {...props} />;
}
export function IconoLapiz(props) {
  return <Icono de={PencilSimpleIcon} {...props} />;
}
export function IconoPapelera(props) {
  return <Icono de={TrashIcon} {...props} />;
}
export function IconoChevronAbajo(props) {
  return <Icono de={CaretDownIcon} {...props} />;
}
export function IconoPersona(props) {
  return <Icono de={UserIcon} {...props} />;
}
export function IconoGrafica(props) {
  return <Icono de={ChartBarIcon} {...props} />;
}
export function IconoEngranaje(props) {
  return <Icono de={GearIcon} {...props} />;
}
export function IconoX(props) {
  return <Icono de={XIcon} {...props} />;
}
export function IconoCheck(props) {
  return <Icono de={CheckIcon} {...props} />;
}
export function IconoCarro(props) {
  return <Icono de={CarIcon} {...props} />;
}
export function IconoCorreo(props) {
  return <Icono de={EnvelopeIcon} {...props} />;
}
export function IconoCamara(props) {
  return <Icono de={CameraIcon} {...props} />;
}
export function IconoRotar(props) {
  return <Icono de={ArrowClockwiseIcon} {...props} />;
}
// Destello decorativo (avisos del landing).
export function IconoDestello(props) {
  return <Icono de={SparkleIcon} {...props} />;
}
// Menu del panel: inicio, pagina web, catalogos y datos.
export function IconoInicio(props) {
  return <Icono de={HouseIcon} {...props} />;
}
export function IconoGlobo(props) {
  return <Icono de={GlobeIcon} {...props} />;
}
export function IconoBaseDatos(props) {
  return <Icono de={DatabaseIcon} {...props} />;
}
export function IconoDescargar(props) {
  return <Icono de={DownloadSimpleIcon} {...props} />;
}
export function IconoCatalogo(props) {
  return <Icono de={StackIcon} {...props} />;
}
// Ajustar el encuadre de una foto.
export function IconoEncuadre(props) {
  return <Icono de={CropIcon} {...props} />;
}
export function IconoImagen(props) {
  return <Icono de={ImageIcon} {...props} />;
}
export function IconoDocumento(props) {
  return <Icono de={FileTextIcon} {...props} />;
}
export function IconoPeso(props) {
  return <Icono de={ScalesIcon} {...props} />;
}
// Menu de acciones de una tarjeta (tres puntos verticales): en negrita,
// en linea normal los puntos casi no se ven.
export function IconoPuntos(props) {
  return <Icono de={DotsThreeVerticalIcon} peso="bold" {...props} />;
}

// --- Especies (SelectorEspecieRaza) ---
export function IconoPerro(props) {
  return <Icono de={DogIcon} {...props} />;
}
export function IconoGato(props) {
  return <Icono de={CatIcon} {...props} />;
}
export function IconoAve(props) {
  return <Icono de={BirdIcon} {...props} />;
}

// --- Veterinaria y servicios ---
export function IconoPata(props) {
  return <Icono de={PawPrintIcon} {...props} />;
}
export function IconoJeringa(props) {
  return <Icono de={SyringeIcon} {...props} />;
}
export function IconoCirugia(props) {
  return <Icono de={ScissorsIcon} {...props} />;
}
export function IconoLaboratorio(props) {
  return <Icono de={FlaskIcon} {...props} />;
}
export function IconoEstetoscopio(props) {
  return <Icono de={StethoscopeIcon} {...props} />;
}
// Desparasitacion: el parasito.
export function IconoDesparasitacion(props) {
  return <Icono de={BugIcon} {...props} />;
}
export function IconoDienteDental(props) {
  return <Icono de={ToothIcon} {...props} />;
}
// Radiografia: el hueso (Phosphor no trae una placa de rayos X).
export function IconoRadiografia(props) {
  return <Icono de={BoneIcon} {...props} />;
}
// Recordatorio de medicacion.
export function IconoPastilla(props) {
  return <Icono de={PillIcon} {...props} />;
}

// --- Propios: Phosphor no trae la cinta de oncologia ni un endoscopio ---
// Dibujados a mano con el mismo trazo (1.5 sobre 24) y la misma interfaz;
// con peso "duotone" llevan el relleno suave, igual que los de Phosphor.
function IconoPropio({ className, peso, relleno, children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={peso === 'bold' ? 2.25 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {(peso === 'duotone' || peso === 'fill') && (
        <g fill="currentColor" stroke="none" opacity={peso === 'fill' ? 1 : 0.2}>
          {relleno}
        </g>
      )}
      {children}
    </svg>
  );
}

const LAZO_CINTA = 'M9 4a3 3 0 1 1 6 0c0 2.5-1.2 3.8-2 5.5-.3.6-.8.6-1 0C11.2 7.8 9 6.5 9 4Z';

export function IconoCintaOncologia({ className, peso = 'regular' }) {
  return (
    <IconoPropio className={className} peso={peso} relleno={<path d={LAZO_CINTA} />}>
      <path d={LAZO_CINTA} />
      <path d="M9.5 9.8 6 20M14.5 9.8 18 20" />
    </IconoPropio>
  );
}

export function IconoEndoscopia({ className, peso = 'regular' }) {
  return (
    <IconoPropio className={className} peso={peso} relleno={<circle cx="7" cy="6" r="2.3" />}>
      <circle cx="7" cy="6" r="2.3" />
      <path d="M8.6 7.6c3 3 5.6 4 8.4 6 1.3 1 2.2 2.4 2.2 3.9a2.5 2.5 0 0 1-5 0c0-1 .4-1.7 1-2.4" />
    </IconoPropio>
  );
}
