import { createElement as h, useState } from 'react';
import { Field } from './Fields.js?v=20261028-gastro';
import { createMenuQr } from '../lib/qr.js?v=20261028-gastro';
import { download } from '../lib/menu.js?v=20261028-gastro';

export function DeliveryTools({ restaurantName }) {
  const [url, setUrl] = useState(() => new URL('index.html', location.href).href);
  let qr = null;
  let error = '';
  try { qr = createMenuQr(url); } catch (failure) { error = failure.message; }
  return h('section', { className: 'panel form-stack' },
    h('div', null, h('h2', null, 'QR Code e primeiros passos'),
      h('p', { className: 'muted' }, 'O QR Code aponta apenas para o cardápio do cliente.')),
    h(Field, { label: 'Endereço público do cardápio', type: 'url', value: url, maxLength: 1000,
      autoCapitalize: 'none', spellCheck: false, onChange: event => setUrl(event.target.value),
      hint: 'Use o link HTTPS que seus clientes devem abrir no celular.' }),
    error && h('p', { className: 'muted', role: 'status' }, error),
    qr && h('div', { className: 'qr-preview' },
      h('img', { alt: 'QR Code do cardápio de ' + restaurantName,
        src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(qr.svg), width: 240, height: 240 }),
      h('button', { type: 'button', className: 'button primary',
        onClick: () => download('qr-code-cardapio.svg', qr.svg, 'image/svg+xml') }, 'Baixar QR Code para impressão'),
      h('a', { className: 'text-link', href: qr.url, target: '_blank', rel: 'noopener noreferrer' }, 'Conferir endereço do cliente')),
    h('div', { className: 'first-steps' }, h('h3', null, 'Seu primeiro cardápio publicado'),
      h('ol', null,
        h('li', null, 'Em Restaurante, personalize nome, logo, banner e cor.'),
        h('li', null, 'Crie as categorias e cadastre seus produtos com preços e fotos.'),
        h('li', null, 'Use Organizar ordem e Pausar para ajustar o que será exibido.'),
        h('li', null, 'Confira Ver prévia e clique em Publicar cardápio.'),
        h('li', null, 'Abra o endereço do cliente em outro aparelho e confira as informações.'),
        h('li', null, 'Baixe o QR Code, leia-o com o celular e só então imprima para as mesas.')),
      h('p', { className: 'muted' }, 'Para atualizar depois, edite, salve e publique. O endereço do cardápio continua o mesmo e o QR Code não precisa ser trocado.')));
}
