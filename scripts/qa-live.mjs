// Testes de leitura: não autenticam gestores nem alteram dados ou fotos.
import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { validateMenu } from '../src/lib/menu.js';

const base = new URL(process.argv[2] || 'https://brasa-e-pao-cardapio-luis.netlify.app/');
if (base.protocol !== 'https:') throw new Error('Informe um endereço HTTPS.');
const results = [];
async function check(name, run) {
  try { await run(); results.push({ name, status: 'PASS' }); }
  catch (error) { results.push({ name, status: 'FAIL', detail: error.message }); }
}
const request = (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
async function resources(dir) {
  const entries = await fs.readdir(new URL('../' + dir, import.meta.url), { withFileTypes: true });
  const nested = await Promise.all(entries.map(e => e.isDirectory() ? resources(dir + '/' + e.name) : [dir + '/' + e.name]));
  return nested.flat();
}
const assetPaths = [...await resources('src'), ...await resources('imagens'), 'config.js', 'cloud-config.js'];
await check('Arquivos estáticos e tipos MIME', async () => {
  for (const path of assetPaths) {
    const response = await request(new URL(path, base));
    assert.equal(response.status, 200, path);
    if (path.endsWith('.js')) assert.match(response.headers.get('content-type') || '', /javascript/, path);
    if (/\.(jpg|png|webp)$/.test(path)) assert.match(response.headers.get('content-type') || '', /^image\//, path);
    await response.arrayBuffer();
  }
});
await check('Entradas do cliente e gestor e cabeçalhos de segurança', async () => {
  for (const path of ['index.html', 'admin.html']) {
    const response = await request(new URL(path, base));
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff', path);
    assert.equal(response.headers.get('x-frame-options'), 'DENY', path);
    assert.match(response.headers.get('cache-control') || '', /no-cache/, path);
    const html = await response.text();
    assert.match(html, /lang="pt-BR"/);
    assert.match(html, /name="viewport"/);
    if (path === 'admin.html') assert.match(response.headers.get('x-robots-tag') || '', /noindex/);
  }
  const admin = await request(new URL('admin', base));
  assert.equal(admin.status, 200);
  assert.match(await admin.text(), /src\/admin-main\.js/);
});
await check('SQL, testes, estado Git e arquivos locais fora do site público', async () => {
  for (const path of ['supabase/schema.sql', 'supabase/seed.sql', 'tests/cloud.test.mjs', '.git/config', '.env', 'qa-admin.html']) {
    const response = await request(new URL(path, base));
    assert.equal(response.status, 404, path);
    await response.arrayBuffer();
  }
});
// Lê a configuração que o visitante recebe; somente chave pública é usada.
let settings;
await check('Configuração online pública válida', async () => {
  const response = await request(new URL('cloud-config.js', base));
  const raw = await response.text();
  settings = JSON.parse(vm.runInNewContext(raw + '; JSON.stringify(NUVEM)', {}, { timeout: 1000 }));
  assert.equal(settings.ativo, true);
  assert.match(settings.url, /^https:\/\//);
  const { validateCloudSettings } = await import('../src/services/cloud.js');
  validateCloudSettings(settings);
});
if (settings) {
  const headers = { apikey: settings.chavePublica };
  const endpoint = new URL('/rest/v1/restaurant_menus', settings.url);
  endpoint.searchParams.set('id', 'eq.' + settings.restauranteId);
  endpoint.searchParams.set('select', 'id,data,revision');
  await check('Leitura real do Supabase sem login e formato do cardápio', async () => {
    const response = await request(endpoint, { headers });
    assert.equal(response.status, 200);
    const records = await response.json();
    assert.equal(records.length, 1);
    validateMenu(records[0].data);
    assert(Number.isSafeInteger(records[0].revision));
  });
  await check('Identificador privado do gestor inacessível ao visitante', async () => {
    const privateQuery = new URL(endpoint);
    privateQuery.searchParams.set('select', 'owner_id');
    const response = await request(privateQuery, { headers });
    assert([401, 403].includes(response.status), 'Consulta privada não foi bloqueada');
    await response.arrayBuffer();
  });
}
console.log(JSON.stringify({ base: base.href, checkedAssets: assetPaths.length, results }, null, 2));
if (results.some(r => r.status === 'FAIL')) process.exitCode = 1;
