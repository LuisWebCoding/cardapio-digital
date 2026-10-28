import { createElement as h, useState, useEffect } from 'react';
import { getCloudClient, authorizeManager, readPublished, publishMenu, readHistory } from '../services/cloud.js?v=20261028-gastro';
import { Login } from './Login.js?v=20261028-gastro';
import { ResetPassword } from './RecoverAccess.js?v=20261028-gastro';
import { menusEqual } from '../lib/menu.js?v=20261028-gastro';
import { readStaticMenu, requestStaticPublication, waitForStaticPublication } from '../services/static-menu.js?v=20261028-gastro';

function AuthorizedManager({ client, userId, children }) {
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await authorizeManager(client);
        const published = await readPublished();
        if (alive) setRecord(published);
      } catch (failure) { if (alive) setError(failure.message); }
    })();
    return () => { alive = false; };
  }, [client, userId]);
  if (error) return h('main', { className: 'auth-screen' }, h('div', { className: 'panel form-stack auth-card' },
    h('h1', null, 'Acesso não liberado'), h('p', { role: 'alert' }, error),
    h('button', { className: 'button secondary', onClick: () => client.auth.signOut() }, 'Sair')));
  if (!record) return h('p', { className: 'loading', role: 'status' }, 'Verificando acesso ao restaurante…');
  return h(OnlineEditor, { client, record, userId, children });
}

function OnlineEditor({ client, record, userId, children }) {
  const [published, setPublished] = useState(record);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [delivered, setDelivered] = useState(null);
  useEffect(() => {
    let active = true;
    readStaticMenu().then(value => { if (active) setDelivered(value); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const pendingDelivery = delivered?.revision !== published.revision;
  async function publish(menu) {
    if (busy) return;
    setBusy(true); setMessage('Publicando cardápio…');
    try {
      // Verifica configuração e acesso antes de alterar o banco. O servidor
      // Python local não executa Functions e não deve salvar uma meia publicação.
      await requestStaticPublication(client, published.revision, { checkOnly: true });
      // Uma nova tentativa após falha no deploy não cria outra revisão no banco.
      const next = menusEqual(menu, published.menu) ? published : await publishMenu(menu, published.revision);
      setPublished(next);
      const existing = await readStaticMenu().catch(() => null);
      if (existing?.revision !== next.revision) {
        setMessage('Dados salvos. Preparando o cardápio e as fotos na hospedagem… Isso pode levar alguns minutos.');
        await requestStaticPublication(client, next.revision);
        setDelivered(await waitForStaticPublication(next.revision));
      } else setDelivered(existing);
      setMessage('Cardápio publicado e conferido na hospedagem! Novos acessos já veem a atualização; páginas abertas atualizam em até 30 segundos.');
    } catch (error) { setMessage(error.message + ' Se os dados já foram salvos, use Concluir publicação para tentar novamente.'); }
    finally { setBusy(false); }
  }
  return h('div', null,
    h('div', { className: 'cloud-session' },
      h('span', null, 'Gestão online • acesso autenticado'),
      h('button', { className: 'button secondary small', disabled: busy,
        onClick: async () => {
          try { const result = await client.auth.signOut(); if (result.error) throw result.error; }
          catch { setMessage('Não foi possível sair. Confira a conexão e tente novamente.'); }
        } }, 'Sair')),
    message && h('p', { className: 'cloud-feedback', role: 'status', 'aria-live': 'polite' }, message),
    h('div', { inert: busy || undefined }, children({
      published: published.menu,
      namespace: 'cloud:' + new URL(NUVEM.url).host + ':' + NUVEM.restauranteId + ':' + userId + ':' + published.revision,
      publication: { busy, publish, readHistory, pendingDelivery, publicRevision: delivered?.revision, revision: published.revision,
        updatedAt: delivered?.updatedAt,
        onDraftChange: () => setMessage('') }
    })));
}

export function CloudManager({ children }) {
  const [state, setState] = useState({ client: null, session: null, loading: true, error: '' });
  useEffect(() => {
    let alive = true;
    let subscription;
    let recoveryLink = new URLSearchParams(location.hash.slice(1)).get('type') === 'recovery';
    (async () => {
      try {
        const client = await getCloudClient(true);
        const recoveryKey = 'cardapio:recuperacao:' + new URL(NUVEM.url).host + ':' + NUVEM.restauranteId;
        const listener = client.auth.onAuthStateChange((event, session) => {
          let pending = false;
          try { pending = sessionStorage.getItem(recoveryKey) === '1'; } catch {}
          const recovery = !!session && (event === 'PASSWORD_RECOVERY' || recoveryLink || pending);
          if (event === 'SIGNED_OUT') recoveryLink = false;
          try {
            if (recovery) sessionStorage.setItem(recoveryKey, '1');
            else if (!session) sessionStorage.removeItem(recoveryKey);
          } catch {}
          recoveryLink = false;
          if (alive) setState({ client, session, recovery, recoveryKey, loading: false, error: '' });
        });
        subscription = listener.data.subscription;
        // O SDK emite INITIAL_SESSION, seguido de SIGNED_IN/SIGNED_OUT.
        if (!alive) subscription.unsubscribe();
      } catch (error) {
        if (alive) setState({ client: null, session: null, loading: false, error: error.message });
      }
    })();
    return () => { alive = false; subscription?.unsubscribe(); };
  }, []);
  if (state.loading) return h('p', { className: 'loading', role: 'status' }, 'Preparando acesso seguro…');
  if (state.error) return h('main', { className: 'auth-screen' },
    h('div', { className: 'panel auth-card' }, h('h1', null, 'Configuração pendente'), h('p', { role: 'alert' }, state.error)));
  if (!state.session) return h(Login, { client: state.client });
  if (state.recovery) return h(ResetPassword, { client: state.client, onDone: () => {
    try { sessionStorage.removeItem(state.recoveryKey); } catch {}
    setState(previous => ({ ...previous, recovery: false }));
  } });
  return h(AuthorizedManager, { key: state.session.user.id, client: state.client, userId: state.session.user.id, children });
}
