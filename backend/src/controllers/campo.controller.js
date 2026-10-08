// controllers/campo.controller.js
// Campos personalizados administrables (Configuracion > Campos): el
// administrador agrega campos a un formulario sin programar.
// Regla de negocio: un campo nunca se elimina, solo se desactiva; por eso
// aca no existe un "eliminar", y la clave y el tipo no se pueden cambiar.
const definicionCampoModel = require('../models/definicionCampo.model');
const {
  ENTIDADES,
  TIPOS,
  generarClave,
  claveUnica,
  crearOpciones,
  fusionarOpciones,
} = require('../utils/camposAdicionales');

const PATRON_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LARGO_ETIQUETA = 80;
const LARGO_AYUDA = 160;

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

// GET /api/campos?entidad=mascota — cualquier usuario con sesion: los
// formularios necesitan saber que campos pedir. Devuelve activos e
// inactivos (los inactivos se usan para mostrar, en solo lectura, valores
// de registros antiguos); el formulario solo pide los activos.
async function listar(req, res, next) {
  try {
    const { entidad } = req.query;
    if (!ENTIDADES[entidad]) {
      return res.status(400).json({ mensaje: 'Indica una entidad válida.' });
    }
    const campos = (await definicionCampoModel.listar(entidad)) || [];
    return res.status(200).json({ campos });
  } catch (error) {
    next(error);
  }
}

// GET /api/campos/entidades — solo administrador: a que formularios se
// les pueden agregar campos y de que tipos.
function listarEntidades(req, res) {
  return res.status(200).json({
    entidades: Object.entries(ENTIDADES).map(([id, nombre]) => ({ id, nombre })),
    tipos: TIPOS,
  });
}

// POST /api/campos — solo administrador
async function crear(req, res, next) {
  try {
    const { entidad, tipo, requerido } = req.body;
    const etiqueta = texto(req.body.etiqueta);
    const ayuda = texto(req.body.ayuda);

    if (!ENTIDADES[entidad]) return res.status(400).json({ mensaje: 'Indica una entidad válida.' });
    if (!etiqueta) return res.status(400).json({ mensaje: 'El nombre del campo es obligatorio.' });
    if (etiqueta.length > LARGO_ETIQUETA) {
      return res.status(400).json({ mensaje: `El nombre del campo no puede pasar de ${LARGO_ETIQUETA} caracteres.` });
    }
    if (ayuda.length > LARGO_AYUDA) {
      return res.status(400).json({ mensaje: `El texto de ayuda no puede pasar de ${LARGO_AYUDA} caracteres.` });
    }
    if (!TIPOS.includes(tipo)) return res.status(400).json({ mensaje: 'Elige un tipo de campo válido.' });

    let opciones = [];
    if (tipo === 'seleccion') {
      const resultado = crearOpciones(req.body.opciones);
      if (resultado.error) return res.status(400).json({ mensaje: resultado.error });
      if (resultado.opciones.length < 2) {
        return res.status(400).json({ mensaje: 'Un campo de selección necesita al menos dos opciones.' });
      }
      opciones = resultado.opciones;
    }

    const existentes = (await definicionCampoModel.listar(entidad)) || [];
    if (existentes.some((c) => c.etiqueta.toLowerCase() === etiqueta.toLowerCase())) {
      return res.status(409).json({ mensaje: 'Ya existe un campo con ese nombre. Si estaba desactivado, reactívalo.' });
    }
    const clave = claveUnica(generarClave(etiqueta), existentes.map((c) => c.clave));

    const campo = await definicionCampoModel.crear({ entidad, clave, etiqueta, tipo, ayuda, opciones, requerido });
    return res.status(201).json({ campo });
  } catch (error) {
    next(error);
  }
}

// PUT /api/campos/:id — solo administrador. Cambia nombre, ayuda,
// obligatoriedad, opciones (agregar / renombrar / desactivar) y activo.
async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    if (!PATRON_UUID.test(id)) return res.status(404).json({ mensaje: 'Campo no encontrado.' });
    const actual = await definicionCampoModel.buscarPorId(id);
    if (!actual) return res.status(404).json({ mensaje: 'Campo no encontrado.' });

    if (req.body.tipo !== undefined && req.body.tipo !== actual.tipo) {
      return res.status(400).json({
        mensaje: 'El tipo de un campo no se puede cambiar: desactívalo y crea uno nuevo con el tipo correcto.',
      });
    }
    const { requerido, activo } = req.body;
    if (requerido !== undefined && typeof requerido !== 'boolean') {
      return res.status(400).json({ mensaje: 'El campo "requerido" debe ser verdadero o falso.' });
    }
    if (activo !== undefined && typeof activo !== 'boolean') {
      return res.status(400).json({ mensaje: 'El campo "activo" debe ser verdadero o falso.' });
    }

    let etiqueta;
    if (req.body.etiqueta !== undefined) {
      etiqueta = texto(req.body.etiqueta);
      if (!etiqueta) return res.status(400).json({ mensaje: 'El nombre del campo no puede quedar vacío.' });
      if (etiqueta.length > LARGO_ETIQUETA) {
        return res.status(400).json({ mensaje: `El nombre del campo no puede pasar de ${LARGO_ETIQUETA} caracteres.` });
      }
      const otros = ((await definicionCampoModel.listar(actual.entidad)) || []).filter((c) => c.id !== id);
      if (otros.some((c) => c.etiqueta.toLowerCase() === etiqueta.toLowerCase())) {
        return res.status(409).json({ mensaje: 'Ya existe otro campo con ese nombre.' });
      }
    }
    let ayuda;
    if (req.body.ayuda !== undefined) {
      ayuda = texto(req.body.ayuda);
      if (ayuda.length > LARGO_AYUDA) {
        return res.status(400).json({ mensaje: `El texto de ayuda no puede pasar de ${LARGO_AYUDA} caracteres.` });
      }
    }

    let opciones;
    if (req.body.opciones !== undefined && actual.tipo === 'seleccion') {
      const resultado = fusionarOpciones(actual.opciones, req.body.opciones);
      if (resultado.error) return res.status(400).json({ mensaje: resultado.error });
      if (resultado.opciones.filter((o) => o.activo).length < 2) {
        return res.status(400).json({ mensaje: 'Deben quedar al menos dos opciones activas.' });
      }
      opciones = resultado.opciones;
    }

    const campo = await definicionCampoModel.actualizar(id, { etiqueta, ayuda, opciones, requerido, activo });
    return res.status(200).json({ campo });
  } catch (error) {
    next(error);
  }
}

// PUT /api/campos/orden — solo administrador ({ entidad, ids } en el nuevo orden)
async function reordenar(req, res, next) {
  try {
    const { entidad, ids } = req.body;
    if (!ENTIDADES[entidad]) return res.status(400).json({ mensaje: 'Indica una entidad válida.' });
    if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => !PATRON_UUID.test(id))) {
      return res.status(400).json({ mensaje: 'Envía la lista de campos en su nuevo orden.' });
    }
    await definicionCampoModel.reordenar(entidad, ids);
    const campos = (await definicionCampoModel.listar(entidad)) || [];
    return res.status(200).json({ campos });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, listarEntidades, crear, actualizar, reordenar };
