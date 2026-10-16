import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePhoto, MAX_PHOTO_INPUT } from '../src/lib/photos.js';
import { uploadPhotoWithClient, PHOTO_BUCKET } from '../src/services/photos.js';

test('aceita assinaturas reais de JPEG, PNG e WebP', async () => {
  for (const [type, bytes] of [
    ['image/jpeg', [255,216,255,0]],
    ['image/png', [137,80,78,71,13,10,26,10]],
    ['image/webp', [82,73,70,70,0,0,0,0,87,69,66,80]]
  ]) assert.equal(await validatePhoto(new File([new Uint8Array(bytes)], 'foto', { type })), type);
});

test('recusa arquivos disfarçados, formatos inválidos, vazios e grandes', async () => {
  await assert.rejects(() => validatePhoto(new File(['<svg/>'], 'foto.png', { type:'image/png' })), /JPEG/);
  await assert.rejects(() => validatePhoto(new File([], 'vazio.jpg', { type:'image/jpeg' })), /10 MB/);
  await assert.rejects(() => validatePhoto({ size:MAX_PHOTO_INPUT+1 }), /10 MB/);
  await assert.rejects(() => validatePhoto(new File([new Uint8Array([255,216,255])], 'foto.png', { type:'image/png' })), /JPEG/);
});

test('gera caminho exclusivo do restaurante sem sobrescrever fotos publicadas', async () => {
  const paths = [];
  const client = { storage: { from(name) {
    assert.equal(name, PHOTO_BUCKET);
    return {
      async upload(path, blob, options) {
        paths.push(path);
        assert.equal(options.upsert, false);
        assert.equal(blob.type, 'image/webp');
        return { error:null };
      },
      getPublicUrl(path) { return { data:{ publicUrl:'https://test.supabase.co/storage/v1/object/public/menu-images/'+path } }; }
    };
  } } };
  const photo = new Blob(['test'], { type:'image/webp' });
  const url = await uploadPhotoWithClient(client, 'brasa-e-pao', photo);
  await uploadPhotoWithClient(client, 'brasa-e-pao', photo);
  assert.match(paths[0], /^brasa-e-pao\/[a-f0-9-]+\.webp$/);
  assert.notEqual(paths[0], paths[1]);
  assert(url.includes(paths[0]));
});

test('falha de envio não retorna uma URL de sucesso', async () => {
  let readUrl = false;
  const client = { storage:{ from() { return {
    upload:async () => ({ error:{ statusCode:'403' } }),
    getPublicUrl() { readUrl = true; }
  }; } } };
  await assert.rejects(() => uploadPhotoWithClient(client,'brasa-e-pao',new Blob(['test'],{type:'image/webp'})), /Não foi possível enviar/);
  assert.equal(readUrl,false);
  await assert.rejects(() => uploadPhotoWithClient(client,'../outro',new Blob(['test'],{type:'image/webp'})), /Restaurante inválido/);
});
