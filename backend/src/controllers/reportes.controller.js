// controllers/reportes.controller.js
// Reportes agregados del panel administrativo, solo lectura. Vista
// multisede (sedeId opcional). Por defecto el rango son las ultimas 8
// semanas si no se indica desde/hasta.
const reportesModel = require('../models/reportes.model');

function rangoPorDefecto() {
  const hasta = new Date();
  hasta.setDate(hasta.getDate() + 1);
  const desde = new Date();
  desde.setDate(desde.getDate() - 56); // 8 semanas
  return { desde, hasta };
}

function parsearFecha(valor) {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

// GET /api/administracion/reportes?sedeId=&desde=&hasta=
async function obtenerReporte(req, res, next) {
  try {
    // El administrador de sede ve solo su sede (se ignora el filtro que
    // envie); el superadministrador puede ver todas o filtrar por una.
    const sedeId = req.usuario.rol === 'superadministrador' ? req.query.sedeId : req.usuario.sedeId;
    const { desde: desdeDefecto, hasta: hastaDefecto } = rangoPorDefecto();
    const desde = parsearFecha(req.query.desde) || desdeDefecto;
    const hasta = parsearFecha(req.query.hasta) || hastaDefecto;

    if (desde >= hasta) {
      return res.status(400).json({ mensaje: 'La fecha "desde" debe ser anterior a "hasta".' });
    }

    const [kpis, citasPorSemana, rankingServicios, citasPorSede, estadoCitas, ultimasCitas] = await Promise.all([
      reportesModel.obtenerKpis(sedeId),
      reportesModel.citasPorSemana(desde, hasta),
      reportesModel.rankingServicios(sedeId, desde, hasta),
      reportesModel.citasPorSede(desde, hasta),
      reportesModel.estadoCitas(sedeId, desde, hasta),
      reportesModel.ultimasCitas(sedeId, desde, hasta),
    ]);

    return res.status(200).json({
      rango: { desde, hasta },
      kpis,
      citasPorSemana,
      rankingServicios,
      citasPorSede,
      estadoCitas,
      ultimasCitas,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { obtenerReporte };
