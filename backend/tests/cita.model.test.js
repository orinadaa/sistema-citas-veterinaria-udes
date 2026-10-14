// tests/cita.model.test.js
// Agendar y reprogramar dentro de una transaccion: candados del medico y de
// la mascota, cruces comprobados antes de escribir y duracion guardada en la
// cita. La base se simula con un cliente que anota cada consulta.

jest.mock('../src/config/db', () => ({ pool: { connect: jest.fn(), query: jest.fn() } }));

const { pool } = require('../src/config/db');
const citaModel = require('../src/models/cita.model');

// Cliente simulado: `respuestas` decide que devuelve cada consulta segun su texto.
function clienteSimulado(respuestas = () => undefined) {
  const consultas = [];
  const cliente = {
    consultas,
    release: jest.fn(),
    query: jest.fn(async (sql, parametros) => {
      consultas.push({ sql: String(sql).replace(/\s+/g, ' ').trim(), parametros });
      return respuestas(String(sql), parametros) || { rows: [], rowCount: 0 };
    }),
  };
  pool.connect.mockResolvedValue(cliente);
  return cliente;
}
const textos = (cliente) => cliente.consultas.map((c) => c.sql);
const posicion = (cliente, fragmento) => textos(cliente).findIndex((sql) => sql.includes(fragmento));

const DATOS = { clienteId: 'cli-1', sedeId: 'sede-1', sedeCodigo: 'BGA', servicioId: 'srv-1', medicoId: 'med-1', fechaHora: new Date('2030-01-15T09:00:00'), mascotaId: 'masc-1', motivo: null, duracionMinutos: 60 };

beforeEach(() => jest.clearAllMocks());

describe('citaModel.crear', () => {
  const conExito = (sql) => {
    if (sql.includes('consecutivo_cita')) return { rows: [{ ultimo: 7 }], rowCount: 1 };
    if (sql.includes('INSERT INTO cita')) return { rows: [{ id: 'cita-1', codigo: 'CV-BGA-2030-00007' }], rowCount: 1 };
    return undefined;
  };

  test('toma el candado del medico y el de la mascota, en ese orden, antes de comprobar cruces', async () => {
    const cliente = clienteSimulado(conExito);
    await citaModel.crear(DATOS);

    const candados = cliente.consultas.filter((c) => c.sql.includes('pg_advisory_xact_lock'));
    expect(candados.map((c) => c.parametros[0])).toEqual(['medico:med-1', 'mascota:masc-1']);
    expect(posicion(cliente, 'BEGIN')).toBe(0);
    expect(posicion(cliente, 'pg_advisory_xact_lock')).toBeLessThan(posicion(cliente, 'c.medico_id = $1'));
    expect(posicion(cliente, 'c.mascota_id = $1')).toBeLessThan(posicion(cliente, 'INSERT INTO cita'));
    expect(textos(cliente).at(-1)).toBe('COMMIT');
    expect(cliente.release).toHaveBeenCalled();
  });

  test('guarda en la cita la duracion con la que se agenda', async () => {
    const cliente = clienteSimulado(conExito);
    await citaModel.crear(DATOS);

    const insercion = cliente.consultas.find((c) => c.sql.includes('INSERT INTO cita'));
    expect(insercion.sql).toContain('duracion_minutos');
    expect(insercion.parametros.at(-1)).toBe(60);
  });

  test('los cruces se miden con la duracion guardada en cada cita, no con la del servicio', async () => {
    const cliente = clienteSimulado(conExito);
    await citaModel.crear(DATOS);

    const cruce = cliente.consultas.find((c) => c.sql.includes('c.medico_id = $1'));
    expect(cruce.sql).toContain('GREATEST(c.duracion_minutos, 30)');
    expect(cruce.sql).not.toContain('JOIN servicio');
  });

  test('si la mascota ya tiene una cita que se cruza, no inserta y deshace la transaccion', async () => {
    const cliente = clienteSimulado((sql) => (sql.includes('c.mascota_id = $1') ? { rows: [{}], rowCount: 1 } : undefined));

    await expect(citaModel.crear(DATOS)).rejects.toMatchObject({ code: 'MASCOTA_OCUPADA' });
    expect(posicion(cliente, 'INSERT INTO cita')).toBe(-1);
    expect(textos(cliente).at(-1)).toBe('ROLLBACK');
    expect(cliente.release).toHaveBeenCalled();
  });

  test('si el medico ya tiene una cita que se cruza, responde con el codigo del indice unico', async () => {
    const cliente = clienteSimulado((sql) => (sql.includes('c.medico_id = $1') ? { rows: [{}], rowCount: 1 } : undefined));

    await expect(citaModel.crear(DATOS)).rejects.toMatchObject({ code: '23505' });
    expect(posicion(cliente, 'INSERT INTO cita')).toBe(-1);
    expect(textos(cliente).at(-1)).toBe('ROLLBACK');
  });
});

