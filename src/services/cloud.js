import { validateMenu } from '../lib/menu.js?v=20261016-photos';

export const cloudEnabled = typeof NUVEM !== 'undefined' && NUVEM.ativo === true;
const columns = 'id,data,revision,updated_at';
let adminPromise;
let publicPromise;

export function validateCloudSettings(settings) {
  if (!settings || !/^https:\/\/[a-z0-9.-]+(?::\d+)?\/?$/i.test(settings.url)) {
    throw new Error('Configure a URL HTTPS do projeto em cloud-config.js.');
  }
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(settings.restauranteId)) {
    throw new Error('Configure um restauranteId válido em cloud-config.js.');
  }
  const key = settings.chavePublica || '';
  let legacyRole = '';
  try { legacyRole = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role; } catch {}
  if (!key.startsWith('sb_publishable_') && legacyRole !== 'anon') {
    throw new Error('Use somente a chave pública publishable ou anon. Chaves secretas nunca devem ficar no site.');
  }
  return settings;
}

async function makeClient(admin) {
  const settings = validateCloudSettings(NUVEM);
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.57.4');
  return createClient(settings.url, settings.chavePublica, {
    auth: {
      persistSession: admin, autoRefreshToken: admin, detectSessionInUrl: false,
      storageKey: 'cardapio.auth:' + new URL(settings.url).host + ':' + settings.restauranteId
    },
    global: {
      fetch: (url, options = {}) => fetch(url, {
        ...options,
        signal: options.signal
          ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
          : AbortSignal.timeout(15000)
      })
    }
  });
}
export function getCloudClient(admin = false) {
  if (admin) return adminPromise ??= makeClient(true);
  return publicPromise ??= makeClient(false);
}

export function decodeRecord(record) {
  if (!record || !Number.isSafeInteger(record.revision) || record.revision < 0) {
    throw new Error('O restaurante ainda não foi configurado no banco de dados.');
  }
  return { menu: validateMenu(record.data), revision: record.revision };
}

export async function readPublished() {
  const client = await getCloudClient();
  const { data, error } = await client.from('restaurant_menus')
    .select(columns).eq('id', NUVEM.restauranteId).single();
  if (error) throw new Error('Não foi possível consultar o cardápio online.');
  return decodeRecord(data);
}
export async function authorizeManager(client) {
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error('Entre novamente para continuar.');
  const access = await client.rpc('can_manage_menu', { menu_id: NUVEM.restauranteId });
  if (access.error || access.data !== true) throw new Error('Esta conta não tem permissão para gerenciar este restaurante.');
  return user;
}

export async function publishWithClient(client, id, menu, revision) {
  const validated = validateMenu(menu);
  const { data, error } = await client.from('restaurant_menus')
    .update({ data: validated }).eq('id', id).eq('revision', revision).select(columns);
  if (error) throw new Error('A publicação não foi concluída. Verifique sua conexão e sua sessão.');
  if (!data?.length) {
    throw new Error('A versão online mudou ou sua permissão expirou. Reabra o painel e revise as alterações antes de publicar.');
  }
  return decodeRecord(data[0]);
}
export async function publishMenu(menu, revision) {
  const client = await getCloudClient(true);
  await authorizeManager(client);
  return publishWithClient(client, NUVEM.restauranteId, menu, revision);
}
