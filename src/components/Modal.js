import { createElement as h, useEffect, useId, useRef } from 'react';

export function Modal({ title, children, onClose }) {
  const dialog = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current.showModal();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  return h('dialog', { ref: dialog, className: 'modal', 'aria-labelledby': titleId, onCancel: onClose },
    h('div', { className: 'modal-heading' }, h('h2', { id: titleId }, title),
      h('button', { type: 'button', className: 'icon-button', 'aria-label': 'Fechar janela', onClick: onClose }, '×')),
    children);
}
