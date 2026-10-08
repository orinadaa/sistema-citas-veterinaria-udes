// utils/camposAdicionales.js
// Logica pura (sin base de datos) de los campos personalizados
// administrables, ver database/incremento_7a_campos_personalizados.sql.
// La usan el controlador de definiciones y el de cada entidad que guarda
// valores (hoy, mascota).

// Entidades que admiten campos personalizados. Para sumar otra: agregar
// su columna JSONB `campos_adicionales`, registrarla aca y validar sus
// valores en su controlador con validarCamposAdicionales().
const ENTIDADES = { mascota: 'Mascota' };

const TIPOS = ['texto_corto', 'texto_largo', 'numero', 'fecha', 'booleano', 'seleccion', 'archivo'];
const LARGO_TEXTO_CORTO = 120;
const LARGO_TEXTO_LARGO = 1000;
const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// "Certificado de vacunación" -> "certificado_de_vacunacion". Es la llave
// del JSON: se genera una sola vez y no cambia aunque se corrija la etiqueta.
function generarClave(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
}

// Clave que no choque con las existentes: agrega _2, _3...
function claveUnica(base, existentes) {
  const usadas = new Set(existentes);
  const raiz = base || 'campo';
  if (!usadas.has(raiz)) return raiz;
  let n = 2;
  while (usadas.has(`${raiz}_${n}`)) n += 1;
  return `${raiz}_${n}`;
}

function estaVacio(valor) {
  return valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '');
}

// Valida y normaliza UN valor segun su definicion.
// Devuelve { valor } o { error }.
function normalizarValor(definicion, bruto, previo) {
  const { etiqueta, tipo } = definicion;
  if (tipo === 'texto_corto' || tipo === 'texto_largo') {
    if (typeof bruto !== 'string') return { error: `"${etiqueta}" debe ser un texto.` };
    const maximo = tipo === 'texto_corto' ? LARGO_TEXTO_CORTO : LARGO_TEXTO_LARGO;
    const texto = bruto.trim();
    if (texto.length > maximo) return { error: `"${etiqueta}" no puede pasar de ${maximo} caracteres.` };
    return { valor: texto };
  }
  if (tipo === 'numero') {
    const numero = typeof bruto === 'number' ? bruto : Number(String(bruto).replace(',', '.'));
    if (!Number.isFinite(numero)) return { error: `"${etiqueta}" debe ser un número.` };
    return { valor: numero };
  }
  if (tipo === 'fecha') {
    if (typeof bruto !== 'string' || !PATRON_FECHA.test(bruto) || Number.isNaN(Date.parse(bruto))) {
      return { error: `"${etiqueta}" debe ser una fecha válida.` };
    }
    return { valor: bruto };
  }
  if (tipo === 'booleano') {
    if (typeof bruto !== 'boolean') return { error: `"${etiqueta}" debe ser Sí o No.` };
    return { valor: bruto };
  }
  if (tipo === 'seleccion') {
    const opcion = (definicion.opciones || []).find((o) => o.valor === bruto);
    // Una opcion desactivada solo se acepta si ya era el valor guardado.
    if (!opcion || (!opcion.activo && bruto !== previo)) {
      return { error: `"${etiqueta}": elige una de las opciones disponibles.` };
    }
    return { valor: bruto };
  }
  return { error: `"${etiqueta}" no se puede guardar por este medio.` };
}

