// hooks/useCamposAdicionales.js
// Estado y logica de los campos personalizados administrables dentro de
// un formulario (ver components/form/CamposAdicionales.jsx, que los
// dibuja, y Configuracion > Campos, donde el administrador los define).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { obtenerCampos, subirArchivoCampoMascota, quitarArchivoCampoMascota } from '../api/client';
import { useAuth } from '../context/AuthContext';

// Como se sube y se quita el adjunto de un campo de archivo, por entidad.
const ADJUNTOS = {
  mascota: { subir: subirArchivoCampoMascota, quitar: quitarArchivoCampoMascota },
};

function vacio(valor) {
  return valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '');
}

export function useCamposAdicionales(entidad) {
  const { token } = useAuth();
  const [definiciones, setDefiniciones] = useState([]);
  const [valores, setValores] = useState({});
  // Adjuntos pendientes: { clave: File } = subir al guardar; { clave: null }
  // = quitar el que habia. Sin la clave = no se toca.
  const [archivos, setArchivos] = useState({});

  useEffect(() => {
    let vigente = true;
    obtenerCampos(entidad, token)
      .then((datos) => vigente && setDefiniciones(datos.campos))
      // Sin definiciones el formulario sigue funcionando con sus campos fijos.
      .catch(() => vigente && setDefiniciones([]));
    return () => {
      vigente = false;
    };
  }, [entidad, token]);

  const activos = useMemo(() => definiciones.filter((d) => d.activo), [definiciones]);

  // Arranca con los valores del registro a editar (o vacio al crear).
  const reiniciar = useCallback((registro) => {
    setValores(registro?.campos_adicionales ?? {});
    setArchivos({});
  }, []);

  const cambiar = useCallback((clave, valor) => setValores((actual) => ({ ...actual, [clave]: valor })), []);
  const cambiarArchivo = useCallback((clave, archivo) => setArchivos((actual) => ({ ...actual, [clave]: archivo })), []);

  // Mensaje del primer campo obligatorio sin llenar, o '' si esta todo.
  // `soloObligatorios` no cambia la regla: los obligatorios siempre se exigen.
  function errorObligatorios() {
    for (const definicion of activos) {
      if (!definicion.requerido) continue;
      const { clave, etiqueta, tipo } = definicion;
      if (tipo === 'archivo') {
        const pendiente = archivos[clave];
        const tiene = pendiente instanceof Blob || (pendiente === undefined && !vacio(valores[clave]));
        if (!tiene) return `Adjunta el archivo de "${etiqueta}".`;
      } else if (vacio(valores[clave])) {
        return `"${etiqueta}" es obligatorio.`;
      }
    }
    return '';
  }

  // Lo que va en el cuerpo de la peticion: solo campos activos que no son
  // archivo; un campo vaciado viaja como null para que el backend lo quite.
  function valoresParaEnviar() {
    const cuerpo = {};
    activos.forEach(({ clave, tipo }) => {
      if (tipo !== 'archivo') cuerpo[clave] = vacio(valores[clave]) ? null : valores[clave];
    });
    return cuerpo;
  }

  // Sube / quita los adjuntos pendientes del registro ya guardado. El
  // registro ya quedo guardado: si un adjunto falla, devuelve el aviso
  // (texto) en vez de lanzar, para no perder lo demas.
  async function guardarArchivos(registroId) {
    const fallas = [];
    for (const [clave, archivo] of Object.entries(archivos)) {
      const etiqueta = definiciones.find((d) => d.clave === clave)?.etiqueta ?? clave;
      try {
        if (archivo instanceof Blob) await ADJUNTOS[entidad].subir(registroId, clave, archivo, token);
        else if (archivo === null && !vacio(valores[clave])) await ADJUNTOS[entidad].quitar(registroId, clave, token);
      } catch (err) {
        fallas.push(`"${etiqueta}": ${err.message}`);
      }
    }
    return fallas.length > 0 ? `No se pudo guardar el archivo de ${fallas.join('; ')}` : '';
  }

  return { definiciones, activos, valores, archivos, reiniciar, cambiar, cambiarArchivo, errorObligatorios, valoresParaEnviar, guardarArchivos };
}
