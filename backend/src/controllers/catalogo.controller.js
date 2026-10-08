// controllers/catalogo.controller.js
// Catalogos gestionados por el superadministrador (/api/catalogos):
// categorias de servicio / especialidades, y especies y razas.
// No hay rutas para eliminar: todo se desactiva (activo = false).
const catalogoModel = require('../models/catalogo.model');

const COLORES = ['blue', 'amber', 'teal', 'purple', 'pink', 'cyan', 'orange'];
const ICONOS = ['perro', 'gato', 'ave', 'pata'];

// Quita espacios sobrantes; undefined si no vino, '' si vino vacio.
function limpiar(texto) {
  return texto === undefined || texto === null ? undefined : String(texto).trim().replace(/\s+/g, ' ');
}

function errorNombre(nombre, maximo, { obligatorio }) {
  if (nombre === undefined) return obligatorio ? 'El nombre es obligatorio.' : null;
  if (nombre === '') return 'El nombre es obligatorio.';
  if (nombre.length > maximo) return `El nombre no puede tener más de ${maximo} caracteres.`;
  return null;
}

function esDuplicado(error) {
  return error.code === '23505';
}

// ------------------------------------------------------------ categorias
// GET /api/catalogos/categorias
async function listarCategorias(req, res, next) {
  try {
    return res.status(200).json({ categorias: await catalogoModel.listarCategorias() });
  } catch (error) {
    next(error);
  }
}

// POST /api/catalogos/categorias
async function crearCategoria(req, res, next) {
  try {
    const nombre = limpiar(req.body.nombre);
    const { color } = req.body;
    const error = errorNombre(nombre, 40, { obligatorio: true });
    if (error) return res.status(400).json({ mensaje: error });
    if (!COLORES.includes(color)) {
      return res.status(400).json({ mensaje: `El color debe ser uno de: ${COLORES.join(', ')}.` });
    }
    const categoria = await catalogoModel.crearCategoria({ nombre, color });
    return res.status(201).json({ categoria });
  } catch (error) {
    if (esDuplicado(error)) return res.status(409).json({ mensaje: 'Ya existe una categoría con ese nombre.' });
    next(error);
  }
}

// PUT /api/catalogos/categorias/:id — nombre, color y/o activo
async function actualizarCategoria(req, res, next) {
  try {
    const nombre = limpiar(req.body.nombre);
    const { color, activo } = req.body;
    const error = errorNombre(nombre, 40, { obligatorio: false });
    if (error) return res.status(400).json({ mensaje: error });
    if (color !== undefined && !COLORES.includes(color)) {
      return res.status(400).json({ mensaje: `El color debe ser uno de: ${COLORES.join(', ')}.` });
    }
    if (activo !== undefined && typeof activo !== 'boolean') {
      return res.status(400).json({ mensaje: 'El estado debe ser verdadero o falso.' });
    }
    const categoria = await catalogoModel.actualizarCategoria(req.params.id, { nombre, color, activo });
    if (!categoria) return res.status(404).json({ mensaje: 'Categoría no encontrada.' });
    return res.status(200).json({ categoria });
  } catch (error) {
    if (esDuplicado(error)) return res.status(409).json({ mensaje: 'Ya existe una categoría con ese nombre.' });
    next(error);
  }
}

