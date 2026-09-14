import { useEffect, useState } from 'react';

// Estados posibles de la verificacion de conexion.
const ESTADOS = {
  CARGANDO: 'cargando',
  CONECTADO: 'conectado',
  ERROR: 'error',
};

function App() {
  const [estado, setEstado] = useState(ESTADOS.CARGANDO);
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    async function verificarConexion() {
      try {
        // Gracias al proxy en vite.config.js, esto se redirige al backend.
        const respuesta = await fetch('/api/health');

        if (!respuesta.ok) {
          const cuerpo = await respuesta.json();
          throw new Error(cuerpo.detalle || `El backend respondio con estado ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        setDetalle(datos);
        setEstado(ESTADOS.CONECTADO);
      } catch (error) {
        setDetalle({ mensaje: error.message });
        setEstado(ESTADOS.ERROR);
      }
    }

    verificarConexion();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8 space-y-4">
        <h1 className="text-xl font-semibold text-slate-800">
          Clinica Veterinaria UDES
        </h1>
        <p className="text-sm text-slate-500">
          Verificacion de entorno — Incremento 0
        </p>

        {estado === ESTADOS.CARGANDO && (
          <p className="text-slate-600">Verificando conexion con el backend...</p>
        )}

        {estado === ESTADOS.CONECTADO && (
          <div className="rounded-md bg-green-50 border border-green-200 p-4">
            <p className="text-green-800 font-medium">Backend y base de datos conectados</p>
            <p className="text-green-700 text-sm mt-1">
              Hora del servidor de base de datos: {String(detalle.horaServidorBD)}
            </p>
          </div>
        )}

        {estado === ESTADOS.ERROR && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-red-800 font-medium">No se pudo verificar la conexion</p>
            <p className="text-red-700 text-sm mt-1">{detalle?.mensaje}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;