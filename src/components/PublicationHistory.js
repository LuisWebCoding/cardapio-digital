import { createElement as h, useEffect, useState } from 'react';

export function publicationDate(value) {
  return value && Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : 'Data não disponível';
}

export function PublicationHistory({ publication, onRestore }) {
  const [state, setState] = useState({ entries: [], loading: true, error: '' });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    if (!publication?.readHistory) {
      setState({ entries: [], loading: false, error: 'O histórico fica disponível no painel online.' });
      return;
    }
    setState({ entries: [], loading: true, error: '' });
    publication.readHistory().then(entries => {
      if (active) setState({ entries, loading: false, error: '' });
    }).catch(error => {
      if (active) setState({ entries: [], loading: false, error: error.message });
    });
    return () => { active = false; };
  }, [publication?.revision, retry]);
  return h('section', { className: 'panel' },
    h('div', { className: 'section-heading' }, h('div', null,
      h('h2', null, 'Histórico de publicações'),
      h('p', { className: 'muted' }, 'Consulte as últimas 20 versões. Restaurar prepara um rascunho para você revisar.'))),
    state.loading && h('p', { role: 'status' }, 'Carregando publicações…'),
    state.error && h('div', { className: 'form-stack' },
      h('p', { role: 'alert', className: 'error' }, state.error),
      publication?.readHistory && h('button', { className: 'button secondary', onClick: () => setRetry(value => value + 1) }, 'Tentar novamente')),
    !state.loading && !state.error && !state.entries.length && h('p', { className: 'empty' }, 'Nenhuma publicação registrada.'),
    h('ul', { className: 'admin-list' }, state.entries.map(entry => h('li', { key: entry.revision, className: 'admin-row' },
      h('div', { className: 'row-copy' },
        h('h3', null, 'Versão ' + entry.revision,
          entry.revision === publication.publicRevision ? ' · disponível para os clientes'
            : entry.revision === publication.revision ? ' · versão salva no painel' : ''),
        h('p', { className: 'muted' }, publicationDate(entry.updatedAt)),
        h('small', null, entry.menu.categorias.reduce((sum, category) => sum + category.itens.length, 0) + ' produtos')),
      h('button', { className: 'button secondary small', 'aria-label': 'Carregar versão ' + entry.revision + ' no rascunho',
        onClick: () => onRestore(entry) }, 'Carregar no rascunho')))));
}
