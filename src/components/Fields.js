import { createElement as h, useId, useRef, useEffect, useState } from 'react';
import { safeImage } from '../lib/menu.js?v=20261016-photos';
import { cloudEnabled } from '../services/cloud.js?v=20261016-photos';
import { uploadMenuPhoto } from '../services/photos.js?v=20261016-photos';

export function Field({ label, hint, multiline = false, ...props }) {
  const id = useId();
  return h('div', { className: 'field' },
    h('label', { htmlFor: id }, label),
    h(multiline ? 'textarea' : 'input', { id, 'aria-describedby': hint ? id + '-hint' : undefined, ...props }),
    hint && h('small', { id: id + '-hint' }, hint));
}

export function ImageField({ label, value, onChange, onBusyChange = () => {}, uploader = uploadMenuPhoto }) {
  const [result, setResult] = useState({ path: '', loaded: false, failed: false });
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [sent, setSent] = useState(false);
  const picker = useRef(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const path = safeImage(value);
  const current = result.path === path ? result : null;

  async function selectPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || busy) return;
    setBusy(true); onBusyChange(true); setUploadError(''); setSent(false);
    try {
      const url = await uploader(file);
      if (alive.current) { onChange(url); setSent(true); }
    } catch (error) {
      if (alive.current) setUploadError(error.message || 'Não foi possível enviar a foto. Tente novamente.');
    } finally {
      if (alive.current) { setBusy(false); onBusyChange(false); }
    }
  }

  return h('div', { className: 'photo-field', 'aria-busy': busy },
    h('span', { className: 'photo-label' }, label),
    h('input', { ref: picker, type: 'file', accept: 'image/jpeg,image/png,image/webp',
      hidden: true, 'aria-label': 'Selecionar arquivo para ' + label, onChange: selectPhoto }),
    h('div', { className: 'photo-upload-actions' },
      h('button', { type: 'button', className: 'button secondary', disabled: busy || !cloudEnabled,
        onClick: () => picker.current.click() }, busy ? 'Enviando foto…' : value ? 'Trocar foto' : 'Enviar foto'),
      value && h('button', { type: 'button', className: 'button text-button', disabled: busy,
        onClick: () => { onChange(''); setUploadError(''); setSent(false); } }, 'Remover foto')),
    h('p', { className: 'muted photo-note' }, cloudEnabled
      ? 'Escolha uma foto do computador ou celular. JPEG, PNG ou WebP, até 10 MB. Nós ajustamos o tamanho para o cardápio.'
      : 'O envio de fotos fica disponível no painel online.'),
    busy && h('p', { role: 'status', className: 'muted' }, 'Preparando e enviando a foto. Aguarde antes de salvar.'),
    uploadError && h('p', { role: 'alert', className: 'error' }, uploadError),
    sent && !busy && h('p', { role: 'status', className: 'muted' }, 'Foto enviada! Salve as alterações e publique o cardápio para exibi-la aos clientes.'),
    h('details', { className: 'photo-help' },
      h('summary', null, 'Ou usar um link de imagem'),
      h(Field, { label: 'Link da imagem', value, disabled: busy,
        onChange: event => { onChange(event.target.value); setUploadError(''); setSent(false); },
        placeholder: 'https://seu-site.com/fotos/hamburguer.jpg', maxLength: 1000000,
        autoCapitalize: 'none', spellCheck: false,
        hint: 'Cole um endereço público direto da foto, acessível sem login. Não use links de páginas ou de arquivos do computador.' })),
    value && !path && h('p', { role: 'status', className: 'error' }, 'Confira o endereço da foto.'),
    path && h('div', { className: 'photo-preview-box' },
      h('img', { key: path, src: path, alt: 'Prévia de ' + label,
        className: 'photo-preview', hidden: !current?.loaded,
        onLoad: () => setResult({ path, loaded: true, failed: false }),
        onError: () => setResult({ path, loaded: false, failed: true }) }),
      h('p', { role: 'status', className: current?.failed ? 'error' : 'muted' },
        current?.failed ? 'Não foi possível abrir a foto. Tente enviar novamente ou confira o link.'
          : current?.loaded ? 'Foto carregada. Ela aparecerá no cardápio após a publicação.' : 'Conferindo a foto…'))
  );
}

export function Modal({ title, children, onClose }) {
  const dialog = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current.showModal();
    return () => { previous?.focus(); };
  }, []);
  return h('dialog', { ref: dialog, className: 'modal', 'aria-labelledby': titleId, onCancel: onClose },
    h('div', { className: 'modal-heading' }, h('h2', { id: titleId }, title),
      h('button', { type: 'button', className: 'icon-button', 'aria-label': 'Fechar formulário', onClick: onClose }, '×')),
    children);
}
