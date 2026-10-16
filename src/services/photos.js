import { cloudEnabled, getCloudClient, authorizeManager } from './cloud.js?v=20261016-photos';
import { preparePhoto, MAX_PHOTO_OUTPUT, PHOTO_TYPES } from '../lib/photos.js?v=20261016-photos';

export const PHOTO_BUCKET = 'menu-images';

// Separado para testar upload, caminhos e erros sem enviar fotos para o projeto real.
export async function uploadPhotoWithClient(client, restaurantId, photo) {
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(restaurantId)) throw new Error('Restaurante inválido.');
  if (!photo || photo.size < 1 || photo.size > MAX_PHOTO_OUTPUT || !PHOTO_TYPES.includes(photo.type)) {
    throw new Error('Não foi possível preparar a foto para envio.');
  }
  const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const path = restaurantId + '/' + crypto.randomUUID() + '.' + extensions[photo.type];
  const bucket = client.storage.from(PHOTO_BUCKET);
  const { error } = await bucket.upload(path, photo, {
    contentType: photo.type, cacheControl: '31536000', upsert: false
  });
  if (error) {
    if (String(error.statusCode) === '413') throw new Error('A foto excedeu o tamanho permitido. Escolha uma menor.');
    throw new Error('Não foi possível enviar a foto. Confira a conexão, seu acesso e a configuração de imagens do restaurante.');
  }
  const { data } = bucket.getPublicUrl(path);
  if (!data?.publicUrl || !data.publicUrl.startsWith('https://')) {
    throw new Error('O envio terminou, mas não foi possível obter o endereço da foto. Tente novamente.');
  }
  return data.publicUrl;
}

export async function uploadMenuPhoto(file) {
  if (!cloudEnabled) throw new Error('O envio de fotos fica disponível no painel online.');
  const client = await getCloudClient(true);
  await authorizeManager(client);
  const photo = await preparePhoto(file);
  return uploadPhotoWithClient(client, NUVEM.restauranteId, photo);
}
