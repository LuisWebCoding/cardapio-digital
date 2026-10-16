import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { validateCloudSettings, decodeRecord, publishWithClient, authorizeManager } from '../src/services/cloud.js';

const menu = JSON.parse(vm.runInNewContext(
  fs.readFileSync(new URL('../config.js', import.meta.url), 'utf8') + '; JSON.stringify(RESTAURANTE)'
));
globalThis.NUVEM = { restauranteId: 'brasa-e-pao' };

function clientResponse(result) {
  const calls = [];
  const query = {
    update(payload) { calls.push(['update', payload]); return this; },
    eq(...args) { calls.push(['eq', ...args]); return this; },
    select(columns) { calls.push(['select', columns]); return Promise.resolve(result); }
  };
  return { calls, from(table) { calls.push(['from', table]); return query; } };
}

test('configuração exige HTTPS e bloqueia chaves secretas', () => {
  const settings = { url: 'https://test.supabase.co', chavePublica: 'sb_publishable_test', restauranteId: 'brasa-e-pao' };
  assert.equal(validateCloudSettings(settings), settings);
  assert.throws(() => validateCloudSettings({ ...settings, url: 'http://test.supabase.co' }));
  assert.throws(() => validateCloudSettings({ ...settings, chavePublica: 'sb_secret_test' }));
  const legacy = 'header.' + Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64') + '.signature';
  assert.throws(() => validateCloudSettings({ ...settings, chavePublica: legacy }));
});

test('publicação envia só dados e condiciona a atualização à revisão carregada', async () => {
  const client = clientResponse({ data: [{ data: menu, revision: 4 }], error: null });
  const result = await publishWithClient(client, 'brasa-e-pao', menu, 3);
  assert.equal(result.revision, 4);
  assert.deepEqual(client.calls[1], ['update', { data: menu }]);
  assert(client.calls.some(c => c[0] === 'eq' && c[1] === 'revision' && c[2] === 3));
  assert(client.calls.some(c => c[0] === 'eq' && c[1] === 'id' && c[2] === 'brasa-e-pao'));
});

test('conflito ou falta de permissão não é reportado como publicação concluída', async () => {
  await assert.rejects(() => publishWithClient(clientResponse({ data: [], error: null }), 'brasa-e-pao', menu, 0), /versão online mudou/);
  await assert.rejects(() => publishWithClient(clientResponse({ data: null, error: { code: '42501' } }), 'brasa-e-pao', menu, 0), /não foi concluída/);
});

test('dados inválidos são rejeitados antes de consultar o serviço', async () => {
  let called = false;
  const client = { from() { called = true; } };
  await assert.rejects(() => publishWithClient(client, 'brasa-e-pao', { ...menu, nome: '' }, 0));
  assert.equal(called, false);
  assert.throws(() => decodeRecord({ data: menu, revision: -1 }));
});

test('autoriza somente a sessão validada com permissão de gestor', async () => {
  const user = { id: 'gestor' };
  const good = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    rpc: async (name, args) => {
      assert.equal(name, 'can_manage_menu');
      assert.deepEqual(args, { menu_id: 'brasa-e-pao' });
      return { data: true, error: null };
    }
  };
  assert.equal(await authorizeManager(good), user);
  await assert.rejects(() => authorizeManager({ ...good, rpc: async () => ({ data: false }) }), /não tem permissão/);
  await assert.rejects(() => authorizeManager({
    auth: { getUser: async () => ({ data: { user: null }, error: true }) }
  }), /Entre novamente/);
});
