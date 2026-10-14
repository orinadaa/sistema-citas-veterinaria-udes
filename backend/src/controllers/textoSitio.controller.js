// controllers/textoSitio.controller.js
// Textos de marca de la pagina publica (/api/textos). Leerlos es publico; los
// cambia solo el superadministrador, desde Pagina web > Textos.
const { pool } = require('../config/db');
const { TEXTOS_SITIO, POR_CLAVE, limpiarTexto } = require('../utils/textosSitio');

async function leerCambiados() {
  const resultado = await pool.query('SELECT clave, valor, actualizado_en FROM texto_sitio');
  return Object.fromEntries(resultado.rows.filter((fila) => POR_CLAVE[fila.clave]).map((fila) => [fila.clave, fila]));
}

// { clave: texto que se ve } con el original donde no hay cambio.
function vigentes(cambiados) {
  return Object.fromEntries(TEXTOS_SITIO.map((t) => [t.clave, cambiados[t.clave]?.valor ?? t.original]));
}

// GET /api/textos — publico
async function obtenerPublicos(req, res, next) {
  try {
    return res.status(200).json({ textos: vigentes(await leerCambiados()) });
  } catch (error) {
    next(error);
  }
}

// GET /api/textos/admin — la lista completa, con el original de cada texto
function paraAdmin(cambiados) {
  return TEXTOS_SITIO.map((t) => ({
    clave: t.clave,
    seccion: t.seccion,
    etiqueta: t.etiqueta,
    maximo: t.maximo,
    original: t.original,
    vacioPermitido: Boolean(t.vacioPermitido),
    valor: cambiados[t.clave]?.valor ?? t.original,
    personalizado: Boolean(cambiados[t.clave]),
    actualizadoEn: cambiados[t.clave]?.actualizado_en ?? null,
  }));
}

async function obtenerAdmin(req, res, next) {
  try {
    return res.status(200).json({ textos: paraAdmin(await leerCambiados()) });
  } catch (error) {
    next(error);
  }
}

// PUT /api/textos — { textos: { clave: valor } }. Solo superadministrador.
// Un valor igual al original (o null) borra el cambio y vuelve al original.
async function actualizar(req, res, next) {
  try {
    const entrada = req.body?.textos;
    if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada) || Object.keys(entrada).length === 0) {
      return res.status(400).json({ mensaje: 'Envía al menos un texto para actualizar.' });
    }
    const guardar = [];
    const restaurar = [];
    for (const [clave, valorCrudo] of Object.entries(entrada)) {
      const definicion = POR_CLAVE[clave];
      if (!definicion) return res.status(400).json({ mensaje: 'Uno de los textos no se puede editar.' });
      if (valorCrudo === null) {
        restaurar.push(clave);
        continue;
      }
      if (typeof valorCrudo !== 'string') return res.status(400).json({ mensaje: `"${definicion.etiqueta}" debe ser texto.` });
      const valor = limpiarTexto(valorCrudo);
      if (!valor && !definicion.vacioPermitido) {
        return res.status(400).json({ mensaje: `"${definicion.etiqueta}" no puede quedar vacío. Usa "Restaurar texto original" si quieres volver al de siempre.` });
      }
      if (valor.length > definicion.maximo) {
        return res.status(400).json({ mensaje: `"${definicion.etiqueta}" admite hasta ${definicion.maximo} caracteres.` });
      }
      if (valor === definicion.original) restaurar.push(clave);
      else guardar.push([clave, valor]);
    }

    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      for (const [clave, valor] of guardar) {
        await cliente.query(
          `INSERT INTO texto_sitio (clave, valor, actualizado_por) VALUES ($1, $2, $3)
           ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, actualizado_por = EXCLUDED.actualizado_por, actualizado_en = NOW()`,
          [clave, valor, req.usuario.id]
        );
      }
      if (restaurar.length) await cliente.query('DELETE FROM texto_sitio WHERE clave = ANY($1)', [restaurar]);
      await cliente.query('COMMIT');
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw error;
    } finally {
      cliente.release();
    }

    return res.status(200).json({ textos: paraAdmin(await leerCambiados()) });
  } catch (error) {
    next(error);
  }
}

module.exports = { obtenerPublicos, obtenerAdmin, actualizar };
