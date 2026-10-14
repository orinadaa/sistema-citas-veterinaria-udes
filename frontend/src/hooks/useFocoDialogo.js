// hooks/useFocoDialogo.js
// Foco de un dialogo o panel superpuesto: al abrir entra en el, Tab y
// Shift+Tab no salen de el, y al cerrar vuelve al control que lo abrio.
import { useEffect } from 'react';

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function enfocables(contenedor) {
  return [...contenedor.querySelectorAll(ENFOCABLES)].filter((el) => el.offsetParent !== null || el === document.activeElement);
}

export function useFocoDialogo(abierto, ref, { enfocarAlAbrir = true } = {}) {
  useEffect(() => {
    const contenedor = ref.current;
    if (!abierto || !contenedor) return undefined;
    const anterior = document.activeElement;
    if (enfocarAlAbrir && !contenedor.contains(document.activeElement)) {
      (enfocables(contenedor)[0] ?? contenedor).focus({ preventScroll: true });
    }

    function alPresionarTecla(evento) {
      if (evento.key !== 'Tab') return;
      const lista = enfocables(contenedor);
      if (lista.length === 0) {
        evento.preventDefault();
        return;
      }
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      const activo = document.activeElement;
      // Un dialogo abierto encima (confirmacion, calendario) maneja su propio foco.
      if (!contenedor.contains(activo) && activo?.closest('[role="dialog"], [role="alertdialog"], [role="listbox"]')) return;
      if (evento.shiftKey && (activo === primero || !contenedor.contains(activo))) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && (activo === ultimo || !contenedor.contains(activo))) {
        evento.preventDefault();
        primero.focus();
      }
    }
    document.addEventListener('keydown', alPresionarTecla);
    return () => {
      document.removeEventListener('keydown', alPresionarTecla);
      if (anterior instanceof HTMLElement && document.contains(anterior)) anterior.focus({ preventScroll: true });
    };
  }, [abierto, ref, enfocarAlAbrir]);
}