describe('citaModel.reprogramar', () => {
  const NUEVA = new Date('2030-01-16T10:00:00');
  const citaAgendada = (sql) => {
    if (sql.includes('FOR UPDATE')) return { rows: [{ medico_id: 'med-1', mascota_id: 'masc-1', duracion_minutos: 90 }], rowCount: 1 };
    if (sql.includes('UPDATE cita SET fecha_hora')) return { rows: [{ id: 'cita-1', fecha_hora: NUEVA }], rowCount: 1 };
    return undefined;
  };

  test('bloquea la cita, toma los candados y comprueba los cruces antes de moverla', async () => {
    const cliente = clienteSimulado(citaAgendada);
    const resultado = await citaModel.reprogramar('cita-1', NUEVA);

    expect(resultado).toMatchObject({ id: 'cita-1' });
    expect(posicion(cliente, 'FOR UPDATE')).toBeLessThan(posicion(cliente, 'pg_advisory_xact_lock'));
    expect(posicion(cliente, 'c.mascota_id = $1')).toBeLessThan(posicion(cliente, 'UPDATE cita SET fecha_hora'));
    expect(textos(cliente).at(-1)).toBe('COMMIT');
    // Usa la duracion guardada y no cuenta la propia cita como cruce.
    const cruce = cliente.consultas.find((c) => c.sql.includes('c.medico_id = $1'));
    expect(cruce.parametros).toEqual(['med-1', NUEVA, 90, 'cita-1']);
  });

  test('si otra cita se cruza con la nueva hora, no actualiza', async () => {
    const cliente = clienteSimulado((sql) => citaAgendada(sql) || (sql.includes('c.medico_id = $1') ? { rows: [{}], rowCount: 1 } : undefined));

    await expect(citaModel.reprogramar('cita-1', NUEVA)).rejects.toMatchObject({ code: '23505' });
    expect(posicion(cliente, 'UPDATE cita SET fecha_hora')).toBe(-1);
    expect(textos(cliente).at(-1)).toBe('ROLLBACK');
  });

  test('si la mascota tiene otra cita a esa hora, no actualiza', async () => {
    const cliente = clienteSimulado((sql) => citaAgendada(sql) || (sql.includes('c.mascota_id = $1') ? { rows: [{}], rowCount: 1 } : undefined));

    await expect(citaModel.reprogramar('cita-1', NUEVA)).rejects.toMatchObject({ code: 'MASCOTA_OCUPADA' });
    expect(posicion(cliente, 'UPDATE cita SET fecha_hora')).toBe(-1);
  });

  test('devuelve null si la cita ya no esta agendada', async () => {
    const cliente = clienteSimulado();
    expect(await citaModel.reprogramar('cita-1', NUEVA)).toBeNull();
    expect(posicion(cliente, 'UPDATE cita SET fecha_hora')).toBe(-1);
    expect(cliente.release).toHaveBeenCalled();
  });
});