// Valida los valores que llegan de un formulario contra las definiciones
// de la entidad y arma el JSON a guardar.
// - Solo se procesan campos ACTIVOS: los valores de campos desactivados
//   (y cualquier clave antigua) se conservan tal cual, nunca se pierden.
// - Los de tipo archivo no llegan por aca: los maneja el endpoint de
//   adjuntos de la entidad; su valor previo se conserva.
// - Un campo que no viene en `entrantes` se deja como estaba (edicion
//   parcial); si es requerido y no tiene valor, es un error.
// Devuelve { valores } o { error }.
function validarCamposAdicionales(definiciones, entrantes, previos) {
  const valores = { ...(previos || {}) };
  const llegan = entrantes && typeof entrantes === 'object' && !Array.isArray(entrantes) ? entrantes : {};

  for (const definicion of definiciones || []) {
    if (!definicion.activo || definicion.tipo === 'archivo') continue;
    const { clave, etiqueta, requerido } = definicion;
    const viene = Object.prototype.hasOwnProperty.call(llegan, clave);
    const bruto = viene ? llegan[clave] : valores[clave];

    if (estaVacio(bruto)) {
      if (requerido) return { error: `"${etiqueta}" es obligatorio.` };
      delete valores[clave];
      continue;
    }
    if (!viene) continue;

    const resultado = normalizarValor(definicion, bruto, valores[clave]);
    if (resultado.error) return { error: resultado.error };
    if (estaVacio(resultado.valor)) {
      if (requerido) return { error: `"${etiqueta}" es obligatorio.` };
      delete valores[clave];
    } else {
      valores[clave] = resultado.valor;
    }
  }
  return { valores };
}

// Opciones de un campo de seleccion al crearlo: lista de etiquetas ->
// [{ valor, etiqueta, activo }]. Devuelve { opciones } o { error }.
function crearOpciones(etiquetas) {
  if (!Array.isArray(etiquetas)) return { error: 'Las opciones deben ser una lista.' };
  const opciones = [];
  for (const bruta of etiquetas) {
    const etiqueta = typeof bruta === 'string' ? bruta.trim() : typeof bruta?.etiqueta === 'string' ? bruta.etiqueta.trim() : '';
    if (!etiqueta) continue;
    if (etiqueta.length > 60) return { error: 'Cada opción puede tener máximo 60 caracteres.' };
    if (opciones.some((o) => o.etiqueta.toLowerCase() === etiqueta.toLowerCase())) {
      return { error: `La opción "${etiqueta}" está repetida.` };
    }
    opciones.push({
      valor: claveUnica(generarClave(etiqueta), opciones.map((o) => o.valor)),
      etiqueta,
      activo: bruta?.activo !== false,
    });
  }
  return { opciones };
}

// Opciones al EDITAR un campo de seleccion: nunca se elimina ninguna.
// Las que ya existian conservan su `valor` (pueden cambiar de etiqueta o
// de activo); las que no vengan en la lista quedan como estaban; las
// nuevas (sin `valor`) se agregan al final.
function fusionarOpciones(actuales, entrantes) {
  if (!Array.isArray(entrantes)) return { error: 'Las opciones deben ser una lista.' };
  const resultado = (actuales || []).map((o) => ({ ...o }));
  for (const bruta of entrantes) {
    const etiqueta = typeof bruta?.etiqueta === 'string' ? bruta.etiqueta.trim() : '';
    if (!etiqueta) continue;
    if (etiqueta.length > 60) return { error: 'Cada opción puede tener máximo 60 caracteres.' };
    const existente = bruta.valor ? resultado.find((o) => o.valor === bruta.valor) : null;
    const repetida = resultado.some((o) => o !== existente && o.etiqueta.toLowerCase() === etiqueta.toLowerCase());
    if (repetida) return { error: `La opción "${etiqueta}" está repetida.` };
    if (existente) {
      existente.etiqueta = etiqueta;
      existente.activo = bruta.activo !== false;
    } else {
      resultado.push({
        valor: claveUnica(generarClave(etiqueta), resultado.map((o) => o.valor)),
        etiqueta,
        activo: bruta.activo !== false,
      });
    }
  }
  return { opciones: resultado };
}

module.exports = {
  ENTIDADES,
  TIPOS,
  generarClave,
  claveUnica,
  validarCamposAdicionales,
  crearOpciones,
  fusionarOpciones,
};
