// services/correo.service.js
// Envio de correos transaccionales (credenciales, bienvenida, recuperacion de
// clave) via SMTP real (Gmail + contraseña de aplicacion).
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

// Codigo para confirmar el correo al registrarse: la cuenta se crea solo
// cuando la persona lo escribe.
async function enviarCodigoRegistro({ correo, nombreCompleto, codigo }) {
  await enviarCorreo({
    para: correo,
    asunto: 'Confirma tu correo — Clínica Veterinaria UDES',
    texto: `Hola ${nombreCompleto},

Para terminar de crear tu cuenta en el Sistema de Citas de la Clínica Veterinaria UDES, escribe este código en la página de registro:

${codigo}

Este código vence en 15 minutos. Si no fuiste tú, ignora este mensaje: no se creará ninguna cuenta.

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

const formatoFechaCita = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

// Confirmacion de una cita recien agendada (RF-17). `cita` es la fila de
// cita.model.js#buscarDetallePorId.
async function enviarConfirmacionCita(cita) {
  const lineas = [
    `Hola ${cita.cliente_nombre},`,
    '',
    `Tu cita quedó agendada. Este es el resumen:`,
    '',
    `Código de la cita: ${cita.codigo}`,
    `Mascota: ${cita.mascota_nombre}`,
    `Servicio: ${cita.servicio_nombre}`,
    `Fecha y hora: ${formatoFechaCita.format(new Date(cita.fecha_hora))}`,
    `Sede: ${cita.sede_nombre}${cita.sede_direccion ? ` — ${cita.sede_direccion}` : ''}`,
    `Médico veterinario: ${cita.medico_nombre}`,
  ];
  if (cita.motivo) lineas.push(`Motivo: ${cita.motivo}`);
  lineas.push(
    '',
    'Te recomendamos llegar 10 minutos antes. Si necesitas reprogramar o cancelar, puedes hacerlo desde "Mis citas" en tu cuenta.',
    '',
    'Clínica Veterinaria UDES'
  );

  await enviarCorreo({
    para: cita.cliente_correo,
    asunto: `Cita confirmada ${cita.codigo} — Clínica Veterinaria UDES`,
    texto: lineas.join('\n'),
  });
}

// La clinica (administrador de la sede o medico) cancelo o movio una cita:
// el cliente se entera tambien por correo.
async function enviarAvisoDeCita({ correo, nombreCliente, asunto, mensaje }) {
  await enviarCorreo({
    para: correo,
    asunto: `${asunto} — Clínica Veterinaria UDES`,
    texto: [`Hola ${nombreCliente},`, '', mensaje, '', 'Puedes ver tus citas en "Mis citas", dentro de tu cuenta.', '', 'Clínica Veterinaria UDES'].join('\n'),
  });
}

// Codigo para confirmar un cambio de correo: se envia AL CORREO NUEVO,
// asi se verifica que existe y que la persona tiene acceso a el.
async function enviarCodigoCambioCorreo({ correo, nombreCompleto, codigo }) {
  await enviarCorreo({
    para: correo,
    asunto: 'Confirma tu nuevo correo — Clínica Veterinaria UDES',
    texto: [
      `Hola ${nombreCompleto},`,
      '',
      'Solicitaste usar este correo en tu cuenta del Sistema de Citas de la Clínica Veterinaria UDES. Tu código de verificación es:',
      '',
      codigo,
      '',
      'Este código vence en 15 minutos. Si no fuiste tú, ignora este mensaje: tu cuenta no cambia.',
      '',
      'Clínica Veterinaria UDES',
    ].join(String.fromCharCode(10)),
  });
}

const ETIQUETA_TIPO_RECORDATORIO = {
  medicacion: 'Medicación',
  control: 'Control',
  vacunacion: 'Vacunación',
  desparasitacion: 'Desparasitación',
  otro: 'Recordatorio',
};

// Recordatorio creado por el medico para una mascota: se avisa al
// dueño en el momento de crearlo.
async function enviarRecordatorioCreado({ correo, nombreCliente, nombreMascota, nombreMedico, tipo, titulo, descripcion, fechaTexto, hora }) {
  const lineas = [
    `Hola ${nombreCliente},`,
    '',
    `${nombreMedico} creó un recordatorio para ${nombreMascota}:`,
    '',
    `Tipo: ${ETIQUETA_TIPO_RECORDATORIO[tipo] ?? tipo}`,
    `Recordatorio: ${titulo}`,
    `Fecha y hora: ${fechaTexto}, ${hora}`,
  ];
  if (descripcion) lineas.push(`Detalle: ${descripcion}`);
  lineas.push('', 'Clínica Veterinaria UDES');

  await enviarCorreo({
    para: correo,
    asunto: `Recordatorio para ${nombreMascota}: ${titulo} — Clínica Veterinaria UDES`,
    texto: lineas.join('\n'),
  });
}

// RF-18: recordatorio automatico de una cita que empieza en las proximas 24
// horas. `cita` viene de notificacion.model.js#detalleCita, con fechaTexto.
async function enviarRecordatorioCita(cita) {
  await enviarCorreo({
    para: cita.cliente_correo,
    asunto: `Recordatorio de tu cita ${cita.codigo} — Clínica Veterinaria UDES`,
    texto: [
      `Hola ${cita.cliente_nombre},`,
      '',
      `Te recordamos que ${cita.mascota_nombre} tiene una cita pronto:`,
      '',
      `Servicio: ${cita.servicio_nombre}`,
      `Fecha y hora: ${cita.fechaTexto}`,
      `Sede: ${cita.sede_nombre}`,
      `Médico veterinario: ${cita.medico_nombre}`,
      '',
      'Te recomendamos llegar 10 minutos antes. Si no puedes asistir, reprograma o cancela desde "Mis citas" en tu cuenta.',
      '',
      'Clínica Veterinaria UDES',
    ].join('\n'),
  });
}

module.exports = {
  enviarAvisoDeCita,
  enviarRecordatorioCita,
  enviarCredenciales,
  enviarBienvenidaCliente,
  enviarCodigoRegistro,
  enviarCodigoRecuperacion,
  enviarConfirmacionCita,
  enviarRecordatorioCreado,
  enviarCodigoCambioCorreo,
};
