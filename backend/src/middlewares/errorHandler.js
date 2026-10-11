// middlewares/errorHandler.js
// Middleware centralizado de manejo de errores.
// Debe registrarse SIEMPRE al final de la cadena en app.js.
//
// Los errores inesperados (500) se anotan completos en el registro del
// servidor, pero a quien hizo la peticion solo se le dice que algo fallo: el
// detalle (nombres de tablas, consultas, rutas del disco) le serviria a un
// atacante para conocer el sistema por dentro.

function errorHandler(err, req, res, next) {
  // Cuerpo que no es JSON valido o que pesa demasiado: es un error de quien llama.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'Los datos enviados no tienen un formato válido.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ mensaje: 'Los datos enviados son demasiado grandes.' });
  }
  // Identificador con forma invalida (PostgreSQL 22P02) que llego hasta la
  // base: para quien llama, ese registro no existe.
  if (err.code === '22P02') {
    return res.status(404).json({ mensaje: 'El registro indicado no existe.' });
  }

  // Texto mas largo que la columna, fecha u hora imposibles, numero fuera
  // de rango: red de seguridad por si un controlador no lo valido antes.
  if (err.code === '22001') {
    return res.status(400).json({ mensaje: 'Uno de los datos es más largo de lo permitido.' });
  }
  if (['22007', '22008', '22003', '22P03'].includes(err.code)) {
    return res.status(400).json({ mensaje: 'Uno de los datos (fecha, hora o número) no es válido.' });
  }
  // Referencia a un registro que no existe (llave foranea) o valor que una
  // regla de la base no admite.
  if (err.code === '23503') {
    return res.status(400).json({ mensaje: 'Uno de los registros indicados no existe.' });
  }
  if (err.code === '23514' || err.code === '23502') {
    return res.status(400).json({ mensaje: 'Uno de los datos no es válido o falta.' });
  }

  const statusCode = err.statusCode || err.status || 500;
  if (statusCode >= 500) {
    console.error('Error no controlado:', err);
    return res.status(500).json({ mensaje: 'Ocurrió un error inesperado. Inténtalo de nuevo en unos minutos.' });
  }
  return res.status(statusCode).json({ mensaje: err.message || 'No se pudo completar la operación.' });
}

module.exports = errorHandler;
