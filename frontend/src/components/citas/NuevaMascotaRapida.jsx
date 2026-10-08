// components/citas/NuevaMascotaRapida.jsx
// Alta rapida de una mascota mientras el administrador agenda una cita
// para un cliente (NuevaCitaModal): nombre, especie, raza y los campos
// personalizados OBLIGATORIOS; el resto del perfil se completa despues en
// la ficha del paciente. Crea la mascota a nombre del cliente indicado y
// avisa con onCreada(mascota) para dejarla elegida.
// (Reemplaza al alta que traia el antiguo MascotaSelector.)
import { useState } from 'react';
import { crearMascota } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useCamposAdicionales } from '../../hooks/useCamposAdicionales';
import { Campo } from '../form/Campo';
import { SelectorEspecieRaza } from '../form/SelectorEspecieRaza';
import { CamposAdicionales } from '../form/CamposAdicionales';
import { Boton } from '../vetui';

export function NuevaMascotaRapida({ clienteId, onCreada, onCancelar }) {
  const { token } = useAuth();
  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState('');
  const [raza, setRaza] = useState('');
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');
  const campos = useCamposAdicionales('mascota');

  async function crear() {
    setError('');
    if (!nombre.trim() || !especie || !raza.trim()) {
      setError('Nombre, especie y raza de la mascota son obligatorios.');
      return;
    }
    const faltaAdicional = campos.errorObligatorios();
    if (faltaAdicional) {
      setError(faltaAdicional);
      return;
    }

    setCreando(true);
    try {
      const { mascota } = await crearMascota(
        { nombre: nombre.trim(), especie, raza: raza.trim(), clienteId, camposAdicionales: campos.valoresParaEnviar() },
        token
      );
      // La mascota ya existe: si un adjunto falla, se avisa pero se sigue.
      const avisoArchivos = await campos.guardarArchivos(mascota.id);
      onCreada(mascota, avisoArchivos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-tarjeta bg-white p-4 ring-1 ring-slate-200">
      <p className="text-sm font-semibold text-brand-navy">Nueva mascota</p>
      <Campo id="nueva-mascota-nombre" label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      <SelectorEspecieRaza
        idPrefijo="nueva-mascota"
        className="flex flex-col gap-3"
        especie={especie}
        raza={raza}
        onChange={(valor) => {
          setEspecie(valor.especie);
          setRaza(valor.raza);
        }}
      />
      <CamposAdicionales campos={campos} idPrefijo="nueva-mascota-extra" soloObligatorios titulo="Datos obligatorios adicionales" />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        <Boton variante="contorno" tamano="sm" onClick={onCancelar} disabled={creando}>
          Cancelar
        </Boton>
        <Boton tamano="sm" onClick={crear} disabled={creando}>
          {creando ? 'Agregando...' : 'Agregar mascota'}
        </Boton>
      </div>
    </div>
  );
}
