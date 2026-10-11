// server.js
require('dotenv').config();

// Las citas se manejan en hora de Colombia. Se fija ANTES de cargar la
// aplicacion: asi las franjas y el dia de la semana salen bien aunque el
// servidor este alojado en otra zona horaria (un hosting tipico usa UTC y
// correria todo 5 horas). Se puede cambiar con la variable TZ.
process.env.TZ = process.env.TZ || 'America/Bogota';

// Sin estas variables el sistema arranca pero falla despues, en el primer
// inicio de sesion o en la primera consulta: mejor avisar de una vez.
const OBLIGATORIAS = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const faltantes = OBLIGATORIAS.filter((nombre) => !process.env[nombre]);
if (faltantes.length > 0) {
  console.error(`Faltan variables en backend/.env: ${faltantes.join(', ')}. Usa backend/.env.example como guía.`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET debe tener al menos 32 caracteres. Genera uno con: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  process.exit(1);
}

const app = require('./app');
const { iniciarRecordatorios } = require('./services/notificaciones.service');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
  // RF-18: recordatorio automatico de las citas de las proximas 24 horas.
  // Corre dentro de este proceso: con mas de un servidor a la vez habria
  // que dejarlo en uno solo para no enviar recordatorios repetidos.
  iniciarRecordatorios();
});