// ------------------------------------------------------------ especies y razas
// GET /api/catalogos/especies — publico: lo que ofrecen los formularios de mascota.
async function listarEspeciesActivas(req, res, next) {
  try {
    const especies = await catalogoModel.listarEspecies({ soloActivas: true });
    return res.status(200).json({
      especies: especies.map((e) => ({ id: e.id, nombre: e.nombre, icono: e.icono, razas: e.razas.map((r) => r.nombre) })),
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/catalogos/especies/admin
async function listarEspeciesAdmin(req, res, next) {
  try {
    return res.status(200).json({ especies: await catalogoModel.listarEspecies() });
  } catch (error) {
    next(error);
  }
}

// POST /api/catalogos/especies
async function crearEspecie(req, res, next) {
  try {
    const nombre = limpiar(req.body.nombre);
    const icono = req.body.icono ?? 'pata';
    const error = errorNombre(nombre, 50, { obligatorio: true });
    if (error) return res.status(400).json({ mensaje: error });
    if (!ICONOS.includes(icono)) {
      return res.status(400).json({ mensaje: `El icono debe ser uno de: ${ICONOS.join(', ')}.` });
    }
    const especie = await catalogoModel.crearEspecie({ nombre, icono });
    return res.status(201).json({ especie: { ...especie, razas: [], mascotas: 0 } });
  } catch (error) {
    if (esDuplicado(error)) return res.status(409).json({ mensaje: 'Ya existe una especie con ese nombre.' });
    next(error);
  }
}

// PUT /api/catalogos/especies/:id — nombre, icono y/o activo
async function actualizarEspecie(req, res, next) {
  try {
    const nombre = limpiar(req.body.nombre);
    const { icono, activo } = req.body;
    const error = errorNombre(nombre, 50, { obligatorio: false });
    if (error) return res.status(400).json({ mensaje: error });
    if (icono !== undefined && !ICONOS.includes(icono)) {
      return res.status(400).json({ mensaje: `El icono debe ser uno de: ${ICONOS.join(', ')}.` });
    }
    if (activo !== undefined && typeof activo !== 'boolean') {
      return res.status(400).json({ mensaje: 'El estado debe ser verdadero o falso.' });
    }
    const actual = await catalogoModel.buscarEspecie(req.params.id);
    if (!actual) return res.status(404).json({ mensaje: 'Especie no encontrada.' });
    const especie = await catalogoModel.actualizarEspecie(actual, { nombre, icono, activo });
    return res.status(200).json({ especie });
  } catch (error) {
    if (esDuplicado(error)) return res.status(409).json({ mensaje: 'Ya existe una especie con ese nombre.' });
    next(error);
  }
}

// POST /api/catalogos/especies/:id/razas
async function crearRaza(req, res, next) {
  try {
    const nombre = limpiar(req.body.nombre);
    const error = errorNombre(nombre, 80, { obligatorio: true });
    if (error) return res.status(400).json({ mensaje: error });
    const especie = await catalogoModel.buscarEspecie(req.params.id);
    if (!especie) return res.status(404).json({ mensaje: 'Especie no encontrada.' });
    const raza = await catalogoModel.crearRaza(especie.id, nombre);
    return res.status(201).json({ raza: { ...raza, mascotas: 0 } });
  } catch (error) {
    if (esDuplicado(error)) return res.status(409).json({ mensaje: 'Esa raza ya existe en esta especie.' });
    next(error);
  }
}

// PUT /api/catalogos/razas/:id — nombre y/o activo
async function actualizarRaza(req, res, next) {
  try {
    const nombre = limpiar(req.body.nombre);
    const { activo } = req.body;
    const error = errorNombre(nombre, 80, { obligatorio: false });
    if (error) return res.status(400).json({ mensaje: error });
    if (activo !== undefined && typeof activo !== 'boolean') {
      return res.status(400).json({ mensaje: 'El estado debe ser verdadero o falso.' });
    }
    const actual = await catalogoModel.buscarRaza(req.params.id);
    if (!actual) return res.status(404).json({ mensaje: 'Raza no encontrada.' });
    const raza = await catalogoModel.actualizarRaza(actual, { nombre, activo });
    return res.status(200).json({ raza });
  } catch (error) {
    if (esDuplicado(error)) return res.status(409).json({ mensaje: 'Esa raza ya existe en esta especie.' });
    next(error);
  }
}

module.exports = {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  listarEspeciesActivas,
  listarEspeciesAdmin,
  crearEspecie,
  actualizarEspecie,
  crearRaza,
  actualizarRaza,
};
