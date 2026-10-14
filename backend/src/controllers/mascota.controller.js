// controllers/mascota.controller.js
// El cliente gestiona sus propias mascotas; el administrador puede
// verlas/crearlas/editarlas para cualquier cliente (pantalla de
// Pacientes del panel administrativo).
const mascotaModel = require('../models/mascota.model');
const notificaciones = require('../services/notificaciones.service');
const usuarioModel = require('../models/usuario.model');
const pacienteMedicoModel = require('../models/pacienteMedico.model');
const fs = require('fs/promises');
const path = require('path');
const { CARPETA_FOTOS_MASCOTAS, RUTA_PUBLICA_FOTOS_MASCOTAS } = require('../middlewares/subirFoto.middleware');

const { errorLongitud, esFechaReal } = require('../utils/validacion');

const SEXOS_VALIDOS = ['macho', 'hembra'];

// Limites de las columnas de texto y la
// fecha de nacimiento: se revisan aqui para responder un mensaje claro.
const LIMITES_TEXTO = { nombre: 100, especie: 50, raza: 80, color: 50, caracteristicas: 1000, alergias: 1000, medicamentos: 1000, condicionesMedicas: 1000, observaciones: 1000 };
const ETIQUETAS_TEXTO = { nombre: 'El nombre', especie: 'La especie', raza: 'La raza', color: 'El color', caracteristicas: 'Las características', alergias: 'Las alergias', medicamentos: 'Los medicamentos', condicionesMedicas: 'Las condiciones médicas', observaciones: 'Las observaciones' };
function errorDatosMascota(datos) {
  const largo = errorLongitud(datos, LIMITES_TEXTO, ETIQUETAS_TEXTO);
  if (largo) return largo;
  const { fechaNacimiento, pesoKg } = datos;
  if (fechaNacimiento !== undefined && fechaNacimiento !== null && fechaNacimiento !== '') {
    const texto = String(fechaNacimiento).slice(0, 10);
    if (!esFechaReal(texto)) return 'La fecha de nacimiento no es válida.';
    const hoy = new Date();
    const hoyTexto = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    if (texto > hoyTexto) return 'La fecha de nacimiento no puede ser futura.';
    if (texto < '1980-01-01') return 'Revisa la fecha de nacimiento.';
  }
  if (pesoKg !== undefined && pesoKg !== null && pesoKg !== '' && Number(pesoKg) > 999) return 'Revisa el peso: no puede superar los 999 kg.';
  return null;
}

function pesoValido(peso) {
  const numero = Number(peso);
  return Number.isFinite(numero) && numero > 0;
}

// Quien puede crear/editar (y cambiar la foto de) mascotas de un dueño:
// el administrador (cualquiera), el propio dueño, y el medico solo si
// ese dueño es paciente suyo (tiene o tuvo cita con el) -- caso de una
// mascota nueva que llega en plena consulta. Eliminar sigue siendo
// exclusivo del dueño (ver eliminar()).
async function puedeGestionarMascotasDe(usuario, clienteId) {
  if (usuario.rol === 'administrador') return true;
  if (usuario.rol === 'cliente') return usuario.id === clienteId;
  if (usuario.rol === 'veterinario') return pacienteMedicoModel.esPacienteDe(clienteId, usuario.id);
  return false;
}

function textoVacio(valor) {
  return typeof valor !== 'string' || valor.trim() === '';
}

// Especie y raza son obligatorias. Al crear se
// exigen; al editar, si vienen, no pueden quedar vacias. La lista de
// razas es un catalogo del frontend (utils/razas.js): aqui se guarda
// el texto tal cual, igual que antes.
function errorEspecieRaza({ especie, raza }, { alCrear }) {
  if (alCrear || especie !== undefined) {
    if (textoVacio(especie)) return 'La especie de la mascota es obligatoria.';
  }
  if (alCrear || raza !== undefined) {
    if (textoVacio(raza)) return 'La raza de la mascota es obligatoria (puedes elegir "No sé la raza").';
  }
  return null;
}

// Borra del disco una foto anterior, solo si es un archivo nuestro de
// uploads/mascotas (nunca una URL externa escrita a mano). Si falla, no
// interrumpe la respuesta: el archivo huerfano no afecta al sistema.
async function borrarFotoLocal(fotoUrl) {
  if (!fotoUrl || !fotoUrl.startsWith(`${RUTA_PUBLICA_FOTOS_MASCOTAS}/`)) return;
  const archivo = path.join(CARPETA_FOTOS_MASCOTAS, path.basename(fotoUrl));
  await fs.unlink(archivo).catch((error) => console.error('No se pudo borrar la foto anterior:', error.message));
}

