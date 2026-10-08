// tests/camposAdicionales.test.js
// Logica pura de los campos personalizados administrables: claves,
// validacion de valores por tipo y la regla "nada se elimina".

const {
  generarClave,
  claveUnica,
  validarCamposAdicionales,
  crearOpciones,
  fusionarOpciones,
} = require('../src/utils/camposAdicionales');

const def = (extra) => ({ clave: 'campo', etiqueta: 'Campo', tipo: 'texto_corto', requerido: false, activo: true, opciones: [], ...extra });

describe('generarClave / claveUnica', () => {
  test('quita tildes, espacios y simbolos', () => {
    expect(generarClave('Certificado de vacunación (2026)')).toBe('certificado_de_vacunacion_2026');
  });

  test('no repite una clave existente', () => {
    expect(claveUnica('microchip', [])).toBe('microchip');
    expect(claveUnica('microchip', ['microchip', 'microchip_2'])).toBe('microchip_3');
    expect(claveUnica('', [])).toBe('campo');
  });
});

describe('validarCamposAdicionales', () => {
  test('normaliza cada tipo', () => {
    const definiciones = [
      def({ clave: 'chip', tipo: 'texto_corto' }),
      def({ clave: 'notas', tipo: 'texto_largo' }),
      def({ clave: 'edad', tipo: 'numero' }),
      def({ clave: 'vacuna', tipo: 'fecha' }),
      def({ clave: 'esterilizado', tipo: 'booleano' }),
      def({ clave: 'estado', tipo: 'seleccion', opciones: [{ valor: 'al_dia', etiqueta: 'Al día', activo: true }] }),
    ];
    const resultado = validarCamposAdicionales(
      definiciones,
      { chip: '  ABC123 ', notas: 'Tranquilo', edad: '3,5', vacuna: '2026-05-10', esterilizado: false, estado: 'al_dia' },
      {}
    );
    expect(resultado.valores).toEqual({
      chip: 'ABC123',
      notas: 'Tranquilo',
      edad: 3.5,
      vacuna: '2026-05-10',
      esterilizado: false,
      estado: 'al_dia',
    });
  });

  test('rechaza valores del tipo equivocado con el nombre del campo', () => {
    expect(validarCamposAdicionales([def({ tipo: 'numero', etiqueta: 'Edad' })], { campo: 'tres' }, {}).error).toBe('"Edad" debe ser un número.');
    expect(validarCamposAdicionales([def({ tipo: 'fecha' })], { campo: '10/05/2026' }, {}).error).toMatch(/fecha válida/);
    expect(validarCamposAdicionales([def({ tipo: 'booleano' })], { campo: 'si' }, {}).error).toMatch(/Sí o No/);
    expect(validarCamposAdicionales([def({ tipo: 'texto_corto' })], { campo: 'a'.repeat(121) }, {}).error).toMatch(/120 caracteres/);
  });

  test('un campo requerido vacio es un error; uno opcional vacio se quita', () => {
    expect(validarCamposAdicionales([def({ requerido: true, etiqueta: 'Microchip' })], { campo: '  ' }, {}).error).toBe('"Microchip" es obligatorio.');
    expect(validarCamposAdicionales([def({ requerido: true, etiqueta: 'Microchip' })], {}, {}).error).toBe('"Microchip" es obligatorio.');
    expect(validarCamposAdicionales([def()], { campo: '' }, { campo: 'viejo' }).valores).toEqual({});
  });

  test('un requerido que ya tenia valor no se exige de nuevo si no viene', () => {
    const resultado = validarCamposAdicionales([def({ requerido: true })], {}, { campo: 'guardado' });
    expect(resultado.valores).toEqual({ campo: 'guardado' });
  });

  test('un campo DESACTIVADO conserva su valor y no se puede cambiar', () => {
    const definiciones = [def({ clave: 'viejo', activo: false, requerido: true })];
    const resultado = validarCamposAdicionales(definiciones, { viejo: 'intento de cambio' }, { viejo: 'valor historico' });
    expect(resultado.valores).toEqual({ viejo: 'valor historico' });
  });

  test('un campo desactivado y requerido no bloquea registros nuevos', () => {
    expect(validarCamposAdicionales([def({ activo: false, requerido: true })], {}, {}).valores).toEqual({});
  });

  test('los campos de tipo archivo no se tocan por este medio', () => {
    const adjunto = { url: '/uploads/adjuntos/a.pdf', nombre: 'a.pdf', tipo: 'application/pdf' };
    const resultado = validarCamposAdicionales([def({ clave: 'certificado', tipo: 'archivo', requerido: true })], { certificado: 'x' }, { certificado: adjunto });
    expect(resultado.valores).toEqual({ certificado: adjunto });
  });

  test('ignora claves que no son campos definidos y conserva las antiguas', () => {
    const resultado = validarCamposAdicionales([def()], { campo: 'a', inventada: 'b' }, { de_antes: 1 });
    expect(resultado.valores).toEqual({ de_antes: 1, campo: 'a' });
  });

  test('seleccion: no acepta una opcion inexistente ni una desactivada, salvo que ya fuera el valor', () => {
    const definicion = def({
      tipo: 'seleccion',
      opciones: [
        { valor: 'a', etiqueta: 'A', activo: true },
        { valor: 'b', etiqueta: 'B', activo: false },
      ],
    });
    expect(validarCamposAdicionales([definicion], { campo: 'z' }, {}).error).toMatch(/opciones disponibles/);
    expect(validarCamposAdicionales([definicion], { campo: 'b' }, {}).error).toMatch(/opciones disponibles/);
    expect(validarCamposAdicionales([definicion], { campo: 'b' }, { campo: 'b' }).valores).toEqual({ campo: 'b' });
  });
});

describe('opciones de un campo de seleccion', () => {
  test('crearOpciones genera un valor estable por etiqueta y rechaza repetidas', () => {
    expect(crearOpciones(['Al día', ' Pendiente ']).opciones).toEqual([
      { valor: 'al_dia', etiqueta: 'Al día', activo: true },
      { valor: 'pendiente', etiqueta: 'Pendiente', activo: true },
    ]);
    expect(crearOpciones(['Sí', 'sí']).error).toMatch(/repetida/);
  });

  test('fusionarOpciones nunca elimina: renombra, desactiva y agrega', () => {
    const actuales = [
      { valor: 'al_dia', etiqueta: 'Al día', activo: true },
      { valor: 'pendiente', etiqueta: 'Pendiente', activo: true },
    ];
    // Llega solo una de las existentes (renombrada y desactivada) y una nueva.
    const { opciones } = fusionarOpciones(actuales, [
      { valor: 'pendiente', etiqueta: 'Por aplicar', activo: false },
      { etiqueta: 'Vencida' },
    ]);
    expect(opciones).toEqual([
      { valor: 'al_dia', etiqueta: 'Al día', activo: true },
      { valor: 'pendiente', etiqueta: 'Por aplicar', activo: false },
      { valor: 'vencida', etiqueta: 'Vencida', activo: true },
    ]);
  });
});
