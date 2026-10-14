// controllers/logo.controller.js
// Logotipos de la clinica (Pagina web > Logotipos). Leerlos es publico: los
// usa toda la pagina.
const logoModel = require('../models/logo.model');
const { archivosLogos } = require('../middlewares/subirFoto.middleware');

// Donde se usa cada uno lo explica la pantalla (frontend PanelLogos.jsx).
const CLAVES = ['principal_blanco', 'principal_color', 'corto_color', 'corto_blanco', 'icono'];

function comoRespuesta(filas) {
  const porClave = new Map(filas.map((fila) => [fila.clave, fila.archivo_url]));
  return Object.fromEntries(CLAVES.map((clave) => [clave, porClave.get(clave) ?? null]));
}

// GET /api/logos — publico
async function listar(req, res, next) {
  try {
    return res.status(200).json({ logos: comoRespuesta(await logoModel.listar()) });
  } catch (error) {
    next(error);
  }
}

// POST /api/logos/:clave — superadministrador (multipart, campo "foto")
async function subir(req, res, next) {
  const archivoNuevo = req.file ? `${archivosLogos.rutaPublica}/${req.file.filename}` : null;
  try {
    const { clave } = req.params;
    if (!CLAVES.includes(clave)) {
      await archivosLogos.borrar(archivoNuevo);
      return res.status(404).json({ mensaje: 'Ese logotipo no existe.' });
    }
    if (!archivoNuevo) {
      return res.status(400).json({ mensaje: 'Adjunta una imagen PNG, WebP o JPG en el campo "foto".' });
    }
    const anterior = await logoModel.buscarPorClave(clave);
    await logoModel.guardar(clave, archivoNuevo);
    if (anterior) await archivosLogos.borrar(anterior.archivo_url);
    return res.status(200).json({ logos: comoRespuesta(await logoModel.listar()) });
  } catch (error) {
    await archivosLogos.borrar(archivoNuevo);
    next(error);
  }
}

// DELETE /api/logos/:clave — superadministrador. Vuelve al original.
async function restaurar(req, res, next) {
  try {
    const { clave } = req.params;
    if (!CLAVES.includes(clave)) {
      return res.status(404).json({ mensaje: 'Ese logotipo no existe.' });
    }
    const eliminado = await logoModel.eliminar(clave);
    if (eliminado) await archivosLogos.borrar(eliminado.archivo_url);
    return res.status(200).json({ logos: comoRespuesta(await logoModel.listar()) });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, subir, restaurar, CLAVES };
