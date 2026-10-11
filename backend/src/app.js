// app.js
// Configuracion de la aplicacion Express, separada de server.js para poder
// importarla en las pruebas (supertest) sin levantar un puerto real.

const path = require('path');
const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const sedeRoutes = require('./routes/sede.routes');
const servicioRoutes = require('./routes/servicio.routes');
const citaRoutes = require('./routes/cita.routes');
const mascotaRoutes = require('./routes/mascota.routes');
const horarioRoutes = require('./routes/horario.routes');
const administracionRoutes = require('./routes/administracion.routes');
const medicoRoutes = require('./routes/medico.routes');
const galeriaRoutes = require('./routes/galeria.routes');
const catalogoRoutes = require('./routes/catalogo.routes');
const datosRoutes = require('./routes/datos.routes');
const cuentaRoutes = require('./routes/cuenta.routes');
const notificacionRoutes = require('./routes/notificacion.routes');
const clinicaRoutes = require('./routes/clinica.routes');
const miCuentaRoutes = require('./routes/miCuenta.routes');
const errorHandler = require('./middlewares/errorHandler');
const { cabecerasSeguridad, origenesPermitidos, forzarHttps } = require('./middlewares/seguridad.middleware');

const app = express();

// Seguridad (ver seguridad.middleware.js): no se anuncia la tecnologia del
// servidor, cabeceras de proteccion, HTTPS obligatorio en produccion y solo
// los sitios autorizados pueden llamar a la API desde un navegador.
app.disable('x-powered-by');
// Detras de un proxy (produccion): TRUST_PROXY=1 para conocer la IP real y
// si la peticion llego por HTTPS.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
app.use(cabecerasSeguridad);
app.use(forzarHttps);
app.use(cors(origenesPermitidos()));
app.use(express.json({ limit: '100kb' }));

// Fotos subidas (mascotas, medicos, sedes, galeria): archivos estaticos, ver subirFoto.middleware.js.
// dotfiles ignore / index false: solo se sirven las fotos, nunca un listado
// ni archivos ocultos.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { dotfiles: 'ignore', index: false, maxAge: '7d' }));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/sedes', sedeRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/mascotas', mascotaRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/administracion', administracionRoutes);
app.use('/api/medico', medicoRoutes);
app.use('/api/galeria', galeriaRoutes);
app.use('/api/catalogos', catalogoRoutes);
app.use('/api/datos', datosRoutes);
app.use('/api/cuenta', cuentaRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/clinica', clinicaRoutes);
app.use('/api/mi-cuenta', miCuentaRoutes);

app.get('/', (req, res) => {
  res.send('API del sistema de citas - Clinica Veterinaria UDES');
});

// Ruta de la API que no existe: respuesta en JSON, no la pagina de Express.
app.use('/api', (req, res) => res.status(404).json({ mensaje: 'Esa ruta no existe.' }));

app.use(errorHandler);

module.exports = app;
