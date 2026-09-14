// middlewares/errorHandler.js
// Middleware centralizado de manejo de errores.
// Debe registrarse SIEMPRE al final de la cadena en server.js.

function errorHandler(err, req, res, next) {
  console.error('Error no controlado:', err);
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    mensaje: err.message || 'Error interno del servidor',
  });
}

module.exports = errorHandler;