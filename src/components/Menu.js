import { createElement as h } from 'react';
import { Image } from './Image.js?v=20261016-photos';
import { safeImage } from '../lib/menu.js?v=20261016-photos';

export function RestaurantHeader({ restaurant }) {
  const banner = safeImage(restaurant.banner);
  return h('header', { className: 'hero', style: banner ? { backgroundImage: 'url(' + JSON.stringify(banner) + ')' } : {} },
    h('div', { className: 'hero-content' },
      h('div', { className: 'logo' }, h(Image, {
        src: restaurant.logo, eager: true,
        fallback: h('span', null, restaurant.nome.charAt(0))
      })),
      h('p', { className: 'eyebrow' }, 'Cardápio digital'),
      h('h1', null, restaurant.nome),
      h('p', null, restaurant.subtitulo)
    ));
}

export function ProductCard({ item }) {
  return h('article', { className: 'product-card' },
    h('div', { className: 'product-copy' },
      item.destaque && h('span', { className: 'badge' }, item.destaque),
      h('h3', null, item.nome),
      h('p', { className: 'description' }, item.descricao),
      h('p', { className: 'price' }, item.preco)),
    h(Image, { src: item.imagem, alt: item.nome, className: 'product-image' })
  );
}

export function CategorySection({ category, prefix = '' }) {
  return h('section', { id: prefix + 'categoria-' + encodeURIComponent(category.id), className: 'category', 'aria-labelledby': 'titulo-' + category.id },
    h('h2', { id: 'titulo-' + category.id }, category.nome),
    category.itens.length
      ? h('ul', { className: 'product-list' }, category.itens.map(item =>
          h('li', { key: item.id }, h(ProductCard, { item }))))
      : h('p', { className: 'empty' }, 'Novidades em breve.')
  );
}

export function Menu({ restaurant, preview }) {
  return h('div', null,
    preview && h('div', { className: 'preview-bar' }, 'Prévia do gestor • alterações ainda não publicadas', h('a', { href: '#editor' }, 'Voltar à edição')),
    h('a', { className: 'skip-link', href: preview ? '#preview/produtos' : '#produtos' }, 'Ir para os produtos'),
    h(RestaurantHeader, { restaurant }),
    restaurant.categorias.length > 0 && h('nav', { className: 'category-nav', 'aria-label': 'Categorias' },
      h('div', { className: 'menu-container nav-links' }, restaurant.categorias.map(category =>
        h('a', { key: category.id, href: '#' + (preview ? 'preview/' : '') + 'categoria-' + encodeURIComponent(category.id) }, category.nome)))),
    h('main', { id: preview ? 'preview/produtos' : 'produtos', className: 'menu-container menu-content' },
      restaurant.categorias.length
        ? restaurant.categorias.map(category => h(CategorySection, { key: category.id, category, prefix: preview ? 'preview/' : '' }))
        : h('p', { className: 'empty' }, 'Nosso cardápio está sendo atualizado. Consulte nossa equipe.'))
  );
}
