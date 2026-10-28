import { createElement as h, useState } from 'react';
import { Field, Modal } from './Fields.js?v=20261028-gastro';
import { ProductForm } from './ProductForm.js?v=20261028-gastro';
import { RestaurantForm } from './RestaurantForm.js?v=20261028-gastro';
import { Image } from './Image.js?v=20261028-gastro';
import { clone, newId, saveItem, menusEqual, moveCategory, moveProduct } from '../lib/menu.js?v=20261028-gastro';
import { PublicationHistory, publicationDate } from './PublicationHistory.js?v=20261028-gastro';
import { DeliveryTools } from './DeliveryTools.js?v=20261028-gastro';

function CategoryForm({ category, onSave, onCancel }) {
  const [name, setName] = useState(category?.nome || '');
  const [error, setError] = useState('');
  return h('form', { className: 'form-stack', onSubmit: e => {
    e.preventDefault();
    if (!name.trim()) { setError('Informe o nome da categoria.'); return; }
    setError('');
    onSave({ id: category?.id || newId(), nome: name.trim(), itens: category?.itens || [] });
  }},
    h(Field, { label: 'Nome da categoria', required: true, maxLength: 80, value: name, onChange: e => setName(e.target.value) }),
    error && h('p', { role: 'alert', className: 'error' }, error),
    h('div', { className: 'form-actions' },
      h('button', { type: 'button', className: 'button secondary', onClick: onCancel }, 'Cancelar'),
      h('button', { className: 'button primary' }, 'Salvar categoria')));
}

