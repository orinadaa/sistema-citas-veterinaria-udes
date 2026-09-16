// app.js
// Configuracion de la aplicacion Express, separada de server.js para poder
// importarla en las pruebas (supertest) sin levantar un puerto real.

const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const sedeRoutes = require('./routes/sede.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/sedes', sedeRoutes);

app.get('/', (req, res) => {
  res.send('API del sistema de citas - Clinica Veterinaria UDES');
});

app.use(errorHandler);

module.exports = app;
