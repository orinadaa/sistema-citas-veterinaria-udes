// components/admin/PanelPaginaWeb.jsx
// Pagina web (superadministrador): lo que ve cualquier visitante en la pagina
// publica. Pestañas para no tener que bajar hasta la
// galeria: Galeria del inicio, Informacion de la clinica (RF-23) y Logotipos.
import { useState } from 'react';
import { PageHeader } from '../ui/PageHeader';
import { Tabs } from '../ui/Tabs';
import { PanelGaleria } from './PanelGaleria';
import { PanelInfoClinica } from './PanelInfoClinica';
import { PanelLogos } from './PanelLogos';
import { IconoImagen, IconoPata, IconoSede } from '../icons';

const TABS = [
  { id: 'galeria', label: 'Galería del inicio', icon: IconoImagen },
  { id: 'clinica', label: 'Información de la clínica', icon: IconoSede },
  { id: 'logos', label: 'Logotipos', icon: IconoPata },
];

export function PanelPaginaWeb() {
  const [pestana, setPestana] = useState('galeria');
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Página web" subtitle="Lo que ve cualquier visitante en la página pública de la clínica." />
      <Tabs sobreVidrio items={TABS} activeItem={pestana} onChange={setPestana} />
      {pestana === 'galeria' && <PanelGaleria />}
      {pestana === 'clinica' && <PanelInfoClinica />}
      {pestana === 'logos' && <PanelLogos />}
    </div>
  );
}
