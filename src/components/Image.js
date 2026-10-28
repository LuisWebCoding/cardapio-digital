import { createElement as h, useState } from 'react';
import { safeImage } from '../lib/menu.js?v=20261028-gastro';

export function Image({ src, alt = '', className = '', fallback = null, eager = false }) {
  const [failed, setFailed] = useState('');
  const path = safeImage(src);
  if (!path || failed === path) return fallback;
  return h('img', {
    src: path, alt, className, loading: eager ? 'eager' : 'lazy',
    decoding: 'async', onError: () => setFailed(path)
  });
}