// GET /api/mascotas/mias — solo cliente
async function misMascotas(req, res, next) {
  try {
    const mascotas = await mascotaModel.listarPorCliente(req.usuario.id);
    return res.status(200).json({ mascotas });
  } catch (error) {
    next(error);
  }
}

// GET /api/mascotas?clienteId=... — solo administrador
async function listarDeCliente(req, res, next) {
  try {
    const { clienteId } = req.query;
    if (!clienteId) {
      return res.status(400).json({ mensaje: 'clienteId es obligatorio.' });
    }

    // El medico solo consulta las mascotas de sus pacientes (antes podia
    // ver las de cualquier cliente, con su informacion medica).
    if (!(await puedeGestionarMascotasDe(req.usuario, clienteId))) {
      return res.status(403).json({ mensaje: 'Este cliente no es paciente tuyo.' });
    }
    const mascotas = await mascotaModel.listarPorCliente(clienteId);
    return res.status(200).json({ mascotas });
  } catch (error) {
    next(error);
  }
}

// POST /api/mascotas — el cliente crea la propia; el administrador
// indica clienteId explicitamente (debe ser una cuenta cliente real).
async function crear(req, res, next) {
  try {
    const esAdmin = req.usuario.rol === 'administrador';
    const {
      nombre,
      especie,
      raza,
      fotoUrl,
      fechaNacimiento,
      sexo,
      color,
      pesoKg,
      caracteristicas,
      alergias,
      medicamentos,
      condicionesMedicas,
      observaciones,
      clienteId: clienteIdBody,
    } = req.body;

    if (!nombre || String(nombre).trim() === '') {
      return res.status(400).json({ mensaje: 'El nombre de la mascota es obligatorio.' });
    }
    const problemaDatos = errorDatosMascota(req.body);
    if (problemaDatos) {
      return res.status(400).json({ mensaje: problemaDatos });
    }
    const errorEspecie = errorEspecieRaza({ especie, raza }, { alCrear: true });
    if (errorEspecie) {
      return res.status(400).json({ mensaje: errorEspecie });
    }
    if (sexo && !SEXOS_VALIDOS.includes(sexo)) {
      return res.status(400).json({ mensaje: `El sexo debe ser uno de: ${SEXOS_VALIDOS.join(', ')}.` });
    }
    if (pesoKg !== undefined && pesoKg !== null && pesoKg !== '' && !pesoValido(pesoKg)) {
      return res.status(400).json({ mensaje: 'El peso debe ser un número mayor a 0.' });
    }

    let clienteId = req.usuario.id;
    if (esAdmin || req.usuario.rol === 'veterinario') {
      if (!clienteIdBody) {
        return res.status(400).json({ mensaje: 'clienteId es obligatorio al crear una mascota para un cliente.' });
      }
      const cliente = await usuarioModel.buscarPorId(clienteIdBody);
      if (!cliente || cliente.rol !== 'cliente') {
        return res.status(404).json({ mensaje: 'El cliente indicado no existe.' });
      }
      if (!(await puedeGestionarMascotasDe(req.usuario, clienteIdBody))) {
        return res.status(403).json({ mensaje: 'Solo puedes agregar mascotas a tus pacientes.' });
      }
      clienteId = clienteIdBody;
    }

    const mascota = await mascotaModel.crear({
      clienteId,
      nombre,
      especie,
      raza,
      // La foto solo entra por la subida de archivo (POST /:id/foto).
      fotoUrl: null,
      fechaNacimiento,
      sexo,
      color,
      pesoKg: pesoKg || null,
      caracteristicas,
      alergias,
      medicamentos,
      condicionesMedicas,
      observaciones,
    });
    await notificaciones.mascotaRegistrada(mascota, req.usuario.id);
    return res.status(201).json({ mascota });
  } catch (error) {
    next(error);
  }
}

