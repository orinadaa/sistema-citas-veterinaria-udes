// services/correo.service.js
// Envio de correos transaccionales (credenciales, bienvenida, recuperacion
// de clave) via SMTP real (Gmail + contraseña de aplicacion). Es una
// excepcion consciente a "sin integraciones con sistemas externos"
// (alcance del proyecto), acordada explicitamente con la directora del proyecto para
// que las credenciales y los codigos de recuperacion lleguen de verdad al
// correo del usuario.
const nodemailer = require('nodemailer');

let transportador = null;

// El transporte se crea una sola vez, con las credenciales de .env
// (nunca escritas en el codigo fuente).
function obtenerTransportador() {
  if (!transportador) {
    transportador = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: Number(process.env.SMTP_PORT) !== 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_APP_PASSWORD,
      },
    });
  }
  return transportador;
}

function remitente() {
  const nombre = process.env.SMTP_FROM_NAME || 'Clínica Veterinaria UDES';
  return `"${nombre}" <${process.env.SMTP_USER}>`;
}

async function enviarCorreo({ para, asunto, texto }) {
  await obtenerTransportador().sendMail({
    from: remitente(),
    to: para,
    subject: asunto,
    text: texto,
  });
}

// Cuenta creada por un administrador (medico o staff): la contraseña se
// autogenera en el backend, nunca la escribe el admin, asi que este correo
// es la unica forma en que la persona se entera de su clave.
async function enviarCredenciales({ correo, nombreCompleto, contrasenaTemporal, rolEtiqueta }) {
  await enviarCorreo({
    para: correo,
    asunto: 'Tu cuenta en el Sistema de Citas — Clínica Veterinaria UDES',
    texto: `Hola ${nombreCompleto},

Se creó tu cuenta como ${rolEtiqueta} en el Sistema de Citas de la Clínica Veterinaria UDES.

Correo: ${correo}
Contraseña temporal: ${contrasenaTemporal}

Por seguridad, te recomendamos cambiar esta contraseña después de tu primer inicio de sesión.

Clínica Veterinaria UDES`,
  });
}

// Cliente autoregistrado: eligio su propia clave, este correo solo
// confirma que la cuenta quedo creada.
async function enviarBienvenidaCliente({ correo, nombreCompleto }) {
  await enviarCorreo({
    para: correo,
    asunto: 'Tu cuenta ha sido creada — Clínica Veterinaria UDES',
    texto: `Hola ${nombreCompleto},

Tu cuenta en el Sistema de Citas de la Clínica Veterinaria UDES fue creada exitosamente. Ya puedes iniciar sesión con tu correo y la contraseña que elegiste para agendar y gestionar tus citas.

Clínica Veterinaria UDES`,
  });
}

// Codigo de recuperacion de clave (cualquier rol).
async function enviarCodigoRecuperacion({ correo, nombreCompleto, codigo }) {
  await enviarCorreo({
    para: correo,
    asunto: 'Código de recuperación de contraseña — Clínica Veterinaria UDES',
    texto: `Hola ${nombreCompleto},

Recibimos una solicitud para restablecer tu contraseña. Tu código de seguridad es:

${codigo}

Este código vence en 15 minutos. Si no solicitaste este cambio, puedes ignorar este correo.

Clínica Veterinaria UDES`,
  });
}

module.exports = { enviarCredenciales, enviarBienvenidaCliente, enviarCodigoRecuperacion };
