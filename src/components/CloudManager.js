import { createElement as h, useState, useEffect } from 'react';
import { getCloudClient, authorizeManager, readPublished, publishMenu } from '../services/cloud.js?v=20261016-photos';
import { Login } from './Login.js?v=20261016-photos';

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
  async function publish(menu) {
    if (busy) return;
    setBusy(true); setMessage('Publicando cardápio…');
    try {
      const next = await publishMenu(menu, published.revision);
      setPublished(next);
      setMessage('Cardápio publicado! Novos acessos já veem a atualização; páginas abertas atualizam em até 30 segundos.');
    } catch (error) { setMessage(error.message); }
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
      publication: { busy, publish }
    })));
}

export function CloudManager({ children }) {
  const [state, setState] = useState({ client: null, session: null, loading: true, error: '' });
  useEffect(() => {
    let alive = true;
    let subscription;
    (async () => {
      try {
        const client = await getCloudClient(true);
        const listener = client.auth.onAuthStateChange((_event, session) => {
          if (alive) setState({ client, session, loading: false, error: '' });
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
  return h(AuthorizedManager, { key: state.session.user.id, client: state.client, userId: state.session.user.id, children });
}
