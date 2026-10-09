// scripts/datosDemo.js
// Carga datos de EJEMPLO para mostrar el sistema como si estuviera en
// funcionamiento (sustentacion, demostraciones), y permite quitarlos.
//
//   npm run demo:cargar    crea los datos de ejemplo
//   npm run demo:quitar    los borra (solo los de ejemplo)
//
// Reglas:
// - Solo INSERTA. No modifica ni borra ninguna cuenta, mascota o cita que
//   ya exista. Lo unico existente que cambia es el contador de codigos de
//   cita (consecutivo_cita), para que las proximas citas reales no repitan
//   un codigo.
// - Todo lo de ejemplo cuelga de cuentas con correo "@demo.udes.co": asi se
//   reconoce y se quita sin tocar lo real. "quitar" borra esas cuentas, sus
//   mascotas y sus citas (tambien las que se hayan agendado despues a su
//   nombre) y los servicios de la medica de ejemplo.
// - Las citas respetan el sistema real: caen en dias y horas en que la sede
//   atiende, con un medico de esa sede que presta ese servicio y que no
//   tiene otra cita a esa hora.
// - Es repetible: siempre genera lo mismo (sorteo con semilla fija). Si ya
//   hay datos de ejemplo, "cargar" avisa y no hace nada.
// - Todas las cuentas de ejemplo entran con la contraseña CONTRASENA_DEMO.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const DOMINIO = '@demo.udes.co';
const CONTRASENA_DEMO = 'Demo12345';
const SEMANAS_ATRAS = 8;
const SEMANAS_ADELANTE = 3;

