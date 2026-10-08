// controllers/galeria.controller.js
// Galeria del inicio: las fotos que rotan en el Hero del landing.
// Lectura publica; el administrador las sube (archivo, nunca un enlace),
// describe, encuadra, ordena, oculta y elimina desde Configuracion.
const galeriaModel = require('../models/galeria.model');
const { fotosGaleria } = require('../middlewares/subirFoto.middleware');

// Tope de fotos: el Hero las rota de a una cada 3 segundos, con mas la
// vuelta completa se hace eterna.
const MAXIMO_FOTOS = 12;
const LARGO_MAXIMO_DESCRIPCION = 200;
const PATRON_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function limpiarDescripcion(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

// Porcentaje entero 0-100; undefined si no viene y null si es invalido.
function leerFoco(valor) {
  if (valor === undefined) return undefined;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 && numero <= 100 ? Math.round(numero) : null;
}

// GET /api/galeria — publico, solo visibles
async function listar(req, res, next) {
  try {
    const fotos = await galeriaModel.listarVisibles();
    return res.status(200).json({ fotos });
  } catch (error) {
    next(error);
  }
}

// GET /api/galeria/admin — solo administrador, incluye ocultas
async function listarAdmin(req, res, next) {
  try {
    const fotos = await galeriaModel.listarTodas();
    return res.status(200).json({ fotos, maximo: MAXIMO_FOTOS });
  } catch (error) {
    next(error);
  }
}

// POST /api/galeria — solo administrador (multipart: "foto" + "descripcion")
async function crear(req, res, next) {
  const archivoNuevo = req.file ? `${fotosGaleria.rutaPublica}/${req.file.filename}` : null;
  try {
    if (!archivoNuevo) {
      return res.status(400).json({ mensaje: 'Adjunta una imagen JPG o PNG en el campo "foto".' });
    }
    const descripcion = limpiarDescripcion(req.body.descripcion);
    let rechazo = null;
    if (!descripcion) {
      rechazo = 'Describe brevemente la foto (qué se ve en ella).';
    } else if (descripcion.length > LARGO_MAXIMO_DESCRIPCION) {
      rechazo = `La descripción no puede pasar de ${LARGO_MAXIMO_DESCRIPCION} caracteres.`;
    } else if ((await galeriaModel.contar()) >= MAXIMO_FOTOS) {
      rechazo = `La galería admite máximo ${MAXIMO_FOTOS} fotos. Elimina una para subir otra.`;
    }
    if (rechazo) {
      await fotosGaleria.borrar(archivoNuevo);
      return res.status(400).json({ mensaje: rechazo });
    }

    const foto = await galeriaModel.crear({ fotoUrl: archivoNuevo, descripcion });
    return res.status(201).json({ foto });
  } catch (error) {
    await fotosGaleria.borrar(archivoNuevo);
    next(error);
  }
}

// PUT /api/galeria/:id — solo administrador (descripcion, encuadre, visible)
async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    if (!PATRON_UUID.test(id)) return res.status(404).json({ mensaje: 'Foto no encontrada.' });

    const { activo } = req.body;
    let descripcion;
    if (req.body.descripcion !== undefined) {
      descripcion = limpiarDescripcion(req.body.descripcion);
      if (!descripcion) return res.status(400).json({ mensaje: 'La descripción de la foto no puede quedar vacía.' });
      if (descripcion.length > LARGO_MAXIMO_DESCRIPCION) {
        return res.status(400).json({ mensaje: `La descripción no puede pasar de ${LARGO_MAXIMO_DESCRIPCION} caracteres.` });
      }
    }
    const focoX = leerFoco(req.body.focoX);
    const focoY = leerFoco(req.body.focoY);
    if (focoX === null || focoY === null) {
      return res.status(400).json({ mensaje: 'El encuadre debe ser un porcentaje entre 0 y 100.' });
    }
    if (activo !== undefined && typeof activo !== 'boolean') {
      return res.status(400).json({ mensaje: 'El campo "activo" debe ser verdadero o falso.' });
    }

    const foto = await galeriaModel.actualizar(id, { descripcion, focoX, focoY, activo });
    if (!foto) return res.status(404).json({ mensaje: 'Foto no encontrada.' });
    return res.status(200).json({ foto });
  } catch (error) {
    next(error);
  }
}

// PUT /api/galeria/orden — solo administrador ({ ids: [...] } en el nuevo orden)
async function reordenar(req, res, next) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => !PATRON_UUID.test(id))) {
      return res.status(400).json({ mensaje: 'Envía la lista de fotos en su nuevo orden.' });
    }
    await galeriaModel.reordenar(ids);
    const fotos = await galeriaModel.listarTodas();
    return res.status(200).json({ fotos });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/galeria/:id — solo administrador (borra tambien el archivo)
async function eliminar(req, res, next) {
  try {
    const { id } = req.params;
    if (!PATRON_UUID.test(id)) return res.status(404).json({ mensaje: 'Foto no encontrada.' });

    const foto = await galeriaModel.eliminar(id);
    if (!foto) return res.status(404).json({ mensaje: 'Foto no encontrada.' });
    await fotosGaleria.borrar(foto.foto_url);
    return res.status(200).json({ mensaje: 'Foto eliminada de la galería.' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, listarAdmin, crear, actualizar, reordenar, eliminar, MAXIMO_FOTOS };
