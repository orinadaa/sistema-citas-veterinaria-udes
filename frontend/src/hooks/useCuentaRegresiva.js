// hooks/useCuentaRegresiva.js
// Cuenta regresiva en segundos para "Reenviar codigo en 00:42". El servidor
// no reenvia un codigo antes de un minuto: el contador le dice a la persona
// cuanto falta en vez de dejarla pulsar un boton que no haria nada.
// iniciar() arranca (o reinicia) la cuenta; `restantes` llega a 0 al terminar
// y `texto` la da en formato mm:ss.
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
