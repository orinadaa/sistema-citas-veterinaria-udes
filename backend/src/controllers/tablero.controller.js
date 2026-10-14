// controllers/tablero.controller.js
// Paneles de inicio. Cada rol ve el suyo.
const tableroModel = require('../models/tablero.model');
const sedeModel = require('../models/sede.model');

function listaCorta(nombres) {
  return nombres.length <= 3 ? nombres.join(', ') : `${nombres.slice(0, 3).join(', ')} y ${nombres.length - 3} más`;
}

// GET /api/administracion/tablero
async function obtenerTableroSede(req, res, next) {
  try {
    const sedeId = req.usuario.sedeId;
    if (!sedeId) {
      return res.status(400).json({ mensaje: 'Tu cuenta no tiene una sede asignada.' });
    }
    const [sede, resumen] = await Promise.all([sedeModel.buscarPorId(sedeId), tableroModel.resumenSede(sedeId)]);
    if (!sede) {
      return res.status(404).json({ mensaje: 'La sede de tu cuenta no existe.' });
    }

    const avisos = [];
    const porReagendar = resumen.indicadores.por_reagendar || 0;
    if (porReagendar > 0) {
      avisos.push({
        tipo: 'citas',
        modulo: 'citas',
        titulo: porReagendar === 1 ? '1 cita espera que el cliente la reagende' : `${porReagendar} citas esperan que sus clientes las reagenden`,
        detalle: 'Quedaron fuera de la agenda por un cambio de horario o un bloqueo. Si un cliente llama, puedes reagendar su cita desde Citas.',
      });
    }
    if (resumen.diasAbiertos === 0) {
      avisos.push({
        tipo: 'horario',
        modulo: 'horarios',
        titulo: 'La sede no tiene horario de atención',
        detalle: 'Sin horario no se ofrece ninguna hora para agendar.',
      });
    }
    if (resumen.medicosSinServicios.length > 0) {
      avisos.push({
        tipo: 'medicos',
        modulo: 'medicos',
        titulo: `${resumen.medicosSinServicios.length} médico(s) sin servicios asignados`,
        detalle: `Nadie puede agendarles: ${listaCorta(resumen.medicosSinServicios.map((m) => m.nombre_completo))}.`,
      });
    }
    if (resumen.serviciosSinMedico.length > 0) {
      avisos.push({
        tipo: 'servicios',
        modulo: 'medicos',
        titulo: `${resumen.serviciosSinMedico.length} servicio(s) sin médico en esta sede`,
        detalle: `No se pueden agendar aquí: ${listaCorta(resumen.serviciosSinMedico.map((s) => s.nombre))}.`,
      });
    }

    return res.status(200).json({
      sede: { id: sede.id, nombre: sede.nombre, ciudad: sede.ciudad },
      citasHoy: resumen.citasHoy,
      indicadores: resumen.indicadores,
      porDia: resumen.porDia,
      avisos,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/administracion/sistema
async function obtenerResumenSistema(req, res, next) {
  try {
    const resumen = await tableroModel.resumenSistema();

    const avisos = [];
    resumen.sedes
      .filter((s) => s.activo)
      .forEach((s) => {
        if (s.administradores === 0) {
          avisos.push({ tipo: 'usuarios', modulo: 'usuarios', titulo: `${s.nombre} no tiene administrador`, detalle: 'Crea una cuenta de administrador y asígnale esta sede.' });
        }
        if (s.dias_abiertos === 0) {
          avisos.push({ tipo: 'horario', modulo: 'sedes', titulo: `${s.nombre} no tiene horario de atención`, detalle: 'Sin horario no se ofrece ninguna hora para agendar.' });
        }
        if (s.medicos === 0) {
          avisos.push({ tipo: 'medicos', modulo: 'usuarios', titulo: `${s.nombre} no tiene médicos activos`, detalle: 'Nadie puede atender citas en esta sede.' });
        }
      });
    if (resumen.servicios.sin_medico > 0) {
      avisos.push({ tipo: 'servicios', modulo: 'servicios', titulo: `${resumen.servicios.sin_medico} servicio(s) sin ningún médico`, detalle: 'Aparecen en la página web, pero no se pueden agendar en ninguna sede.' });
    }
    if (resumen.servicios.sin_foto > 0) {
      avisos.push({ tipo: 'web', modulo: 'servicios', titulo: `${resumen.servicios.sin_foto} servicio(s) sin foto`, detalle: 'En la página web se muestran con una imagen genérica.' });
    }
    if (resumen.galeria.visibles === 0) {
      avisos.push({ tipo: 'web', modulo: 'web', titulo: 'La galería de la portada está vacía', detalle: 'La página web muestra las fotos de respaldo.' });
    }

    const cuentas = { superadministrador: 0, administrador: 0, veterinario: 0, cliente: 0, inactivas: 0 };
    resumen.cuentas.forEach((fila) => {
      cuentas[fila.rol] = fila.activas;
      cuentas.inactivas += fila.inactivas;
    });

    return res.status(200).json({ sedes: resumen.sedes, cuentas, servicios: resumen.servicios, galeria: resumen.galeria, avisos });
  } catch (error) {
    next(error);
  }
}

module.exports = { obtenerTableroSede, obtenerResumenSistema };
