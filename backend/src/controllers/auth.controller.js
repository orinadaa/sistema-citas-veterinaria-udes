// controllers/auth.controller.js
// RF-01 (registro de clientes), RF-02 (inicio de sesion).
// El registro publico solo crea usuarios con rol "cliente": las cuentas de
// administrador/veterinario las crea un administrador (ver usuario.controller.js).

const bcrypt = require('bcryptjs');
const { buscarPorCorreo, crearCliente, actualizarContrasena, buscarConHashPorId } = require('../models/usuario.model');
const recuperacionModel = require('../models/recuperacion.model');
const bitacoraModel = require('../models/bitacora.model');
const correoService = require('../services/correo.service');
const { generarCodigoRecuperacion, errorContrasena } = require('../utils/contrasena.util');
const { generarToken } = require('../utils/token');
const { normalizarCorreo, errorCorreo, errorNombre, errorTelefono } = require('../utils/validacion');

const RONDAS_SAL = 10;
const MINUTOS_VIGENCIA_CODIGO = 15;
const MAXIMO_INTENTOS_CODIGO = 5;
// Una cuenta de personal creada por el sistema debe entrar y poner su propia
// contraseña dentro de este plazo; despues la clave temporal deja de servir.
const HORAS_VIGENCIA_CLAVE_TEMPORAL = 72;
const MENSAJE_CREDENCIALES = 'El correo o la contraseña no son correctos. Revísalos e inténtalo de nuevo.';
const MENSAJE_CUENTA_INACTIVA =
  'Tu cuenta está inactiva. Comunícate con la clínica para que la reactiven.';
const MENSAJE_CLAVE_TEMPORAL_VENCIDA =
  'La contraseña temporal que recibiste por correo ya venció. Usa "¿Olvidaste tu contraseña?" para crear la tuya.';
const MENSAJE_OLVIDE_CLAVE = 'Si el correo está registrado, se envió un código de recuperación.';
const MENSAJE_CODIGO_INVALIDO = 'Código inválido o expirado.';
// Hash de relleno: cuando el correo no existe se compara igual contra el,
// para que la respuesta tarde lo mismo que con un correo real (si no, medir
// el tiempo dejaria averiguar que correos tienen cuenta).
const HASH_DE_RELLENO = bcrypt.hashSync('relleno-para-igualar-tiempos', RONDAS_SAL);

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

// Deja constancia de un evento de seguridad en la bitacora (no en las
// pruebas automaticas). Nunca hace fallar la peticion.
function anotarSeguridad(accion, detalle, usuario) {
  if (process.env.NODE_ENV === 'test') return;
  bitacoraModel
    .registrar({ usuarioId: usuario?.id ?? null, usuarioRol: usuario?.rol ?? null, accion, entidad: 'seguridad', entidadId: null, detalle })
    .catch((error) => console.error('No se pudo escribir en la bitácora:', error.message));
}

// POST /api/auth/registro
async function registrar(req, res, next) {
  try {
    const { contrasena, sitioWeb, autorizaTratamiento } = req.body;
    const nombreCompleto = String(req.body.nombreCompleto ?? '').trim();
    const correo = normalizarCorreo(req.body.correo);
    const telefono = req.body.telefono ? String(req.body.telefono).trim() : null;

    if (!nombreCompleto || !correo || !contrasena) {
      return res.status(400).json({ mensaje: 'Nombre completo, correo y contraseña son obligatorios.' });
    }
    // Campo trampa: el formulario lo tiene oculto y una persona nunca lo
    // llena; un programa que rellena todos los campos si.
    if (sitioWeb) {
      return res.status(400).json({ mensaje: 'No se pudo crear la cuenta. Recarga la página e inténtalo de nuevo.' });
    }
    const problema = errorNombre(nombreCompleto) || errorCorreo(correo) || errorTelefono(telefono) || errorContrasena(contrasena, correo);
    if (problema) {
      return res.status(400).json({ mensaje: problema });
    }
    // Ley 1581 de 2012: sin autorizacion expresa no se guardan datos personales.
    if (autorizaTratamiento !== true) {
      return res.status(400).json({ mensaje: 'Para crear tu cuenta debes autorizar el tratamiento de tus datos personales.' });
    }

    const existente = await buscarPorCorreo(correo);
    if (existente) {
      return res.status(409).json({ mensaje: 'Ya existe una cuenta registrada con este correo.' });
    }

    const contrasenaHash = await bcrypt.hash(contrasena, RONDAS_SAL);
    const nuevoUsuario = await crearCliente({ nombreCompleto, correo, contrasenaHash, telefono, autorizaTratamiento: true });

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
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Ya existe una cuenta registrada con este correo.' });
    }
    next(error);
  }
}

