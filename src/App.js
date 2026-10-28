import { createElement as h } from 'react';
import { Menu } from './components/Menu.js?v=20261028-gastro';
import { validateMenu } from './lib/menu.js?v=20261028-gastro';
import { useBrand } from './hooks/useBrand.js?v=20261028-gastro';
import { usePublishedMenu } from './hooks/usePublishedMenu.js?v=20261028-gastro';

const fallback = validateMenu(RESTAURANTE);

export function App() {
  const { menu, loading, error } = usePublishedMenu(fallback);
  const style = useBrand(menu || fallback);
  return h('div', { style },
    loading && h('p', { className: 'loading', role: 'status' }, 'Carregando cardápio…'),
    error && h('p', { className: 'cloud-feedback', role: 'status' }, error),
    menu && h(Menu, { restaurant: menu }));
}
