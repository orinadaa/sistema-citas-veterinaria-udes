// controllers/auth.controller.js
// RF-01 (registro de clientes), RF-02 (inicio de sesion).
// El registro publico solo crea usuarios con rol "cliente": las cuentas de
// administrador/veterinario las crea un administrador (ver usuario.controller.js).

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { buscarPorCorreo, crearCliente, actualizarContrasena, buscarConHashPorId } = require('../models/usuario.model');
const recuperacionModel = require('../models/recuperacion.model');
const correoService = require('../services/correo.service');
const { generarCodigoRecuperacion } = require('../utils/contrasena.util');

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RONDAS_SAL = 10;
const MINUTOS_VIGENCIA_CODIGO = 15;
const MAXIMO_INTENTOS_CODIGO = 5;
const MENSAJE_CREDENCIALES = 'El correo o la contraseña no son correctos. Revísalos e inténtalo de nuevo.';
const MENSAJE_CUENTA_INACTIVA =
  'Tu cuenta está inactiva. Comunícate con la clínica para que la reactiven.';
const MENSAJE_OLVIDE_CLAVE = 'Si el correo está registrado, se envió un código de recuperación.';
const MENSAJE_CODIGO_INVALIDO = 'Código inválido o expirado.';

function generarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      rol: usuario.rol,
      sedeId: usuario.sede_id || null,
      // Con clave temporal el token solo sirve para establecer la propia
      // (ver auth.middleware.js).
      ...(usuario.debe_cambiar_contrasena ? { cambiarClave: true } : {}),
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRACION || '8h' }
  );
}

function datosPublicos(usuario) {
  return {
    id: usuario.id,
    nombreCompleto: usuario.nombre_completo,
    correo: usuario.correo,
    rol: usuario.rol,
    sedeId: usuario.sede_id || null,
    debeCambiarContrasena: Boolean(usuario.debe_cambiar_contrasena),
  };
}

