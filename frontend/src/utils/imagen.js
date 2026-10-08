// utils/imagen.js
// Prepara una foto rectangular antes de subirla (galeria del inicio, foto
// de sede): valida formato y peso, y la reduce en el navegador a un JPEG
// de maximo `ladoMaximo` px por lado. Asi una foto de camara de 10 MB
// llega al backend pesando unos cientos de KB y el sitio la carga rapido.
// Las fotos circulares (mascota, medico) no pasan por aca: las recorta
// FotoMascotaModal.

export const PESO_MAXIMO_ORIGINAL_MB = 15;
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png'];

function cargarImagen(url) {
  return new Promise((resolver, rechazar) => {
    const imagen = new Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = () => rechazar(new Error('No se pudo leer la imagen. Prueba con otro archivo.'));
    imagen.src = url;
  });
}

// Devuelve un Blob JPEG listo para subir. Lanza un Error con un mensaje
// para mostrarle a la persona si el archivo no sirve.
export async function prepararImagen(archivo, { ladoMaximo = 1600, calidad = 0.85 } = {}) {
  if (!archivo || !TIPOS_PERMITIDOS.includes(archivo.type)) {
    throw new Error('La foto debe ser un archivo JPG o PNG.');
  }
  if (archivo.size > PESO_MAXIMO_ORIGINAL_MB * 1024 * 1024) {
    throw new Error(`La foto no puede pesar más de ${PESO_MAXIMO_ORIGINAL_MB} MB.`);
  }

  const url = URL.createObjectURL(archivo);
  try {
    const imagen = await cargarImagen(url);
    const escala = Math.min(1, ladoMaximo / Math.max(imagen.naturalWidth, imagen.naturalHeight));
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(imagen.naturalWidth * escala);
    lienzo.height = Math.round(imagen.naturalHeight * escala);
    const contexto = lienzo.getContext('2d');
    // Fondo blanco: un PNG con transparencia no puede quedar negro en JPEG.
    contexto.fillStyle = '#ffffff';
    contexto.fillRect(0, 0, lienzo.width, lienzo.height);
    contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    return await new Promise((resolver, rechazar) => {
      lienzo.toBlob(
        (blob) => (blob ? resolver(blob) : rechazar(new Error('No se pudo procesar la imagen.'))),
        'image/jpeg',
        calidad
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

// true si la foto es clara en su mitad inferior, donde el slider de
// servicios escribe el nombre en blanco: en ese caso el sitio la oscurece
// mas para que el texto se lea (contraste AA). Se mide reduciendo la
// imagen a 32x32 y promediando la luminancia de las filas de abajo.
const UMBRAL_FONDO_CLARO = 0.42;

export async function fondoEsClaro(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const imagen = await cargarImagen(url);
    const lado = 32;
    const lienzo = document.createElement('canvas');
    lienzo.width = lado;
    lienzo.height = lado;
    const contexto = lienzo.getContext('2d');
    contexto.drawImage(imagen, 0, 0, lado, lado);
    const { data } = contexto.getImageData(0, lado / 2, lado, lado / 2);
    let suma = 0;
    for (let i = 0; i < data.length; i += 4) {
      suma += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    }
    return suma / (data.length / 4) > UMBRAL_FONDO_CLARO;
  } catch {
    // Ante la duda, se oscurece mas: el texto siempre queda legible.
    return true;
  } finally {
    URL.revokeObjectURL(url);
  }
}
