// controllers/servicio.controller.js
// RF-11: catalogo publico de servicios veterinarios; CRUD exclusivo del
// administrador.
const servicioModel = require('../models/servicio.model');
const categoriaServicioModel = require('../models/categoriaServicio.model');
const { fotosServicios } = require('../middlewares/subirFoto.middleware');

const LARGO_MAXIMO_DESCRIPCION_FOTO = 200;
const PATRON_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Encuadre de la foto: porcentaje entero 0-100; undefined si no viene y
// null si es invalido.
function leerFoco(valor) {
  if (valor === undefined) return undefined;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 && numero <= 100 ? Math.round(numero) : null;
}

function precioValido(precio) {
  return Number.isInteger(precio) && precio >= 0;
}

// Duracion estimada (informativa, ver database/incremento_4b_agendamiento.sql):
// minutos enteros entre 5 y 480 (8 horas).
function duracionValida(duracion) {
  return Number.isInteger(duracion) && duracion >= 5 && duracion <= 480;
}
const MENSAJE_DURACION = 'La duración debe ser un número entero de minutos entre 5 y 480.';

// GET /api/servicios — publico, solo activos
async function listar(req, res, next) {
  try {
    const servicios = await servicioModel.listarTodos();
    return res.status(200).json({ servicios });
  } catch (error) {
    next(error);
  }
}

// GET /api/servicios/admin — solo administrador, incluye inactivos
async function listarAdmin(req, res, next) {
  try {
    const servicios = await servicioModel.listarTodosAdmin();
    return res.status(200).json({ servicios });
  } catch (error) {
    next(error);
  }
}

// GET /api/categorias-servicio — publico, para poblar selects
async function listarCategorias(req, res, next) {
  try {
    const categorias = await categoriaServicioModel.listarTodas();
    return res.status(200).json({ categorias });
  } catch (error) {
    next(error);
  }
}

// POST /api/servicios — solo administrador
async function crear(req, res, next) {
  try {
    const { nombre, descripcion, categoriaId, precio, duracionMinutos } = req.body;
    if (!nombre) {
      return res.status(400).json({ mensaje: 'El nombre del servicio es obligatorio.' });
    }
    if (!categoriaId) {
      return res.status(400).json({ mensaje: 'La categoría del servicio es obligatoria.' });
    }
    if (precio !== undefined && !precioValido(precio)) {
      return res.status(400).json({ mensaje: 'El precio debe ser un número entero mayor o igual a 0.' });
    }
    if (duracionMinutos !== undefined && !duracionValida(duracionMinutos)) {
      return res.status(400).json({ mensaje: MENSAJE_DURACION });
    }
    if (!(await categoriaServicioModel.existe(categoriaId))) {
      return res.status(400).json({ mensaje: 'La categoría indicada no existe.' });
    }

    const servicio = await servicioModel.crear({ nombre, descripcion, categoriaId, precio, duracionMinutos });
    return res.status(201).json({ servicio });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Ya existe un servicio con ese nombre.' });
    }
    next(error);
  }
}

// PUT /api/servicios/:id — solo administrador
async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, categoriaId, precio, duracionMinutos, activo } = req.body;

    if (precio !== undefined && !precioValido(precio)) {
      return res.status(400).json({ mensaje: 'El precio debe ser un número entero mayor o igual a 0.' });
    }
    if (duracionMinutos !== undefined && !duracionValida(duracionMinutos)) {
      return res.status(400).json({ mensaje: MENSAJE_DURACION });
    }
    if (categoriaId && !(await categoriaServicioModel.existe(categoriaId))) {
      return res.status(400).json({ mensaje: 'La categoría indicada no existe.' });
    }

    // Datos de la foto (la imagen en si se sube por POST /:id/foto).
    let fotoDescripcion;
    if (req.body.fotoDescripcion !== undefined) {
      fotoDescripcion = typeof req.body.fotoDescripcion === 'string' ? req.body.fotoDescripcion.trim() : '';
      if (fotoDescripcion.length > LARGO_MAXIMO_DESCRIPCION_FOTO) {
        return res
          .status(400)
          .json({ mensaje: `La descripción de la foto no puede pasar de ${LARGO_MAXIMO_DESCRIPCION_FOTO} caracteres.` });
      }
    }
    const fotoFocoX = leerFoco(req.body.fotoFocoX);
    const fotoFocoY = leerFoco(req.body.fotoFocoY);
    if (fotoFocoX === null || fotoFocoY === null) {
      return res.status(400).json({ mensaje: 'El encuadre de la foto debe ser un porcentaje entre 0 y 100.' });
    }

    const servicio = await servicioModel.actualizar(id, {
      nombre,
      descripcion,
      categoriaId,
      precio,
      duracionMinutos,
      activo,
      fotoDescripcion,
      fotoFocoX,
      fotoFocoY,
    });
    if (!servicio) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    }

    return res.status(200).json({ servicio });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Ya existe un servicio con ese nombre.' });
    }
    next(error);
  }
}

// POST /api/servicios/:id/foto — solo administrador (multipart: "foto" y,
// opcional, "fondoClaro"). Es la foto del servicio en la pagina publica.
async function subirFoto(req, res, next) {
  const archivoNuevo = req.file ? `${fotosServicios.rutaPublica}/${req.file.filename}` : null;
  try {
    if (!archivoNuevo) {
      return res.status(400).json({ mensaje: 'Adjunta una imagen JPG o PNG en el campo "foto".' });
    }
    const { id } = req.params;
    const anterior = PATRON_UUID.test(id)
      ? await servicioModel.actualizarFoto(id, { fotoUrl: archivoNuevo, fondoClaro: req.body.fondoClaro !== 'false' })
      : undefined;
    if (anterior === undefined) {
      await fotosServicios.borrar(archivoNuevo);
      return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    }
    await fotosServicios.borrar(anterior);
    const servicio = await servicioModel.buscarPorId(id);
    return res.status(200).json({ servicio });
  } catch (error) {
    await fotosServicios.borrar(archivoNuevo);
    next(error);
  }
}

// DELETE /api/servicios/:id/foto — solo administrador. Sin foto, el
// servicio deja de mostrarse en el slider del inicio.
async function quitarFoto(req, res, next) {
  try {
    const { id } = req.params;
    const anterior = PATRON_UUID.test(id) ? await servicioModel.actualizarFoto(id, { fotoUrl: null }) : undefined;
    if (anterior === undefined) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    }
    await fotosServicios.borrar(anterior);
    const servicio = await servicioModel.buscarPorId(id);
    return res.status(200).json({ servicio });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, listarAdmin, listarCategorias, crear, actualizar, subirFoto, quitarFoto };
