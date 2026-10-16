import { createElement as h, useEffect, useState } from 'react';
import { Admin } from './components/Admin.js?v=20261016-qa1';
import { Menu } from './components/Menu.js?v=20261016-photos';
import { CloudManager } from './components/CloudManager.js?v=20261016-photos';
import { cloudEnabled } from './services/cloud.js?v=20261016-photos';
import { useMenu } from './hooks/useMenu.js?v=20261016-photos';
import { useBrand } from './hooks/useBrand.js?v=20261016-photos';
import { validateMenu } from './lib/menu.js?v=20261016-photos';

const localPublished = validateMenu(RESTAURANTE);
const isPreview = () => location.hash === '#preview' || location.hash.startsWith('#preview/');

function Editor({ published, namespace = '', publication = null }) {
  const state = useMenu(published, namespace);
  const [preview, setPreview] = useState(isPreview);
  useEffect(() => {
    const navigate = () => setPreview(isPreview());
    addEventListener('hashchange', navigate);
    return () => removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [preview]);
  const style = useBrand(state.menu, preview ? 'Prévia do gestor' : 'Painel do restaurante');
  return h('div', { style }, preview
    ? h(Menu, { restaurant: state.menu, preview: true })
    : h(Admin, { ...state, published, publication }));
}

export function AdminApp() {
  if (cloudEnabled) return h(CloudManager, null, settings => h(Editor, settings));
  return h('div', null,
    h('div', { className: 'cloud-feedback' }, 'Demonstração local • integração online ainda não ativada.'),
    h(Editor, { published: localPublished }));
}
