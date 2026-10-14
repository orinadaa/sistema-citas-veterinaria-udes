// hooks/useCuentaRegresiva.js
// Cuenta regresiva en segundos para "Reenviar codigo en 00:42".
import { useEffect, useState } from 'react';

export function useCuentaRegresiva(segundos = 60) {
  const [tiempo, setTiempo] = useState({ hasta: 0, ahora: 0 });
  const activa = tiempo.hasta > tiempo.ahora;

  useEffect(() => {
    if (!activa) return undefined;
    const intervalo = setInterval(() => setTiempo((actual) => ({ ...actual, ahora: Date.now() })), 500);
    return () => clearInterval(intervalo);
  }, [activa]);

  function iniciar() {
    const ahora = Date.now();
    setTiempo({ hasta: ahora + segundos * 1000, ahora });
  }

  const restantes = activa ? Math.ceil((tiempo.hasta - tiempo.ahora) / 1000) : 0;
  const texto = `${String(Math.floor(restantes / 60)).padStart(2, '0')}:${String(restantes % 60).padStart(2, '0')}`;

  return { restantes, texto, iniciar };
}