// POST /api/auth/registro
async function registrar(req, res, next) {
  try {
    const { nombreCompleto, correo, contrasena, telefono } = req.body;

    if (!nombreCompleto || !correo || !contrasena) {
      return res.status(400).json({ mensaje: 'Nombre completo, correo y contraseña son obligatorios.' });
    }
    if (!CORREO_REGEX.test(correo)) {
      return res.status(400).json({ mensaje: 'El correo electrónico no tiene un formato válido.' });
    }
    if (contrasena.length < 8) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    const existente = await buscarPorCorreo(correo);
    if (existente) {
      return res.status(409).json({ mensaje: 'Ya existe una cuenta registrada con este correo.' });
    }

    const contrasenaHash = await bcrypt.hash(contrasena, RONDAS_SAL);
    const nuevoUsuario = await crearCliente({ nombreCompleto, correo, contrasenaHash, telefono });

    const usuarioCompleto = { ...nuevoUsuario, sede_id: null };
    const token = generarToken(usuarioCompleto);

    // El cliente eligio su propia clave: este correo solo confirma la
    // creacion de la cuenta, nunca lleva credenciales. Es best-effort: si
    // falla el envio no se bloquea el registro (ya se creo la cuenta).
    try {
      await correoService.enviarBienvenidaCliente({ correo, nombreCompleto });
    } catch (error) {
      console.error('No se pudo enviar el correo de bienvenida:', error.message);
    }

    return res.status(201).json({ usuario: datosPublicos(usuarioCompleto), token });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login
async function iniciarSesion(req, res, next) {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios.' });
    }

    // Correo inexistente y contraseña incorrecta responden EXACTAMENTE lo
    // mismo: distinguirlos dejaria averiguar que correos tienen cuenta
    // probando uno por uno (enumeracion de cuentas).
    const usuario = await buscarPorCorreo(correo);
    if (!usuario) {
      return res.status(401).json({ mensaje: MENSAJE_CREDENCIALES });
    }

    const coincide = await bcrypt.compare(contrasena, usuario.contrasena_hash);
    if (!coincide) {
      return res.status(401).json({ mensaje: MENSAJE_CREDENCIALES });
    }

    // "Cuenta inactiva" solo se dice a quien YA demostro ser el dueño (la
    // contraseña es correcta), asi no revela nada a un tercero. Decision de
    // Oriana (frente 5): es el unico mensaje especifico del inicio de sesion.
    if (!usuario.activo) {
      return res.status(403).json({ mensaje: MENSAJE_CUENTA_INACTIVA, codigo: 'CUENTA_INACTIVA' });
    }

    const token = generarToken(usuario);
    return res.status(200).json({ usuario: datosPublicos(usuario), token });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/olvide-clave — cualquier rol. Siempre responde el mismo
// mensaje generico (exista o no la cuenta) para no revelar que correos
// estan registrados.
async function olvideClave(req, res, next) {
  try {
    const { correo } = req.body;
    if (!correo) {
      return res.status(400).json({ mensaje: 'El correo es obligatorio.' });
    }

    const usuario = await buscarPorCorreo(correo);
    if (usuario) {
      const existente = await recuperacionModel.buscarPorUsuarioId(usuario.id);
      const pidioHaceMenosDeUnMinuto =
        existente && Date.now() - new Date(existente.creado_en).getTime() < 60 * 1000;

      // Evita reenviar (y regenerar) el codigo si ya se pidio uno hace
      // menos de un minuto -- protege contra clics repetidos/spam.
      if (!pidioHaceMenosDeUnMinuto) {
        const codigo = generarCodigoRecuperacion();
        const codigoHash = await bcrypt.hash(codigo, RONDAS_SAL);
        const expiraEn = new Date(Date.now() + MINUTOS_VIGENCIA_CODIGO * 60 * 1000);
        await recuperacionModel.guardarCodigo(usuario.id, codigoHash, expiraEn);

        try {
          await correoService.enviarCodigoRecuperacion({
            correo: usuario.correo,
            nombreCompleto: usuario.nombre_completo,
            codigo,
          });
        } catch (error) {
          console.error('No se pudo enviar el correo de recuperación:', error.message);
        }
      }
    }

    return res.status(200).json({ mensaje: MENSAJE_OLVIDE_CLAVE });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/restablecer-clave — cualquier rol.
async function restablecerClave(req, res, next) {
  try {
    const { correo, codigo, contrasenaNueva } = req.body;

    if (!correo || !codigo || !contrasenaNueva) {
      return res.status(400).json({ mensaje: 'Correo, código y nueva contraseña son obligatorios.' });
    }
    if (contrasenaNueva.length < 8) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    const usuario = await buscarPorCorreo(correo);
    if (!usuario) {
      return res.status(400).json({ mensaje: MENSAJE_CODIGO_INVALIDO });
    }

    const registro = await recuperacionModel.buscarPorUsuarioId(usuario.id);
    if (!registro || registro.intentos >= MAXIMO_INTENTOS_CODIGO || new Date(registro.expira_en) < new Date()) {
      return res.status(400).json({ mensaje: MENSAJE_CODIGO_INVALIDO });
    }

    const coincide = await bcrypt.compare(codigo, registro.codigo_hash);
    if (!coincide) {
      await recuperacionModel.incrementarIntentos(usuario.id);
      return res.status(400).json({ mensaje: MENSAJE_CODIGO_INVALIDO });
    }

    const contrasenaHash = await bcrypt.hash(contrasenaNueva, RONDAS_SAL);
    await actualizarContrasena(usuario.id, contrasenaHash);
    await recuperacionModel.eliminarPorUsuarioId(usuario.id);

    return res.status(200).json({ mensaje: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/primera-clave — { contrasenaNueva }. Para la cuenta que
// entro con la clave temporal que le genero el sistema: establece su propia
// contraseña y devuelve una sesion normal (token sin la marca).
async function establecerPrimeraClave(req, res, next) {
  try {
    const nueva = String(req.body.contrasenaNueva || '');
    if (nueva.length < 8) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres.' });
    }
    const usuario = await buscarConHashPorId(req.usuario.id);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ mensaje: MENSAJE_CREDENCIALES });
    }
    if (!usuario.debe_cambiar_contrasena) {
      return res.status(400).json({ mensaje: 'Tu cuenta ya tiene una contraseña propia.' });
    }
    if (await bcrypt.compare(nueva, usuario.contrasena_hash)) {
      return res.status(400).json({ mensaje: 'Elige una contraseña distinta a la temporal que recibiste por correo.' });
    }
    await actualizarContrasena(usuario.id, await bcrypt.hash(nueva, RONDAS_SAL));
    const actualizado = { ...usuario, debe_cambiar_contrasena: false };
    return res.status(200).json({ usuario: datosPublicos(actualizado), token: generarToken(actualizado) });
  } catch (error) {
    next(error);
  }
}

module.exports = { registrar, iniciarSesion, olvideClave, restablecerClave, establecerPrimeraClave };
