// components/citas/NuevaMascotaRapida.jsx
// Alta rapida de una mascota mientras el administrador agenda una cita para un
// cliente (NuevaCitaModal): nombre, especie y raza.
import { useState } from 'react';
import { crearMascota } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Campo } from '../form/Campo';
import { SelectorEspecieRaza } from '../form/SelectorEspecieRaza';
import { Boton } from '../vetui';

export function NuevaMascotaRapida({ clienteId, onCreada, onCancelar }) {
  const { token } = useAuth();
  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState('');
  const [raza, setRaza] = useState('');
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');

  async function crear() {
    setError('');
    if (!nombre.trim() || !especie || !raza.trim()) {
      setError('Nombre, especie y raza de la mascota son obligatorios.');
      return;
    }
    setCreando(true);
    try {
      const { mascota } = await crearMascota({ nombre: nombre.trim(), especie, raza: raza.trim(), clienteId }, token);
      onCreada(mascota);
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
