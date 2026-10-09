// server.js
require('dotenv').config();

const app = require('./app');
const { iniciarRecordatorios } = require('./services/notificaciones.service');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
  // RF-18: recordatorio automatico de las citas de las proximas 24 horas.
  iniciarRecordatorios();
});