// POST /api/auth/login
async function iniciarSesion(req, res, next) {
  try {
    const correo = normalizarCorreo(req.body.correo);
    const contrasena = req.body.contrasena;

    if (!correo || !contrasena) {
      return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios.' });
    }

    // Correo inexistente y contraseña incorrecta responden EXACTAMENTE lo
    // mismo y tardan lo mismo: distinguirlos dejaria averiguar que correos
    // tienen cuenta probando uno por uno (enumeracion de cuentas).
    const usuario = await buscarPorCorreo(correo);
    const coincide = await bcrypt.compare(String(contrasena), usuario ? usuario.contrasena_hash : HASH_DE_RELLENO);
    if (!usuario || !coincide) {
      anotarSeguridad('Inicio de sesión fallido', `Correo: ${correo.slice(0, 150)}`, usuario);
      return res.status(401).json({ mensaje: MENSAJE_CREDENCIALES });
    }

    // "Cuenta inactiva" solo se dice a quien YA demostro ser el dueño (la
    // contraseña es correcta), asi no revela nada a un tercero. Decision de
    // Oriana (frente 5): es el unico mensaje especifico del inicio de sesion.
    if (!usuario.activo) {
      return res.status(403).json({ mensaje: MENSAJE_CUENTA_INACTIVA, codigo: 'CUENTA_INACTIVA' });
    }

    // La clave temporal que genero el sistema vale 72 horas desde que se
    // creo la cuenta. Vencida, se recupera con el codigo por correo.
    if (usuario.debe_cambiar_contrasena && usuario.creado_en) {
      const horas = (Date.now() - new Date(usuario.creado_en).getTime()) / 3600000;
      if (horas > HORAS_VIGENCIA_CLAVE_TEMPORAL) {
        return res.status(403).json({ mensaje: MENSAJE_CLAVE_TEMPORAL_VENCIDA, codigo: 'CLAVE_TEMPORAL_VENCIDA' });
      }
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
    const correo = normalizarCorreo(req.body.correo);
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
    const correo = normalizarCorreo(req.body.correo);
    const { codigo, contrasenaNueva } = req.body;

    if (!correo || !codigo || !contrasenaNueva) {
      return res.status(400).json({ mensaje: 'Correo, código y nueva contraseña son obligatorios.' });
    }
    const problema = errorContrasena(contrasenaNueva, correo);
    if (problema) {
      return res.status(400).json({ mensaje: problema });
    }

    const usuario = await buscarPorCorreo(correo);
    if (!usuario) {
      return res.status(400).json({ mensaje: MENSAJE_CODIGO_INVALIDO });
    }

    const registro = await recuperacionModel.buscarPorUsuarioId(usuario.id);
    if (!registro || registro.intentos >= MAXIMO_INTENTOS_CODIGO || new Date(registro.expira_en) < new Date()) {
      return res.status(400).json({ mensaje: MENSAJE_CODIGO_INVALIDO });
    }

    const coincide = await bcrypt.compare(String(codigo), registro.codigo_hash);
    if (!coincide) {
      await recuperacionModel.incrementarIntentos(usuario.id);
      return res.status(400).json({ mensaje: MENSAJE_CODIGO_INVALIDO });
    }

    const contrasenaHash = await bcrypt.hash(contrasenaNueva, RONDAS_SAL);
    // Tambien cierra las sesiones que estuvieran abiertas con la clave anterior.
    await actualizarContrasena(usuario.id, contrasenaHash);
    await recuperacionModel.eliminarPorUsuarioId(usuario.id);
    anotarSeguridad('Contraseña restablecida por código', null, usuario);

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
    const usuario = await buscarConHashPorId(req.usuario.id);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ mensaje: MENSAJE_CREDENCIALES });
    }
    const problema = errorContrasena(nueva, usuario.correo);
    if (problema) {
      return res.status(400).json({ mensaje: problema });
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
