import { errorContrasenaNueva } from './contrasena.js';

const normalizar = (texto) => String(texto ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

let siguienteId = 1;

function tipoSemantico(campo) {
  const etiqueta = campo.labels?.[0]?.textContent || '';
  const texto = normalizar([
    campo.name,
    campo.id,
    campo.autocomplete,
    campo.getAttribute('aria-label'),
    etiqueta,
  ].join(' '));

  if (campo.type === 'email' || /\b(correo|email|e-mail)\b/.test(texto)) return 'correo';
  if (/\b(telefono|celular|movil|phone|tel)\b/.test(texto)) return 'telefono';
  if (/\b(documento|identidad|identificacion|cedula)\b/.test(texto)) return 'documento';
  return 'general';
}

function nombreCampo(campo) {
  const etiqueta = campo.labels?.[0]?.textContent?.replace(/\*/g, '').trim();
  return etiqueta || campo.getAttribute('aria-label') || campo.placeholder || campo.name || 'Este campo';
}

function debeIgnorarse(campo) {
  return campo.disabled
    || campo.readOnly
    || campo.dataset.omitirValidacion === 'true'
    || campo.closest('[aria-hidden="true"]')
    || ['hidden', 'button', 'submit', 'reset', 'image', 'range', 'color'].includes(campo.type);
}

function errorNativo(campo, nombre) {
  const validez = campo.validity;
  if (!validez || validez.valid) return null;
  if (validez.valueMissing) {
    return campo.type === 'checkbox'
      ? `${nombre} debe estar marcado para continuar.`
      : `El campo «${nombre}» es obligatorio.`;
  }
  if (validez.typeMismatch && campo.type === 'url') return `Escribe una dirección web válida para «${nombre}».`;
  if (validez.typeMismatch && campo.type === 'email') return 'Escribe un correo válido, por ejemplo nombre@dominio.com.';
  if (validez.patternMismatch) return campo.title || `Revisa el formato esperado para «${nombre}».`;
  if (validez.tooShort) return `«${nombre}» debe tener al menos ${campo.minLength} caracteres.`;
  if (validez.tooLong) return `«${nombre}» no puede superar ${campo.maxLength} caracteres.`;
  if (validez.rangeUnderflow) return `«${nombre}» debe ser igual o mayor que ${campo.min}.`;
  if (validez.rangeOverflow) return `«${nombre}» debe ser igual o menor que ${campo.max}.`;
  if (validez.stepMismatch || validez.badInput) return `Ingresa un valor válido para «${nombre}».`;
  return `Revisa el valor de «${nombre}».`;
}

export function mensajeValidacionCampo(campo) {
  if (!campo || debeIgnorarse(campo)) return null;
  const nombre = nombreCampo(campo);
  const valor = String(campo.value ?? '');
  const recortado = valor.trim();
  const tipo = tipoSemantico(campo);

  if (campo.required && (campo.type === 'checkbox' ? !campo.checked : !recortado)) {
    return campo.type === 'checkbox'
      ? `${nombre} debe estar marcado para continuar.`
      : `El campo «${nombre}» es obligatorio.`;
  }
  if (!recortado) return errorNativo(campo, nombre);

  // Contraseña nueva: las cinco reglas de utils/contrasena.js (las mismas del servidor).
  if (campo.dataset.contrasenaNueva === 'true') {
    const problema = errorContrasenaNueva(valor);
    if (problema) return problema;
  }

  if (tipo === 'correo') {
    const valido = recortado.length <= 150 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recortado);
    if (!valido) return 'Escribe un correo válido, por ejemplo nombre@dominio.com.';
  }
  if (tipo === 'telefono' && !/^\d{10}$/.test(recortado)) {
    return 'El teléfono debe contener exactamente 10 dígitos, sin espacios ni signos.';
  }
  if (tipo === 'documento' && !/^\d{1,20}$/.test(recortado)) {
    return 'El documento de identidad debe contener solo dígitos (máximo 20).';
  }

  return errorNativo(campo, nombre);
}

function idError(campo) {
  if (!campo.id) campo.id = `campo-validacion-${siguienteId++}`;
  return `${campo.id}-mensaje-validacion`;
}