// PUT /api/mascotas/:id — el cliente solo puede editar la suya; el
// administrador puede editar cualquiera.
async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const {
      nombre,
      especie,
      raza,
      fotoUrl,
      fechaNacimiento,
      sexo,
      color,
      pesoKg,
      caracteristicas,
      alergias,
      medicamentos,
      condicionesMedicas,
      observaciones,
    } = req.body;

    if (nombre !== undefined && textoVacio(nombre)) {
      return res.status(400).json({ mensaje: 'El nombre de la mascota es obligatorio.' });
    }
    const problemaDatos = errorDatosMascota(req.body);
    if (problemaDatos) {
      return res.status(400).json({ mensaje: problemaDatos });
    }
    const errorEspecie = errorEspecieRaza({ especie, raza }, { alCrear: false });
    if (errorEspecie) {
      return res.status(400).json({ mensaje: errorEspecie });
    }

    if (sexo && !SEXOS_VALIDOS.includes(sexo)) {
      return res.status(400).json({ mensaje: `El sexo debe ser uno de: ${SEXOS_VALIDOS.join(', ')}.` });
    }
    if (pesoKg !== undefined && pesoKg !== null && pesoKg !== '' && !pesoValido(pesoKg)) {
      return res.status(400).json({ mensaje: 'El peso debe ser un número mayor a 0.' });
    }

    const mascota = await mascotaModel.buscarPorId(id);
    if (!mascota) {
      return res.status(404).json({ mensaje: 'Mascota no encontrada.' });
    }
    if (!(await puedeGestionarMascotasDe(req.usuario, mascota.cliente_id))) {
      return res.status(403).json({ mensaje: 'No puedes editar una mascota que no es tuya.' });
    }

    const actualizada = await mascotaModel.actualizar(id, {
      nombre,
      especie,
      raza,
      // undefined: la foto guardada no se toca (solo cambia al subir un archivo).
      fotoUrl: undefined,
      fechaNacimiento,
      sexo,
      color,
      pesoKg: pesoKg || null,
      caracteristicas,
      alergias,
      medicamentos,
      condicionesMedicas,
      observaciones,
    });
    return res.status(200).json({ mascota: actualizada });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/mascotas/:id — solo el cliente dueño puede eliminar su
// mascota; el administrador no (solo edita sus datos).
// Baja logica (activo = false): las citas pasadas conservan la mascota.
// Si tiene citas agendadas a futuro, primero hay que cancelarlas.
async function eliminar(req, res, next) {
  try {
    const { id } = req.params;
    const mascota = await mascotaModel.buscarPorId(id);
    if (!mascota) {
      return res.status(404).json({ mensaje: 'Mascota no encontrada.' });
    }
    if (mascota.cliente_id !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No puedes eliminar una mascota que no es tuya.' });
    }

    const pendientes = await mascotaModel.contarCitasPendientes(id);
    if (pendientes > 0) {
      return res.status(409).json({
        mensaje: `${mascota.nombre} tiene ${pendientes === 1 ? 'una cita agendada' : `${pendientes} citas agendadas`}. Cancélala${pendientes === 1 ? '' : 's'} antes de eliminarla.`,
      });
    }

    await mascotaModel.desactivar(id);
    return res.status(200).json({ mensaje: `${mascota.nombre} se eliminó de tus mascotas.` });
  } catch (error) {
    next(error);
  }
}

// POST /api/mascotas/:id/foto — multipart, campo "foto" (JPG/PNG, max
// 5 MB; lo valida subirFotoMascota antes de llegar aqui). El recorte,
// zoom y rotacion ya se hicieron en el navegador: llega la imagen final.
// Dueño o administrador. Reemplaza la foto anterior y la borra del disco.
async function subirFoto(req, res, next) {
  const archivoNuevo = req.file ? `${RUTA_PUBLICA_FOTOS_MASCOTAS}/${req.file.filename}` : null;
  try {
    if (!archivoNuevo) {
      return res.status(400).json({ mensaje: 'Adjunta una imagen JPG o PNG en el campo "foto".' });
    }

    const mascota = await mascotaModel.buscarPorId(req.params.id);
    if (!mascota || !(await puedeGestionarMascotasDe(req.usuario, mascota.cliente_id))) {
      await borrarFotoLocal(archivoNuevo);
      return mascota
        ? res.status(403).json({ mensaje: 'No puedes cambiar la foto de una mascota que no es tuya.' })
        : res.status(404).json({ mensaje: 'Mascota no encontrada.' });
    }

    const resultado = await mascotaModel.actualizarFoto(mascota.id, archivoNuevo);
    await borrarFotoLocal(resultado.fotoAnterior);
    return res.status(200).json({ mascota: resultado.mascota });
  } catch (error) {
    await borrarFotoLocal(archivoNuevo);
    next(error);
  }
}

module.exports = { misMascotas, listarDeCliente, crear, actualizar, eliminar, subirFoto };