export function Admin({ menu, commit, message, setMessage, saved = false, published = menu, publication = null }) {
  const [tab, setTab] = useState('produtos');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [modalError, setModalError] = useState('');
  const [organizing, setOrganizing] = useState(false);
  const dirty = !menusEqual(menu, published);
  const close = () => { setModal(null); setModalError(''); };
  const persist = next => {
    setModalError('');
    if (commit(next)) close();
    else setModalError('Não foi possível salvar. Confira os dados e o espaço disponível neste navegador e tente novamente.');
  };
  const count = menu.categorias.reduce((sum, c) => sum + c.itens.length, 0);
  function change(next) { commit(next); }
  function orderButtons(label, index, length, reorder) {
    return h('div', { className: 'order-actions', role: 'group', 'aria-label': 'Ordenar ' + label },
      h('button', { type: 'button', className: 'button secondary small', disabled: index === 0,
        'aria-label': 'Mover ' + label + ' para cima', onClick: () => reorder(-1) }, '↑'),
      h('button', { type: 'button', className: 'button secondary small', disabled: index === length - 1,
        'aria-label': 'Mover ' + label + ' para baixo', onClick: () => reorder(1) }, '↓'));
  }
  const products = menu.categorias.flatMap(category => category.itens.map(item => ({ item, category })))
    .filter(({ item, category }) => (!filter || filter === category.id) &&
      item.nome.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  function remove() {
    const next = clone(menu);
    if (modal.kind === 'delete-category') next.categorias = next.categorias.filter(c => c.id !== modal.category.id);
    else next.categorias.forEach(c => { c.itens = c.itens.filter(i => i.id !== modal.item.id); });
    persist(next);
  }
  return h('div', { className: 'admin-shell' },
    h('header', { className: 'admin-header' },
      h('div', { className: 'admin-header-inner' },
        h('a', { href: '#editor', className: 'admin-brand' }, h('span', { className: 'brand-mark' }, menu.nome.trim().charAt(0)), h('span', null, menu.nome, h('small', null, 'Painel do restaurante • Gestor'))),
        h('div', { className: 'header-actions' },
          h('a', { href: '#preview', className: 'button secondary' }, 'Ver prévia'),
          h('button', { className: 'button primary', disabled: !publication || publication.busy || (!dirty && !publication.pendingDelivery),
            onClick: () => publication?.publish(menu) },
            publication?.busy ? 'Publicando…' : publication?.pendingDelivery && !dirty ? 'Concluir publicação' : 'Publicar cardápio')))),
    h('main', { className: 'admin-container' },
      h('div', { className: 'page-heading' }, h('div', null,
        h('p', { className: 'eyebrow' }, 'Seu cardápio, do seu jeito'),
        h('h1', null, 'Gerenciar cardápio'),
        h('p', { className: 'muted' }, 'Atualize os produtos e deixe tudo pronto para publicar.')),
        h('a', { href: './index.html', className: 'text-link' }, 'Ver cardápio publicado')),
      h('div', { className: 'notice' }, h('strong', null, publication ? 'Suas alterações, no seu tempo. ' : 'Modo demonstração. '),
        publication
          ? 'Edite seu rascunho e clique em Publicar cardápio para disponibilizar as alterações aos clientes.'
          : 'Você pode experimentar a edição. A publicação fica disponível quando o serviço online estiver conectado.'),
      h('div', { className: 'stats' },
        h('div', { className: 'stat' }, h('strong', null, count), h('span', null, 'Produtos no cardápio')),
        h('div', { className: 'stat' }, h('strong', null, menu.categorias.length), h('span', null, 'Categorias')),
        h('div', { className: 'stat stat-note' + (dirty || publication?.pendingDelivery ? ' has-changes' : '') },
          h('strong', null, dirty ? 'Alterações não publicadas' : publication?.pendingDelivery ? 'Aguardando publicação na hospedagem' : 'Tudo atualizado'),
          h('span', null, publication?.updatedAt ? 'Publicado em ' + publicationDate(publication.updatedAt)
            : publication?.pendingDelivery ? 'A versão pública ainda precisa ser confirmada'
              : dirty ? 'Salvas neste navegador' : 'Igual à versão publicada'))),
      h('div', { className: 'admin-tabs', 'aria-label': 'Seções da administração' },
        ['produtos', 'categorias', 'restaurante', 'histórico', 'QR Code e guia'].map(name => h('button', {
          key: name, className: tab === name ? 'active' : '', 'aria-pressed': tab === name,
          onClick: () => { setTab(name); setQuery(''); setFilter(''); setOrganizing(false); }
        }, name.charAt(0).toUpperCase() + name.slice(1)))),
      h('p', { className: 'save-message', role: 'status', 'aria-live': 'polite' },
        saved && !dirty && !publication?.pendingDelivery ? 'Não há alterações pendentes de publicação.' : message || 'Edite um registro para começar.'),
      tab === 'produtos' && h('section', { className: 'panel' },
        h('div', { className: 'section-heading' }, h('div', null, h('h2', null, 'Produtos'), h('p', { className: 'muted' }, 'Nome, preço, foto e os detalhes que fazem a diferença.')),
          h('div', { className: 'header-actions' },
            h('button', { className: 'button secondary', 'aria-pressed': organizing, onClick: () => setOrganizing(value => !value) }, organizing ? 'Concluir organização' : 'Organizar ordem'),
            h('button', { className: 'button primary', disabled: !menu.categorias.length, onClick: () => setModal({ kind: 'product' }) }, '+ Novo produto'))),
        organizing && h('p', { className: 'muted order-hint' }, 'Use as setas para mover cada produto dentro da sua categoria. A nova ordem aparece após publicar.'),
        !menu.categorias.length && h('p', { className: 'empty' }, 'Crie uma categoria antes de cadastrar seu primeiro produto.'),
        h('div', { className: 'filters' },
          h(Field, { label: 'Buscar produto', type: 'search', placeholder: 'Buscar pelo nome…', value: query, onChange: e => setQuery(e.target.value) }),
          h('div', { className: 'field' }, h('label', { htmlFor: 'category-filter' }, 'Filtrar categoria'),
            h('select', { id: 'category-filter', value: filter, onChange: e => setFilter(e.target.value) },
              h('option', { value: '' }, 'Todas as categorias'), menu.categorias.map(c => h('option', { key: c.id, value: c.id }, c.nome))))),
        h('ul', { className: 'admin-list' }, products.map(({ item, category }) =>
          h('li', { key: item.id, className: 'admin-row' },
            h(Image, { src: item.imagem, className: 'admin-thumb', alt: '', fallback: h('div', { className: 'thumb-placeholder' }, 'Sem foto') }),
            h('div', { className: 'row-copy' }, h('h3', null, item.nome), h('small', null, category.nome),
              item.disponivel === false && h('span', { className: 'availability-label' }, 'Indisponível'),
              item.destaque && h('span', { className: 'mini-badge' }, item.destaque)),
            h('strong', { className: 'row-price' }, item.preco),
            h('div', { className: 'row-actions' },
              organizing && orderButtons(item.nome, category.itens.findIndex(entry => entry.id === item.id), category.itens.length,
                direction => change(moveProduct(menu, category.id, item.id, direction))),
              h('button', { className: 'button secondary small', 'aria-label': (item.disponivel === false ? 'Disponibilizar ' : 'Pausar ') + item.nome,
                onClick: () => change(saveItem(menu, { ...item, disponivel: item.disponivel === false }, category.id)) },
                item.disponivel === false ? 'Disponibilizar' : 'Pausar'),
              h('button', { className: 'button secondary small', 'aria-label': 'Editar ' + item.nome, onClick: () => setModal({ kind: 'product', item, category }) }, 'Editar'),
              h('button', { className: 'button danger small', 'aria-label': 'Excluir ' + item.nome, onClick: () => setModal({ kind: 'delete-product', item }) }, 'Excluir'))))),
        !products.length && menu.categorias.length > 0 && h('p', { className: 'empty' }, 'Nenhum produto encontrado. Cadastre um produto ou ajuste os filtros.')),
      tab === 'categorias' && h('section', { className: 'panel' },
        h('div', { className: 'section-heading' }, h('div', null, h('h2', null, 'Categorias'), h('p', { className: 'muted' }, 'Organize a navegação do cardápio.')),
          h('div', { className: 'header-actions' },
            h('button', { className: 'button secondary', 'aria-pressed': organizing, onClick: () => setOrganizing(value => !value) }, organizing ? 'Concluir organização' : 'Organizar ordem'),
            h('button', { className: 'button primary', onClick: () => setModal({ kind: 'category' }) }, '+ Nova categoria'))),
        h('ul', { className: 'admin-list' }, menu.categorias.map((category, index) => h('li', { key: category.id, className: 'admin-row' },
          h('div', { className: 'row-copy' }, h('h3', null, category.nome), h('small', null, category.itens.length + ' produto(s)')),
          h('div', { className: 'row-actions' },
            organizing && orderButtons(category.nome, index, menu.categorias.length,
              direction => change(moveCategory(menu, category.id, direction))),
            h('button', { className: 'button secondary small', 'aria-label': 'Editar categoria ' + category.nome, onClick: () => setModal({ kind: 'category', category }) }, 'Editar'),
            h('button', { className: 'button danger small', 'aria-label': 'Excluir categoria ' + category.nome, onClick: () => setModal({ kind: 'delete-category', category }) }, 'Excluir'))))),
        !menu.categorias.length && h('p', { className: 'empty' }, 'Nenhuma categoria cadastrada.')),
      tab === 'restaurante' && h(RestaurantForm, { menu, onSave: commit }),
      tab === 'histórico' && h(PublicationHistory, { publication, onRestore: entry => setModal({ kind: 'restore', entry }) }),
      tab === 'QR Code e guia' && h(DeliveryTools, { restaurantName: menu.nome }),
      h('footer', { className: 'admin-footer' }, publication ? 'Painel do restaurante • Publicação online' : 'Demonstração local • Cardápio em React')),
    modal && h(Modal, {
      key: modal.kind + ':' + (modal.item?.id || modal.category?.id || 'novo'),
      title: modal.kind === 'product' ? (modal.item ? 'Editar produto' : 'Novo produto')
        : modal.kind === 'category' ? (modal.category ? 'Editar categoria' : 'Nova categoria')
        : modal.kind === 'restore' ? 'Restaurar versão ' + modal.entry.revision : 'Confirmar exclusão',
      onClose: close
    },
      modalError && h('p', { role: 'alert', className: 'error',
        style: { position: 'sticky', top: 0, zIndex: 2, background: '#fff3f1',
          padding: '.8rem', border: '1px solid #f2d4cf', borderRadius: 9 }
      }, modalError),
      modal.kind === 'restore' && h('div', { className: 'form-stack' },
        h('p', null, 'Esta versão substituirá o rascunho atual. Revise a prévia e clique em Publicar cardápio quando estiver pronto.'),
        h('p', { className: 'muted' }, 'O cardápio dos clientes continua igual até você publicar.'),
        h('div', { className: 'form-actions' },
          h('button', { className: 'button secondary', onClick: close }, 'Cancelar'),
          h('button', { className: 'button primary', onClick: () => persist(clone(modal.entry.menu)) }, 'Restaurar rascunho'))),
      modal.kind === 'product' && h(ProductForm, { item: modal.item, categoryId: modal.category?.id, categories: menu.categorias, onCancel: close,
        onSave: (item, categoryId) => {
          try { persist(saveItem(menu, item, categoryId)); }
          catch (error) { setMessage(error.message); setModalError(error.message); }
        }}),
      modal.kind === 'category' && h(CategoryForm, { category: modal.category, onCancel: close, onSave: category => {
        const next = clone(menu);
        const index = next.categorias.findIndex(c => c.id === category.id);
        if (index >= 0) next.categorias[index] = category; else next.categorias.push(category);
        persist(next);
      }}),
      modal.kind.startsWith('delete') && h('div', { className: 'form-stack' },
        h('p', null, modal.category
          ? 'Excluir “' + modal.category.nome + '” e seus ' + modal.category.itens.length + ' produto(s)?'
          : 'Excluir “' + modal.item.nome + '”?'),
        h('p', { className: 'muted' }, 'O item sairá do cardápio dos clientes quando você publicar as alterações.'),
        h('div', { className: 'form-actions' },
          h('button', { className: 'button secondary', onClick: close }, 'Cancelar'),
          h('button', { className: 'button danger-solid', onClick: remove }, 'Confirmar exclusão'))))
  );
}