// --- sorteo repetible (mulberry32) --------------------------------------
let semilla = 20261009;
function azar() {
  semilla = (semilla + 0x6d2b79f5) | 0;
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const entero = (min, max) => min + Math.floor(azar() * (max - min + 1));
const elegir = (lista) => lista[Math.floor(azar() * lista.length)];

// --- datos de ejemplo ----------------------------------------------------
const CLIENTES = [
  ['María Fernanda Gómez Ruiz', 'maria.gomez', '3104567821'],
  ['Juan Sebastián Pérez Mora', 'juan.perez', '3157782340'],
  ['Carolina Rojas Vargas', 'carolina.rojas', '3002214567'],
  ['Andrés Mauricio Torres Díaz', 'andres.torres', '3186654321'],
  ['Luisa Fernanda Castillo Niño', 'luisa.castillo', '3013345566'],
  ['Diego Alejandro Herrera Pinto', 'diego.herrera', '3209981122'],
  ['Paula Andrea Suárez León', 'paula.suarez', '3124478890'],
  ['Santiago Ramírez Ortiz', 'santiago.ramirez', '3165523344'],
  ['Natalia Jiménez Cárdenas', 'natalia.jimenez', '3051127788'],
  ['Felipe Andrés Molina Rey', 'felipe.molina', '3176639900'],
  ['Daniela Vega Quintero', 'daniela.vega', '3142285566'],
  ['Óscar Iván Guerrero Peña', 'oscar.guerrero', '3008871234'],
  ['Laura Sofía Mendoza Arias', 'laura.mendoza', '3193346677'],
  ['Camila Andrea Navarro Soto', 'camila.navarro', '3117754321'],
  ['Ricardo José Barrios Amaya', 'ricardo.barrios', '3225561199'],
  ['Valeria Cuadros Maestre', 'valeria.cuadros', '3046672288'],
];

// [nombre, especie, raza, sexo, color, peso kg, años de edad, alergias, condiciones]
const MASCOTAS = [
  ['Max', 'Canino', 'Labrador retriever', 'macho', 'Dorado', 29.5, 5, null, null],
  ['Milo', 'Felino', 'Criollo / mestizo', 'macho', 'Atigrado gris', 4.3, 3, null, null],
  ['Rocky', 'Canino', 'Bulldog francés', 'macho', 'Atigrado', 12.1, 4, 'Alergia al pollo', 'Dermatitis atópica'],
  ['Nala', 'Canino', 'Golden retriever', 'hembra', 'Dorado claro', 27.0, 6, null, null],
  ['Simba', 'Felino', 'Persa', 'macho', 'Crema', 5.1, 7, null, 'Enfermedad renal en control'],
  ['Coco', 'Canino', 'Shih tzu', 'macho', 'Blanco y café', 6.4, 2, null, null],
  ['Lola', 'Canino', 'Criollo / mestizo', 'hembra', 'Negro', 14.8, 8, null, 'Artrosis leve'],
  ['Toby', 'Canino', 'Beagle', 'macho', 'Tricolor', 11.7, 3, null, null],
  ['Kira', 'Canino', 'Pastor alemán', 'hembra', 'Negro y fuego', 31.2, 4, null, null],
  ['Mía', 'Felino', 'Siamés', 'hembra', 'Crema con puntas café', 3.8, 2, null, null],
  ['Bruno', 'Canino', 'Rottweiler', 'macho', 'Negro y fuego', 42.0, 5, null, null],
  ['Pelusa', 'Felino', 'Criollo / mestizo', 'hembra', 'Blanco', 3.5, 9, 'Alergia a la penicilina', null],
  ['Zeus', 'Canino', 'Husky siberiano', 'macho', 'Gris y blanco', 24.6, 3, null, null],
  ['Canela', 'Canino', 'Cocker spaniel', 'hembra', 'Canela', 13.2, 6, null, 'Otitis recurrente'],
  ['Pipo', 'Ave', 'Periquito australiano', 'macho', 'Verde y amarillo', 0.04, 2, null, null],
  ['Luna', 'Canino', 'Pomerania', 'hembra', 'Naranja', 3.1, 1, null, null],
  ['Tommy', 'Canino', 'Schnauzer', 'macho', 'Sal y pimienta', 8.3, 7, null, null],
  ['Nina', 'Felino', 'Maine coon', 'hembra', 'Café atigrado', 6.2, 4, null, null],
  ['Thor', 'Canino', 'Pitbull', 'macho', 'Azul', 26.4, 3, null, null],
  ['Manchas', 'Canino', 'Dálmata', 'macho', 'Blanco con negro', 23.8, 5, null, null],
  ['Kiwi', 'Ave', 'Cacatúa', 'hembra', 'Blanco', 0.35, 6, null, null],
  ['Princesa', 'Canino', 'Chihuahua', 'hembra', 'Café claro', 2.4, 10, null, 'Soplo cardíaco grado II'],
  ['Oreo', 'Felino', 'Criollo / mestizo', 'macho', 'Blanco y negro', 4.9, 1, null, null],
  ['Bella', 'Canino', 'Caniche (poodle)', 'hembra', 'Blanco', 5.6, 4, null, null],
  ['Rex', 'Canino', 'Bóxer', 'macho', 'Leonado', 28.9, 6, null, null],
  ['Copito', 'Otro', 'Conejo', 'macho', 'Blanco', 1.8, 2, null, null],
];

const MOTIVOS = {
  'Consulta médica': ['Control general anual', 'Decaimiento y poco apetito', 'Vómito desde ayer', 'Revisión de piel y picazón', 'Cojera en la pata trasera', 'Tos seca en las noches'],
  Vacunación: ['Refuerzo anual', 'Vacuna antirrábica', 'Esquema de cachorro, segunda dosis', 'Vacuna triple felina'],
  Desparasitación: ['Desparasitación trimestral', 'Control de pulgas y garrapatas', 'Desparasitación interna'],
  'Laboratorio clínico': ['Cuadro hemático de control', 'Perfil renal', 'Exámenes prequirúrgicos', 'Coprológico'],
  Radiología: ['Radiografía de cadera', 'Radiografía de tórax', 'Control de fractura'],
  Cirugía: ['Esterilización', 'Retiro de puntos', 'Valoración prequirúrgica', 'Extracción de masa cutánea'],
  'Profilaxis dental': ['Limpieza dental', 'Mal aliento y sarro'],
  Endoscopia: ['Ingesta de cuerpo extraño', 'Vómito crónico en estudio'],
  Oncología: ['Seguimiento de tratamiento', 'Valoración de masa en mama'],
};

const ADMIN_VALLEDUPAR = ['Jorge Luis Castro Maestre', 'jorge.castro', '3015567788'];
const MEDICA_BUCARAMANGA = {
  nombre: 'Sofía Ramírez Gómez',
  usuario: 'sofia.ramirez',
  telefono: '3112234455',
  documento: '1098765432',
  biografia: 'Médica veterinaria con énfasis en medicina preventiva y bienestar animal.',
  servicios: ['Vacunación', 'Desparasitación', 'Consulta médica', 'Profilaxis dental'],
};

// --- utilidades de fecha (hora local, sin zona) --------------------------
const dosDigitos = (n) => String(n).padStart(2, '0');
const comoFecha = (d) => `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
const comoMomento = (d) => `${comoFecha(d)} ${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}:00`;
const minutos = (hora) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));

async function yaHayDemo(cliente) {
  const r = await cliente.query('SELECT COUNT(*)::int AS n FROM usuario WHERE correo LIKE $1', [`%${DOMINIO}`]);
  return r.rows[0].n;
}

// ------------------------------------------------------------ cargar
async function cargar() {
  const cliente = await pool.connect();
  try {
    if (await yaHayDemo(cliente)) {
      console.log('Ya hay datos de ejemplo cargados. Ejecuta primero "npm run demo:quitar" si quieres volver a cargarlos.');
      return;
    }
    await cliente.query('BEGIN');
    const hash = await bcrypt.hash(CONTRASENA_DEMO, 10);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const sedes = (await cliente.query('SELECT id, ciudad, codigo FROM sede WHERE activo ORDER BY es_principal DESC')).rows;
    const bucaramanga = sedes.find((s) => s.ciudad === 'Bucaramanga');
    const valledupar = sedes.find((s) => s.ciudad === 'Valledupar');
    if (!bucaramanga || !valledupar) throw new Error('No se encontraron las sedes Bucaramanga y Valledupar.');

    // --- personal de ejemplo: administrador de Valledupar y una medica en Bucaramanga
    await cliente.query(
      `INSERT INTO usuario (nombre_completo, correo, contrasena_hash, rol, sede_id, telefono, creado_en)
       VALUES ($1, $2, $3, 'administrador', $4, $5, NOW() - INTERVAL '70 days')`,
      [ADMIN_VALLEDUPAR[0], ADMIN_VALLEDUPAR[1] + DOMINIO, hash, valledupar.id, ADMIN_VALLEDUPAR[2]]
    );
    const medica = (
      await cliente.query(
        `INSERT INTO usuario (nombre_completo, correo, contrasena_hash, rol, sede_id, telefono, documento, biografia, creado_en)
         VALUES ($1, $2, $3, 'veterinario', $4, $5, $6, $7, NOW() - INTERVAL '70 days') RETURNING id`,
        [MEDICA_BUCARAMANGA.nombre, MEDICA_BUCARAMANGA.usuario + DOMINIO, hash, bucaramanga.id, MEDICA_BUCARAMANGA.telefono, MEDICA_BUCARAMANGA.documento, MEDICA_BUCARAMANGA.biografia]
      )
    ).rows[0].id;
    await cliente.query(
      'INSERT INTO servicio_medico (servicio_id, medico_id) SELECT id, $1 FROM servicio WHERE nombre = ANY($2)',
      [medica, MEDICA_BUCARAMANGA.servicios]
    );
    await cliente.query(
      'INSERT INTO usuario_especialidad (usuario_id, categoria_id) SELECT DISTINCT $1::uuid, categoria_id FROM servicio WHERE nombre = ANY($2)',
      [medica, MEDICA_BUCARAMANGA.servicios]
    );

    // --- clientes y mascotas
    const clientes = [];
    for (const [nombre, usuario, telefono] of CLIENTES) {
      const dias = entero(12, 85);
      const fila = await cliente.query(
        `INSERT INTO usuario (nombre_completo, correo, contrasena_hash, rol, telefono, creado_en)
         VALUES ($1, $2, $3, 'cliente', $4, NOW() - ($5 || ' days')::interval) RETURNING id`,
        [nombre, usuario + DOMINIO, hash, telefono, dias]
      );
      clientes.push({ id: fila.rows[0].id, nombre, dias, sede: clientes.length % 3 === 2 ? valledupar : bucaramanga });
    }
    const mascotas = [];
    for (let i = 0; i < MASCOTAS.length; i += 1) {
      const [nombre, especie, raza, sexo, color, peso, edad, alergias, condiciones] = MASCOTAS[i];
      // Reparto: cada cliente tiene al menos una; los primeros, dos.
      const dueno = clientes[i % clientes.length];
      const nacimiento = new Date(hoy);
      nacimiento.setFullYear(nacimiento.getFullYear() - edad);
      nacimiento.setDate(nacimiento.getDate() - entero(0, 300));
      const fila = await cliente.query(
        `INSERT INTO mascota (cliente_id, nombre, especie, raza, sexo, color, peso_kg, fecha_nacimiento, alergias, condiciones_medicas, creado_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() - ($11 || ' days')::interval) RETURNING id`,
        [dueno.id, nombre, especie, raza, sexo, color, peso, comoFecha(nacimiento), alergias, condiciones, dueno.dias]
      );
      mascotas.push({ id: fila.rows[0].id, cliente: dueno });
    }

    // --- lo que el sistema real permite: horario de cada sede y que medico presta que
    const horarios = (await cliente.query(`SELECT sede_id, dia_semana, to_char(hora_inicio, 'HH24:MI') AS abre, to_char(hora_fin, 'HH24:MI') AS cierra FROM horario_atencion`)).rows;
    const medicos = (
      await cliente.query(
        `SELECT u.id, u.sede_id, array_agg(sv.id) AS servicios, array_agg(sv.nombre) AS nombres
         FROM usuario u JOIN servicio_medico sm ON sm.medico_id = u.id JOIN servicio sv ON sv.id = sm.servicio_id AND sv.activo
         WHERE u.rol = 'veterinario' AND u.activo GROUP BY u.id, u.sede_id`
      )
    ).rows;
    const ocupado = new Set((await cliente.query(`SELECT medico_id, to_char(fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS momento FROM cita WHERE estado = 'agendada'`)).rows.map((c) => `${c.medico_id}|${c.momento}`));
    const mascotaOcupada = new Set();

    // --- citas: de hace 8 semanas a dentro de 3
    const citas = [];
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() - SEMANAS_ATRAS * 7);
    const fin = new Date(hoy);
    fin.setDate(fin.getDate() + SEMANAS_ADELANTE * 7);
    for (let dia = new Date(inicio); dia <= fin; dia.setDate(dia.getDate() + 1)) {
      const distancia = Math.round((dia - hoy) / 86400000);
      for (const sede of [bucaramanga, valledupar]) {
        const horario = horarios.find((h) => h.sede_id === sede.id && h.dia_semana === dia.getDay());
        const delaSede = medicos.filter((m) => m.sede_id === sede.id);
        if (!horario || delaSede.length === 0) continue;
        const principal = sede.id === bucaramanga.id;
        // Mas movimiento en la sede principal y hoy; menos mientras mas lejos en el futuro.
        let cuantas;
        if (distancia === 0) cuantas = principal ? 7 : 4;
        else if (distancia < 0) cuantas = principal ? entero(2, 5) : entero(1, 3);
        else cuantas = Math.max(0, (principal ? entero(1, 4) : entero(0, 2)) - Math.floor(distancia / 8));
        const franjas = [];
        for (let m = minutos(horario.abre); m + 30 <= minutos(horario.cierra); m += 30) franjas.push(m);

        for (let n = 0; n < cuantas; n += 1) {
          // Hasta 12 intentos de encontrar medico + hora + mascota libres.
          for (let intento = 0; intento < 12; intento += 1) {
            const medico = elegir(delaSede);
            const indice = entero(0, medico.servicios.length - 1);
            const franja = elegir(franjas);
            const momento = new Date(dia);
            momento.setHours(Math.floor(franja / 60), franja % 60, 0, 0);
            const texto = comoMomento(momento);
            const candidatas = mascotas.filter((m) => m.cliente.sede.id === sede.id);
            const mascota = elegir(candidatas.length ? candidatas : mascotas);
            if (ocupado.has(`${medico.id}|${texto}`) || mascotaOcupada.has(`${mascota.id}|${texto}`)) continue;
            // La cita se agenda despues de que el cliente se registro.
            const antelacion = Math.min(entero(1, 9), Math.max(1, mascota.cliente.dias - 1 + distancia));
            const creada = new Date(momento);
            creada.setDate(creada.getDate() - antelacion);
            creada.setHours(entero(7, 20), entero(0, 59), 0, 0);
            const limite = new Date();
            const cancelada = azar() < (distancia < 0 ? 0.12 : distancia === 0 ? 0 : 0.08);
            if (!cancelada) ocupado.add(`${medico.id}|${texto}`);
            mascotaOcupada.add(`${mascota.id}|${texto}`);
            citas.push({
              sede,
              medico: medico.id,
              servicio: medico.servicios[indice],
              motivo: elegir(MOTIVOS[medico.nombres[indice]] || ['Control']),
              mascota,
              momento: texto,
              creada: creada > limite ? limite : creada,
              estado: cancelada ? 'cancelada' : 'agendada',
            });
            break;
          }
        }
      }
    }

    // --- codigos: siguen el consecutivo real de cada sede, en orden de creacion
    citas.sort((a, b) => a.creada - b.creada);
    const anio = hoy.getFullYear();
    const ultimo = {};
    for (const sede of [bucaramanga, valledupar]) {
      const r = await cliente.query('SELECT ultimo FROM consecutivo_cita WHERE sede_id = $1 AND anio = $2', [sede.id, anio]);
      ultimo[sede.id] = r.rows[0]?.ultimo ?? 0;
    }
    for (const cita of citas) {
      ultimo[cita.sede.id] += 1;
      const codigo = `CV-${cita.sede.codigo}-${anio}-${String(ultimo[cita.sede.id]).padStart(5, '0')}`;
      await cliente.query(
        `INSERT INTO cita (cliente_id, sede_id, servicio_id, medico_id, fecha_hora, mascota_id, motivo, codigo, estado, creado_en, actualizado_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)`,
        [cita.mascota.cliente.id, cita.sede.id, cita.servicio, cita.medico, cita.momento, cita.mascota.id, cita.motivo, codigo, cita.estado, comoMomento(cita.creada)]
      );
    }
    for (const sede of [bucaramanga, valledupar]) {
      await cliente.query(
        `INSERT INTO consecutivo_cita (sede_id, anio, ultimo) VALUES ($1, $2, $3)
         ON CONFLICT (sede_id, anio) DO UPDATE SET ultimo = EXCLUDED.ultimo`,
        [sede.id, anio, ultimo[sede.id]]
      );
    }

    await cliente.query('COMMIT');
    const deHoy = citas.filter((c) => c.momento.startsWith(comoFecha(hoy)));
    console.log('Datos de ejemplo cargados:');
    console.log(`  ${CLIENTES.length} clientes, ${MASCOTAS.length} mascotas, 1 administrador de sede (Valledupar) y 1 médica (Bucaramanga).`);
    console.log(`  ${citas.length} citas: ${citas.filter((c) => c.estado === 'cancelada').length} canceladas, ${deHoy.length} para hoy.`);
    console.log(`  Todas las cuentas de ejemplo terminan en ${DOMINIO} y entran con la contraseña ${CONTRASENA_DEMO}.`);
  } catch (error) {
    await cliente.query('ROLLBACK').catch(() => {});
    console.error('No se cargó nada. Error:', error.message);
    process.exitCode = 1;
  } finally {
    cliente.release();
    await pool.end();
  }
}

// ------------------------------------------------------------ quitar
async function quitar() {
  const cliente = await pool.connect();
  try {
    if (!(await yaHayDemo(cliente))) {
      console.log('No hay datos de ejemplo que quitar.');
      return;
    }
    await cliente.query('BEGIN');
    const demo = `SELECT id FROM usuario WHERE correo LIKE '%${DOMINIO}'`;
    // Citas de clientes de ejemplo, o atendidas por la medica de ejemplo.
    const citas = await cliente.query(`DELETE FROM cita WHERE cliente_id IN (${demo}) OR medico_id IN (${demo})`);
    await cliente.query(`DELETE FROM recordatorio WHERE cliente_id IN (${demo}) OR medico_id IN (${demo}) OR mascota_id IN (SELECT id FROM mascota WHERE cliente_id IN (${demo}))`);
    const mascotas = await cliente.query(`DELETE FROM mascota WHERE cliente_id IN (${demo})`);
    for (const tabla of ['servicio_medico|medico_id', 'usuario_especialidad|usuario_id', 'horario_medico|medico_id', 'bloqueo_medico|medico_id', 'codigo_recuperacion|usuario_id', 'verificacion_correo|usuario_id']) {
      const [nombre, columna] = tabla.split('|');
      await cliente.query(`DELETE FROM ${nombre} WHERE ${columna} IN (${demo})`);
    }
    const cuentas = await cliente.query(`DELETE FROM usuario WHERE correo LIKE '%${DOMINIO}'`);
    await cliente.query('COMMIT');
    console.log(`Datos de ejemplo quitados: ${cuentas.rowCount} cuentas, ${mascotas.rowCount} mascotas y ${citas.rowCount} citas.`);
    console.log('El contador de códigos de cita no retrocede: los códigos usados por las citas de ejemplo no se reutilizan.');
  } catch (error) {
    await cliente.query('ROLLBACK').catch(() => {});
    console.error('No se quitó nada. Error:', error.message);
    process.exitCode = 1;
  } finally {
    cliente.release();
    await pool.end();
  }
}

const modo = process.argv[2];
if (modo === 'cargar') cargar();
else if (modo === 'quitar') quitar();
else console.log('Uso: node src/scripts/datosDemo.js cargar | quitar');
