import { createElement as h, useState, useId, useEffect } from 'react';
import { Image } from './Image.js?v=20261028-gastro';
import { safeImage, filterCategories } from '../lib/menu.js?v=20261028-gastro';
import { Modal } from './Modal.js?v=20261028-gastro';

export function RestaurantHeader({ restaurant }) {
  const banner = safeImage(restaurant.banner);
  return h('header', { className: 'hero', style: banner ? { backgroundImage: 'url(' + JSON.stringify(banner) + ')' } : {} },
    h('div', { className: 'hero-content' },
      h('div', { className: 'logo' }, h(Image, {
        src: restaurant.logo, eager: true,
        fallback: h('span', null, restaurant.nome.charAt(0))
      })),
      h('p', { className: 'eyebrow' }, restaurant.tema === 'escuro' ? 'Restaurante e Bar' : 'Cardápio digital'),
      h('h1', null, restaurant.nome),
      h('p', null, restaurant.subtitulo)
    ));
}

export function ProductCard({ item, onSelect }) {
  return h('article', { className: 'product-card' + (item.disponivel === false ? ' unavailable' : '') },
    h('div', { className: 'product-copy' },
      item.destaque && h('span', { className: 'badge' }, item.destaque),
      item.disponivel === false && h('span', { className: 'availability-label' }, 'Indisponível no momento'),
      h('h3', null, h('button', { className: 'product-title-button', onClick: () => onSelect(item), 'aria-haspopup': 'dialog' }, item.nome)),
      h('p', { className: 'description' }, item.descricao),
      item.porcao && h('p', { className: 'portion' }, item.porcao),
      item.restricoes?.length > 0 && h('ul', { className: 'diet-tags', 'aria-label': 'Informações alimentares' },
        item.restricoes.map(label => h('li', { key: label }, label))),
      h('p', { className: 'price' }, item.preco)),
    safeImage(item.imagem) && h('button', { className: 'product-photo-button', onClick: () => onSelect(item),
      'aria-label': 'Ampliar foto de ' + item.nome, 'aria-haspopup': 'dialog' }, h(Image, { src: item.imagem, alt: '', className: 'product-image',
        fallback: h('span', { className: 'photo-fallback' }, 'Ver detalhes') }))
  );
}

export function CategorySection({ category, prefix = '', onSelect }) {
  return h('section', { id: prefix + 'categoria-' + encodeURIComponent(category.id), className: 'category', 'aria-labelledby': 'titulo-' + category.id },
    h('h2', { id: 'titulo-' + category.id }, category.nome),
    category.itens.length
      ? h('ul', { className: 'product-list' }, category.itens.map(item =>
          h('li', { key: item.id }, h(ProductCard, { item, onSelect }))))
      : h('p', { className: 'empty' }, 'Novidades em breve.')
  );
}

export function Menu({ restaurant, preview }) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const searchId = useId();
  const categories = filterCategories(restaurant.categorias, query);
  const selected = restaurant.categorias.flatMap(category => category.itens).find(item => item.id === selectedId);
  useEffect(() => { if (selectedId && !selected) setSelectedId(null); }, [selectedId, selected]);
  return h('div', { className: 'customer-menu', 'data-theme': restaurant.tema || 'claro' },
    preview && h('div', { className: 'preview-bar' }, 'Prévia do gestor • alterações ainda não publicadas', h('a', { href: '#editor' }, 'Voltar à edição')),
    h('a', { className: 'skip-link', href: preview ? '#preview/produtos' : '#produtos' }, 'Ir para os produtos'),
    h(RestaurantHeader, { restaurant }),
    h('div', { className: 'menu-container menu-search' },
      h('label', { htmlFor: searchId }, 'O que você procura?'),
      h('div', { className: 'search-input-wrap' },
        h('input', { id: searchId, type: 'search', placeholder: 'Busque um prato, bebida ou ingrediente', value: query,
          onChange: event => setQuery(event.target.value) }),
        query && h('button', { type: 'button', onClick: () => setQuery(''), className: 'button secondary small' }, 'Limpar busca')),
      query && h('p', { className: 'muted', role: 'status' }, categories.reduce((sum, category) => sum + category.itens.length, 0) + ' produto(s) encontrado(s)')),
    categories.length > 0 && h('nav', { className: 'category-nav', 'aria-label': 'Categorias' },
      h('div', { className: 'menu-container nav-links' }, categories.map(category =>
        h('a', { key: category.id, href: '#' + (preview ? 'preview/' : '') + 'categoria-' + encodeURIComponent(category.id) }, category.nome)))),
    h('main', { id: preview ? 'preview/produtos' : 'produtos', className: 'menu-container menu-content' },
      categories.length
        ? categories.map(category => h(CategorySection, { key: category.id, category, prefix: preview ? 'preview/' : '', onSelect: item => setSelectedId(item.id) }))
        : h('p', { className: 'empty' }, query ? 'Nenhum produto encontrado. Tente outro termo ou limpe a busca.' : 'Nosso cardápio está sendo atualizado. Consulte nossa equipe.')),
    selected && h(Modal, { title: selected.nome, onClose: () => setSelectedId(null) },
      h('div', { className: 'product-detail form-stack' },
        h(Image, { src: selected.imagem, alt: selected.nome, className: 'detail-photo', eager: true }),
        selected.disponivel === false && h('p', { className: 'availability-label' }, 'Indisponível no momento'),
        selected.destaque && h('span', { className: 'badge' }, selected.destaque),
        h('p', { className: 'detail-description' }, selected.descricao),
        selected.porcao && h('p', { className: 'portion' }, selected.porcao),
        selected.restricoes?.length > 0 && h('div', null,
          h('ul', { className: 'diet-tags', 'aria-label': 'Informações alimentares' }, selected.restricoes.map(label => h('li', { key: label }, label))),
          h('p', { className: 'muted' }, 'Informações fornecidas pelo restaurante. Consulte a equipe sobre alergias e preparo.')),
        h('p', { className: 'price detail-price' }, selected.preco),
        h('button', { className: 'button secondary', onClick: () => setSelectedId(null) }, 'Voltar ao cardápio')))
  );
}
