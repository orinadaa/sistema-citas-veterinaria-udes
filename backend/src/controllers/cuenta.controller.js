// controllers/cuenta.controller.js
// "Mi perfil" del cliente (/api/cuenta).
const bcrypt = require('bcryptjs');
const cuentaModel = require('../models/cuenta.model');
const usuarioModel = require('../models/usuario.model');
const perfilModel = require('../models/perfilMedico.model');
const recuperacionModel = require('../models/recuperacion.model');
const correoService = require('../services/correo.service');
const { generarCodigoRecuperacion, errorContrasena } = require('../utils/contrasena.util');
const { generarToken } = require('../utils/token');

const RONDAS_SAL = 10;
const MINUTOS_VIGENCIA_CODIGO = 15;
const MAXIMO_INTENTOS_CODIGO = 5;
const SEGUNDOS_ENTRE_ENVIOS = 60;
const LIMITES = { nombreCompleto: 150, telefono: 20, documento: 20, direccion: 200 };
const CODIGO_INVALIDO = { mensaje: 'Código inválido o expirado. Solicita uno nuevo.' };

// GET /api/cuenta/perfil
async function obtenerPerfil(req, res, next) {
  try {
    const perfil = await cuentaModel.obtener(req.usuario.id);
    if (!perfil) return res.status(404).json({ mensaje: 'Perfil no encontrado.' });
    return res.status(200).json({ perfil });
  } catch (error) {
    next(error);
  }
}

// PUT /api/cuenta/perfil — nombre, telefono, documento y/o direccion
async function actualizarPerfil(req, res, next) {
  try {
    const campos = {};
    for (const clave of Object.keys(LIMITES)) {
      if (req.body[clave] === undefined) continue;
      const valor = req.body[clave] === null ? '' : String(req.body[clave]).trim();
      if (valor.length > LIMITES[clave]) {
        return res.status(400).json({ mensaje: `El campo ${clave} supera los ${LIMITES[clave]} caracteres.` });
      }
      campos[clave] = valor;
    }
    if (campos.nombreCompleto !== undefined && !campos.nombreCompleto) {
      return res.status(400).json({ mensaje: 'El nombre es obligatorio.' });
    }
    if (campos.telefono && !/^[0-9+\s-]{7,20}$/.test(campos.telefono)) {
      return res.status(400).json({ mensaje: 'El teléfono solo admite números, espacios, + y -.' });
    }
    if (campos.documento && !/^[0-9A-Za-z.-]{4,20}$/.test(campos.documento)) {
      return res.status(400).json({ mensaje: 'El documento solo admite letras, números, puntos y guiones.' });
    }
    if (Object.keys(campos).length === 0) {
      return res.status(400).json({ mensaje: 'Indica al menos un dato para actualizar.' });
    }
    const perfil = await cuentaModel.actualizar(req.usuario.id, campos);
    return res.status(200).json({ perfil });
  } catch (error) {
    next(error);
  }
}

// POST /api/cuenta/contrasena/codigo — envia el codigo al correo de la cuenta
async function solicitarCodigoContrasena(req, res, next) {
  try {
    const usuario = await usuarioModel.buscarPorId(req.usuario.id);
    if (!usuario) return res.status(404).json({ mensaje: 'Cuenta no encontrada.' });

    const existente = await recuperacionModel.buscarPorUsuarioId(usuario.id);
    const transcurrido = existente ? (Date.now() - new Date(existente.creado_en).getTime()) / 1000 : Infinity;
    if (transcurrido < SEGUNDOS_ENTRE_ENVIOS) {
      return res.status(429).json({ mensaje: `Ya te enviamos un código. Espera ${Math.ceil(SEGUNDOS_ENTRE_ENVIOS - transcurrido)} segundos para pedir otro.` });
    }

    const codigo = generarCodigoRecuperacion();
    const expiraEn = new Date(Date.now() + MINUTOS_VIGENCIA_CODIGO * 60 * 1000);
    await recuperacionModel.guardarCodigo(usuario.id, await bcrypt.hash(codigo, RONDAS_SAL), expiraEn);
    try {
      await correoService.enviarCodigoRecuperacion({ correo: usuario.correo, nombreCompleto: usuario.nombre_completo, codigo });
    } catch (error) {
      console.error('No se pudo enviar el codigo de cambio de contraseña:', error.message);
      await recuperacionModel.eliminarPorUsuarioId(usuario.id);
      return res.status(502).json({ mensaje: 'No se pudo enviar el código a tu correo. Inténtalo de nuevo en un momento.' });
    }
    return res.status(200).json({ mensaje: `Enviamos un código de 6 dígitos a ${usuario.correo}. Vence en ${MINUTOS_VIGENCIA_CODIGO} minutos.` });
  } catch (error) {
    next(error);
  }
}

// PUT /api/cuenta/contrasena — { codigo, contrasenaNueva }
async function cambiarContrasena(req, res, next) {
  try {
    const codigo = String(req.body.codigo || '').trim();
    const nueva = String(req.body.contrasenaNueva || '');
    if (!codigo || !nueva) {
      return res.status(400).json({ mensaje: 'El código y la nueva contraseña son obligatorios.' });
    }
    const problema = errorContrasena(nueva);
    if (problema) {
      return res.status(400).json({ mensaje: problema });
    }
    const registro = await recuperacionModel.buscarPorUsuarioId(req.usuario.id);
    if (!registro || registro.intentos >= MAXIMO_INTENTOS_CODIGO || new Date(registro.expira_en) < new Date()) {
      return res.status(400).json(CODIGO_INVALIDO);
    }
    if (!(await bcrypt.compare(codigo, registro.codigo_hash))) {
      await recuperacionModel.incrementarIntentos(req.usuario.id);
      return res.status(400).json(CODIGO_INVALIDO);
    }
    const hashActual = await perfilModel.obtenerHashContrasena(req.usuario.id);
    if (hashActual && (await bcrypt.compare(nueva, hashActual))) {
      return res.status(400).json({ mensaje: 'La nueva contraseña debe ser distinta a la actual.' });
    }
    await usuarioModel.actualizarContrasena(req.usuario.id, await bcrypt.hash(nueva, RONDAS_SAL));
    await recuperacionModel.eliminarPorUsuarioId(req.usuario.id);
    // El cambio cierra las demas sesiones de la cuenta; esta sigue con un
    // token nuevo (el frontend lo toma de tokenRenovado).
    const cuenta = await usuarioModel.buscarPorId(req.usuario.id);
    return res.status(200).json({ mensaje: 'Tu contraseña quedó actualizada.', tokenRenovado: cuenta ? generarToken(cuenta) : undefined });
  } catch (error) {
    next(error);
  }
}

module.exports = { obtenerPerfil, actualizarPerfil, solicitarCodigoContrasena, cambiarContrasena };
