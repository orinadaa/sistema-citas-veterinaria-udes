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
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Fotos subidas (mascotas): archivos estaticos, ver subirFoto.middleware.js.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/sedes', sedeRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/mascotas', mascotaRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/administracion', administracionRoutes);

app.get('/', (req, res) => {
  res.send('API del sistema de citas - Clinica Veterinaria UDES');
});

app.use(errorHandler);

module.exports = app;
