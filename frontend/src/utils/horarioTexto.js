// utils/horarioTexto.js
// Convierte el horario real de una sede (horario_atencion, RF-13) en
// lineas de texto legibles, agrupando dias consecutivos con el mismo
// rango (ej. "Lunes a viernes: 08:00 - 17:00"). Usado por el landing
// publico (Sedes y Horarios) para no mostrar un horario escrito a mano.

// Orden de despliegue Lunes..Domingo (la BD guarda 0=domingo..6=sabado).
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];
const NOMBRE_DIA = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };

export function agruparHorario(horario) {
  const porDia = new Map(horario.map((h) => [h.dia_semana, h]));
  const grupos = [];
  let actual = null;

  ORDEN_DIAS.forEach((dia) => {
    const entrada = porDia.get(dia);
    if (!entrada) {
      actual = null;
      return;
    }
    const rango = `${entrada.hora_inicio.slice(0, 5)} – ${entrada.hora_fin.slice(0, 5)}`;
    if (actual && actual.rango === rango) {
      actual.diasNombres.push(NOMBRE_DIA[dia]);
    } else {
      actual = { rango, diasNombres: [NOMBRE_DIA[dia]] };
      grupos.push(actual);
    }
  });

  return grupos.map((g) => {
    const etiqueta = g.diasNombres.length > 1 ? `${g.diasNombres[0]} a ${g.diasNombres[g.diasNombres.length - 1]}` : g.diasNombres[0];
    return `${etiqueta}: ${g.rango}`;
  });
}

// Detalle dia por dia (para la seccion "Horarios de atencion"): una
// linea por cada dia de la semana, "Cerrado" si no hay horario ese dia.
export function detalleHorarioPorDia(horario) {
  const porDia = new Map(horario.map((h) => [h.dia_semana, h]));
  return ORDEN_DIAS.map((dia) => {
    const entrada = porDia.get(dia);
    return {
      dia: NOMBRE_DIA[dia],
      texto: entrada ? `${entrada.hora_inicio.slice(0, 5)} – ${entrada.hora_fin.slice(0, 5)}` : 'Cerrado',
    };
  });
}