function mostrarError(campo, mensaje) {
  const id = idError(campo);
  const grupo = campo.labels?.[0]?.parentElement || campo.parentElement;
  const alcance = campo.form || grupo;
  let aviso = [...(alcance?.querySelectorAll('.mensaje-validacion-campo') || [])].find((elemento) => elemento.id === id);
  if (!aviso) {
    aviso = document.createElement('p');
    aviso.id = id;
    aviso.className = 'mensaje-validacion-campo';
    aviso.setAttribute('role', 'alert');
    grupo?.append(aviso);
  }
  aviso.textContent = mensaje;
  campo.setAttribute('aria-invalid', 'true');
  const descripciones = new Set((campo.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
  descripciones.add(id);
  campo.setAttribute('aria-describedby', [...descripciones].join(' '));
}

function limpiarError(campo) {
  if (!campo.id) return;
  const id = `${campo.id}-mensaje-validacion`;
  const alcance = campo.form || campo.labels?.[0]?.parentElement || campo.parentElement;
  [...(alcance?.querySelectorAll('.mensaje-validacion-campo') || [])].find((elemento) => elemento.id === id)?.remove();
  campo.removeAttribute('aria-invalid');
  const descripciones = (campo.getAttribute('aria-describedby') || '').split(/\s+/).filter((valor) => valor && valor !== id);
  if (descripciones.length) campo.setAttribute('aria-describedby', descripciones.join(' '));
  else campo.removeAttribute('aria-describedby');
}

function controlesFormulario(formulario) {
  return [...formulario.elements].filter((campo) => campo.matches?.('input, textarea, select') && !debeIgnorarse(campo));
}

function validarFormulario(formulario) {
  const invalidos = [];
  for (const campo of controlesFormulario(formulario)) {
    const mensaje = mensajeValidacionCampo(campo);
    if (mensaje) {
      mostrarError(campo, mensaje);
      invalidos.push(campo);
    } else {
      limpiarError(campo);
    }
  }
  actualizarResumen(formulario, invalidos.length);
  return invalidos;
}

function actualizarResumen(formulario, cantidad) {
  let resumen = formulario.querySelector('[data-resumen-validacion]');
  if (!cantidad) {
    resumen?.remove();
    return;
  }
  if (!resumen) {
    resumen = document.createElement('p');
    resumen.dataset.resumenValidacion = 'true';
    resumen.className = 'resumen-validacion-formulario';
    resumen.setAttribute('role', 'alert');
    formulario.prepend(resumen);
  }
  resumen.textContent = cantidad === 1
    ? 'Hay un campo por corregir. Revisa el mensaje señalado.'
    : `Hay ${cantidad} campos por corregir. Revisa cada mensaje señalado.`;
}

function prepararCampoNumerico(campo) {
  const tipo = tipoSemantico(campo);
  if (!['telefono', 'documento'].includes(tipo) || !['text', 'tel', ''].includes(campo.type)) return;
  const limite = tipo === 'telefono' ? 10 : 20;
  campo.inputMode = 'numeric';
  if (campo.maxLength < 0 || campo.maxLength > limite) campo.maxLength = limite;
}

function esCampoNumericoIdentificable(campo) {
  return ['telefono', 'documento'].includes(tipoSemantico(campo))
    && ['text', 'tel', ''].includes(campo.type);
}

function alIntentarIngresarCaracter(evento) {
  const campo = evento.target;
  if (!esCampoNumericoIdentificable(campo) || !evento.data || /^\d+$/.test(evento.data)) return;
  evento.preventDefault();
  campo.dataset.validacionActiva = 'true';
  const mensaje = tipoSemantico(campo) === 'telefono'
    ? 'En este campo solo se permiten dígitos del 0 al 9; escribe exactamente 10.'
    : 'En este campo solo se permiten dígitos del 0 al 9.';
  mostrarError(campo, mensaje);
}

export function instalarValidacionFormularios(doc = document) {
  if (doc.__validacionFormulariosInstalada) return () => {};
  doc.__validacionFormulariosInstalada = true;

  const prepararFormularios = (raiz) => {
    if (raiz.matches?.('form')) raiz.noValidate = true;
    raiz.querySelectorAll?.('form').forEach((formulario) => { formulario.noValidate = true; });
  };
  prepararFormularios(doc);
  const observador = new doc.defaultView.MutationObserver((cambios) => {
    cambios.forEach((cambio) => cambio.addedNodes.forEach((nodo) => {
      if (nodo.nodeType === 1) prepararFormularios(nodo);
    }));
  });
  observador.observe(doc.documentElement, { childList: true, subtree: true });

  const alEnviar = (evento) => {
    const formulario = evento.target;
    if (!(formulario instanceof doc.defaultView.HTMLFormElement)) return;
    const invalidos = validarFormulario(formulario);
    if (!invalidos.length) return;

    evento.preventDefault();
    evento.stopImmediatePropagation();
    const primero = invalidos[0];
    primero.focus({ preventScroll: true });
    primero.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  };

  const alEditar = (evento) => {
    const campo = evento.target;
    if (!campo?.matches?.('input, textarea, select') || debeIgnorarse(campo)) return;
    if (evento.type === 'input') prepararCampoNumerico(campo);
    const formulario = campo.form;
    const yaMostro = campo.dataset.validacionActiva === 'true' || formulario?.dataset.validacionIntentada === 'true';
    if (!yaMostro) return;
    campo.dataset.validacionActiva = 'true';
    doc.defaultView.setTimeout(() => {
      if (formulario) validarFormulario(formulario);
      else {
        const mensaje = mensajeValidacionCampo(campo);
        if (mensaje) mostrarError(campo, mensaje);
        else limpiarError(campo);
      }
    }, 0);
  };

  const alSalir = (evento) => {
    const campo = evento.target;
    if (!campo?.matches?.('input, textarea, select') || debeIgnorarse(campo)) return;
    campo.dataset.validacionActiva = 'true';
    const mensaje = mensajeValidacionCampo(campo);
    if (mensaje) mostrarError(campo, mensaje);
    else limpiarError(campo);
  };

  doc.addEventListener('submit', alEnviar, true);
  doc.addEventListener('beforeinput', alIntentarIngresarCaracter, true);
  doc.addEventListener('input', alEditar, true);
  doc.addEventListener('change', alEditar, true);
  doc.addEventListener('focusout', alSalir, true);

  return () => {
    doc.removeEventListener('submit', alEnviar, true);
    doc.removeEventListener('beforeinput', alIntentarIngresarCaracter, true);
    doc.removeEventListener('input', alEditar, true);
    doc.removeEventListener('change', alEditar, true);
    doc.removeEventListener('focusout', alSalir, true);
    observador.disconnect();
    delete doc.__validacionFormulariosInstalada;
  };
}
