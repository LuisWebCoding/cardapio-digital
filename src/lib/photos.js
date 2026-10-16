export const MAX_PHOTO_INPUT = 10 * 1024 * 1024;
export const MAX_PHOTO_OUTPUT = 2 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function validatePhoto(file) {
  if (!file || !Number.isFinite(file.size) || file.size < 1 || file.size > MAX_PHOTO_INPUT) {
    throw new Error('Escolha uma foto de até 10 MB.');
  }
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const matches = (values, offset = 0) => values.every((value, index) => bytes[offset + index] === value);
  let type = '';
  if (matches([255, 216, 255])) type = 'image/jpeg';
  if (matches([137, 80, 78, 71, 13, 10, 26, 10])) type = 'image/png';
  if (matches([82, 73, 70, 70]) && matches([87, 69, 66, 80], 8)) type = 'image/webp';
  if (!type || (file.type && file.type !== type)) {
    throw new Error('Use uma foto JPEG, PNG ou WebP. Outros formatos precisam ser convertidos antes de enviar.');
  }
  return type;
}

// Reduz a foto no navegador, preserva proporção e remove metadados do arquivo original.
export async function preparePhoto(file) {
  await validatePhoto(file);
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 40000000) {
      throw new Error('Escolha uma foto com resolução menor.');
    }
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível preparar a foto neste navegador.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .82));
    if (!blob || !PHOTO_TYPES.includes(blob.type) || blob.size > MAX_PHOTO_OUTPUT) {
      throw new Error('A foto ficou muito grande. Escolha uma imagem menor.');
    }
    return blob;
  } catch (error) {
    if (error instanceof DOMException) {
      throw new Error('Não foi possível abrir essa foto. Tente outro arquivo JPEG, PNG ou WebP.');
    }
    throw error;
  } finally { bitmap?.close(); }
}
